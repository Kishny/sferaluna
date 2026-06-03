// src/app/api/notifications/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { ProfileVisit } from "@/models/ProfileVisit";
import { User } from "@/models/User";
import mongoose from "mongoose";

/**
 * GET /api/notifications
 * Retourne le nombre de notifications non lues depuis lastSeenNotificationsAt.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });

  await connectDB();

  const userId = new mongoose.Types.ObjectId(user.id);
  const dbUser = await User.findById(userId).select("lastSeenNotificationsAt");
  const since = dbUser?.lastSeenNotificationsAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const newMatches = await Match.countDocuments({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    createdAt: { $gte: since },
  });

  const myMatches = await Match.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
  }).select("_id");

  const unreadMessages = await Message.countDocuments({
    matchId: { $in: myMatches.map((m) => m._id) },
    senderId: { $ne: userId },
    createdAt: { $gte: since },
  });

  const newVisits = await ProfileVisit.countDocuments({
    visitedId: userId,
    visitorId: { $ne: userId },
    createdAt: { $gte: since },
  });

  const total = unreadMessages + (newMatches > 0 ? 1 : 0) + (newVisits > 0 ? 1 : 0);

  return NextResponse.json({ total, unreadMessages, newMatches, newVisits });
}

/**
 * POST /api/notifications/seen
 * Marque toutes les notifications comme lues (met à jour lastSeenNotificationsAt).
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;
  if (!user?.id) return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });

  await connectDB();

  await User.findByIdAndUpdate(user.id, {
    lastSeenNotificationsAt: new Date(),
  });

  return NextResponse.json({ success: true });
}
