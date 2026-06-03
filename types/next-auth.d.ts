// types/next-auth.d.ts

import "next-auth";
import "next-auth/jwt";

/**
 * Extension des types de session NextAuth.
 * Cela permet d'utiliser :
 * session.user.id
 * session.user.pseudonyme
 * session.user.role
 * session.user.hasCompletedProfile
 */
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      pseudonyme?: string;
      role?: string;
      hasCompletedProfile?: boolean;
    };
  }

  interface User {
    id?: string;
    pseudonyme?: string;
    role?: string;
    hasCompletedProfile?: boolean;
  }
}

/**
 * Extension du JWT NextAuth.
 */
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    pseudonyme?: string;
    role?: string;
    hasCompletedProfile?: boolean;
  }
}