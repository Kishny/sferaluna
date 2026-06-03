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
 * Filtres de base (tous) :
 * - age_min / age_max
 * - intentions (comma-separated)
 * - localisation (recherche textuelle partielle)
 * - limit (défaut : 20)
 * - page (défaut : 1)
 *
 * Filtres premium uniquement :
 * - orientation
 * - actif_recemment=true (profils actifs dans les 7 derniers jours)
 *
 * Règles d'exclusion :
 * - profil de l'utilisateur connecté
 * - profils déjà likés par l'utilisateur
 * - profils avec visibilite = "invisible"
 * - profils avec visibilite = "premium" si l'utilisateur n'est pas premium
 * - profils dont hasCompletedProfile = false
 */
export async function GET(req: NextRequest) {
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

    const currentUser = await User.findOne({ email: sessionEmail }).select(
      "_id isPremium plan subscriptionStatus"
    );

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const userIsPremium = currentUser.isPremium === true;

    // Récupérer les IDs déjà likés par l'utilisateur
    const alreadyLiked = await Like.find({ fromUserId: currentUserId }).select("toUserId");
    const likedIds = alreadyLiked.map((l) => l.toUserId);

    // Paramètres de filtre
    const { searchParams } = new URL(req.url);
    const ageMin = parseInt(searchParams.get("age_min") ?? "18");
    const ageMax = parseInt(searchParams.get("age_max") ?? "120");
    const intentionsParam = searchParams.get("intentions");
    const localisation = searchParams.get("localisation");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const skip = (page - 1) * limit;

    // Filtres premium
    const orientation = userIsPremium ? searchParams.get("orientation") : null;
    const actifRecemment = userIsPremium && searchParams.get("actif_recemment") === "true";

    // Construire la requête MongoDB
    const query: Record<string, unknown> = {
      _id: { $ne: currentUserId, $nin: likedIds },
      hasCompletedProfile: true,
    };

    // Filtrer les profils invisibles et premium-only selon le statut
    query.visibilite = userIsPremium
      ? { $nin: ["invisible"] }
      : { $nin: ["invisible", "premium"] };

    // Filtre âge
    if (!isNaN(ageMin) && !isNaN(ageMax)) {
      query.age = { $gte: ageMin, $lte: ageMax };
    }

    // Filtre intentions
    if (intentionsParam) {
      const intentions = intentionsParam.split(",").map((i) => i.trim()).filter(Boolean);
      if (intentions.length > 0) {
        query.intentions = { $in: intentions };
      }
    }

    // Filtre localisation (recherche partielle)
    if (localisation && localisation.trim().length >= 2) {
      query.localisation = { $regex: localisation.trim(), $options: "i" };
    }

    // [PREMIUM] Filtre orientation
    if (orientation && orientation.trim().length > 0) {
      query.orientation = orientation.trim();
    }

    // [PREMIUM] Filtre actif récemment (7 derniers jours)
    if (actifRecemment) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.updatedAt = { $gte: sevenDaysAgo };
    }

    const [profiles, total] = await Promise.all([
      User.find(query)
        .select(
          "pseudonyme age localisation interets intentions visibilite image createdAt"
        )
        .sort({ createdAt: -1 })
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
      },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/profiles :", error);
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
