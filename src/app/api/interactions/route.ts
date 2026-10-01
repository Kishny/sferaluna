// src/app/api/interactions/route.ts

/**
 * GET /api/interactions
 *
 * Données de « Mes interactions » qui ne sont pas déjà servies ailleurs :
 * - likesReceived : membres qui vous ont likée, sans match pour l'instant ;
 * - likesSent     : vos likes envoyés (historique), avec leur statut ;
 * - counts        : likes reçus / envoyés, messages échangés dans vos matchs.
 *
 * Exclus partout : comptes bannis, admins, membres bloquées (dans les deux sens).
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";

export const dynamic = "force-dynamic";

const PUBLIC_FIELDS = "_id pseudonyme age localisation departement image interets photoVerified identityVerified lastLoginAt";
const WEEK = 7 * 24 * 60 * 60 * 1000;

function publicUser(u: any) {
  const { lastLoginAt, ...rest } = u;
  return {
    ...rest,
    _id: String(u._id),
    recentlyActive: lastLoginAt ? Date.now() - new Date(lastLoginAt).getTime() < WEEK : false,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisée." }, { status: 401 });
    }

    await connectDB();
    const me = (await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id blockedUsers").lean()) as any;
    if (!me) return NextResponse.json({ success: false, error: "Compte introuvable." }, { status: 404 });

    const meId = me._id as mongoose.Types.ObjectId;
    const blockedMe = await User.find({ blockedUsers: String(meId) }).distinct("_id");
    const excluded = new Set<string>([...(me.blockedUsers ?? []).map(String), ...blockedMe.map(String)]);

    const matches = await Match.find({ isActive: true, $or: [{ user1Id: meId }, { user2Id: meId }] })
      .select("_id user1Id user2Id")
      .lean();
    const matchedIds = new Set(matches.map((m: any) => (String(m.user1Id) === String(meId) ? String(m.user2Id) : String(m.user1Id))));

    const [received, sent, exchanges] = await Promise.all([
      Like.find({ toUserId: meId }).sort({ createdAt: -1 }).limit(200).select("fromUserId createdAt").lean(),
      Like.find({ fromUserId: meId }).sort({ createdAt: -1 }).limit(100).select("toUserId createdAt").lean(),
      matches.length ? Message.countDocuments({ matchId: { $in: matches.map((m: any) => m._id) } }) : Promise.resolve(0),
    ]);

    const receivedPending = received.filter((l: any) => !matchedIds.has(String(l.fromUserId)) && !excluded.has(String(l.fromUserId)));
    const sentVisible = sent.filter((l: any) => !excluded.has(String(l.toUserId)));

    const ids = [...new Set([...receivedPending.map((l: any) => String(l.fromUserId)), ...sentVisible.map((l: any) => String(l.toUserId))])];
    const users = ids.length
      ? await User.find({ _id: { $in: ids }, banned: { $ne: true }, role: { $ne: "admin" } }).select(PUBLIC_FIELDS).lean()
      : [];
    const byId = new Map(users.map((u: any) => [String(u._id), publicUser(u)]));

    const likesReceived = receivedPending
      .filter((l: any) => byId.has(String(l.fromUserId)))
      .map((l: any) => ({ likedAt: l.createdAt, user: byId.get(String(l.fromUserId)) }));

    const likesSent = sentVisible
      .filter((l: any) => byId.has(String(l.toUserId)))
      .map((l: any) => ({
        likedAt: l.createdAt,
        matched: matchedIds.has(String(l.toUserId)),
        user: byId.get(String(l.toUserId)),
      }));

    return NextResponse.json(
      {
        success: true,
        likesReceived,
        likesSent,
        counts: { likesReceived: likesReceived.length, likesSent: likesSent.length, exchanges },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/interactions :", error);
    return NextResponse.json({ success: false, error: "Impossible de charger vos interactions." }, { status: 500 });
  }
}
