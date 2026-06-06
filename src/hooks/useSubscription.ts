// src/hooks/useSubscription.ts

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * Hook SferaLuna pour récupérer l'état réel de l'abonnement.
 *
 * Il utilise :
 * - GET  /api/subscription/status
 * - POST /api/subscription/check
 *
 * Source de vérité :
 * - subscriptionStatus doit être "active" ou "trialing"
 * - isPremium doit être true
 *
 * Important :
 * le simple fait d'avoir plan = "elite-monthly" ne suffit pas.
 * Stripe doit avoir confirmé le paiement via webhook.
 */

export type LunaPlan =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

export interface SubscriptionData {
  userId: string;
  email: string;
  pseudonyme: string;

  plan: LunaPlan;
  planLabel: string;

  isPremium: boolean;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStatusLabel: string;

  premiumStartedAt: string | null;
  premiumExpiresAt: string | null;
  lastPaymentAt: string | null;

  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeCheckoutSessionId?: string;

  features: Record<string, boolean>;
  limits: {
    likes: number | null;
    messages: number | null;
    boosts?: number | null;
    profileVisits?: number | null;
  };
  usage: {
    remainingSwipes?: number | null;
    remainingMessages?: number | null;
    remainingBoosts?: number | null;
    remainingProfileVisits?: number | null;
  };
}

export function useSubscription() {
  const { data: session, status } = useSession();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * Charge l'abonnement depuis l'API.
   */
  const fetchSubscription = useCallback(async () => {
    if (status === "loading") return;

    if (status !== "authenticated" || !session?.user?.email) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/subscription/status", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger l'abonnement.");
        setSubscription(null);
        return;
      }

      setSubscription(data.subscription);
    } catch {
      setError("Erreur de connexion à l'abonnement.");
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email, status]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Vérifie une action premium côté serveur.
   *
   * Exemple :
   * await checkAction("advanced_filters")
   * await checkAction("likes", 1)
   */
  const checkAction = useCallback(
    async (action: string, count = 1) => {
      try {
        const res = await fetch("/api/subscription/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            count,
          }),
        });

        return await res.json();
      } catch {
        return {
          success: false,
          allowed: false,
          error: "Erreur de vérification.",
        };
      }
    },
    []
  );

  /**
   * Premium réellement actif.
   */
  const isPremiumActive = useMemo(() => {
    return (
      subscription?.isPremium === true &&
      (subscription.subscriptionStatus === "active" ||
        subscription.subscriptionStatus === "trialing")
    );
  }, [subscription]);

  /**
   * Vérifie une feature depuis le payload local.
   */
  const hasFeature = useCallback(
    (feature: string) => {
      if (!isPremiumActive) return false;
      return subscription?.features?.[feature] === true;
    },
    [isPremiumActive, subscription?.features]
  );

  /**
   * Récupère les limites restantes.
   */
  const getRemaining = useCallback(
    (type: string) => {
      if (!subscription) return 0;

      switch (type) {
        case "likes":
        case "swipes":
          return subscription.usage?.remainingSwipes ?? 0;

        case "messages":
          return subscription.usage?.remainingMessages ?? 0;

        case "boosts":
          return subscription.usage?.remainingBoosts ?? 0;

        case "profileVisits":
          return subscription.usage?.remainingProfileVisits ?? 0;

        default:
          return 0;
      }
    },
    [subscription]
  );

  return {
    subscription,
    loading,
    error,

    isPremium: isPremiumActive,
    isPremiumActive,

    plan: subscription?.plan ?? "free",
    planLabel: subscription?.planLabel ?? "Gratuit",

    subscriptionStatus: subscription?.subscriptionStatus ?? "inactive",
    subscriptionStatusLabel:
      subscription?.subscriptionStatusLabel ?? "Inactif",

    features: subscription?.features ?? {},
    limits: subscription?.limits ?? null,
    usage: subscription?.usage ?? null,

    hasFeature,
    getRemaining,
    checkAction,
    refresh: fetchSubscription,
  };
}