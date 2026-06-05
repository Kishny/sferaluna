// src/app/api/profiles/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";

/**
 * GET /api/profiles
 *
 * Retourne des profils compatibles avec l'utilisateur connecté.
 *
 * Mobile-first côté API :
 * - pagination stricte ;
 * - limite maximale ;
 * - champs publics uniquement ;
 * - pas de payload inutile.
 */

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);

  if (Number.isNaN(parsed) || parsed <= 0) return fallback;

  return parsed;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPremiumActive(user: any) {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
}

export async function GET(req: NextRequest) {
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
      "_id isPremium plan subscriptionStatus"
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
    const userIsPremium = isPremiumActive(currentUser);

    const alreadyLiked = await Like.find({
      fromUserId: currentUserId,
    }).select("toUserId");

    const likedIds = alreadyLiked.map((like) => like.toUserId);

    const { searchParams } = new URL(req.url);

    /**
     * SferaLuna vise 28+.
     * On met donc 28 par défaut.
     */
    const ageMin = parsePositiveInt(searchParams.get("age_min"), 28);
    const ageMax = parsePositiveInt(searchParams.get("age_max"), 120);

    const safeAgeMin = Math.max(28, Math.min(ageMin, 120));
    const safeAgeMax = Math.max(safeAgeMin, Math.min(ageMax, 120));

    const intentionsParam = searchParams.get("intentions");
    const localisation = searchParams.get("localisation");

    const limit = Math.min(parsePositiveInt(searchParams.get("limit"), 20), 50);
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const skip = (page - 1) * limit;

    /**
     * Filtres premium uniquement.
     */
    const orientation = userIsPremium ? searchParams.get("orientation") : null;
    const actifRecemment =
      userIsPremium && searchParams.get("actif_recemment") === "true";

    /**
     * Requête principale.
     */
    const query: Record<string, unknown> = {
      _id: {
        $ne: currentUserId,
        ...(likedIds.length > 0 ? { $nin: likedIds } : {}),
      },

      hasCompletedProfile: true,
      consentement: true,
      banned: { $ne: true },
      role: { $ne: "admin" },

      age: {
        $gte: safeAgeMin,
        $lte: safeAgeMax,
      },
    };

    /**
     * Visibilité :
     * - public : visible dans Explorer.
     * - premium : visible seulement si le visiteur est premium.
     * - matches : à réserver aux profils déjà matchés, pas à Explorer.
     * - invisible : jamais dans Explorer.
     */
    query.visibilite = userIsPremium
      ? { $in: ["public", "premium"] }
      : { $in: ["public"] };

    if (intentionsParam) {
      const intentions = intentionsParam
        .split(",")
        .map((intent) => intent.trim())
        .filter(Boolean)
        .slice(0, 10);

      if (intentions.length > 0) {
        query.intentions = { $in: intentions };
      }
    }

    if (localisation && localisation.trim().length >= 2) {
      query.localisation = {
        $regex: escapeRegex(localisation.trim()),
        $options: "i",
      };
    }

    if (orientation && orientation.trim().length > 0) {
      query.orientation = orientation.trim();
    }

    if (actifRecemment) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.updatedAt = { $gte: sevenDaysAgo };
    }

    const [profiles, total] = await Promise.all([
      User.find(query)
        .select(
          "pseudonyme age localisation interets intentions visibilite image identityVerified createdAt updatedAt"
        )
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        profiles,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + profiles.length < total,
        },
        filters: {
          userIsPremium,
          ageMin: safeAgeMin,
          ageMax: safeAgeMax,
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
    console.error("Erreur GET /api/profiles :", error);

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
