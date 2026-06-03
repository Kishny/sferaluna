// src/models/ProfileVisit.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Enregistre qu'un utilisateur a visité le profil d'un autre.
 *
 * - visitorId : celui qui a regardé
 * - visitedId : celui dont le profil a été consulté
 *
 * Un seul enregistrement par paire par jour (upsert sur createdAt date).
 * Accessible uniquement aux membres premium (essential+ pour visitedId).
 */
export interface IProfileVisit extends Document {
  visitorId: mongoose.Types.ObjectId;
  visitedId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileVisitSchema = new Schema<IProfileVisit>(
  {
    visitorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    visitedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Index pour requêter "qui a visité mon profil" + TTL 90 jours
ProfileVisitSchema.index({ visitedId: 1, createdAt: -1 });
ProfileVisitSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 } // auto-suppression après 90 jours
);

export interface ProfileVisitModel extends Model<IProfileVisit> {}

export const ProfileVisit: ProfileVisitModel =
  (models.ProfileVisit as ProfileVisitModel) ||
  mongoose.model<IProfileVisit, ProfileVisitModel>("ProfileVisit", ProfileVisitSchema);
