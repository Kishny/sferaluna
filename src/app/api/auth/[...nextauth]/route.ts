// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * Configuration NextAuth SferaLuna.
 *
 * Objectif mobile-first :
 * - session légère ;
 * - infos essentielles directement disponibles côté frontend ;
 * - pas de données sensibles dans session.user ;
 * - synchronisation propre avec MongoDB à chaque JWT callback.
 */

type LunaPlan =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

type AuthProvider = "credentials" | "google" | "apple";

type IdentityVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed";

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeOAuthProvider(
  provider?: string
): Exclude<AuthProvider, "credentials"> {
  if (provider === "apple") return "apple";
  return "google";
}

function normalizeEmail(email?: string | null) {
  return email?.toLowerCase().trim() || "";
}

function dateToIso(date?: Date | string | null) {
  if (!date) return null;

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return parsedDate.toISOString();
}

/**
 * Génère le clientSecret Apple au format JWT.
 *
 * Apple exige un JWT signé en ES256.
 * NextAuth attend une string pour clientSecret.
 */
function generateAppleClientSecret() {
  const appleId = process.env.APPLE_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY;
  const keyId = process.env.APPLE_KEY_ID;

  if (!appleId || !teamId || !privateKey || !keyId) {
    throw new Error("Variables Apple OAuth manquantes.");
  }

  return jwt.sign({}, privateKey.replace(/\\n/g, "\n"), {
    algorithm: "ES256",
    expiresIn: "180d",
    audience: "https://appleid.apple.com",
    issuer: teamId,
    subject: appleId,
    keyid: keyId,
  });
}

async function getMongoUserByEmail(email: string) {
  await connectDB();

  return User.findOne({
    email: normalizeEmail(email),
  }).select(
    [
      "_id",
      "email",
      "pseudonyme",
      "name",
      "image",
      "role",
      "provider",
      "banned",
      "hasCompletedProfile",
      "plan",
      "isPremium",
      "subscriptionStatus",
      "premiumStartedAt",
      "premiumExpiresAt",
      "stripeCustomerId",
      "stripeSubscriptionId",
      "identityVerified",
      "identityVerificationStatus",
      "lastLoginAt",
    ].join(" ")
  );
}

/**
 * Providers OAuth activés selon les variables .env.
 *
 * Mobile-first :
 * on évite que le site plante si Apple n'est pas encore configuré.
 */
function getOAuthProviders() {
  const providers = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    );
  }

  /**
   * Apple OAuth.
   *
   * Correction importante :
   * clientSecret doit être une string.
   * On utilise donc generateAppleClientSecret().
   */
  if (
    process.env.APPLE_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_PRIVATE_KEY &&
    process.env.APPLE_KEY_ID
  ) {
    providers.push(
      AppleProvider({
        clientId: process.env.APPLE_ID,
        clientSecret: generateAppleClientSecret(),

        /**
         * Important — bug connu NextAuth + Apple :
         * Apple répond via response_mode=form_post, donc le callback
         * arrive en POST cross-site depuis appleid.apple.com. Le cookie
         * PKCE "code_verifier" posé par NextAuth est SameSite=Lax par
         * défaut : le navigateur ne le renvoie pas sur cette requête
         * cross-origin, ce qui déclenche l'erreur OAUTH_CALLBACK_ERROR
         * "Le cookie PKCE code_verifier est manquant".
         * On désactive donc la vérification PKCE/state pour ce provider
         * uniquement (workaround documenté pour Apple Sign In).
         */
        checks: ["none"],
      })
    );
  }

  return providers;
}

