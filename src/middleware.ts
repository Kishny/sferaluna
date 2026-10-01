/**
 * Middleware Next.js SferaLuna.
 *
 * 1. Protection des pages privées : sans session NextAuth valide, on renvoie
 *    vers /auth?mode=login&callbackUrl=… au lieu d'afficher la page vide.
 *    (L'ancien middleware.js à la racine n'était jamais exécuté : avec un
 *    dossier src/, Next.js n'utilise QUE src/middleware.ts.)
 *
 * 2. CORS pour le développement local (web preview Expo sur localhost:*),
 *    uniquement sur /api. En production, aucune modification.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/** Pages qui nécessitent d'être connectée. */
const PROTECTED_PREFIXES = [
  "/mon-compte",
  "/explorer",
  "/matches",
  "/messages",
  "/circle",
  "/mode-fantome",
  "/verification-photo",
  "/inscription",
  "/paiement",
  "/vibesphere",
  "/vibementor",
  "/vibeplanner",
  "/admin",
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function withCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin") ?? "";
  const isDev = process.env.NODE_ENV === "development";
  const isLocalhost = isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin);

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

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // ── API : CORS dev uniquement ──
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin") ?? "";
    const isDev = process.env.NODE_ENV === "development";
    const isLocalhost = isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin);

    if (request.method === "OPTIONS" && isLocalhost) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    return withCors(request, NextResponse.next());
  }

  // ── Pages privées : session obligatoire ──
  if (isProtected(pathname)) {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      const loginUrl = new URL("/auth", request.url);
      loginUrl.searchParams.set("mode", "login");
      loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/mon-compte/:path*",
    "/explorer/:path*",
    "/matches/:path*",
    "/messages/:path*",
    "/circle/:path*",
    "/mode-fantome/:path*",
    "/verification-photo/:path*",
    "/inscription/:path*",
    "/paiement/:path*",
    "/vibesphere/:path*",
    "/vibementor/:path*",
    "/vibeplanner/:path*",
    "/admin/:path*",
  ],
};
