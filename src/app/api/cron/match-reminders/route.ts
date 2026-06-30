// src/app/api/cron/match-reminders/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { Match } from "@/models/Match";
import { User } from "@/models/User";
import { sendMatchReminderPush } from "@/lib/push";

/**
 * GET /api/cron/match-reminders
 *
 * Tâche planifiée (Vercel Cron — voir vercel.json à la racine) qui relance
 * les deux utilisatrices d'un match actif si, 24h après sa création,
 * aucune des deux n'a encore envoyé de message.
 *
 * Pourquoi lastMessageAt === null suffit :
 * Match.lastMessageAt est mis à jour dès qu'UN message est envoyé, quel
 * qu'en soit l'auteur (voir POST /api/messages/[matchId]). Donc
 * lastMessageAt === null signifie strictement "ni l'une ni l'autre n'a
 * encore écrit" — c'est exactement le cas qu'on veut relancer.
 *
 * Fenêtre de relance : matches créés entre 24h et 72h avant maintenant.
 * - borne basse (24h) : laisser une chance naturelle de démarrer seule ;
 * - borne haute (72h) : au-delà, le match est probablement mort, inutile
 *   de continuer à interroger ces lignes indéfiniment à chaque exécution.
 *
 * Anti-doublon : firstMessageReminderSentAt (sur Match) garantit qu'un
 * même match ne déclenche qu'une seule relance, même si le cron tourne
 * plusieurs fois dans la fenêtre.
 *
 * Sécurité : protégée par CRON_SECRET. Vercel Cron envoie automatiquement
 * `Authorization: Bearer ${CRON_SECRET}` quand la variable d'env est définie
 * sur le projet — voir doc Vercel "Securing cron jobs".
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const REMINDER_MIN_AGE_MS = 24 * 60 * 60 * 1000; // 24h
const REMINDER_MAX_AGE_MS = 72 * 60 * 60 * 1000; // 72h
const BATCH_LIMIT = 200; // sécurité, évite un run trop long si jamais le volume explose

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

    const now = Date.now();
    const minCreatedAt = new Date(now - REMINDER_MAX_AGE_MS); // pas plus vieux que 72h
    const maxCreatedAt = new Date(now - REMINDER_MIN_AGE_MS); // pas plus récent que 24h

    const matches = await Match.find({
      isActive: true,
      lastMessageAt: null,
      firstMessageReminderSentAt: null,
      createdAt: { $gte: minCreatedAt, $lte: maxCreatedAt },
    })
      .select("_id user1Id user2Id")
      .limit(BATCH_LIMIT)
      .lean();

    if (matches.length === 0) {
      return NextResponse.json(
        { success: true, processed: 0, sent: 0 },
        { status: 200, headers: { "Cache-Control": "no-store" } }
      );
    }

    const userIds = Array.from(
      new Set(
        matches.flatMap((m) => [m.user1Id.toString(), m.user2Id.toString()])
      )
    );

    const users = await User.find({ _id: { $in: userIds } })
      .select("_id pseudonyme")
      .lean();

    const pseudonymeById = new Map(
      users.map((u: any) => [u._id.toString(), u.pseudonyme as string | undefined])
    );

    let sent = 0;

    for (const match of matches) {
      const matchId = (match._id as mongoose.Types.ObjectId).toString();
      const user1Id = match.user1Id.toString();
      const user2Id = match.user2Id.toString();

      const user1Name = pseudonymeById.get(user1Id) ?? "Quelqu'un";
      const user2Name = pseudonymeById.get(user2Id) ?? "Quelqu'un";

      // Échec silencieux par destinataire : un push raté pour l'une ne doit
      // pas empêcher l'envoi à l'autre, ni casser le marquage anti-doublon.
      const results = await Promise.allSettled([
        sendMatchReminderPush({ recipientUserId: user1Id, matchedWithName: user2Name, matchId }),
        sendMatchReminderPush({ recipientUserId: user2Id, matchedWithName: user1Name, matchId }),
      ]);

      sent += results.filter((r) => r.status === "fulfilled").length;

      // On marque comme relancé même si les deux pushs ont échoué (ex : aucun
      // token enregistré) — on ne veut pas réessayer indéfiniment le même
      // match à chaque exécution du cron jusqu'à la borne des 72h.
      await Match.updateOne(
        { _id: match._id },
        { $set: { firstMessageReminderSentAt: new Date() } }
      );
    }

    return NextResponse.json(
      { success: true, processed: matches.length, sent },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/cron/match-reminders :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors du traitement des relances.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
