// src/models/ProfileVisit.ts

import mongoose, { Schema, Document, Model, models, model } from "mongoose";

/**
 * Modèle ProfileVisit
 * -------------------
 * Enregistre les visites de profil sur SferaLuna.
 *
 * Vocabulaire officiel du projet :
 * - visitorId : utilisatrice qui visite / regarde le profil
 * - visitedId : utilisatrice dont le profil a été visité
 *
 * Ce modèle sert à :
 * - afficher "qui a visité mon profil" ;
 * - alimenter les notifications ;
 * - limiter les vues de profils selon le plan ;
 * - fournir une fonctionnalité premium "visiteurs du profil" ;
 * - éviter de compter plusieurs fois la même visite dans la même journée.
 *
 * Important :
 * La protection premium ne se fait PAS dans le modèle.
 * Elle se fait dans :
 * - les routes API ;
 * - les guards ;
 * - subscription-check.ts.
 */

export interface IProfileVisit extends Document {
  /**
   * Utilisatrice qui regarde le profil.
   */
  visitorId: mongoose.Types.ObjectId;

  /**
   * Utilisatrice dont le profil est consulté.
   */
  visitedId: mongoose.Types.ObjectId;

  /**
   * Clé jour au format YYYY-MM-DD.
   *
   * Elle sert à empêcher les doublons :
   * une même visiteuse ne compte qu'une seule visite par jour
   * pour un même profil visité.
   */
  visitDay: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileVisitModel extends Model<IProfileVisit> {}

/**
 * Retourne la date du jour au format YYYY-MM-DD.
 *
 * Exemple :
 * 2026-06-05
 */
export function getVisitDay(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

const ProfileVisitSchema = new Schema<IProfileVisit>(
  {
    visitorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    visitedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    visitDay: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index principal :
 * permet de récupérer rapidement les visiteurs d'un profil.
 *
 * Exemple :
 * ProfileVisit.find({ visitedId }).sort({ createdAt: -1 })
 */
ProfileVisitSchema.index({
  visitedId: 1,
  createdAt: -1,
});

/**
 * Index secondaire :
 * permet de compter rapidement les profils visités par une utilisatrice.
 *
 * Exemple :
 * ProfileVisit.countDocuments({ visitorId })
 */
ProfileVisitSchema.index({
  visitorId: 1,
  createdAt: -1,
});

/**
 * Index unique anti-doublon quotidien.
 *
 * Résultat :
 * une même utilisatrice ne peut compter qu'une seule visite par jour
 * sur le même profil.
 */
ProfileVisitSchema.index(
  {
    visitorId: 1,
    visitedId: 1,
    visitDay: 1,
  },
  {
    unique: true,
    name: "unique_profile_visit_per_day",
  }
);

/**
 * TTL :
 * supprime automatiquement les visites après 90 jours.
 *
 * Utile pour :
 * - ne pas garder trop d'historique ;
 * - limiter la taille de la collection ;
 * - garder une logique premium récente.
 */
ProfileVisitSchema.index(
  {
    createdAt: 1,
  },
  {
    expireAfterSeconds: 90 * 24 * 60 * 60,
    name: "profile_visit_ttl_90_days",
  }
);

export const ProfileVisit: ProfileVisitModel =
  (models.ProfileVisit as ProfileVisitModel) ||
  model<IProfileVisit, ProfileVisitModel>("ProfileVisit", ProfileVisitSchema);