// src/app/api/matches/favorite/route.ts

/**
 * POST /api/matches/favorite  { matchId, favorite: boolean }
 * Ajoute ou retire une conversation (match) des favoris de la membre.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non autorisée." }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { matchId?: string; favorite?: boolean };
  const matchId = String(body.matchId || "");
  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json({ success: false, error: "Match invalide." }, { status: 400 });
  }

  await connectDB();
  const me = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id");
  if (!me) return NextResponse.json({ success: false, error: "Compte introuvable." }, { status: 404 });

  const match = await Match.exists({
    _id: new mongoose.Types.ObjectId(matchId),
    $or: [{ user1Id: me._id }, { user2Id: me._id }],
  });
  if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

  await User.updateOne(
    { _id: me._id },
    body.favorite === false ? { $pull: { favoriteMatches: matchId } } : { $addToSet: { favoriteMatches: matchId } }
  );

  return NextResponse.json({ success: true, favorite: body.favorite !== false });
}
