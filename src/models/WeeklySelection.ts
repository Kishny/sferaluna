// src/models/WeeklySelection.ts

import mongoose, { Schema, type Document, type Model, models } from "mongoose";

/**
 * Sélection hebdomadaire « Vos découvertes du jour ».
 *
 * Les 6 profils les plus compatibles sont calculés une fois par semaine
 * (lundi 00:00) puis figés : la liste ne change pas à chaque visite,
 * ni quand l'utilisatrice like l'un d'eux.
 */
export interface IWeeklySelection extends Document {
  userId: mongoose.Types.ObjectId;
  weekOf: Date;
  profileIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const WeeklySelectionSchema = new Schema<IWeeklySelection>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    weekOf: { type: Date, required: true },
    profileIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

WeeklySelectionSchema.index({ userId: 1, weekOf: 1 }, { unique: true });
// Nettoyage automatique après ~5 semaines.
WeeklySelectionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 35 * 24 * 60 * 60 });

export const WeeklySelection: Model<IWeeklySelection> =
  (models.WeeklySelection as Model<IWeeklySelection>) ||
  mongoose.model<IWeeklySelection>("WeeklySelection", WeeklySelectionSchema);
