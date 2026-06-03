// src/app/api/matches/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";

/**
 * GET /api/matches
 *
 * Retourne tous les matches actifs de l'utilisateur connecté,
 * avec les infos publiques de l'autre utilisateur.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    await connectDB();

    const sessionEmail = session.user.email.toLowerCase().trim();
    const currentUser = await User.findOne({ email: sessionEmail }).select("_id");

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    // Récupérer tous les matchs actifs impliquant l'utilisateur
    const matches = await Match.find({
      $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      isActive: true,
    })
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    if (matches.length === 0) {
      return NextResponse.json({ success: true, matches: [] }, { status: 200 });
    }

    // Récupérer les IDs des autres utilisateurs
    const otherUserIds = matches.map((m) =>
      m.user1Id.equals(currentUserId) ? m.user2Id : m.user1Id
    );

    const otherUsers = await User.find({ _id: { $in: otherUserIds } })
      .select("_id pseudonyme age localisation interets intentions image updatedAt")
      .lean();

    const usersById = new Map(otherUsers.map((u) => [u._id.toString(), u]));

    // Assembler la réponse
    const result = matches.map((m) => {
      const otherId = m.user1Id.equals(currentUserId)
        ? m.user2Id.toString()
        : m.user1Id.toString();

      const otherUser = usersById.get(otherId);

      return {
        matchId: (m._id as mongoose.Types.ObjectId).toString(),
        createdAt: m.createdAt,
        lastMessageAt: m.lastMessageAt,
        user: otherUser ?? null,
      };
    });

    return NextResponse.json(
      { success: true, matches: result },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/matches :", error);
    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
