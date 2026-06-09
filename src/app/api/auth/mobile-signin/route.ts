/**
 * POST /api/auth/mobile-signin
 *
 * Route dédiée à l'authentification OAuth native (iOS / Android).
 * Accepte un token Google (id_token) ou Apple (identityToken),
 * le vérifie côté serveur, trouve ou crée l'utilisatrice dans MongoDB,
 * puis forge un cookie de session NextAuth valide.
 *
 * Body JSON :
 *   { provider: "google", idToken: string }
 *   { provider: "apple",  identityToken: string, name?: string, email?: string }
 *
 * Réponse :
 *   200 { success: true, user: {...} }   + Set-Cookie: next-auth.session-token
 *   400 / 401 { error: string }
 */

import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

// ── Google token verification ──────────────────────────────────────────────

async function verifyGoogleIdToken(
  idToken: string
): Promise<{ email: string; name?: string; picture?: string; sub: string }> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error("Token Google invalide.");
  const data = await res.json();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (clientId && data.aud !== clientId) {
    throw new Error("Token Google : audience incorrecte.");
  }
  if (!data.email_verified || data.email_verified === "false") {
    throw new Error("Email Google non vérifié.");
  }
  return {
    email: data.email as string,
    name: (data.name as string | undefined) ?? data.email,
    picture: data.picture as string | undefined,
    sub: data.sub as string,
  };
}

// ── Apple token verification ───────────────────────────────────────────────

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys")
);

async function verifyAppleIdentityToken(
  identityToken: string,
  fallbackEmail?: string,
  fallbackName?: string
): Promise<{ email: string; name?: string; sub: string }> {
  const { payload } = await jwtVerify(identityToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_ID,
  });

  const email =
    (payload.email as string | undefined) ||
    fallbackEmail ||
    `${payload.sub}@privaterelay.appleid.com`;

  return {
    email,
    name: fallbackName,
    sub: payload.sub as string,
  };
}

// ── Find or create user ────────────────────────────────────────────────────

async function findOrCreateUser(params: {
  email: string;
  name?: string;
  image?: string;
  provider: "google" | "apple";
  providerId: string;
}) {
  await connectDB();

  const email = params.email.toLowerCase().trim();
  let user = await User.findOne({ email });

  if (!user) {
    // Création d'un nouveau compte OAuth
    user = await new User({
      email,
      name: params.name ?? email.split("@")[0],
      pseudonyme: params.name ?? email.split("@")[0],
      image: params.image ?? null,
      provider: params.provider,
      emailVerified: new Date(),
      hasCompletedProfile: false,
      plan: "free",
      isPremium: false,
      subscriptionStatus: "inactive",
      role: "user",
      banned: false,
      identityVerified: false,
    }).save();
  } else if (!user.provider || user.provider === "credentials") {
    // Liaison du provider OAuth à un compte existant
    user.provider = params.provider;
    if (!user.image && params.image) user.image = params.image;
    await user.save();
  }

  if (user.banned) {
    throw new Error("Ce compte a été suspendu.");
  }

  return user;
}

// ── Forge NextAuth session cookie ──────────────────────────────────────────

async function createSessionCookie(user: {
  _id: string;
  email: string;
  name?: string;
  pseudonyme?: string;
  image?: string;
  role?: string;
  provider?: string;
  hasCompletedProfile?: boolean;
  plan?: string;
  isPremium?: boolean;
  subscriptionStatus?: string;
  identityVerified?: boolean;
}) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET manquant.");

  const maxAge = 30 * 24 * 60 * 60; // 30 jours

  const token = await encode({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    token: {
      sub: String(user._id),
      email: user.email,
      name: user.name,
      picture: user.image,
      // Champs custom NextAuth (voir jwt callback dans [...nextauth]/route.ts)
      id: String(user._id),
      pseudonyme: user.pseudonyme,
      role: user.role ?? "user",
      provider: user.provider ?? "credentials",
      hasCompletedProfile: user.hasCompletedProfile ?? false,
      plan: user.plan ?? "free",
      isPremium: user.isPremium ?? false,
      subscriptionStatus: user.subscriptionStatus ?? "inactive",
      identityVerified: user.identityVerified ?? false,
    } as any,
    secret,
    maxAge,
  });

  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  return { token, cookieName, maxAge };
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider } = body as { provider?: string };

    if (provider !== "google" && provider !== "apple") {
      return NextResponse.json(
        { error: "Provider non supporté." },
        { status: 400 }
      );
    }

    let oauthUser: { email: string; name?: string; picture?: string; sub: string };

    if (provider === "google") {
      const { idToken } = body as { idToken?: string };
      if (!idToken) {
        return NextResponse.json({ error: "idToken manquant." }, { status: 400 });
      }
      oauthUser = await verifyGoogleIdToken(idToken);
    } else {
      const {
        identityToken,
        email: fallbackEmail,
        name: fallbackName,
      } = body as {
        identityToken?: string;
        email?: string;
        name?: string;
      };
      if (!identityToken) {
        return NextResponse.json(
          { error: "identityToken manquant." },
          { status: 400 }
        );
      }
      oauthUser = await verifyAppleIdentityToken(
        identityToken,
        fallbackEmail,
        fallbackName
      );
    }

    const dbUser = await findOrCreateUser({
      email: oauthUser.email,
      name: oauthUser.name,
      image: (oauthUser as { picture?: string }).picture,
      provider,
      providerId: oauthUser.sub,
    });

    const { token, cookieName, maxAge } = await createSessionCookie({
      ...dbUser.toObject(),
      _id: String(dbUser._id),
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: String(dbUser._id),
        email: dbUser.email,
        name: dbUser.name,
        pseudonyme: dbUser.pseudonyme,
        image: dbUser.image ?? null,
        hasCompletedProfile: dbUser.hasCompletedProfile,
        plan: dbUser.plan,
        isPremium: dbUser.isPremium,
      },
    });

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'authentification.";
    const status = message.includes("invalide") || message.includes("audience")
      ? 401
      : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
