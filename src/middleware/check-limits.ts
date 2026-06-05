// src/middleware/subscription-check.ts
// ou src/lib/subscription-check.ts

/**
 * SferaLuna — Subscription Checker
 * --------------------------------
 * Ce fichier centralise toute la logique liée aux abonnements :
 *
 * - récupérer l'utilisateur connecté ;
 * - récupérer son abonnement actif ;
 * - déterminer son plan réel : free, essential-monthly, premium-monthly, elite-monthly ;
 * - vérifier si un plan minimum est requis ;
 * - vérifier si une fonctionnalité premium est disponible ;
 * - vérifier les limites d'utilisation : likes, messages, swipes, boosts, vues de profil, etc.
 *
 * IMPORTANT :
 * Ce fichier n'est PAS un vrai middleware Next.js global.
 *
 * Pourquoi ?
 * Parce qu'il utilise :
 * - getServerSession ;
 * - Mongoose ;
 * - MongoDB ;
 * - des modèles User / Subscription.
 *
 * Ces éléments doivent tourner côté serveur Node.js, pas dans l'Edge Runtime
 * utilisé par le vrai fichier middleware.ts de Next.js.
 *
 * Utilisation recommandée dans une route API :
 *
 * const access = await requireSubscription({
 *   requiredFeature: "ghostMode",
 * });
 *
 * if (!access.ok) return access.response;
 *
 * // Suite de la route...
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription/config";

/**
 * Plans réellement utilisés dans ton projet SferaLuna.
 *
 * IMPORTANT :
 * Cette liste doit correspondre à ton fichier :
 * src/lib/subscription-plans.ts
 *
 * Et aussi à ta page Tarifs :
 * - free
 * - essential-monthly
 * - premium-monthly
 * - elite-monthly
 */
export const PLAN_HIERARCHY = [
  "free",
  "essential-monthly",
  "premium-monthly",
  "elite-monthly",
] as const;

export type PlanId = (typeof PLAN_HIERARCHY)[number];

/**
 * Actions pouvant être limitées selon le plan.
 *
 * Tu peux en ajouter plus tard :
 * - "create_event"
 * - "send_super_message"
 * - "upload_photo"
 * - "use_ai_coach"
 */
export type LimitedAction =
  | "swipe"
  | "like"
  | "send_message"
  | "use_boost"
  | "view_profile"
  | "use_super_like";

/**
 * Résultat standard d'une vérification de limite.
 */
export interface ActionPermissionResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  limit?: number;
  current?: number;
  plan?: PlanId;
}

/**
 * Contexte retourné quand l'utilisateur est bien authentifié.
 */
export interface SubscriptionContext {
  user: any;
  subscription: any | null;
  plan: PlanId;
  planConfig: (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];
  isPremium: boolean;
}

/**
 * Options pour protéger une route API.
 */
export interface RequireSubscriptionOptions {
  /**
   * Plan minimum requis.
   *
   * Exemple :
   * requiredPlan: "premium-monthly"
   */
  requiredPlan?: PlanId;

  /**
   * Fonctionnalité précise requise.
   *
   * Exemple :
   * requiredFeature: "ghostMode"
   */
  requiredFeature?: string;

  /**
   * Action limitée à vérifier.
   *
   * Exemple :
   * action: "send_message"
   */
  action?: LimitedAction;

  /**
   * Nombre d'actions à consommer.
   *
   * Exemple :
   * actionCount: 1
   */
  actionCount?: number;
}

/**
 * Résultat retourné par requireSubscription().
 *
 * Si ok = false :
 * - response contient directement la réponse JSON à retourner dans la route API.
 *
 * Si ok = true :
 * - context contient l'utilisateur, le plan et l'abonnement.
 */
export type RequireSubscriptionResult =
  | {
      ok: true;
      context: SubscriptionContext;
    }
  | {
      ok: false;
      response: NextResponse;
    };

/**
 * Vérifie si une valeur est un plan valide connu par SferaLuna.
 */
