// src/__tests__/api-notifications.test.ts
//
// Tests d'intégration légers pour /api/notifications (GET + POST).
// On simule la session NextAuth, MongoDB et les modèles Mongoose pour
// vérifier :
// - les contrôles d'authentification ;
// - le calcul du total de notifications (messages + matches + visites) ;
// - la mise à jour de lastSeenNotificationsAt.

import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// Mocks
// ─────────────────────────────────────────────

const { getServerSession } = vi.hoisted(() => ({
  getServerSession: vi.fn(),
}));

const userMocks = vi.hoisted(() => ({
  findById: vi.fn(),
  findOne: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findOneAndUpdate: vi.fn(),
}));

const matchMocks = vi.hoisted(() => ({
  countDocuments: vi.fn(),
  find: vi.fn(),
}));

const messageMocks = vi.hoisted(() => ({
  countDocuments: vi.fn(),
}));

const profileVisitMocks = vi.hoisted(() => ({
  countDocuments: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession,
}));

vi.mock("@/app/api/auth/[...nextauth]/route", () => ({
  authOptions: {},
}));

vi.mock("@/lib/db", () => ({
  connectDB: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/models/User", () => ({ User: userMocks }));
vi.mock("@/models/Match", () => ({ Match: matchMocks }));
vi.mock("@/models/Message", () => ({ Message: messageMocks }));
vi.mock("@/models/ProfileVisit", () => ({ ProfileVisit: profileVisitMocks }));

import { GET, POST } from "@/app/api/notifications/route";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Query Mongoose simulée, chaînable et "thenable"
 * (couvre .select(...) puis await direct).
 */
function queryChain<T>(value: T) {
  const promise = Promise.resolve(value);

  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    then: (...args: Parameters<typeof promise.then>) => promise.then(...args),
    catch: (...args: Parameters<typeof promise.catch>) =>
      promise.catch(...args),
  };

  return chain;
}

const sessionWithId = (id: string, email = "moi@sferaluna.test") => ({
  user: { id, email },
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ─────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────

describe("GET /api/notifications", () => {
  const userId = new mongoose.Types.ObjectId();

  it("retourne 401 si la session ne contient ni id ni email", async () => {
    getServerSession.mockResolvedValue({ user: {} });

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("retourne 404 si l'utilisatrice n'existe plus en base", async () => {
    getServerSession.mockResolvedValue(sessionWithId(userId.toString()));
    userMocks.findById.mockReturnValue(queryChain(null));
    userMocks.findOne.mockReturnValue(queryChain(null));

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("USER_NOT_FOUND");
  });

  it("calcule correctement le total de notifications", async () => {
    getServerSession.mockResolvedValue(sessionWithId(userId.toString()));

    userMocks.findById.mockReturnValue(
      queryChain({ _id: userId, lastSeenNotificationsAt: null })
    );

    matchMocks.countDocuments.mockResolvedValue(2); // newMatches
    matchMocks.find.mockReturnValue(
      queryChain([{ _id: new mongoose.Types.ObjectId() }])
    );
    messageMocks.countDocuments.mockResolvedValue(5); // unreadMessages
    profileVisitMocks.countDocuments.mockResolvedValue(0); // newVisits

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.unreadMessages).toBe(5);
    expect(data.newMatches).toBe(2);
    expect(data.newVisits).toBe(0);

    // total = messages individuels + 1 si newMatches > 0 + 1 si newVisits > 0
    expect(data.total).toBe(5 + 1 + 0);
  });

  it("ne compte pas les messages si l'utilisatrice n'a aucun match actif", async () => {
    getServerSession.mockResolvedValue(sessionWithId(userId.toString()));

    userMocks.findById.mockReturnValue(
      queryChain({ _id: userId, lastSeenNotificationsAt: new Date() })
    );

    matchMocks.countDocuments.mockResolvedValue(0);
    matchMocks.find.mockReturnValue(queryChain([])); // aucun match
    profileVisitMocks.countDocuments.mockResolvedValue(1);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.unreadMessages).toBe(0);
    expect(messageMocks.countDocuments).not.toHaveBeenCalled();
    expect(data.total).toBe(0 + 0 + 1);
  });
});

// ─────────────────────────────────────────────
// POST /api/notifications
// ─────────────────────────────────────────────

describe("POST /api/notifications", () => {
  const userId = new mongoose.Types.ObjectId();

  it("retourne 401 si la session est absente", async () => {
    getServerSession.mockResolvedValue(null);

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("marque les notifications comme lues et renvoie lastSeenNotificationsAt", async () => {
    const now = new Date();

    getServerSession.mockResolvedValue(sessionWithId(userId.toString()));
    userMocks.findByIdAndUpdate.mockReturnValue(
      queryChain({ _id: userId, lastSeenNotificationsAt: now })
    );

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(new Date(data.lastSeenNotificationsAt).toISOString()).toBe(
      now.toISOString()
    );

    expect(userMocks.findByIdAndUpdate).toHaveBeenCalledWith(
      userId.toString(),
      { $set: { lastSeenNotificationsAt: expect.any(Date) } },
      { new: true }
    );
  });

  it("retourne 404 si aucune utilisatrice ne correspond", async () => {
    getServerSession.mockResolvedValue(sessionWithId(userId.toString()));
    userMocks.findByIdAndUpdate.mockReturnValue(queryChain(null));
    userMocks.findOneAndUpdate.mockReturnValue(queryChain(null));

    const res = await POST();
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.code).toBe("USER_NOT_FOUND");
  });
});
