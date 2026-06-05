// src/lib/premium.ts

import type { IUser, UserPlan } from "@/models/User";

/**
 * Fonctionnalités disponibles par plan SferaLuna.
 *
 * Règle : toujours s'aligner avec les vrais plans définis dans User.ts.
 */

export type LunaFeature =
  | "unlimited_likes"
  | "advanced_filters"
  | "invisible_mode"
  | "profile_visitors"
  | "priority_messages"
  | "read_receipts"
  | "premium_badge"
  | "elite_badge"
  | "vip_support"
  | "statistics"
  | "boost"
  | "coaching";

/**
 * Matrice des fonctionnalités par plan.
 */
const PLAN_FEATURES: Record<UserPlan, LunaFeature[]> = {
  free: [],

  "essential-monthly": [
    "priority_messages",
  ],

  "premium-monthly": [
    "unlimited_likes",
    "advanced_filters",
    "invisible_mode",
    "profile_visitors",
    "priority_messages",
    "read_receipts",
    "premium_badge",
    "statistics",
    "boost",
  ],

  "elite-monthly": [
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
  ],
};

/**
 * Limites d'utilisation par plan.
 */
export const PLAN_LIMITS: Record<UserPlan, { likes: number | null; messages: number | null }> = {
  free: { likes: 10, messages: 5 },
  "essential-monthly": { likes: 50, messages: 50 },
  "premium-monthly": { likes: null, messages: null }, // illimité
  "elite-monthly": { likes: null, messages: null },   // illimité
};

/**
 * Vérifie si l'utilisateur a accès à une fonctionnalité.
 *
 * Utilise user.isPremium + user.plan — jamais user.premium?.level.
 */
export function canUseFeature(user: Pick<IUser, "isPremium" | "plan">, feature: LunaFeature): boolean {
  if (!user.isPremium) return false;

  const plan = user.plan ?? "free";
  return PLAN_FEATURES[plan]?.includes(feature) ?? false;
}

/**
 * Retourne toutes les fonctionnalités disponibles pour un utilisateur.
 */
export function getAvailableFeatures(user: Pick<IUser, "isPremium" | "plan">): LunaFeature[] {
  if (!user.isPremium) return [];

  const plan = user.plan ?? "free";
  return PLAN_FEATURES[plan] ?? [];
}

/**
 * Vérifie si l'abonnement est réellement actif.
 *
 * Double vérification : isPremium ET subscriptionStatus.
 */
export function isPremiumActive(user: Pick<IUser, "isPremium" | "subscriptionStatus">): boolean {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing")
  );
}

/**
 * Retourne le label affiché pour un plan donné.
 */
export function getPlanLabel(plan: UserPlan): string {
  const labels: Record<UserPlan, string> = {
    free: "Gratuit",
    "essential-monthly": "Essentiel",
    "premium-monthly": "Premium",
    "elite-monthly": "Elite",
  };

  return labels[plan] ?? "Gratuit";
}

/**
 * Classe utilitaire (optionnelle) pour une API orientée objet.
 */
export class PremiumFeatureManager {
  private user: Pick<IUser, "isPremium" | "plan" | "subscriptionStatus">;

  constructor(user: Pick<IUser, "isPremium" | "plan" | "subscriptionStatus">) {
    this.user = user;
  }

  isActive(): boolean {
    return isPremiumActive(this.user);
  }

  can(feature: LunaFeature): boolean {
    return canUseFeature(this.user, feature);
  }

  getFeatures(): LunaFeature[] {
    return getAvailableFeatures(this.user);
  }

  getPlanLabel(): string {
    return getPlanLabel(this.user.plan ?? "free");
  }

  getLimits() {
    return PLAN_LIMITS[this.user.plan ?? "free"];
  }
}
