// src/hooks/usePremium.ts

"use client";

import { useSession } from "next-auth/react";
import { canUseFeature, isPremiumActive, getPlanLabel, PremiumFeatureManager } from "@/lib/premium";
import type { LunaFeature } from "@/lib/premium";
import type { IUser } from "@/models/User";

/**
 * Hook client pour vérifier l'accès premium dans les composants React.
 *
 * Usage :
 * ```tsx
 * const { isPremium, can, planLabel } = usePremium();
 * if (!can("invisible_mode")) return <UpgradePrompt />;
 * ```
 */
export function usePremium() {
  const { data: session, status } = useSession();

  const user = session?.user as any;

  const plan = user?.plan ?? "free";
  const premium = user?.isPremium === true;
  const subscriptionStatus = user?.subscriptionStatus ?? "inactive";

  const userLike = { isPremium: premium, plan, subscriptionStatus } as Pick<
    IUser,
    "isPremium" | "plan" | "subscriptionStatus"
  >;

  const active = isPremiumActive(userLike);

  return {
    /** true si l'abonnement est réellement actif (active ou trialing) */
    isPremium: active,

    /** Plan actuel (ex: "premium-monthly") */
    plan,

    /** Label lisible (ex: "Premium") */
    planLabel: getPlanLabel(plan),

    /** Vérifie l'accès à une fonctionnalité spécifique */
    can: (feature: LunaFeature) => canUseFeature(userLike, feature),

    /** Chargement de la session en cours */
    isLoading: status === "loading",

    /** Accès à l'objet session complet si besoin */
    session,
  };
}
