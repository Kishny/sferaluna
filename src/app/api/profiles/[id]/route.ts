// src/app/api/profiles/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * GET /api/profiles/[id]
 *
 * Retourne le profil public d'une utilisatrice.
 *
 * Sécurité :
 * - nécessite une session ;
 * - valide l'id MongoDB ;
 * - ne renvoie jamais email, password, Stripe, tokens, réponse secrète ;
 * - bloque les profils invisibles ;
 * - bloque les profils premium-only si le visiteur n'est pas premium.
 */

function isPremiumActive(user: any) {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non authentifiée.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { id: profileId } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Identifiant de profil invalide.",
          code: "INVALID_PROFILE_ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const sessionEmail = session.user.email.toLowerCase().trim();

    const currentUser = await User.findOne({ email: sessionEmail }).select(
      "_id isPremium subscriptionStatus"
    );

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur connecté introuvable.",
          code: "CURRENT_USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const profile = await User.findById(profileId)
      .select(
        "pseudonyme age localisation interets intentions orientation bio image identityVerified visibilite hasCompletedProfile banned createdAt"
      )
      .lean();

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil introuvable.",
          code: "PROFILE_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const isOwnProfile =
      String(profile._id) === String(currentUser._id);

    if (profile.banned && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil non disponible.",
          code: "PROFILE_UNAVAILABLE",
        },
        { status: 403 }
      );
    }

    if (!profile.hasCompletedProfile && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil incomplet.",
          code: "PROFILE_INCOMPLETE",
        },
        { status: 403 }
      );
    }

    if (profile.visibilite === "invisible" && !isOwnProfile) {
      return NextResponse.json(
        {
          success: false,
          error: "Profil non disponible.",
          code: "PROFILE_INVISIBLE",
        },
        { status: 403 }
      );
    }

    if (
      profile.visibilite === "premium" &&
      !isPremiumActive(currentUser) &&
      !isOwnProfile
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Ce profil est réservé aux membres premium.",
          code: "PREMIUM_REQUIRED",
        },
        { status: 403 }
      );
    }

    /**
     * Note :
     * La visibilité "matches" dépend de ton modèle Match.
     * Quand tu m'enverras Match.ts ou /api/matches, on pourra vérifier
     * réellement si l'utilisateur connecté a le droit de voir ce profil.
     */

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/profiles/[id] :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la récupération du profil.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}
