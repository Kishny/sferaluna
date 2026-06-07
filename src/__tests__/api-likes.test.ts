// src/__tests__/api-likes.test.ts
//
// Tests d'intégration légers pour la route /api/likes (POST + DELETE).
// On simule la session NextAuth, la connexion MongoDB et les modèles
// Mongoose pour tester uniquement la logique métier de la route :
// - authentification ;
// - validation des entrées ;
// - règles de like (auto-like, profil indisponible) ;
// - création/réactivation de match en cas de like réciproque ;
// - retrait de like et désactivation du match associé.

import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// Mocks (déclarés avec vi.hoisted pour être visibles
// dans les factories vi.mock, qui sont hoistées par Vitest)
// ─────────────────────────────────────────────

const { getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  findOne: vi.fn(),
  findById: vi.fn(),
}));

const likeMocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
  findOne: vi.fn(),
  deleteOne: vi.fn(),
}));

const matchMocks = vi.hoisted(() => ({
  findOneAndUpdate: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

// On évite de charger la vraie config NextAuth (providers, JWT Apple, bcrypt…)
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/pusher", () => ({
  pusher: { trigger: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@/models/User", () => ({
  User: userMocks,
}));

vi.mock("@/models/Like", () => ({
  Like: likeMocks,
}));

vi.mock("@/models/Match", () => ({
  Match: matchMocks,
}));

import { POST, DELETE } from "@/app/api/likes/route";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Simule une query Mongoose chaînable et "thenable" :
 * - .select(...) renvoie la même chaîne (chaînable) ;
 * - .lean() renvoie une promesse résolue avec la valeur ;
 * - awaiter directement la chaîne résout aussi la valeur.
 *
 * Cela couvre les deux usages présents dans la route :
 *   await User.findOne(...).select(...)
 *   await User.findById(...).select(...).lean()
 */
function queryChain<T>(value: T) {
  const promise = Promise.resolve(value);

  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    lean: vi.fn(() => promise),
    then: (...args: Parameters<typeof promise.then>) => promise.then(...args),
    catch: (...args: Parameters<typeof promise.catch>) =>
      promise.catch(...args),
  };

  return chain;
}

function jsonRequest(body: unknown): NextRequest {
  return { json: async () => body } as unknown as NextRequest;
}

function badJsonRequest(): NextRequest {
  return {
    json: async () => {
      throw new Error("JSON invalide");
    },
  } as unknown as NextRequest;
}

const sessionWithEmail = (email = "moi@sferaluna.test") => ({
  user: { email },
});

// ─────────────────────────────────────────────
// POST /api/likes
// ─────────────────────────────────────────────

describe("POST /api/likes", () => {
  const currentUserId = new mongoose.Types.ObjectId();
  const targetUserId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 401 si l'utilisatrice n'est pas connectée", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await POST(
      jsonRequest({ targetUserId: targetUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("retourne 400 si le body JSON est invalide", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());

    const res = await POST(badJsonRequest());
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_JSON_BODY");
  });

  it("retourne 400 si targetUserId n'est pas un ObjectId valide", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());

    const res = await POST(jsonRequest({ targetUserId: "pas-un-id" }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("INVALID_TARGET");
  });

  it("refuse l'auto-like (SELF_LIKE)", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());
    userMocks.findOne.mockReturnValue(queryChain({ _id: currentUserId }));

    const res = await POST(
      jsonRequest({ targetUserId: currentUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("SELF_LIKE");
  });

  it("retourne 404 si le profil cible est indisponible", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());
    userMocks.findOne.mockReturnValue(queryChain({ _id: currentUserId }));
    userMocks.findById.mockReturnValue(
      queryChain({
        _id: targetUserId,
        hasCompletedProfile: false,
        banned: false,
        visibilite: "public",
        role: "user",
      })
    );

    const res = await POST(
      jsonRequest({ targetUserId: targetUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("TARGET_NOT_AVAILABLE");
  });

  it("crée un like simple (matched: false) sans réciprocité", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());
    userMocks.findOne.mockReturnValue(queryChain({ _id: currentUserId }));
    userMocks.findById.mockReturnValue(
      queryChain({
        _id: targetUserId,
        hasCompletedProfile: true,
        banned: false,
        visibilite: "public",
        role: "user",
      })
    );

    likeMocks.findOneAndUpdate.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
    });
    likeMocks.findOne.mockResolvedValue(null);

    const res = await POST(
      jsonRequest({ targetUserId: targetUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ success: true, matched: false });
    expect(matchMocks.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("crée/réactive un match quand le like est réciproque (matched: true)", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());
    userMocks.findOne.mockReturnValue(queryChain({ _id: currentUserId }));

    userMocks.findById
      // 1er appel : vérification du profil cible
      .mockReturnValueOnce(
        queryChain({
          _id: targetUserId,
          hasCompletedProfile: true,
          banned: false,
          visibilite: "public",
          role: "user",
        })
      )
      // appels suivants : getPublicUserProfile() dans notifyNewMatch()
      .mockReturnValue(queryChain({ _id: targetUserId, pseudonyme: "Profil" }));

    likeMocks.findOneAndUpdate.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
    });
    likeMocks.findOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

    const matchId = new mongoose.Types.ObjectId();
    matchMocks.findOneAndUpdate.mockResolvedValue({ _id: matchId });

    const res = await POST(
      jsonRequest({ targetUserId: targetUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.matched).toBe(true);
    expect(data.matchId).toBe(matchId.toString());
    expect(matchMocks.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────
// DELETE /api/likes
// ─────────────────────────────────────────────

describe("DELETE /api/likes", () => {
  const currentUserId = new mongoose.Types.ObjectId();
  const targetUserId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 401 si l'utilisatrice n'est pas connectée", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await DELETE(
      jsonRequest({ targetUserId: targetUserId.toString() })
    );

    expect(res.status).toBe(401);
  });

  it("retourne 400 sur une action visant son propre profil", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());
    userMocks.findOne.mockReturnValue(queryChain({ _id: currentUserId }));

    const res = await DELETE(
      jsonRequest({ targetUserId: currentUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe("SELF_ACTION");
  });

  it("retire le like et désactive le match associé", async () => {
    getServerSession.mockResolvedValue(sessionWithEmail());
    userMocks.findOne.mockReturnValue(queryChain({ _id: currentUserId }));
    likeMocks.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
    matchMocks.findOneAndUpdate.mockResolvedValue({
      _id: new mongoose.Types.ObjectId(),
    });

    const res = await DELETE(
      jsonRequest({ targetUserId: targetUserId.toString() })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const deleteArgs = likeMocks.deleteOne.mock.calls[0][0];
    expect(deleteArgs.fromUserId.toString()).toBe(currentUserId.toString());
    expect(deleteArgs.toUserId.toString()).toBe(targetUserId.toString());

    const matchArgs = matchMocks.findOneAndUpdate.mock.calls[0];
    expect(matchArgs[1]).toEqual({ $set: { isActive: false } });
  });
});
