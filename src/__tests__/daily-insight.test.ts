// src/__tests__/daily-insight.test.ts
//
// La connaissance du jour.
// 1. Le choix du jour (fonction pure) : programmation, rotation, reprise.
// 2. La série de départ : bien formée, sans doublon, dans les limites du modèle.
// 3. Les routes : une membre non connectée ne lit rien, une non-admin ne
//    modifie rien, une saisie invalide est refusée.

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const { getServerSession, getAdmin } = vi.hoisted(() => ({ getServerSession: vi.fn(), getAdmin: vi.fn() }));
const service = vi.hoisted(() => ({ getInsightForDay: vi.fn(), getPreviousInsights: vi.fn() }));
const insightModel = vi.hoisted(() => ({ create: vi.fn(), findByIdAndUpdate: vi.fn(), findByIdAndDelete: vi.fn() }));
const dayModel = vi.hoisted(() => ({ deleteMany: vi.fn() }));

vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/app/api/auth/[...nextauth]/route", () => ({ authOptions: {} }));
vi.mock("@/lib/db", () => ({ connectDB: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/admin-auth", () => ({ getAdmin }));
vi.mock("@/lib/insights/service", () => service);
vi.mock("@/models/DailyInsight", () => ({
  INSIGHT_CATEGORIES: ["mot", "sentiment", "femme", "monde", "amour"],
  DailyInsight: insightModel,
  DailyInsightDay: dayModel,
}));

import { chooseInsight, isDayKey, parisDayKey } from "@/lib/insights/select";
import { STARTER_INSIGHTS } from "@/lib/insights/starter";
import { GET as today } from "@/app/api/insights/today/route";
import { POST as createInsight } from "@/app/api/admin/insights/route";
import { PATCH as updateInsight, DELETE as deleteInsight } from "@/app/api/admin/insights/[id]/route";

const request = (body: unknown) => ({ json: async () => body }) as unknown as NextRequest;
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const ID = "64b7f0f0f0f0f0f0f0f0f0f0";
const valid = { category: "mot", title: "Hexade", text: "Du grec hexás, groupe de six." };

beforeEach(() => {
  vi.clearAllMocks();
  getServerSession.mockResolvedValue({ user: { email: "a@b.fr" } });
  getAdmin.mockResolvedValue({ id: "admin", email: "admin@b.fr" });
});

describe("parisDayKey", () => {
  it("change de jour à minuit heure de Paris, pas à minuit UTC", () => {
    expect(parisDayKey(new Date("2026-10-07T21:59:00Z"))).toBe("2026-10-07");
    expect(parisDayKey(new Date("2026-10-07T22:01:00Z"))).toBe("2026-10-08");
  });

  it("reconnaît une date valide et refuse le reste", () => {
    expect(isDayKey("2026-10-07")).toBe(true);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("07/10/2026")).toBe(false);
    expect(isDayKey(null)).toBe(false);
  });
});

describe("chooseInsight", () => {
  const item = (id: string, createdAt: number, extra: Record<string, unknown> = {}) => ({ id, createdAt, ...extra });

  it("ne propose rien quand la liste est vide", () => {
    expect(chooseInsight([], "2026-10-07")).toBeNull();
  });

  it("commence par la plus ancienne jamais montrée", () => {
    expect(chooseInsight([item("b", 2), item("a", 1), item("c", 3)], "2026-10-07")).toBe("a");
  });

  it("passe à la suivante une fois la première montrée", () => {
    const list = [item("a", 1, { lastShownDay: "2026-10-06" }), item("b", 2), item("c", 3)];
    expect(chooseInsight(list, "2026-10-07")).toBe("b");
  });

  it("reprend la série par celle montrée il y a le plus longtemps", () => {
    const list = [
      item("a", 1, { lastShownDay: "2026-10-05" }),
      item("b", 2, { lastShownDay: "2026-10-06" }),
      item("c", 3, { lastShownDay: "2026-10-04" }),
    ];
    expect(chooseInsight(list, "2026-10-07")).toBe("c");
  });

  it("donne la priorité à celle programmée pour ce jour", () => {
    const list = [item("a", 1), item("fete", 9, { publishOn: "2026-03-08" })];
    expect(chooseInsight(list, "2026-03-08")).toBe("fete");
  });

  it("garde en réserve celle programmée pour un autre jour", () => {
    const list = [item("fete", 1, { publishOn: "2026-03-08" }), item("a", 2)];
    expect(chooseInsight(list, "2026-10-07")).toBe("a");
    expect(chooseInsight([item("fete", 1, { publishOn: "2026-03-08" })], "2026-10-07")).toBeNull();
  });
});

describe("série de départ", () => {
  it("n'a pas de doublon et respecte les limites du modèle", () => {
    const slugs = STARTER_INSIGHTS.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const entry of STARTER_INSIGHTS) {
      expect(["mot", "sentiment", "femme", "monde", "amour"]).toContain(entry.category);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.title.length).toBeLessThanOrEqual(80);
      expect(entry.text.length).toBeGreaterThan(20);
      expect(entry.text.length).toBeLessThanOrEqual(600);
      expect(entry.source).toMatch(/^https?:\/\//);
    }
  });

  it("ne propose jamais deux fois de suite la même catégorie au début", () => {
    const first = STARTER_INSIGHTS.slice(0, 10).map((entry) => entry.category);
    first.forEach((category, index) => {
      if (index > 0) expect(category).not.toBe(first[index - 1]);
    });
  });
});

describe("GET /api/insights/today", () => {
  it("refuse sans session", async () => {
    getServerSession.mockResolvedValue(null);
    const res = await today();
    expect(res.status).toBe(401);
    expect(service.getInsightForDay).not.toHaveBeenCalled();
  });

  it("renvoie la connaissance du jour et les précédentes", async () => {
    const insight = { id: "1", category: "mot", title: "Hexade", text: "…" };
    service.getInsightForDay.mockResolvedValue({ day: "2026-10-07", insight });
    service.getPreviousInsights.mockResolvedValue([{ day: "2026-10-06", insight }]);

    const res = await today();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.today.insight.title).toBe("Hexade");
    expect(body.previous).toHaveLength(1);
  });

  it("renvoie today: null tant que rien n'est publié", async () => {
    service.getInsightForDay.mockResolvedValue(null);
    service.getPreviousInsights.mockResolvedValue([]);
    const body = await (await today()).json();
    expect(body).toMatchObject({ success: true, today: null, previous: [] });
  });
});

