// src/app/api/likes/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";
import { pusher } from "@/lib/pusher";

/**
 * POST /api/likes
 *
 * Like un profil. Si l'autre a déjà liké, crée un match mutuel.
 *
 * Body : { targetUserId: string }
 *
 * Réponse :
 * { success: true, matched: boolean, matchId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { success: false, error: "targetUserId invalide.", code: "INVALID_TARGET" },
        { status: 400 }
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
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    // Impossible de se liker soi-même
    if (currentUserId.equals(targetId)) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas vous liker vous-même.", code: "SELF_LIKE" },
        { status: 400 }
      );
    }

    // Vérifier que la cible existe
    const targetUser = await User.findById(targetId).select("_id hasCompletedProfile");
    if (!targetUser || !targetUser.hasCompletedProfile) {
      return NextResponse.json(
        { success: false, error: "Profil introuvable.", code: "TARGET_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Créer le like (upsert pour éviter les doublons)
    await Like.findOneAndUpdate(
      { fromUserId: currentUserId, toUserId: targetId },
      { fromUserId: currentUserId, toUserId: targetId },
      { upsert: true, new: true }
    );

    // Vérifier si la cible a déjà liké l'utilisateur courant
    const reciprocalLike = await Like.findOne({
      fromUserId: targetId,
      toUserId: currentUserId,
    });

    if (!reciprocalLike) {
      // Pas encore de match mutuel
      return NextResponse.json({ success: true, matched: false }, { status: 200 });
    }

    // Match mutuel détecté — créer le match si pas encore fait
    // On normalise l'ordre pour éviter les doublons (plus petit ID = user1)
    const [user1Id, user2Id] = currentUserId < targetId
      ? [currentUserId, targetId]
      : [targetId, currentUserId];

    const existingMatch = await Match.findOne({ user1Id, user2Id });

    if (existingMatch) {
      return NextResponse.json(
        { success: true, matched: true, matchId: existingMatch._id.toString() },
        { status: 200 }
      );
    }

    const newMatch = await Match.create({ user1Id, user2Id });

      user1: user1Id.toString(),
      user2: user2Id.toString(),
      matchId: newMatch._id.toString(),
    });

    // Notifier les deux utilisateurs via Pusher
    const matchId = newMatch._id.toString();
    try {
      // Profil de l'utilisateur courant (pour notifier l'autre)
      const currentUserProfile = await User.findById(currentUserId).select(
        "pseudonyme image age localisation"
      );
      // Profil de la cible (pour notifier l'utilisateur courant)
      const partnerProfile = await User.findById(targetId).select(
        "pseudonyme image age localisation"
      );

      await Promise.all([
        pusher.trigger(`private-user-${user1Id.toString()}`, "new-match", {
          matchId,
          profile:
            user1Id.equals(currentUserId) ? partnerProfile : currentUserProfile,
        }),
        pusher.trigger(`private-user-${user2Id.toString()}`, "new-match", {
          matchId,
          profile:
            user2Id.equals(currentUserId) ? partnerProfile : currentUserProfile,
        }),
      ]);
    } catch (pusherErr) {
    }

    return NextResponse.json(
      { success: true, matched: true, matchId },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/likes :", error);
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

/**
 * DELETE /api/likes
 *
 * Retire un like (unlike).
 *
 * Body : { targetUserId: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetUserId } = body;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json(
        { success: false, error: "targetUserId invalide.", code: "INVALID_TARGET" },
        { status: 400 }
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
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    await Like.deleteOne({ fromUserId: currentUserId, toUserId: targetId });

    // Désactiver le match associé s'il existe
    const [user1Id, user2Id] = currentUserId < targetId
      ? [currentUserId, targetId]
      : [targetId, currentUserId];

    await Match.findOneAndUpdate({ user1Id, user2Id }, { $set: { isActive: false } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erreur DELETE /api/likes :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
