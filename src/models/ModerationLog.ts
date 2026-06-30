// src/models/ModerationLog.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Journal des rejets automatiques de modération photo (AWS Rekognition via
 * Cloudinary — voir src/lib/moderation.ts).
 *
 * Volontairement séparé du modèle Report : Report est pensé pour un flux
 * humain (signalement → file d'attente admin → review → adminNotes), avec
 * une contrainte unique (reporterId, targetType, targetId) qui n'a pas de
 * sens ici puisqu'il n'y a pas de "reporterId" (c'est le système qui agit,
 * pas une utilisatrice) et qu'une même personne peut tenter plusieurs
 * uploads rejetés successifs (utile justement pour détecter un pattern
 * d'abus répété).
 *
 * Usage prévu : surveillance admin (repérer les comptes qui tentent
 * plusieurs uploads rejetés = signal fort de mauvaise intention), pas de
 * workflow de review — la photo est déjà bloquée/supprimée avant l'écriture
 * de ce log, il n'y a rien à "traiter" ensuite à part une décision de ban
 * éventuelle.
 */

export type ModerationContext = "avatar" | "profile_photo" | "chat_image";

export interface IModerationLog extends Document {
  userId: mongoose.Types.ObjectId;
  context: ModerationContext;
  reason: string;
  /** kind renvoyé par Cloudinary (ex: "aws_rek"), utile si on ajoute d'autres providers plus tard. */
  provider: string;
  createdAt: Date;
}

const ModerationLogSchema = new Schema<IModerationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    context: {
      type: String,
      enum: ["avatar", "profile_photo", "chat_image"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    provider: {
      type: String,
      default: "aws_rek",
      trim: true,
      maxlength: 50,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

ModerationLogSchema.index({ userId: 1, createdAt: -1 });

export interface ModerationLogModel extends Model<IModerationLog> {}

export const ModerationLog: ModerationLogModel =
  (models.ModerationLog as ModerationLogModel) ||
  mongoose.model<IModerationLog, ModerationLogModel>("ModerationLog", ModerationLogSchema);
