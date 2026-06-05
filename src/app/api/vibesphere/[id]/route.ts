// src/app/api/vibesphere/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { VibePost } from "@/models/VibePost";

/**
 * API d'action sur un post VibeSphere.
 *
 * POST /api/vibesphere/[id]
 * - toggle like.
 *
 * DELETE /api/vibesphere/[id]
 * - supprime un post ;
 * - auteur uniquement ou admin.
 */

export const runtime = "nodejs";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

async function resolveParams(
  params: { id: string } | Promise<{ id: string }>
) {
  return await params;
}

function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && mongoose.Types.ObjectId.isValid(id);
}

/**
 * Récupère l'utilisateur connecté.
 */
async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
    };
  }

  await connectDB();

  const currentUser = await User.findOne({
    email: session.user.email.toLowerCase().trim(),
  }).select("_id role banned");

  if (!currentUser) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      ),
    };
  }

  if (currentUser.banned) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Compte suspendu.",
          code: "ACCOUNT_BANNED",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: currentUser,
    response: null,
  };
}

// ─────────────────────────────────────────────
// POST /api/vibesphere/[id]
// ─────────────────────────────────────────────

/**
 * POST /api/vibesphere/[id]
 *
 * Toggle like sur un post.
 *
 * On utilise $addToSet / $pull plutôt que push manuel :
 * - évite les doublons ;
 * - plus robuste ;
 * - plus propre en concurrence.
 */
export async function POST(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await resolveParams(context.params);

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide.",
          code: "INVALID_POST_ID",
        },
        { status: 400 }
      );
    }

    const { user: currentUser, response } = await getCurrentUser();

    if (response || !currentUser) return response;

    const userId = currentUser._id as mongoose.Types.ObjectId;
    const postId = new mongoose.Types.ObjectId(id);

    const post = await VibePost.findById(postId).select("_id likes");

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post introuvable.",
          code: "POST_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const alreadyLiked = post.likes.some((likeId) => likeId.equals(userId));

    /**
     * Toggle atomique.
     */
    const updatedPost = await VibePost.findByIdAndUpdate(
      postId,
      alreadyLiked
        ? { $pull: { likes: userId } }
        : { $addToSet: { likes: userId } },
      {
        new: true,
        runValidators: true,
      }
    ).select("_id likes");

    return NextResponse.json(
      {
        success: true,
        liked: !alreadyLiked,
        likesCount: updatedPost?.likes?.length ?? 0,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/vibesphere/[id] :", error);

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
// DELETE /api/vibesphere/[id]
// ─────────────────────────────────────────────

/**
 * DELETE /api/vibesphere/[id]
 *
 * Supprime un post.
 *
 * Autorisé si :
 * - l'utilisateur est l'auteur ;
 * - ou l'utilisateur est admin.
 */
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const { id } = await resolveParams(context.params);

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID invalide.",
          code: "INVALID_POST_ID",
        },
        { status: 400 }
      );
    }

    const { user: currentUser, response } = await getCurrentUser();

    if (response || !currentUser) return response;

    const userId = currentUser._id as mongoose.Types.ObjectId;
    const postId = new mongoose.Types.ObjectId(id);

    const post = await VibePost.findById(postId).select("_id userId");

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: "Post introuvable.",
          code: "POST_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const isAuthor = post.userId.equals(userId);
    const isAdmin = currentUser.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous n'êtes pas autorisé à supprimer ce post.",
          code: "DELETE_FORBIDDEN",
        },
        { status: 403 }
      );
    }

    await VibePost.deleteOne({
      _id: postId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Post supprimé avec succès.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur DELETE /api/vibesphere/[id] :", error);

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
