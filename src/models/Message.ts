// src/models/Message.ts

import mongoose, { Schema, Document, Model, models } from "mongoose";

/**
 * Message privé échangé dans un match.
 *
 * Un message appartient à un Match et a un expéditeur.
 * Le champ readAt permet de gérer les accusés de lecture (feature premium).
 */
export interface IMessage extends Document {
  matchId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, "Le contenu du message est obligatoire."],
      trim: true,
      maxlength: [2000, "Le message ne peut pas dépasser 2000 caractères."],
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index pour récupérer les messages d'un match triés par date
MessageSchema.index({ matchId: 1, createdAt: 1 });

export interface MessageModel extends Model<IMessage> {}

export const Message: MessageModel =
  (models.Message as MessageModel) ||
  mongoose.model<IMessage, MessageModel>("Message", MessageSchema);
