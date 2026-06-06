// src/lib/subscription/service.ts
//
// Service d'abonnement côté serveur.
// Utilise Mongoose (pas Prisma) et la config centralisée SUBSCRIPTION_PLANS.
//
// Usage dans une route API :
//   const service = new SubscriptionService(userId);
//   const status = await service.getFeatureStatus("circleOfSix");

import {
  SUBSCRIPTION_PLANS,
  type PlanId,
  type FeatureKey,
  type LimitKey,
} from "./config";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Subscription } from "@/models/Subscription";

function normalizePlan(plan: unknown): PlanId {
  if (
    typeof plan === "string" &&
    plan in SUBSCRIPTION_PLANS
  ) {
    return plan as PlanId;
  }
  return "free";
}

function isSubscriptionActive(sub: { status?: string; currentPeriodEnd?: Date } | null): boolean {
  if (!sub) return false;
  if (!["active", "trialing"].includes(sub.status ?? "")) return false;
  if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd) < new Date()) return false;
  return true;
}

export class SubscriptionService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Retourne le plan actif de l'utilisatrice.
   */
  async getCurrentPlan(): Promise<PlanId> {
    await connectDB();

    const sub = await Subscription.findOne({
      userId: this.userId,
      status: { $in: ["active", "trialing"] },
    }).sort({ createdAt: -1 });

    if (!isSubscriptionActive(sub)) return "free";
    return normalizePlan(sub?.plan);
  }

  /**
   * Retourne la config complète du plan actif.
   */
  async getPlanConfig() {
    const plan = await this.getCurrentPlan();
    return SUBSCRIPTION_PLANS[plan];
  }

  /**
   * Vérifie si une feature est disponible.
   */
  async hasFeature(feature: FeatureKey): Promise<boolean> {
    const config = await this.getPlanConfig();
    return config.features[feature] === true;
  }

  /**
   * Retourne la limite d'une clé de limite.
   */
  async getLimit(key: LimitKey): Promise<number> {
    const config = await this.getPlanConfig();
    const val = config.limits[key];
    return typeof val === "number" ? val : 0;
  }

  /**
   * Retourne le statut d'une feature avec infos de limite.
   * Compatible avec UsageLimits.tsx.
   */
  async getFeatureStatus(feature: string): Promise<{
    hasAccess: boolean;
    unlimited?: boolean;
    limit?: number;
    plan: PlanId;
  }> {
    const plan = await this.getCurrentPlan();
    const config = SUBSCRIPTION_PLANS[plan];
    const features = config.features as Record<string, boolean>;
    const limits = config.limits as Record<string, number>;

    const hasAccess = features[feature] === true;

    // Chercher une limite correspondante (ex: "messages" → dailyMessages)
    const limitKey = Object.keys(limits).find((k) =>
      k.toLowerCase().includes(feature.toLowerCase())
    );
    const limitValue = limitKey ? limits[limitKey] : undefined;
    const unlimited = limitValue === Infinity;

    return {
      hasAccess,
      unlimited: hasAccess && unlimited,
      limit: unlimited ? undefined : limitValue,
      plan,
    };
  }
}
