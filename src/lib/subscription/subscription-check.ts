// src/lib/subscription/subscription-check.ts

/**
 * Guard / helper d'abonnement SferaLuna.
 *
 * Ce fichier sert à :
 * - vérifier si une utilisatrice est connectée ;
 * - récupérer son abonnement actif ;
 * - déterminer son plan actuel ;
 * - vérifier ses droits premium ;
 * - contrôler les limites quotidiennes / mensuelles ;
 * - protéger des routes API selon un plan ou une fonctionnalité ;
 * - retourner des réponses JSON propres en cas de refus.
 *
 * IMPORTANT :
 * Ce fichier utilise :
 * - getServerSession()
 * - MongoDB / Mongoose
 * - les modèles User, Subscription, Boost, ProfileView
 *
 * Il ne doit donc PAS être utilisé dans le vrai middleware Edge de Next.js
 * placé à la racine du projet.
 *
 * Utilisation recommandée :
 * - dans une route API ;
 * - dans un server action ;
 * - dans un helper serveur.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";

import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { Boost } from "@/models/Boost";
import { ProfileView } from "@/models/ProfileView";

import {
  SUBSCRIPTION_PLANS,
  type PlanId,
  type FeatureKey,
} from "@/lib/subscription/config";

// ─────────────────────────────────────────────
// Types internes
// ─────────────────────────────────────────────

/**
 * Actions limitées par abonnement.
 *
 * Ces actions correspondent aux usages que l'on veut contrôler :
 * - likes quotidiens ;
 * - messages quotidiens ;
 * - super likes ;
 * - boosts mensuels ;
 * - vues de profil.
 */
export type SubscriptionAction =
  | "like"
  | "send_message"
  | "use_super_like"
  | "use_boost"
  | "view_profile"
  | "circle_of_six"
  | "vibeplanner";

/**
 * Résultat standard d'une vérification de limite.
 */
export interface ActionCheckResult {
  allowed: boolean;
  reason?: string;
  currentPlan?: PlanId;
  requiredPlan?: PlanId;
  feature?: FeatureKey | string;
  remaining?: number;
  limit?: number;
  used?: number;
  upgradeUrl?: string;
}

/**
 * Résultat standard d'une vérification d'accès.
 */
export interface AccessCheckResult {
  allowed: boolean;
  user?: any;
  subscription?: any;
  currentPlan?: PlanId;
  reason?: string;
  status?: number;
  upgradeUrl?: string;
}

/**
 * Options pour protéger une route.
 */
export interface SubscriptionGuardOptions {
  /**
   * Plan minimum requis.
   * Exemple : "premium-monthly"
   */
  requiredPlan?: PlanId;

  /**
   * Fonctionnalité requise.
   * Exemple : "ghostMode"
   */
  requiredFeature?: FeatureKey;

  /**
   * Action à contrôler avec limite.
   * Exemple : "send_message"
   */
  action?: SubscriptionAction;

  /**
   * Nombre d'actions à consommer.
   * Exemple : envoyer 1 message = 1.
   */
  count?: number;

  /**
   * Autorise ou non les comptes gratuits.
   * Par défaut : true.
   */
  allowFree?: boolean;
}

// ─────────────────────────────────────────────
// Helpers dates
// ─────────────────────────────────────────────

/**
 * Début de la journée actuelle.
 * Sert à compter les usages quotidiens.
 */
function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Début du mois actuel.
 * Sert à compter les usages mensuels.
 */
function getStartOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Convertit une valeur quelconque en PlanId sûr.
 */
function normalizePlan(plan?: string | null): PlanId {
  if (plan && plan in SUBSCRIPTION_PLANS) {
    return plan as PlanId;
  }

  return "free";
}

/**
 * Hiérarchie des plans.
 *
 * Plus le nombre est élevé, plus le plan est puissant.
 */
function getPlanRank(plan: PlanId): number {
  const ranks: Record<PlanId, number> = {
    free: 0,
    "essential-monthly": 1,
    "premium-monthly": 2,
    "elite-monthly": 3,
  };

  return ranks[plan] ?? 0;
}

