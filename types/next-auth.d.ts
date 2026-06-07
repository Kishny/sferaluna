// types/next-auth.d.ts

import "next-auth";
import "next-auth/jwt";

/**
 * Extension des types NextAuth pour SferaLuna.
 *
 * Objectif :
 * - éviter les "as any" partout dans le frontend ;
 * - rendre session.user.id / session.user._id disponibles ;
 * - typer les infos premium ;
 * - typer les infos de rôle, provider, sécurité et vérification d'identité ;
 * - garder une session légère et mobile-first.
 */

/**
 * Providers d'authentification utilisés dans le projet.
 */
type AuthProvider = "credentials" | "google" | "apple";

/**
 * Rôles utilisateurs.
 */
type UserRole = "user" | "admin";

/**
 * Plans SferaLuna.
 *
 * Ces valeurs doivent rester synchronisées avec :
 * - src/models/User.ts
 * - src/app/paiement/page.tsx
 * - src/app/api/stripe/create-checkout-session/route.ts
 * - src/app/api/stripe/webhook/route.ts
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
 * Statut de vérification d'identité Stripe Identity.
 */
type IdentityVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed";

/**
 * Extension de la session NextAuth.
 *
 * Utilisation côté frontend :
 *
 * const { data: session } = useSession();
 * session?.user?.id
 * session?.user?.isPremium
 * session?.user?.hasCompletedProfile
 */
declare module "next-auth" {
  interface Session {
    user: {
      /**
       * ID MongoDB de l'utilisateur.
       *
       * On garde id ET _id volontairement :
       * - id est pratique pour NextAuth / Pusher ;
       * - _id est pratique car MongoDB utilise _id.
       */
      id?: string;
      _id?: string;

      /**
       * Champs NextAuth standards.
       */
      name?: string | null;
      email?: string | null;
      image?: string | null;

      /**
       * Identité publique SferaLuna.
       */
      pseudonyme?: string;

      /**
       * Rôle et provider.
       */
      role?: UserRole;
      provider?: AuthProvider;

      /**
       * Statut de sécurité du compte.
       */
      banned?: boolean;

      /**
       * Profil.
       */
      hasCompletedProfile?: boolean;

      /**
       * Premium / Stripe.
       */
      plan?: LunaPlan;
      isPremium?: boolean;
      subscriptionStatus?: SubscriptionStatus;

      premiumStartedAt?: string | null;
      premiumExpiresAt?: string | null;

      stripeCustomerId?: string;
      stripeSubscriptionId?: string;

      /**
       * Vérification d'identité.
       */
      identityVerified?: boolean;
      identityVerificationStatus?: IdentityVerificationStatus;

      /**
       * Suivi.
       */
      lastLoginAt?: string | null;
    };
  }

  interface User {
    id?: string;
    _id?: string;

    name?: string | null;
    email?: string | null;
    image?: string | null;

    pseudonyme?: string;

    role?: UserRole;
    provider?: AuthProvider;

    banned?: boolean;

    hasCompletedProfile?: boolean;

    plan?: LunaPlan;
    isPremium?: boolean;
    subscriptionStatus?: SubscriptionStatus;

    premiumStartedAt?: string | null;
    premiumExpiresAt?: string | null;

    stripeCustomerId?: string;
    stripeSubscriptionId?: string;

    identityVerified?: boolean;
    identityVerificationStatus?: IdentityVerificationStatus;

    lastLoginAt?: string | null;
  }
}

/**
 * Extension du JWT NextAuth.
 *
 * Ces champs sont remplis dans :
 * src/app/api/auth/[...nextauth]/route.ts
 *
 * callback jwt({ token })
 */
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    _id?: string;

    name?: string | null;
    email?: string | null;
    picture?: string | null;

    pseudonyme?: string;

    role?: UserRole;
    provider?: AuthProvider;

    banned?: boolean;

    hasCompletedProfile?: boolean;

    plan?: LunaPlan;
    isPremium?: boolean;
    subscriptionStatus?: SubscriptionStatus;

    premiumStartedAt?: string | null;
    premiumExpiresAt?: string | null;

    stripeCustomerId?: string;
    stripeSubscriptionId?: string;

    identityVerified?: boolean;
    identityVerificationStatus?: IdentityVerificationStatus;

    lastLoginAt?: string | null;
  }
}