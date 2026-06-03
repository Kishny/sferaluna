// src/models/Match.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Représente un match mutuel entre deux utilisateurs.
 *
 * Un match est créé quand A like B ET B like A.
 * Il sert de "canal" pour la messagerie.
 */
export interface IMatch extends Document {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;
  createdAt: Date;
  lastMessageAt: Date | null;
  isActive: boolean;
}

const MatchSchema = new Schema<IMatch>(
  {
    user1Id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    user2Id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Un seul match possible entre deux utilisateurs (ordre indifférent géré côté API)
MatchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

export interface MatchModel extends Model<IMatch> {}

export const Match: MatchModel =
  (models.Match as MatchModel) ||
  mongoose.model<IMatch, MatchModel>("Match", MatchSchema);
