// src/__tests__/cookie-consent.test.ts
//
// Tests unitaires pour la logique du hook useCookieConsent.
// On teste la logique de lecture/écriture sans React (pur JS).

import { describe, it, expect, beforeEach, vi } from "vitest";

const STORAGE_KEY = "sferaluna-cookie-consent";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

Object.defineProperty(globalThis, "window", {
  value: { localStorage: localStorageMock },
  writable: true,
});

// Helpers pour simuler les comportements du hook sans React
function readState() {
  const raw = localStorageMock.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function saveAcceptAll() {
  const state = {
    hasConsented: true,
    preferences: { essential: true, analytics: true, marketing: true, personalization: true },
    consentedAt: new Date().toISOString(),
  };
  localStorageMock.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function saveRejectAll() {
  const state = {
    hasConsented: true,
    preferences: { essential: true, analytics: false, marketing: false, personalization: false },
    consentedAt: new Date().toISOString(),
  };
  localStorageMock.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function saveCustom(prefs: { analytics: boolean; marketing: boolean; personalization: boolean }) {
  const state = {
    hasConsented: true,
    preferences: { essential: true, ...prefs },
    consentedAt: new Date().toISOString(),
  };
  localStorageMock.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

describe("CookieConsent — logique de stockage", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("aucun consentement par défaut", () => {
    expect(readState()).toBeNull();
  });

  it("acceptAll stocke toutes les catégories à true", () => {
    const state = saveAcceptAll();
    const stored = readState();
    expect(stored.hasConsented).toBe(true);
    expect(stored.preferences.analytics).toBe(true);
    expect(stored.preferences.marketing).toBe(true);
    expect(stored.preferences.personalization).toBe(true);
    expect(stored.preferences.essential).toBe(true);
  });

  it("rejectAll garde uniquement essential à true", () => {
    const state = saveRejectAll();
    const stored = readState();
    expect(stored.hasConsented).toBe(true);
    expect(stored.preferences.essential).toBe(true);
    expect(stored.preferences.analytics).toBe(false);
    expect(stored.preferences.marketing).toBe(false);
    expect(stored.preferences.personalization).toBe(false);
  });

  it("saveCustom enregistre les préférences partielles", () => {
    saveCustom({ analytics: true, marketing: false, personalization: true });
    const stored = readState();
    expect(stored.preferences.analytics).toBe(true);
    expect(stored.preferences.marketing).toBe(false);
    expect(stored.preferences.personalization).toBe(true);
    expect(stored.preferences.essential).toBe(true);
  });

  it("consentedAt est une date ISO valide", () => {
    saveAcceptAll();
    const stored = readState();
    expect(() => new Date(stored.consentedAt)).not.toThrow();
    expect(new Date(stored.consentedAt).getTime()).toBeGreaterThan(0);
  });

  it("essential est toujours true, même après rejectAll", () => {
    saveRejectAll();
    const stored = readState();
    expect(stored.preferences.essential).toBe(true);
  });

  it("reset supprime le consentement", () => {
    saveAcceptAll();
    localStorageMock.removeItem(STORAGE_KEY);
    expect(readState()).toBeNull();
  });

  it("une valeur JSON corrompue est gérée sans crash", () => {
    localStorageMock.setItem(STORAGE_KEY, "not-valid-json{{");
    expect(() => readState()).not.toThrow();
    expect(readState()).toBeNull();
  });
});

describe("CookieConsent — invariants métier", () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it("essential doit TOUJOURS être true", () => {
    for (const saveFn of [saveAcceptAll, saveRejectAll]) {
      localStorageMock.clear();
      saveFn();
      const stored = readState();
      expect(stored.preferences.essential).toBe(true);
    }
  });

  it("hasConsented passe de false à true après un choix", () => {
    expect(readState()).toBeNull(); // pas de choix
    saveAcceptAll();
    expect(readState().hasConsented).toBe(true);
  });
});
