// src/lib/rate-limiter.ts
//
// Rate limiting par IP.
//
// Deux modes, transparents pour l'appelant :
//  1. DISTRIBUÉ (recommandé en prod Vercel) : si UPSTASH_REDIS_REST_URL et
//     UPSTASH_REDIS_REST_TOKEN sont définis, le compteur est partagé entre
//     toutes les instances serverless via Redis (Upstash REST, aucun SDK).
//  2. MÉMOIRE (fallback) : Map en mémoire par instance. Suffisant en local /
//     petit trafic, mais non partagé entre instances serverless.
//
// Principe de sûreté : "fail-open". Si Redis est indisponible ou renvoie une
// erreur, on ne bloque JAMAIS l'utilisateur — on retombe sur le compteur
// mémoire. Un incident d'infra ne doit pas empêcher de s'inscrire.

export interface RateLimitResult {
  limited: boolean;
  retryAfter?: number;
  resetTime?: number;
}

/* ------------------------------------------------------------------ */
/*  IP                                                                 */
/* ------------------------------------------------------------------ */

// Accepte Request ou NextRequest (NextRequest étend Request) — on n'utilise
// que headers.get, disponible sur les deux.
function getIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/* ------------------------------------------------------------------ */
/*  Mode mémoire (fallback)                                            */
/* ------------------------------------------------------------------ */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

function rateLimitMemory(
  ip: string,
  points: number,
  durationSec: number
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = durationSec * 1000;
  const entry = store.get(ip);

  if (!entry || entry.resetAt <= now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count++;

  if (entry.count > points) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { limited: true, retryAfter, resetTime: entry.resetAt };
  }

  return { limited: false };
}

/* ------------------------------------------------------------------ */
/*  Mode distribué (Upstash Redis via REST)                           */
/* ------------------------------------------------------------------ */

/**
 * Retourne un résultat de rate limit via Upstash, ou `null` si Upstash n'est
 * pas configuré / injoignable (→ l'appelant retombe alors sur la mémoire).
 */
async function rateLimitUpstash(
  ip: string,
  points: number,
  durationSec: number
): Promise<RateLimitResult | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const key = `rl:${ip}:${durationSec}:${points}`;

  try {
    // Pipeline atomique : INCR puis lecture du TTL.
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["TTL", key],
      ]),
      // Anti-blocage : on ne veut pas suspendre la requête indéfiniment.
      signal: AbortSignal.timeout(1500),
    });

    if (!res.ok) return null; // fail-open

    const data = (await res.json()) as { result: number }[];
    const count = Number(data?.[0]?.result ?? 0);
    let ttl = Number(data?.[1]?.result ?? -1);

    // Première requête de la fenêtre (ou clé sans expiration) → poser le TTL.
    if (count === 1 || ttl < 0) {
      await fetch(`${url}/expire/${encodeURIComponent(key)}/${durationSec}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(1500),
      });
      ttl = durationSec;
    }

    if (count > points) {
      const retryAfter = ttl > 0 ? ttl : durationSec;
      return {
        limited: true,
        retryAfter,
        resetTime: Date.now() + retryAfter * 1000,
      };
    }

    return { limited: false };
  } catch {
    return null; // fail-open → fallback mémoire
  }
}

/* ------------------------------------------------------------------ */
/*  API publique                                                      */
/* ------------------------------------------------------------------ */

/**
 * Vérifie si une IP dépasse le rate limit.
 *
 * Par défaut : 10 requêtes par 60 secondes.
 *
 * @param req         La requête Next.js entrante
 * @param points      Nombre de requêtes autorisées dans la fenêtre
 * @param durationSec Durée de la fenêtre en secondes
 */
export async function rateLimit(
  req: Request,
  points = 10,
  durationSec = 60
): Promise<RateLimitResult> {
  const ip = getIp(req);

  const viaUpstash = await rateLimitUpstash(ip, points, durationSec);
  if (viaUpstash) return viaUpstash;

  return rateLimitMemory(ip, points, durationSec);
}
