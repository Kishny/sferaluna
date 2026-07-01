// src/app/api/messages/[matchId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { Report } from "@/models/Report";
import { pusher } from "@/lib/pusher";
import { sendNewMessagePush } from "@/lib/push";
import { moderateText } from "@/lib/text-moderation";

/**
 * API Messages SferaLuna.
 *
 * GET /api/messages/[matchId]
 * - récupère les messages d'un match ;
 * - vérifie que l'utilisateur connecté fait partie du match ;
 * - marque comme lus les messages reçus.
 *
 * POST /api/messages/[matchId]
 * - envoie un message texte ;
 * - met à jour lastMessageAt du match ;
 * - notifie le canal Pusher private-match-[matchId].
 *
 * Mobile-first côté API :
 * - payload léger ;
 * - pagination limitée ;
 * - message limité à 1000 caractères ;
 * - pas de données inutiles.
 */

const MAX_MESSAGE_LENGTH = 1000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) return fallback;

  return parsed;
}

function getOtherUserId(match: any, currentUserId: mongoose.Types.ObjectId) {
  const current = currentUserId.toString();
  const user1 = match.user1Id.toString();
  const user2 = match.user2Id.toString();

  return user1 === current ? user2 : user1;
}

/**
 * Next.js App Router peut fournir params directement ou sous forme promise
 * selon versions / typages.
 *
 * Cette fonction rend le code robuste.
 */
async function resolveParams(params: { matchId: string } | Promise<{ matchId: string }>) {
  return await params;
}

/**
 * Vérifie que l'utilisateur connecté fait bien partie du match.
 *
 * Retourne :
 * - currentUserId
 * - match
 *
 * Si l'accès est refusé, retourne null.
 */
async function authorizeMatchAccess(matchId: string, sessionEmail: string) {
  if (!isValidObjectId(matchId)) return null;

  await connectDB();

  const currentUser = await User.findOne({
    email: sessionEmail.toLowerCase().trim(),
  }).select("_id banned");

  if (!currentUser || currentUser.banned) return null;

  const currentUserId = currentUser._id as mongoose.Types.ObjectId;

  const match = await Match.findOne({
    _id: new mongoose.Types.ObjectId(matchId),
    $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    isActive: true,
  });

  if (!match) return null;

  return {
    currentUserId,
    match,
  };
}

/**
 * Construit un message propre à renvoyer au frontend.
 */