function isValidPlan(plan: unknown): plan is PlanId {
  return typeof plan === "string" && PLAN_HIERARCHY.includes(plan as PlanId);
}

/**
 * Retourne l'index d'un plan dans la hiérarchie.
 *
 * Plus l'index est élevé, plus le plan est puissant.
 */
function getPlanRank(plan: PlanId): number {
  return PLAN_HIERARCHY.indexOf(plan);
}

/**
 * Vérifie si userPlan est supérieur ou égal à requiredPlan.
 */
function hasRequiredPlan(userPlan: PlanId, requiredPlan: PlanId): boolean {
  return getPlanRank(userPlan) >= getPlanRank(requiredPlan);
}

/**
 * Normalise un plan venant de la base de données.
 *
 * Si le plan est absent ou inconnu, on retombe sur "free".
 */
function normalizePlan(plan: unknown): PlanId {
  if (isValidPlan(plan)) return plan;
  return "free";
}

/**
 * Vérifie si un abonnement est réellement actif.
 *
 * On vérifie :
 * - qu'il existe ;
 * - que son status est "active" ou "trialing" ;
 * - que currentPeriodEnd n'est pas expiré, si cette date existe.
 */
function isSubscriptionActive(subscription: any | null): boolean {
  if (!subscription) return false;

  const validStatuses = ["active", "trialing"];

  if (!validStatuses.includes(subscription.status)) {
    return false;
  }

  if (subscription.currentPeriodEnd) {
    const endDate = new Date(subscription.currentPeriodEnd);

    if (!Number.isNaN(endDate.getTime()) && endDate < new Date()) {
      return false;
    }
  }

  return true;
}

/**
 * Récupère la configuration d'un plan depuis SUBSCRIPTION_PLANS.
 *
 * Si le plan n'existe pas dans le fichier de config, on utilise free.
 */
function getPlanConfig(plan: PlanId) {
  const config = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS];

  if (config) return config;

  return SUBSCRIPTION_PLANS.free;
}

/**
 * Retourne le début et la fin de la journée actuelle.
 *
 * Utilisé pour compter les limites quotidiennes :
 * - likes/jour ;
 * - messages/jour ;
 * - super likes/jour.
 */
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Retourne le début et la fin du mois actuel.
 *
 * Utilisé pour compter les boosts/mois.
 */
function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Classe principale de vérification d'abonnement.
 *
 * Elle est utile quand tu veux faire plusieurs vérifications
 * pour un même utilisateur dans une route API.
 */
export class SubscriptionChecker {
  private userId: string;
  private user: any | null;
  private subscription: any | null;
  private initialized: boolean;

  constructor(userId: string) {
    this.userId = userId;
    this.user = null;
    this.subscription = null;
    this.initialized = false;
  }

  /**
   * Initialise la connexion DB, l'utilisateur et son abonnement actif.
   *
   * Cette méthode est appelée automatiquement par les autres méthodes,
   * donc tu n'as pas besoin de l'appeler à la main dans la plupart des cas.
   */
  async initialize() {
    if (this.initialized) return;

    await connectDB();

    this.user = await User.findById(this.userId);

    /**
     * On récupère le dernier abonnement actif ou en période d'essai.
     *
     * Si aucun abonnement n'existe, l'utilisateur reste en plan free.
     */
    this.subscription = await Subscription.findOne({
      userId: this.userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 });

    this.initialized = true;
  }

  /**
   * Retourne l'utilisateur chargé.
   */
  async getUser() {
    await this.initialize();
    return this.user;
  }

  /**
   * Retourne l'abonnement actif, ou null.
   */
  async getSubscription() {
    await this.initialize();
    return this.subscription;
  }

  /**
   * Retourne le plan actuel réel.
   *
   * Important :
   * - Si pas d'abonnement actif : free.
   * - Si abonnement expiré : free.
   * - Si plan inconnu : free.
   */
  async getCurrentPlan(): Promise<PlanId> {
    await this.initialize();

    if (!isSubscriptionActive(this.subscription)) {
      return "free";
    }

    return normalizePlan(this.subscription?.plan);
  }

