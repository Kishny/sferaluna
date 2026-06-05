// src/app/api/subscription/check/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  checkSubscriptionAccess,
  getCurrentSubscriptionInfo,
  requireSubscriptionAction,
  requireSubscriptionFeature,
  requireSubscriptionPlan,
  type SubscriptionAction,
} from "@/lib/subscription/subscription-check";

import {
  SUBSCRIPTION_PLANS,
  type FeatureKey,
  type PlanId,
  isValidPlanId,
} from "@/lib/subscription/config";

/**
 * Route de vérification abonnement SferaLuna.
 *
 * Cette API permet de vérifier :
 * - le plan actuel de l'utilisatrice ;
 * - les fonctionnalités disponibles ;
 * - les limites du plan ;
 * - si une action est autorisée ;
 * - si une fonctionnalité premium est disponible ;
 * - si un plan minimum est respecté.
 *
 * Elle ne consomme aucune action.
 * Elle vérifie seulement les droits.
 *
 * Exemples :
 *
 * POST /api/subscription/check
 * {
 *   "action": "profileVisits"
 * }
 *
 * POST /api/subscription/check
 * {
 *   "requiredFeature": "ghostMode"
 * }
 *
 * POST /api/subscription/check
 * {
 *   "requiredPlan": "premium-monthly"
 * }
 */

export const runtime = "nodejs";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type QuotaAction = "likes" | "messages" | "boosts" | "profileVisits";

interface SubscriptionCheckBody {
  requiredPlan?: PlanId;
  requiredFeature?: FeatureKey;
  action?: SubscriptionAction | QuotaAction;
  count?: number;
  allowFree?: boolean;
}

// ─────────────────────────────────────────────
// Helpers validation
// ─────────────────────────────────────────────

function isFeatureKey(value: unknown): value is FeatureKey {
  if (typeof value !== "string") return false;

  return value in SUBSCRIPTION_PLANS.free.features;
}

function isSubscriptionAction(value: unknown): value is SubscriptionAction {
  return (
    value === "like" ||
    value === "send_message" ||
    value === "use_super_like" ||
    value === "use_boost" ||
    value === "visit_profile" ||
    value === "circle_of_six" ||
    value === "vibeplanner"
  );
}

/**
 * Alias acceptés par l'API.
 *
 * C'est pratique si le frontend envoie :
 * - "likes" au lieu de "like"
 * - "messages" au lieu de "send_message"
 * - "boosts" au lieu de "use_boost"
 * - "profileVisits" au lieu de "visit_profile"
 */
function normalizeAction(action?: SubscriptionCheckBody["action"]): SubscriptionAction | undefined {
  switch (action) {
    case "likes":
      return "like";

    case "messages":
      return "send_message";

    case "boosts":
      return "use_boost";

    case "profileVisits":
      return "visit_profile";

    case "like":
    case "send_message":
    case "use_super_like":
    case "use_boost":
    case "visit_profile":
    case "circle_of_six":
    case "vibeplanner":
      return action;

    default:
      return undefined;
  }
}

function sanitizeCount(value: unknown) {
  const count = Number(value ?? 1);

  if (!Number.isFinite(count) || count < 1) return 1;

  return Math.floor(count);
}

function serializeLimit(value: number) {
  return value === Infinity ? null : value;
}

// ─────────────────────────────────────────────
// GET /api/subscription/check
// ─────────────────────────────────────────────

/**
 * Retourne l'état complet de l'abonnement connecté.
 *
 * Utile pour :
 * - afficher les badges premium ;
 * - afficher les fonctionnalités disponibles ;
 * - vérifier les limites côté frontend ;
 * - debugger rapidement l'état premium.
 */