/**
 * Vérifie si un plan utilisateur est suffisant
 * pour accéder à un plan requis.
 */
function isPlanEnough(currentPlan: PlanId, requiredPlan: PlanId) {
  return getPlanRank(currentPlan) >= getPlanRank(requiredPlan);
}

/**
 * URL standard d'upgrade.
 */
function getUpgradeUrl() {
  return "/tarifs";
}

// ─────────────────────────────────────────────
// Classe principale
// ─────────────────────────────────────────────

export class SubscriptionChecker {
  private userId: string;

  public user: any = null;
  public subscription: any = null;
  public initialized = false;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Initialise le checker :
   * - connexion MongoDB ;
   * - récupération utilisateur ;
   * - récupération abonnement actif.
   */
  async initialize() {
    if (this.initialized) return;

    await connectDB();

    this.user = await User.findById(this.userId);

    if (!this.user) {
      throw new Error("Utilisateur introuvable.");
    }

    this.subscription = await Subscription.findOne({
      userId: this.userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 });

    this.initialized = true;
  }

  /**
   * Retourne le plan actuel.
   *
   * Priorité :
   * 1. abonnement actif ;
   * 2. champ user.plan si disponible ;
   * 3. free.
   */
  async getCurrentPlan(): Promise<PlanId> {
    await this.initialize();

    const subscriptionPlan = this.subscription?.plan;
    const userPlan = this.user?.plan;

    return normalizePlan(subscriptionPlan || userPlan || "free");
  }

  /**
   * Retourne les limites du plan actuel.
   */
  async getCurrentLimits() {
    const currentPlan = await this.getCurrentPlan();
    return SUBSCRIPTION_PLANS[currentPlan].limits;
  }

  /**
   * Retourne les fonctionnalités du plan actuel.
   */
  async getCurrentFeatures() {
    const currentPlan = await this.getCurrentPlan();
    return SUBSCRIPTION_PLANS[currentPlan].features;
  }

  /**
   * Vérifie si l'utilisateur a une fonctionnalité.
   *
   * Exemple :
   * await checker.hasFeature("ghostMode")
   */
  async hasFeature(feature: FeatureKey): Promise<boolean> {
    await this.initialize();

    const currentPlan = await this.getCurrentPlan();
    const planConfig = SUBSCRIPTION_PLANS[currentPlan];

    return Boolean(planConfig.features[feature]);
  }

  /**
   * Vérifie si l'abonnement actif est toujours valable.
   */
  async hasActiveSubscription(): Promise<boolean> {
    await this.initialize();

    const currentPlan = await this.getCurrentPlan();

    /**
     * Le plan gratuit n'a pas forcément de document Subscription.
     * Il est donc considéré comme disponible.
     */
    if (currentPlan === "free") return true;

    if (!this.subscription) return false;

    if (
      this.subscription.currentPeriodEnd &&
      new Date(this.subscription.currentPeriodEnd) < new Date()
    ) {
      return false;
    }

    return ["active", "trialing"].includes(this.subscription.status);
  }

  /**
   * Vérifie qu'un plan minimum est respecté.
   */
  async requirePlan(requiredPlan: PlanId): Promise<AccessCheckResult> {
    await this.initialize();

    const currentPlan = await this.getCurrentPlan();

    if (!isPlanEnough(currentPlan, requiredPlan)) {
      return {
        allowed: false,
        user: this.user,
        subscription: this.subscription,
        currentPlan,
        reason: "Plan insuffisant.",
        status: 403,
        upgradeUrl: getUpgradeUrl(),
      };
    }

    return {
      allowed: true,
      user: this.user,
      subscription: this.subscription,
      currentPlan,
    };
  }

  /**
   * Vérifie qu'une fonctionnalité est disponible.
   */
  async requireFeature(feature: FeatureKey): Promise<AccessCheckResult> {
    await this.initialize();

    const currentPlan = await this.getCurrentPlan();
    const hasFeature = await this.hasFeature(feature);

    if (!hasFeature) {
      return {
        allowed: false,
        user: this.user,
        subscription: this.subscription,
        currentPlan,
        reason: "Fonctionnalité non disponible avec votre plan actuel.",
        status: 403,
        upgradeUrl: getUpgradeUrl(),
      };
    }

    return {
      allowed: true,
      user: this.user,
      subscription: this.subscription,
      currentPlan,
    };
  }

