// src/app/mon-compte/page.tsx

"use client";

/**
 * Page Mon Compte SferaLuna.
 *
 * Cette page gère :
 * - l'affichage du profil connecté ;
 * - la récupération du profil depuis /api/users/profile ;
 * - l'édition du profil ;
 * - les préférences relationnelles ;
 * - la visibilité / mode invisible ;
 * - l'abonnement Premium ;
 * - la sécurité du compte ;
 * - les matches et visiteurs.
 *
 * Corrections importantes dans cette version :
 * - Premium actif uniquement si Stripe a confirmé via webhook :
 *   isPremium === true && subscriptionStatus === "active" | "trialing"
 * - Le simple fait d'avoir plan = "elite-monthly" ne débloque plus Premium.
 * - Le mode invisible reste bloqué si l'abonnement n'est pas réellement actif.
 * - La visibilité rapide utilise /api/users/profile au lieu d'une route
 *   /api/users/visibility qui peut ne pas exister.
 * - ReportModal reçoit bien isOpen, comme sur tes autres pages.
 * - Conservation du design mobile-first.
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Crown,
  Eye,
  Heart,
  Info,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Moon,
  Pencil,
  Save,
  Shield,
  Sparkles,
  User,
  X,
  ChevronRight,
  Star,
  Flag,
} from "lucide-react";
import Link from "next/link";
import ReportModal from "@/components/ReportModal";
import TestimonialForm from "@/components/testimonials/TestimonialForm";
import { getDepartementLabel } from "@/lib/locations";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import type { MissingField, NotificationCounts } from "@/components/dashboard/types";
import type { ProfileVideo } from "@/components/profile/VideosSection";
import ProfileEditor from "@/components/profile/ProfileEditor";
import PreferencesPanel from "@/components/account/PreferencesPanel";
import PremiumPanel from "@/components/account/PremiumPanel";
import SecurityPanel from "@/components/account/SecurityPanel";
import InteractionsPanel from "@/components/account/InteractionsPanel";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AuthProvider = "credentials" | "google" | "apple";
type UserRole = "user" | "admin";

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

type ProfileVisibility = "public" | "matches" | "premium" | "invisible";

type IdentityVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "failed";

type TabId =
  | "dashboard"
  | "profil"
  | "preferences"
  | "premium"
  | "securite"
  | "connexions";

interface LunaUser {
  _id?: string;
  id?: string;

  // Identité
  email: string;
  pseudonyme: string;
  name?: string;
  image?: string;
  photos?: string[];

  // Auth
  password?: string;
  provider?: AuthProvider;

  // Profil
  bio?: string;
  age?: number;
  orientation?: string;
  intentions: string[];
  localisation?: string;
  departement?: string;
  rayon?: string;
  profession?: string;
  valeurs?: string[];
  modeDeVie?: string;
  langues?: string[];
  photoVerified?: boolean;
  photoVerificationStatus?: "none" | "verified" | "needs_review";
  videos?: ProfileVideo[];
  question?: string;
  reponse?: string;       // champ local uniquement : jamais retourné par l'API
  hasReponse?: boolean;   // true si réponse secrète déjà enregistrée en BDD
  interets: string[];
  visibilite: ProfileVisibility;

  // État du compte
  hasCompletedProfile: boolean;
  profileCompletedAt?: string | null;
  consentement: boolean;
  role: UserRole;

  // Premium / Stripe
  plan: LunaPlan;
  subscriptionStatus: SubscriptionStatus;
  isPremium: boolean;
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  lastPaymentAt?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionPaused?: boolean;

  // Cooldowns annuels
  pseudonymeChangedAt?: string | null;
  orientationChangedAt?: string | null;

  // Sécurité
  emailVerified?: boolean;
  lastLoginAt?: string | null;
  identityVerified?: boolean;
  identityVerificationStatus?: IdentityVerificationStatus;

  // Labels API éventuels
  planLabel?: string;
  subscriptionStatusLabel?: string;

  createdAt?: string;
  updatedAt?: string;
}

type Visitor = {
  user: {
    _id: string;
    pseudonyme: string;
    age?: number;
    localisation?: string;
    departement?: string;
    image?: string;
  } | null;
  lastVisit: string;
  visitCount: number;
};

interface MatchUser {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  image?: string;
  interets?: string[];
}

interface MatchItem {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  hasUnreadMessage?: boolean;
  user: MatchUser | null;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const emptyUser: LunaUser = {
  email: "",
  pseudonyme: "Utilisateur Luna",
  name: "",
  image: "",
  photos: [],
  provider: "credentials",

  age: 28,
  bio: "",
  orientation: "",
  intentions: [],
  localisation: "",
  departement: "",
  rayon: "departement",
  question: "",
  reponse: "",
  interets: [],
  visibilite: "matches",

  hasCompletedProfile: false,
  profileCompletedAt: null,
  consentement: true,
  role: "user",

  plan: "free",
  subscriptionStatus: "inactive",
  isPremium: false,
  premiumStartedAt: null,
  premiumExpiresAt: null,
  stripeCustomerId: "",
  stripeSubscriptionId: "",
  stripeCheckoutSessionId: "",
  lastPaymentAt: null,

  lastLoginAt: null,
  identityVerified: false,
  identityVerificationStatus: "unverified",

  planLabel: "Gratuit",
  subscriptionStatusLabel: "Inactif",
};

const orientationLabels: Record<string, string> = {
  hetero: "Hétérosexuelle",
  homo: "Lesbienne / Homosexuelle",
  bi: "Bisexuelle",
  curieuse: "Curieuse — je souhaite découvrir",
  pan: "Pansexuel(le)",
  other: "Autre",
};

const intentionLabels: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

const visibilityLabels: Record<ProfileVisibility, string> = {
  public: "Profil public",
  matches: "Seulement mes matches",
  premium: "Membres premium",
  invisible: "Mode discret 👻",
};

const planLabels: Record<LunaPlan, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite ✨",
};

const planEmoji: Record<LunaPlan, string> = {
  free: "🌙",
  "essential-monthly": "⭐",
  "premium-monthly": "💎",
  "elite-monthly": "👑",
};

/**
 * Accent visuel par offre — même logique que sur /paiement et /tarifs :
 * chaque plan a sa propre teinte pour qu'on reconnaisse l'offre active
 * d'un coup d'œil (violet Essentiel, rose Premium, or Elite).
 */
