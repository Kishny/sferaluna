// src/hooks/usePremium.ts

"use client";

import { useCallback } from "react";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * Hook premium simplifié.
 *
 * Il sert aux composants comme :
 * - ExplorerPage
 * - MonCompte
 * - VibeSphere
 *
 * Il dépend maintenant de /api/subscription/status,
 * donc il respecte vraiment Stripe et le webhook.
 */
export function usePremium() {
  const {
    subscription,
    loading,
    error,
    isPremium,
    plan,
    planLabel,
    subscriptionStatus,
    subscriptionStatusLabel,
    hasFeature,
    checkAction,
    refresh,
  } = useSubscription();

  const can = useCallback(
    (feature: string) => {
      return hasFeature(feature);
    },
    [hasFeature]
  );

  return {
    isPremium,
    isLoading: loading,
    error,

    plan,
    planLabel,
    subscriptionStatus,
    subscriptionStatusLabel,

    subscription,

    can,
    checkAction,
    refresh,
  };
}
