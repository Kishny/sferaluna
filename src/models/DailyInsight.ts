// src/models/DailyInsight.ts

/**
 * La connaissance du jour.
 *
 * - DailyInsight : une connaissance (un mot rare, une femme pionnière, un fait
 *   sur le monde ou sur l'amour), rédigée et vérifiée par l'équipe depuis
 *   l'administration.
 * - DailyInsightDay : ce qui a été montré tel jour. On l'enregistre à la
 *   première demande de la journée, pour que toutes les membres voient la même
 *   connaissance et que l'historique ne bouge plus quand on ajoute du contenu.
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const INSIGHT_CATEGORIES = ["mot", "sentiment", "femme", "monde", "amour"] as const;
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  mot: "Mot rare",
  sentiment: "Sentiment",
  femme: "Femme pionnière",
  monde: "Le monde",
  amour: "L’amour",
};

export interface IDailyInsight extends Document {
  /** Identifiant stable des connaissances de la série de départ (absent sinon). */
  slug?: string;
  category: InsightCategory;
  title: string;
  text: string;
  /** Note interne : d'où vient l'information. Jamais montrée aux membres. */
  source: string;
  /** Inactive : conservée, mais plus jamais proposée. */
  active: boolean;
  /** Jour imposé, au format AAAA-MM-JJ (heure de Paris). Vide : dans la rotation. */
  publishOn?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DailyInsightSchema = new Schema<IDailyInsight>(
  {
    slug: { type: String, trim: true },
    category: { type: String, enum: INSIGHT_CATEGORIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    text: { type: String, required: true, trim: true, maxlength: 600 },
    source: { type: String, default: "", trim: true, maxlength: 300 },
    active: { type: Boolean, default: true },
    publishOn: { type: String, default: null },
  },
  { timestamps: true }
);

DailyInsightSchema.index({ slug: 1 }, { unique: true, sparse: true });
DailyInsightSchema.index({ publishOn: 1 }, { sparse: true });

export interface IDailyInsightDay extends Document {
  /** AAAA-MM-JJ, heure de Paris. */
  day: string;
  insightId: Types.ObjectId;
}

const DailyInsightDaySchema = new Schema<IDailyInsightDay>({
  day: { type: String, required: true, unique: true },
  insightId: { type: Schema.Types.ObjectId, ref: "DailyInsight", required: true, index: true },
});

export const DailyInsight: Model<IDailyInsight> =
  mongoose.models.DailyInsight || mongoose.model<IDailyInsight>("DailyInsight", DailyInsightSchema);

export const DailyInsightDay: Model<IDailyInsightDay> =
  mongoose.models.DailyInsightDay ||
  mongoose.model<IDailyInsightDay>("DailyInsightDay", DailyInsightDaySchema);