const planAccent: Record<
  LunaPlan,
  {
    ring: string;
    gradient: string;
    banner: string;
    tabBorder: string;
    tabBg: string;
  }
> = {
  free: {
    ring: "ring-white/10",
    gradient: "from-white/10 to-white/5",
    banner: "from-white/15 via-white/10 to-white/15",
    tabBorder: "border-white/20",
    tabBg: "from-white/15 to-white/10",
  },
  "essential-monthly": {
    ring: "ring-violet-400/30",
    gradient: "from-violet-500 to-purple-500",
    banner: "from-violet-600/50 via-purple-500/40 to-violet-800/50",
    tabBorder: "border-violet-400/40",
    tabBg: "from-violet-500/30 to-purple-500/30",
  },
  "premium-monthly": {
    ring: "ring-pink-400/30",
    gradient: "from-purple-500 to-pink-500",
    banner: "from-purple-600/50 via-pink-500/40 to-purple-800/50",
    tabBorder: "border-purple-400/40",
    tabBg: "from-purple-500/30 to-pink-500/30",
  },
  "elite-monthly": {
    ring: "ring-amber-300/40",
    gradient: "from-amber-400 to-yellow-500",
    banner: "from-amber-500/50 via-yellow-400/40 to-amber-700/50",
    tabBorder: "border-amber-300/40",
    tabBg: "from-amber-400/30 to-yellow-500/30",
  },
};

const subscriptionLabels: Record<SubscriptionStatus, string> = {
  inactive: "En attente",
  active: "Actif ✅",
  trialing: "Essai gratuit",
  past_due: "Paiement en retard",
  canceled: "Annulé",
};

const tabs: { id: TabId; label: string; emoji: string; icon: ElementType }[] = [
  { id: "dashboard", label: "Accueil", emoji: "🏠", icon: Sparkles },
  { id: "profil", label: "Profil", emoji: "✨", icon: User },
  { id: "connexions", label: "Intéractions", emoji: "💞", icon: Heart },
  { id: "preferences", label: "Préférences", emoji: "💫", icon: Heart },
  { id: "premium", label: "Premium", emoji: "👑", icon: Crown },
  { id: "securite", label: "Sécurité", emoji: "🔒", icon: Shield },
];

