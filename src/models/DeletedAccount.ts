// src/models/DeletedAccount.ts

/**
 * Corbeille des comptes supprimés par un admin.
 *
 * Quand un admin supprime une utilisatrice, son compte et ses données quittent
 * le site tout de suite mais sont copiés ici, pour pouvoir être restaurés
 * pendant RETENTION_DAYS jours. Passé ce délai, la copie est effacée pour de
 * bon (voir src/lib/account-trash.ts).
 *
 * Les comptes supprimés par les membres elles-mêmes ne passent PAS par ici :
 * ils sont effacés immédiatement, comme promis dans la politique de
 * confidentialité.
 *
 * - DeletedAccount : une fiche par compte (ce que l'admin voit dans la liste,
 *   plus le document User d'origine, tel quel).
 * - DeletedAccountChunk : les données liées (likes, matchs, messages…), par
 *   paquets, pour rester sous la limite de taille d'un document MongoDB.
 */

import mongoose, { Schema, Document, Model, Types } from "mongoose";

export const RETENTION_DAYS = 60;

export interface IDeletedAccount extends Document {
  originalId: Types.ObjectId;
  email: string;
  pseudonyme: string;
  image?: string | null;
  plan?: string | null;
  memberSince?: Date | null;
  deletedAt: Date;
  purgeAt: Date;
  deletedByAdminId?: Types.ObjectId | null;
  deletedByAdminEmail?: string | null;
  counts: Record<string, number>;
  /** Événements dont elle a été retirée des inscrites (réinscrite à la restauration). */
  eventIds: Types.ObjectId[];
  /** Document User d'origine, tel qu'il était en base. */
  user: Record<string, unknown>;
}

const DeletedAccountSchema = new Schema<IDeletedAccount>(
  {
    originalId: { type: Schema.Types.ObjectId, required: true, unique: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    pseudonyme: { type: String, default: "" },
    image: { type: String, default: null },
    plan: { type: String, default: null },
    memberSince: { type: Date, default: null },
    deletedAt: { type: Date, required: true },
    purgeAt: { type: Date, required: true, index: true },
    deletedByAdminId: { type: Schema.Types.ObjectId, default: null },
    deletedByAdminEmail: { type: String, default: null },
    counts: { type: Schema.Types.Mixed, default: {} },
    eventIds: [{ type: Schema.Types.ObjectId }],
    user: { type: Schema.Types.Mixed, required: true },
  },
  { minimize: false }
);

export interface IDeletedAccountChunk extends Document {
  accountId: Types.ObjectId;
  /** Nom du modèle d'origine : "Like", "Match", "Message"… */
  kind: string;
  docs: Record<string, unknown>[];
}

// Schéma non typé : `docs` contient des documents bruts de plusieurs modèles.
const DeletedAccountChunkSchema = new Schema({
  accountId: { type: Schema.Types.ObjectId, required: true, index: true },
  kind: { type: String, required: true },
  docs: { type: [Schema.Types.Mixed], default: [] },
});

export const DeletedAccount: Model<IDeletedAccount> =
  mongoose.models.DeletedAccount ||
  mongoose.model<IDeletedAccount>("DeletedAccount", DeletedAccountSchema);

export const DeletedAccountChunk: Model<IDeletedAccountChunk> =
  mongoose.models.DeletedAccountChunk ||
  mongoose.model<IDeletedAccountChunk>("DeletedAccountChunk", DeletedAccountChunkSchema);
