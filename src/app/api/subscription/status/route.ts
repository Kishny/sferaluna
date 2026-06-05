// src/app/api/subscription/status/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  SUBSCRIPTION_PLANS,
  normalizePlanId,
  type PlanId,
} from "@/lib/subscription/config";

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

function getPlanLabel(plan: PlanId) {
  return SUBSCRIPTION_PLANS[plan]?.name ?? "Gratuit";
}

function getSubscriptionStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    inactive: "Inactif",
    active: "Actif",
    trialing: "Période d’essai",
    past_due: "Paiement en retard",
    canceled: "Annulé",
  };

  return labels[status || "inactive"] ?? "Inactif";
}

function isSubscriptionActive(user: {
  isPremium?: boolean;
  subscriptionStatus?: string;
  plan?: string;
}) {
  const plan = normalizePlanId(user.plan);

  if (plan === "free") return false;

  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
}

function getFeaturesObject(plan: PlanId) {
  return SUBSCRIPTION_PLANS[plan].features;
}

function getLimits(plan: PlanId) {
  return SUBSCRIPTION_PLANS[plan].limits;
}

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

    const plan = normalizePlanId(user.plan);
const active = isSubscriptionActive({
  isPremium: user.isPremium,
  subscriptionStatus: user.subscriptionStatus,
  plan: user.plan,
});

const features = getFeaturesObject(plan);
const limits = getLimits(plan);

    return NextResponse.json(
      {
        success: true,
        subscription: {
          userId: user._id.toString(),
          email: user.email,
          pseudonyme: user.pseudonyme,

          plan: user.plan,
          planLabel: getPlanLabel(user.plan),

          isPremium: active,

          subscriptionStatus: user.subscriptionStatus,
          subscriptionStatusLabel: getSubscriptionStatusLabel(
            user.subscriptionStatus
          ),

          premiumStartedAt: user.premiumStartedAt ?? null,
          premiumExpiresAt: user.premiumExpiresAt ?? null,
          lastPaymentAt: user.lastPaymentAt ?? null,

          stripeCustomerId: user.stripeCustomerId ?? "",
          stripeSubscriptionId: user.stripeSubscriptionId ?? "",

          features: Object.fromEntries(
            Object.keys(features).map((feature) => [feature, true])
          ),

          limits,

          usage: {
            remainingSwipes: limits.dailyLikes,
            remainingMessages: limits.dailyMessages,
            remainingBoosts: limits.boostsPerMonth,
            remainingProfileVisits: limits.profileVisits,
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