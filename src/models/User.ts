// src/models/User.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Providers d'authentification autorisés.
 *
 * Cela permet de savoir comment l'utilisateur s'est inscrit :
 * - credentials : email + mot de passe
 * - google : connexion Google OAuth
 * - facebook : prévu plus tard
 * - apple : prévu plus tard
 */
export type AuthProvider = "credentials" | "google" | "facebook" | "apple";

/**
 * Rôles disponibles sur SferaLuna.
 *
 * user : utilisateur classique
 * admin : administrateur de la plateforme
 */
export type UserRole = "user" | "admin";

/**
 * Plans disponibles sur SferaLuna.
 *
 * Ces valeurs doivent rester synchronisées avec :
 * - src/app/paiement/page.tsx
 * - src/app/api/stripe/create-checkout-session/route.ts
 * - src/app/api/stripe/webhook/route.ts
 */
export type UserPlan =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

/**
 * Statuts d'abonnement Stripe.
 *
 * inactive : aucun abonnement actif
 * active : abonnement payé et actif
 * trialing : période d'essai
 * past_due : paiement en retard
 * canceled : abonnement annulé
 */
export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

/**
 * Visibilité du profil.
 *
 * public : profil visible
 * matches : visible seulement par les matches
 * premium : visible par les membres premium
 * invisible : mode discret / invisible
 */
export type ProfileVisibility = "public" | "matches" | "premium" | "invisible";

/**
 * Interface TypeScript principale de l'utilisateur SferaLuna.
 *
 * Elle décrit les champs que l'on manipule côté TypeScript.
 * Le schéma Mongoose plus bas décrit comment ces champs sont stockés dans MongoDB.
 */
export interface IUser extends Document {
  email: string;

  // Identité publique
  pseudonyme: string;
  name?: string;
  image?: string;

  // Authentification
  password?: string;
  provider: AuthProvider;

  // Informations de profil
  bio?: string;
  age?: number;
  orientation?: string;
  intentions: string[];
  localisation?: string;
  rayon?: string;
  question?: string;
  reponse?: string;
  interets: string[];
  visibilite: ProfileVisibility;

  // État du compte
  hasCompletedProfile: boolean;
  profileCompletedAt?: Date | null;
  consentement: boolean;
  role: UserRole;

  // Plan et abonnement
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  isPremium: boolean;
  premiumStartedAt?: Date | null;
  premiumExpiresAt?: Date | null;

  // Stripe
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;

  // Vérification email
  emailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiry?: Date | null;

  // Reset mot de passe
  resetPasswordToken?: string | null;
  resetPasswordExpiry?: Date | null;

  // Vérification d'identité Stripe Identity
  identityVerified: boolean;
  identityVerificationStatus?: "unverified" | "pending" | "verified" | "failed";
  stripeVerificationSessionId?: string | null;

