// src/models/ProfileView.ts

import mongoose, { Schema, models, model } from "mongoose";

/**
 * Modèle ProfileView
 * ------------------
 * Enregistre chaque visite de profil.
 *
 * Utilité :
 * - afficher "qui a visité mon profil" ;
 * - limiter les vues selon le plan ;
 * - alimenter les statistiques premium ;
 * - éviter de compter 50 fois la même visite dans la même journée.
 */

const ProfileViewSchema = new Schema(
  {
    /**
     * Utilisateur qui regarde le profil.
     */
    viewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Utilisateur dont le profil est visité.
     */
    visitedUserId: {
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
 * Index utile pour éviter trop de doublons
 * et accélérer les recherches.
 */
ProfileViewSchema.index({
  viewerId: 1,
  visitedUserId: 1,
  createdAt: -1,
});

export const ProfileView =
  models.ProfileView || model("ProfileView", ProfileViewSchema);