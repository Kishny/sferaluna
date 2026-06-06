// src/__tests__/rate-limiter.test.ts
//
// Tests unitaires pour le rate limiter in-memory.

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock NextRequest
function mockRequest(ip: string) {
  return {
    headers: {
      get: (key: string) => (key === "x-forwarded-for" ? ip : null),
    },
  } as unknown as import("next/server").NextRequest;
}

describe("rateLimit", () => {
  beforeEach(async () => {
    // Reset du module entre chaque test pour vider le store en mémoire
    vi.resetModules();
  });

  it("autorise les premières requêtes sous la limite", async () => {
    const { rateLimit } = await import("@/lib/rate-limiter");

    for (let i = 0; i < 10; i++) {
      const result = rateLimit(mockRequest("1.2.3.4"), 10, 60);
      expect(result.limited).toBe(false);
    }
  });

  it("bloque après dépassement de la limite", async () => {
    const { rateLimit } = await import("@/lib/rate-limiter");

    for (let i = 0; i < 10; i++) {
      rateLimit(mockRequest("5.6.7.8"), 10, 60);
    }

    const result = rateLimit(mockRequest("5.6.7.8"), 10, 60);
    expect(result.limited).toBe(true);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("différentes IPs ont des compteurs indépendants", async () => {
    const { rateLimit } = await import("@/lib/rate-limiter");

    for (let i = 0; i < 10; i++) {
      rateLimit(mockRequest("10.0.0.1"), 10, 60);
    }

    // Nouvelle IP — ne doit pas être limitée
    const result = rateLimit(mockRequest("10.0.0.2"), 10, 60);
    expect(result.limited).toBe(false);
  });

  it("retourne retryAfter et resetTime quand limité", async () => {
    const { rateLimit } = await import("@/lib/rate-limiter");

    for (let i = 0; i < 3; i++) {
      rateLimit(mockRequest("9.9.9.9"), 3, 60);
    }

    const result = rateLimit(mockRequest("9.9.9.9"), 3, 60);
    expect(result.limited).toBe(true);
    expect(typeof result.retryAfter).toBe("number");
    expect(typeof result.resetTime).toBe("number");
    expect(result.resetTime!).toBeGreaterThan(Date.now());
  });
});