describe("administration des connaissances", () => {
  it("refuse toute écriture à une non-admin", async () => {
    getAdmin.mockResolvedValue(null);
    expect((await createInsight(request(valid))).status).toBe(403);
    expect((await updateInsight(request(valid), params(ID))).status).toBe(403);
    expect((await deleteInsight(request(null), params(ID))).status).toBe(403);
    expect(insightModel.create).not.toHaveBeenCalled();
    expect(insightModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("crée une connaissance valide, active par défaut et sans date imposée", async () => {
    insightModel.create.mockResolvedValue({ _id: { toString: () => ID } });
    const res = await createInsight(request(valid));
    expect(res.status).toBe(201);
    expect(insightModel.create).toHaveBeenCalledWith(expect.objectContaining({ ...valid, active: true, publishOn: null, source: "" }));
  });

  it.each([
    ["catégorie inconnue", { ...valid, category: "astrologie" }],
    ["titre vide", { ...valid, title: "  " }],
    ["texte trop long", { ...valid, text: "x".repeat(601) }],
    ["date impossible", { ...valid, publishOn: "2026-02-30" }],
  ])("refuse une saisie invalide : %s", async (_label, body) => {
    const res = await createInsight(request(body));
    expect(res.status).toBe(400);
    expect(insightModel.create).not.toHaveBeenCalled();
  });

  it("répond 404 pour un identifiant inconnu ou mal formé", async () => {
    insightModel.findByIdAndUpdate.mockResolvedValue(null);
    expect((await updateInsight(request(valid), params(ID))).status).toBe(404);
    expect((await deleteInsight(request(null), params("pas-un-id"))).status).toBe(404);
  });

  it("retire aussi la connaissance supprimée de l'historique des jours", async () => {
    insightModel.findByIdAndDelete.mockResolvedValue({ _id: ID });
    const res = await deleteInsight(request(null), params(ID));
    expect(res.status).toBe(200);
    expect(dayModel.deleteMany).toHaveBeenCalledWith({ insightId: ID });
  });
});
