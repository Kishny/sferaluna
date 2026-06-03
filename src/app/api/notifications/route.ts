// src/app/api/notifications/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { ProfileVisit } from "@/models/ProfileVisit";
import mongoose from "mongoose";

/**
 * GET /api/notifications
 *
 * Retourne le nombre de notifications non lues :
 * - nouveaux matches (7 derniers jours)
 * - nouveaux messages reçus (depuis hier)
 * - nouvelles visites de profil (7 derniers jours)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });
  }

  await connectDB();

  const userId = new mongoose.Types.ObjectId(user.id);
  const since7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Nouveaux matches (7 derniers jours)
  const newMatches = await Match.countDocuments({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    createdAt: { $gte: since7days },
  });

  // Mes matches pour trouver les messages reçus
  const myMatches = await Match.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
  }).select("_id lastMessageAt");

  // Messages reçus des dernières 24h (envoyés par quelqu'un d'autre dans mes matches)
  const matchIds = myMatches.map((m) => m._id);
  const unreadMessages = await Message.countDocuments({
    matchId: { $in: matchIds },
    senderId: { $ne: userId },
    createdAt: { $gte: since24h },
  });

  // Nouvelles visites du profil (7 derniers jours, par d'autres utilisatrices)
  const newVisits = await ProfileVisit.countDocuments({
    visitedId: userId,
    visitorId: { $ne: userId },
    createdAt: { $gte: since7days },
  });

  const total = unreadMessages + (newMatches > 0 ? 1 : 0) + (newVisits > 0 ? 1 : 0);

  return NextResponse.json({
    total,
    unreadMessages,
    newMatches,
    newVisits,
  });
}
