// src/lib/subscription/config.ts

import type { UserPlan } from "@/models/User";

/**
 * Configuration complète des plans SferaLuna.
 *
 * IMPORTANT : les clés correspondent exactement aux valeurs UserPlan dans User.ts.
 * Ne jamais utiliser "basic", "premium", "master" ici.
 */
export const PLAN_CONFIG = {
  free: {
    id: "free" as UserPlan,
    name: "Gratuit",
    price: 0,
    priceLabel: "Gratuit",
    features: {
      likes: { limit: 10, period: "daily" as const },
      messages: { limit: 5, period: "daily" as const },
      vibeSphere: "basic",
      moderation: "standard",
      support: "none",
    },
  },

  "essential-monthly": {
    id: "essential-monthly" as UserPlan,
    name: "Essentiel",
    price: 9.99,
    priceLabel: "9,99€/mois",
    features: {
      likes: { limit: 50, period: "daily" as const },
      messages: { limit: 50, period: "daily" as const },
      vibeSphere: "basic",
      moderation: "standard",
      support: "form",
      priorityMessages: true,
    },
  },

  "premium-monthly": {
    id: "premium-monthly" as UserPlan,
    name: "Premium",
    price: 19.99,
    priceLabel: "19,99€/mois",
    badge: "Plus populaire",
    features: {
      likes: { unlimited: true },
      messages: { unlimited: true },
      vibeSphere: "advanced",
      moderation: "priority",
      support: "priority",
      priorityMessages: true,
      advancedFilters: true,
      invisibleMode: true,
      profileVisitors: true,
      readReceipts: true,
      statistics: true,
      boost: true,
      premiumBadge: true,
    },
  },

  "elite-monthly": {
    id: "elite-monthly" as UserPlan,
    name: "Elite",
    price: 34.99,
    priceLabel: "34,99€/mois",
    badge: "Le plus complet",
    features: {
      likes: { unlimited: true },
      messages: { unlimited: true },
      vibeSphere: "ultimate",
      moderation: "vip",
      support: "vip",
      priorityMessages: true,
      advancedFilters: true,
      invisibleMode: true,
      profileVisitors: true,
      readReceipts: true,
      statistics: true,
      boost: true,
      premiumBadge: true,
      eliteBadge: true,
      coaching: true,
      vipCircle: true,
      earlyAccess: true,
    },
  },
} as const;

export type PlanConfigKey = keyof typeof PLAN_CONFIG;

/**
 * Retourne la config d'un plan ou celle du plan gratuit par défaut.
 */
export function getPlanConfig(plan: UserPlan) {
  return PLAN_CONFIG[plan] ?? PLAN_CONFIG["free"];
}

/**
 * Liste ordonnée des plans payants pour l'affichage sur /paiement.
 */
export const PAID_PLANS = [
  PLAN_CONFIG["essential-monthly"],
  PLAN_CONFIG["premium-monthly"],
  PLAN_CONFIG["elite-monthly"],
] as const;
