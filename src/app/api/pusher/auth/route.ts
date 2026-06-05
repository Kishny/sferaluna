// src/app/api/pusher/auth/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { pusher } from "@/lib/pusher";
import { User } from "@/models/User";
import { Match } from "@/models/Match";

/**
 * POST /api/pusher/auth
 *
 * Route appelée automatiquement par pusher-js quand le client veut s'abonner
 * à un canal privé.
 *
 * Canaux utilisés dans SferaLuna :
 * - private-user-{userId}
 * - private-match-{matchId}
 *
 * Sécurité :
 * - utilisateur connecté obligatoire ;
 * - compte non banni ;
 * - private-user-{userId} : seul l'utilisateur lui-même peut s'abonner ;
 * - private-match-{matchId} : seuls les deux participants du match actif peuvent s'abonner.
 *
 * Mobile-first :
 * - route légère ;
 * - pas de gros payload ;
 * - une seule vérification MongoDB utilisateur ;
 * - une seule vérification MongoDB match si nécessaire.
 */

export const runtime = "nodejs";

// ─────────────────────────────────────────────
// Helpers réponse
// ─────────────────────────────────────────────

function jsonError({
  error,
  code,
  status,
}: {
  error: string;
  code: string;
  status: number;
}) {
  return NextResponse.json(
    {
      success: false,
      error,
      code,
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

// ─────────────────────────────────────────────
// Session utilisateur
// ─────────────────────────────────────────────

/**
 * Récupère proprement l'utilisateur connecté en base.
 *
 * Important :
 * On ne se base pas seulement sur session.user.id, car selon la config NextAuth,
 * l'id peut parfois ne pas être présent dans la session.
 *
 * L'email reste donc la source fiable côté session.
 */
async function getCurrentUserFromSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      user: null,
      response: jsonError({
        error: "Non autorisé.",
        code: "UNAUTHORIZED",
        status: 401,
      }),
    };
  }

  await connectDB();

  const email = session.user.email.toLowerCase().trim();

  const user = await User.findOne({ email }).select("_id banned");

  if (!user) {
    return {
      user: null,
      response: jsonError({
        error: "Utilisateur introuvable.",
        code: "USER_NOT_FOUND",
        status: 404,
      }),
    };
  }

  if (user.banned) {
    return {
      user: null,
      response: jsonError({
        error: "Compte suspendu.",
        code: "ACCOUNT_BANNED",
        status: 403,
      }),
    };
  }

  return {
    user,
    response: null,
  };
}

// ─────────────────────────────────────────────
// Body Pusher
// ─────────────────────────────────────────────

/**
 * Lit le body envoyé par Pusher.
 *
 * Pusher envoie généralement :
 * socket_id=xxx&channel_name=private-xxx
 *
 * On utilise req.text() + URLSearchParams.
 */
async function readPusherAuthBody(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  return {
    socketId: params.get("socket_id"),
    channelName: params.get("channel_name"),
  };
}

/**
 * Vérifie que le nom du canal est un canal privé supporté.
 */
function isSupportedPrivateChannel(channelName: string) {
  return (
    channelName.startsWith("private-user-") ||
    channelName.startsWith("private-match-")
  );
}

/**
 * Extrait l'id après un préfixe de canal.
 *
 * Exemple :
 * private-user-65fabc -> 65fabc
 */
function extractChannelId(channelName: string, prefix: string) {
  return channelName.replace(prefix, "").trim();
}

// ─────────────────────────────────────────────
// Autorisation private-user
// ─────────────────────────────────────────────

/**
 * Vérifie l'accès au canal privé utilisateur.
 *
 * Canal attendu :
 * private-user-{userId}
 */
function authorizePrivateUserChannel({
  channelName,
  currentUserId,
}: {
  channelName: string;
  currentUserId: string;
}) {
  const channelUserId = extractChannelId(channelName, "private-user-");

  /**
   * Sécurité supplémentaire :
   * on refuse les IDs invalides.
   */
  if (!mongoose.Types.ObjectId.isValid(channelUserId)) {
    return {
      authorized: false,
      code: "INVALID_USER_CHANNEL",
    };
  }

  if (channelUserId !== currentUserId) {
    return {
      authorized: false,
      code: "USER_CHANNEL_FORBIDDEN",
    };
  }

  return {
    authorized: true,
    code: "AUTHORIZED",
  };
}

// ─────────────────────────────────────────────
// Autorisation private-match
// ─────────────────────────────────────────────

/**
 * Vérifie l'accès au canal privé match.
 *
 * Canal attendu :
 * private-match-{matchId}
 *
 * Seuls user1Id et user2Id peuvent s'abonner à private-match-{matchId}.
 */
async function authorizePrivateMatchChannel({
  channelName,
  currentUserId,
}: {
  channelName: string;
  currentUserId: mongoose.Types.ObjectId;
}) {
  const matchId = extractChannelId(channelName, "private-match-");

  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    return {
      authorized: false,
      code: "INVALID_MATCH_CHANNEL",
    };
  }

  const match = await Match.findOne({
    _id: new mongoose.Types.ObjectId(matchId),
    isActive: true,
    $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
  }).select("_id");

  if (!match) {
    return {
      authorized: false,
      code: "MATCH_CHANNEL_FORBIDDEN",
    };
  }

  return {
    authorized: true,
    code: "AUTHORIZED",
  };
}

// ─────────────────────────────────────────────
// POST /api/pusher/auth
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { user, response } = await getCurrentUserFromSession();

    if (response || !user) return response;

    const { socketId, channelName } = await readPusherAuthBody(req);

    if (!socketId || !channelName) {
      return jsonError({
        error: "Paramètres Pusher manquants.",
        code: "MISSING_PUSHER_PARAMS",
        status: 400,
      });
    }

    if (!isSupportedPrivateChannel(channelName)) {
      return jsonError({
        error: "Canal Pusher non autorisé.",
        code: "UNSUPPORTED_CHANNEL",
        status: 403,
      });
    }

    const currentUserId = user._id as mongoose.Types.ObjectId;
    const currentUserIdString = currentUserId.toString();

    let authorizationResult: {
      authorized: boolean;
      code: string;
    } = {
      authorized: false,
      code: "CHANNEL_FORBIDDEN",
    };

    /**
     * Canal privé utilisateur.
     *
     * Exemple :
     * private-user-65f...
     */
    if (channelName.startsWith("private-user-")) {
      authorizationResult = authorizePrivateUserChannel({
        channelName,
        currentUserId: currentUserIdString,
      });
    }

    /**
     * Canal privé match.
     *
     * Exemple :
     * private-match-65f...
     */
    if (channelName.startsWith("private-match-")) {
      authorizationResult = await authorizePrivateMatchChannel({
        channelName,
        currentUserId,
      });
    }

    if (!authorizationResult.authorized) {
      return jsonError({
        error: "Accès refusé à ce canal.",
        code: authorizationResult.code,
        status: 403,
      });
    }

    /**
     * Pusher signe l'autorisation.
     *
     * Important :
     * Pour les private channels, authorizeChannel suffit.
     * Pour les presence channels, il faudrait authorizeChannel avec userData.
     */
    const authResponse = pusher.authorizeChannel(socketId, channelName);

    return NextResponse.json(authResponse, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Erreur POST /api/pusher/auth :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur Pusher.",
        code: "PUSHER_AUTH_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
