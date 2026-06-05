// src/models/Like.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Modèle Like SferaLuna.
 *
 * Un like représente une action simple :
 * - fromUserId aime toUserId.
 *
 * Si A aime B et B aime A, alors l'API /api/likes crée automatiquement
 * un Match entre les deux utilisateurs.
 */
export interface ILike extends Document {
  fromUserId: mongoose.Types.ObjectId;
  toUserId: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    /**
     * Utilisateur qui envoie le like.
     */
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Utilisateur qui reçoit le like.
     */
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Validation : empêcher un utilisateur de se liker lui-même.
 *
 * La route API le vérifie aussi, mais cette validation protège également
 * la base si un like est créé ailleurs plus tard.
 */
LikeSchema.pre<ILike>("validate", function () {
  if (String(this.fromUserId) === String(this.toUserId)) {
    throw new Error("Un utilisateur ne peut pas se liker lui-même.");
  }
});

/**
 * Un utilisateur ne peut liker qu'une seule fois le même profil.
 */
LikeSchema.index(
  {
    fromUserId: 1,
    toUserId: 1,
  },
  {
    unique: true,
  }
);

/**
 * Index utiles :
 * - retrouver qui a liké un profil ;
 * - retrouver tous les likes envoyés par un utilisateur ;
 * - accélérer Explorer pour exclure les profils déjà likés.
 */
LikeSchema.index({ fromUserId: 1, createdAt: -1 });
LikeSchema.index({ toUserId: 1, createdAt: -1 });

export interface LikeModel extends Model<ILike> {}

/**
 * Export compatible avec Next.js hot reload.
 */
export const Like: LikeModel =
  (models.Like as LikeModel) ||
  mongoose.model<ILike, LikeModel>("Like", LikeSchema);
