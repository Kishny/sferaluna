// src/models/Report.ts

import mongoose, { Schema } from "mongoose";

const ReportSchema = new Schema(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["user", "message", "community_post"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "harcèlement",
        "contenu_inapproprié",
        "faux_profil",
        "autre",
      ],
      required: true,
    },
    details: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Un seul signalement par paire reporter/cible
ReportSchema.index({ reporterId: 1, targetId: 1 }, { unique: true });

export const Report =
  mongoose.models.Report || mongoose.model("Report", ReportSchema);
