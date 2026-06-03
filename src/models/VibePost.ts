// src/models/VibePost.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

export type VibeMood = "joyeuse" | "sereine" | "mélancolique" | "amoureuse" | "curieuse" | "fière" | "mystérieuse";

export interface IVibePost extends Document {
  userId: mongoose.Types.ObjectId;
  content: string;
  mood: VibeMood;
  emoji: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const VibePostSchema = new Schema<IVibePost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    content: { type: String, required: true, maxlength: 300, trim: true },
    mood: {
      type: String,
      enum: ["joyeuse", "sereine", "mélancolique", "amoureuse", "curieuse", "fière", "mystérieuse"],
      required: true,
    },
    emoji: { type: String, required: true },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

VibePostSchema.index({ createdAt: -1 });

export const VibePost: Model<IVibePost> =
  (models.VibePost as Model<IVibePost>) ||
  mongoose.model<IVibePost>("VibePost", VibePostSchema);
