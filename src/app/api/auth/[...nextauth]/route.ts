// src/app/api/auth/[...nextauth]/route.ts

import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * Plans SferaLuna utilisés partout :
 * - MongoDB
 * - Stripe
 * - frontend
 */
type LunaPlan =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

/**
 * Statuts d'abonnement internes.
 */
type SubscriptionStatus =
  | "inactive"
  | "active"
  | "trialing"
  | "past_due"
  | "canceled";

/**
 * Petit helper pour éviter les erreurs si une valeur MongoDB est absente.
 */
function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

/**
 * Récupère l'utilisateur MongoDB à partir d'un email.
 * On centralise cette logique pour le callback JWT.
 */
async function getMongoUserByEmail(email: string) {
  await connectDB();

  return User.findOne({
    email: email.toLowerCase().trim(),
  }).select(
    [
      "_id",
      "email",
      "pseudonyme",
      "name",
      "image",
      "role",
      "provider",
      "hasCompletedProfile",
      "plan",
      "isPremium",
      "subscriptionStatus",
      "premiumStartedAt",
      "premiumExpiresAt",
      "stripeCustomerId",
      "stripeSubscriptionId",
    ].join(" ")
  );
}

/**
 * Configuration principale NextAuth.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    /**
     * Connexion Google.
     */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    /**
     * Connexion Facebook.
     */
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID as string,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
    }),

    /**
     * Connexion Apple.
     * Nécessite un compte Apple Developer (developer.apple.com) :
     * - APPLE_ID        = votre Service ID (ex: com.sferaluna.web)
     * - APPLE_TEAM_ID   = votre Team ID (10 caractères)
     * - APPLE_PRIVATE_KEY = contenu du fichier .p8 (avec \n entre les lignes)
     * - APPLE_KEY_ID    = Key ID du fichier .p8
     * Fonctionne uniquement sur HTTPS (pas en localhost).
     */
    ...(process.env.APPLE_ID
      ? [
          AppleProvider({
            clientId: process.env.APPLE_ID as string,
            clientSecret: {
              appleId: process.env.APPLE_ID as string,
              teamId: process.env.APPLE_TEAM_ID as string,
              privateKey: (process.env.APPLE_PRIVATE_KEY as string).replace(/\\n/g, "\n"),
              keyId: process.env.APPLE_KEY_ID as string,
            },
          }),
        ]
      : []),

    /**
     * Connexion email + mot de passe.
     *
     * Attention :
     * pour l’instant ton mot de passe est comparé en clair.
     * Plus tard, il faudra passer sur bcrypt.
     */
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

        const email = credentials?.email?.toLowerCase().trim();
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        // On force la sélection du password (select: false dans le modèle)
        const user = await User.findOne({ email }).select("+password");

        if (!user) {
          return null;
        }

        /**
         * Comparaison bcrypt du mot de passe.
         * user.password est le hash stocké en base.
         */
        if (!user.password) {
          // Compte créé via Google OAuth, pas de mot de passe credentials
          return null;
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          return null;
        }

        /**
         * On retourne un objet simple pour NextAuth.
         * Les vraies infos seront ensuite rafraîchies dans jwt().
         */
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.pseudonyme || user.name || "Utilisateur Luna",
          image: user.image || "",
        };
      },
    }),
  ],

  /**
   * Session JWT.
   */
  session: {
    strategy: "jwt",
  },

  /**
   * Page personnalisée.
   */
  pages: {
    signIn: "/auth",
  },

  callbacks: {
    /**
     * signIn :
     * - crée l'utilisateur Google s'il n'existe pas ;
     * - ne remet jamais à zéro le premium ;
     * - ne touche pas à plan/isPremium/subscriptionStatus si l'utilisateur existe.
     */
    async signIn({ user, account }) {
      await connectDB();

      const email = user.email?.toLowerCase().trim();

      if (!email) {
        return false;
      }

      if (account?.provider === "google" || account?.provider === "apple" || account?.provider === "facebook") {
        const existingUser = await User.findOne({ email });

        if (!existingUser) {
          await User.create({
            email,
            pseudonyme: user.name || "Utilisateur Luna",
            name: user.name || "",
            image: user.image || "",
            provider: (account?.provider as "google" | "apple" | "facebook") ?? "google",
            emailVerified: true, // OAuth = email déjà vérifié

            /**
             * Un nouveau compte Google doit compléter son profil.
             */
            hasCompletedProfile: false,
            consentement: true,
            role: "user",

            /**
             * Valeurs premium par défaut.
             */
            plan: "free",
            isPremium: false,
            subscriptionStatus: "inactive",
            premiumStartedAt: null,
            premiumExpiresAt: null,
            stripeCustomerId: "",
            stripeSubscriptionId: "",
          });

        } else {
          /**
           * Important :
           * ici on synchronise uniquement les infos Google.
           * On ne touche pas au paiement.
           */
          existingUser.name = user.name || existingUser.name;
          existingUser.image = user.image || existingUser.image;
          existingUser.provider = "google";

          await existingUser.save();

        }
      }

      return true;
    },

    /**
     * jwt :
     * À chaque récupération de session, on recharge l'utilisateur MongoDB.
     *
     * C'est ce qui permet au site de "se souvenir" :
     * - du profil complété ;
     * - du plan ;
     * - du statut premium ;
     * - de l'abonnement Stripe.
     */
    async jwt({ token }) {
      const email = token.email?.toLowerCase().trim();

      if (!email) {
        return token;
      }

      const dbUser = await getMongoUserByEmail(email);

      if (!dbUser) {
        return token;
      }

      token.id = dbUser._id.toString();
      token.email = dbUser.email;
      token.name = dbUser.pseudonyme || dbUser.name || "Utilisateur Luna";
      token.picture = dbUser.image || token.picture || "";

      token.pseudonyme = dbUser.pseudonyme || "Utilisateur Luna";
      token.role = dbUser.role || "user";
      token.provider = dbUser.provider || "credentials";

      token.hasCompletedProfile = normalizeBoolean(
        dbUser.hasCompletedProfile,
        false
      );

      token.plan = (dbUser.plan || "free") as LunaPlan;
      token.isPremium = normalizeBoolean(dbUser.isPremium, false);
      token.subscriptionStatus = (dbUser.subscriptionStatus ||
        "inactive") as SubscriptionStatus;

      token.premiumStartedAt = dbUser.premiumStartedAt
        ? dbUser.premiumStartedAt.toISOString()
        : null;

      token.premiumExpiresAt = dbUser.premiumExpiresAt
        ? dbUser.premiumExpiresAt.toISOString()
        : null;

      token.stripeCustomerId = dbUser.stripeCustomerId || "";
      token.stripeSubscriptionId = dbUser.stripeSubscriptionId || "";

      return token;
    },

    /**
     * session :
     * On transfère les infos du token vers session.user.
     *
     * On utilise "as any" pour éviter les erreurs TypeScript tant que
     * le fichier next-auth.d.ts n'est pas encore ajouté.
     */
    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as any;

        sessionUser.id = token.id as string;
        sessionUser.email = token.email as string;
        sessionUser.name = token.name as string;
        sessionUser.image = token.picture as string;

        sessionUser.pseudonyme = token.pseudonyme as string;
        sessionUser.role = token.role as string;
        sessionUser.provider = token.provider as string;

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
      }

      return session;
    },

    /**
     * redirect :
     * On respecte les URLs internes.
     * La vraie décision /inscription ou /mon-compte se fera côté page /auth.
     */
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

  /**
   * Très important :
   * si tu changes NEXTAUTH_SECRET, les anciennes sessions cassent.
   * Donc garde une valeur stable dans .env.local.
   */
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Handler NextAuth compatible App Router.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

