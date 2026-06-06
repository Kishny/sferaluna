// src/models/AuditLog.ts

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuditLog extends Document {
  userId: string;
  action: string;
  details: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      index: true,
    },

    details: {
      type: Schema.Types.Mixed,
      default: {},
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    timestamp: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
  },
  {
    collection: "auditlogs",
    versionKey: false,
  }
);

// Index composé pour rechercher les actions d'un utilisateur par date
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);
