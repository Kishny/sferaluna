// src/lib/premium.ts

import type { IUser, SubscriptionStatus, UserPlan } from "@/models/User";

/**
 * Gestion premium SferaLuna.
 *
 * Ce fichier est le cerveau des accès premium.
 *
 * Objectifs :
 * - centraliser les droits par plan ;
 * - éviter de dupliquer la logique dans Explorer, Mon Compte, VibeSphere, etc. ;
 * - garder une logique légère pour le mobile-first ;
 * - ne jamais faire de requête ici ;
 * - vérifier à la fois le plan ET le statut d'abonnement.
 *
 * Important :
 * Les vraies activations premium doivent venir de Stripe Webhook.
 * Ce fichier ne fait que lire/interpréter les données déjà présentes.
 */

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * Fonctionnalités disponibles dans SferaLuna.
 *
 * Ces clés doivent rester stables, car elles peuvent être utilisées dans :
 * - usePremium ;
 * - useSubscription ;
 * - pages premium ;
 * - routes API de vérification ;
 * - composants UI d'upgrade.
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
 * Type minimal d'utilisateur premium.
 *
 * On évite d'avoir besoin de tout IUser.
 * C'est plus léger et plus pratique côté frontend mobile.
 */
export type PremiumUserLike = Pick<
  IUser,
  "isPremium" | "plan" | "subscriptionStatus"
>;

/**
 * Limites associées à un plan.
 *
 * null = illimité.
 */
export type PlanLimits = {
  likes: number | null;
  messages: number | null;
  boosts: number | null;
  profileViews: number | null;
};

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

/**
 * Liste des plans valides.
 */
export const VALID_PLANS: UserPlan[] = [
  "free",
  "essential-monthly",
  "premium-monthly",
  "elite-monthly",
];

/**
 * Liste des statuts valides.
 */
export const VALID_SUBSCRIPTION_STATUSES: SubscriptionStatus[] = [
  "inactive",
  "active",
  "trialing",
  "past_due",
  "canceled",
];

/**
 * Matrice des fonctionnalités par plan.
 *
 * Attention :
 * Le plan "free" ne contient aucune feature premium.
 *
 * Pour les fonctionnalités gratuites de base, ne les mets pas ici.
 * Ce fichier sert surtout à contrôler les avantages premium.
 */
export const PLAN_FEATURES: Record<UserPlan, LunaFeature[]> = {
  free: [],

  /**
   * Essentiel :
   * entrée premium légère.
   */
  "essential-monthly": [
    "priority_messages",
    "profile_visitors",
  ],

  /**
   * Premium :
   * expérience complète pour la majorité des utilisatrices.
   */
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

  /**
   * Elite :
   * toutes les fonctionnalités.
   */
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
 *
 * null = illimité.
 *
 * Ces valeurs peuvent servir plus tard dans :
 * - /api/subscription/check ;
 * - compteur de likes ;
 * - limitation des messages ;
 * - limitation des boosts.
 */
export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    likes: 10,
    messages: 5,
    boosts: 0,
    profileViews: 0,
  },

  "essential-monthly": {
    likes: 50,
    messages: 50,
    boosts: 0,
    profileViews: 20,
  },

  "premium-monthly": {
    likes: null,
    messages: null,
    boosts: 3,
    profileViews: null,
  },

  "elite-monthly": {
    likes: null,
    messages: null,
    boosts: null,
    profileViews: null,
  },
};

/**
 * Labels visibles dans l'interface.
 */
export const PLAN_LABELS: Record<UserPlan, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

/**
 * Labels des statuts d'abonnement.
 */
export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  inactive: "Inactif",
  active: "Actif",
  trialing: "Période d’essai",
  past_due: "Paiement en retard",
  canceled: "Annulé",
};

/**
 * Classement des plans.
 *
 * Plus le nombre est élevé, plus le plan est fort.
 */
