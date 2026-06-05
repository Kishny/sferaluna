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
 *
 * Mobile-first côté API :
 * - payload léger ;
 * - uniquement les champs nécessaires ;
 * - tri des conversations récentes en premier ;
 * - pas de données sensibles ;
 * - structure prête pour /matches, /messages/[matchId], /mon-compte.
 */

function toObjectIdString(value: unknown) {
  if (!value) return "";

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === "object" && "_id" in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>)._id;

    if (id instanceof mongoose.Types.ObjectId) return id.toString();
    if (typeof id === "string") return id;
  }

  return String(value);
}

/**
 * Retourne l'id de l'autre utilisateur dans un match.
 */
function getOtherUserId(match: any, currentUserId: mongoose.Types.ObjectId) {
  const user1 = toObjectIdString(match.user1Id);
  const user2 = toObjectIdString(match.user2Id);
  const current = currentUserId.toString();

  return user1 === current ? user2 : user1;
}

/**
 * GET /api/matches
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const sessionEmail = session.user.email.toLowerCase().trim();

    const currentUser = await User.findOne({ email: sessionEmail }).select(
      "_id"
    );

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    /**
     * Récupération des matches actifs impliquant l'utilisateur.
     *
     * Tri :
     * - lastMessageAt en premier si conversation déjà active ;
     * - createdAt ensuite pour les nouveaux matches sans message.
     */
    const matches = await Match.find({
      $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      isActive: true,
    })
      .sort({
        lastMessageAt: -1,
        createdAt: -1,
      })
      .lean();

    if (matches.length === 0) {
      return NextResponse.json(
        {
          success: true,
          matches: [],
          metadata: {
            total: 0,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /**
     * On récupère les ids des autres utilisateurs.
     */
    const otherUserIds = matches
      .map((match) => getOtherUserId(match, currentUserId))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    /**
     * On récupère uniquement les champs publics utiles.
     *
     * Pas d'email.
     * Pas de Stripe.
     * Pas de tokens.
     * Pas de réponse secrète.
     */
    const otherUsers = await User.find({
      _id: { $in: otherUserIds },
      banned: { $ne: true },
    })
      .select(
        "_id pseudonyme age localisation interets intentions image identityVerified visibilite hasCompletedProfile updatedAt"
      )
      .lean();

    const usersById = new Map(
      otherUsers.map((user) => [user._id.toString(), user])
    );

    /**
     * Assemblage de la réponse.
     */
    const result = matches.map((match) => {
      const otherId = getOtherUserId(match, currentUserId);
      const otherUser = usersById.get(otherId) ?? null;

      return {
        matchId: toObjectIdString(match._id),
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        lastMessageAt: match.lastMessageAt ?? null,
        isActive: match.isActive,

        /**
         * L'autre utilisateur peut être null si :
         * - compte supprimé ;
         * - compte banni ;
         * - incohérence temporaire en base.
         *
         * Le frontend sait déjà gérer null dans tes pages.
         */
        user: otherUser,
      };
    });

    return NextResponse.json(
      {
        success: true,
        matches: result,
        metadata: {
          total: result.length,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/matches :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