  // Sécurité / suivi
  lastLoginAt?: Date | null;
  lastPaymentAt?: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Schéma MongoDB de l'utilisateur SferaLuna.
 *
 * Points importants :
 * - email est unique et normalisé en minuscules.
 * - pseudonyme a une valeur par défaut pour éviter les erreurs avec Google OAuth.
 * - les champs Stripe sont directement intégrés pour éviter que Mongoose les ignore.
 * - les anciennes valeurs premium-mensuel / premium-annuel ne sont plus utilisées.
 */
const UserSchema = new Schema<IUser>(
  {
    /**
     * Email principal de l'utilisateur.
     *
     * Sert d'identifiant unique pour :
     * - NextAuth
     * - MongoDB
     * - Stripe customer
     */
    bio: {
      type: String,
      default: "",
      maxlength: [500, "La bio ne peut pas dépasser 500 caractères."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "L'email est obligatoire."],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /**
     * Nom public affiché sur SferaLuna.
     */
    pseudonyme: {
      type: String,
      required: [true, "Le pseudonyme est obligatoire."],
      default: "Utilisateur Luna",
      trim: true,
      minlength: [2, "Le pseudonyme doit contenir au moins 2 caractères."],
      maxlength: [50, "Le pseudonyme ne doit pas dépasser 50 caractères."],
    },

    /**
     * Nom complet ou nom fourni par Google.
     */
    name: {
      type: String,
      default: "",
      trim: true,
      maxlength: [100, "Le nom ne doit pas dépasser 100 caractères."],
    },

    /**
     * Photo de profil.
     * Peut venir de Google OAuth ou d'un upload futur.
     */
    image: {
      type: String,
      default: "",
      trim: true,
    },

    /**
     * Mot de passe.
     *
     * Important :
     * - Pour Google OAuth, ce champ peut rester vide.
     * - Pour credentials, il devrait être hashé avec bcrypt.
     */
    password: {
      type: String,
      default: "",
      select: false,
    },

    /**
     * Provider utilisé pour créer le compte.
     */
    provider: {
      type: String,
      enum: ["credentials", "google", "facebook", "apple"],
      default: "credentials",
    },

    /**
     * Âge de l'utilisateur.
     * SferaLuna vise actuellement les femmes de 28 ans et plus.
     */
    age: {
      type: Number,
      min: [18, "L'âge minimum est de 18 ans."],
      max: [120, "Âge invalide."],
      default: undefined,
    },

    /**
     * Orientation relationnelle ou sexuelle.
     * Les valeurs exactes sont gérées côté formulaire.
     */
    orientation: {
      type: String,
      default: "",
      trim: true,
    },

    /**
     * Intentions de rencontre :
     * rencontre sérieuse, amitié, aventure, discussion, etc.
     */
    intentions: {
      type: [String],
      default: [],
    },

    /**
     * Ville ou zone géographique.
     */
    localisation: {
      type: String,
      default: "",
      trim: true,
      maxlength: [120, "La localisation est trop longue."],
    },

    /**
     * Rayon de recherche.
     * Exemple : 10 km, 25 km, france, region.
     */
    rayon: {
      type: String,
      default: "10 km",
      trim: true,
    },

    /**
     * Question de sécurité choisie.
     */
    question: {
      type: String,
      default: "",
      trim: true,
    },

    /**
     * Réponse à la question de sécurité.
     *
     * Note :
     * plus tard, il serait mieux de hasher cette réponse
     * si elle sert réellement à récupérer un compte.
     */
    reponse: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "La réponse ne doit pas dépasser 200 caractères."],
      select: false,
    },

    /**
     * Centres d'intérêt.
     */
    interets: {
      type: [String],
      default: [],
    },

    /**
     * Visibilité du profil.
     */
    visibilite: {
      type: String,
      enum: ["public", "matches", "premium", "invisible"],
      default: "public",
    },

    /**
     * Indique si le formulaire profil est complété.
     */
    hasCompletedProfile: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Date de première complétion du profil.
     */
    profileCompletedAt: {
      type: Date,
      default: null,
    },

    /**
     * Consentement aux conditions / confidentialité.
     */
    consentement: {
      type: Boolean,
      default: true,
    },

    /**
     * Rôle utilisateur.
     */
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    /**
     * Plan choisi par l'utilisateur.
     *
     * free : compte gratuit
     * essential-monthly : offre Essentiel à 9,99€/mois
     * premium-monthly : offre Premium à 19,99€/mois
     * elite-monthly : offre Elite à 34,99€/mois
     */
    plan: {
      type: String,
      enum: ["free", "essential-monthly", "premium-monthly", "elite-monthly"],
      default: "free",
      index: true,
    },

    /**
     * Statut réel de l'abonnement Stripe.
     *
     * Ce champ est la vraie source de vérité pour savoir
     * si l'abonnement est actif ou non.
     */
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "trialing", "past_due", "canceled"],
      default: "inactive",
      index: true,
    },

    /**
     * Booléen pratique pour l'interface.
     *
     * Il doit rester synchronisé avec subscriptionStatus :
     * - true si active ou trialing
     * - false sinon
     */
    isPremium: {
      type: Boolean,
      default: false,
      index: true,
    },

    /**
     * Date de début de l'accès premium.
     */
    premiumStartedAt: {
      type: Date,
      default: null,
    },

    /**
     * Date d'expiration théorique de l'accès premium.
     *
     * Pour un abonnement Stripe actif, Stripe reste la source de vérité,
     * mais ce champ aide à l'affichage rapide côté frontend.
     */
    premiumExpiresAt: {
      type: Date,
      default: null,
    },

    /**
     * Identifiant client Stripe.
     *
     * Exemple : cus_xxxxxxxxx
     */
    stripeCustomerId: {
      type: String,
      default: "",
      index: true,
    },

    /**
     * Identifiant d'abonnement Stripe.
     *
     * Exemple : sub_xxxxxxxxx
     */
    stripeSubscriptionId: {
      type: String,
      default: "",
      index: true,
    },

    /**
     * Dernière session Checkout Stripe.
     *
     * Utile pour le debug ou pour retrouver une session de paiement.
     */
    stripeCheckoutSessionId: {
      type: String,
      default: "",
    },

    /**
     * Date de dernière connexion.
     * Tu pourras la mettre à jour dans NextAuth plus tard.
     */
    // Vérification email
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpiry: { type: Date, default: null, select: false },

    // Reset mot de passe
    resetPasswordToken: { type: String, default: null, select: false },
    resetPasswordExpiry: { type: Date, default: null, select: false },

    // Vérification d'identité Stripe Identity
    identityVerified: { type: Boolean, default: false },
    identityVerificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "failed"],
      default: "unverified",
    },
    stripeVerificationSessionId: { type: String, default: null },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    /**
     * Date du dernier paiement confirmé.
     */
    lastPaymentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,

    /**
     * Ajoute les virtuals quand on transforme le document en JSON.
     */
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.reponse;
        delete (ret as Record<string, any>).__v;
        return ret;
      },
    },

    toObject: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.reponse;
        delete (ret as Record<string, any>).__v;
        return ret;
      },
    },
  }
);

