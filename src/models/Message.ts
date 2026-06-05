// src/models/Message.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Modèle Message SferaLuna.
 *
 * Un message privé appartient toujours à un Match.
 * Il est envoyé par l'un des deux utilisateurs du match.
 *
 * Le champ readAt permet de savoir si le message a été lu.
 */
export interface IMessage extends Document {
  matchId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;

  /**
   * Contenu texte du message.
   *
   * Pour le moment, on gère uniquement du texte.
   * Plus tard, tu pourras ajouter :
   * - type: "text" | "image" | "audio" | "file"
   * - mediaUrl
   * - metadata
   */
  content: string;

  /**
   * Date de lecture.
   *
   * null = pas encore lu.
   */
  readAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    /**
     * Match auquel appartient le message.
     */
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },

    /**
     * Utilisateur qui a envoyé le message.
     */
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /**
     * Contenu du message.
     *
     * 1000 caractères suffisent largement pour une première version mobile-first.
     * Ça évite les très gros messages qui rendent l'interface lourde.
     */
    content: {
      type: String,
      required: [true, "Le contenu du message est obligatoire."],
      trim: true,
      minlength: [1, "Le message ne peut pas être vide."],
      maxlength: [1000, "Le message ne peut pas dépasser 1000 caractères."],
    },

    /**
     * Date de lecture du message.
     */
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index principal pour récupérer rapidement les messages d'un match
 * dans l'ordre chronologique.
 */
MessageSchema.index({
  matchId: 1,
  createdAt: 1,
});

/**
 * Index utile pour la pagination en arrière.
 */
MessageSchema.index({
  matchId: 1,
  createdAt: -1,
});

/**
 * Index utile pour marquer rapidement les messages non lus.
 */
MessageSchema.index({
  matchId: 1,
  senderId: 1,
  readAt: 1,
});

/**
 * Export du modèle compatible avec le hot reload Next.js.
 */
export interface MessageModel extends Model<IMessage> {}

export const Message: MessageModel =
  (models.Message as MessageModel) ||
  mongoose.model<IMessage, MessageModel>("Message", MessageSchema);
