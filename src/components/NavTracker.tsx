// src/components/NavTracker.tsx

"use client";

/**
 * Mémorise, pour chaque page, la page depuis laquelle on y est arrivée
 * (navigation « en avant » uniquement : un retour arrière ne réécrit pas
 * l'origine). Sert aux boutons « Retour » pour afficher le bon libellé et
 * savoir si router.back() ramènera bien dans l'application.
 *
 * Stockage : sessionStorage (propre à l'onglet, effacé à sa fermeture).
 */

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";

// Effet « layout » côté client : l'origine est enregistrée avant que les
// boutons Retour de la nouvelle page ne la lisent (leurs effets passent après).
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const KEY = "sl-nav-origins";

function readOrigins(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function getNavOrigin(pathname: string): string | null {
  if (typeof window === "undefined") return null;
  return readOrigins()[pathname] ?? null;
}

export default function NavTracker() {
  const pathname = usePathname();
  const previous = useRef<string | null>(null);
  const popped = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popped.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!pathname) return;
    let prev = previous.current;

    // Premier rendu après un chargement complet de page : on s'appuie sur le
    // référent (même site) pour connaître la page précédente.
    if (!prev && !popped.current) {
      try {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        const ref = document.referrer ? new URL(document.referrer) : null;
        if (nav?.type === "navigate" && ref && ref.origin === window.location.origin) prev = ref.pathname;
      } catch {
        /* ignore */
      }
    }

    if (prev && prev !== pathname && !popped.current) {
      try {
        const origins = readOrigins();
        const bothProfiles = prev.startsWith("/explorer/profil/") && pathname.startsWith("/explorer/profil/");
        // Profil suivant / précédent : on garde l'origine du parcours (ex. Explorer librement).
        origins[pathname] = bothProfiles ? origins[prev] ?? prev : prev;

        // Limite la taille du stockage.
        const keys = Object.keys(origins);
        if (keys.length > 60) keys.slice(0, keys.length - 60).forEach((k) => delete origins[k]);

        sessionStorage.setItem(KEY, JSON.stringify(origins));
      } catch {
        /* stockage indisponible */
      }
    }

    popped.current = false;
    previous.current = pathname;
  }, [pathname]);

  return null;
}
