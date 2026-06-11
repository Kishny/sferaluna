/**
 * Middleware Next.js — CORS pour le développement local.
 *
 * En dev, la web preview Expo (react-native-web) tourne sur un port différent
 * (ex: localhost:8082) et appelle le backend sur localhost:3000. Les navigateurs
 * bloquent ces requêtes cross-origin par défaut.
 *
 * Ce middleware ajoute les headers CORS pour tout origin localhost:* en dev.
 * En production, aucune modification n'est appliquée.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";
  const isDev = process.env.NODE_ENV === "development";
  const isLocalhost =
    isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin);

  // Répondre immédiatement aux preflight OPTIONS (CORS preflight)
  if (request.method === "OPTIONS" && isLocalhost) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Requested-With",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  if (isLocalhost) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