  /**
   * Retourne les limites du plan actuel.
   */
  async getCurrentLimits() {
    const plan = await this.getCurrentPlan();
    return getPlanConfig(plan).limits;
  }

  /**
   * Retourne les fonctionnalités du plan actuel.
   */
  async getCurrentFeatures() {
    const plan = await this.getCurrentPlan();
    return getPlanConfig(plan).features;
  }

  /**
   * Vérifie si l'utilisateur est premium.
   *
   * Ici, premium signifie :
   * - essential-monthly ;
   * - premium-monthly ;
   * - elite-monthly.
   */
  async isPremium(): Promise<boolean> {
    const plan = await this.getCurrentPlan();
    return plan !== "free";
  }

  /**
   * Vérifie si l'utilisateur a au moins un plan donné.
   */
  async hasPlan(requiredPlan: PlanId): Promise<boolean> {
    const currentPlan = await this.getCurrentPlan();
    return hasRequiredPlan(currentPlan, requiredPlan);
  }

  /**
   * Vérifie si une fonctionnalité est disponible dans le plan actuel.
   *
   * Exemple :
   * await checker.hasFeature("ghostMode")
   */
  async hasFeature(feature: string): Promise<boolean> {
    const plan = await this.getCurrentPlan();
    const planConfig = getPlanConfig(plan);

    const features = planConfig.features as unknown as Record<string, boolean>;

    return features[feature] === true;
  }

  /**
   * Vérifie si l'utilisateur peut effectuer une action limitée.
   *
   * Exemple :
   * await checker.canPerformAction("send_message")
   */
  async canPerformAction(
    action: LimitedAction,
    count: number = 1
  ): Promise<ActionPermissionResult> {
    await this.initialize();

    const plan = await this.getCurrentPlan();
    const planConfig = getPlanConfig(plan);
    const limits = planConfig.limits as unknown as Record<string, number>;

    /**
     * Petite sécurité :
     * si le fichier subscription-plans n'a pas encore certaines limites,
     * on évite de planter.
     */
    const safeLimit = (value: unknown, fallback: number) => {
      if (typeof value === "number") return value;
      return fallback;
    };

    switch (action) {
      case "swipe": {
        const limit = safeLimit(limits.dailySwipes, 0);
        const current = await this.getDailyCount("swipes");

        return this.buildLimitResult({
          plan,
          current,
          count,
          limit,
          reason: "Limite quotidienne de swipes atteinte.",
        });
      }

      case "like": {
        const limit = safeLimit(limits.dailyLikes, limits.dailySwipes ?? 0);
        const current = await this.getDailyCount("likes");

        return this.buildLimitResult({
          plan,
          current,
          count,
          limit,
          reason: "Limite quotidienne de likes atteinte.",
        });
      }

      case "send_message": {
        const limit = safeLimit(limits.dailyMessages, 0);
        const current = await this.getDailyCount("messages");

        return this.buildLimitResult({
          plan,
          current,
          count,
          limit,
          reason: "Limite quotidienne de messages atteinte.",
        });
      }

      case "use_boost": {
        const limit = safeLimit(limits.boostPerMonth, 0);
        const current = await this.getMonthlyCount("boosts");

        return this.buildLimitResult({
          plan,
          current,
          count,
          limit,
          reason: "Limite mensuelle de boosts atteinte.",
        });
      }

      case "view_profile": {
        const limit = safeLimit(limits.profileViews, 0);
        const current = await this.getTotalCount("profileViews");

        return this.buildLimitResult({
          plan,
          current,
          count,
          limit,
          reason: "Limite de vues de profils atteinte.",
        });
      }

      case "use_super_like": {
        const limit = safeLimit(limits.superLikesPerDay, 0);
        const current = await this.getDailyCount("superLikes");

        return this.buildLimitResult({
          plan,
          current,
          count,
          limit,
          reason: "Limite quotidienne de super likes atteinte.",
        });
      }

      default:
        return {
          allowed: false,
          reason: "Action inconnue.",
          plan,
        };
    }
  }

