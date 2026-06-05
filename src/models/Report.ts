// src/models/Report.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Types de cibles signalables.
 *
 * user : profil utilisateur
 * message : message privé
 * community_post : post VibeSphere / communauté
 */
export type ReportTargetType = "user" | "message" | "community_post";

/**
 * Raisons possibles de signalement.
 *
 * Important :
 * Ces valeurs doivent rester synchronisées avec :
 * - src/components/ReportModal.tsx
 * - src/app/api/reports/route.ts
 */
export type ReportReason =
  | "spam"
  | "harcèlement"
  | "contenu_inapproprié"
  | "faux_profil"
  | "autre";

/**
 * Statut de traitement du signalement.
 *
 * pending : en attente de vérification
 * reviewed : vérifié / traité
 * dismissed : rejeté / non retenu
 */
export type ReportStatus = "pending" | "reviewed" | "dismissed";

/**
 * Interface principale du signalement.
 */
export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;

  targetType: ReportTargetType;
  targetId: mongoose.Types.ObjectId;

  reason: ReportReason;
  details?: string;

  status: ReportStatus;
  adminNotes?: string;

  reviewedAt?: Date | null;
  reviewedBy?: mongoose.Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    /**
     * Utilisateur qui fait le signalement.
     */
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Type d'élément signalé.
     */
    targetType: {
      type: String,
      enum: ["user", "message", "community_post"],
      required: true,
      index: true,
    },

    /**
     * ID de l'élément signalé.
     *
     * Peut être :
     * - un User._id ;
     * - un Message._id ;
     * - un post VibeSphere._id.
     */
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    /**
     * Raison du signalement.
     */
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
      index: true,
    },

    /**
     * Détails optionnels fournis par l'utilisateur.
     */
    details: {
      type: String,
      default: "",
      trim: true,
      maxlength: [500, "Les détails ne doivent pas dépasser 500 caractères."],
    },

    /**
     * Statut de modération.
     */
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed"],
      default: "pending",
      index: true,
    },

    /**
     * Notes internes admin.
     */
    adminNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Les notes admin ne doivent pas dépasser 1000 caractères."],
    },

    /**
     * Date de traitement par l'administration.
     */
    reviewedAt: {
      type: Date,
      default: null,
    },

    /**
     * Admin ayant traité le signalement.
     */
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Un utilisateur ne peut signaler qu'une seule fois la même cible du même type.
 *
 * Important :
 * targetType est inclus pour éviter une collision si, par hasard,
 * un User et un Message avaient un ObjectId identique.
 */
ReportSchema.index(
  {
    reporterId: 1,
    targetType: 1,
    targetId: 1,
  },
  {
    unique: true,
  }
);

/**
 * Index utiles pour un futur dashboard admin.
 */
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
ReportSchema.index({ reporterId: 1, createdAt: -1 });

export interface ReportModel extends Model<IReport> {}

/**
 * Export compatible avec le hot reload Next.js.
 */
export const Report: ReportModel =
  (models.Report as ReportModel) ||
  mongoose.model<IReport, ReportModel>("Report", ReportSchema);
