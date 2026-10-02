// src/components/ConsentAnalytics.tsx

"use client";

/**
 * Mesure d'audience Vercel Analytics (anonyme, sans cookie), soumise au choix
 * de la visiteuse : si elle a refusé la catégorie « analytiques » (bandeau ou
 * page /cookies), aucun événement n'est envoyé.
 *
 * Le choix est relu à chaque événement : un changement sur /cookies
 * s'applique immédiatement, sans recharger la page.
 */

import { Analytics } from "@vercel/analytics/react";

const STORAGE_KEY = "sferaluna-cookie-consent";

function analyticsRefused() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return parsed?.hasConsented === true && parsed?.preferences?.analytics !== true;
  } catch {
    return false;
  }
}

export default function ConsentAnalytics() {
  return <Analytics beforeSend={(event) => (analyticsRefused() ? null : event)} />;
}
