// src/__tests__/apple-iap.test.ts
//
// Achat intégré Apple (src/lib/apple/iap.ts et src/app/api/apple).
//
// 1. appleSubscriptionUpdate : la traduction d'une transaction Apple en état
//    d'abonnement (fonction pure).
// 2. Les routes verify-purchase et notifications : ce qu'elles répondent quand
//    la preuve est refusée, appartient à un autre compte, ou est valide.
//
// La vérification cryptographique elle-même est le travail de la bibliothèque
// d'Apple : elle est simulée ici (une preuve « valide » ou « refusée »).

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));

const userMocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findById: vi.fn(),
  updateOne: vi.fn(),
}));

const appleMocks = vi.hoisted(() => ({
  verifyAppleTransaction: vi.fn(),
  verifyAppleRenewalInfo: vi.fn(),
  verifyAppleNotification: vi.fn(),
  applyAppleTransaction: vi.fn(),
}));

class FakeVerificationError extends Error {}

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/models/User", () => ({ User: userMocks }));
vi.mock("@/lib/apple/iap", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/apple/iap")>();
  return {
    ...actual,
    ...appleMocks,
    isAppleVerificationError: (error: unknown) => error instanceof FakeVerificationError,
  };
});

import { POST as verifyPurchase } from "@/app/api/apple/verify-purchase/route";
import { POST as notifications } from "@/app/api/apple/notifications/route";

const { appleSubscriptionUpdate } = await vi.importActual<typeof import("@/lib/apple/iap")>("@/lib/apple/iap");

const NOW = new Date("2026-10-06T12:00:00Z");
const inDays = (n: number) => NOW.getTime() + n * 24 * 60 * 60 * 1000;
const PREMIUM = "com.sferaluna.app.premium.mensuel";

const request = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;
const chain = <T,>(value: T) => ({ select: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(value), then: (r: (v: T) => unknown) => r(value) }) });

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ user: { email: "a@b.fr" } });
});

describe("appleSubscriptionUpdate", () => {
  it("active la formule correspondant au produit, jusqu'à l'échéance", () => {
    const update = appleSubscriptionUpdate({ productId: PREMIUM, expiresDate: inDays(20) }, null, NOW);
    expect(update).toMatchObject({
      plan: "premium-monthly",
      subscriptionStatus: "active",
      isPremium: true,
      subscriptionSource: "apple",
      subscriptionCancelAtPeriodEnd: false,
    });
    expect(update?.premiumExpiresAt?.getTime()).toBe(inDays(20));
  });

  it.each([
    ["com.sferaluna.app.essentiel.mensuel", "essential-monthly"],
    ["com.sferaluna.app.elite.mensuel", "elite-monthly"],
  ])("associe %s à %s", (productId, plan) => {
    expect(appleSubscriptionUpdate({ productId, expiresDate: inDays(5) }, null, NOW)?.plan).toBe(plan);
  });

  it("refuse un produit inconnu", () => {
    expect(appleSubscriptionUpdate({ productId: "com.autre.app.premium", expiresDate: inDays(5) }, null, NOW)).toBeNull();
    expect(appleSubscriptionUpdate({ expiresDate: inDays(5) }, null, NOW)).toBeNull();
  });

  it("garde l'accès mais annonce l'arrêt quand le renouvellement est désactivé", () => {
    const update = appleSubscriptionUpdate({ productId: PREMIUM, expiresDate: inDays(3) }, { autoRenewStatus: 0 }, NOW);
    expect(update).toMatchObject({ isPremium: true, subscriptionCancelAtPeriodEnd: true });
  });

  it("repasse en gratuit une fois l'abonnement expiré", () => {
    const update = appleSubscriptionUpdate({ productId: PREMIUM, expiresDate: inDays(-1) }, { autoRenewStatus: 0 }, NOW);
    expect(update).toMatchObject({ plan: "free", subscriptionStatus: "canceled", isPremium: false, subscriptionSource: null });
  });

  it("coupe l'accès immédiatement après un remboursement, même avant l'échéance", () => {
    const update = appleSubscriptionUpdate({ productId: PREMIUM, expiresDate: inDays(20), revocationDate: inDays(-1) }, null, NOW);
    expect(update).toMatchObject({ plan: "free", subscriptionStatus: "canceled", isPremium: false });
  });

  it("garde l'accès pendant le délai de grâce après un paiement échoué", () => {
    const update = appleSubscriptionUpdate(
      { productId: PREMIUM, expiresDate: inDays(-1) },
      { autoRenewStatus: 1, isInBillingRetryPeriod: true, gracePeriodExpiresDate: inDays(5) },
      NOW
    );
    expect(update).toMatchObject({ plan: "premium-monthly", isPremium: true });
    expect(update?.premiumExpiresAt?.getTime()).toBe(inDays(5));
  });

  it("coupe l'accès en « paiement en attente » quand il n'y a pas de délai de grâce", () => {
    const update = appleSubscriptionUpdate({ productId: PREMIUM, expiresDate: inDays(-1) }, { autoRenewStatus: 1, isInBillingRetryPeriod: true }, NOW);
    expect(update).toMatchObject({ plan: "free", subscriptionStatus: "past_due", isPremium: false });
  });
});

