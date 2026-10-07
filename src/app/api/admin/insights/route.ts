// src/app/api/admin/insights/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getAdmin } from "@/lib/admin-auth";
import { parisDayKey } from "@/lib/insights/select";
import { STARTER_INSIGHTS } from "@/lib/insights/starter";
import { insightInputSchema } from "@/lib/insights/validation";
import { DailyInsight, DailyInsightDay } from "@/models/DailyInsight";

export const dynamic = "force-dynamic";

const denied = () => NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });

/**
 * GET /api/admin/insights
 *
 * Toutes les connaissances, avec le dernier jour où chacune a été montrée,
 * celle du jour, et le nombre d'entrées de la série de départ pas encore
 * importées.
 */
export async function GET() {
  try {
    if (!(await getAdmin())) return denied();

    const today = parisDayKey();
    const [insights, shown, todayRow] = await Promise.all([
      DailyInsight.find().sort({ createdAt: 1, _id: 1 }).lean(),
      DailyInsightDay.aggregate<{ _id: unknown; day: string; times: number }>([
        { $group: { _id: "$insightId", day: { $max: "$day" }, times: { $sum: 1 } } },
      ]),
      DailyInsightDay.findOne({ day: today }).lean(),
    ]);
    const shownById = new Map(shown.map((row) => [String(row._id), row]));
    const slugs = new Set(insights.map((doc) => doc.slug).filter(Boolean));

    return NextResponse.json({
      success: true,
      today,
      todayInsightId: todayRow ? String(todayRow.insightId) : null,
      starterRemaining: STARTER_INSIGHTS.filter((item) => !slugs.has(item.slug)).length,
      insights: insights.map((doc) => ({
        id: doc._id.toString(),
        category: doc.category,
        title: doc.title,
        text: doc.text,
        source: doc.source ?? "",
        active: doc.active !== false,
        publishOn: doc.publishOn ?? null,
        fromStarter: Boolean(doc.slug),
        lastShownDay: shownById.get(doc._id.toString())?.day ?? null,
        timesShown: shownById.get(doc._id.toString())?.times ?? 0,
      })),
    });
  } catch (error) {
    console.error("Erreur GET /api/admin/insights :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/admin/insights — ajoute une connaissance. */
export async function POST(request: NextRequest) {
  try {
    if (!(await getAdmin())) return denied();

    const parsed = insightInputSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    const created = await DailyInsight.create(parsed.data);
    return NextResponse.json({ success: true, id: created._id.toString() }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/admin/insights :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