/** Titre + sous-titre affichés au-dessus de chaque section du compte. */
const sectionMeta: Record<TabId, { title: string; subtitle: string }> = {
  dashboard: { title: "Tableau de bord", subtitle: "" },
  profil: { title: "Mon profil", subtitle: "Photos, bio et informations visibles par les autres membres." },
  connexions: { title: "Mes interactions", subtitle: "Tes matchs, tes visiteuses et tes échanges." },
  preferences: { title: "Préférences", subtitle: "Tes intentions, ton orientation et la visibilité de ton profil." },
  premium: { title: "Premium", subtitle: "Ton offre, tes avantages et la gestion de ton abonnement." },
  securite: { title: "Sécurité", subtitle: "Vérification d’identité, connexion et confidentialité." },
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function isValidPlan(plan: unknown): plan is LunaPlan {
  return (
    plan === "free" ||
    plan === "essential-monthly" ||
    plan === "premium-monthly" ||
    plan === "elite-monthly"
  );
}

function isValidSubscriptionStatus(
  status: unknown
): status is SubscriptionStatus {
  return (
    status === "inactive" ||
    status === "active" ||
    status === "trialing" ||
    status === "past_due" ||
    status === "canceled"
  );
}

function isValidVisibility(value: unknown): value is ProfileVisibility {
  return (
    value === "public" ||
    value === "matches" ||
    value === "premium" ||
    value === "invisible"
  );
}

function isValidIdentityStatus(value: unknown): value is IdentityVerificationStatus {
  return (
    value === "unverified" ||
    value === "pending" ||
    value === "verified" ||
    value === "failed"
  );
}

/**
 * Retourne le label du plan, même si le paiement n'est pas encore actif.
 *
 * Exemple :
 * - plan = elite-monthly => "Elite ✨"
 * - plan = free => "Gratuit"
 */
function getPremiumLabel(user: LunaUser) {
  if (user.plan && user.plan !== "free") {
    return planLabels[user.plan] || "Premium";
  }

  return "Gratuit";
}

/**
 * Premium réellement actif.
 *
 * Très important :
 * Le plan seul ne suffit pas.
 *
 * Un utilisateur peut avoir :
 * - plan: "elite-monthly"
 * - isPremium: false
 * - subscriptionStatus: "inactive"
 *
 * Dans ce cas, il a choisi une offre mais Stripe n'a pas encore confirmé.
 * Donc on NE débloque PAS les fonctionnalités premium.
 */
function isPremiumActive(user: LunaUser) {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" ||
      user.subscriptionStatus === "trialing")
  );
}

function formatDate(date?: string | null) {
  if (!date) return "—";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("fr-FR");
}

