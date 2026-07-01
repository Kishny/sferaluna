// src/app/api/cron/reengagement/route.ts
//
// Relances email : membres inactifs, paiements en échec (dunning) et
// abonnements résiliés (win-back).
//
// SÉCURITÉ : route protégée par un secret. Aucun envoi n'a lieu sans appel
// authentifié. Rien n'est planifié automatiquement tant que tu n'ajoutes pas
// un cron (ex : Vercel Cron) pointant vers cette URL.
//
// Auth :
//   Authorization: Bearer <CRON_SECRET>   (ex : header Vercel Cron)
//   ou  ?secret=<CRON_SECRET>
//
// Query :
//   ?type=inactive|dunning|winback|all   (défaut : all)
//   ?dry=1                                (simulation : compte sans envoyer)
//   ?limit=100                            (plafond par catégorie, max 500)
//
// Anti-doublon : chaque membre relancé n'est pas re-sollicité avant
// REENGAGEMENT_GUARD_DAYS jours (champ User.reengagementSentAt).

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  sendReengagementEmail,
  sendDunningEmail,
  sendWinbackEmail,
} from "@/lib/emails";

export const runtime = "nodejs";

const DAY = 24 * 60 * 60 * 1000;
const INACTIVE_AFTER_DAYS = 30;
const REENGAGEMENT_GUARD_DAYS = 14;

type Bucket = "inactive" | "dunning" | "winback";

interface Candidate {
  _id: mongoose.Types.ObjectId;
  email: string;
  pseudonyme?: string;
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = req.headers.get("authorization");
  if (header === `Bearer ${secret}`) return true;

  const url = new URL(req.url);
  return url.searchParams.get("secret") === secret;
}

export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET non configuré." },
      { status: 500 }
    );
  }

  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: "Non autorisé." },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const type = (url.searchParams.get("type") ?? "all") as Bucket | "all";
  const dry = url.searchParams.get("dry") === "1";
  const limit = Math.min(
    Math.max(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 1),
    500
  );

  try {
    await connectDB();

    const now = Date.now();
    const inactiveThreshold = new Date(now - INACTIVE_AFTER_DAYS * DAY);
    const guardDate = new Date(now - REENGAGEMENT_GUARD_DAYS * DAY);

    // Ne pas re-solliciter un membre déjà relancé récemment.
    const guard = {
      $or: [
        { reengagementSentAt: null },
        { reengagementSentAt: { $lt: guardDate } },
      ],
    };

    const buckets: Record<Bucket, Record<string, unknown>> = {
      inactive: {
        emailVerified: true,
        hasCompletedProfile: true,
        banned: { $ne: true },
        subscriptionStatus: { $nin: ["past_due", "canceled"] },
        lastLoginAt: { $lt: inactiveThreshold },
        ...guard,
      },
      dunning: {
        emailVerified: true,
        banned: { $ne: true },
        subscriptionStatus: "past_due",
        ...guard,
      },
      winback: {
        emailVerified: true,
        banned: { $ne: true },
        subscriptionStatus: "canceled",
        ...guard,
      },
    };

    const senders: Record<Bucket, (to: string, name: string) => Promise<void>> =
      {
        inactive: sendReengagementEmail,
        dunning: sendDunningEmail,
        winback: sendWinbackEmail,
      };

    const toRun: Bucket[] =
      type === "all" ? ["inactive", "dunning", "winback"] : [type];

    const report: Record<string, { candidates: number; sent: number; errors: number }> =
      {};

    for (const bucket of toRun) {
      const candidates = (await User.find(buckets[bucket])
        .select("_id email pseudonyme")
        .limit(limit)
        .lean()) as unknown as Candidate[];

      let sent = 0;
      let errors = 0;

      if (!dry) {
        await Promise.all(
          candidates.map(async (u) => {
            try {
              await senders[bucket](u.email, u.pseudonyme || "membre Luna");
              await User.updateOne(
                { _id: u._id },
                { $set: { reengagementSentAt: new Date() } }
              );
              sent += 1;
            } catch (err) {
              errors += 1;
              console.warn(`Relance ${bucket} échouée pour ${u.email} :`, err);
            }
          })
        );
      }

      report[bucket] = { candidates: candidates.length, sent, errors };
    }

    return NextResponse.json({
      success: true,
      dryRun: dry,
      limit,
      report,
    });
  } catch (error) {
    console.error("Erreur GET /api/cron/reengagement :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
