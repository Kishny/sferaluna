// src/lib/rate-limiter.ts
//
// Rate limiting par IP sans dépendance externe.
// Utilise un Map en mémoire — suffisant pour la protection anti-spam de base.
// Sur Vercel (serverless), la mémoire est par instance, ce qui est acceptable.

import { NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique pour éviter les fuites mémoire
// (toutes les 5 minutes, supprime les entrées expirées)
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Vérifie si une IP dépasse le rate limit.
 *
 * Par défaut : 10 requêtes par 60 secondes.
 *
 * @param req         La requête Next.js entrante
 * @param points      Nombre de requêtes autorisées dans la fenêtre
 * @param durationSec Durée de la fenêtre en secondes
 */
export function rateLimit(
  req: NextRequest,
  points = 10,
  durationSec = 60
): { limited: boolean; retryAfter?: number; resetTime?: number } {
  cleanup();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const windowMs = durationSec * 1000;

  const entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    // Nouvelle fenêtre
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count++;

  if (entry.count > points) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      limited: true,
      retryAfter,
      resetTime: entry.resetAt,
    };
  }

  return { limited: false };
}
