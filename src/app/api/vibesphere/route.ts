// src/app/api/vibesphere/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { VibePost, VIBE_MOODS, type VibeMood } from "@/models/VibePost";

/**
 * API VibeSphere.
 *
 * GET /api/vibesphere
 * - retourne le feed des vibes avec pagination cursor.
 *
 * POST /api/vibesphere
 * - crée une nouvelle vibe.
 *
 * Objectifs :
 * - feed léger pour mobile ;
 * - validation stricte ;
 * - données utilisateur publiques uniquement ;
 * - pas de données sensibles exposées.
 */

export const runtime = "nodejs";

// ─────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────

const createVibeSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Le contenu ne peut pas être vide.")
    .max(300, "Le contenu ne peut pas dépasser 300 caractères."),

  mood: z.enum(VIBE_MOODS as [VibeMood, ...VibeMood[]], {
    message: "Humeur invalide.",
  }),

  emoji: z
    .string()
    .trim()
    .min(1, "L'emoji est obligatoire.")
    .max(10, "L'emoji est trop long."),
});

type CreateVibeInput = z.infer<typeof createVibeSchema>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) return fallback;

  return parsed;
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
  }).select("_id pseudonyme image age banned");

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

/**
 * Nettoie un post VibeSphere pour le frontend.
 */
function serializeVibePost(post: any, currentUserId: string) {
  const likes = Array.isArray(post.likes) ? post.likes : [];

  return {
    _id: post._id?.toString(),
    userId: post.userId,
    content: post.content,
    mood: post.mood,
    emoji: post.emoji,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,

    /**
     * On évite d'exposer toute la liste des likes au frontend.
     * Pour mobile, likesCount + likedByMe suffisent.
     */
    likesCount: likes.length,
    likedByMe: likes.some((id: mongoose.Types.ObjectId | string) => {
      return id.toString() === currentUserId;
    }),
  };
}

// ─────────────────────────────────────────────
// GET /api/vibesphere
// ─────────────────────────────────────────────

/**
 * GET /api/vibesphere
 *
 * Query params :
 * - limit : nombre de posts à retourner, défaut 20, max 50
 * - before : cursor date ISO pour récupérer les posts plus anciens
 *
 * Exemple :
 * /api/vibesphere?limit=10
 * /api/vibesphere?before=2026-01-01T10:00:00.000Z&limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const { user: currentUser, response } = await getCurrentUser();

    if (response || !currentUser) return response;

    const currentUserId = (currentUser._id as mongoose.Types.ObjectId).toString();

    const { searchParams } = new URL(req.url);

    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), 20),
      50
    );

    const before = searchParams.get("before");

    const query: Record<string, unknown> = {};

    /**
     * Pagination cursor.
     *
     * Si before est invalide, on l'ignore au lieu de casser le feed.
     */
    if (before) {
      const beforeDate = new Date(before);

      if (!Number.isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const posts = await VibePost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "_id pseudonyme image age identityVerified")
      .lean();

    const serializedPosts = posts.map((post) =>
      serializeVibePost(post, currentUserId)
    );

    return NextResponse.json(
      {
        success: true,
        posts: serializedPosts,
        hasMore: posts.length === limit,
        pagination: {
          limit,
          before: before || null,
          nextBefore:
            serializedPosts.length > 0
              ? serializedPosts[serializedPosts.length - 1].createdAt
              : null,
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
    console.error("Erreur GET /api/vibesphere :", error);

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
// POST /api/vibesphere
// ─────────────────────────────────────────────

/**
 * POST /api/vibesphere
 *
 * Body :
 * {
 *   content: string,
 *   mood: VibeMood,
 *   emoji: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { user: currentUser, response } = await getCurrentUser();

    if (response || !currentUser) return response;

    let body: unknown;

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

    const validation = createVibeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides.",
          code: "VALIDATION_ERROR",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data: CreateVibeInput = validation.data;

    const post = await VibePost.create({
      userId: currentUser._id,
      content: data.content,
      mood: data.mood,
      emoji: data.emoji,
      likes: [],
    });

    const populatedPost = await post.populate(
      "userId",
      "_id pseudonyme image age identityVerified"
    );

    const serializedPost = serializeVibePost(
      populatedPost.toObject(),
      (currentUser._id as mongoose.Types.ObjectId).toString()
    );

    return NextResponse.json(
      {
        success: true,
        message: "Vibe publiée avec succès.",
        post: serializedPost,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/vibesphere :", error);

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