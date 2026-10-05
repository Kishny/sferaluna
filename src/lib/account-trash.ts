// src/lib/account-trash.ts

/**
 * Corbeille des comptes supprimés par un admin : mise en corbeille,
 * restauration, effacement définitif.
 *
 * Principe : le compte et ses données sont retirés des collections du site
 * (rien à filtrer ailleurs, la membre disparaît exactement comme avant) et
 * copiés tels quels dans DeletedAccount / DeletedAccountChunk. La restauration
 * réinsère ces copies avec leurs identifiants d'origine.
 *
 * On passe par le pilote natif (`Model.collection`) pour lire et réécrire les
 * documents bruts : tous les champs sont conservés, y compris ceux que les
 * schémas masquent par défaut (mot de passe haché, etc.).
 *
 * Jamais mis en corbeille : le selfie de vérification (donnée biométrique),
 * effacé tout de suite. Les photos et vidéos restent sur Cloudinary tant que
 * le compte est en corbeille, et sont supprimées à l'effacement définitif.
 */

import mongoose, { type Model, Types } from "mongoose";

import cloudinary from "@/lib/cloudinary";
import { Boost } from "@/models/Boost";
import { CommunityPost } from "@/models/CommunityPost";
import { DeletedAccount, DeletedAccountChunk, RETENTION_DAYS } from "@/models/DeletedAccount";
import { JournalEntry } from "@/models/JournalEntry";
import { Like } from "@/models/Like";
import { LunaEvent } from "@/models/LunaEvent";
import { Match } from "@/models/Match";
import { MentorPost } from "@/models/MentorPost";
import { Message } from "@/models/Message";
import { PhotoVerification } from "@/models/PhotoVerification";
import { ProfileVisit } from "@/models/ProfileVisit";
import { Testimonial } from "@/models/Testimonial";
import { User } from "@/models/User";
import { VibePlan } from "@/models/VibePlan";
import { VibePost } from "@/models/VibePost";

type Raw = Record<string, unknown>;
// Les modèles ont chacun leur type de document : on ne manipule ici que leur collection brute.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

const DAY_MS = 24 * 60 * 60 * 1000;
const CHUNK_SIZE = 200;

const raw = (model: AnyModel) => model.collection;
const sameId = (a: unknown, b: unknown) => String(a) === String(b);

/** Données liées à un compte : modèle + filtre, à partir de son id et de ses matchs. */
function relatedSources(userId: Types.ObjectId, matchIds: Types.ObjectId[]): { kind: string; model: AnyModel; filter: Raw }[] {
  return [
    { kind: "Like", model: Like, filter: { $or: [{ fromUserId: userId }, { toUserId: userId }] } },
    { kind: "Match", model: Match, filter: { $or: [{ user1Id: userId }, { user2Id: userId }] } },
    // Toute la conversation (les deux côtés), pour la retrouver entière à la restauration.
    { kind: "Message", model: Message, filter: { $or: [{ matchId: { $in: matchIds } }, { senderId: userId }] } },
    { kind: "VibePlan", model: VibePlan, filter: { $or: [{ matchId: { $in: matchIds } }, { proposedById: userId }] } },
    { kind: "ProfileVisit", model: ProfileVisit, filter: { $or: [{ visitorId: userId }, { visitedId: userId }] } },
    { kind: "VibePost", model: VibePost, filter: { userId } },
    { kind: "CommunityPost", model: CommunityPost, filter: { userId } },
    { kind: "MentorPost", model: MentorPost, filter: { userId } },
    { kind: "JournalEntry", model: JournalEntry, filter: { userId } },
    { kind: "Boost", model: Boost, filter: { userId } },
    { kind: "Testimonial", model: Testimonial, filter: { userId } },
  ];
}

const MODELS: Record<string, AnyModel> = {
  Like,
  Match,
  Message,
  VibePlan,
  ProfileVisit,
  VibePost,
  CommunityPost,
  MentorPost,
  JournalEntry,
  Boost,
  Testimonial,
};

/** Insère en ignorant les doublons (restauration relancée après une interruption). */
async function insertIgnoringDuplicates(model: AnyModel, docs: Raw[]) {
  if (docs.length === 0) return;
  try {
    await raw(model).insertMany(docs, { ordered: false });
  } catch (error) {
    const e = error as { code?: number; writeErrors?: { code?: number; err?: { code?: number } }[] };
    const errors = Array.isArray(e.writeErrors) ? e.writeErrors : [];
    const onlyDuplicates = errors.length > 0 ? errors.every((w) => (w.code ?? w.err?.code) === 11000) : e.code === 11000;
    if (!onlyDuplicates) throw error;
  }
}

