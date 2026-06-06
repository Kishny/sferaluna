// src/__tests__/subscription-config.test.ts
//
// Tests unitaires pour la configuration des abonnements.
// Ces tests vérifient que la logique des plans, limites et features
// est correcte et cohérente.

import { describe, it, expect } from "vitest";
import {
  SUBSCRIPTION_PLANS,
  PLAN_ORDER,
  getPlanRank,
  isPlanAtLeast,
  normalizePlanId,
  isValidPlanId,
  type PlanId,
} from "@/lib/subscription/config";

describe("SUBSCRIPTION_PLANS", () => {
  it("contient les 4 plans attendus", () => {
    expect(Object.keys(SUBSCRIPTION_PLANS)).toEqual([
      "free",
      "essential-monthly",
      "premium-monthly",
      "elite-monthly",
    ]);
  });

  it("le plan free a des limites restrictives", () => {
    const free = SUBSCRIPTION_PLANS.free;
    expect(free.limits.dailyLikes).toBe(5);
    expect(free.limits.dailyMessages).toBe(10);
    expect(free.limits.maxMatches).toBe(3);
    expect(free.features.ghostMode).toBe(false);
    expect(free.features.circleOfSix).toBe(false);
  });

  it("le plan essential active circleOfSix mais pas ghostMode", () => {
    const essential = SUBSCRIPTION_PLANS["essential-monthly"];
    expect(essential.features.circleOfSix).toBe(true);
    expect(essential.features.ghostMode).toBe(false);
    expect(essential.features.unlimitedLikes).toBe(true);
    expect(essential.features.unlimitedMessages).toBe(true);
  });

  it("le plan premium active ghostMode", () => {
    const premium = SUBSCRIPTION_PLANS["premium-monthly"];
    expect(premium.features.ghostMode).toBe(true);
    expect(premium.features.profileVisitors).toBe(true);
    expect(premium.features.premiumFilters).toBe(true);
  });

  it("le plan elite active vibementorCoaching et vipCommunity", () => {
    const elite = SUBSCRIPTION_PLANS["elite-monthly"];
    expect(elite.features.vibementorCoaching).toBe(true);
    expect(elite.features.vipCommunity).toBe(true);
    expect(elite.limits.boostsPerMonth).toBe(10);
  });

  it("les limites Infinity sont correctes pour les plans payants", () => {
    for (const planId of ["essential-monthly", "premium-monthly", "elite-monthly"] as PlanId[]) {
      const plan = SUBSCRIPTION_PLANS[planId];
      expect(plan.limits.dailyLikes).toBe(Infinity);
      expect(plan.limits.dailyMessages).toBe(Infinity);
      expect(plan.limits.maxMatches).toBe(Infinity);
    }
  });
});

describe("PLAN_ORDER", () => {
  it("est dans le bon ordre croissant", () => {
    expect(PLAN_ORDER).toEqual([
      "free",
      "essential-monthly",
      "premium-monthly",
      "elite-monthly",
    ]);
  });
});

describe("getPlanRank", () => {
  it("retourne 0 pour free", () => expect(getPlanRank("free")).toBe(0));
  it("retourne 1 pour essential", () => expect(getPlanRank("essential-monthly")).toBe(1));
  it("retourne 2 pour premium", () => expect(getPlanRank("premium-monthly")).toBe(2));
  it("retourne 3 pour elite", () => expect(getPlanRank("elite-monthly")).toBe(3));
});

describe("isPlanAtLeast", () => {
  it("free est au moins free", () => expect(isPlanAtLeast("free", "free")).toBe(true));
  it("free n'est pas au moins premium", () => expect(isPlanAtLeast("free", "premium-monthly")).toBe(false));
  it("elite est au moins premium", () => expect(isPlanAtLeast("elite-monthly", "premium-monthly")).toBe(true));
  it("premium n'est pas au moins elite", () => expect(isPlanAtLeast("premium-monthly", "elite-monthly")).toBe(false));
  it("essential est au moins essential", () => expect(isPlanAtLeast("essential-monthly", "essential-monthly")).toBe(true));
});

describe("normalizePlanId", () => {
  it("retourne free pour une valeur inconnue", () => {
    expect(normalizePlanId("unknown")).toBe("free");
    expect(normalizePlanId(null)).toBe("free");
    expect(normalizePlanId(undefined)).toBe("free");
    expect(normalizePlanId("")).toBe("free");
  });

  it("retourne le plan tel quel si valide", () => {
    expect(normalizePlanId("premium-monthly")).toBe("premium-monthly");
    expect(normalizePlanId("elite-monthly")).toBe("elite-monthly");
  });
});

describe("isValidPlanId", () => {
  it("valide les plans connus", () => {
    expect(isValidPlanId("free")).toBe(true);
    expect(isValidPlanId("elite-monthly")).toBe(true);
  });

  it("rejette les plans inconnus", () => {
    expect(isValidPlanId("premium")).toBe(false); // ancienne clé
    expect(isValidPlanId("master")).toBe(false);
    expect(isValidPlanId("basic")).toBe(false);
    expect(isValidPlanId("")).toBe(false);
  });
});
