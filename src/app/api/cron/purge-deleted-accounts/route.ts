// src/app/api/cron/purge-deleted-accounts/route.ts

import { NextRequest, NextResponse } from "next/server";

import { purgeExpiredAccounts } from "@/lib/account-trash";
import { connectDB } from "@/lib/db";

/**
 * GET /api/cron/purge-deleted-accounts
 *
 * Tâche quotidienne (vercel.json) : efface définitivement les comptes restés
 * plus de RETENTION_DAYS jours dans la corbeille admin.
 *
 * Sécurité : protégée par CRON_SECRET (même pattern que les autres crons).
 */

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
  }

  try {
    await connectDB();
    const purged = await purgeExpiredAccounts();
    return NextResponse.json({ success: true, purged });
  } catch (error) {
    console.error("Erreur cron purge-deleted-accounts :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
