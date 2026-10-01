// src/lib/explorer-server.ts

/**
 * Helpers serveur communs aux routes /api/explorer/*.
 * Règles de confidentialité appliquées partout :
 * - comptes bannis, admins, profils incomplets exclus ;
 * - blocages dans les deux sens ;
 * - visibilité : public → toutes ; premium → abonnées actives ;
 *   matches → seulement si déjà matchées ; invisible → jamais.
 */

import mongoose from "mongoose";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";

type Oid = mongoose.Types.ObjectId;

export const PUBLIC_PROFILE_FIELDS =
  "_id pseudonyme age localisation departement interets intentions orientation bio image photos identityVerified photoVerified emailVerified lastLoginAt createdAt profession valeurs modeDeVie langues visibilite";

export function toOid(value: unknown): Oid | null {
  const str = String(value ?? "");
  return mongoose.Types.ObjectId.isValid(str) ? new mongoose.Types.ObjectId(str) : null;
}

export interface Viewer {
  _id: Oid;
  age?: number;
  localisation?: string;
  departement?: string;
  interets?: string[];
  intentions?: string[];
  premiumActive: boolean;
  hiddenIds: Oid[];
}

/** Utilisatrice connectée + ids masqués (blocages). null si non connectée. */
export async function getViewer(): Promise<Viewer | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  await connectDB();

  const me = (await User.findOne({ email: session.user.email.toLowerCase().trim() })
    .select("_id age localisation departement interets intentions isPremium subscriptionStatus blockedUsers")
    .lean()) as any;

  if (!me) return null;

  const blockedByMe = ((me.blockedUsers as string[]) || [])
    .map(toOid)
    .filter((id): id is Oid => id !== null);

  const blockedMe = await User.find({ blockedUsers: String(me._id) }).select("_id").lean();

  return {
    _id: me._id as Oid,
    age: me.age,
    localisation: me.localisation,
    departement: me.departement,
    interets: me.interets,
    intentions: me.intentions,
    premiumActive:
      me.isPremium === true && (me.subscriptionStatus === "active" || me.subscriptionStatus === "trialing"),
    hiddenIds: [...blockedByMe, ...blockedMe.map((doc: any) => doc._id as Oid)],
  };
}

/** Filtre Mongo « profils découvrables » pour cette utilisatrice. */
export function discoverableQuery(viewer: Viewer, extra: Record<string, unknown> = {}) {
  return {
    _id: { $ne: viewer._id, $nin: viewer.hiddenIds },
    hasCompletedProfile: true,
    consentement: true,
    banned: { $ne: true },
    role: { $ne: "admin" },
    visibilite: viewer.premiumActive ? { $in: ["public", "premium"] } : { $in: ["public"] },
    ...extra,
  };
}

/** Statut de relation avec une liste de profils : liké par moi, m'a likée, match. */
export async function relationStatus(viewer: Viewer, ids: Oid[]) {
  if (ids.length === 0) {
    return { likedByMe: new Set<string>(), likedMe: new Set<string>(), matches: new Map<string, string>() };
  }

  const [mine, theirs, matches] = await Promise.all([
    Like.find({ fromUserId: viewer._id, toUserId: { $in: ids } }).select("toUserId").lean(),
    Like.find({ fromUserId: { $in: ids }, toUserId: viewer._id }).select("fromUserId").lean(),
    Match.find({
      isActive: true,
      $or: [
        { user1Id: viewer._id, user2Id: { $in: ids } },
        { user2Id: viewer._id, user1Id: { $in: ids } },
      ],
    })
      .select("_id user1Id user2Id")
      .lean(),
  ]);

  const matchMap = new Map<string, string>();
  matches.forEach((m: any) => {
    const other = String(m.user1Id) === String(viewer._id) ? String(m.user2Id) : String(m.user1Id);
    matchMap.set(other, String(m._id));
  });

  return {
    likedByMe: new Set(mine.map((l: any) => String(l.toUserId))),
    likedMe: new Set(theirs.map((l: any) => String(l.fromUserId))),
    matches: matchMap,
  };
}

/** Version publique d'un profil (sans date de connexion exacte ni visibilité). */
export function publicProfile(doc: any) {
  const { lastLoginAt, visibilite, ...rest } = doc;
  const photos: string[] = Array.isArray(doc.photos) ? doc.photos.filter(Boolean) : [];
  const gallery = [doc.image, ...photos].filter(
    (url: string | undefined, index: number, all: (string | undefined)[]) => url && all.indexOf(url) === index
  ) as string[];

  return {
    ...rest,
    _id: String(doc._id),
    gallery,
    recentlyActive: lastLoginAt ? Date.now() - new Date(lastLoginAt).getTime() < 7 * 24 * 60 * 60 * 1000 : false,
  };
}
