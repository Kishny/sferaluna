// src/models/JournalEntry.ts

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IJournalEntry extends Document {
  userId: mongoose.Types.ObjectId;
  mood: string;
  note: string;
  date: string;          // date formatée côté client pour l'affichage
  ritualDone: boolean;
  period: "jour" | "nuit";
  aiAnalysis?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    mood: {
      type: String,
      required: true,
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    date: {
      type: String,
      required: true,
    },
    ritualDone: {
      type: Boolean,
      default: false,
    },
    period: {
      type: String,
      enum: ["jour", "nuit"],
      default: "jour",
    },
    aiAnalysis: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// TTL : supprime automatiquement les entrées après 1 an
JournalEntrySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60, name: "journal_ttl_1_year" }
);
JournalEntrySchema.index({ userId: 1, createdAt: -1 });

export const JournalEntry: Model<IJournalEntry> =
  mongoose.models.JournalEntry ??
  mongoose.model<IJournalEntry>("JournalEntry", JournalEntrySchema);