function serializeMessage(message: any) {
  return {
    _id: message._id?.toString(),
    matchId: message.matchId?.toString(),
    senderId: message.senderId?.toString(),
    content: message.content,
    readAt: message.readAt || null,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

// ─────────────────────────────────────────────
// GET /api/messages/[matchId]
// ─────────────────────────────────────────────

export async function GET(
  req: NextRequest,
  context: { params: { matchId: string } | Promise<{ matchId: string }> }
) {
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

    const { matchId } = await resolveParams(context.params);

    if (!isValidObjectId(matchId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant de match invalide.",
          code: "INVALID_MATCH_ID",
        },
        { status: 400 }
      );
    }

    const access = await authorizeMatchAccess(matchId, session.user.email);

    if (!access) {
      return NextResponse.json(
        {
          success: false,
          error: "Match introuvable ou accès refusé.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const { currentUserId, match } = access;

    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
      MAX_LIMIT
    );

    const before = searchParams.get("before");

    /**
     * Requête messages.
     *
     * Sans before :
     * - on charge les derniers messages.
     *
     * Avec before :
     * - on charge les messages plus anciens que la date fournie.
     */
    const query: Record<string, unknown> = {
      matchId: match._id,
    };

    if (before) {
      const beforeDate = new Date(before);

      if (!Number.isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    /**
     * On récupère en descendant pour avoir les plus récents rapidement,
     * puis on reverse pour afficher chronologiquement côté frontend.
     */
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const orderedMessages = messages.reverse().map(serializeMessage);

    /**
     * Marquer les messages reçus comme lus + émettre l'event Pusher
     * pour que l'expéditeur voie la double-coche bleue en temps réel.
     */
    const readNow = new Date();
    const updateResult = await Message.updateMany(
      {
        matchId: match._id,
        senderId: { $ne: currentUserId },
        readAt: null,
      },
      { $set: { readAt: readNow } }
    );

    const otherUserId = getOtherUserId(match, currentUserId);

    // Notifier l'expéditeur si des messages viennent d'être lus
    if (updateResult.modifiedCount > 0) {
      try {
        await pusher.trigger(
          `private-match-${match._id.toString()}`,
          'messages-read',
          { readerId: currentUserId.toString(), readAt: readNow.toISOString() }
        );
      } catch {
        // non bloquant
      }
    }

    return NextResponse.json(
      {
        success: true,
        messages: orderedMessages,
        currentUserId: currentUserId.toString(),
        otherUserId,
        hasMore: messages.length === limit,
        pagination: {
          limit,
          before: before || null,
          nextBefore:
            orderedMessages.length > 0 ? orderedMessages[0].createdAt : null,
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
    console.error("Erreur GET /api/messages/[matchId] :", error);

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

// ─────────────────────────────────────────────
// POST /api/messages/[matchId]
// ─────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  context: { params: { matchId: string } | Promise<{ matchId: string }> }
) {
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

    const { matchId } = await resolveParams(context.params);

    if (!isValidObjectId(matchId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant de match invalide.",
          code: "INVALID_MATCH_ID",
        },
        { status: 400 }
      );
    }

    const access = await authorizeMatchAccess(matchId, session.user.email);

    if (!access) {
      return NextResponse.json(
        {
          success: false,
          error: "Match introuvable ou accès refusé.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }

    const { currentUserId, match } = access;

    let body: { content?: unknown } | null = null;

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

    const content =
      typeof body?.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Le message ne peut pas être vide.",
          code: "EMPTY_CONTENT",
        },
        { status: 400 }
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: `Message trop long. Maximum ${MAX_MESSAGE_LENGTH} caractères.`,
          code: "TOO_LONG",
        },
        { status: 400 }
      );
    }

    /**
     * Filtre anti-harcèlement.
     *
     * Un message clairement abusif n'est PAS envoyé, et un signalement
     * automatique est créé pour la modération admin (visé : l'expéditeur).
     * On upsert pour respecter l'index unique (reporterId, targetType,
     * targetId) et éviter un crash sur récidive.
     */
    const moderation = moderateText(content);
    if (moderation.blocked) {
      try {
        await Report.findOneAndUpdate(
          {
            reporterId: currentUserId,
            targetType: "user",
            targetId: currentUserId,
          },
          {
            $set: {
              reason: "harcèlement",
              status: "pending",
              details:
                "[AUTO] Filtre anti-harcèlement : message bloqué dans la messagerie " +
                `(${moderation.category ?? "abus"}).`,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (reportErr) {
        console.warn("Signalement auto anti-harcèlement échoué :", reportErr);
      }

      return NextResponse.json(
        {
          success: false,
          error:
            "Ce message enfreint nos règles de respect et n'a pas été envoyé. Les échanges doivent rester bienveillants.",
          code: "MESSAGE_BLOCKED",
        },
        { status: 422 }
      );
    }

    const message = await Message.create({
      matchId: match._id,
      senderId: currentUserId,
      content,
    });

    /**
     * Mettre à jour lastMessageAt sur le match.
     *
     * Cela permet à /api/matches de trier les conversations récentes.
     */
    await Match.findByIdAndUpdate(match._id, {
      $set: {
        lastMessageAt: message.createdAt,
      },
    });

    const serializedMessage = serializeMessage(message);

    /**
     * Notifier le canal Pusher en temps réel.
     *
     * Si Pusher échoue en dev ou à cause d'une config manquante,
     * on ne bloque pas l'envoi du message.
     */
    try {
      await pusher.trigger(`private-match-${match._id.toString()}`, "new-message", {
        ...serializedMessage,
      });
    } catch (pusherError) {
      console.warn("Pusher trigger new-message échoué :", pusherError);
    }

    // Push notification vers le destinataire (silencieux si échec)
    try {
      const otherUserId = getOtherUserId(match, access.currentUserId);
      const sender = await User.findById(access.currentUserId).select("pseudonyme").lean() as { pseudonyme?: string } | null;
      await sendNewMessagePush({
        recipientUserId: otherUserId,
        senderName: sender?.pseudonyme ?? "Quelqu'un",
        preview: content,
        matchId: match._id.toString(),
      });
    } catch (pushErr) {
      console.warn("Push notification message échouée :", pushErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: serializedMessage,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/messages/[matchId] :", error);

    const err = error as {
      name?: string;
      message?: string;
      errors?: unknown;
    };

    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation MongoDB.",
          code: "DB_VALIDATION_ERROR",
          details: err.errors,
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
