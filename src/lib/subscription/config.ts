// src/lib/subscription/config.ts

/**
 * Configuration centrale des abonnements SferaLuna.
 *
 * Ce fichier définit :
 * - les plans disponibles ;
 * - les limites par plan ;
 * - les fonctionnalités accessibles selon le plan ;
 * - les types TypeScript utilisés dans les guards premium.
 *
 * Très important :
 * On utilise `as const` pour permettre à TypeScript de déduire précisément :
 * - les noms des plans ;
 * - les clés des fonctionnalités ;
 * - les clés des limites.
 */

export const SUBSCRIPTION_PLANS = {
  free: {
    id: "free",
    name: "Gratuit",
    price: 0,
    description: "Découvre SferaLuna gratuitement",

    limits: {
      dailyLikes: 5,
      dailyMessages: 10,
      superLikesPerDay: 0,
      boostsPerMonth: 0,
      profileViews: 20,
      maxMatches: 3,
      vibePlannerPerMonth: 0,
    },

    features: {
      circleOfSix: false,
      ghostMode: false,
      vibePlanner: false,
      profileVisitors: false,
      premiumFilters: false,
      advancedVibeSphere: false,
      unlimitedMessages: false,
      unlimitedLikes: false,
      eventsAccess: false,
      vibementorCoaching: false,
      vipCommunity: false,
      prioritySupport: false,
    },
  },

  "essential-monthly": {
    id: "essential-monthly",
    name: "Essentiel",
    price: 9.99,
    description: "Pour aller plus loin dans tes rencontres",

    limits: {
      dailyLikes: Infinity,
      dailyMessages: Infinity,
      superLikesPerDay: 3,
      boostsPerMonth: 1,
      profileViews: 100,
      maxMatches: Infinity,
      vibePlannerPerMonth: 3,
    },

    features: {
      circleOfSix: true,
      ghostMode: false,
      vibePlanner: true,
      profileVisitors: false,
      premiumFilters: false,
      advancedVibeSphere: false,
      unlimitedMessages: true,
      unlimitedLikes: true,
      eventsAccess: true,
      vibementorCoaching: false,
      vipCommunity: false,
      prioritySupport: true,
    },
  },

  "premium-monthly": {
    id: "premium-monthly",
    name: "Premium",
    price: 19.99,
    description: "L’expérience SferaLuna complète",

    limits: {
      dailyLikes: Infinity,
      dailyMessages: Infinity,
      superLikesPerDay: 10,
      boostsPerMonth: 3,
      profileViews: Infinity,
      maxMatches: Infinity,
      vibePlannerPerMonth: Infinity,
    },

    features: {
      circleOfSix: true,
      ghostMode: true,
      vibePlanner: true,
      profileVisitors: true,
      premiumFilters: true,
      advancedVibeSphere: true,
      unlimitedMessages: true,
      unlimitedLikes: true,
      eventsAccess: true,
      vibementorCoaching: false,
      vipCommunity: false,
      prioritySupport: true,
    },
  },

  "elite-monthly": {
    id: "elite-monthly",
    name: "Elite",
    price: 34.99,
    description: "Pour les plus engagées",

    limits: {
      dailyLikes: Infinity,
      dailyMessages: Infinity,
      superLikesPerDay: Infinity,
      boostsPerMonth: 10,
      profileViews: Infinity,
      maxMatches: Infinity,
      vibePlannerPerMonth: Infinity,
    },

    features: {
      circleOfSix: true,
      ghostMode: true,
      vibePlanner: true,
      profileVisitors: true,
      premiumFilters: true,
      advancedVibeSphere: true,
      unlimitedMessages: true,
      unlimitedLikes: true,
      eventsAccess: true,
      vibementorCoaching: true,
      vipCommunity: true,
      prioritySupport: true,
    },
  },
} as const;

/**
 * Type des plans disponibles.
 *
 * Résultat :
 * "free" | "essential-monthly" | "premium-monthly" | "elite-monthly"
 */
export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

/**
 * Type complet d’un plan.
 */
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[PlanId];

/**
 * Type des limites disponibles.
 */
export type LimitKey = keyof SubscriptionPlan["limits"];

/**
 * Type des fonctionnalités disponibles.
 *
 * Résultat :
 * "circleOfSix" | "ghostMode" | "vibePlanner" | etc.
 */
export type FeatureKey = keyof SubscriptionPlan["features"];

/**
 * Liste ordonnée des plans.
 * Sert à comparer le niveau d’un abonnement.
 */
export const PLAN_ORDER: PlanId[] = [
  "free",
  "essential-monthly",
  "premium-monthly",
  "elite-monthly",
];

/**
 * Vérifie si une valeur est un PlanId valide.
 */
export function isValidPlanId(plan: unknown): plan is PlanId {
  return typeof plan === "string" && plan in SUBSCRIPTION_PLANS;
}

/**
 * Normalise un plan inconnu.
 */
export function normalizePlanId(plan: unknown): PlanId {
  if (isValidPlanId(plan)) return plan;
  return "free";
}

/**
 * Retourne le rang numérique d’un plan.
 */
export function getPlanRank(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan);
}

/**
 * Vérifie si un plan actuel est supérieur ou égal au plan requis.
 */
export function isPlanAtLeast(currentPlan: PlanId, requiredPlan: PlanId): boolean {
  return getPlanRank(currentPlan) >= getPlanRank(requiredPlan);
}