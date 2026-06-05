// src/models/VibePost.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Humeurs disponibles dans VibeSphere.
 *
 * Ces valeurs doivent rester synchronisées avec :
 * - src/app/vibesphere/page.tsx
 * - src/app/api/vibesphere/route.ts
 * - éventuellement les filtres / badges côté frontend.
 */
export type VibeMood =
  | "joyeuse"
  | "sereine"
  | "mélancolique"
  | "amoureuse"
  | "curieuse"
  | "fière"
  | "mystérieuse";

/**
 * Interface TypeScript d'un post VibeSphere.
 *
 * Un post appartient à un utilisateur et représente une humeur / vibe publiée.
 */
export interface IVibePost extends Document {
  userId: mongoose.Types.ObjectId;

  content: string;
  mood: VibeMood;
  emoji: string;

  /**
   * Liste des utilisateurs ayant liké ce post.
   *
   * Important :
   * on protège les doublons côté API, mais on ajoute aussi une validation
   * côté modèle pour garder une base plus propre.
   */
  likes: mongoose.Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Liste unique des moods autorisés.
 */
export const VIBE_MOODS: VibeMood[] = [
  "joyeuse",
  "sereine",
  "mélancolique",
  "amoureuse",
  "curieuse",
  "fière",
  "mystérieuse",
];

const VibePostSchema = new Schema<IVibePost>(
  {
    /**
     * Auteur du post.
     */
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'utilisateur est obligatoire."],
      index: true,
    },

    /**
     * Contenu texte du post.
     *
     * 300 caractères = parfait pour un feed mobile rapide et lisible.
     */
    content: {
      type: String,
      required: [true, "Le contenu est obligatoire."],
      trim: true,
      minlength: [1, "Le contenu ne peut pas être vide."],
      maxlength: [300, "Le contenu ne peut pas dépasser 300 caractères."],
    },

    /**
     * Humeur choisie.
     */
    mood: {
      type: String,
      enum: {
        values: VIBE_MOODS,
        message: "Humeur invalide.",
      },
      required: [true, "L'humeur est obligatoire."],
      index: true,
    },

    /**
     * Emoji associé au mood.
     *
     * On limite volontairement la longueur pour éviter les abus.
     */
    emoji: {
      type: String,
      required: [true, "L'emoji est obligatoire."],
      trim: true,
      maxlength: [10, "L'emoji est trop long."],
    },

    /**
     * Utilisateurs ayant liké le post.
     */
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,

    /**
     * Nettoyage JSON automatique.
     */
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
 * Virtual pratique :
 * post.likesCount
 */
VibePostSchema.virtual("likesCount").get(function (this: IVibePost) {
  return Array.isArray(this.likes) ? this.likes.length : 0;
});

/**
 * Middleware avant validation :
 * supprime les doublons dans likes si jamais ils apparaissent.
 *
 * L'API doit déjà gérer ça, mais cette protection évite une base sale.
 */
VibePostSchema.pre<IVibePost>("validate", function () {
  if (Array.isArray(this.likes)) {
    const uniqueLikes = Array.from(
      new Set(this.likes.map((id) => id.toString()))
    ).map((id) => new mongoose.Types.ObjectId(id));

    this.likes = uniqueLikes;
  }
});

/**
 * Index principal pour le feed :
 * derniers posts d'abord.
 */
VibePostSchema.index({ createdAt: -1 });

/**
 * Index pour charger les posts d'un utilisateur.
 */
VibePostSchema.index({ userId: 1, createdAt: -1 });

/**
 * Index pour filtrer par humeur.
 */
VibePostSchema.index({ mood: 1, createdAt: -1 });

/**
 * Index pour retrouver les posts likés par un utilisateur si besoin plus tard.
 */
VibePostSchema.index({ likes: 1 });

export interface VibePostModel extends Model<IVibePost> {}

/**
 * Export compatible avec Next.js hot reload.
 */
export const VibePost: VibePostModel =
  (models.VibePost as VibePostModel) ||
  mongoose.model<IVibePost, VibePostModel>("VibePost", VibePostSchema);