  /**
   * Construit un résultat de limite propre.
   *
   * Convention utile :
   * - limit = -1 signifie illimité.
   *
   * Dans ton fichier subscription-plans.ts, tu peux donc mettre :
   * dailyMessages: -1
   * pour les plans illimités.
   */
  private buildLimitResult({
    plan,
    current,
    count,
    limit,
    reason,
  }: {
    plan: PlanId;
    current: number;
    count: number;
    limit: number;
    reason: string;
  }): ActionPermissionResult {
    /**
     * -1 = illimité.
     */
    if (limit === -1) {
      return {
        allowed: true,
        current,
        limit,
        remaining: -1,
        plan,
      };
    }

    if (current + count > limit) {
      return {
        allowed: false,
        reason,
        current,
        remaining: Math.max(0, limit - current),
        limit,
        plan,
      };
    }

    return {
      allowed: true,
      current,
      remaining: Math.max(0, limit - current - count),
      limit,
      plan,
    };
  }

  /**
   * Compte une action quotidienne.
   *
   * À ADAPTER selon tes modèles réels.
   *
   * Pour l'instant, cette méthode utilise des imports dynamiques optionnels.
   * Si le modèle n'existe pas encore, elle retourne 0 pour éviter de casser le projet.
   *
   * Idéalement, tu pourras créer un modèle Usage pour centraliser ça.
   */
  private async getDailyCount(action: string): Promise<number> {
    const { start, end } = getTodayRange();

    try {
      /**
       * Option 1 recommandée plus tard :
       * créer un modèle Usage avec :
       *
       * {
       *   userId,
       *   action,
       *   createdAt
       * }
       *
       * Puis faire :
       *
       * return await Usage.countDocuments({
       *   userId: this.userId,
       *   action,
       *   createdAt: { $gte: start, $lte: end },
       * });
       */

      /**
       * Fallbacks possibles selon tes collections existantes.
       * Tu peux adapter les noms de modèles/routes selon ton projet.
       */
      if (action === "likes" || action === "swipes" || action === "superLikes") {
        try {
          const { Like } = await import("@/models/Like");

          return await Like.countDocuments({
            userId: this.userId,
            createdAt: { $gte: start, $lte: end },
          });
        } catch {
          return 0;
        }
      }

      if (action === "messages") {
        try {
          const { Message } = await import("@/models/Message");

          return await Message.countDocuments({
            senderId: this.userId,
            createdAt: { $gte: start, $lte: end },
          });
        } catch {
          return 0;
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Compte une action mensuelle.
   *
   * Utilisé pour les boosts.
   */
  private async getMonthlyCount(action: string): Promise<number> {
    const { start, end } = getCurrentMonthRange();

    try {
      if (action === "boosts") {
        try {
          const { Boost } = await import("@/models/Boost");

          return await Boost.countDocuments({
            userId: this.userId,
            createdAt: { $gte: start, $lte: end },
          });
        } catch {
          return 0;
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Compte une action totale.
   *
   * Utilisé par exemple pour :
   * - vues de profil ;
   * - nombre total d'éléments consommés.
   */
  private async getTotalCount(action: string): Promise<number> {
    try {
      if (action === "profileViews") {
        try {
          const { ProfileView } = await import("@/models/ProfileView");

          return await ProfileView.countDocuments({
            viewerId: this.userId,
          });
        } catch {
          return 0;
        }
      }

      return 0;
    } catch {
      return 0;
    }
  }
}

/**
 * Récupère le contexte d'abonnement de l'utilisateur connecté.
 *
 * Cette fonction est très utile dans tes routes API.
 */
export async function getSubscriptionContext(): Promise<SubscriptionContext | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  await connectDB();

  const user = await User.findOne({
    email: session.user.email,
  });

  if (!user) {
    return null;
  }

  const subscription = await Subscription.findOne({
    userId: user._id,
    status: { $in: ["active", "trialing"] },
  }).sort({ createdAt: -1 });

  const active = isSubscriptionActive(subscription);

  const plan = active ? normalizePlan(subscription?.plan) : "free";

  const planConfig = getPlanConfig(plan);

  return {
    user,
    subscription: active ? subscription : null,
    plan,
    planConfig,
    isPremium: plan !== "free",
  };
}

/**
 * Helper principal pour protéger une route API.
 *
 * Exemple :
 *
 * export async function POST(req: NextRequest) {
 *   const access = await requireSubscription({
 *     requiredFeature: "ghostMode",
 *   });
 *
 *   if (!access.ok) return access.response;
 *
 *   const { user, plan } = access.context;
 *
 *   // suite de la route...
 * }
 */
export async function requireSubscription(
  options: RequireSubscriptionOptions = {}
): Promise<RequireSubscriptionResult> {
  try {
    const context = await getSubscriptionContext();

    if (!context) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            success: false,
            error: "Non authentifié.",
          },
          { status: 401 }
        ),
      };
    }

    const { user, plan, planConfig } = context;

    /**
     * Vérification d'un plan minimum.
     */
    if (options.requiredPlan) {
      const allowed = hasRequiredPlan(plan, options.requiredPlan);

      if (!allowed) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: "Plan insuffisant.",
              requiredPlan: options.requiredPlan,
              currentPlan: plan,
              upgradeUrl: "/tarifs",
            },
            { status: 403 }
          ),
        };
      }
    }

