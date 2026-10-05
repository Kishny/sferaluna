// src/__tests__/api-update-profile.test.ts
//
// Route /api/users/update-profile (finalisation de l'inscription).
// On vérifie qu'un compte déjà complété ne peut pas s'en servir pour
// contourner les règles de /api/users/profile :
// - pseudonyme et orientation modifiables une fois par an ;
// - pseudonyme unique.
// La première saisie (profil pas encore complété) reste libre.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { getServerSession } = vi.hoisted(() => ({ getServerSession: vi.fn() }));

const userMocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/models/User", () => ({ User: userMocks }));
vi.mock("@/lib/subscription/subscription-check", () => ({
  SubscriptionChecker: class {
    hasFeature = vi.fn().mockResolvedValue(false);
  },
}));

import { POST } from "@/app/api/users/update-profile/route";

const DAY = 24 * 60 * 60 * 1000;
const select = <T,>(value: T) => ({ select: vi.fn().mockResolvedValue(value) });
const request = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;

/** Compte courant renvoyé par le premier findOne ; aucun homonyme par défaut. */
function givenUser(user: Record<string, unknown>, homonym: unknown = null) {
  const current = { _id: "me", email: "a@b.fr", pseudonyme: "Luna", orientation: "lesbienne", ...user };
  userMocks.findOne.mockImplementation((query: Record<string, unknown>) =>
    select("email" in query ? current : homonym)
  );
  userMocks.findOneAndUpdate.mockImplementation((_q: unknown, update: { $set: Record<string, unknown> }) =>
    select({ ...current, ...update.$set })
  );
}

const savedFields = () => userMocks.findOneAndUpdate.mock.calls[0]?.[1]?.$set as Record<string, unknown>;

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ user: { email: "a@b.fr" } });
});

describe("POST /api/users/update-profile — pseudonyme et orientation", () => {
  it("refuse un nouveau pseudonyme moins d'un an après le précédent changement", async () => {
    givenUser({ hasCompletedProfile: true, pseudonymeChangedAt: new Date(Date.now() - 30 * DAY) });

    const res = await POST(request({ pseudonyme: "Selene" }));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body).toMatchObject({ code: "COOLDOWN_ACTIVE", field: "pseudonyme" });
    expect(userMocks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("refuse une nouvelle orientation moins d'un an après le précédent changement", async () => {
    givenUser({ hasCompletedProfile: true, orientationChangedAt: new Date(Date.now() - 200 * DAY) });

    const res = await POST(request({ orientation: "bisexuelle" }));

    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "COOLDOWN_ACTIVE", field: "orientation" });
    expect(userMocks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("accepte le changement après un an et le date", async () => {
    givenUser({ hasCompletedProfile: true, pseudonymeChangedAt: new Date(Date.now() - 400 * DAY) });

    const res = await POST(request({ pseudonyme: "Selene" }));

    expect(res.status).toBe(200);
    expect(savedFields().pseudonyme).toBe("Selene");
    expect(savedFields().pseudonymeChangedAt).toBeInstanceOf(Date);
  });

  it("date le premier changement d'un compte déjà complété", async () => {
    givenUser({ hasCompletedProfile: true });

    const res = await POST(request({ pseudonyme: "Selene", orientation: "bisexuelle" }));

    expect(res.status).toBe(200);
    expect(savedFields().pseudonymeChangedAt).toBeInstanceOf(Date);
    expect(savedFields().orientationChangedAt).toBeInstanceOf(Date);
  });

  it("laisse passer les mêmes valeurs sans toucher aux dates", async () => {
    givenUser({ hasCompletedProfile: true, pseudonymeChangedAt: new Date(Date.now() - 30 * DAY) });

    const res = await POST(request({ pseudonyme: "Luna", orientation: "lesbienne", bio: "Bonjour" }));

    expect(res.status).toBe(200);
    expect(savedFields()).not.toHaveProperty("pseudonymeChangedAt");
    expect(savedFields()).not.toHaveProperty("orientationChangedAt");
  });

  it("ne déclenche pas le délai à la première saisie (inscription)", async () => {
    givenUser({ hasCompletedProfile: false, pseudonyme: "Utilisateur Luna", orientation: "" });

    const res = await POST(request({ pseudonyme: "Selene", orientation: "lesbienne" }));

    expect(res.status).toBe(200);
    expect(savedFields().pseudonyme).toBe("Selene");
    expect(savedFields()).not.toHaveProperty("pseudonymeChangedAt");
    expect(savedFields()).not.toHaveProperty("orientationChangedAt");
  });

  it("refuse un pseudonyme déjà pris, y compris à l'inscription", async () => {
    givenUser({ hasCompletedProfile: false, pseudonyme: "Utilisateur Luna" }, { _id: "autre" });

    const res = await POST(request({ pseudonyme: "Selene" }));

    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "PSEUDO_TAKEN" });
    expect(userMocks.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
