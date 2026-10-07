// src/app/api/admin/insights/import-starter/route.ts

import { NextResponse } from "next/server";

import { getAdmin } from "@/lib/admin-auth";
import { STARTER_INSIGHTS } from "@/lib/insights/starter";
import { DailyInsight } from "@/models/DailyInsight";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/insights/import-starter
 *
 * Ajoute la série de départ. Sans risque à relancer : une entrée déjà
 * présente (même identifiant) n'est ni dupliquée ni écrasée, donc les
 * corrections faites dans l'administration sont conservées.
 */
export async function POST() {
  try {
    if (!(await getAdmin())) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });

    const existing = new Set(
      (await DailyInsight.find({ slug: { $in: STARTER_INSIGHTS.map((item) => item.slug) } }).select("slug").lean()).map(
        (doc) => doc.slug
      )
    );
    const missing = STARTER_INSIGHTS.filter((item) => !existing.has(item.slug));

    // Une à une, à une milliseconde d'écart : l'ordre de la série est celui de
    // la date de création, qui décide de l'ordre de passage.
    const base = Date.now();
    let added = 0;
    for (const [index, item] of missing.entries()) {
      const stamp = new Date(base + index);
      const result = await DailyInsight.updateOne(
        { slug: item.slug },
        { $setOnInsert: { ...item, active: true, publishOn: null, createdAt: stamp, updatedAt: stamp } },
        { upsert: true, timestamps: false }
      );
      if (result.upsertedCount > 0) added += 1;
    }

    return NextResponse.json({ success: true, added, total: STARTER_INSIGHTS.length });
  } catch (error) {
    console.error("Erreur POST /api/admin/insights/import-starter :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
