// src/models/Boost.ts

import mongoose, { Schema, models, model } from 'mongoose';

/**
 * Types possibles de boost.
 *
 * profile :
 * - boost classique du profil dans Explorer / recommandations.
 *
 * spotlight :
 * - boost plus fort, type mise en avant temporaire.
 *
 * event :
 * - boost lié à un événement ou une visibilité communautaire.
 */
export type BoostType = 'profile' | 'spotlight' | 'event';

/**
 * Statut du boost.
 *
 * scheduled :
 * - boost prévu mais pas encore actif.
 *
 * active :
 * - boost en cours.
 *
 * expired :
 * - boost terminé.
 *
 * canceled :
 * - boost annulé.
 */
export type BoostStatus = 'scheduled' | 'active' | 'expired' | 'canceled';

export interface IBoost {
  _id: mongoose.Types.ObjectId;

  /**
   * Utilisatrice qui lance le boost.
   */
  userId: mongoose.Types.ObjectId;

  /**
   * Type de boost utilisé.
   */
  type: BoostType;

  /**
   * Statut actuel du boost.
   */
  status: BoostStatus;

  /**
   * Date de démarrage du boost.
   */
  startsAt: Date;

  /**
   * Date de fin du boost.
   */
  endsAt: Date;

  /**
   * Durée en minutes.
   * Exemple : 30 minutes, 60 minutes, etc.
   */
  durationMinutes: number;

  /**
   * Multiplicateur de visibilité.
   * Exemple : 2 = visibilité x2.
   */
  multiplier: number;

  /**
   * Optionnel :
   * permet de lier un boost à une cible précise.
   * Exemple : un événement, un post, une fonctionnalité future.
   */
  targetId?: mongoose.Types.ObjectId | null;

  /**
   * Optionnel :
   * permet d’indiquer la nature de la cible.
   */
  targetType?: 'profile' | 'event' | 'community_post' | null;

  /**
   * Source du boost :
   * subscription = inclus dans l’abonnement
   * purchase = acheté séparément
   * admin = offert / activé manuellement
   */
  source: 'subscription' | 'purchase' | 'admin';

  /**
   * Métadonnées libres pour évolution future.
   */
  metadata?: Record<string, unknown>;

  createdAt: Date;
  updatedAt: Date;
}

const BoostSchema = new Schema<IBoost>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ['profile', 'spotlight', 'event'],
      default: 'profile',
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: ['scheduled', 'active', 'expired', 'canceled'],
      default: 'active',
      required: true,
      index: true,
    },

    startsAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    endsAt: {
      type: Date,
      required: true,
      index: true,
    },

    durationMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 1,
    },

    multiplier: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
    },

    targetId: {
      type: Schema.Types.ObjectId,
      default: null,
      index: true,
    },

    targetType: {
      type: String,
      enum: ['profile', 'event', 'community_post', null],
      default: null,
    },

    source: {
      type: String,
      enum: ['subscription', 'purchase', 'admin'],
      default: 'subscription',
      required: true,
      index: true,
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
 * Index utiles pour :
 * - compter les boosts mensuels ;
 * - trouver les boosts actifs ;
 * - nettoyer ou expirer les boosts.
 */
BoostSchema.index({ userId: 1, createdAt: -1 });
BoostSchema.index({ userId: 1, status: 1 });
BoostSchema.index({ status: 1, startsAt: 1, endsAt: 1 });

/**
 * Export compatible Next.js hot reload.
 */
export const Boost = models.Boost || model<IBoost>('Boost', BoostSchema);