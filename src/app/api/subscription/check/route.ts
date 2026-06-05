// src/app/api/subscription/check/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import {
  canUseFeature,
  getPlanLimits,
  isPremiumActive,
  normalizePremiumUser,
  type LunaFeature,
} from "@/lib/premium";

/**
 * POST /api/subscription/check
 *
 * Vérifie si l'utilisateur connecté peut effectuer une action.
 *
 * Body attendu :
 * {
 *   action: string,
 *   count?: number
 * }
 *
 * Exemple :
 * {
 *   action: "invisible_mode"
 * }
 *
 * ou :
 * {
 *   action: "likes",
 *   count: 1
 * }
 */

export const runtime = "nodejs";

/**
 * Actions reconnues.
 *
 * Certaines actions sont des features premium directes.
 * D'autres sont des quotas : likes, messages, boosts.
 */
const FEATURE_ACTIONS: LunaFeature[] = [
  "unlimited_likes",
  "advanced_filters",
  "invisible_mode",
  "profile_visitors",
  "priority_messages",
  "read_receipts",
  "premium_badge",
  "elite_badge",
  "vip_support",
  "statistics",
  "boost",
  "coaching",
];

type QuotaAction = "likes" | "messages" | "boosts" | "profileViews";

function isFeatureAction(action: string): action is LunaFeature {
  return FEATURE_ACTIONS.includes(action as LunaFeature);
}

function isQuotaAction(action: string): action is QuotaAction {
  return (
    action === "likes" ||
    action === "messages" ||
    action === "boosts" ||
    action === "profileViews"
  );
}

function getLimitForAction(
  limits: ReturnType<typeof getPlanLimits>,
  action: QuotaAction
) {
  switch (action) {
    case "likes":
      return limits.likes;

    case "messages":
      return limits.messages;

    case "boosts":
      return limits.boosts;

    case "profileViews":
      return limits.profileViews;

    default:
      return 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const action = String(body?.action || "").trim();
    const count = Number(body?.count ?? 1);

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          error: "Action manquante.",
          code: "MISSING_ACTION",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(count) || count < 1) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          error: "Compteur invalide.",
          code: "INVALID_COUNT",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const email = session.user.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select(
      "_id plan isPremium subscriptionStatus banned"
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
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
          allowed: false,
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
    const limits = getPlanLimits(premiumUser.plan);

    /**
     * Cas 1 :
     * l'action est une fonctionnalité premium.
     */
    if (isFeatureAction(action)) {
      const allowed = canUseFeature(premiumUser, action);

      return NextResponse.json(
        {
          success: true,
          allowed,
          action,
          plan: premiumUser.plan,
          isPremium: active,
          reason: allowed
            ? "FEATURE_ALLOWED"
            : "FEATURE_REQUIRES_PREMIUM_OR_HIGHER_PLAN",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    /**
     * Cas 2 :
     * l'action est une action à quota.
     *
     * Pour l'instant, cette route vérifie seulement la limite théorique du plan.
     * Plus tard, on pourra brancher des collections UsageDaily / UsageMonthly.
     */
    if (isQuotaAction(action)) {
      const limit = getLimitForAction(limits, action);

      /**
       * null = illimité.
       */
      if (limit === null) {
        return NextResponse.json(
          {
            success: true,
            allowed: true,
            action,
            plan: premiumUser.plan,
            isPremium: active,
            limit: null,
            remaining: null,
            reason: "UNLIMITED",
          },
          {
            status: 200,
            headers: {
              "Cache-Control": "no-store",
            },
          }
        );
      }

      const allowed = count <= limit;

      return NextResponse.json(
        {
          success: true,
          allowed,
          action,
          plan: premiumUser.plan,
          isPremium: active,
          limit,
          remaining: Math.max(0, limit - count),
          reason: allowed ? "WITHIN_LIMIT" : "LIMIT_EXCEEDED",
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        allowed: false,
        error: "Action inconnue.",
        code: "UNKNOWN_ACTION",
        action,
      },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/subscription/check :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        allowed: false,
        error: "Erreur serveur lors de la vérification.",
        code: "SUBSCRIPTION_CHECK_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}