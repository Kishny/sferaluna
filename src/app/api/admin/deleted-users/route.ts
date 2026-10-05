// src/app/api/admin/deleted-users/route.ts

import { NextResponse } from "next/server";

import { getAdmin } from "@/lib/admin-auth";
import { listTrash, purgeExpiredAccounts } from "@/lib/account-trash";
import { RETENTION_DAYS } from "@/models/DeletedAccount";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/deleted-users
 *
 * Corbeille : comptes supprimés par un admin, restaurables pendant
 * RETENTION_DAYS jours. Les comptes arrivés à échéance sont effacés au
 * passage, au cas où la tâche planifiée quotidienne n'aurait pas tourné.
 */
export async function GET() {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });

    await purgeExpiredAccounts();

    return NextResponse.json({ success: true, retentionDays: RETENTION_DAYS, accounts: await listTrash() });
  } catch (error) {
    console.error("Erreur GET /api/admin/deleted-users :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
