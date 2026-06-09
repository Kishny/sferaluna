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
import { sendNewMatchPush } from "@/lib/push";

/**
 * Route Likes SferaLuna.
 *
 * POST /api/likes :
 * - like un profil ;
 * - si le like réciproque existe, crée ou réactive un match ;
 * - notifie les deux utilisateurs via Pusher.
 *
 * DELETE /api/likes :
 * - retire un like ;
 * - désactive le match associé si besoin.
 */

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Normalise l'ordre de deux ObjectId.
 *
 * Très important :
 * Pour éviter les doublons de matches, on stocke toujours le plus petit ID
 * en user1Id et le plus grand en user2Id.
 *
 * Exemple :
 * - A like B => user1Id=A, user2Id=B
 * - B like A => user1Id=A, user2Id=B aussi
 */
function normalizeMatchUserIds(
  firstId: mongoose.Types.ObjectId,
  secondId: mongoose.Types.ObjectId
) {
  const first = firstId.toString();
  const second = secondId.toString();

  return first < second
    ? {
        user1Id: firstId,
        user2Id: secondId,
      }
    : {
        user1Id: secondId,
        user2Id: firstId,
      };
}

/**
 * Sélection publique minimale pour les notifications Pusher.
 */
async function getPublicUserProfile(userId: mongoose.Types.ObjectId) {
  return User.findById(userId)
    .select("_id pseudonyme image age localisation identityVerified")
    .lean();
}

/**
 * Récupère l'utilisateur connecté depuis la session.
 */
async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
      user: null,
    };
  }

  const sessionEmail = session.user.email.toLowerCase().trim();

  const user = await User.findOne({ email: sessionEmail }).select(
    "_id pseudonyme image age localisation identityVerified"
  );

  if (!user) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      ),
      user: null,
    };
  }

  return {
    error: null,
    user,
  };
}

/**
 * Notifie les deux utilisateurs qu'un match vient d'être créé/réactivé.
 *
 * Si Pusher échoue, on ne bloque pas la création du match.
 * Le frontend pourra récupérer le match via GET /api/matches.
 */
async function notifyNewMatch({
  matchId,
  currentUserId,
  targetId,
}: {
  matchId: string;
  currentUserId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
}) {
  try {
    const [currentUserProfile, targetUserProfile] = await Promise.all([
      getPublicUserProfile(currentUserId),
      getPublicUserProfile(targetId),
    ]);

    await Promise.all([
      pusher.trigger(`private-user-${currentUserId.toString()}`, "new-match", {
        matchId,
        profile: targetUserProfile,
      }),

      pusher.trigger(`private-user-${targetId.toString()}`, "new-match", {
        matchId,
        profile: currentUserProfile,
      }),
    ]);
  } catch (pusherError) {
    console.error("Erreur notification Pusher new-match :", pusherError);
  }

  // Push notifications (silencieux si échec)
  try {
    const [currentUserProfile, targetUserProfile] = await Promise.all([
      getPublicUserProfile(currentUserId),
      getPublicUserProfile(targetId),
    ]);
    await Promise.all([
      sendNewMatchPush({ recipientUserId: currentUserId.toString(), matchedWithName: targetUserProfile?.pseudonyme ?? "quelqu'un" }),
      sendNewMatchPush({ recipientUserId: targetId.toString(), matchedWithName: currentUserProfile?.pseudonyme ?? "quelqu'un" }),
    ]);
  } catch (pushErr) {
    console.warn("Push notification match échouée :", pushErr);
  }
}

// ─────────────────────────────────────────────
// POST /api/likes
// ─────────────────────────────────────────────

