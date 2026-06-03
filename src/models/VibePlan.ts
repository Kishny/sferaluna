// src/models/VibePlan.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

export type VibePlanStatus = "pending" | "accepted" | "rejected";

export interface IVibePlan extends Document {
  matchId: mongoose.Types.ObjectId;
  proposedById: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  emoji: string;
  scheduledAt?: Date | null;
  status: VibePlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VibePlanSchema = new Schema<IVibePlan>(
  {
    matchId: { type: Schema.Types.ObjectId, ref: "Match", required: true, index: true },
    proposedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, maxlength: 100, trim: true },
    description: { type: String, required: true, maxlength: 500, trim: true },
    category: { type: String, required: true },
    emoji: { type: String, required: true },
    scheduledAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const VibePlan: Model<IVibePlan> =
  (models.VibePlan as Model<IVibePlan>) ||
  mongoose.model<IVibePlan>("VibePlan", VibePlanSchema);
