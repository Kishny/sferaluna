// src/lib/insights/service.ts

import { DailyInsight, DailyInsightDay, type IDailyInsight } from "@/models/DailyInsight";
import { chooseInsight, parisDayKey } from "@/lib/insights/select";

export interface PublicInsight {
  id: string;
  category: IDailyInsight["category"];
  title: string;
  text: string;
}

export interface InsightOfDay {
  day: string;
  insight: PublicInsight;
}

type LeanInsight = Pick<IDailyInsight, "category" | "title" | "text"> & { _id: { toString(): string } };

/** Ce que voient les membres : jamais la source ni les champs d'administration. */
function toPublic(doc: LeanInsight): PublicInsight {
  return { id: doc._id.toString(), category: doc.category, title: doc.title, text: doc.text };
}

/**
 * La connaissance d'un jour donné. Si rien n'a encore été montré ce jour-là,
 * on choisit, on enregistre, et le choix ne change plus.
 * Renvoie null tant qu'aucune connaissance active n'existe.
 */
export async function getInsightForDay(day: string = parisDayKey()): Promise<InsightOfDay | null> {
  const recorded = await DailyInsightDay.findOne({ day }).lean();
  if (recorded) {
    const doc = await DailyInsight.findById(recorded.insightId).select("category title text").lean();
    if (doc) return { day, insight: toPublic(doc) };
    // La connaissance a été supprimée depuis : on en choisit une autre pour ce jour.
    await DailyInsightDay.deleteOne({ _id: recorded._id });
  }

  const [insights, lastShown] = await Promise.all([
    DailyInsight.find({ active: true }).select("createdAt publishOn").lean(),
    DailyInsightDay.aggregate<{ _id: unknown; day: string }>([
      { $group: { _id: "$insightId", day: { $max: "$day" } } },
    ]),
  ]);
  const lastShownById = new Map(lastShown.map((row) => [String(row._id), row.day]));

  const chosenId = chooseInsight(
    insights.map((doc) => ({
      id: doc._id.toString(),
      createdAt: doc.createdAt,
      publishOn: doc.publishOn,
      lastShownDay: lastShownById.get(doc._id.toString()) ?? null,
    })),
    day
  );
  if (!chosenId) return null;

  // Deux demandes simultanées peuvent choisir en même temps : la première
  // enregistrée l'emporte (index unique sur le jour), l'autre relit son choix.
  await DailyInsightDay.updateOne({ day }, { $setOnInsert: { day, insightId: chosenId } }, { upsert: true }).catch(
    (error: { code?: number }) => {
      if (error?.code !== 11000) throw error;
    }
  );
  const final = await DailyInsightDay.findOne({ day }).lean();
  const doc = await DailyInsight.findById(final?.insightId ?? chosenId).select("category title text").lean();
  return doc ? { day, insight: toPublic(doc) } : null;
}

/** Les connaissances des jours précédents, de la plus récente à la plus ancienne. */
export async function getPreviousInsights(before: string, limit = 14): Promise<InsightOfDay[]> {
  const days = await DailyInsightDay.find({ day: { $lt: before } }).sort({ day: -1 }).limit(limit).lean();
  if (days.length === 0) return [];

  const docs = await DailyInsight.find({ _id: { $in: days.map((d) => d.insightId) } })
    .select("category title text")
    .lean();
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]));

  return days.flatMap((d) => {
    const doc = byId.get(d.insightId.toString());
    return doc ? [{ day: d.day, insight: toPublic(doc) }] : [];
  });
}
