// src/app/api/messages/[matchId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { pusher } from "@/lib/pusher";

/**
 * Vérifie que l'utilisateur connecté fait bien partie du match.
 * Retourne { currentUserId, match } si autorisé, null sinon.
 */
async function authorizeMatchAccess(
  matchId: string,
  sessionEmail: string
): Promise<{ currentUserId: mongoose.Types.ObjectId; match: InstanceType<typeof Match> } | null> {
  if (!mongoose.Types.ObjectId.isValid(matchId)) return null;

  await connectDB();

  const currentUser = await User.findOne({
    email: sessionEmail.toLowerCase().trim(),
  }).select("_id");

  if (!currentUser) return null;

  const currentUserId = currentUser._id as mongoose.Types.ObjectId;

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    isActive: true,
  });

  if (!match) return null;

  return { currentUserId, match };
}

/**
 * GET /api/messages/[matchId]
 *
 * Retourne les messages d'un match, du plus ancien au plus récent.
 * Marque automatiquement comme lus les messages de l'autre utilisateur.
 *
 * Query params :
 * - limit (défaut : 50)
 * - before (cursor ISO date pour pagination)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { matchId } = await params;

    const access = await authorizeMatchAccess(matchId, session.user.email);

    if (!access) {
      return NextResponse.json(
        { success: false, error: "Match introuvable ou accès refusé.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { currentUserId } = access;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const before = searchParams.get("before");

    const query: Record<string, unknown> = { matchId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: before ? -1 : 1 })
      .limit(limit)
      .lean();

    // Si on paginait en arrière, on remet dans l'ordre chronologique
    const ordered = before ? messages.reverse() : messages;

    // Marquer les messages non lus de l'autre comme lus
    await Message.updateMany(
      {
        matchId,
        senderId: { $ne: currentUserId },
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    return NextResponse.json(
      {
        success: true,
        messages: ordered,
        currentUserId: currentUserId.toString(),
        hasMore: messages.length === limit,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/messages/[matchId] :", error);
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
 * POST /api/messages/[matchId]
 *
 * Envoie un message dans un match.
 *
 * Body : { content: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const { matchId } = await params;

    const access = await authorizeMatchAccess(matchId, session.user.email);

    if (!access) {
      return NextResponse.json(
        { success: false, error: "Match introuvable ou accès refusé.", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    const { currentUserId, match } = access;

    const body = await req.json();
    const content = body?.content?.trim();

    if (!content || content.length === 0) {
      return NextResponse.json(
        { success: false, error: "Le message ne peut pas être vide.", code: "EMPTY_CONTENT" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Message trop long (max 2000 caractères).", code: "TOO_LONG" },
        { status: 400 }
      );
    }

    const message = await Message.create({
      matchId: match._id,
      senderId: currentUserId,
      content,
    });

    // Mettre à jour lastMessageAt sur le match
    await Match.findByIdAndUpdate(match._id, {
      $set: { lastMessageAt: new Date() },
    });

    // Notifier le canal Pusher en temps réel
    try {
      await pusher.trigger(`private-match-${matchId}`, "new-message", {
        _id: message._id.toString(),
        matchId: matchId,
        senderId: currentUserId.toString(),
        content: message.content,
        createdAt: message.createdAt,
        readAt: null,
      });
    } catch (pusherErr) {
      // Ne pas bloquer la réponse si Pusher échoue (variables non configurées en dev)
      console.warn("Pusher trigger échoué (ignoré) :", pusherErr);
    }

    return NextResponse.json(
      { success: true, message },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/messages/[matchId] :", error);
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