export const authOptions: NextAuthOptions = {
  providers: [
    ...getOAuthProviders(),

    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Mot de passe",
          type: "password",
        },
      },

      async authorize(credentials) {
        await connectDB();

        const email = normalizeEmail(credentials?.email);
        const password = credentials?.password || "";

        if (!email || !password) {
          return null;
        }

        const user = await User.findOne({ email }).select(
          "+password _id email pseudonyme name image banned"
        );

        if (!user) {
          return null;
        }

        if (user.banned) {
          return null;
        }

        if (!user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        try {
          user.lastLoginAt = new Date();
          await user.save();
        } catch (error) {
          console.warn("Impossible de mettre à jour lastLoginAt :", error);
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.pseudonyme || user.name || "Utilisateur Luna",
          image: user.image || "",
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth",
  },

  callbacks: {
    async signIn({ user, account }) {
      await connectDB();

      const email = normalizeEmail(user.email);

      if (!email) {
        return false;
      }

      if (
        account?.provider === "google" ||
        account?.provider === "apple"
      ) {
        const oauthProvider = normalizeOAuthProvider(account.provider);

        const existingUser = await User.findOne({ email });

        if (!existingUser) {
          await User.create({
            email,
            pseudonyme: user.name || "Utilisateur Luna",
            name: user.name || "",
            image: user.image || "",
            provider: oauthProvider,

            emailVerified: true,

            hasCompletedProfile: false,
            profileCompletedAt: null,

            consentement: true,
            role: "user",
            banned: false,

            plan: "free",
            isPremium: false,
            subscriptionStatus: "inactive",
            premiumStartedAt: null,
            premiumExpiresAt: null,
            stripeCustomerId: "",
            stripeSubscriptionId: "",
            stripeCheckoutSessionId: "",

            identityVerified: false,
            identityVerificationStatus: "unverified",

            lastLoginAt: new Date(),
          });
        } else {
          existingUser.name = user.name || existingUser.name;
          existingUser.image = user.image || existingUser.image;
          existingUser.provider = oauthProvider;
          existingUser.emailVerified = true;
          existingUser.lastLoginAt = new Date();

          await existingUser.save();
        }
      }

      return true;
    },

    async jwt({ token }) {
      const email = normalizeEmail(token.email);

      if (!email) {
        return token;
      }

      const dbUser = await getMongoUserByEmail(email);

      if (!dbUser) {
        return token;
      }

      token.id = dbUser._id.toString();
      token._id = dbUser._id.toString();

      token.email = dbUser.email;
      token.name = dbUser.pseudonyme || dbUser.name || "Utilisateur Luna";
      token.picture = dbUser.image || token.picture || "";

      token.pseudonyme = dbUser.pseudonyme || "Utilisateur Luna";
      token.role = dbUser.role || "user";
      token.provider = dbUser.provider || "credentials";

      token.banned = normalizeBoolean(dbUser.banned, false);

      token.hasCompletedProfile = normalizeBoolean(
        dbUser.hasCompletedProfile,
        false
      );

      token.plan = (dbUser.plan || "free") as LunaPlan;

      token.isPremium = normalizeBoolean(dbUser.isPremium, false);

      token.subscriptionStatus = (dbUser.subscriptionStatus ||
        "inactive") as SubscriptionStatus;

      token.premiumStartedAt = dateToIso(dbUser.premiumStartedAt);
      token.premiumExpiresAt = dateToIso(dbUser.premiumExpiresAt);

      token.stripeCustomerId = dbUser.stripeCustomerId || "";
      token.stripeSubscriptionId = dbUser.stripeSubscriptionId || "";

      token.identityVerified = normalizeBoolean(dbUser.identityVerified, false);

      token.identityVerificationStatus = (dbUser.identityVerificationStatus ||
        "unverified") as IdentityVerificationStatus;

      token.lastLoginAt = dateToIso(dbUser.lastLoginAt);

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as any;

        sessionUser.id = token.id as string;
        sessionUser._id = (token._id || token.id) as string;

        sessionUser.email = token.email as string;
        sessionUser.name = token.name as string;
        sessionUser.image = token.picture as string;

        sessionUser.pseudonyme = token.pseudonyme as string;
        sessionUser.role = token.role as string;
        sessionUser.provider = token.provider as AuthProvider;

        sessionUser.banned = token.banned as boolean;

        sessionUser.hasCompletedProfile =
          token.hasCompletedProfile as boolean;

        sessionUser.plan = token.plan as LunaPlan;
        sessionUser.isPremium = token.isPremium as boolean;

        sessionUser.subscriptionStatus =
          token.subscriptionStatus as SubscriptionStatus;

        sessionUser.premiumStartedAt = token.premiumStartedAt as string | null;
        sessionUser.premiumExpiresAt = token.premiumExpiresAt as string | null;

        sessionUser.stripeCustomerId = token.stripeCustomerId as string;
        sessionUser.stripeSubscriptionId =
          token.stripeSubscriptionId as string;

        sessionUser.identityVerified = token.identityVerified as boolean;

        sessionUser.identityVerificationStatus =
          token.identityVerificationStatus as IdentityVerificationStatus;

        sessionUser.lastLoginAt = token.lastLoginAt as string | null;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        return url;
      }

      return baseUrl;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