  /**
   * Vérifie si l'utilisateur peut effectuer une action.
   *
   * Cette méthode ne consomme pas l'action.
   * Elle vérifie seulement les limites.
   *
   * La consommation réelle doit être faite dans la route API concernée
   * après succès de l'action.
   */
  async canPerformAction(
    action: SubscriptionAction,
    count = 1
  ): Promise<ActionCheckResult> {
    await this.initialize();

    const currentPlan = await this.getCurrentPlan();
    const planConfig = SUBSCRIPTION_PLANS[currentPlan];
    const limits = planConfig.limits;

    const subscriptionActive = await this.hasActiveSubscription();

    if (!subscriptionActive) {
      return {
        allowed: false,
        currentPlan,
        reason: "Votre abonnement n'est plus actif.",
        upgradeUrl: getUpgradeUrl(),
      };
    }

    switch (action) {
      case "like": {
        const used = await this.getDailyLikesCount();
        const limit = limits.dailyLikes;

        if (limit !== Infinity && used + count > limit) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite quotidienne de likes atteinte.",
            used,
            limit,
            remaining: Math.max(0, limit - used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
        };
      }

      case "send_message": {
        const used = await this.getDailyMessagesCount();
        const limit = limits.dailyMessages;

        if (limit !== Infinity && used + count > limit) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite quotidienne de messages atteinte.",
            used,
            limit,
            remaining: Math.max(0, limit - used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
        };
      }

      case "use_super_like": {
        const used = await this.getDailySuperLikesCount();
        const limit = limits.superLikesPerDay;

        if (limit !== Infinity && used + count > limit) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite quotidienne de super likes atteinte.",
            used,
            limit,
            remaining: Math.max(0, limit - used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
        };
      }

      case "use_boost": {
        const used = await this.getMonthlyBoostsCount();
        const limit = limits.boostsPerMonth;

        if (limit !== Infinity && used + count > limit) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite mensuelle de boosts atteinte.",
            used,
            limit,
            remaining: Math.max(0, limit - used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
        };
      }

      case "view_profile": {
        const used = await this.getProfileViewsCount();
        const limit = limits.profileViews;

        if (limit !== Infinity && used + count > limit) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite de vues de profils atteinte.",
            used,
            limit,
            remaining: Math.max(0, limit - used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: limit === Infinity ? Infinity : Math.max(0, limit - used),
        };
      }

      case "circle_of_six": {
        const hasFeature = await this.hasFeature("circleOfSix");

        if (!hasFeature) {
          return {
            allowed: false,
            currentPlan,
            feature: "circleOfSix",
            reason: "Circle of Six n'est pas disponible avec votre plan actuel.",
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
        };
      }

      case "vibeplanner": {
        const hasFeature = await this.hasFeature("vibePlanner");

        if (!hasFeature) {
          return {
            allowed: false,
            currentPlan,
            feature: "vibePlanner",
            reason: "VibePlanner n'est pas disponible avec votre plan actuel.",
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
        };
      }

      default: {
        return {
          allowed: true,
          currentPlan,
        };
      }
    }
  }

  // ─────────────────────────────────────────────
  // Compteurs d'usage
  // ─────────────────────────────────────────────

  /**
   * Compte les likes du jour.
   *
   * On suppose que ton User contient éventuellement :
   * - dailyLikesCount
   * - dailyLikesDate
   *
   * Si tu n'as pas encore ces champs, ça renvoie 0 proprement.
   */
  private async getDailyLikesCount(): Promise<number> {
    const today = getStartOfToday();

    const lastDate = this.user?.dailyLikesDate
      ? new Date(this.user.dailyLikesDate)
      : null;

    if (!lastDate || lastDate < today) return 0;

    return Number(this.user?.dailyLikesCount ?? 0);
  }

  /**
   * Compte les messages envoyés aujourd'hui.
   *
   * On suppose que ton User contient éventuellement :
   * - dailyMessagesCount
   * - dailyMessagesDate
   *
   * Si tu n'as pas encore ces champs, ça renvoie 0 proprement.
   */
  private async getDailyMessagesCount(): Promise<number> {
    const today = getStartOfToday();

    const lastDate = this.user?.dailyMessagesDate
      ? new Date(this.user.dailyMessagesDate)
      : null;

    if (!lastDate || lastDate < today) return 0;

    return Number(this.user?.dailyMessagesCount ?? 0);
  }

  /**
   * Compte les super likes du jour.
   *
   * On suppose que ton User contient éventuellement :
   * - dailySuperLikesCount
   * - dailySuperLikesDate
   */
  private async getDailySuperLikesCount(): Promise<number> {
    const today = getStartOfToday();

    const lastDate = this.user?.dailySuperLikesDate
      ? new Date(this.user.dailySuperLikesDate)
      : null;

    if (!lastDate || lastDate < today) return 0;

    return Number(this.user?.dailySuperLikesCount ?? 0);
  }

  /**
   * Compte les boosts utilisés ce mois-ci.
   *
   * Modèle utilisé :
   * src/models/Boost.ts
   */
  private async getMonthlyBoostsCount(): Promise<number> {
    const startOfMonth = getStartOfMonth();

    try {
      return await Boost.countDocuments({
        userId: this.userId,
        createdAt: { $gte: startOfMonth },
      });
    } catch {
      return 0;
    }
  }

  /**
   * Compte les vues de profil effectuées.
   *
   * Modèle utilisé :
   * src/models/ProfileView.ts
   *
   * On compte les vues faites par l'utilisateur connecté.
   */
  private async getProfileViewsCount(): Promise<number> {
    try {
      return await ProfileView.countDocuments({
        viewerId: this.userId,
      });
    } catch {
      return 0;
    }
  }
}

// ─────────────────────────────────────────────
// Helper session utilisateur
// ─────────────────────────────────────────────

/**
 * Récupère l'utilisateur connecté depuis NextAuth.
 *
 * Retourne :
 * - user MongoDB ;
 * - session NextAuth ;
 * - réponse JSON en cas d'erreur.
 */
export async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      user: null,
      session,
      response: NextResponse.json(
        {
          success: false,
          error: "Non authentifié.",
        },
        { status: 401 }
      ),
    };
  }

  await connectDB();

  const user = await User.findOne({
    email: session.user.email,
  });

  if (!user) {
    return {
      user: null,
      session,
      response: NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
        },
        { status: 404 }
      ),
    };
  }

  return {
    user,
    session,
    response: null,
  };
}