describe("POST /api/apple/verify-purchase", () => {
  const me = { _id: { toString: () => "me" } };

  it("refuse sans session", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await verifyPurchase(request({ signedTransaction: "jws" }));
    expect(res.status).toBe(401);
    expect(appleMocks.verifyAppleTransaction).not.toHaveBeenCalled();
  });

  it("refuse une demande sans preuve d'achat", async () => {
    const res = await verifyPurchase(request({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "MISSING_PURCHASE" });
  });

  it("refuse une preuve que la vérification Apple rejette, sans rien activer", async () => {
    userMocks.findOne.mockReturnValue(chain(me));
    appleMocks.verifyAppleTransaction.mockRejectedValue(new FakeVerificationError("signature"));

    const res = await verifyPurchase(request({ signedTransaction: "faux" }));

    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ code: "INVALID_PURCHASE" });
    expect(appleMocks.applyAppleTransaction).not.toHaveBeenCalled();
  });

  it("refuse un abonnement déjà rattaché à un autre compte", async () => {
    userMocks.findOne.mockReturnValue(chain(me));
    appleMocks.verifyAppleTransaction.mockResolvedValue({ productId: PREMIUM, signedDate: NOW.getTime() });
    appleMocks.applyAppleTransaction.mockResolvedValue({ applied: false, reason: "other_account", userId: "autre" });

    const res = await verifyPurchase(request({ signedTransaction: "jws" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "PURCHASE_BELONGS_TO_OTHER_ACCOUNT" });
  });

  it("impose le compte connecté et renvoie la formule activée", async () => {
    userMocks.findOne.mockReturnValue(chain(me));
    userMocks.findById.mockReturnValue(chain({ plan: "premium-monthly", isPremium: true, subscriptionStatus: "active", subscriptionSource: "apple" }));
    appleMocks.verifyAppleTransaction.mockResolvedValue({ productId: PREMIUM, signedDate: NOW.getTime() });
    appleMocks.applyAppleTransaction.mockResolvedValue({ applied: true, userId: "me", update: {} });

    const res = await verifyPurchase(request({ signedTransaction: "jws" }));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, applied: true, plan: "premium-monthly", isPremium: true, subscriptionSource: "apple" });
    expect(appleMocks.applyAppleTransaction).toHaveBeenCalledWith(expect.objectContaining({ expectedUserId: "me" }));
  });

  it("répond 500 (et non « achat invalide ») quand la vérification tombe en panne", async () => {
    userMocks.findOne.mockReturnValue(chain(me));
    appleMocks.verifyAppleTransaction.mockRejectedValue(new Error("réseau"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await verifyPurchase(request({ signedTransaction: "jws" }));
    expect(res.status).toBe(500);
  });
});

describe("POST /api/apple/notifications", () => {
  it("refuse une notification dont la signature est invalide", async () => {
    appleMocks.verifyAppleNotification.mockRejectedValue(new FakeVerificationError("signature"));
    const res = await notifications(request({ signedPayload: "faux" }));
    expect(res.status).toBe(400);
    expect(appleMocks.applyAppleTransaction).not.toHaveBeenCalled();
  });

  it("accuse réception d'une notification de test sans rien modifier", async () => {
    appleMocks.verifyAppleNotification.mockResolvedValue({ notificationType: "TEST", data: {} });
    const res = await notifications(request({ signedPayload: "jws" }));
    expect(res.status).toBe(200);
    expect(appleMocks.applyAppleTransaction).not.toHaveBeenCalled();
  });

  it("applique la transaction et le renouvellement vérifiés, datés par la notification", async () => {
    appleMocks.verifyAppleNotification.mockResolvedValue({
      notificationType: "DID_RENEW",
      signedDate: NOW.getTime(),
      data: { signedTransactionInfo: "tx", signedRenewalInfo: "renouvellement" },
    });
    appleMocks.verifyAppleTransaction.mockResolvedValue({ productId: PREMIUM });
    appleMocks.verifyAppleRenewalInfo.mockResolvedValue({ autoRenewStatus: 1 });
    appleMocks.applyAppleTransaction.mockResolvedValue({ applied: true, userId: "me", update: {} });

    const res = await notifications(request({ signedPayload: "jws" }));

    expect(res.status).toBe(200);
    expect(appleMocks.applyAppleTransaction).toHaveBeenCalledWith({
      transaction: { productId: PREMIUM },
      renewal: { autoRenewStatus: 1 },
      eventDate: NOW,
    });
  });

  it("répond 200 quand aucun compte ne correspond, pour qu'Apple ne la renvoie pas sans fin", async () => {
    appleMocks.verifyAppleNotification.mockResolvedValue({ notificationType: "EXPIRED", signedDate: NOW.getTime(), data: { signedTransactionInfo: "tx" } });
    appleMocks.verifyAppleTransaction.mockResolvedValue({ productId: PREMIUM });
    appleMocks.applyAppleTransaction.mockResolvedValue({ applied: false, reason: "user_not_found" });
    vi.spyOn(console, "log").mockImplementation(() => {});

    const res = await notifications(request({ signedPayload: "jws" }));
    expect(res.status).toBe(200);
  });

  it("répond 500 en cas de panne, pour qu'Apple la renvoie plus tard", async () => {
    appleMocks.verifyAppleNotification.mockRejectedValue(new Error("réseau"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await notifications(request({ signedPayload: "jws" }));
    expect(res.status).toBe(500);
  });
});
