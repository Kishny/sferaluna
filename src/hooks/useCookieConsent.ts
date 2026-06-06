// src/hooks/useCookieConsent.ts
//
// Hook pour lire et écrire les préférences cookies de l'utilisatrice.
// Les préférences sont stockées dans localStorage (cookie-consent key).

"use client";

import { useCallback, useEffect, useState } from "react";

export type CookieCategory = "essential" | "analytics" | "marketing" | "personalization";

export interface CookiePreferences {
  essential: true;           // toujours activé, non modifiable
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
}

export interface CookieConsentState {
  hasConsented: boolean;     // l'utilisatrice a fait un choix
  preferences: CookiePreferences;
  consentedAt: string | null;
}

const STORAGE_KEY = "sferaluna-cookie-consent";

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  personalization: false,
};

function readFromStorage(): CookieConsentState {
  if (typeof window === "undefined") {
    return { hasConsented: false, preferences: DEFAULT_PREFERENCES, consentedAt: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { hasConsented: false, preferences: DEFAULT_PREFERENCES, consentedAt: null };

    const parsed = JSON.parse(raw) as CookieConsentState;
    return {
      hasConsented: parsed.hasConsented === true,
      preferences: {
        essential: true,
        analytics: parsed.preferences?.analytics === true,
        marketing: parsed.preferences?.marketing === true,
        personalization: parsed.preferences?.personalization === true,
      },
      consentedAt: parsed.consentedAt ?? null,
    };
  } catch {
    return { hasConsented: false, preferences: DEFAULT_PREFERENCES, consentedAt: null };
  }
}

function writeToStorage(state: CookieConsentState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>({
    hasConsented: false,
    preferences: DEFAULT_PREFERENCES,
    consentedAt: null,
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setState(readFromStorage());
    setMounted(true);
  }, []);

  const acceptAll = useCallback(() => {
    const next: CookieConsentState = {
      hasConsented: true,
      preferences: {
        essential: true,
        analytics: true,
        marketing: true,
        personalization: true,
      },
      consentedAt: new Date().toISOString(),
    };
    setState(next);
    writeToStorage(next);
  }, []);

  const rejectAll = useCallback(() => {
    const next: CookieConsentState = {
      hasConsented: true,
      preferences: {
        essential: true,
        analytics: false,
        marketing: false,
        personalization: false,
      },
      consentedAt: new Date().toISOString(),
    };
    setState(next);
    writeToStorage(next);
  }, []);

  const savePreferences = useCallback((prefs: Omit<CookiePreferences, "essential">) => {
    const next: CookieConsentState = {
      hasConsented: true,
      preferences: {
        essential: true,
        ...prefs,
      },
      consentedAt: new Date().toISOString(),
    };
    setState(next);
    writeToStorage(next);
  }, []);

  const resetConsent = useCallback(() => {
    const next: CookieConsentState = {
      hasConsented: false,
      preferences: DEFAULT_PREFERENCES,
      consentedAt: null,
    };
    setState(next);
    window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const hasCategory = useCallback(
    (category: CookieCategory) => state.preferences[category] === true,
    [state.preferences]
  );

  return {
    mounted,
    hasConsented: state.hasConsented,
    preferences: state.preferences,
    consentedAt: state.consentedAt,
    acceptAll,
    rejectAll,
    savePreferences,
    resetConsent,
    hasCategory,
  };
}
