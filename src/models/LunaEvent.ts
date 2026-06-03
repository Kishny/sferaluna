// src/models/LunaEvent.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

export interface ILunaEvent extends Document {
  title: string;
  description: string;
  date: Date;
  location: string;
  isOnline: boolean;
  maxAttendees: number;
  attendees: mongoose.Types.ObjectId[];
  category: string;
  emoji: string;
  coverEmoji: string;
  createdBy: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LunaEventSchema = new Schema<ILunaEvent>(
  {
    title: { type: String, required: true, maxlength: 150, trim: true },
    description: { type: String, required: true, maxlength: 1000, trim: true },
    date: { type: Date, required: true },
    location: { type: String, required: true, trim: true },
    isOnline: { type: Boolean, default: false },
    maxAttendees: { type: Number, required: true, min: 1 },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    category: { type: String, required: true },
    emoji: { type: String, required: true },
    coverEmoji: { type: String, default: "🌙" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LunaEventSchema.index({ date: 1 });
LunaEventSchema.index({ isPublished: 1, date: 1 });

export const LunaEvent: Model<ILunaEvent> =
  (models.LunaEvent as Model<ILunaEvent>) ||
  mongoose.model<ILunaEvent>("LunaEvent", LunaEventSchema);
