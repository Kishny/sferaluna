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
 * - les modèles User, Subscription, Boost, ProfileVisit
 *
 * Il ne doit donc PAS être utilisé dans le vrai middleware Edge de Next.js
 * placé à la racine du projet.
 *
 * Utilisation recommandée :
 * - dans une route API ;
 * - dans une server action ;
 * - dans un helper serveur.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";

import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { Boost } from "@/models/Boost";
import { ProfileVisit } from "@/models/ProfileVisit";

import {
  SUBSCRIPTION_PLANS,
  type PlanId,
  type FeatureKey,
  normalizePlanId,
  isPlanAtLeast,
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
 * - super likes quotidiens ;
 * - boosts mensuels ;
 * - visites de profils ;
 * - accès Circle of Six ;
 * - accès VibePlanner.
 */
export type SubscriptionAction =
  | "like"
  | "send_message"
  | "use_super_like"
  | "use_boost"
  | "visit_profile"
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
   *
   * Exemple :
   * requiredPlan: "premium-monthly"
   */
  requiredPlan?: PlanId;

  /**
   * Fonctionnalité requise.
   *
   * Exemple :
   * requiredFeature: "ghostMode"
   */
  requiredFeature?: FeatureKey;

  /**
   * Action à contrôler avec limite.
   *
   * Exemple :
   * action: "send_message"
   */
  action?: SubscriptionAction;

  /**
   * Nombre d'actions à vérifier.
   *
   * Exemple :
   * envoyer 1 message = count: 1
   */
  count?: number;

  /**
   * Autorise ou non les comptes gratuits.
   *
   * Par défaut : true.
   */
  allowFree?: boolean;
}

/**
 * Retour de checkSubscriptionAccess().
 */
export interface SubscriptionAccessResult {
  allowed: boolean;
  user: any | null;
  subscription: any | null;
  currentPlan: PlanId;
  checker?: SubscriptionChecker;
  response: NextResponse | null;
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
 * URL standard d'upgrade.
 */
function getUpgradeUrl() {
  return "/tarifs";
}

/**
 * Convertit une valeur de limite en nombre exploitable.
 *
 * Note :
 * - Infinity est accepté côté TypeScript ;
 * - dans une réponse JSON, Infinity peut devenir null.
 *
 * Ici, on le garde dans le helper serveur.
 */
function getRemaining(limit: number, used: number) {
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - used);
}

/**
 * Vérifie si une limite est dépassée.
 */
function isLimitExceeded(limit: number, used: number, count: number) {
  if (limit === Infinity) return false;
  return used + count > limit;
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

    /**
     * On récupère le dernier abonnement actif ou en période d'essai.
     *
     * Important :
     * Stripe webhook doit rester la source principale pour mettre à jour :
     * - user.plan
     * - user.isPremium
     * - user.subscriptionStatus
     * - Subscription.status
     */
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
   * 2. champ user.plan ;
   * 3. free.
   */
  async getCurrentPlan(): Promise<PlanId> {
    await this.initialize();

    const subscriptionPlan = this.subscription?.plan;
    const userPlan = this.user?.plan;

    return normalizePlanId(subscriptionPlan || userPlan || "free");
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
   * Vérifie si l'abonnement est actif.
   *
   * Important :
   * - free est toujours considéré comme utilisable ;
   * - pour les plans payants, on exige un abonnement actif/trialing.
   */
  async hasActiveSubscription(): Promise<boolean> {
    await this.initialize();

    const currentPlan = await this.getCurrentPlan();

    /**
     * Le plan gratuit n'a pas forcément de document Subscription.
     */
    if (currentPlan === "free") return true;

    /**
     * Sécurité :
     * si l'utilisateur a un plan payant mais aucun abonnement actif,
     * on bloque.
     */
    if (!this.subscription) return false;

    /**
     * Vérification expiration si le champ existe.
     */
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

    if (!isPlanAtLeast(currentPlan, requiredPlan)) {
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
   * Cette méthode NE CONSOMME PAS l'action.
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

        if (isLimitExceeded(limit, used, count)) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite quotidienne de likes atteinte.",
            used,
            limit,
            remaining: getRemaining(limit, used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: getRemaining(limit, used),
        };
      }

      case "send_message": {
        const used = await this.getDailyMessagesCount();
        const limit = limits.dailyMessages;

        if (isLimitExceeded(limit, used, count)) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite quotidienne de messages atteinte.",
            used,
            limit,
            remaining: getRemaining(limit, used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: getRemaining(limit, used),
        };
      }

      case "use_super_like": {
        const used = await this.getDailySuperLikesCount();
        const limit = limits.superLikesPerDay;

        if (isLimitExceeded(limit, used, count)) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite quotidienne de super likes atteinte.",
            used,
            limit,
            remaining: getRemaining(limit, used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: getRemaining(limit, used),
        };
      }

      case "use_boost": {
        const used = await this.getMonthlyBoostsCount();
        const limit = limits.boostsPerMonth;

        if (isLimitExceeded(limit, used, count)) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite mensuelle de boosts atteinte.",
            used,
            limit,
            remaining: getRemaining(limit, used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: getRemaining(limit, used),
        };
      }

      case "visit_profile": {
        const used = await this.getProfileVisitsCount();
        const limit = limits.profileVisits;

        if (isLimitExceeded(limit, used, count)) {
          return {
            allowed: false,
            currentPlan,
            reason: "Limite de visites de profils atteinte.",
            used,
            limit,
            remaining: getRemaining(limit, used),
            upgradeUrl: getUpgradeUrl(),
          };
        }

        return {
          allowed: true,
          currentPlan,
          used,
          limit,
          remaining: getRemaining(limit, used),
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
   *
   * Si tu n'as pas encore ces champs, ça renvoie 0 proprement.
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
   * Compte les visites de profil effectuées.
   *
   * Modèle utilisé :
   * src/models/ProfileVisit.ts
   *
   * On compte les visites faites par l'utilisateur connecté :
   * - visitorId = utilisateur connecté
   *
   * Important :
   * Ici on compte toutes les visites stockées.
   * Si tu veux une limite quotidienne, ajoute :
   * createdAt: { $gte: getStartOfToday() }
   */
  private async getProfileVisitsCount(): Promise<number> {
    try {
      return await ProfileVisit.countDocuments({
        visitorId: this.userId,
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
    email: session.user.email.toLowerCase().trim(),
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
export async function checkSubscriptionAccess(
  options: SubscriptionGuardOptions = {}
): Promise<SubscriptionAccessResult> {
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
        currentPlan: "free",
        response: auth.response,
      };
    }

    const checker = new SubscriptionChecker(auth.user._id.toString());

    await checker.initialize();

    const currentPlan = await checker.getCurrentPlan();

    /**
     * Bloque explicitement les comptes gratuits si demandé.
     */
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

    /**
     * Vérification du plan minimum.
     */
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

    /**
     * Vérification d'une fonctionnalité.
     *
     * Exemple :
     * requiredFeature: "ghostMode"
     */
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

    /**
     * Vérification d'une action limitée.
     */
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
      currentPlan: "free",
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
 *
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
 *
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
 *
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
 *
 * Attention :
 * premium ici signifie simplement "plan différent de free".
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