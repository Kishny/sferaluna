// src/lib/subscription/config.ts

/**
 * Configuration centrale des abonnements SferaLuna.
 *
 * Ce fichier définit :
 * - les plans disponibles ;
 * - les limites par plan ;
 * - les fonctionnalités accessibles selon le plan ;
 * - les types TypeScript utilisés dans les guards premium.
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
      profileVisits: 20,
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
      profileVisits: 100,
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
      profileVisits: Infinity,
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
      profileVisits: Infinity,
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

export type PlanId = keyof typeof SUBSCRIPTION_PLANS;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[PlanId];

export type LimitKey = keyof SubscriptionPlan["limits"];

export type FeatureKey = keyof SubscriptionPlan["features"];

export const PLAN_ORDER: PlanId[] = [
  "free",
  "essential-monthly",
  "premium-monthly",
  "elite-monthly",
];

export function isValidPlanId(plan: unknown): plan is PlanId {
  return typeof plan === "string" && plan in SUBSCRIPTION_PLANS;
}

export function normalizePlanId(plan: unknown): PlanId {
  if (isValidPlanId(plan)) return plan;
  return "free";
}

export function getPlanRank(plan: PlanId): number {
  return PLAN_ORDER.indexOf(plan);
}

export function isPlanAtLeast(
  currentPlan: PlanId,
  requiredPlan: PlanId
): boolean {
  return getPlanRank(currentPlan) >= getPlanRank(requiredPlan);
}