export const PLAN_RANK: Record<UserPlan, number> = {
  free: 0,
  "essential-monthly": 1,
  "premium-monthly": 2,
  "elite-monthly": 3,
};

// ─────────────────────────────────────────────
// Normalisation
// ─────────────────────────────────────────────

/**
 * Sécurise une valeur de plan.
 */
export function normalizePlan(plan: unknown): UserPlan {
  if (VALID_PLANS.includes(plan as UserPlan)) {
    return plan as UserPlan;
  }

  return "free";
}

/**
 * Sécurise une valeur de statut.
 */
export function normalizeSubscriptionStatus(
  status: unknown
): SubscriptionStatus {
  if (VALID_SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus)) {
    return status as SubscriptionStatus;
  }

  return "inactive";
}

/**
 * Normalise un utilisateur minimal premium.
 *
 * Utile pour éviter que le frontend casse si une valeur session est absente.
 */
export function normalizePremiumUser(user?: Partial<PremiumUserLike> | null) {
  const plan = normalizePlan(user?.plan);
  const subscriptionStatus = normalizeSubscriptionStatus(
    user?.subscriptionStatus
  );

  return {
    isPremium: user?.isPremium === true,
    plan,
    subscriptionStatus,
  } satisfies PremiumUserLike;
}

// ─────────────────────────────────────────────
// Accès premium
// ─────────────────────────────────────────────

/**
 * Vérifie si l'abonnement est réellement actif.
 *
 * Source de vérité côté frontend :
 * - isPremium doit être true ;
 * - subscriptionStatus doit être active ou trialing ;
 * - plan ne doit pas être free.
 *
 * Pourquoi vérifier les 3 ?
 * Parce que ça évite les accès premium si un champ est resté incohérent.
 */
export function isPremiumActive(user: Partial<PremiumUserLike>): boolean {
  const normalizedUser = normalizePremiumUser(user);

  return (
    normalizedUser.isPremium === true &&
    normalizedUser.plan !== "free" &&
    (normalizedUser.subscriptionStatus === "active" ||
      normalizedUser.subscriptionStatus === "trialing")
  );
}

/**
 * Vérifie si un plan est au moins équivalent à un autre.
 *
 * Exemple :
 * hasAtLeastPlan("premium-monthly", "essential-monthly") => true
 */
export function hasAtLeastPlan(currentPlan: unknown, requiredPlan: UserPlan) {
  const normalizedCurrentPlan = normalizePlan(currentPlan);

  return PLAN_RANK[normalizedCurrentPlan] >= PLAN_RANK[requiredPlan];
}

/**
 * Vérifie si l'utilisateur a accès à une fonctionnalité.
 *
 * Très important :
 * on vérifie d'abord isPremiumActive().
 *
 * Donc un utilisateur :
 * - canceled ;
 * - inactive ;
 * - past_due ;
 * - free ;
 *
 * n'a pas accès aux fonctionnalités premium.
 */
export function canUseFeature(
  user: Partial<PremiumUserLike>,
  feature: LunaFeature
): boolean {
  const normalizedUser = normalizePremiumUser(user);

  if (!isPremiumActive(normalizedUser)) {
    return false;
  }

  return PLAN_FEATURES[normalizedUser.plan]?.includes(feature) ?? false;
}

/**
 * Retourne toutes les fonctionnalités disponibles pour un utilisateur.
 */
export function getAvailableFeatures(
  user: Partial<PremiumUserLike>
): LunaFeature[] {
  const normalizedUser = normalizePremiumUser(user);

  if (!isPremiumActive(normalizedUser)) {
    return [];
  }

  return PLAN_FEATURES[normalizedUser.plan] ?? [];
}

/**
 * Retourne true si l'utilisateur a au moins une des fonctionnalités données.
 */
export function canUseAnyFeature(
  user: Partial<PremiumUserLike>,
  features: LunaFeature[]
): boolean {
  return features.some((feature) => canUseFeature(user, feature));
}