/**
 * Virtual : plan lisible pour l'interface.
 *
 * Exemple :
 * user.planLabel => "Premium"
 */
UserSchema.virtual("planLabel").get(function (this: IUser) {
  const labels: Record<UserPlan, string> = {
    free: "Gratuit",
    "essential-monthly": "Essentiel",
    "premium-monthly": "Premium",
    "elite-monthly": "Elite",
  };

  return labels[this.plan] || "Gratuit";
});

/**
 * Virtual : statut lisible pour l'interface.
 *
 * Exemple :
 * user.subscriptionStatusLabel => "Actif"
 */
UserSchema.virtual("subscriptionStatusLabel").get(function (this: IUser) {
  const labels: Record<SubscriptionStatus, string> = {
    inactive: "Inactif",
    active: "Actif",
    trialing: "Période d'essai",
    past_due: "Paiement en retard",
    canceled: "Annulé",
  };

  return labels[this.subscriptionStatus] || "Inactif";
});

/**
 * Middleware avant sauvegarde.
 *
 * Objectif :
 * garder isPremium cohérent avec subscriptionStatus.
 *
 * En Mongoose moderne, on peut ne pas utiliser next().
 * Si la fonction ne retourne pas d'erreur, Mongoose continue automatiquement.
 */
UserSchema.pre<IUser>("save", function () {
  this.isPremium =
    this.subscriptionStatus === "active" ||
    this.subscriptionStatus === "trialing";
});

/**
 * Index utiles pour les recherches futures.
 *
 * Attention :
 * email est déjà unique plus haut.
 */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ plan: 1, subscriptionStatus: 1 });
UserSchema.index({ isPremium: 1, hasCompletedProfile: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ updatedAt: -1 });

/**
 * Méthode statique pratique pour retrouver un utilisateur par email.
 *
 * Exemple :
 * await User.findByEmail("test@email.com")
 */
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({
    email: email.toLowerCase().trim(),
  });
};

/**
 * Type du modèle avec méthode statique personnalisée.
 */
export interface UserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

/**
 * Export du modèle User.
 *
 * Important en Next.js :
 * models.User évite l'erreur OverwriteModelError pendant le hot reload.
 *
 * Après modification du schéma :
 * - coupe le serveur
 * - supprime .next si besoin
 * - relance npm run dev
 */
export const User: UserModel =
  (models.User as UserModel) ||
  mongoose.model<IUser, UserModel>("User", UserSchema);