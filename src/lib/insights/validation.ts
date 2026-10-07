// src/lib/insights/validation.ts

import { z } from "zod";

import { INSIGHT_CATEGORIES } from "@/models/DailyInsight";
import { isDayKey } from "@/lib/insights/select";

/** Ce qu'une administratrice peut saisir pour une connaissance. */
export const insightInputSchema = z.object({
  category: z.enum(INSIGHT_CATEGORIES, { message: "Catégorie invalide." }),
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(80, "Le titre ne doit pas dépasser 80 caractères."),
  text: z.string().trim().min(1, "Le texte est obligatoire.").max(600, "Le texte ne doit pas dépasser 600 caractères."),
  source: z.string().trim().max(300, "La source ne doit pas dépasser 300 caractères.").optional().default(""),
  active: z.boolean().optional().default(true),
  /** AAAA-MM-JJ pour imposer un jour, vide ou null pour laisser dans la rotation. */
  publishOn: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => (value ? value.trim() : null))
    .refine((value) => value === null || isDayKey(value), { message: "Date invalide (format AAAA-MM-JJ)." }),
});

export type InsightInput = z.infer<typeof insightInputSchema>;