function relativeTime(dateStr: string | null) {
  if (!dateStr) return null;

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return null;

  const diff = Math.floor((Date.now() - date.getTime()) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;

  return date.toLocaleDateString("fr-FR");
}

/**
 * Normalise l'utilisateur reçu depuis l'API.
 *
 * Objectif :
 * - éviter les undefined ;
 * - éviter les crashs UI ;
 * - garder des valeurs cohérentes même si l'API renvoie un champ manquant ;
 * - conserver les champs Stripe/Premium correctement.
 */
function normalizeUser(rawUser: any, sessionUser?: any): LunaUser {
  const rawPlan = rawUser?.plan;
  const rawSubscriptionStatus = rawUser?.subscriptionStatus;
  const rawVisibility = rawUser?.visibilite;
  const rawIdentityStatus = rawUser?.identityVerificationStatus;

  const plan = isValidPlan(rawPlan) ? rawPlan : "free";

  const subscriptionStatus = isValidSubscriptionStatus(rawSubscriptionStatus)
    ? rawSubscriptionStatus
    : "inactive";

  return {
    ...emptyUser,
    ...rawUser,

    _id: rawUser?._id || rawUser?.id || "",
    id: rawUser?.id || rawUser?._id || "",

    email: rawUser?.email || sessionUser?.email || "",
    pseudonyme: rawUser?.pseudonyme || sessionUser?.name || "Utilisateur Luna",
    name: rawUser?.name || sessionUser?.name || "",
    image: rawUser?.image || sessionUser?.image || "",
    photos: Array.isArray(rawUser?.photos) ? rawUser.photos : [],

    provider: rawUser?.provider || "credentials",

    bio: rawUser?.bio || "",
    age: typeof rawUser?.age === "number" ? rawUser.age : 28,
    orientation: rawUser?.orientation || "",
    intentions: Array.isArray(rawUser?.intentions) ? rawUser.intentions : [],
    localisation: rawUser?.localisation || "",
    departement: rawUser?.departement || "",
    rayon: rawUser?.rayon || "departement",
    profession: rawUser?.profession || "",
    valeurs: Array.isArray(rawUser?.valeurs) ? rawUser.valeurs : [],
    modeDeVie: rawUser?.modeDeVie || "",
    langues: Array.isArray(rawUser?.langues) ? rawUser.langues : [],
    photoVerified: rawUser?.photoVerified === true,
    photoVerificationStatus: rawUser?.photoVerificationStatus || "none",
    videos: Array.isArray(rawUser?.videos) ? rawUser.videos : [],
    question: rawUser?.question || "",
    reponse: "",          // toujours vide au chargement (jamais renvoyée par l'API)
    hasReponse: Boolean(rawUser?.hasReponse), // true si déjà renseignée en BDD
    interets: Array.isArray(rawUser?.interets) ? rawUser.interets : [],
    visibilite: isValidVisibility(rawVisibility) ? rawVisibility : "matches",

    hasCompletedProfile: Boolean(rawUser?.hasCompletedProfile),
    profileCompletedAt: rawUser?.profileCompletedAt || null,
    consentement:
      typeof rawUser?.consentement === "boolean" ? rawUser.consentement : true,
    role: rawUser?.role === "admin" ? "admin" : "user",

    plan,
    subscriptionStatus,

    /**
     * On garde la valeur exacte reçue depuis MongoDB.
     * L'activation réelle est décidée par isPremiumActive().
     */
    isPremium: Boolean(rawUser?.isPremium),

    premiumStartedAt: rawUser?.premiumStartedAt || null,
    premiumExpiresAt: rawUser?.premiumExpiresAt || null,
    stripeCustomerId: rawUser?.stripeCustomerId || "",
    stripeSubscriptionId: rawUser?.stripeSubscriptionId || "",
    stripeCheckoutSessionId: rawUser?.stripeCheckoutSessionId || "",
    lastPaymentAt: rawUser?.lastPaymentAt || null,
    subscriptionCancelAtPeriodEnd: Boolean(rawUser?.subscriptionCancelAtPeriodEnd),
    subscriptionPaused: Boolean(rawUser?.subscriptionPaused),

    emailVerified: rawUser?.emailVerified === true,
    lastLoginAt: rawUser?.lastLoginAt || null,

    pseudonymeChangedAt: rawUser?.pseudonymeChangedAt || null,
    orientationChangedAt: rawUser?.orientationChangedAt || null,

    identityVerified: Boolean(rawUser?.identityVerified),
    identityVerificationStatus: isValidIdentityStatus(rawIdentityStatus)
      ? rawIdentityStatus
      : "unverified",

    planLabel: rawUser?.planLabel || planLabels[plan],
    subscriptionStatusLabel:
      rawUser?.subscriptionStatusLabel || subscriptionLabels[subscriptionStatus],

    createdAt: rawUser?.createdAt || undefined,
    updatedAt: rawUser?.updatedAt || undefined,
  };
}

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────

const tabContentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.07, duration: 0.3, ease: "easeOut" },
  }),
};

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

function MonCompteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [user, setUser] = useState<LunaUser>(emptyUser);
  const [draftUser, setDraftUser] = useState<LunaUser>(emptyUser);

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [pageError, setPageError] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  /**
   * Nombre total de notifications non lues (messages + matches + visites).
   * Sert à afficher la pastille lumineuse sur l'onglet "Intéractions".
   */
  const [notifs, setNotifs] = useState<NotificationCounts>({
    total: 0,
    unreadMessages: 0,
    newMatches: 0,
    newVisits: 0,
  });
  const notifCount = notifs.total;

  /** Tiroir de navigation mobile. */
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * Récupère le nombre de notifications non lues sans les marquer comme lues.
   * Le marquage "lu" se fait uniquement quand on ouvre l'onglet Intéractions.
   */
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        setNotifs({
          total: typeof data.total === "number" ? data.total : 0,
          unreadMessages: typeof data.unreadMessages === "number" ? data.unreadMessages : 0,
          newMatches: typeof data.newMatches === "number" ? data.newMatches : 0,
          newVisits: typeof data.newVisits === "number" ? data.newVisits : 0,
        });
      }
    } catch {
      // Silencieux : une erreur de notifications ne doit pas bloquer la page.
    }
  }, []);

  /**
   * Marque les notifications comme lues et éteint la pastille.
   * Déclenché quand l'utilisatrice ouvre l'onglet Intéractions.
   */
  const markNotificationsSeen = useCallback(async () => {
    setNotifs({ total: 0, unreadMessages: 0, newMatches: 0, newVisits: 0 });

    try {
      await fetch("/api/notifications", { method: "POST" });
    } catch {
      // Silencieux.
    }
  }, []);

  /**
   * Données du Tableau de bord : /api/dashboard + temps réel Pusher.
   * Les nouveaux matchs / messages rafraîchissent aussi la cloche.
   */
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    error: dashboardError,
    refresh: refreshDashboard,
  } = useDashboardData(
    user._id || undefined,
    status === "authenticated" && !isLoadingProfile,
    fetchNotifications
  );

  /**
   * Redirection si non connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * La vérification d'identité est obligatoire pour accéder au compte.
   * Si le profil est chargé et que l'identité n'est pas vérifiée, on
   * renvoie vers /inscription qui affichera l'étape de vérification.
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (isLoadingProfile) return;

    // Comptes admin exemptés de la vérification d'identité obligatoire.
    if (user.role === "admin") return;

    if (user.hasCompletedProfile && !user.identityVerified) {
      router.replace("/inscription");
    }
  }, [
    status,
    isLoadingProfile,
    user.role,
    user.hasCompletedProfile,
    user.identityVerified,
    router,
  ]);

  /**
   * Récupération du profil connecté.
   *
   * On fusionne :
   * - data.user : profil MongoDB
   * - data.premium : payload premium calculé côté API
   *
   * Puis on normalise pour éviter les valeurs undefined.
   */
  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setPageError("");

    try {
      const res = await fetch("/api/users/profile", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setPageError(data?.error || "Impossible de récupérer le profil.");
        return;
      }

      const rawUser = {
        ...data.user,
        ...(data.premium || {}),
      };

      const normalized = normalizeUser(rawUser, session?.user);

      setUser(normalized);
      setDraftUser(normalized);
    } catch {
      setPageError("Erreur de connexion au serveur.");
    } finally {
      setIsLoadingProfile(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfile();

      /**
       * On récupère le nombre de notifications pour afficher la pastille
       * lumineuse sur l'onglet "Intéractions". On NE marque PLUS comme lu
       * au chargement : le badge ne s'éteint qu'une fois l'onglet ouvert.
       */
      fetchNotifications();
    }
  }, [status, fetchProfile, fetchNotifications]);

  /**
   * Permet d'ouvrir directement un onglet via :
   * /mon-compte?tab=premium
   */
  useEffect(() => {
    const tab = searchParams.get("tab") as TabId | null;

    if (tab && tabs.some((item) => item.id === tab) && status === "authenticated") {
      setActiveTab(tab);
    }
  }, [searchParams, status]);

  /**
   * Dès que l'onglet "Intéractions" est ouvert, on marque les notifications
   * comme lues et on éteint la pastille lumineuse.
   */
  useEffect(() => {
    if (activeTab === "connexions") {
      markNotificationsSeen();
    }
  }, [activeTab, markNotificationsSeen]);

  /**
   * Gestion du retour après paiement Stripe.
   *
   * Attention :
   * Le retour navigateur ne prouve pas à lui seul que l'abonnement est actif.
   * Le webhook Stripe reste la vraie source de vérité.
   */
  useEffect(() => {
    const payment = searchParams.get("payment");

    if (status === "authenticated" && payment === "success") {
      setPaymentSuccess(true);
      fetchProfile();
      setActiveTab("premium");

      const timer = window.setTimeout(() => {
        setPaymentSuccess(false);
      }, 6000);

      return () => window.clearTimeout(timer);
    }
  }, [searchParams, status, fetchProfile]);

  const profileCompletion = useMemo(() => {
    const fields = [
      user.pseudonyme,
      user.email,
      user.age,
      user.orientation,
      user.intentions?.length,
      user.localisation,
      user.rayon,
      user.question,
      // user.reponse est toujours "" (jamais renvoyée par l'API pour sécurité).
      // On utilise hasReponse qui indique si la réponse est enregistrée en BDD.
      user.hasReponse,
      user.interets?.length,
      user.visibilite,
      user.consentement,
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  /** Champs du profil encore vides (même liste que profileCompletion). */
  const missingFields = useMemo<MissingField[]>(() => {
    const checks: [string, string, unknown][] = [
      ["pseudonyme", "Pseudonyme", user.pseudonyme],
      ["age", "Âge", user.age],
      ["orientation", "Orientation", user.orientation],
      ["intentions", "Intentions", user.intentions?.length],
      ["localisation", "Ville", user.localisation],
      ["rayon", "Zone de recherche", user.rayon],
      ["question", "Question secrète", user.question],
      ["reponse", "Réponse secrète", user.hasReponse],
      ["interets", "Centres d’intérêt", user.interets?.length],
      ["visibilite", "Visibilité", user.visibilite],
      ["consentement", "Consentement", user.consentement],
    ];

    return checks
      .filter(([, , value]) => !value)
      .map(([key, label]) => ({ key, label }));
  }, [user]);

  const premiumLabel = getPremiumLabel(user);
  const premiumActive = isPremiumActive(user);


  const updateDraft = <K extends keyof LunaUser>(key: K, value: LunaUser[K]) => {
    setDraftUser((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const splitToArray = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  /**
   * Sauvegarde profil.
   *
   * Important :
   * cette route ne doit pas modifier le plan, isPremium ou subscriptionStatus.
   */
  const handleSave = async (): Promise<boolean> => {
    setIsSaving(true);
    setPageError("");

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pseudonyme: draftUser.pseudonyme,
          age: draftUser.age,
          orientation: draftUser.orientation,
          intentions: draftUser.intentions,
          localisation: draftUser.localisation,
          departement: draftUser.departement,
          rayon: draftUser.rayon,
          question: draftUser.question,
          // N'envoyer reponse que si l'utilisatrice a tapé quelque chose.
          // Une chaîne vide ne doit jamais écraser une réponse déjà en BDD.
          ...(draftUser.reponse?.trim() ? { reponse: draftUser.reponse.trim() } : {}),
          interets: draftUser.interets,
          visibilite: draftUser.visibilite,
          consentement: draftUser.consentement,
          hasCompletedProfile: true,
          bio: draftUser.bio,
          image: draftUser.image,
          profession: draftUser.profession || "",
          valeurs: draftUser.valeurs || [],
          modeDeVie: draftUser.modeDeVie || "",
          langues: draftUser.langues || [],
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setPageError(data?.error || "Impossible de sauvegarder.");
        return false;
      }

      const updated = normalizeUser(
        {
          ...user,
          ...data.user,
          ...(data.premium || {}),
        },
        session?.user
      );

      setUser(updated);
      setDraftUser(updated);
      setIsEditing(false);
      return true;
    } catch {
      setPageError("Erreur de connexion au serveur.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftUser(user);
    setIsEditing(false);
  };

  /**
   * Après un envoi ou une suppression de photo / vidéo : on recharge le
   * profil sans écraser les modifications en cours du brouillon.
   */
  const refreshMedia = useCallback(async () => {
    try {
      const res = await fetch("/api/users/profile", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return;
      const fresh = normalizeUser({ ...data.user, ...(data.premium || {}) }, session?.user);
      setUser(fresh);
      setDraftUser((prev) => ({
        ...prev,
        image: fresh.image,
        photos: fresh.photos,
        videos: fresh.videos,
        photoVerified: fresh.photoVerified,
        photoVerificationStatus: fresh.photoVerificationStatus,
      }));
    } catch {
      /* le prochain chargement corrigera l'affichage */
    }
  }, [session?.user]);

  /**
   * Changement rapide de visibilité.
   *
   * Correction :
   * on utilise /api/users/profile directement,
   * car /api/users/visibility n'est pas forcément présent dans ton projet.
   */
  const handleVisibilityChange = async (visibilite: ProfileVisibility) => {
    setPageError("");

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visibilite }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setPageError(data?.error ?? "Impossible de changer la visibilité.");
        return;
      }

      const updated = normalizeUser(
        {
          ...user,
          ...data.user,
          ...(data.premium || {}),
        },
        session?.user
      );

      setUser(updated);
      setDraftUser(updated);
    } catch {
      setPageError("Erreur de connexion.");
    }
  };

  /**
   * Navigation entre les sections du compte (sidebar, menus, cartes).
   * L'URL reste synchronisée : /mon-compte?tab=premium est partageable.
   */
  const navigateTab = (tab: TabId) => {
    if (isEditing) handleCancel();
    setActiveTab(tab);
    setMenuOpen(false);
    router.replace(tab === "dashboard" ? "/mon-compte" : `/mon-compte?tab=${tab}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Bloque le scroll de la page quand le tiroir mobile est ouvert. */
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  if (status === "loading" || isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-xl" />

            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur">
              <Moon className="h-10 w-10 text-purple-200" />
            </div>
          </div>

          <p className="text-sm text-white/60">
            Chargement de votre espace Luna…
          </p>
        </motion.div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#150a2e] text-white">
      {/* Fond : dégradé nuit + halos */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] via-[#220e4d] to-[#2d1b69]" />
        <div className="absolute -top-40 left-1/3 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      {/* Sidebar desktop */}
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[284px] border-r border-violet-300/10 bg-[#140828]/70 backdrop-blur-2xl lg:block">
        <DashboardSidebar
          user={user}
          activeTab={activeTab}
          onNavigate={navigateTab}
          data={dashboardData}
          interactionsBadge={notifs.newMatches + notifs.newVisits}
          premiumActive={premiumActive}
        />
      </div>

      {/* Tiroir mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[86vw] max-w-[300px] border-r border-violet-300/10 bg-[#140828] lg:hidden"
            >
              <DashboardSidebar
                user={user}
                activeTab={activeTab}
                onNavigate={navigateTab}
                data={dashboardData}
                interactionsBadge={notifs.newMatches + notifs.newVisits}
                premiumActive={premiumActive}
                onClose={() => setMenuOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="relative z-10 lg:pl-[284px]">
        <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-4 sm:px-6 sm:pt-6 lg:px-8">
          <DashboardTopbar
            user={user}
            notifs={notifs}
            messagesHref={
              dashboardData?.counts.firstUnreadMatchId
                ? `/messages/${dashboardData.counts.firstUnreadMatchId}`
                : "/messages"
            }
            onMarkNotificationsSeen={markNotificationsSeen}
            onNavigateTab={navigateTab}
            onLogout={handleLogout}
            onOpenMenu={() => setMenuOpen(true)}
          />

          {/* Paiement success */}
          <AnimatePresence>
            {paymentSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-5 flex items-start gap-3 rounded-2xl border border-green-400/30 bg-green-500/15 px-4 py-3 sm:px-5 sm:py-4"
              >
                <span className="text-2xl">🎉</span>

                <div>
                  <p className="text-sm font-bold text-green-100 sm:text-base">
                    Paiement reçu, vérification de l’abonnement en cours.
                  </p>

                  <p className="text-xs text-green-200/80 sm:text-sm">
                    L’accès Premium sera confirmé dès que Stripe aura validé le
                    paiement via webhook.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Erreur globale */}
          <AnimatePresence>
            {pageError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 overflow-hidden"
              >
                <div className="flex items-center gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />

                  <span className="flex-1">{pageError}</span>

                  <button
                    type="button"
                    onClick={() => setPageError("")}
                    aria-label="Fermer l'erreur"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contenu */}
          <div className="mt-5 lg:mt-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={tabContentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {activeTab === "dashboard" ? (
                  <DashboardHome
                    user={user}
                    profileCompletion={profileCompletion}
                    missingFields={missingFields}
                    data={dashboardData}
                    isLoading={isDashboardLoading}
                    error={dashboardError}
                    onRefresh={refreshDashboard}
                    onNavigateTab={navigateTab}
                  />
                ) : activeTab === "profil" ? (
                  <ProfileEditor
                    user={draftUser}
                    savedUser={user}
                    updateDraft={(key, value) => updateDraft(key as keyof LunaUser, value as never)}
                    onMediaChange={refreshMedia}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onHome={() => navigateTab("dashboard")}
                    isSaving={isSaving}
                    error={pageError}
                    completion={profileCompletion}
                  />
                ) : activeTab === "preferences" ? (
                  <PreferencesPanel
                    user={draftUser}
                    savedUser={user}
                    updateDraft={(key, value) => updateDraft(key as keyof LunaUser, value as never)}
                    canGhost={premiumActive && (user.plan === "premium-monthly" || user.plan === "elite-monthly")}
                    onGhostChange={handleVisibilityChange}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onHome={() => navigateTab("dashboard")}
                    isSaving={isSaving}
                    error={pageError}
                  />
                ) : activeTab === "premium" ? (
                  <PremiumPanel user={user} active={premiumActive} onChanged={fetchProfile} onHome={() => navigateTab("dashboard")} />
                ) : activeTab === "securite" ? (
                  <SecurityPanel user={user} onHome={() => navigateTab("dashboard")} onOpenTab={navigateTab} />
                ) : (
                  <InteractionsPanel
                    canSeeVisitors={premiumActive && (user.plan === "premium-monthly" || user.plan === "elite-monthly")}
                    profileImage={user.image}
                    onHome={() => navigateTab("dashboard")}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(200%);
          }
        }

        @keyframes notif-glow {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(236, 72, 153, 0);
            border-color: rgba(244, 114, 182, 0.4);
          }

          50% {
            box-shadow: 0 0 14px 2px rgba(236, 72, 153, 0.55);
            border-color: rgba(244, 114, 182, 0.9);
          }
        }

        .animate-notif-glow {
          animation: notif-glow 1.8s ease-in-out infinite;
        }

        @keyframes msg-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(168, 85, 247, 0);
            transform: scale(1);
          }

          50% {
            box-shadow: 0 0 12px 1px rgba(168, 85, 247, 0.6);
            transform: scale(1.04);
          }
        }

        .animate-msg-pulse {
          animation: msg-pulse 1.4s ease-in-out infinite;
        }

        .input-luna {
          width: 100%;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: white;
          font-size: 0.875rem;
          transition:
            border-color 0.15s,
            background 0.15s;
          outline: none;
        }

        .input-luna:focus {
          border-color: rgba(167, 139, 250, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }

        .input-luna:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .input-luna option {
          background: #1a0b2e;
          color: white;
        }

        @media (max-width: 420px) {
          .input-luna {
            padding: 0.55rem 0.75rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </main>
  );
}

// ─────────────────────────────────────────────
// Composant : ProgressRing
// ─────────────────────────────────────────────

function ProgressRing({
  completion,
  size,
  children,
}: {
  completion: number;
  size: number;
  children: ReactNode;
}) {
  const strokeWidth = 4;
  const r = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (completion / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0">
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />

        <circle
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="url(#ring-grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>

      <div className="absolute" style={{ inset: strokeWidth + 2 }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CooldownInfo — message de cooldown annuel
// ─────────────────────────────────────────────

function CooldownInfo({ changedAt }: { changedAt?: string | null }) {
  if (!changedAt) return null;

  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const lastChanged = new Date(changedAt).getTime();

  if (Number.isNaN(lastChanged) || Date.now() - lastChanged >= ONE_YEAR_MS) {
    return null;
  }

  const nextAllowed = new Date(lastChanged + ONE_YEAR_MS);
  const formatted = nextAllowed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-400/80">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      Modifiable une fois par an · prochain changement le {formatted}
    </p>
  );
}

// ─────────────────────────────────────────────
// Field wrapper
// ─────────────────────────────────────────────

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/50">
        {label}
      </span>

      {children}
    </label>
  );
}

// ─────────────────────────────────────────────
// Export page
// ─────────────────────────────────────────────

export default function MonComptePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] px-4 text-white">
          <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
        </div>
      }
    >
      <MonCompteContent />
    </Suspense>
  );
}