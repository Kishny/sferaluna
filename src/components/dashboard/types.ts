// src/components/dashboard/types.ts

/**
 * Types partagés du Tableau de bord /mon-compte.
 * Volontairement minimalistes : compatibles structurellement avec LunaUser
 * défini dans src/app/mon-compte/page.tsx.
 */

export type DashboardTabId =
  | "dashboard"
  | "profil"
  | "preferences"
  | "premium"
  | "securite"
  | "connexions";

export type DashboardPlan =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

export interface DashboardUser {
  _id?: string;
  email: string;
  pseudonyme: string;
  image?: string;
  photos?: string[];
  age?: number;
  localisation?: string;
  departement?: string;
  intentions: string[];
  visibilite: string;
  plan: DashboardPlan;
  subscriptionStatus: string;
  isPremium: boolean;
  hasCompletedProfile: boolean;
  identityVerified?: boolean;
  role: "user" | "admin";
}

export interface NotificationCounts {
  total: number;
  unreadMessages: number;
  newMatches: number;
  newVisits: number;
}

export interface PublicUserPreview {
  _id: string;
  pseudonyme: string;
  image?: string;
  age?: number;
  localisation?: string;
  identityVerified?: boolean;
}

export interface DashboardEvent {
  _id: string;
  title: string;
  date: string;
  location: string;
  isOnline: boolean;
  category: string;
  emoji: string;
  coverEmoji: string;
  maxAttendees: number;
  attendeeCount: number;
  isRegistered: boolean;
  isFull: boolean;
  attendees: { _id: string; pseudonyme: string; image?: string }[];
  mode: "local" | "online" | "any" | null;
}

export interface DashboardData {
  plan: DashboardPlan;
  premiumActive: boolean;
  features: {
    profileVisitors: boolean;
    eventsAccess: boolean;
    circleOfSix: boolean;
    vibePlanner: boolean;
    ghostMode: boolean;
  };
  counts: {
    unreadMessages: number;
    unreadConversations: number;
    firstUnreadMatchId: string | null;
    totalMatches: number;
    newMatchesWeek: number;
    silentMatches: number;
    visitsWeek: number;
    discoverable: number;
    newProfilesWeek: number;
    localEvents: number;
    localEventsWeek: number;
    upcomingEvents: number;
  };
  visitors: {
    locked: boolean;
    items: (PublicUserPreview & { lastVisit: string })[];
  };
  matches: {
    items: {
      matchId: string;
      createdAt: string;
      lastMessageAt: string | null;
      user: PublicUserPreview;
    }[];
  };
  event: DashboardEvent | null;
}

export interface MissingField {
  key: string;
  label: string;
}
