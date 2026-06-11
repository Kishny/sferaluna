// src/models/Match.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Modèle Match SferaLuna.
 *
 * Un match représente une connexion mutuelle entre deux utilisateurs :
 * - A like B
 * - B like A
 *
 * Ce match sert ensuite de canal pour :
 * - la messagerie ;
 * - l'accès au profil si visibilite = "matches" ;
 * - l'affichage dans /matches et /mon-compte?tab=connexions.
 */

export interface IMutedBy {
  userId: mongoose.Types.ObjectId;
  until: Date;
}

export interface IMatch extends Document {
  user1Id: mongoose.Types.ObjectId;
  user2Id: mongoose.Types.ObjectId;

  /** Date du dernier message envoyé — sert à trier les conversations. */
  lastMessageAt: Date | null;

  /** true : match actif ; false : supprimé par les deux parties ou désactivé. */
  isActive: boolean;

  /** Utilisateurs ayant archivé cette conversation (par user, sans affecter l'autre). */
  archivedBy: mongoose.Types.ObjectId[];

  /** Sourdine par utilisateur, avec date d'expiration. */
  mutedBy: IMutedBy[];

  /**
   * Utilisateurs ayant supprimé cette conversation.
   * Quand les deux ont supprimé → isActive passe à false.
   */
  deletedBy: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema = new Schema<IMatch>(
  {
    user1Id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    user2Id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    archivedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },

    mutedBy: {
      type: [
        {
          userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
          until: { type: Date, required: true },
        },
      ],
      default: [],
    },

    deletedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Validation : empêcher un utilisateur d'être matché avec lui-même.
 */
MatchSchema.pre<IMatch>("validate", function () {
  if (String(this.user1Id) === String(this.user2Id)) {
    throw new Error("Un utilisateur ne peut pas être matché avec lui-même.");
  }
});

/**
 * Un seul match possible entre deux utilisateurs.
 *
 * Attention :
 * cet index fonctionne seulement si l'ordre user1Id/user2Id est toujours normalisé
 * côté API de création du match.
 *
 * Exemple recommandé côté API :
 * - trier les deux ObjectId en string ;
 * - mettre le plus petit dans user1Id ;
 * - mettre le plus grand dans user2Id.
 *
 * Ainsi :
 * A-B et B-A deviennent toujours A-B.
 */
MatchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

/**
 * Index utile pour récupérer rapidement les matches d'un utilisateur.
 */
MatchSchema.index({ user1Id: 1, isActive: 1, lastMessageAt: -1 });
MatchSchema.index({ user2Id: 1, isActive: 1, lastMessageAt: -1 });

/**
 * Index utile pour trier les conversations récentes.
 */
MatchSchema.index({ isActive: 1, lastMessageAt: -1, createdAt: -1 });

export interface MatchModel extends Model<IMatch> {}

/**
 * Export compatible Next.js hot reload.
 */
export const Match: MatchModel =
  (models.Match as MatchModel) ||
  mongoose.model<IMatch, MatchModel>("Match", MatchSchema);