// ─────────────────────────────────────────────
// Guard principal pour route API
// ─────────────────────────────────────────────

/**
 * Vérifie l'accès abonnement d'une route API.
 *
 * Exemple :
 *
 * const access = await checkSubscriptionAccess({
 *   requiredFeature: "ghostMode",
 * });
 *
 * if (!access.allowed) return access.response;
 *
 * const user = access.user;
 */
export async function checkSubscriptionAccess(options: SubscriptionGuardOptions = {}) {
  const {
    requiredPlan,
    requiredFeature,
    action,
    count = 1,
    allowFree = true,
  } = options;

  try {
    const auth = await getAuthenticatedUser();

    if (auth.response || !auth.user) {
      return {
        allowed: false,
        user: null,
        subscription: null,
        currentPlan: "free" as PlanId,
        response: auth.response,
      };
    }

    const checker = new SubscriptionChecker(auth.user._id.toString());

    await checker.initialize();

    const currentPlan = await checker.getCurrentPlan();

    if (!allowFree && currentPlan === "free") {
      return {
        allowed: false,
        user: auth.user,
        subscription: checker.subscription,
        currentPlan,
        response: NextResponse.json(
          {
            success: false,
            error: "Cette action nécessite un abonnement actif.",
            currentPlan,
            upgradeUrl: getUpgradeUrl(),
          },
          { status: 403 }
        ),
      };
    }

    if (requiredPlan) {
      const planCheck = await checker.requirePlan(requiredPlan);

      if (!planCheck.allowed) {
        return {
          allowed: false,
          user: auth.user,
          subscription: checker.subscription,
          currentPlan,
          response: NextResponse.json(
            {
              success: false,
              error: planCheck.reason,
              currentPlan,
              requiredPlan,
              upgradeUrl: planCheck.upgradeUrl,
            },
            { status: planCheck.status ?? 403 }
          ),
        };
      }
    }

    if (requiredFeature) {
      const featureCheck = await checker.requireFeature(requiredFeature);

      if (!featureCheck.allowed) {
        return {
          allowed: false,
          user: auth.user,
          subscription: checker.subscription,
          currentPlan,
          response: NextResponse.json(
            {
              success: false,
              error: featureCheck.reason,
              currentPlan,
              requiredFeature,
              upgradeUrl: featureCheck.upgradeUrl,
            },
            { status: featureCheck.status ?? 403 }
          ),
        };
      }
    }

    if (action) {
      const actionCheck = await checker.canPerformAction(action, count);

      if (!actionCheck.allowed) {
        return {
          allowed: false,
          user: auth.user,
          subscription: checker.subscription,
          currentPlan,
          response: NextResponse.json(
            {
              success: false,
              error: actionCheck.reason,
              currentPlan,
              action,
              used: actionCheck.used,
              limit: actionCheck.limit,
              remaining: actionCheck.remaining,
              upgradeUrl: actionCheck.upgradeUrl,
            },
            { status: 403 }
          ),
        };
      }
    }

    return {
      allowed: true,
      user: auth.user,
      subscription: checker.subscription,
      currentPlan,
      checker,
      response: null,
    };
  } catch (error) {
    console.error("Erreur checkSubscriptionAccess :", error);

    return {
      allowed: false,
      user: null,
      subscription: null,
      currentPlan: "free" as PlanId,
      response: NextResponse.json(
        {
          success: false,
          error: "Erreur de vérification d'abonnement.",
        },
        { status: 500 }
      ),
    };
  }
}