export async function GET() {
    try {
      const info = await getCurrentSubscriptionInfo();
  
      if (!info.allowed) {
        return info.response;
      }
  
      if (!("limits" in info) || !("features" in info)) {
        return NextResponse.json(
          {
            success: false,
            error: "Informations d'abonnement incomplètes.",
            code: "SUBSCRIPTION_INFO_INCOMPLETE",
          },
          { status: 500 }
        );
      }
  
      const limits = info.limits;
      const features = info.features;
  
      return NextResponse.json(
        {
          success: true,
  
          subscription: {
            currentPlan: info.currentPlan,
            hasActiveSubscription: info.currentPlan !== "free",
            subscription: info.subscription
              ? {
                  id: info.subscription._id?.toString?.() ?? null,
                  plan: info.subscription.plan ?? info.currentPlan,
                  status: info.subscription.status ?? "inactive",
                  currentPeriodEnd: info.subscription.currentPeriodEnd ?? null,
                }
              : null,
          },
  
          features,
  
          limits: {
            dailyLikes: serializeLimit(limits.dailyLikes),
            dailyMessages: serializeLimit(limits.dailyMessages),
            superLikesPerDay: serializeLimit(limits.superLikesPerDay),
            boostsPerMonth: serializeLimit(limits.boostsPerMonth),
            profileVisits: serializeLimit(limits.profileVisits),
            maxMatches: serializeLimit(limits.maxMatches),
            vibePlannerPerMonth: serializeLimit(limits.vibePlannerPerMonth),
          },
  
          user: {
            id: info.user?._id?.toString?.() ?? null,
            email: info.user?.email ?? null,
            pseudonyme: info.user?.pseudonyme ?? null,
            plan: info.user?.plan ?? info.currentPlan,
            isPremium: info.currentPlan !== "free",
            subscriptionStatus: info.user?.subscriptionStatus ?? "inactive",
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    } catch (error) {
      console.error("Erreur GET /api/subscription/check :", error);
  
      return NextResponse.json(
        {
          success: false,
          error: "Erreur serveur lors de la vérification de l'abonnement.",
          code: "SUBSCRIPTION_CHECK_ERROR",
        },
        { status: 500 }
      );
    }
  }

// ─────────────────────────────────────────────
// POST /api/subscription/check
// ─────────────────────────────────────────────

/**
 * Vérifie une règle précise :
 * - requiredPlan
 * - requiredFeature
 * - action
 *
 * Cette route ne consomme pas le quota.
 * Elle vérifie seulement si l'action est autorisée.
 */
export async function POST(req: NextRequest) {
  try {
    let body: SubscriptionCheckBody;

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

    const count = sanitizeCount(body.count);
    const action = normalizeAction(body.action);

    // ─────────────────────────────────────────────
    // Validation du plan requis
    // ─────────────────────────────────────────────

    if (body.requiredPlan && !isValidPlanId(body.requiredPlan)) {
      return NextResponse.json(
        {
          success: false,
          error: "Plan requis invalide.",
          code: "INVALID_REQUIRED_PLAN",
          allowedPlans: Object.keys(SUBSCRIPTION_PLANS),
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // Validation de la feature requise
    // ─────────────────────────────────────────────

    if (body.requiredFeature && !isFeatureKey(body.requiredFeature)) {
      return NextResponse.json(
        {
          success: false,
          error: "Fonctionnalité requise invalide.",
          code: "INVALID_REQUIRED_FEATURE",
          allowedFeatures: Object.keys(SUBSCRIPTION_PLANS.free.features),
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // Validation de l'action
    // ─────────────────────────────────────────────

    if (body.action && !action) {
      return NextResponse.json(
        {
          success: false,
          error: "Action invalide.",
          code: "INVALID_ACTION",
          allowedActions: [
            "likes",
            "messages",
            "boosts",
            "profileVisits",
            "like",
            "send_message",
            "use_super_like",
            "use_boost",
            "visit_profile",
            "circle_of_six",
            "vibeplanner",
          ],
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // Cas simple : vérifier un plan minimum
    // ─────────────────────────────────────────────

    if (body.requiredPlan && !body.requiredFeature && !action) {
      const access = await requireSubscriptionPlan(body.requiredPlan);

      if (!access.allowed) {
        return access.response;
      }

      return NextResponse.json(
        {
          success: true,
          allowed: true,
          type: "plan",
          requiredPlan: body.requiredPlan,
          currentPlan: access.currentPlan,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ─────────────────────────────────────────────
    // Cas simple : vérifier une fonctionnalité
    // Exemple : ghostMode
    // ─────────────────────────────────────────────

    if (body.requiredFeature && !body.requiredPlan && !action) {
      const access = await requireSubscriptionFeature(body.requiredFeature);

      if (!access.allowed) {
        return access.response;
      }

      return NextResponse.json(
        {
          success: true,
          allowed: true,
          type: "feature",
          requiredFeature: body.requiredFeature,
          currentPlan: access.currentPlan,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ─────────────────────────────────────────────
    // Cas simple : vérifier une action avec limite
    // Exemple : profileVisits
    // ─────────────────────────────────────────────

    if (action && !body.requiredPlan && !body.requiredFeature) {
      const access = await requireSubscriptionAction(action, count);

      if (!access.allowed) {
        return access.response;
      }

      return NextResponse.json(
        {
          success: true,
          allowed: true,
          type: "action",
          action,
          originalAction: body.action,
          count,
          currentPlan: access.currentPlan,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // ─────────────────────────────────────────────
    // Cas combiné : plan + feature + action
    // ─────────────────────────────────────────────

    const access = await checkSubscriptionAccess({
      requiredPlan: body.requiredPlan,
      requiredFeature: body.requiredFeature,
      action,
      count,
      allowFree: body.allowFree ?? true,
    });

    if (!access.allowed) {
      return access.response;
    }

    return NextResponse.json(
      {
        success: true,
        allowed: true,
        type: "combined",
        currentPlan: access.currentPlan,
        requiredPlan: body.requiredPlan ?? null,
        requiredFeature: body.requiredFeature ?? null,
        action: action ?? null,
        originalAction: body.action ?? null,
        count,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erreur POST /api/subscription/check :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la vérification de l'abonnement.",
        code: "SUBSCRIPTION_CHECK_ERROR",
      },
      { status: 500 }
    );
  }
}