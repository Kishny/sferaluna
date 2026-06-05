// src/models/Subscription.ts

import mongoose, { Schema, models, model } from 'mongoose';
import type {
  SubscriptionPlanId,
  SubscriptionStatus,
} from '@/lib/subscription/config';

/**
 * Modèle Subscription
 * -------------------
 * Stocke l'abonnement actif ou historique d'une utilisatrice.
 *
 * Ce modèle est prévu pour fonctionner avec Stripe, mais il peut aussi
 * fonctionner temporairement sans Stripe si tu veux activer un plan à la main.
 */

export interface ISubscription {
  _id: mongoose.Types.ObjectId;

  /**
   * Utilisatrice liée à l'abonnement.
   */
  userId: mongoose.Types.ObjectId;

  /**
   * Plan SferaLuna.
   */
  plan: SubscriptionPlanId;

  /**
   * Statut interne / Stripe.
   */
  status: SubscriptionStatus;

  /**
   * Identifiants Stripe.
   * Facultatifs pour permettre des abonnements créés manuellement.
   */
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;

  /**
   * Dates de période Stripe.
   */
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;

  /**
   * Date d'annulation.
   */
  canceledAt?: Date;

  /**
   * Si true, Stripe annulera à la fin de la période.
   */
  cancelAtPeriodEnd: boolean;

  /**
   * Essai gratuit éventuel.
   */
  trialStart?: Date;
  trialEnd?: Date;

  /**
   * Métadonnées libres.
   */
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    plan: {
      type: String,
      required: true,
      enum: ['free', 'essential-monthly', 'premium-monthly', 'elite-monthly'],
      default: 'free',
      index: true,
    },

    status: {
      type: String,
      required: true,
      enum: [
        'inactive',
        'active',
        'trialing',
        'past_due',
        'canceled',
        'expired',
      ],
      default: 'inactive',
      index: true,
    },

    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
    },

    stripeSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },

    stripePriceId: {
      type: String,
      default: null,
    },

    currentPeriodStart: {
      type: Date,
      default: null,
    },

    currentPeriodEnd: {
      type: Date,
      default: null,
      index: true,
    },

    canceledAt: {
      type: Date,
      default: null,
    },

    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },

    trialStart: {
      type: Date,
      default: null,
    },

    trialEnd: {
      type: Date,
      default: null,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index utiles :
 * - retrouver rapidement l'abonnement actif d'une utilisatrice ;
 * - éviter les doublons Stripe.
 */
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ userId: 1, plan: 1 });
SubscriptionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });

/**
 * Empêche Next.js / hot reload de recréer le modèle plusieurs fois.
 */
export const Subscription =
  models.Subscription ||
  model<ISubscription>('Subscription', SubscriptionSchema);