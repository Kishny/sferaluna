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

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AuthProvider = "credentials" | "google" | "facebook" | "apple";
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

  // Auth
  password?: string;
  provider?: AuthProvider;

  // Profil
  bio?: string;
  age?: number;
  orientation?: string;
  intentions: string[];
  localisation?: string;
  rayon?: string;
  question?: string;
  reponse?: string;
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

  // Sécurité
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
  image?: string;
  interets?: string[];
}

interface MatchItem {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
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
  provider: "credentials",

  age: 28,
  bio: "",
  orientation: "",
  intentions: [],
  localisation: "",
  rayon: "10 km",
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
  { id: "preferences", label: "Préférences", emoji: "💫", icon: Heart },
  { id: "premium", label: "Premium", emoji: "👑", icon: Crown },
  { id: "securite", label: "Sécurité", emoji: "🔒", icon: Shield },
  { id: "connexions", label: "Connexions", emoji: "💞", icon: Heart },
];

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

    provider: rawUser?.provider || "credentials",

    bio: rawUser?.bio || "",
    age: typeof rawUser?.age === "number" ? rawUser.age : 28,
    orientation: rawUser?.orientation || "",
    intentions: Array.isArray(rawUser?.intentions) ? rawUser.intentions : [],
    localisation: rawUser?.localisation || "",
    rayon: rawUser?.rayon || "10 km",
    question: rawUser?.question || "",
    reponse: rawUser?.reponse || "",
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

    lastLoginAt: rawUser?.lastLoginAt || null,

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
   * Redirection si non connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

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
       * Marque les notifications comme lues à l'ouverture de Mon Compte.
       * On ignore l'erreur pour ne pas bloquer la page.
       */
      fetch("/api/notifications", { method: "POST" }).catch(() => {});
    }
  }, [status, fetchProfile]);

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
      user.reponse,
      user.interets?.length,
      user.visibilite,
      user.consentement,
    ];

    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  const premiumLabel = getPremiumLabel(user);
  const premiumActive = isPremiumActive(user);

  const isTabEditable = activeTab === "profil" || activeTab === "preferences";

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
  const handleSave = async () => {
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
          rayon: draftUser.rayon,
          question: draftUser.question,
          reponse: draftUser.reponse,
          interets: draftUser.interets,
          visibilite: draftUser.visibilite,
          consentement: draftUser.consentement,
          hasCompletedProfile: true,

          /**
           * Si ton API /api/users/profile accepte bio et image plus tard,
           * ces champs seront déjà envoyés.
           * Si l'API ne les accepte pas encore, Zod les ignorera sauf si ton
           * schéma est strict().
           */
          bio: draftUser.bio,
          image: draftUser.image,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setPageError(data?.error || "Impossible de sauvegarder.");
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
      setIsEditing(false);
    } catch {
      setPageError("Erreur de connexion au serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftUser(user);
    setIsEditing(false);
  };

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
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      {/* Orbs décoratifs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute top-1/2 -right-32 h-80 w-80 rounded-full bg-pink-600/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-600/15 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-3 pb-12 pt-4 sm:px-4 sm:pb-16 sm:pt-6">
        {/* Nav top */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between gap-2 sm:mb-6"
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 transition-all duration-200 hover:border-purple-400/40 hover:bg-white/10 sm:px-3"
          >
            <img
              src="/logo-sferaluna.png"
              alt="SferaLuna"
              className="h-6 w-6 shrink-0 rounded-full object-cover"
            />

            <span className="truncate text-xs font-semibold text-white transition-colors group-hover:text-purple-200 sm:text-sm">
              SferaLuna
            </span>

            <ArrowLeft className="hidden h-3.5 w-3.5 text-white/40 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:text-purple-300 sm:block" />
          </button>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {user.role === "admin" && (
              <button
                type="button"
                onClick={() => router.push("/admin")}
                className="flex items-center gap-1 rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-2 py-1.5 text-[11px] font-semibold text-yellow-200 transition hover:bg-yellow-400/20 sm:gap-1.5 sm:px-3 sm:text-xs"
              >
                <Star className="h-3.5 w-3.5" />
                <span className="hidden min-[380px]:inline">Admin</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white sm:gap-2 sm:px-3 sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden min-[380px]:inline">Déconnexion</span>
            </button>
          </div>
        </motion.div>

        {/* Paiement success */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-4 flex items-start gap-3 rounded-2xl border border-green-400/30 bg-green-500/15 px-4 py-3 sm:mb-5 sm:px-5 sm:py-4"
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
              className="mb-4 overflow-hidden sm:mb-5"
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

        {/* Hero profil */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-4 overflow-hidden rounded-3xl border border-white/10 bg-white/8 backdrop-blur-xl sm:mb-6"
        >
          <div className="relative h-20 bg-gradient-to-r from-purple-600/50 via-pink-500/40 to-purple-800/50 sm:h-24">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
          </div>

          <div className="px-4 pb-5 sm:px-6 sm:pb-6">
            <div className="-mt-9 flex flex-col gap-4 sm:-mt-10 sm:flex-row sm:items-end">
              <div className="relative mx-auto shrink-0 sm:mx-0">
                <ProgressRing completion={profileCompletion} size={88}>
                  <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-[#1a0b2e] bg-[#1a0b2e]">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.pseudonyme}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl">
                        {user.pseudonyme.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </ProgressRing>

                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#1a0b2e] bg-green-400">
                  <span className="text-[8px] font-bold text-green-900">
                    {profileCompletion}%
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
                <div className="mb-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="max-w-full truncate text-xl font-bold">
                    {user.pseudonyme}
                  </h1>

                  {premiumActive ? (
                    <span className="relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-yellow-400/30 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-yellow-200">
                      <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      {planEmoji[user.plan]} {premiumLabel}
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-xs text-white/60">
                      🌙 Gratuit
                    </span>
                  )}
                </div>

                <p className="truncate text-sm text-white/50">{user.email}</p>

                {user.localisation && (
                  <p className="mt-0.5 flex items-center justify-center gap-1 text-xs text-white/40 sm:justify-start">
                    <MapPin className="h-3 w-3" />
                    {user.localisation}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/8 bg-white/5 p-3 text-center sm:flex sm:shrink-0 sm:gap-4 sm:border-0 sm:bg-transparent sm:p-0 sm:pb-1 sm:text-right">
                <div>
                  <p className="text-base font-bold sm:text-lg">
                    {user.age ?? "—"}
                  </p>
                  <p className="text-[11px] text-white/40 sm:text-xs">ans</p>
                </div>

                <div>
                  <p className="text-base font-bold sm:text-lg">
                    {user.interets?.length ?? 0}
                  </p>
                  <p className="text-[11px] text-white/40 sm:text-xs">
                    intérêts
                  </p>
                </div>

                <div>
                  <p className="text-base font-bold sm:text-lg">
                    {profileCompletion}%
                  </p>
                  <p className="text-[11px] text-white/40 sm:text-xs">profil</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs mobile-first */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="scrollbar-none sticky top-0 z-20 -mx-3 mb-4 flex gap-1.5 overflow-x-auto border-y border-white/5 bg-[#1a0b2e]/70 px-3 py-2 backdrop-blur-xl sm:static sm:mx-0 sm:mb-6 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (isEditing) handleCancel();
              }}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all sm:px-4 sm:text-sm ${
                activeTab === tab.id
                  ? "border border-purple-400/40 bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-white shadow-lg"
                  : "border border-white/8 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>

              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="pointer-events-none absolute inset-0 rounded-xl border border-purple-400/40"
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* Contenu onglets */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-xl sm:p-6 md:p-8">
              {activeTab === "dashboard" && (
                <DashboardTab
                  user={user}
                  profileCompletion={profileCompletion}
                  router={router}
                />
              )}

              {activeTab === "profil" && (
                <ProfilTab
                  user={draftUser}
                  isEditing={isEditing}
                  updateDraft={updateDraft}
                  splitToArray={splitToArray}
                />
              )}

              {activeTab === "preferences" && (
                <PreferencesTab
                  user={draftUser}
                  isEditing={isEditing}
                  updateDraft={updateDraft}
                  splitToArray={splitToArray}
                  onVisibilityChange={handleVisibilityChange}
                />
              )}

              {activeTab === "premium" && (
                <PremiumTab user={user} router={router} />
              )}

              {activeTab === "securite" && <SecurityTab user={user} />}

              {activeTab === "connexions" && <ConnexionsTab user={user} />}

              {isTabEditable && (
                <div className="mt-6 flex flex-col justify-end gap-3 border-t border-white/8 pt-5 sm:mt-8 sm:flex-row sm:pt-6">
                  {!isEditing ? (
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsEditing(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 sm:w-auto"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier le profil ✏️
                    </motion.button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/10 disabled:opacity-50 sm:w-auto"
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </button>

                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}

                        {isSaving ? "Sauvegarde…" : "Sauvegarder ✅"}
                      </motion.button>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
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
// Onglet Dashboard
// ─────────────────────────────────────────────

function DashboardTab({
  user,
  profileCompletion,
  router,
}: {
  user: LunaUser;
  profileCompletion: number;
  router: ReturnType<typeof useRouter>;
}) {
  const active = isPremiumActive(user);
  const planLabel = getPremiumLabel(user);

  const statCards = [
    {
      emoji: "📊",
      label: "Profil complété",
      value: `${profileCompletion}%`,
      color: "from-purple-500/20 to-pink-500/20",
      border: "border-purple-400/20",
    },
    {
      emoji: "✅",
      label: "Compte",
      value: user.hasCompletedProfile ? "Validé" : "À compléter",
      color: "from-green-500/15 to-emerald-500/15",
      border: "border-green-400/20",
    },
    {
      emoji: planEmoji[user.plan],
      label: "Plan actuel",
      value: planLabel,
      color: "from-yellow-500/15 to-amber-500/15",
      border: "border-yellow-400/20",
    },
    {
      emoji: "💳",
      label: "Abonnement",
      value: subscriptionLabels[user.subscriptionStatus] || "Inactif",
      color: "from-blue-500/15 to-indigo-500/15",
      border: "border-blue-400/20",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold sm:text-xl">
          Bonjour{" "}
          <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            {user.pseudonyme}
          </span>{" "}
          👋
        </h2>

        <p className="text-sm text-white/50">
          Voici un aperçu de votre espace SferaLuna.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-3 sm:p-4`}
          >
            <p className="mb-1 text-xl">{card.emoji}</p>

            <p className="mb-0.5 text-[11px] text-white/50 sm:text-xs">
              {card.label}
            </p>

            <p className="truncate text-sm font-bold">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="text-sm font-semibold">Complétion du profil</span>
          </div>

          <span className="text-sm font-bold text-purple-300">
            {profileCompletion}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${profileCompletion}%` }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
          />
        </div>

        {profileCompletion < 100 && (
          <p className="mt-2 text-xs text-white/40">
            Complétez votre profil pour apparaître dans plus de recherches 🚀
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {[
          {
            emoji: "📍",
            label: "Localisation",
            value: user.localisation || "—",
          },
          {
            emoji: "💞",
            label: "Intentions",
            value:
              (user.intentions || [])
                .map((item) => intentionLabels[item] || item)
                .join(", ") || "—",
          },
          {
            emoji: "👁️",
            label: "Visibilité",
            value: visibilityLabels[user.visibilite] || user.visibilite,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/8 bg-white/5 p-3 text-center"
          >
            <p className="mb-1 text-xl">{item.emoji}</p>
            <p className="mb-0.5 text-[10px] text-white/40">{item.label}</p>
            <p className="truncate text-xs font-medium leading-tight">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          active
            ? "border-green-400/20 bg-green-500/10"
            : "border-yellow-400/20 bg-yellow-400/8"
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p
              className={`mb-1 font-bold ${
                active ? "text-green-100" : "text-yellow-100"
              }`}
            >
              {active
                ? `🎉 Plan ${getPremiumLabel(user)} actif !`
                : "🌟 Passez Premium"}
            </p>

            <p className="text-sm text-white/60">
              {active
                ? "Vous profitez des fonctionnalités incluses dans votre abonnement."
                : "Débloquez les likes illimités, le mode invisible et bien plus."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/paiement")}
            className={`flex w-full shrink-0 items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto ${
              active
                ? "bg-gradient-to-r from-green-600 to-emerald-600"
                : "bg-gradient-to-r from-yellow-500 to-orange-500"
            }`}
          >
            {active ? "Gérer" : "Voir les offres"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Onglet Profil
// ─────────────────────────────────────────────

function ProfilTab({
  user,
  isEditing,
  updateDraft,
  splitToArray,
}: {
  user: LunaUser;
  isEditing: boolean;
  updateDraft: <K extends keyof LunaUser>(key: K, value: LunaUser[K]) => void;
  splitToArray: (value: string) => string[];
}) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const preview = URL.createObjectURL(file);

    setAvatarPreview(preview);
    setUploadMsg(null);
    setIsUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setUploadMsg({
          type: "error",
          text: data?.error ?? "Erreur lors de l'upload.",
        });

        setAvatarPreview(null);
        return;
      }

      updateDraft("image", data.imageUrl);
      setUploadMsg({
        type: "success",
        text: "Photo mise à jour avec succès !",
      });
    } catch {
      setUploadMsg({
        type: "error",
        text: "Erreur de connexion au serveur.",
      });

      setAvatarPreview(null);
    } finally {
      setIsUploading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const displayImage = avatarPreview || user.image || null;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold sm:text-xl">✨ Mon profil</h2>

        <p className="text-sm text-white/50">
          {isEditing
            ? "Mode édition — modifiez vos informations ci-dessous."
            : 'Cliquez sur "Modifier" pour éditer votre profil.'}
        </p>
      </div>

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-start gap-2 rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200"
        >
          <Pencil className="mt-0.5 h-4 w-4 shrink-0" />
          Mode édition activé — vos modifications ne seront pas enregistrées
          avant la sauvegarde.
        </motion.div>
      )}

      <div className="flex flex-col items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-3xl font-bold">
          {displayImage ? (
            <img
              src={displayImage}
              alt={user.pseudonyme}
              className="h-full w-full object-cover"
            />
          ) : (
            user.pseudonyme.charAt(0).toUpperCase()
          )}

          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-sm font-medium text-white">
            Photo de profil
          </p>

          <p className="mb-3 text-xs text-white/40">
            JPG, PNG ou WebP · max 5 Mo · recadrée en 400×400
          </p>

          {uploadMsg && (
            <p
              className={`mb-2 text-xs ${
                uploadMsg.type === "success" ? "text-green-400" : "text-red-400"
              }`}
            >
              {uploadMsg.text}
            </p>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="rounded-lg border border-purple-400/30 bg-purple-500/30 px-4 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-500/40 disabled:opacity-50"
          >
            {isUploading ? "Upload en cours…" : "Changer la photo"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>
      </div>

      <Field label="Bio ✨" className="mb-4">
        <textarea
          disabled={!isEditing}
          value={user.bio || ""}
          onChange={(event) => updateDraft("bio", event.target.value)}
          className="input-luna h-24 resize-none"
          placeholder="Décrivez-vous en quelques mots… vos passions, ce que vous recherchez…"
          maxLength={500}
        />

        <p className="mt-1 text-right text-xs text-white/30">
          {(user.bio || "").length}/500
        </p>
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Pseudonyme 🌸">
          <input
            disabled={!isEditing}
            value={user.pseudonyme || ""}
            onChange={(event) => updateDraft("pseudonyme", event.target.value)}
            className="input-luna"
          />
        </Field>

        <Field label="Email 📧">
          <input disabled value={user.email || ""} className="input-luna" />
        </Field>

        <Field label="Âge 🎂">
          <input
            disabled={!isEditing}
            type="number"
            min={18}
            max={99}
            value={user.age || 28}
            onChange={(event) => updateDraft("age", Number(event.target.value))}
            className="input-luna"
          />
        </Field>

        <Field label="Localisation 📍">
          <input
            disabled={!isEditing}
            value={user.localisation || ""}
            onChange={(event) => updateDraft("localisation", event.target.value)}
            className="input-luna"
            placeholder="Paris, Lyon…"
          />
        </Field>

        <Field label="Rayon de recherche 🗺️">
          <select
            disabled={!isEditing}
            value={user.rayon || "10 km"}
            onChange={(event) => updateDraft("rayon", event.target.value)}
            className="input-luna"
          >
            {["5 km", "10 km", "25 km", "50 km", "100 km", "region", "france"].map(
              (value) => (
                <option key={value} value={value}>
                  {value === "region"
                    ? "Toute la région"
                    : value === "france"
                      ? "Toute la France"
                      : value}
                </option>
              )
            )}
          </select>
        </Field>

        <Field label="Centres d'intérêt 🎯">
          <input
            disabled={!isEditing}
            value={(user.interets || []).join(", ")}
            onChange={(event) =>
              updateDraft("interets", splitToArray(event.target.value))
            }
            className="input-luna"
            placeholder="voyage, musique, sport…"
          />
        </Field>

        <Field label="Question de sécurité 🔑" className="sm:col-span-2">
          <input
            disabled={!isEditing}
            value={user.question || ""}
            onChange={(event) => updateDraft("question", event.target.value)}
            className="input-luna"
            placeholder="Votre question secrète"
          />
        </Field>

        <Field label="Réponse secrète 🤫" className="sm:col-span-2">
          <input
            disabled={!isEditing}
            type="text"
            value={user.reponse || ""}
            onChange={(event) => updateDraft("reponse", event.target.value)}
            className="input-luna"
            placeholder="Votre réponse secrète"
          />
        </Field>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Onglet Préférences
// ─────────────────────────────────────────────

function PreferencesTab({
  user,
  isEditing,
  updateDraft,
  splitToArray,
  onVisibilityChange,
}: {
  user: LunaUser;
  isEditing: boolean;
  updateDraft: <K extends keyof LunaUser>(key: K, value: LunaUser[K]) => void;
  splitToArray: (value: string) => string[];
  onVisibilityChange: (value: ProfileVisibility) => Promise<void>;
}) {
  const [togglingInvisible, setTogglingInvisible] = useState(false);

  const isInvisible = user.visibilite === "invisible";
  const premiumActive = isPremiumActive(user);

  const handleToggleInvisible = async () => {
    if (!premiumActive || togglingInvisible) return;

    setTogglingInvisible(true);

    try {
      await onVisibilityChange(isInvisible ? "public" : "invisible");
    } finally {
      setTogglingInvisible(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold sm:text-xl">💫 Préférences</h2>

        <p className="text-sm text-white/50">
          Gérez vos intentions, orientation et visibilité.
        </p>
      </div>

      <motion.div
        animate={{
          borderColor: isInvisible
            ? "rgba(167,139,250,0.4)"
            : "rgba(255,255,255,0.1)",
        }}
        className={`rounded-2xl border p-4 ${
          isInvisible
            ? "border-purple-400/30 bg-purple-500/10"
            : "border-white/10 bg-white/5"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-2xl">👻</span>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold">Mode invisible</p>

                {!premiumActive && (
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/15 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                    👑 Premium actif requis
                  </span>
                )}

                {isInvisible && premiumActive && (
                  <span className="animate-pulse rounded-full border border-purple-400/20 bg-purple-400/15 px-2 py-0.5 text-[10px] font-bold text-purple-300">
                    Actif
                  </span>
                )}
              </div>

              <p className="mt-0.5 text-xs text-white/50">
                {isInvisible
                  ? "Votre profil est invisible dans les recherches."
                  : "Naviguez discrètement sans apparaître aux autres."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleInvisible}
            disabled={togglingInvisible || !premiumActive}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isInvisible ? "bg-purple-500" : "bg-white/20"
            }`}
            aria-label="Activer ou désactiver le mode invisible"
          >
            <motion.span
              animate={{ x: isInvisible ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md"
            />

            {togglingInvisible && (
              <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-purple-200" />
            )}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Orientation 💜">
          <select
            disabled={!isEditing}
            value={user.orientation || ""}
            onChange={(event) => updateDraft("orientation", event.target.value)}
            className="input-luna"
          >
            <option value="">Sélectionner</option>

            {Object.entries(orientationLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Intentions 💞">
          <input
            disabled={!isEditing}
            value={(user.intentions || [])
              .map((item) => intentionLabels[item] || item)
              .join(", ")}
            onChange={(event) =>
              updateDraft(
                "intentions",
                splitToArray(event.target.value).map((value) => {
                  const found = Object.entries(intentionLabels).find(
                    ([, label]) => label === value.trim()
                  );

                  return found ? found[0] : value.trim();
                })
              )
            }
            className="input-luna"
            placeholder="rencontre-serieuse, amitie…"
          />
        </Field>

        <Field label="Visibilité du profil 👁️">
          <select
            disabled={!isEditing}
            value={user.visibilite || "matches"}
            onChange={(event) =>
              updateDraft("visibilite", event.target.value as ProfileVisibility)
            }
            className="input-luna"
          >
            {Object.entries(visibilityLabels).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Onglet Premium
// ─────────────────────────────────────────────

function PremiumTab({
  user,
  router,
}: {
  user: LunaUser;
  router: ReturnType<typeof useRouter>;
}) {
  const active = isPremiumActive(user);
  const planLabel = getPremiumLabel(user);

  const hasSelectedPaidPlan = user.plan !== "free";

  const featuresByPlan: Record<LunaPlan, string[]> = {
    free: ["🌙 Profil public", "💌 5 likes / jour"],
    "essential-monthly": [
      "⭐ 50 likes / jour",
      "📊 Voir ses visiteurs",
      "🔍 Filtres avancés",
    ],
    "premium-monthly": [
      "💎 Likes illimités",
      "👻 Mode invisible",
      "📩 Messages prioritaires",
      "🔔 Alertes matches",
      "📈 Statistiques",
    ],
    "elite-monthly": [
      "👑 Toutes les fonctionnalités",
      "⚡ Boost de profil quotidien",
      "🎯 Filtres ultra-précis",
      "🛡️ Badge VIP",
      "💬 Support prioritaire 24/7",
    ],
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold sm:text-xl">👑 Mon abonnement</h2>

        <p className="text-sm text-white/50">Gérez votre plan SferaLuna.</p>
      </div>

      <div
        className={`rounded-2xl border p-4 sm:p-5 ${
          active
            ? "border-green-400/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            : "border-yellow-400/20 bg-gradient-to-br from-yellow-500/8 to-amber-500/8"
        }`}
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="text-3xl">{planEmoji[user.plan]}</span>

          <div>
            <h3 className="text-lg font-bold">{planLabel}</h3>

            <p className="text-sm text-white/60">
              {subscriptionLabels[user.subscriptionStatus] || "—"}
            </p>
          </div>

          {active && (
            <span className="ml-auto flex items-center gap-1 rounded-full border border-green-400/20 bg-green-400/10 px-2.5 py-1 text-xs font-bold text-green-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Actif
            </span>
          )}
        </div>

        {!active && hasSelectedPaidPlan && (
          <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-sm text-yellow-100">
            Offre sélectionnée, mais accès Premium non activé. Finalisez le
            paiement ou attendez la confirmation Stripe.
          </div>
        )}

        <div className="mb-4 space-y-1 text-sm text-white/70">
          {user.premiumStartedAt && (
            <p>📅 Démarré le {formatDate(user.premiumStartedAt)}</p>
          )}

          {user.premiumExpiresAt && (
            <p>⏳ Expire le {formatDate(user.premiumExpiresAt)}</p>
          )}

          {user.lastPaymentAt && (
            <p>💳 Dernier paiement le {formatDate(user.lastPaymentAt)}</p>
          )}

          {user.stripeSubscriptionId && (
            <p className="break-all text-xs text-white/40">
              Abonnement Stripe : {user.stripeSubscriptionId}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/paiement")}
          className={`w-full rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto ${
            active
              ? "bg-gradient-to-r from-green-600 to-emerald-600"
              : "bg-gradient-to-r from-yellow-500 to-orange-500"
          }`}
        >
          {active ? "Changer d’offre" : "🚀 Finaliser le paiement"}
        </button>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-white/60">
          ✨ Fonctionnalités incluses dans votre plan :
        </p>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(featuresByPlan[user.plan] || featuresByPlan.free).map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>

      {user.plan !== "elite-monthly" && (
        <div className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 text-center">
          <p className="mb-1 text-lg">✨ Passez à l&apos;offre Elite</p>

          <p className="mb-4 text-sm text-white/60">
            Accès complet à toutes les fonctionnalités SferaLuna.
          </p>

          <button
            type="button"
            onClick={() => router.push("/paiement")}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Voir les offres 👑
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Onglet Sécurité
// ─────────────────────────────────────────────

function IdentityVerificationBlock({ user }: { user: LunaUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/identity-verification", {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      setError(data?.error || "Une erreur est survenue.");
    } catch {
      setError("Impossible de lancer la vérification.");
    } finally {
      setLoading(false);
    }
  };

  const status = user.identityVerificationStatus || "unverified";

  return (
    <div className="space-y-3 rounded-2xl border border-purple-400/20 bg-purple-500/10 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🪪</span>

        <h3 className="font-semibold text-white">
          Vérification d&apos;identité
        </h3>

        {user.identityVerified && (
          <span className="ml-auto flex items-center gap-1 rounded-full border border-green-400/20 bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
            <CheckCircle2 className="h-3 w-3" />
            Vérifiée
          </span>
        )}
      </div>

      <p className="text-sm text-white/60">
        Vérifiez votre identité avec une pièce d&apos;identité officielle pour
        obtenir le badge &quot;Profil vérifié&quot; sur SferaLuna.
      </p>

      {status === "pending" && (
        <p className="text-sm text-yellow-300/80">⏳ Vérification en cours…</p>
      )}

      {status === "failed" && (
        <p className="text-sm text-red-300/80">
          ❌ Vérification échouée. Réessayez.
        </p>
      )}

      {!user.identityVerified && status !== "pending" && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Chargement…" : "Vérifier mon identité"}
        </button>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}

function SecurityTab({ user }: { user: LunaUser }) {
  const checks = [
    { ok: !!user.email, label: "Adresse email enregistrée", emoji: "📧" },
    {
      ok: user.provider === "google" || !!user.question,
      label: "Question de sécurité définie",
      emoji: "🔑",
    },
    ...(user.provider === "google"
      ? [
          {
            ok: true,
            label: "Connexion Google sécurisée (OAuth)",
            emoji: "🔐",
          },
        ]
      : []),
    {
      ok: !!user.stripeCustomerId,
      label: "Compte Stripe enregistré",
      emoji: "💳",
    },
    { ok: user.hasCompletedProfile, label: "Profil complété", emoji: "✅" },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h2 className="mb-1 text-lg font-bold sm:text-xl">
          🔒 Sécurité du compte
        </h2>

        <p className="text-sm text-white/50">
          État de sécurité de votre espace SferaLuna.
        </p>
      </div>

      <div className="space-y-2">
        {checks.map((check, index) => (
          <motion.div
            key={check.label}
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
              check.ok
                ? "border-green-400/20 bg-green-500/8"
                : "border-white/10 bg-white/5"
            }`}
          >
            <span className="text-base">{check.emoji}</span>

            <span className={check.ok ? "text-white" : "text-white/50"}>
              {check.label}
            </span>

            <span className="ml-auto">
              {check.ok ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <X className="h-4 w-4 text-white/30" />
              )}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <p className="mb-1 text-xs text-white/40">
          Provider d&apos;authentification
        </p>

        <p className="font-semibold capitalize">
          {user.provider || "credentials"}
        </p>

        <p className="mb-1 mt-3 text-xs text-white/40">Membre depuis</p>
        <p className="font-semibold">{formatDate(user.createdAt)}</p>

        {user.lastLoginAt && (
          <>
            <p className="mb-1 mt-3 text-xs text-white/40">
              Dernière connexion
            </p>
            <p className="font-semibold">{formatDate(user.lastLoginAt)}</p>
          </>
        )}
      </div>

      <IdentityVerificationBlock user={user} />

      {user.provider === "credentials" && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          Votre mot de passe est stocké de manière sécurisée et chiffré
          avec bcrypt.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Onglet Connexions
// ─────────────────────────────────────────────

function ConnexionsTab({ user }: { user: LunaUser }) {
  const [reportUserId, setReportUserId] = useState<string | null>(null);

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);

  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingVisitors, setLoadingVisitors] = useState(true);

  const [activeSection, setActiveSection] = useState<"matches" | "visiteurs">(
    "matches"
  );

  const premiumActive = isPremiumActive(user);

  useEffect(() => {
    setLoadingMatches(true);

    fetch("/api/matches", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMatches(data.matches ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, []);

  useEffect(() => {
    if (!premiumActive) {
      setLoadingVisitors(false);
      setVisitors([]);
      return;
    }

    setLoadingVisitors(true);

    fetch("/api/visitors", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setVisitors(data.visitors ?? []);
      })
      .catch(() => {})
      .finally(() => setLoadingVisitors(false));
  }, [premiumActive]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-1 text-lg font-bold sm:text-xl">💞 Connexions</h2>

          <p className="text-sm text-white/50">
            Vos matches et visiteurs en un coup d&apos;œil.
          </p>
        </div>

        <Link
          href="/explorer"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-purple-400/20 bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-3 py-2 text-xs font-medium text-purple-200 transition hover:opacity-80 sm:w-auto sm:py-1.5"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Explorer
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setActiveSection("matches")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            activeSection === "matches"
              ? "border-pink-400/40 bg-pink-500/15"
              : "border-white/10 bg-white/5 hover:bg-white/8"
          }`}
        >
          <div className="mb-1 flex items-center gap-2">
            <Heart
              className={`h-4 w-4 ${
                activeSection === "matches" ? "text-pink-300" : "text-white/40"
              }`}
            />

            <span className="text-xs font-medium text-white/50">Matches</span>
          </div>

          {loadingMatches ? (
            <Loader2 className="h-5 w-5 animate-spin text-pink-300" />
          ) : (
            <p
              className={`text-2xl font-bold ${
                activeSection === "matches" ? "text-pink-200" : "text-white"
              }`}
            >
              {matches.length}
            </p>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection("visiteurs")}
          className={`rounded-2xl border p-4 text-left transition-all ${
            activeSection === "visiteurs"
              ? "border-purple-400/40 bg-purple-500/15"
              : "border-white/10 bg-white/5 hover:bg-white/8"
          }`}
        >
          <div className="mb-1 flex items-center gap-2">
            <Eye
              className={`h-4 w-4 ${
                activeSection === "visiteurs"
                  ? "text-purple-300"
                  : "text-white/40"
              }`}
            />

            <span className="text-xs font-medium text-white/50">Visiteurs</span>

            {!premiumActive && <Lock className="ml-auto h-3 w-3 text-white/30" />}
          </div>

          {loadingVisitors ? (
            <Loader2 className="h-5 w-5 animate-spin text-purple-300" />
          ) : premiumActive ? (
            <p
              className={`text-2xl font-bold ${
                activeSection === "visiteurs" ? "text-purple-200" : "text-white"
              }`}
            >
              {visitors.length}
            </p>
          ) : (
            <p className="text-2xl font-bold text-white/30">—</p>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "matches" && (
          <motion.div
            key="matches"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {loadingMatches ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-pink-300" />
              </div>
            ) : matches.length === 0 ? (
              <div className="space-y-3 py-10 text-center">
                <p className="text-4xl">💫</p>

                <p className="text-sm text-white/50">Pas encore de matches.</p>

                <Link
                  href="/explorer"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Heart className="h-4 w-4" />
                  Découvrir des profils
                </Link>
              </div>
            ) : (
              matches.map((match, index) => {
                const matchedUser = match.user;

                if (!matchedUser) return null;

                return (
                  <motion.div
                    key={match.matchId}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:bg-white/8 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <div className="flex items-center gap-3 sm:flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-lg font-bold">
                        {matchedUser.image ? (
                          <img
                            src={matchedUser.image}
                            alt={matchedUser.pseudonyme}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          matchedUser.pseudonyme.charAt(0).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {matchedUser.pseudonyme}
                          {matchedUser.age ? (
                            <span className="text-white/50">
                              , {matchedUser.age} ans
                            </span>
                          ) : (
                            ""
                          )}
                        </p>

                        {matchedUser.localisation && (
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
                            <MapPin className="h-3 w-3" />
                            {matchedUser.localisation}
                          </p>
                        )}

                        {match.lastMessageAt && (
                          <p className="mt-0.5 text-xs text-purple-300/70">
                            💬 {relativeTime(match.lastMessageAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-col sm:items-end">
                      <p className="text-xs text-white/30">
                        {relativeTime(match.createdAt)}
                      </p>

                      <Link
                        href={`/messages/${match.matchId}`}
                        className="flex items-center gap-1.5 rounded-xl border border-purple-400/20 bg-purple-500/25 px-3 py-1.5 text-xs font-medium text-purple-200 transition hover:bg-purple-500/40"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Message
                      </Link>

                      <Link
                        href={`/profil/${matchedUser._id}?from=connexions`}
                        className="rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-3 py-1 text-xs font-semibold text-white shadow-md shadow-pink-500/20 transition-all duration-200 hover:scale-105 hover:opacity-90"
                      >
                        Voir ✨
                      </Link>

                      <button
                        type="button"
                        onClick={() => setReportUserId(matchedUser._id)}
                        className="rounded-lg border border-red-400/20 bg-red-500/10 p-1.5 text-red-300 transition hover:bg-red-500/20"
                        title="Signaler"
                        aria-label="Signaler ce profil"
                      >
                        <Flag className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {activeSection === "visiteurs" && (
          <motion.div
            key="visiteurs"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-2.5"
          >
            {!premiumActive ? (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/8 p-6 text-center sm:p-8">
                <p className="mb-4 text-4xl">👑</p>

                <h3 className="mb-2 font-bold text-yellow-100">
                  Fonctionnalité Premium
                </h3>

                <p className="mb-5 text-sm text-white/60">
                  Avec un abonnement actif, découvrez qui visite votre profil en
                  temps réel.
                </p>

                <Link
                  href="/paiement"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Voir les offres
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ) : loadingVisitors ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="py-10 text-center">
                <p className="mb-3 text-4xl">🔍</p>

                <p className="text-sm text-white/50">
                  Personne n&apos;a encore visité votre profil.
                </p>

                <p className="mt-2 text-xs text-white/30">
                  Complétez votre profil pour être plus visible !
                </p>
              </div>
            ) : (
              visitors.map(({ user: visitor, lastVisit, visitCount }, index) => {
                if (!visitor) return null;

                return (
                  <motion.div
                    key={visitor._id ?? index}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 p-4 transition hover:bg-white/8"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold">
                      {visitor.image ? (
                        <img
                          src={visitor.image}
                          alt={visitor.pseudonyme}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        visitor.pseudonyme.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {visitor.pseudonyme}
                        {visitor.age ? (
                          <span className="text-white/50">
                            , {visitor.age} ans
                          </span>
                        ) : (
                          ""
                        )}
                      </p>

                      {visitor.localisation && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
                          <MapPin className="h-3 w-3" />
                          {visitor.localisation}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xs text-white/40">
                        {relativeTime(lastVisit)}
                      </p>

                      {visitCount > 1 && (
                        <p className="mt-0.5 text-xs text-purple-300">
                          🔄 {visitCount} visites
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal
        isOpen={!!reportUserId}
        targetId={reportUserId ?? ""}
        targetType="user"
        onClose={() => setReportUserId(null)}
      />
    </div>
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