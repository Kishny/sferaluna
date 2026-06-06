// src/__tests__/premium-helpers.test.ts
//
// Tests unitaires pour les helpers premium et abonnement.
// Couvre les cas critiques de la logique de plans.

import { describe, it, expect } from "vitest";
import {
  SUBSCRIPTION_PLANS,
  getPlanRank,
  isPlanAtLeast,
  normalizePlanId,
  type PlanId,
} from "@/lib/subscription/config";

// ─── Ghost Mode ────────────────────────────────────────────────────────────────

describe("ghostMode — règle de sécurité critique", () => {
  it("n'est pas disponible en free", () => {
    expect(SUBSCRIPTION_PLANS.free.features.ghostMode).toBe(false);
  });

  it("n'est pas disponible en essential", () => {
    expect(SUBSCRIPTION_PLANS["essential-monthly"].features.ghostMode).toBe(false);
  });

  it("est disponible en premium", () => {
    expect(SUBSCRIPTION_PLANS["premium-monthly"].features.ghostMode).toBe(true);
  });

  it("est disponible en elite", () => {
    expect(SUBSCRIPTION_PLANS["elite-monthly"].features.ghostMode).toBe(true);
  });
});

// ─── Limites quotidiennes ──────────────────────────────────────────────────────

describe("Limites quotidiennes", () => {
  it("free : 5 likes max par jour", () => {
    expect(SUBSCRIPTION_PLANS.free.limits.dailyLikes).toBe(5);
  });

  it("free : 10 messages max par jour", () => {
    expect(SUBSCRIPTION_PLANS.free.limits.dailyMessages).toBe(10);
  });

  it("essential : likes illimités", () => {
    expect(SUBSCRIPTION_PLANS["essential-monthly"].limits.dailyLikes).toBe(Infinity);
  });

  it("premium : messages illimités", () => {
    expect(SUBSCRIPTION_PLANS["premium-monthly"].limits.dailyMessages).toBe(Infinity);
  });
});

// ─── Hiérarchie des plans ─────────────────────────────────────────────────────

describe("Hiérarchie des plans", () => {
  const plans: PlanId[] = ["free", "essential-monthly", "premium-monthly", "elite-monthly"];

  it("chaque plan est supérieur au précédent", () => {
    for (let i = 1; i < plans.length; i++) {
      expect(getPlanRank(plans[i])).toBeGreaterThan(getPlanRank(plans[i - 1]));
    }
  });

  it("elite est le plan le plus élevé", () => {
    for (const plan of plans.slice(0, -1)) {
      expect(isPlanAtLeast("elite-monthly", plan)).toBe(true);
    }
  });

  it("free est le plan le plus bas", () => {
    for (const plan of plans.slice(1)) {
      expect(isPlanAtLeast("free", plan)).toBe(false);
    }
  });
});

// ─── Normalisation ────────────────────────────────────────────────────────────

describe("normalizePlanId — robustesse", () => {
  const invalides = ["premium", "basic", "master", "", null, undefined, 0, false, {}, []];

  it.each(invalides)("retourne free pour %s", (val: unknown) => {
    expect(normalizePlanId(val)).toBe("free");
  });

  it("préserve les plans valides", () => {
    const valides: PlanId[] = [
      "free",
      "essential-monthly",
      "premium-monthly",
      "elite-monthly",
    ];
    for (const plan of valides) {
      expect(normalizePlanId(plan)).toBe(plan);
    }
  });
});

// ─── Boosts ───────────────────────────────────────────────────────────────────

describe("boostsPerMonth — correction audit", () => {
  it("free : 0 boost", () => expect(SUBSCRIPTION_PLANS.free.limits.boostsPerMonth).toBe(0));
  it("essential : 1 boost", () => expect(SUBSCRIPTION_PLANS["essential-monthly"].limits.boostsPerMonth).toBe(1));
  it("premium : 3 boosts", () => expect(SUBSCRIPTION_PLANS["premium-monthly"].limits.boostsPerMonth).toBe(3));
  it("elite : 10 boosts", () => expect(SUBSCRIPTION_PLANS["elite-monthly"].limits.boostsPerMonth).toBe(10));
});

// ─── profileVisits ────────────────────────────────────────────────────────────

describe("profileVisits (anciennement profileViews)", () => {
  it("free : 20 visites max", () => {
    expect(SUBSCRIPTION_PLANS.free.limits.profileVisits).toBe(20);
  });

  it("essential : 100 visites max", () => {
    expect(SUBSCRIPTION_PLANS["essential-monthly"].limits.profileVisits).toBe(100);
  });

  it("premium : illimité", () => {
    expect(SUBSCRIPTION_PLANS["premium-monthly"].limits.profileVisits).toBe(Infinity);
  });
});
