// src/app/api/subscription/status/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  getAvailableFeatures,
  getPlanLabel,
  getPlanLimits,
  getSubscriptionStatusLabel,
  isPremiumActive,
  normalizePremiumUser,
} from "@/lib/premium";

/**
 * GET /api/subscription/status
 *
 * Retourne l'état d'abonnement de l'utilisateur connecté.
 *
 * Utilisé par :
 * - useSubscription()
 * - pages premium
 * - affichage mobile rapide du plan
 *
 * Important :
 * cette route ne modifie rien.
 * Elle lit simplement MongoDB et renvoie un payload propre.
 */

export const runtime = "nodejs";

export async function GET() {
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

    const email = session.user.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select(
      [
        "_id",
        "email",
        "pseudonyme",
        "plan",
        "isPremium",
        "subscriptionStatus",
        "premiumStartedAt",
        "premiumExpiresAt",
        "stripeCustomerId",
        "stripeSubscriptionId",
        "lastPaymentAt",
        "banned",
      ].join(" ")
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    if (user.banned) {
      return NextResponse.json(
        {
          success: false,
          error: "Compte suspendu.",
          code: "ACCOUNT_BANNED",
        },
        { status: 403 }
      );
    }

    const premiumUser = normalizePremiumUser({
      isPremium: user.isPremium,
      plan: user.plan,
      subscriptionStatus: user.subscriptionStatus,
    });

    const active = isPremiumActive(premiumUser);
    const features = getAvailableFeatures(premiumUser);
    const limits = getPlanLimits(premiumUser.plan);

    return NextResponse.json(
      {
        success: true,
        subscription: {
          userId: user._id.toString(),
          email: user.email,
          pseudonyme: user.pseudonyme,

          plan: premiumUser.plan,
          planLabel: getPlanLabel(premiumUser.plan),

          isPremium: active,

          subscriptionStatus: premiumUser.subscriptionStatus,
          subscriptionStatusLabel: getSubscriptionStatusLabel(
            premiumUser.subscriptionStatus
          ),

          premiumStartedAt: user.premiumStartedAt ?? null,
          premiumExpiresAt: user.premiumExpiresAt ?? null,
          lastPaymentAt: user.lastPaymentAt ?? null,

          stripeCustomerId: user.stripeCustomerId ?? "",
          stripeSubscriptionId: user.stripeSubscriptionId ?? "",

          features: Object.fromEntries(
            features.map((feature) => [feature, true])
          ),

          limits,

          usage: {
            remainingSwipes: limits.likes,
            remainingMessages: limits.messages,
            remainingBoosts: limits.boosts,
            remainingProfileViews: limits.profileViews,
          },
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
    console.error("Erreur GET /api/subscription/status :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors du chargement de l'abonnement.",
        code: "SUBSCRIPTION_STATUS_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}