// src/models/PhotoVerification.ts

/**
 * Selfie de référence pour la vérification des photos.
 *
 * Donnée biométrique : le selfie est chiffré (AES-256-GCM) avant stockage,
 * n'est jamais exposé par une API, et est supprimé quand la membre retire
 * son consentement ou supprime son compte.
 */

import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPhotoVerification extends Document {
  userId: mongoose.Types.ObjectId;
  reference?: { data: Buffer; iv: Buffer; tag: Buffer } | null;
  livenessConfidence?: number | null;
  consentAt?: Date | null;
  verifiedAt?: Date | null;
  pendingSessionId?: string | null;
  pendingSessionAt?: Date | null;
  attempts: Date[];
  createdAt: Date;
  updatedAt: Date;
}

const PhotoVerificationSchema = new Schema<IPhotoVerification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    reference: {
      type: new Schema({ data: Buffer, iv: Buffer, tag: Buffer }, { _id: false }),
      default: null,
      select: false,
    },
    livenessConfidence: { type: Number, default: null },
    consentAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    pendingSessionId: { type: String, default: null },
    pendingSessionAt: { type: Date, default: null },
    attempts: { type: [Date], default: [] },
  },
  { timestamps: true }
);

export const PhotoVerification: Model<IPhotoVerification> =
  (mongoose.models.PhotoVerification as Model<IPhotoVerification>) ||
  mongoose.model<IPhotoVerification>("PhotoVerification", PhotoVerificationSchema);
