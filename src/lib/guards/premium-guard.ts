// src/lib/guards/premium-guard.ts

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

import type { LunaFeature } from "@/lib/premium";
import { canUseFeature, isPremiumActive } from "@/lib/premium";

import type { PlanId } from "@/lib/subscription/config";
import { normalizePlanId } from "@/lib/subscription/config";

/**
 * Résultat d'une vérification premium côté serveur.
 *
 * Ce guard sert surtout pour les routes simples qui doivent vérifier :
 * - si l'utilisateur est connecté ;
 * - si l'utilisateur existe ;
 * - si son abonnement premium est actif ;
 * - si son plan donne accès à une fonctionnalité précise.
 */
export interface PremiumCheckResult {
  allowed: boolean;
  isPremium: boolean;
  plan: PlanId;
  reason?:
    | "not_authenticated"
    | "user_not_found"
    | "not_premium"
    | "plan_too_low"
    | "server_error";
}

/**
 * Vérifie si l'utilisateur connecté peut utiliser une fonctionnalité premium.
 *
 * Exemple dans une route API :
 *
 * const check = await requirePremium(req, "ghostMode");
 *
 * if (!check.allowed) {
 *   return premiumDeniedResponse(check);
 * }
 */
export async function requirePremium(
  _req?: NextRequest,
  feature?: LunaFeature
): Promise<PremiumCheckResult> {
  try {
    const session = await getServerSession(authOptions);

    /**
     * Aucun utilisateur connecté.
     */
    if (!session?.user?.email) {
      return {
        allowed: false,
        isPremium: false,
        plan: "free",
        reason: "not_authenticated",
      };
    }

    await connectDB();

    /**
     * On récupère uniquement les champs utiles pour éviter de charger tout le document.
     */
    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("isPremium plan subscriptionStatus subscriptionEnd currentPeriodEnd role");

    /**
     * Session valide côté NextAuth, mais utilisateur introuvable en base.
     */
    if (!user) {
      return {
        allowed: false,
        isPremium: false,
        plan: "free",
        reason: "user_not_found",
      };
    }

    const currentPlan = normalizePlanId(user.plan);

    /**
     * Vérifie si le compte premium est réellement actif.
     * Cette logique dépend de ton fichier src/lib/premium.ts.
     */
    const active = isPremiumActive(user);

    if (!active) {
      return {
        allowed: false,
        isPremium: false,
        plan: currentPlan,
        reason: "not_premium",
      };
    }

    /**
     * Si une fonctionnalité précise est demandée,
     * on vérifie que le plan actuel l'autorise.
     */
    if (feature && !canUseFeature(user, feature)) {
      return {
        allowed: false,
        isPremium: true,
        plan: currentPlan,
        reason: "plan_too_low",
      };
    }

    return {
      allowed: true,
      isPremium: true,
      plan: currentPlan,
    };
  } catch (error) {
    console.error("Erreur requirePremium :", error);

    return {
      allowed: false,
      isPremium: false,
      plan: "free",
      reason: "server_error",
    };
  }
}

/**
 * Retourne une réponse JSON standard quand l'accès premium est refusé.
 */
export function premiumDeniedResponse(check: PremiumCheckResult): NextResponse {
  const messages: Record<NonNullable<PremiumCheckResult["reason"]>, string> = {
    not_authenticated: "Vous devez être connecté.",
    user_not_found: "Utilisateur introuvable.",
    not_premium: "Cette fonctionnalité nécessite un abonnement premium.",
    plan_too_low: "Votre plan actuel ne donne pas accès à cette fonctionnalité.",
    server_error: "Erreur serveur pendant la vérification premium.",
  };

  const status =
    check.reason === "not_authenticated"
      ? 401
      : check.reason === "user_not_found"
        ? 404
        : check.reason === "server_error"
          ? 500
          : 403;

  return NextResponse.json(
    {
      success: false,
      error: messages[check.reason ?? "not_premium"],
      code:
        check.reason === "not_authenticated"
          ? "AUTH_REQUIRED"
          : "PREMIUM_REQUIRED",
      currentPlan: check.plan,
      upgradeUrl: "/tarifs",
    },
    { status }
  );
}

/**
 * Petit helper pratique si tu veux protéger rapidement une route.
 *
 * Exemple :
 *
 * const denied = await denyIfNotPremium(req, "ghostMode");
 * if (denied) return denied;
 */
export async function denyIfNotPremium(
  req?: NextRequest,
  feature?: LunaFeature
): Promise<NextResponse | null> {
  const check = await requirePremium(req, feature);

  if (!check.allowed) {
    return premiumDeniedResponse(check);
  }

  return null;
}
