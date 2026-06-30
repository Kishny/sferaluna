// src/app/api/cron/morning-digest/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { sendMorningDigestPush } from "@/lib/push";

/**
 * GET /api/cron/morning-digest
 *
 * Tâche planifiée (Vercel Cron — voir vercel.json à la racine) qui notifie
 * chaque matin les utilisatrices (free + premium) du nombre de nouveaux
 * profils compatibles inscrits depuis le dernier passage du cron (fenêtre
 * glissante de 24h). Objectif : rétention — donner une raison concrète de
 * rouvrir l'app aux utilisatrices qui ne se connectent pas tous les jours.
 *
 * Pas de champ anti-doublon nécessaire : contrairement à match-reminders
 * (fenêtre 24h-72h qui se recoupe d'une exécution à l'autre), ce cron tourne
 * une fois par jour à heure fixe (voir schedule dans vercel.json) sur une
 * fenêtre de 24h qui ne se chevauche jamais avec la précédente — chaque
 * profil n'est donc compté qu'une seule fois, dans le digest du lendemain
 * de son inscription. Si une exécution est manquée, ces profils ne seront
 * simplement pas inclus dans un digest — acceptable pour une fonctionnalité
 * non critique.
 *
 * Compatibilité = mêmes règles de visibilité que /api/profiles (Explorer) :
 * - "public" : visible par toutes les destinataires ;
 * - "premium" : visible seulement par les destinataires premium actives ;
 * - "matches" / "invisible" : jamais comptés (jamais dans Explorer).
 * Le modèle User n'a pas de préférences de matching persistées (âge,
 * orientation, localisation) au-delà des filtres ponctuels envoyés par le
 * client à /api/profiles — on ne peut donc pas affiner davantage ici.
 * Les profils déjà likés par la destinataire sont exclus (déjà vus/traités).
 *
 * Seuil d'envoi : au moins 1 nouveau profil compatible (MIN_NEW_PROFILES_TO_NOTIFY).
 *
 * Sécurité : protégée par CRON_SECRET (même pattern que match-reminders).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const DIGEST_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const MIN_NEW_PROFILES_TO_NOTIFY = 1;
const RECIPIENT_BATCH_LIMIT = 5000; // sécurité, évite un run trop long si le volume explose

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;

  // Si aucun secret n'est configuré, on refuse par défaut — mieux vaut un
  // cron qui ne tourne pas qu'une route ouverte à tout le monde en prod.
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    const since = new Date(Date.now() - DIGEST_WINDOW_MS);

    const newProfiles = await User.find({
      createdAt: { $gte: since },
      hasCompletedProfile: true,
      consentement: true,
      banned: { $ne: true },
      role: { $ne: "admin" },
      visibilite: { $in: ["public", "premium"] },
    })
      .select("_id visibilite")
      .lean();

    if (newProfiles.length === 0) {
      return NextResponse.json(
        { success: true, newProfiles: 0, notified: 0 },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const newProfileIds = newProfiles.map((p) => p._id);

    const recipients = await User.find({
      expoPushToken: { $exists: true, $ne: null },
      hasCompletedProfile: true,
      consentement: true,
      banned: { $ne: true },
    })
      .select("_id isPremium subscriptionStatus")
      .limit(RECIPIENT_BATCH_LIMIT)
      .lean();

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: true, newProfiles: newProfiles.length, notified: 0 },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const recipientIds = recipients.map((r) => r._id);

    // Likes déjà envoyés par les destinataires vers l'un des nouveaux profils
    // — à exclure du compte (déjà vu/traité dans Explorer).
    const existingLikes = await Like.find({
      fromUserId: { $in: recipientIds },
      toUserId: { $in: newProfileIds },
    })
      .select("fromUserId toUserId")
      .lean();

    const likedByRecipient = new Map<string, Set<string>>();
    for (const like of existingLikes) {
      const fromId = (like.fromUserId as mongoose.Types.ObjectId).toString();
      if (!likedByRecipient.has(fromId)) likedByRecipient.set(fromId, new Set());
      likedByRecipient.get(fromId)!.add((like.toUserId as mongoose.Types.ObjectId).toString());
    }

    let notified = 0;
    let failed = 0;

    const results = await Promise.allSettled(
      recipients.map(async (recipient) => {
        const recipientId = (recipient._id as mongoose.Types.ObjectId).toString();
        const isPremiumActive =
          recipient.isPremium === true &&
          (recipient.subscriptionStatus === "active" ||
            recipient.subscriptionStatus === "trialing");

        const alreadyLiked = likedByRecipient.get(recipientId);

        let compatible = 0;
        for (const profile of newProfiles) {
          const profileId = (profile._id as mongoose.Types.ObjectId).toString();
          if (profileId === recipientId) continue;
          if (alreadyLiked?.has(profileId)) continue;
          if (profile.visibilite === "public") {
            compatible += 1;
          } else if (profile.visibilite === "premium" && isPremiumActive) {
            compatible += 1;
          }
        }

        if (compatible < MIN_NEW_PROFILES_TO_NOTIFY) return;

        await sendMorningDigestPush({
          recipientUserId: recipientId,
          newProfilesCount: compatible,
        });
        notified += 1;
      })
    );

    failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json(
      {
        success: true,
        newProfiles: newProfiles.length,
        recipientsConsidered: recipients.length,
        notified,
        failed,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/cron/morning-digest :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors du traitement du digest.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