/**
 * Retourne true si l'utilisateur a toutes les fonctionnalités données.
 */
export function canUseAllFeatures(
  user: Partial<PremiumUserLike>,
  features: LunaFeature[]
): boolean {
  return features.every((feature) => canUseFeature(user, feature));
}

// ─────────────────────────────────────────────
// Labels et affichage
// ─────────────────────────────────────────────

/**
 * Retourne le label affiché pour un plan donné.
 */
export function getPlanLabel(plan: unknown): string {
  const normalizedPlan = normalizePlan(plan);

  return PLAN_LABELS[normalizedPlan] ?? "Gratuit";
}

/**
 * Retourne le label affiché pour un statut d'abonnement.
 */
export function getSubscriptionStatusLabel(status: unknown): string {
  const normalizedStatus = normalizeSubscriptionStatus(status);

  return SUBSCRIPTION_STATUS_LABELS[normalizedStatus] ?? "Inactif";
}

/**
 * Retourne les limites du plan.
 */
export function getPlanLimits(plan: unknown): PlanLimits {
  const normalizedPlan = normalizePlan(plan);

  return PLAN_LIMITS[normalizedPlan] ?? PLAN_LIMITS.free;
}

/**
 * Retourne les fonctionnalités d'un plan sans vérifier l'utilisateur.
 *
 * Utile pour afficher une carte de pricing.
 */
export function getPlanFeatures(plan: unknown): LunaFeature[] {
  const normalizedPlan = normalizePlan(plan);

  return PLAN_FEATURES[normalizedPlan] ?? [];
}

/**
 * Vérifie si une limite est illimitée.
 */
export function isUnlimited(limit: number | null) {
  return limit === null;
}

// ─────────────────────────────────────────────
// Classe utilitaire optionnelle
// ─────────────────────────────────────────────

/**
 * Classe utilitaire pour utiliser la logique premium en style objet.
 *
 * Exemple :
 *
 * const manager = new PremiumFeatureManager(user);
 * manager.can("invisible_mode");
 */
export class PremiumFeatureManager {
  private user: PremiumUserLike;

  constructor(user: Partial<PremiumUserLike>) {
    this.user = normalizePremiumUser(user);
  }

  /**
   * True si l'abonnement est actif.
   */
  isActive(): boolean {
    return isPremiumActive(this.user);
  }

  /**
   * True si l'utilisateur peut utiliser une feature.
   */
  can(feature: LunaFeature): boolean {
    return canUseFeature(this.user, feature);
  }

  /**
   * True si l'utilisateur a au moins une feature de la liste.
   */
  canAny(features: LunaFeature[]): boolean {
    return canUseAnyFeature(this.user, features);
  }

  /**
   * True si l'utilisateur a toutes les features de la liste.
   */
  canAll(features: LunaFeature[]): boolean {
    return canUseAllFeatures(this.user, features);
  }

  /**
   * Liste des features disponibles pour l'utilisateur.
   */
  getFeatures(): LunaFeature[] {
    return getAvailableFeatures(this.user);
  }

  /**
   * Plan actuel.
   */
  getPlan(): UserPlan {
    return this.user.plan;
  }

  /**
   * Label du plan.
   */
  getPlanLabel(): string {
    return getPlanLabel(this.user.plan);
  }

  /**
   * Statut abonnement.
   */
  getSubscriptionStatus(): SubscriptionStatus {
    return this.user.subscriptionStatus;
  }

  /**
   * Label du statut.
   */
  getSubscriptionStatusLabel(): string {
    return getSubscriptionStatusLabel(this.user.subscriptionStatus);
  }

  /**
   * Limites du plan.
   */
  getLimits(): PlanLimits {
    return getPlanLimits(this.user.plan);
  }

  /**
   * True si le plan est au moins celui demandé.
   */
  hasAtLeastPlan(requiredPlan: UserPlan): boolean {
    return hasAtLeastPlan(this.user.plan, requiredPlan);
  }
}
