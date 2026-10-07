// src/app/api/admin/insights/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import { getAdmin } from "@/lib/admin-auth";
import { insightInputSchema } from "@/lib/insights/validation";
import { DailyInsight, DailyInsightDay } from "@/models/DailyInsight";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const denied = () => NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
const notFound = () => NextResponse.json({ success: false, error: "Connaissance introuvable." }, { status: 404 });

/** PATCH /api/admin/insights/[id] — corrige une connaissance (tous les champs sont renvoyés). */
export async function PATCH(request: NextRequest, { params }: Context) {
  try {
    if (!(await getAdmin())) return denied();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

    const parsed = insightInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const updated = await DailyInsight.findByIdAndUpdate(id, { $set: parsed.data }, { returnDocument: "after" });
    if (!updated) return notFound();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur PATCH /api/admin/insights/[id] :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/insights/[id] — supprime une connaissance et la retire de
 * l'historique des jours. Si c'était celle du jour, une autre sera choisie à
 * la prochaine demande.
 */
export async function DELETE(_request: NextRequest, { params }: Context) {
  try {
    if (!(await getAdmin())) return denied();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) return notFound();

    const deleted = await DailyInsight.findByIdAndDelete(id);
    if (!deleted) return notFound();
    await DailyInsightDay.deleteMany({ insightId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/insights/[id] :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
