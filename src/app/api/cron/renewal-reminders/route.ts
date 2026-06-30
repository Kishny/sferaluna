// src/app/api/cron/renewal-reminders/route.ts

import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendRenewalReminderEmail } from "@/lib/emails";

/**
 * GET /api/cron/renewal-reminders
 *
 * Tâche planifiée (Vercel Cron — voir vercel.json) qui envoie un email de
 * rappel ~3 jours avant le renouvellement automatique de l'abonnement.
 *
 * Cible : abonnements réellement actifs, NON résiliés et NON en pause, dont
 * la date d'expiration (premiumExpiresAt) tombe dans une fenêtre de J-2 à J-4.
 * La fenêtre de 2 jours absorbe une éventuelle exécution manquée.
 *
 * Anti-doublon : on n'envoie pas si un rappel a déjà été envoyé dans les
 * 20 derniers jours (les cycles sont mensuels), grâce à renewalReminderSentAt.
 *
 * Sécurité : protégée par CRON_SECRET (même pattern que les autres crons).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

const PLAN_LABELS: Record<string, string> = {
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

const BATCH_LIMIT = 5000;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    await connectDB();

    const now = Date.now();
    const windowStart = new Date(now + 2 * 24 * 60 * 60 * 1000); // J-2
    const windowEnd = new Date(now + 4 * 24 * 60 * 60 * 1000); // J-4
    const reminderCutoff = new Date(now - 20 * 24 * 60 * 60 * 1000);

    const candidates = await User.find({
      isPremium: true,
      subscriptionStatus: { $in: ["active", "trialing"] },
      subscriptionCancelAtPeriodEnd: { $ne: true },
      subscriptionPaused: { $ne: true },
      premiumExpiresAt: { $gte: windowStart, $lte: windowEnd },
      $or: [
        { renewalReminderSentAt: null },
        { renewalReminderSentAt: { $lt: reminderCutoff } },
      ],
    })
      .select("email pseudonyme plan premiumExpiresAt")
      .limit(BATCH_LIMIT);

    let sent = 0;

    for (const user of candidates) {
      if (!user.email) continue;

      try {
        await sendRenewalReminderEmail(
          user.email,
          user.pseudonyme || "membre Luna",
          PLAN_LABELS[user.plan as string] || "Premium",
          user.premiumExpiresAt ?? null
        );

        await User.findByIdAndUpdate(user._id, {
          $set: { renewalReminderSentAt: new Date() },
        });

        sent += 1;
      } catch (mailErr) {
        console.warn("Rappel renouvellement échoué :", {
          userId: String(user._id),
          error: mailErr,
        });
      }
    }

    return NextResponse.json({
      success: true,
      candidates: candidates.length,
      sent,
    });
  } catch (error) {
    console.error("[cron renewal-reminders]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
