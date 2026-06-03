// src/lib/guards/premium-guard.ts

import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import type { LunaFeature } from "@/lib/premium";
import { canUseFeature, isPremiumActive } from "@/lib/premium";

/**
 * Résultat d'une vérification premium côté serveur.
 */
export interface PremiumCheckResult {
  allowed: boolean;
  isPremium: boolean;
  plan: string;
  reason?: "not_authenticated" | "user_not_found" | "not_premium" | "plan_too_low";
}

/**
 * Vérifie si l'utilisateur connecté peut utiliser une fonctionnalité.
 *
 * Usage dans une route API :
 * ```ts
 * const check = await requirePremium(req, "invisible_mode");
 * if (!check.allowed) return premiumDeniedResponse(check);
 * ```
 */
export async function requirePremium(
  req: NextRequest,
  feature?: LunaFeature
): Promise<PremiumCheckResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return { allowed: false, isPremium: false, plan: "free", reason: "not_authenticated" };
  }

  await connectDB();

  const user = await User.findOne({
    email: session.user.email.toLowerCase().trim(),
  }).select("isPremium plan subscriptionStatus");

  if (!user) {
    return { allowed: false, isPremium: false, plan: "free", reason: "user_not_found" };
  }

  const active = isPremiumActive(user);

  if (!active) {
    return { allowed: false, isPremium: false, plan: user.plan, reason: "not_premium" };
  }

  if (feature && !canUseFeature(user, feature)) {
    return { allowed: false, isPremium: true, plan: user.plan, reason: "plan_too_low" };
  }

  return { allowed: true, isPremium: true, plan: user.plan };
}

/**
 * Retourne une réponse 403 standard pour les routes protégées.
 */
export function premiumDeniedResponse(check: PremiumCheckResult): NextResponse {
  const messages: Record<NonNullable<PremiumCheckResult["reason"]>, string> = {
    not_authenticated: "Vous devez être connecté.",
    user_not_found: "Utilisateur introuvable.",
    not_premium: "Cette fonctionnalité nécessite un abonnement premium.",
    plan_too_low: "Votre plan actuel ne donne pas accès à cette fonctionnalité.",
  };

  return NextResponse.json(
    {
      success: false,
      error: messages[check.reason ?? "not_premium"],
      code: "PREMIUM_REQUIRED",
      currentPlan: check.plan,
    },
    { status: 403 }
  );
}