// ─────────────────────────────────────────────
// Helpers courts
// ─────────────────────────────────────────────

/**
 * Exige un plan minimum.
 *
 * Exemple :
 * const access = await requireSubscriptionPlan("premium-monthly");
 * if (!access.allowed) return access.response;
 */
export async function requireSubscriptionPlan(requiredPlan: PlanId) {
  return checkSubscriptionAccess({
    requiredPlan,
  });
}

/**
 * Exige une fonctionnalité premium.
 *
 * Exemple :
 * const access = await requireSubscriptionFeature("ghostMode");
 * if (!access.allowed) return access.response;
 */
export async function requireSubscriptionFeature(requiredFeature: FeatureKey) {
  return checkSubscriptionAccess({
    requiredFeature,
  });
}

/**
 * Exige qu'une action soit autorisée.
 *
 * Exemple :
 * const access = await requireSubscriptionAction("send_message");
 * if (!access.allowed) return access.response;
 */
export async function requireSubscriptionAction(
  action: SubscriptionAction,
  count = 1
) {
  return checkSubscriptionAccess({
    action,
    count,
  });
}

/**
 * Vérifie rapidement si l'utilisateur connecté est premium.
 */
export async function isCurrentUserPremium() {
  const access = await checkSubscriptionAccess();

  if (!access.allowed || !access.user) {
    return false;
  }

  return access.currentPlan !== "free";
}

/**
 * Retourne les infos d'abonnement de l'utilisateur connecté.
 *
 * Très utile pour une route :
 * GET /api/subscription/me
 */
export async function getCurrentSubscriptionInfo() {
  const access = await checkSubscriptionAccess();

  if (!access.allowed) {
    return access;
  }

  const checker = access.checker as SubscriptionChecker;

  const currentPlan = await checker.getCurrentPlan();
  const limits = await checker.getCurrentLimits();
  const features = await checker.getCurrentFeatures();

  return {
    allowed: true,
    user: access.user,
    subscription: access.subscription,
    currentPlan,
    limits,
    features,
    response: null,
  };
}