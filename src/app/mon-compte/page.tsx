// src/app/mon-compte/page.tsx

"use client";

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
  BadgeCheck,
  Flag,
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
  Users,
  X,
  Zap,
  Bell,
  ChevronRight,
  Star,
} from "lucide-react";
import Link from "next/link";
import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type AuthProvider = "credentials" | "google" | "facebook" | "apple";
type UserRole = "user" | "admin";
type LunaPlan = "free" | "essential-monthly" | "premium-monthly" | "elite-monthly";
type SubscriptionStatus = "inactive" | "active" | "trialing" | "past_due" | "canceled";
type ProfileVisibility = "public" | "matches" | "premium" | "invisible";
type TabId = "dashboard" | "profil" | "preferences" | "premium" | "securite" | "connexions";

interface LunaUser {
  _id?: string;
  id?: string;
  email: string;
  pseudonyme: string;
  name?: string;
  image?: string;
  password?: string;
  provider?: AuthProvider;
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
  hasCompletedProfile: boolean;
  profileCompletedAt?: string | null;
  consentement: boolean;
  role: UserRole;
  plan: LunaPlan;
  subscriptionStatus: SubscriptionStatus;
  isPremium: boolean;
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  lastLoginAt?: string | null;
  lastPaymentAt?: string | null;
  identityVerified?: boolean;
  identityVerificationStatus?: "unverified" | "pending" | "verified" | "failed";
  planLabel?: string;
  subscriptionStatusLabel?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─────────────────────────────────────────────
// Constantes & helpers
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
  lastLoginAt: null,
  lastPaymentAt: null,
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

function isValidPlan(plan: unknown): plan is LunaPlan {
  return plan === "free" || plan === "essential-monthly" || plan === "premium-monthly" || plan === "elite-monthly";
}
function isValidSubscriptionStatus(status: unknown): status is SubscriptionStatus {
  return status === "inactive" || status === "active" || status === "trialing" || status === "past_due" || status === "canceled";
}
function isValidVisibility(value: unknown): value is ProfileVisibility {
  return value === "public" || value === "matches" || value === "premium" || value === "invisible";
}
function getPremiumLabel(user: LunaUser) {
  if (user.plan && user.plan !== "free") return planLabels[user.plan] || "Premium";
  return "Gratuit";
}
function isPremiumActive(user: LunaUser) {
  // Considérer active si le plan est payant (même si webhook pas encore reçu)
  return user.plan !== "free" && user.plan != null;
}
function formatDate(date?: string | null) {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}
function normalizeUser(rawUser: any, sessionUser?: any): LunaUser {
  const rawPlan = rawUser?.plan;
  const rawSubscriptionStatus = rawUser?.subscriptionStatus;
  const rawVisibility = rawUser?.visibilite;
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
    consentement: typeof rawUser?.consentement === "boolean" ? rawUser.consentement : true,
    role: rawUser?.role === "admin" ? "admin" : "user",
    plan: isValidPlan(rawPlan) ? rawPlan : "free",
    subscriptionStatus: isValidSubscriptionStatus(rawSubscriptionStatus) ? rawSubscriptionStatus : "inactive",
    isPremium: Boolean(rawUser?.isPremium),
    premiumStartedAt: rawUser?.premiumStartedAt || null,
    premiumExpiresAt: rawUser?.premiumExpiresAt || null,
    stripeCustomerId: rawUser?.stripeCustomerId || "",
    stripeSubscriptionId: rawUser?.stripeSubscriptionId || "",
    stripeCheckoutSessionId: rawUser?.stripeCheckoutSessionId || "",
    lastLoginAt: rawUser?.lastLoginAt || null,
    lastPaymentAt: rawUser?.lastPaymentAt || null,
    planLabel: rawUser?.planLabel || (isValidPlan(rawPlan) ? planLabels[rawPlan] : "Gratuit"),
    subscriptionStatusLabel: rawUser?.subscriptionStatusLabel || (isValidSubscriptionStatus(rawSubscriptionStatus) ? subscriptionLabels[rawSubscriptionStatus] : "Inactif"),
    createdAt: rawUser?.createdAt || undefined,
    updatedAt: rawUser?.updatedAt || undefined,
  };
}

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────

const tabContentVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const fetchProfile = useCallback(async () => {
    setIsLoadingProfile(true);
    setPageError("");
    try {
      const res = await fetch("/api/users/profile", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPageError(data.error || "Impossible de récupérer le profil.");
        return;
      }
      const rawUser = { ...data.user, ...(data.premium || {}) };
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
      // Marquer les notifications comme lues à l'ouverture de Mon Compte
      fetch("/api/notifications", { method: "POST" }).catch(() => {});
    }
  }, [status, fetchProfile]);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (status === "authenticated" && payment === "success") {
      setPaymentSuccess(true);
      fetchProfile();
      setActiveTab("premium");
      setTimeout(() => setPaymentSuccess(false), 6000);
    }
  }, [searchParams, status, fetchProfile]);

  const profileCompletion = useMemo(() => {
    const fields = [
      user.pseudonyme, user.email, user.age, user.orientation,
      user.intentions?.length, user.localisation, user.rayon,
      user.question, user.reponse, user.interets?.length,
      user.visibilite, user.consentement,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [user]);

  const premiumLabel = getPremiumLabel(user);

  const updateDraft = <K extends keyof LunaUser>(key: K, value: LunaUser[K]) => {
    setDraftUser((prev) => ({ ...prev, [key]: value }));
  };

  const splitToArray = (value: string) =>
    value.split(",").map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    setIsSaving(true);
    setPageError("");
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPageError(data.error || "Impossible de sauvegarder.");
        return;
      }
      const updated = normalizeUser({
        ...user, ...data.user,
        plan: data.user?.plan || user.plan,
        subscriptionStatus: data.user?.subscriptionStatus || user.subscriptionStatus,
        isPremium: typeof data.user?.isPremium === "boolean" ? data.user.isPremium : user.isPremium,
        premiumStartedAt: data.user?.premiumStartedAt || user.premiumStartedAt,
        premiumExpiresAt: data.user?.premiumExpiresAt || user.premiumExpiresAt,
        stripeCustomerId: data.user?.stripeCustomerId || user.stripeCustomerId,
        stripeSubscriptionId: data.user?.stripeSubscriptionId || user.stripeSubscriptionId,
        lastPaymentAt: data.user?.lastPaymentAt || user.lastPaymentAt,
      }, session?.user);
      setUser(updated);
      setDraftUser(updated);
      setIsEditing(false);
    } catch {
      setPageError("Erreur de connexion au serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => { setDraftUser(user); setIsEditing(false); };

  const handleVisibilityChange = async (visibilite: ProfileVisibility) => {
    try {
      const res = await fetch("/api/users/visibility", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilite }),
      });
      const data = await res.json();
      if (!data.success) { setPageError(data.error ?? "Impossible de changer la visibilité."); return; }
      setUser((p) => ({ ...p, visibilite }));
      setDraftUser((p) => ({ ...p, visibilite }));
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mx-auto mb-6 h-20 w-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-xl opacity-50 animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur">
              <Moon className="h-10 w-10 text-purple-200" />
            </div>
          </div>
          <p className="text-white/60 text-sm">Chargement de votre espace Luna…</p>
        </motion.div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const tabs: { id: TabId; label: string; emoji: string; icon: ElementType }[] = [
    { id: "dashboard", label: "Accueil", emoji: "🏠", icon: Sparkles },
    { id: "profil", label: "Profil", emoji: "✨", icon: User },
    { id: "preferences", label: "Préférences", emoji: "💫", icon: Heart },
    { id: "premium", label: "Premium", emoji: "👑", icon: Crown },
    { id: "securite", label: "Sécurité", emoji: "🔒", icon: Shield },
    { id: "connexions", label: "Connexions", emoji: "💞", icon: Heart },
  ];

  const isTabEditable = activeTab === "profil" || activeTab === "preferences";

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white relative overflow-x-hidden">
      {/* Orbs décoratifs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-pink-600/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-16 pt-6">

        {/* ── Nav bar haut ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-purple-400/40 transition-all duration-200"
          >
            <img src="/logo-sferaluna.png" alt="SferaLuna" className="h-6 w-6 rounded-full object-cover" />
            <span className="font-semibold text-white text-sm group-hover:text-purple-200 transition-colors">SferaLuna</span>
            <ArrowLeft className="h-3.5 w-3.5 text-white/40 group-hover:text-purple-300 group-hover:-translate-x-0.5 transition-all duration-200" />
          </button>

          <div className="flex items-center gap-2">
            {user.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="px-3 py-1.5 rounded-lg bg-yellow-400/10 border border-yellow-400/30 text-yellow-200 text-xs font-semibold hover:bg-yellow-400/20 transition flex items-center gap-1.5"
              >
                <Star className="h-3.5 w-3.5" />
                Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition text-sm"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </motion.div>

        {/* ── Bandeau paiement succès ── */}
        <AnimatePresence>
          {paymentSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mb-5 rounded-2xl border border-green-400/30 bg-green-500/15 px-5 py-4 flex items-center gap-3"
            >
              <span className="text-2xl">🎉</span>
              <div>
                <p className="font-bold text-green-100">Bienvenue dans SferaLuna Premium !</p>
                <p className="text-sm text-green-200/80">Votre abonnement est maintenant actif. Profitez de toutes les fonctionnalités.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Erreur globale ── */}
        <AnimatePresence>
          {pageError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-5 overflow-hidden"
            >
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-200 flex items-center gap-3 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {pageError}
                <button onClick={() => setPageError("")} className="ml-auto">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hero profil ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6 rounded-3xl border border-white/10 bg-white/8 backdrop-blur-xl overflow-hidden"
        >
          {/* Bande gradient */}
          <div className="h-24 bg-gradient-to-r from-purple-600/50 via-pink-500/40 to-purple-800/50 relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              {/* Avatar + ring */}
              <div className="relative flex-shrink-0">
                <ProgressRing completion={profileCompletion} size={88}>
                  <div className="h-full w-full rounded-full overflow-hidden bg-[#1a0b2e] border-2 border-[#1a0b2e] flex items-center justify-center">
                    {user.image ? (
                      <img src={user.image} alt={user.pseudonyme} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl">
                        {user.pseudonyme.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </ProgressRing>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-400 border-2 border-[#1a0b2e] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-green-900">{profileCompletion}%</span>
                </div>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold truncate">{user.pseudonyme}</h1>
                  {isPremiumActive(user) && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 px-2.5 py-0.5 text-xs font-bold text-yellow-200 relative overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                      {planEmoji[user.plan]} {premiumLabel}
                    </span>
                  )}
                  {!isPremiumActive(user) && (
                    <span className="rounded-full bg-white/10 border border-white/15 px-2.5 py-0.5 text-xs text-white/60">
                      🌙 Gratuit
                    </span>
                  )}
                </div>
                <p className="text-white/50 text-sm">{user.email}</p>
                {user.localisation && (
                  <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {user.localisation}
                  </p>
                )}
              </div>

              {/* Stats rapides */}
              <div className="flex gap-4 text-center sm:text-right pb-1 flex-shrink-0">
                <div>
                  <p className="text-lg font-bold">{user.age ?? "—"}</p>
                  <p className="text-xs text-white/40">ans</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{user.interets?.length ?? 0}</p>
                  <p className="text-xs text-white/40">intérêts</p>
                </div>
                <div>
                  <p className="text-lg font-bold">{profileCompletion}%</p>
                  <p className="text-xs text-white/40">profil</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Tabs pills ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (isEditing) handleCancel(); }}
              className={`relative flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/40 text-white shadow-lg"
                  : "bg-white/5 border border-white/8 text-white/50 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute inset-0 rounded-xl border border-purple-400/40 pointer-events-none"
                />
              )}
            </button>
          ))}
        </motion.div>

        {/* ── Contenu des onglets ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <div className="rounded-3xl border border-white/10 bg-white/8 backdrop-blur-xl p-6 md:p-8">

              {activeTab === "dashboard" && (
                <DashboardTab user={user} profileCompletion={profileCompletion} router={router} />
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

              {activeTab === "securite" && (
                <SecurityTab user={user} />
              )}

              {activeTab === "connexions" && (
                <ConnexionsTab user={user} />
              )}

              {/* Boutons d'édition */}
              {isTabEditable && (
                <div className="mt-8 pt-6 border-t border-white/8 flex justify-end gap-3">
                  {!isEditing ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setIsEditing(true)}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold flex items-center gap-2 hover:opacity-90 transition text-sm shadow-lg"
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier le profil ✏️
                    </motion.button>
                  ) : (
                    <>
                      <button
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/70 flex items-center gap-2 hover:bg-white/10 transition text-sm"
                      >
                        <X className="h-4 w-4" />
                        Annuler
                      </button>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50 text-sm shadow-lg"
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        .input-luna {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          color: white;
          font-size: 0.875rem;
          transition: border-color 0.15s, background 0.15s;
          outline: none;
        }
        .input-luna:focus {
          border-color: rgba(167,139,250,0.5);
          background: rgba(255,255,255,0.08);
        }
        .input-luna:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .input-luna option { background: #1a0b2e; color: white; }
      `}</style>
    </main>
  );
}

// ─────────────────────────────────────────────
// Composant : Anneau de progression SVG
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
          cx={center} cy={center} r={r}
          fill="none" stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center} cy={center} r={r}
          fill="none" stroke="url(#ring-grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div
        className="absolute"
        style={{ inset: strokeWidth + 2 }}
      >
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant : Tableau de bord
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
    { emoji: "📊", label: "Profil complété", value: `${profileCompletion}%`, color: "from-purple-500/20 to-pink-500/20", border: "border-purple-400/20" },
    { emoji: "✅", label: "Compte", value: user.hasCompletedProfile ? "Validé" : "À compléter", color: "from-green-500/15 to-emerald-500/15", border: "border-green-400/20" },
    { emoji: planEmoji[user.plan], label: "Plan actuel", value: planLabel, color: "from-yellow-500/15 to-amber-500/15", border: "border-yellow-400/20" },
    { emoji: "💳", label: "Abonnement", value: subscriptionLabels[user.subscriptionStatus] || "Inactif", color: "from-blue-500/15 to-indigo-500/15", border: "border-blue-400/20" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">
          Bonjour <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">{user.pseudonyme}</span> 👋
        </h2>
        <p className="text-white/50 text-sm">Voici un aperçu de votre espace SferaLuna.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-4`}
          >
            <p className="text-xl mb-1">{card.emoji}</p>
            <p className="text-xs text-white/50 mb-0.5">{card.label}</p>
            <p className="font-bold text-sm">{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Barre de progression profil */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="font-semibold text-sm">Complétion du profil</span>
          </div>
          <span className="text-sm font-bold text-purple-300">{profileCompletion}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${profileCompletion}%` }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          />
        </div>
        {profileCompletion < 100 && (
          <p className="text-xs text-white/40 mt-2">Complétez votre profil pour apparaître dans plus de recherches 🚀</p>
        )}
      </div>

      {/* Infos rapides */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { emoji: "📍", label: "Localisation", value: user.localisation || "—" },
          { emoji: "💞", label: "Intentions", value: (user.intentions || []).map((i) => intentionLabels[i] || i).join(", ") || "—" },
          { emoji: "👁️", label: "Visibilité", value: visibilityLabels[user.visibilite] || user.visibilite },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-white/8 bg-white/5 p-3 text-center">
            <p className="text-xl mb-1">{item.emoji}</p>
            <p className="text-[10px] text-white/40 mb-0.5">{item.label}</p>
            <p className="text-xs font-medium leading-tight truncate">{item.value}</p>
          </div>
        ))}
      </div>

      {/* CTA Premium */}
      <div className={`rounded-2xl border p-5 ${active ? "border-green-400/20 bg-green-500/10" : "border-yellow-400/20 bg-yellow-400/8"}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`font-bold mb-1 ${active ? "text-green-100" : "text-yellow-100"}`}>
              {active ? `🎉 Plan ${getPremiumLabel(user)} actif !` : "🌟 Passez Premium"}
            </p>
            <p className="text-sm text-white/60">
              {active
                ? "Vous profitez de toutes les fonctionnalités SferaLuna."
                : "Débloquez les likes illimités, le mode invisible et bien plus."}
            </p>
          </div>
          <button
            onClick={() => router.push("/paiement")}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 ${active ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-gradient-to-r from-yellow-500 to-orange-500"}`}
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
// Composant : Onglet Profil
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
  splitToArray: (v: string) => string[];
}) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview locale immédiate
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

      const data = await res.json();

      if (!data.success) {
        setUploadMsg({ type: "error", text: data.error ?? "Erreur lors de l'upload." });
        setAvatarPreview(null);
        return;
      }

      // Mettre à jour le draft avec la nouvelle URL
      updateDraft("image", data.imageUrl);
      setUploadMsg({ type: "success", text: "Photo mise à jour avec succès !" });
    } catch {
      setUploadMsg({ type: "error", text: "Erreur de connexion au serveur." });
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
      // Réinitialiser l'input pour permettre re-upload du même fichier
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displayImage = avatarPreview || user.image || null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">✨ Mon profil</h2>
        <p className="text-white/50 text-sm">{isEditing ? "Mode édition — modifiez vos informations ci-dessous." : "Cliquez sur \"Modifier\" pour éditer votre profil."}</p>
      </div>

      {isEditing && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200 flex items-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          Mode édition activé — vos modifications ne seront pas enregistrées avant la sauvegarde.
        </motion.div>
      )}

      {/* ── Upload photo de profil ── */}
      <div className="flex items-center gap-5 p-4 rounded-xl bg-white/5 border border-white/10">
        {/* Avatar actuel / preview */}
        <div className="relative flex-shrink-0 h-20 w-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl font-bold">
          {displayImage ? (
            <img src={displayImage} alt={user.pseudonyme} className="h-full w-full object-cover" />
          ) : (
            user.pseudonyme.charAt(0).toUpperCase()
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white mb-1">Photo de profil</p>
          <p className="text-xs text-white/40 mb-3">JPG, PNG ou WebP · max 5 Mo · recadrée en 400×400</p>

          {/* Feedback */}
          {uploadMsg && (
            <p className={`text-xs mb-2 ${uploadMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {uploadMsg.text}
            </p>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-4 py-1.5 rounded-lg bg-purple-500/30 border border-purple-400/30 text-purple-200 text-xs font-medium hover:bg-purple-500/40 transition disabled:opacity-50"
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
          onChange={(e) => updateDraft("bio", e.target.value)}
          className="input-luna resize-none h-24"
          placeholder="Décrivez-vous en quelques mots… vos passions, ce que vous recherchez…"
          maxLength={500}
        />
        <p className="text-xs text-white/30 text-right mt-1">{(user.bio || "").length}/500</p>
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Pseudonyme 🌸">
          <input disabled={!isEditing} value={user.pseudonyme || ""} onChange={(e) => updateDraft("pseudonyme", e.target.value)} className="input-luna" />
        </Field>

        <Field label="Email 📧">
          <input disabled value={user.email || ""} className="input-luna" />
        </Field>

        <Field label="Âge 🎂">
          <input disabled={!isEditing} type="number" min={18} max={99} value={user.age || 28} onChange={(e) => updateDraft("age", Number(e.target.value))} className="input-luna" />
        </Field>

        <Field label="Localisation 📍">
          <input disabled={!isEditing} value={user.localisation || ""} onChange={(e) => updateDraft("localisation", e.target.value)} className="input-luna" placeholder="Paris, Lyon…" />
        </Field>

        <Field label="Rayon de recherche 🗺️">
          <select disabled={!isEditing} value={user.rayon || "10 km"} onChange={(e) => updateDraft("rayon", e.target.value)} className="input-luna">
            {["5 km", "10 km", "25 km", "50 km", "100 km", "region", "france"].map((v) => (
              <option key={v} value={v}>{v === "region" ? "Toute la région" : v === "france" ? "Toute la France" : v}</option>
            ))}
          </select>
        </Field>

        <Field label="Centres d'intérêt 🎯">
          <input
            disabled={!isEditing}
            value={(user.interets || []).join(", ")}
            onChange={(e) => updateDraft("interets", splitToArray(e.target.value))}
            className="input-luna"
            placeholder="voyage, musique, sport…"
          />
        </Field>

        <Field label="Question de sécurité 🔑" className="sm:col-span-2">
          <input disabled={!isEditing} value={user.question || ""} onChange={(e) => updateDraft("question", e.target.value)} className="input-luna" placeholder="Votre question secrète" />
        </Field>

        <Field label="Réponse secrète 🤫" className="sm:col-span-2">
          <input disabled={!isEditing} type="text" value={user.reponse || ""} onChange={(e) => updateDraft("reponse", e.target.value)} className="input-luna" placeholder="Votre réponse secrète" />
        </Field>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant : Onglet Préférences
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
  splitToArray: (v: string) => string[];
  onVisibilityChange: (v: ProfileVisibility) => Promise<void>;
}) {
  const [togglingInvisible, setTogglingInvisible] = useState(false);
  const isInvisible = user.visibilite === "invisible";
  const premActive = user.isPremium && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

  const handleToggle = async () => {
    setTogglingInvisible(true);
    await onVisibilityChange(isInvisible ? "public" : "invisible");
    setTogglingInvisible(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">💫 Préférences</h2>
        <p className="text-white/50 text-sm">Gérez vos intentions, orientation et visibilité.</p>
      </div>

      {/* Toggle mode invisible */}
      <motion.div
        animate={{ borderColor: isInvisible ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.1)" }}
        className={`rounded-2xl border p-4 ${isInvisible ? "bg-purple-500/10 border-purple-400/30" : "bg-white/5 border-white/10"}`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">👻</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">Mode invisible</p>
                {!premActive && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-400/15 text-yellow-300 border border-yellow-400/20">
                    👑 Premium requis
                  </span>
                )}
                {isInvisible && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-400/15 text-purple-300 border border-purple-400/20 animate-pulse">
                    Actif
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 mt-0.5">
                {isInvisible ? "Votre profil est invisible dans les recherches." : "Naviguez discrètement sans apparaître aux autres."}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggle}
            disabled={togglingInvisible || !premActive}
            className={`relative h-7 w-12 rounded-full transition-colors flex-shrink-0 ${isInvisible ? "bg-purple-500" : "bg-white/20"} disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <motion.span
              animate={{ x: isInvisible ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md block"
            />
            {togglingInvisible && (
              <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 text-purple-200 animate-spin" />
            )}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Orientation 💜">
          <select disabled={!isEditing} value={user.orientation || ""} onChange={(e) => updateDraft("orientation", e.target.value)} className="input-luna">
            <option value="">Sélectionner</option>
            {Object.entries(orientationLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>

        <Field label="Intentions 💞">
          <input
            disabled={!isEditing}
            value={(user.intentions || []).map((i) => intentionLabels[i] || i).join(", ")}
            onChange={(e) => updateDraft("intentions", splitToArray(e.target.value).map((v) => {
              const found = Object.entries(intentionLabels).find(([, label]) => label === v.trim());
              return found ? found[0] : v.trim();
            }))}
            className="input-luna"
            placeholder="rencontre-serieuse, amitie…"
          />
        </Field>

        <Field label="Visibilité du profil 👁️">
          <select
            disabled={!isEditing}
            value={user.visibilite || "matches"}
            onChange={(e) => updateDraft("visibilite", e.target.value as ProfileVisibility)}
            className="input-luna"
          >
            {Object.entries(visibilityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant : Onglet Premium
// ─────────────────────────────────────────────

function PremiumTab({ user, router }: { user: LunaUser; router: ReturnType<typeof useRouter> }) {
  const active = isPremiumActive(user);
  const planLabel = getPremiumLabel(user);

  const featuresByPlan: Record<LunaPlan, string[]> = {
    free: ["🌙 Profil public", "💌 5 likes / jour"],
    "essential-monthly": ["⭐ 50 likes / jour", "📊 Voir ses visiteurs", "🔍 Filtres avancés"],
    "premium-monthly": ["💎 Likes illimités", "👻 Mode invisible", "📩 Messages prioritaires", "🔔 Alertes matches", "📈 Statistiques"],
    "elite-monthly": ["👑 Toutes les fonctionnalités", "⚡ Boost de profil quotidien", "🎯 Filtres ultra-précis", "🛡️ Badge VIP", "💬 Support prioritaire 24/7"],
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">👑 Mon abonnement</h2>
        <p className="text-white/50 text-sm">Gérez votre plan SferaLuna.</p>
      </div>

      {/* Plan actuel */}
      <div className={`rounded-2xl border p-5 ${active ? "border-green-400/20 bg-gradient-to-br from-green-500/10 to-emerald-500/10" : "border-yellow-400/20 bg-gradient-to-br from-yellow-500/8 to-amber-500/8"}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{planEmoji[user.plan]}</span>
          <div>
            <h3 className="font-bold text-lg">{planLabel}</h3>
            <p className="text-sm text-white/60">{subscriptionLabels[user.subscriptionStatus] || "—"}</p>
          </div>
          {active && (
            <span className="ml-auto flex items-center gap-1 text-xs font-bold text-green-300 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Actif
            </span>
          )}
        </div>

        <div className="space-y-1 text-sm text-white/70 mb-4">
          {user.premiumStartedAt && <p>📅 Démarré le {formatDate(user.premiumStartedAt)}</p>}
          {user.premiumExpiresAt && <p>⏳ Expire le {formatDate(user.premiumExpiresAt)}</p>}
          {user.lastPaymentAt && <p>💳 Dernier paiement le {formatDate(user.lastPaymentAt)}</p>}
        </div>

        {active ? (
          <button
            onClick={() => router.push("/paiement")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 bg-gradient-to-r from-green-600 to-emerald-600"
          >
            Changer d&apos;offre
          </button>
        ) : (
          <button
            onClick={() => router.push("/paiement")}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 bg-gradient-to-r from-yellow-500 to-orange-500"
          >
            🚀 Finaliser le paiement
          </button>
        )}
      </div>

      {/* Fonctionnalités incluses */}
      <div>
        <p className="text-sm font-semibold text-white/60 mb-3">✨ Fonctionnalités incluses dans votre plan :</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(featuresByPlan[user.plan] || featuresByPlan["free"]).map((f) => (
            <div key={f} className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5 text-sm">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA si pas encore elite */}
      {user.plan !== "elite-monthly" && (
        <div className="rounded-2xl border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 text-center">
          <p className="text-lg mb-1">✨ Passez à l&apos;offre Elite</p>
          <p className="text-sm text-white/60 mb-4">Accès complet à toutes les fonctionnalités SferaLuna.</p>
          <button onClick={() => router.push("/paiement")} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-sm font-semibold text-white hover:opacity-90 transition">
            Voir les offres 👑
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant : Onglet Sécurité
// ─────────────────────────────────────────────

function IdentityVerificationBlock({ user }: { user: LunaUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/identity-verification", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Une erreur est survenue.");
      }
    } catch {
      setError("Impossible de lancer la vérification.");
    } finally {
      setLoading(false);
    }
  };

  const status = user.identityVerificationStatus || "unverified";

  return (
    <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🪪</span>
        <h3 className="font-semibold text-white">Vérification d&apos;identité</h3>
        {user.identityVerified && (
          <span className="ml-auto text-xs bg-green-500/20 text-green-300 border border-green-400/20 rounded-full px-2 py-0.5 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Vérifiée
          </span>
        )}
      </div>
      <p className="text-sm text-white/60">
        Vérifiez votre identité avec une pièce d&apos;identité officielle pour obtenir le badge &quot;Profil vérifié&quot; sur SferaLuna.
      </p>
      {status === "pending" && (
        <p className="text-sm text-yellow-300/80">⏳ Vérification en cours…</p>
      )}
      {status === "failed" && (
        <p className="text-sm text-red-300/80">❌ Vérification échouée. Réessayez.</p>
      )}
      {!user.identityVerified && status !== "pending" && (
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
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
    { ok: user.provider === "google" || !!user.question, label: "Question de sécurité définie", emoji: "🔑" },
    ...(user.provider === "google" ? [{ ok: true, label: "Connexion Google sécurisée (OAuth)", emoji: "🔐" }] : []),
    { ok: !!user.stripeCustomerId, label: "Compte Stripe enregistré", emoji: "💳" },
    { ok: user.hasCompletedProfile, label: "Profil complété", emoji: "✅" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-1">🔒 Sécurité du compte</h2>
        <p className="text-white/50 text-sm">État de sécurité de votre espace SferaLuna.</p>
      </div>

      <div className="space-y-2">
        {checks.map((c, i) => (
          <motion.div
            key={c.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className={`rounded-xl border px-4 py-3 flex items-center gap-3 text-sm ${c.ok ? "border-green-400/20 bg-green-500/8" : "border-white/10 bg-white/5"}`}
          >
            <span className="text-base">{c.emoji}</span>
            <span className={c.ok ? "text-white" : "text-white/50"}>{c.label}</span>
            <span className="ml-auto">
              {c.ok
                ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                : <X className="h-4 w-4 text-white/30" />}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <p className="text-xs text-white/40 mb-1">Provider d&apos;authentification</p>
        <p className="font-semibold capitalize">{user.provider || "credentials"}</p>
        <p className="text-xs text-white/40 mt-3 mb-1">Membre depuis</p>
        <p className="font-semibold">{formatDate(user.createdAt)}</p>
        {user.lastLoginAt && (
          <>
            <p className="text-xs text-white/40 mt-3 mb-1">Dernière connexion</p>
            <p className="font-semibold">{formatDate(user.lastLoginAt)}</p>
          </>
        )}
      </div>

      <IdentityVerificationBlock user={user} />

      {user.provider === "credentials" && (
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-200 flex items-start gap-2">
          <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
          Votre mot de passe est stocké de manière sécurisée et chiffré (bcrypt).
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant : Onglet Visiteurs
// ─────────────────────────────────────────────

type Visitor = {
  user: { _id: string; pseudonyme: string; age?: number; localisation?: string; image?: string } | null;
  lastVisit: string;
  visitCount: number;
};

// ─────────────────────────────────────────────
// Composant : Connexions (Matches + Visiteurs)
// ─────────────────────────────────────────────

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

function ConnexionsTab({ user }: { user: LunaUser }) {
  const [reportUserId, setReportUserId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingVisitors, setLoadingVisitors] = useState(true);
  const [activeSection, setActiveSection] = useState<"matches" | "visiteurs">("matches");

  const premActive = user.isPremium && (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing");

  const relativeTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "À l'instant";
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  useEffect(() => {
    fetch("/api/matches", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMatches(d.matches ?? []); })
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, []);

  useEffect(() => {
    if (!premActive) { setLoadingVisitors(false); return; }
    fetch("/api/visitors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.success) setVisitors(d.visitors ?? []); })
      .catch(() => {})
      .finally(() => setLoadingVisitors(false));
  }, [premActive]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">💞 Connexions</h2>
          <p className="text-white/50 text-sm">Vos matches et visiteurs en un coup d&apos;œil.</p>
        </div>
        <Link
          href="/explorer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-400/20 text-purple-200 text-xs font-medium hover:opacity-80 transition"
        >
          <Sparkles className="h-3.5 w-3.5" /> Explorer
        </Link>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setActiveSection("matches")}
          className={`rounded-2xl border p-4 text-left transition-all ${activeSection === "matches" ? "border-pink-400/40 bg-pink-500/15" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Heart className={`h-4 w-4 ${activeSection === "matches" ? "text-pink-300" : "text-white/40"}`} />
            <span className="text-xs text-white/50 font-medium">Matches</span>
          </div>
          {loadingMatches ? (
            <Loader2 className="h-5 w-5 text-pink-300 animate-spin" />
          ) : (
            <p className={`text-2xl font-bold ${activeSection === "matches" ? "text-pink-200" : "text-white"}`}>{matches.length}</p>
          )}
        </button>

        <button
          onClick={() => setActiveSection("visiteurs")}
          className={`rounded-2xl border p-4 text-left transition-all ${activeSection === "visiteurs" ? "border-purple-400/40 bg-purple-500/15" : "border-white/10 bg-white/5 hover:bg-white/8"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Eye className={`h-4 w-4 ${activeSection === "visiteurs" ? "text-purple-300" : "text-white/40"}`} />
            <span className="text-xs text-white/50 font-medium">Visiteurs</span>
            {!premActive && <Lock className="h-3 w-3 text-white/30 ml-auto" />}
          </div>
          {loadingVisitors ? (
            <Loader2 className="h-5 w-5 text-purple-300 animate-spin" />
          ) : premActive ? (
            <p className={`text-2xl font-bold ${activeSection === "visiteurs" ? "text-purple-200" : "text-white"}`}>{visitors.length}</p>
          ) : (
            <p className="text-2xl font-bold text-white/30">—</p>
          )}
        </button>
      </div>

      {/* Contenu section */}
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
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 text-pink-300 animate-spin" /></div>
            ) : matches.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <p className="text-4xl">💫</p>
                <p className="text-white/50 text-sm">Pas encore de matches.</p>
                <Link href="/explorer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-sm font-semibold hover:opacity-90 transition">
                  <Heart className="h-4 w-4" /> Découvrir des profils
                </Link>
              </div>
            ) : (
              matches.map((match, i) => {
                const u = match.user;
                if (!u) return null;
                return (
                  <motion.div
                    key={match.matchId}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl border border-white/8 bg-white/5 p-4 flex items-center gap-4 hover:bg-white/8 transition"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                      {u.image
                        ? <img src={u.image} alt={u.pseudonyme} className="h-full w-full object-cover" />
                        : u.pseudonyme.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {u.pseudonyme}
                        {u.age ? <span className="text-white/50">, {u.age} ans</span> : ""}
                      </p>
                      {u.localisation && (
                        <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{u.localisation}
                        </p>
                      )}
                      {match.lastMessageAt && (
                        <p className="text-xs text-purple-300/70 mt-0.5">💬 {relativeTime(match.lastMessageAt)}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="text-xs text-white/30">{relativeTime(match.createdAt)}</p>
                      <Link
                        href={`/messages/${match.matchId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/25 border border-purple-400/20 text-purple-200 text-xs font-medium hover:bg-purple-500/40 transition"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Message
                      </Link>
                      <Link
                        href={`/profil/${u._id}`}
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-md shadow-pink-500/20 hover:opacity-90 hover:scale-105 transition-all duration-200"
                      >
                        Voir ✨
                      </Link>
                      <button
                        onClick={() => setReportUserId(u._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 border border-red-400/20 text-red-300 hover:bg-red-500/20 transition"
                        title="Signaler"
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
            {!premActive ? (
              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/8 p-8 text-center">
                <p className="text-4xl mb-4">👑</p>
                <h3 className="font-bold text-yellow-100 mb-2">Fonctionnalité Premium</h3>
                <p className="text-sm text-white/60 mb-5">Avec un abonnement Essentiel ou supérieur, découvrez qui visite votre profil en temps réel.</p>
                <a href="/paiement" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 transition">
                  Voir les offres <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            ) : loadingVisitors ? (
              <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 text-purple-300 animate-spin" /></div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-white/50 text-sm">Personne n&apos;a encore visité votre profil.</p>
                <p className="text-xs text-white/30 mt-2">Complétez votre profil pour être plus visible !</p>
              </div>
            ) : (
              visitors.map(({ user: visitor, lastVisit, visitCount }, i) => {
                if (!visitor) return null;
                return (
                  <motion.div
                    key={visitor._id ?? i}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-2xl border border-white/8 bg-white/5 p-4 flex items-center gap-4 hover:bg-white/8 transition"
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                      {visitor.image
                        ? <img src={visitor.image} alt={visitor.pseudonyme} className="h-full w-full object-cover" />
                        : visitor.pseudonyme.charAt(0).toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">
                        {visitor.pseudonyme}
                        {visitor.age ? <span className="text-white/50">, {visitor.age} ans</span> : ""}
                      </p>
                      {visitor.localisation && (
                        <p className="text-xs text-white/40 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{visitor.localisation}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-white/40">{relativeTime(lastVisit)}</p>
                      {visitCount > 1 && (
                        <p className="text-xs text-purple-300 mt-0.5">🔄 {visitCount} visites</p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {reportUserId && (
        <ReportModal
          targetId={reportUserId}
          targetType="user"
          onClose={() => setReportUserId(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Composant : Field wrapper
// ─────────────────────────────────────────────

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-white/50 mb-1.5 uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

export default function MonComptePage() {
  return (
    <Suspense>
      <MonCompteContent />
    </Suspense>
  );
}
