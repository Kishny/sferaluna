// src/models/Like.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Représente un "like" d'un utilisateur vers un autre.
 *
 * Quand deux utilisateurs se likent mutuellement,
 * un Match est automatiquement créé côté API.
 */
export interface ILike extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Un utilisateur ne peut liker qu'une seule fois le même profil
LikeSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export interface LikeModel extends Model<ILike> {}

export const Like: LikeModel =
  (models.Like as LikeModel) ||
  mongoose.model<ILike, LikeModel>("Like", LikeSchema);
