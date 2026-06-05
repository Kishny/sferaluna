// src/models/VibePlan.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Statut d'un VibePlan.
 *
 * pending : proposition en attente
 * accepted : proposition acceptée
 * rejected : proposition refusée
 */
export type VibePlanStatus = "pending" | "accepted" | "rejected";

/**
 * Interface TypeScript d'un VibePlan.
 *
 * Un VibePlan est une proposition d'activité entre deux personnes matchées.
 * Exemple :
 * - café ;
 * - balade ;
 * - appel vidéo ;
 * - musée ;
 * - restaurant ;
 * - activité personnalisée.
 */
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
    /**
     * Match concerné par la proposition.
     */
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: [true, "Le match est obligatoire."],
      index: true,
    },

    /**
     * Utilisateur qui propose l'activité.
     */
    proposedById: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur proposant l'activité est obligatoire."],
      index: true,
    },

    /**
     * Titre court de la proposition.
     */
    title: {
      type: String,
      required: [true, "Le titre est obligatoire."],
      trim: true,
      minlength: [2, "Le titre est trop court."],
      maxlength: [100, "Le titre ne peut pas dépasser 100 caractères."],
    },

    /**
     * Description plus détaillée.
     */
    description: {
      type: String,
      required: [true, "La description est obligatoire."],
      trim: true,
      minlength: [2, "La description est trop courte."],
      maxlength: [500, "La description ne peut pas dépasser 500 caractères."],
    },

    /**
     * Catégorie de l'activité.
     *
     * Exemple :
     * - cafe
     * - restaurant
     * - balade
     * - culture
     * - appel-video
     * - autre
     */
    category: {
      type: String,
      required: [true, "La catégorie est obligatoire."],
      trim: true,
      maxlength: [50, "La catégorie est trop longue."],
      index: true,
    },

    /**
     * Emoji de l'activité.
     */
    emoji: {
      type: String,
      required: [true, "L'emoji est obligatoire."],
      trim: true,
      maxlength: [10, "L'emoji est trop long."],
    },

    /**
     * Date proposée.
     *
     * null = aucune date fixée.
     */
    scheduledAt: {
      type: Date,
      default: null,
      index: true,
    },

    /**
     * Statut de la proposition.
     */
    status: {
      type: String,
      enum: {
        values: ["pending", "accepted", "rejected"],
        message: "Statut de VibePlan invalide.",
      },
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        delete (ret as Record<string, unknown>).__v;
        return ret;
      },
    },
  }
);

/**
 * Validation simple :
 * éviter une date complètement invalide ou trop ancienne si scheduledAt est fourni.
 *
 * Ici, on autorise une petite marge d'une journée dans le passé
 * pour éviter les problèmes de fuseau horaire ou d'édition rapide.
 */
VibePlanSchema.pre<IVibePlan>("validate", function () {
  if (!this.scheduledAt) return;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (this.scheduledAt < oneDayAgo) {
    throw new Error("La date proposée ne peut pas être dans le passé.");
  }
});

/**
 * Un match peut avoir plusieurs VibePlans.
 * On indexe pour récupérer les propositions récentes d'un match.
 */
VibePlanSchema.index({ matchId: 1, createdAt: -1 });

/**
 * Index pour les propositions en attente.
 */
VibePlanSchema.index({ matchId: 1, status: 1, createdAt: -1 });

/**
 * Index pour retrouver les propositions faites par un utilisateur.
 */
VibePlanSchema.index({ proposedById: 1, createdAt: -1 });

/**
 * Index pour les activités planifiées.
 */
VibePlanSchema.index({ scheduledAt: 1, status: 1 });

export interface VibePlanModel extends Model<IVibePlan> {}

/**
 * Export compatible avec Next.js hot reload.
 */
export const VibePlan: VibePlanModel =
  (models.VibePlan as VibePlanModel) ||
  mongoose.model<IVibePlan, VibePlanModel>("VibePlan", VibePlanSchema);