    /**
     * Vérification d'une fonctionnalité précise.
     */
    if (options.requiredFeature) {
      const features = planConfig.features as unknown as Record<string, boolean>;
      const hasFeature = features[options.requiredFeature] === true;

      if (!hasFeature) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: "Fonctionnalité non disponible avec votre plan actuel.",
              feature: options.requiredFeature,
              currentPlan: plan,
              upgradeUrl: "/tarifs",
            },
            { status: 403 }
          ),
        };
      }
    }

    /**
     * Vérification d'une action limitée.
     */
    if (options.action) {
      const checker = new SubscriptionChecker(user._id.toString());

      const permission = await checker.canPerformAction(
        options.action,
        options.actionCount ?? 1
      );

      if (!permission.allowed) {
        return {
          ok: false,
          response: NextResponse.json(
            {
              success: false,
              error: permission.reason ?? "Action non autorisée.",
              action: options.action,
              currentPlan: plan,
              current: permission.current,
              remaining: permission.remaining,
              limit: permission.limit,
              upgradeUrl: "/tarifs",
            },
            { status: 403 }
          ),
        };
      }
    }

    return {
      ok: true,
      context,
    };
  } catch (error) {
    console.error("Erreur requireSubscription :", error);

    return {
      ok: false,
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

/**
 * Helper léger pour vérifier une fonctionnalité sans bloquer directement.
 *
 * Exemple :
 *
 * const canUseGhost = await userHasFeature("ghostMode");
 */
export async function userHasFeature(feature: string): Promise<boolean> {
  const context = await getSubscriptionContext();

  if (!context) return false;

  const features = context.planConfig.features as unknown as Record<string, boolean>;

  return features[feature] === true;
}

/**
 * Helper léger pour récupérer le plan courant.
 *
 * Exemple :
 *
 * const plan = await getCurrentUserPlan();
 */
export async function getCurrentUserPlan(): Promise<PlanId> {
  const context = await getSubscriptionContext();

  if (!context) return "free";

  return context.plan;
}

/**
 * Helper pour retourner une réponse JSON standard quand une route veut
 * simplement connaître le statut premium de l'utilisateur.
 */
export async function getSubscriptionStatusResponse() {
  const context = await getSubscriptionContext();

  if (!context) {
    return NextResponse.json(
      {
        success: false,
        error: "Non authentifié.",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    userId: context.user._id.toString(),
    plan: context.plan,
    isPremium: context.isPremium,
    subscriptionStatus: context.subscription?.status ?? "inactive",
    currentPeriodEnd: context.subscription?.currentPeriodEnd ?? null,
    features: context.planConfig.features,
    limits: context.planConfig.limits,
  });
}