/**
 * POST /api/likes
 *
 * Body :
 * {
 *   targetUserId: string
 * }
 *
 * Réponse :
 * {
 *   success: true,
 *   matched: boolean,
 *   matchId?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    let body: { targetUserId?: unknown } | null = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Body JSON invalide.",
          code: "INVALID_JSON_BODY",
        },
        { status: 400 }
      );
    }

    const targetUserId = body?.targetUserId;

    if (!isValidObjectId(targetUserId)) {
      return NextResponse.json(
        {
          success: false,
          error: "targetUserId invalide.",
          code: "INVALID_TARGET",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const { error, user: currentUser } = await getCurrentUser();

    if (error || !currentUser) return error;

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    /**
     * Impossible de se liker soi-même.
     */
    if (currentUserId.equals(targetId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous ne pouvez pas vous liker vous-même.",
          code: "SELF_LIKE",
        },
        { status: 400 }
      );
    }

    /**
     * Vérifier que la cible existe et que son profil peut être liké.
     *
     * On évite de liker :
     * - un compte inexistant ;
     * - un profil incomplet ;
     * - un compte banni ;
     * - un profil invisible.
     */
    const targetUser = await User.findById(targetId).select(
      "_id hasCompletedProfile banned visibilite role"
    );

    if (
      !targetUser ||
      !targetUser.hasCompletedProfile ||
      targetUser.banned ||
      targetUser.visibilite === "invisible" ||
      (targetUser as any).role === "admin"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil introuvable ou indisponible.",
          code: "TARGET_NOT_AVAILABLE",
        },
        { status: 404 }
      );
    }

    /**
     * Créer le like.
     *
     * Upsert :
     * - si le like existe déjà, on ne crée pas de doublon ;
     * - si le like n'existe pas, on le crée.
     */
    await Like.findOneAndUpdate(
      {
        fromUserId: currentUserId,
        toUserId: targetId,
      },
      {
        $setOnInsert: {
          fromUserId: currentUserId,
          toUserId: targetId,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    /**
     * Vérifier si la cible a déjà liké l'utilisateur courant.
     */
    const reciprocalLike = await Like.findOne({
      fromUserId: targetId,
      toUserId: currentUserId,
    });

    if (!reciprocalLike) {
      return NextResponse.json(
        {
          success: true,
          matched: false,
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
     * Like réciproque détecté.
     * On crée ou réactive le match.
     */
    const { user1Id, user2Id } = normalizeMatchUserIds(
      currentUserId,
      targetId
    );

    /**
     * findOneAndUpdate avec upsert :
     * - crée le match s'il n'existe pas ;
     * - réactive le match s'il existait mais avait été désactivé ;
     * - évite les doublons grâce à l'index unique dans Match.ts.
     */
    const match = await Match.findOneAndUpdate(
      {
        user1Id,
        user2Id,
      },
      {
        $set: {
          isActive: true,
        },
        $setOnInsert: {
          user1Id,
          user2Id,
          lastMessageAt: null,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    const matchId = match._id.toString();

    await notifyNewMatch({
      matchId,
      currentUserId,
      targetId,
    });

    return NextResponse.json(
      {
        success: true,
        matched: true,
        matchId,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/likes :", error);

    const err = error as {
      name?: string;
      code?: number;
      message?: string;
      keyPattern?: Record<string, unknown>;
    };

    /**
     * Cas rare : conflit d'index unique si deux requêtes créent le match
     * exactement en même temps.
     *
     * On pourrait récupérer le match existant, mais ici on renvoie une erreur
     * claire en développement.
     */
    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Action déjà enregistrée.",
          code: "DUPLICATE_ACTION",
          field: err.keyPattern ? Object.keys(err.keyPattern)[0] : null,
        },
        { status: 409 }
      );
    }

    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation MongoDB.",
          code: "DB_VALIDATION_ERROR",
          message:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Données invalides.",
        },
        { status: 400 }
      );
    }

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

// ─────────────────────────────────────────────
// DELETE /api/likes
// ─────────────────────────────────────────────

/**
 * DELETE /api/likes
 *
 * Body :
 * {
 *   targetUserId: string
 * }
 *
 * Retire le like envoyé à un profil.
 *
 * Choix actuel :
 * - si un match existait, on le désactive.
 * - on ne supprime pas physiquement le match pour garder un historique possible.
 */
export async function DELETE(req: NextRequest) {
  try {
    let body: { targetUserId?: unknown } | null = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Body JSON invalide.",
          code: "INVALID_JSON_BODY",
        },
        { status: 400 }
      );
    }

    const targetUserId = body?.targetUserId;

    if (!isValidObjectId(targetUserId)) {
      return NextResponse.json(
        {
          success: false,
          error: "targetUserId invalide.",
          code: "INVALID_TARGET",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const { error, user: currentUser } = await getCurrentUser();

    if (error || !currentUser) return error;

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    if (currentUserId.equals(targetId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Action impossible sur votre propre profil.",
          code: "SELF_ACTION",
        },
        { status: 400 }
      );
    }

    /**
     * Supprimer le like envoyé.
     */
    await Like.deleteOne({
      fromUserId: currentUserId,
      toUserId: targetId,
    });

    /**
     * Désactiver le match associé s'il existe.
     */
    const { user1Id, user2Id } = normalizeMatchUserIds(
      currentUserId,
      targetId
    );

    await Match.findOneAndUpdate(
      {
        user1Id,
        user2Id,
      },
      {
        $set: {
          isActive: false,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur DELETE /api/likes :", error);

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