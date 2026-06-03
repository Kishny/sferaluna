// src/app/api/users/visibility/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { ProfileVisibility } from "@/models/User";

const ALLOWED_VISIBILITY: ProfileVisibility[] = ["public", "matches", "premium", "invisible"];

/**
 * PUT /api/users/visibility
 *
 * Met à jour la visibilité du profil de l'utilisateur connecté.
 * Le mode "invisible" nécessite un abonnement premium actif.
 *
 * Body : { visibilite: ProfileVisibility }
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { visibilite } = body;

    if (!visibilite || !ALLOWED_VISIBILITY.includes(visibilite)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valeur de visibilité invalide.",
          allowed: ALLOWED_VISIBILITY,
          code: "INVALID_VALUE",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const email = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email }).select("_id isPremium subscriptionStatus");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Le mode invisible est réservé aux membres premium
    if (visibilite === "invisible") {
      const isPremiumActive =
        user.isPremium &&
        (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

      if (!isPremiumActive) {
        return NextResponse.json(
          {
            success: false,
            error: "Le mode invisible est réservé aux membres premium.",
            code: "PREMIUM_REQUIRED",
          },
          { status: 403 }
        );
      }
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: { visibilite } },
      { new: true, runValidators: true }
    ).select("visibilite isPremium plan");

    return NextResponse.json(
      {
        success: true,
        visibilite: updated?.visibilite,
        message: visibilite === "invisible"
          ? "Mode invisible activé. Votre profil n'apparaît plus dans les recherches."
          : "Visibilité mise à jour.",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur PUT /api/users/visibility :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