// ─────────────────────────────────────────────
// Mise en corbeille
// ─────────────────────────────────────────────

export async function moveAccountToTrash(userId: string | Types.ObjectId, admin?: { id?: string | null; email?: string | null }) {
  const _id = new Types.ObjectId(String(userId));

  const userDoc = (await raw(User).findOne({ _id })) as Raw | null;
  if (!userDoc) return null;

  const now = new Date();

  // Une fiche par compte. Si une mise en corbeille précédente a été
  // interrompue, on complète la fiche existante au lieu d'en créer une autre.
  const account = await DeletedAccount.findOneAndUpdate(
    { originalId: _id },
    {
      $set: {
        email: String(userDoc.email ?? "").toLowerCase(),
        pseudonyme: String(userDoc.pseudonyme ?? ""),
        image: (userDoc.image as string) ?? null,
        plan: (userDoc.plan as string) ?? null,
        memberSince: (userDoc.createdAt as Date) ?? null,
        deletedAt: now,
        purgeAt: new Date(now.getTime() + RETENTION_DAYS * DAY_MS),
        deletedByAdminId: admin?.id ? new Types.ObjectId(String(admin.id)) : null,
        deletedByAdminEmail: admin?.email ?? null,
        user: userDoc,
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  const matches = (await raw(Match)
    .find({ $or: [{ user1Id: _id }, { user2Id: _id }] }, { projection: { _id: 1 } })
    .toArray()) as { _id: Types.ObjectId }[];
  const matchIds = matches.map((m) => m._id);

  const sources = relatedSources(_id, matchIds);
  const counts: Record<string, number> = { ...(account.counts ?? {}) };

  // 1. Copier. Rien n'est retiré du site tant que la copie n'est pas écrite.
  for (const { kind, model, filter } of sources) {
    const docs = (await raw(model).find(filter).toArray()) as Raw[];
    counts[kind] = (counts[kind] ?? 0) + docs.length;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      await raw(DeletedAccountChunk).insertOne({ accountId: account._id, kind, docs: docs.slice(i, i + CHUNK_SIZE) });
    }
  }

  const events = (await raw(LunaEvent).find({ attendees: _id }, { projection: { _id: 1 } }).toArray()) as { _id: Types.ObjectId }[];
  await DeletedAccount.updateOne(
    { _id: account._id },
    { $set: { counts }, $addToSet: { eventIds: { $each: events.map((e) => e._id) } } }
  );

  // 2. Retirer du site. Le document User part en dernier.
  for (const { model, filter } of sources) await raw(model).deleteMany(filter);
  await raw(LunaEvent).updateMany({ attendees: _id }, { $pull: { attendees: _id } } as never);
  await raw(PhotoVerification).deleteMany({ userId: _id });
  await raw(User).deleteOne({ _id });

  return { id: String(account._id), email: account.email, pseudonyme: account.pseudonyme, purgeAt: account.purgeAt };
}

// ─────────────────────────────────────────────
// Restauration
// ─────────────────────────────────────────────

export type RestoreResult =
  | { ok: true; email: string; pseudonyme: string; skipped: number }
  | { ok: false; code: "NOT_FOUND" | "EMAIL_IN_USE"; error: string };

export async function restoreAccount(accountId: string): Promise<RestoreResult> {
  if (!mongoose.isValidObjectId(accountId)) return { ok: false, code: "NOT_FOUND", error: "Compte introuvable dans la corbeille." };

  const account = await DeletedAccount.findById(accountId).lean();
  if (!account) return { ok: false, code: "NOT_FOUND", error: "Compte introuvable dans la corbeille." };

  const userId = account.originalId;

  // Entre-temps, quelqu'un a pu recréer un compte avec la même adresse.
  const emailOwner = (await raw(User).findOne({ email: account.email }, { projection: { _id: 1 } })) as Raw | null;
  if (emailOwner && !sameId(emailOwner._id, userId)) {
    return {
      ok: false,
      code: "EMAIL_IN_USE",
      error: `Un autre compte utilise maintenant l'adresse ${account.email}. Restauration impossible tant qu'il existe.`,
    };
  }

  if (!emailOwner) await raw(User).insertOne(account.user as Raw);

  const chunks = (await raw(DeletedAccountChunk).find({ accountId: account._id }).toArray()) as unknown as { kind: string; docs: Raw[] }[];
  const byKind: Record<string, Raw[]> = {};
  for (const chunk of chunks) (byKind[chunk.kind] ||= []).push(...(chunk.docs ?? []));

  // Les liens vers des membres supprimées depuis ne sont pas restaurés.
  const otherOf = (doc: Raw, a: string, b: string) => (sameId(doc[a], userId) ? doc[b] : doc[a]);
  const pairs: Record<string, [string, string]> = {
    Like: ["fromUserId", "toUserId"],
    Match: ["user1Id", "user2Id"],
    ProfileVisit: ["visitorId", "visitedId"],
  };

  const otherIds = new Map<string, unknown>();
  for (const [kind, [a, b]] of Object.entries(pairs)) {
    for (const doc of byKind[kind] ?? []) {
      const other = otherOf(doc, a, b);
      otherIds.set(String(other), other);
    }
  }
  const alive = new Set(
    ((await raw(User).find({ _id: { $in: [...otherIds.values()] } } as never, { projection: { _id: 1 } }).toArray()) as Raw[]).map((u) => String(u._id))
  );

  let skipped = 0;
  const keep = (kind: string, test: (doc: Raw) => boolean) => {
    const all = byKind[kind] ?? [];
    const kept = all.filter(test);
    skipped += all.length - kept.length;
    byKind[kind] = kept;
  };

  for (const [kind, [a, b]] of Object.entries(pairs)) keep(kind, (doc) => alive.has(String(otherOf(doc, a, b))));

  const matchIds = new Set((byKind.Match ?? []).map((m) => String(m._id)));
  keep("Message", (doc) => matchIds.has(String(doc.matchId)));
  keep("VibePlan", (doc) => matchIds.has(String(doc.matchId)));

  for (const [kind, docs] of Object.entries(byKind)) {
    const model = MODELS[kind];
    if (model) await insertIgnoringDuplicates(model, docs);
  }

  if (account.eventIds?.length) {
    await raw(LunaEvent).updateMany({ _id: { $in: account.eventIds } }, { $addToSet: { attendees: userId } } as never);
  }

  // La copie n'est retirée qu'une fois tout réinséré.
  await DeletedAccountChunk.deleteMany({ accountId: account._id });
  await DeletedAccount.deleteOne({ _id: account._id });

  return { ok: true, email: account.email, pseudonyme: account.pseudonyme, skipped };
}

// ─────────────────────────────────────────────
// Effacement définitif
// ─────────────────────────────────────────────

function cloudinaryPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : null;
}

/** Supprime les photos et vidéos de profil hébergées sur Cloudinary. */
async function destroyMedia(user: Raw) {
  const photos = [user.image, ...((user.photos as unknown[]) ?? [])].filter((u): u is string => typeof u === "string" && u.length > 0);
  const videos = ((user.videos as { publicId?: string }[]) ?? []).map((v) => v?.publicId).filter((id): id is string => Boolean(id));

  await Promise.allSettled([
    ...photos.map((url) => {
      const publicId = cloudinaryPublicId(url);
      return publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
    }),
    ...videos.map((publicId) => cloudinary.uploader.destroy(publicId, { resource_type: "video" })),
  ]);
}

export async function purgeAccount(accountId: string) {
  if (!mongoose.isValidObjectId(accountId)) return false;

  const account = await DeletedAccount.findById(accountId).lean();
  if (!account) return false;

  await destroyMedia((account.user ?? {}) as Raw);
  await DeletedAccountChunk.deleteMany({ accountId: account._id });
  await DeletedAccount.deleteOne({ _id: account._id });
  return true;
}

/** Efface les comptes dont le délai de conservation est dépassé. Renvoie leur nombre. */
export async function purgeExpiredAccounts(now = new Date()) {
  const expired = await DeletedAccount.find({ purgeAt: { $lte: now } }).select("_id").lean();
  let purged = 0;
  for (const { _id } of expired) {
    if (await purgeAccount(String(_id))) purged += 1;
  }
  return purged;
}

/** Liste de la corbeille, de la suppression la plus récente à la plus ancienne. */
export async function listTrash(now = new Date()) {
  const accounts = await DeletedAccount.find({}).select("-user").sort({ deletedAt: -1 }).lean();

  return accounts.map((a) => ({
    id: String(a._id),
    email: a.email,
    pseudonyme: a.pseudonyme,
    image: a.image ?? null,
    plan: a.plan ?? null,
    memberSince: a.memberSince ?? null,
    deletedAt: a.deletedAt,
    purgeAt: a.purgeAt,
    daysLeft: Math.max(0, Math.ceil((new Date(a.purgeAt).getTime() - now.getTime()) / DAY_MS)),
    deletedByAdminEmail: a.deletedByAdminEmail ?? null,
    counts: a.counts ?? {},
  }));
}
