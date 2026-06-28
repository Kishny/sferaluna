// src/app/explorer/page.tsx

"use client";

/**
 * Page Explorer SferaLuna.
 *
 * Cette page gère :
 * - l'affichage des profils à découvrir ;
 * - un effet pile de cartes façon Tinder ;
 * - les filtres classiques ;
 * - les filtres premium ;
 * - le like ;
 * - le pass ;
 * - la détection de match ;
 * - l'enregistrement des visites de profil ;
 * - le chargement progressif ;
 * - le signalement d'un profil.
 *
 * Version mobile-first :
 * - header page plus compact ;
 * - filtres plus compacts ;
 * - carte profil moins haute sur mobile ;
 * - actions plus proches de la carte ;
 * - empilement visuel des profils ;
 * - drag horizontal léger façon swipe ;
 * - footer masqué sur mobile pour éviter une page trop longue.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Heart,
  X,
  MapPin,
  Sparkles,
  Filter,
  ChevronDown,
  Loader2,
  Search,
  Crown,
  RefreshCw,
  Lock,
  MessageCircle,
  Flag,
  AlertCircle,
  User,
} from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Profile {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  interets: string[];
  intentions: string[];
  image?: string;
  identityVerified?: boolean;
}

interface Filters {
  age_min: string;
  age_max: string;
  intentions: string;
  localisation: string;

  /**
   * Filtres premium.
   * Ils sont envoyés à l'API uniquement si l'utilisateur est premium.
   */
  orientation: string;
  actif_recemment: boolean;
}

// ─────────────────────────────────────────────
// Options de filtres
// ─────────────────────────────────────────────

const INTENTIONS_OPTIONS = [
  { value: "rencontre-serieuse", label: "Rencontre sérieuse" },
  { value: "amitie", label: "Amitié" },
  { value: "aventure", label: "Aventure" },
  { value: "reseautage", label: "Réseautage" },
  { value: "discussion", label: "Discussion" },
];

const ORIENTATION_OPTIONS = [
  { value: "hetero", label: "Hétérosexuelle" },
  { value: "homo", label: "Lesbienne / Homosexuelle" },
  { value: "bi", label: "Bisexuelle" },
  { value: "pan", label: "Pansexuelle" },
  { value: "curieuse", label: "Curieuse" },
  { value: "other", label: "Autre" },
];

// ─────────────────────────────────────────────
// Accent visuel par tier (reflète le plan de l'utilisatrice qui explore)
// ─────────────────────────────────────────────

const planAccent: Record<
  string,
  { titleGradient: string; actionGradient: string; actionShadow: string }
> = {
  free: {
    titleGradient: "from-white to-white/70",
    actionGradient: "from-white/30 to-white/15",
    actionShadow: "shadow-white/10",
  },
  "essential-monthly": {
    titleGradient: "from-violet-200 to-purple-200",
    actionGradient: "from-violet-500 to-purple-600",
    actionShadow: "shadow-violet-500/30",
  },
  "premium-monthly": {
    titleGradient: "from-purple-200 to-pink-200",
    actionGradient: "from-pink-500 to-purple-600",
    actionShadow: "shadow-pink-500/30",
  },
  "elite-monthly": {
    titleGradient: "from-amber-200 to-yellow-200",
    actionGradient: "from-amber-400 to-yellow-500",
    actionShadow: "shadow-amber-400/30",
  },
};

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function ExplorerPage() {
  const { status } = useSession();
  const router = useRouter();
  const { isPremium, plan } = usePremium();
  const accent = planAccent[plan ?? "free"] ?? planAccent.free;

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);

  const [matchModal, setMatchModal] = useState<{
    profile: Profile;
    matchId: string;
  } | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Permet d'éviter de liker plusieurs fois le même profil côté UI.
   */
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  /**
   * Profil actuellement signalé.
   */
  const [reportProfileId, setReportProfileId] = useState<string | null>(null);

  /**
   * Message d'erreur global discret.
   */
  const [pageError, setPageError] = useState("");

  const [filters, setFilters] = useState<Filters>({
    age_min: "18",
    age_max: "99",
    intentions: "",
    localisation: "",
    orientation: "",
    actif_recemment: false,
  });

  /**
   * Profils visibles dans la pile.
   *
   * On affiche :
   * - la carte active ;
   * - la prochaine ;
   * - celle d'après.
   *
   * Ça donne l'effet Tinder sans casser ta logique actuelle.
   */
  const stackedProfiles = useMemo(() => {
    return profiles.slice(currentIndex, currentIndex + 3);
  }, [profiles, currentIndex]);

  /**
   * Nombre de profils restants à explorer.
   */
  const remainingCount = Math.max(profiles.length - currentIndex, 0);

  /**
   * Profil actif.
   */
  const currentProfile = profiles[currentIndex] ?? null;

  /**
   * Chargement des profils.
   *
   * reset = true :
   * - recharge depuis la page 1 ;
   * - remplace les profils actuels ;
   * - remet l'index courant à 0.
   *
   * reset = false :
   * - ajoute les profils suivants à la liste existante.
   */
  const fetchProfiles = useCallback(
    async (reset = false) => {
      setIsLoading(true);
      setPageError("");

      try {
        const params = new URLSearchParams();

        if (filters.age_min) params.set("age_min", filters.age_min);
        if (filters.age_max) params.set("age_max", filters.age_max);
        if (filters.intentions) params.set("intentions", filters.intentions);
        if (filters.localisation) {
          params.set("localisation", filters.localisation);
        }

        /**
         * Filtres premium :
         * on ne les envoie à l'API que si l'utilisateur est premium.
         */
        if (isPremium && filters.orientation) {
          params.set("orientation", filters.orientation);
        }

        if (isPremium && filters.actif_recemment) {
          params.set("actif_recemment", "true");
        }

        params.set("limit", "20");
        params.set("page", reset ? "1" : String(page));

        const res = await fetch(`/api/profiles?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          console.error("Erreur chargement profils :", data?.error);
          setPageError(data?.error || "Impossible de charger les profils.");
          /**
           * Important : on coupe hasMore ici.
           * Sinon l'effet de préchargement (qui dépend de hasMore)
           * continue d'incrémenter `page` indéfiniment à chaque échec,
           * ce qui spamme l'API en boucle (ex: page=271, 272, 273...).
           */
          setHasMore(false);
          return;
        }

        if (reset) {
          setProfiles(data.profiles ?? []);
          setCurrentIndex(0);
          setPage(1);
        } else {
          setProfiles((prev) => [...prev, ...(data.profiles ?? [])]);
        }

        setHasMore(data.pagination?.hasMore ?? false);
      } catch (err) {
        console.error("Erreur fetchProfiles :", err);
        setPageError("Erreur de connexion au serveur.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, isPremium, page]
  );

  /**
   * Redirection si l'utilisateur n'est pas connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Premier chargement des profils.
   *
   * Important :
   * on ne met pas fetchProfiles en dépendance ici volontairement,
   * sinon les profils se rechargent dès qu'un filtre change.
   */
  useEffect(() => {
    if (status === "authenticated") {
      fetchProfiles(true);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  /**
   * Applique les filtres.
   */
  const handleApplyFilters = () => {
    setShowFilters(false);
    fetchProfiles(true);
  };

  /**
   * Réinitialise les filtres.
   */
  const handleResetFilters = () => {
    setFilters({
      age_min: "18",
      age_max: "99",
      intentions: "",
      localisation: "",
      orientation: "",
      actif_recemment: false,
    });

    /**
     * On laisse React appliquer le state avant de relancer la recherche.
     */
    setTimeout(() => {
      fetchProfiles(true);
    }, 0);
  };

  /**
   * Passe au profil suivant.
   */
  const goNextProfile = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  /**
   * Like d'un profil.
   */
  const handleLike = async (profile: Profile) => {
    if (isLiking || likedIds.has(profile._id)) return;

    setIsLiking(true);
    setPageError("");

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile._id }),
      });

      const data = await res.json().catch(() => null);

      if (data?.success) {
        setLikedIds((prev) => new Set([...prev, profile._id]));

        if (data.matched && data.matchId) {
          setMatchModal({ profile, matchId: data.matchId });
        } else {
          /**
           * On passe au profil suivant uniquement s'il n'y a pas de match.
           * En cas de match, la modal gère la suite.
           */
          goNextProfile();
        }
      } else {
        setPageError(data?.error || "Impossible d'envoyer le like.");
      }
    } catch (err) {
      console.error("Erreur like :", err);
      setPageError("Erreur de connexion pendant le like.");
    } finally {
      setIsLiking(false);
    }
  };

  /**
   * Passer un profil.
   */
  const handlePass = () => {
    if (isLiking) return;
    goNextProfile();
  };

  /**
   * Enregistre la visite dès qu'un profil est affiché.
   */
  useEffect(() => {
    const profile = profiles[currentIndex];

    if (!profile || status !== "authenticated") return;

    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitedUserId: profile._id }),
    }).catch(() => {});
  }, [currentIndex, profiles, status]);

  /**
   * Préchargement :
   * quand on approche de la fin, on demande la page suivante.
   */
  useEffect(() => {
    if (
      profiles.length > 0 &&
      currentIndex >= profiles.length - 5 &&
      hasMore &&
      !isLoading
    ) {
      setPage((prev) => prev + 1);
    }
  }, [currentIndex, profiles.length, hasMore, isLoading]);

  /**
   * Chargement des pages suivantes.
   */
  useEffect(() => {
    if (page > 1) fetchProfiles(false);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <Loader2 className="h-9 w-9 animate-spin text-purple-300" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <Header />

        {/* ─────────────────────────────
            Modal Match
        ───────────────────────────── */}
        <AnimatePresence>
          {matchModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              <motion.div
                initial={{ scale: 0.7, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 20 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="relative z-10 max-h-[90vh] w-full max-w-sm overflow-hidden rounded-3xl border border-pink-400/30 bg-gradient-to-br from-[#1a0b2e] to-[#3a2a82] shadow-2xl"
              >
                {/* Confettis décoratifs */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {["💫", "✨", "🌟", "💕", "🌙", "💜"].map((emoji, i) => (
                    <motion.span
                      key={i}
                      className="absolute select-none text-xl"
                      initial={{ opacity: 0, y: 0, x: `${15 + i * 14}%` }}
                      animate={{ opacity: [0, 1, 0], y: -80 }}
                      transition={{
                        delay: i * 0.15,
                        duration: 1.4,
                        ease: "easeOut",
                      }}
                      style={{ top: "60%" }}
                    >
                      {emoji}
                    </motion.span>
                  ))}
                </div>

                <div className="relative p-6 text-center sm:p-8">
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-2 text-xs font-semibold uppercase tracking-widest text-pink-300 sm:text-sm"
                  >
                    C&apos;est un match !
                  </motion.p>

                  <motion.h2
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="mb-5 bg-gradient-to-r from-pink-300 to-purple-200 bg-clip-text text-2xl font-bold text-transparent sm:mb-6 sm:text-3xl"
                  >
                    💞 {matchModal.profile.pseudonyme || "Luna"}
                  </motion.h2>

                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.15,
                      type: "spring",
                      stiffness: 300,
                    }}
                    className="mx-auto mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-pink-400/40 bg-gradient-to-br from-pink-500 to-purple-600 text-4xl font-bold shadow-xl sm:mb-6 sm:h-28 sm:w-28 sm:text-5xl"
                  >
                    {matchModal.profile.image ? (
                      <img
                        src={matchModal.profile.image}
                        alt={matchModal.profile.pseudonyme || "Luna"}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (matchModal.profile.pseudonyme || "L").charAt(0).toUpperCase()
                    )}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-6 text-sm text-white/60 sm:mb-8"
                  >
                    Vous vous êtes mutuellement likées.
                    {matchModal.profile.localisation && (
                      <span className="mt-1 flex items-center justify-center gap-1 text-xs text-white/40">
                        <MapPin className="h-3 w-3" />
                        {matchModal.profile.localisation}
                      </span>
                    )}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col gap-3"
                  >
                    <Link
                      href={`/messages/${matchModal.matchId}`}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/30 transition hover:opacity-90"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Envoyer un message
                    </Link>

                    <button
                      onClick={() => {
                        setMatchModal(null);
                        goNextProfile();
                      }}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                      Continuer à explorer
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-3 pb-6 pt-16 sm:px-4 sm:pb-10 sm:pt-24">
          {/* ─────────────────────────────
              Header page compact
          ───────────────────────────── */}
          <section className="mb-3 sm:mb-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1
                  className={`truncate bg-gradient-to-r bg-clip-text text-xl font-black text-transparent transition-colors duration-300 sm:text-3xl ${accent.titleGradient}`}
                >
                  Explorer
                </h1>

                <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">
                  {remainingCount > 0
                    ? `${remainingCount} profil${remainingCount > 1 ? "s" : ""} à découvrir`
                    : "Tous les profils ont été explorés"}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchProfiles(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:bg-white/10 sm:h-10 sm:w-10"
                  title="Rafraîchir"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-gray-300 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilters((value) => !value)}
                  className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-gray-300 transition hover:bg-white/10 sm:h-10 sm:px-4 sm:text-sm"
                >
                  <Filter className="h-4 w-4" />
                  Filtres
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Erreur globale */}
          <AnimatePresence>
            {pageError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-3 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200 sm:text-sm"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{pageError}</span>

                <button
                  type="button"
                  onClick={() => setPageError("")}
                  aria-label="Fermer l'erreur"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────────────────────────
              Panneau filtres compact
          ───────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3 overflow-hidden sm:mb-5"
              >
                <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur sm:space-y-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white sm:text-base">
                      Filtres de recherche
                    </h3>

                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xs text-purple-300 transition hover:text-purple-200"
                    >
                      Réinitialiser
                    </button>
                  </div>

                  {/* Âge */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <FilterField label="Âge min">
                      <input
                        type="number"
                        value={filters.age_min}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            age_min: event.target.value,
                          }))
                        }
                        className="input-explorer"
                        min={18}
                        max={120}
                      />
                    </FilterField>

                    <FilterField label="Âge max">
                      <input
                        type="number"
                        value={filters.age_max}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            age_max: event.target.value,
                          }))
                        }
                        className="input-explorer"
                        min={18}
                        max={120}
                      />
                    </FilterField>
                  </div>

                  {/* Localisation */}
                  <FilterField label="Ville / région">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                      <input
                        type="text"
                        value={filters.localisation}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            localisation: event.target.value,
                          }))
                        }
                        className="input-explorer pl-9"
                        placeholder="Paris, Lyon..."
                      />
                    </div>
                  </FilterField>

                  {/* Intentions */}
                  <FilterField label="Intention">
                    <select
                      value={filters.intentions}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          intentions: event.target.value,
                        }))
                      }
                      className="select-explorer"
                    >
                      <option value="">Toutes</option>

                      {INTENTIONS_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="bg-gray-900"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  {/* Filtres premium */}
                  <div className="border-t border-white/10 pt-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Crown className="h-4 w-4 text-yellow-400" />

                      <span className="text-xs font-semibold text-yellow-300">
                        Filtres Premium
                      </span>

                      {!isPremium && (
                        <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-500">
                          <Lock className="h-3 w-3" />
                          Réservé
                        </span>
                      )}
                    </div>

                    <FilterField label="Orientation" className="mb-3">
                      <select
                        value={filters.orientation}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            orientation: event.target.value,
                          }))
                        }
                        disabled={!isPremium}
                        className="select-explorer disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <option value="">Toutes</option>

                        {ORIENTATION_OPTIONS.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                            className="bg-gray-900"
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FilterField>

                    <label
                      className={`flex cursor-pointer items-center gap-3 ${
                        !isPremium ? "cursor-not-allowed opacity-40" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.actif_recemment}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            actif_recemment: event.target.checked,
                          }))
                        }
                        disabled={!isPremium}
                        className="h-4 w-4 accent-purple-500"
                      />

                      <span className="text-xs text-gray-300 sm:text-sm">
                        Actif(ve) ces 7 derniers jours
                      </span>
                    </label>

                    {!isPremium && (
                      <p className="mt-2 text-[11px] text-gray-500 sm:text-xs">
                        <a
                          href="/paiement"
                          className="text-purple-400 hover:underline"
                        >
                          Passer Premium
                        </a>{" "}
                        pour accéder à ces filtres.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyFilters}
                    className={`w-full rounded-xl bg-gradient-to-r py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${accent.actionGradient}`}
                  >
                    Appliquer les filtres
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ─────────────────────────────
              Zone cartes
          ───────────────────────────── */}
          <section className="flex flex-1 flex-col">
            {isLoading && profiles.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="h-9 w-9 animate-spin text-purple-300" />
                <p className="text-sm text-gray-400">
                  Chargement des profils...
                </p>
              </div>
            ) : currentProfile ? (
              <>
                {/* Pile de cartes façon Tinder */}
                <div className="relative mx-auto h-[520px] w-full max-w-sm sm:h-[640px] sm:max-w-md">
                  <AnimatePresence mode="popLayout">
                    {stackedProfiles
                      .map((profile, index) => ({
                        profile,
                        stackIndex: index,
                      }))
                      .reverse()
                      .map(({ profile, stackIndex }) => {
                        const isTopCard = stackIndex === 0;

                        return (
                          <ProfileStackCard
                            key={profile._id}
                            profile={profile}
                            stackIndex={stackIndex}
                            isTopCard={isTopCard}
                            isLiking={isLiking}
                            likedIds={likedIds}
                            onPass={handlePass}
                            onLike={handleLike}
                            onReport={(profileId) => setReportProfileId(profileId)}
                            onOpenProfile={(profileId) =>
                              router.push(`/profil/${profileId}?from=explorer`)
                            }
                          />
                        );
                      })}
                  </AnimatePresence>
                </div>

                {/* Actions séparées, compactes, toujours visibles */}
                <div className="mt-3 flex items-center justify-center gap-5 sm:mt-5 sm:gap-6">
                  <button
                    type="button"
                    onClick={handlePass}
                    disabled={isLiking}
                    className="flex h-13 w-13 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white/15 disabled:opacity-50 sm:h-16 sm:w-16"
                    aria-label="Passer ce profil"
                  >
                    <X className="h-6 w-6 text-gray-200 sm:h-7 sm:w-7" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLike(currentProfile)}
                    disabled={isLiking || likedIds.has(currentProfile._id)}
                    className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br shadow-xl transition hover:scale-110 disabled:opacity-50 sm:h-20 sm:w-20 ${accent.actionGradient} ${accent.actionShadow}`}
                    aria-label="Liker ce profil"
                  >
                    {isLiking ? (
                      <Loader2 className="h-7 w-7 animate-spin text-white sm:h-8 sm:w-8" />
                    ) : (
                      <Heart
                        className={`h-7 w-7 text-white sm:h-8 sm:w-8 ${
                          likedIds.has(currentProfile._id) ? "fill-white" : ""
                        }`}
                      />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-center text-[11px] text-white/35 sm:text-xs">
                  Glisse la carte ou utilise les boutons.
                </p>
              </>
            ) : (
              <EmptyState onRefresh={() => fetchProfiles(true)} accent={accent} />
            )}
          </section>
        </main>
      </div>

      {/* Footer masqué sur mobile pour garder l'expérience Explorer très app-like. */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* Modale signalement profil */}
      <ReportModal
        isOpen={!!reportProfileId}
        onClose={() => setReportProfileId(null)}
        targetType="user"
        targetId={reportProfileId ?? ""}
      />

      <style jsx global>{`
        .input-explorer {
          width: 100%;
          border-radius: 0.65rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.1);
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          color: white;
          outline: none;
          transition:
            border-color 0.15s ease,
            background 0.15s ease;
        }

        .input-explorer:focus {
          border-color: rgba(192, 132, 252, 0.9);
          background: rgba(255, 255, 255, 0.13);
        }

        .input-explorer::placeholder {
          color: rgba(209, 213, 219, 0.7);
        }

        .select-explorer {
          width: 100%;
          border-radius: 0.65rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgb(17, 24, 39);
          padding: 0.5rem 0.75rem;
          font-size: 0.8125rem;
          color: white;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .select-explorer:focus {
          border-color: rgba(192, 132, 252, 0.9);
        }

        @media (min-width: 640px) {
          .input-explorer,
          .select-explorer {
            font-size: 0.875rem;
          }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────
// Carte de profil empilée façon Tinder
// ─────────────────────────────────────────────

function ProfileStackCard({
  profile,
  stackIndex,
  isTopCard,
  isLiking,
  likedIds,
  onPass,
  onLike,
  onReport,
  onOpenProfile,
}: {
  profile: Profile;
  stackIndex: number;
  isTopCard: boolean;
  isLiking: boolean;
  likedIds: Set<string>;
  onPass: () => void;
  onLike: (profile: Profile) => void;
  onReport: (profileId: string) => void;
  onOpenProfile: (profileId: string) => void;
}) {
  /**
   * Valeur horizontale du drag.
   * Elle sert à :
   * - déplacer la carte ;
   * - incliner la carte ;
   * - afficher les badges LIKE / PASS.
   */
  const x = useMotionValue(0);

  const rotate = useTransform(x, [-220, 0, 220], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [30, 120], [0, 1]);
  const passOpacity = useTransform(x, [-120, -30], [1, 0]);

  /**
   * Quand on lâche la carte :
   * - si elle est tirée à droite : like ;
   * - si elle est tirée à gauche : pass ;
   * - sinon elle revient au centre.
   */
  const handleDragEnd = () => {
    const value = x.get();

    if (value > 120) {
      onLike(profile);
      return;
    }

    if (value < -120) {
      onPass();
    }
  };

  const intentLabels = profile.intentions
    ?.map((intention) => {
      return (
        INTENTIONS_OPTIONS.find((option) => option.value === intention)?.label ??
        intention
      );
    })
    .slice(0, 2);

  return (
    <motion.article
      layout
      drag={isTopCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.82}
      onDragEnd={handleDragEnd}
      initial={{
        opacity: 0,
        scale: 0.96,
        y: 20,
      }}
      animate={{
        opacity: 1 - stackIndex * 0.14,
        scale: 1 - stackIndex * 0.045,
        y: stackIndex * 12,
        rotate: stackIndex === 1 ? -2 : stackIndex === 2 ? 2 : 0,
      }}
      exit={{
        opacity: 0,
        x: isTopCard ? -120 : 0,
        scale: 0.9,
        transition: { duration: 0.2 },
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 28,
      }}
      style={{
        x: isTopCard ? x : 0,
        rotate: isTopCard ? rotate : undefined,
        zIndex: 10 - stackIndex,
        pointerEvents: isTopCard ? "auto" : "none",
      }}
      className="absolute inset-0 overflow-hidden rounded-[1.7rem] border border-white/12 bg-white/8 shadow-2xl backdrop-blur-xl"
    >
      {/* Badges drag */}
      {isTopCard && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-5 top-6 z-20 rotate-[-10deg] rounded-2xl border-2 border-green-300 bg-green-500/20 px-4 py-2 text-lg font-black uppercase tracking-widest text-green-200 backdrop-blur"
          >
            Like
          </motion.div>

          <motion.div
            style={{ opacity: passOpacity }}
            className="pointer-events-none absolute right-5 top-6 z-20 rotate-[10deg] rounded-2xl border-2 border-red-300 bg-red-500/20 px-4 py-2 text-lg font-black uppercase tracking-widest text-red-200 backdrop-blur"
          >
            Pass
          </motion.div>
        </>
      )}

      {/* Photo */}
      <div className="relative h-[360px] bg-gradient-to-br from-purple-800/70 to-pink-800/40 sm:h-[450px]">
        {profile.image ? (
          <img
            src={profile.image}
            alt={profile.pseudonyme || "Luna"}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-5xl font-black shadow-2xl sm:h-32 sm:w-32">
              {(profile.pseudonyme || "L").charAt(0).toUpperCase()}
            </div>
          </div>
        )}

        {/* Filtre sombre bas */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />

        {/* Bouton signalement */}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onReport(profile._id);
          }}
          className="absolute right-3 top-3 rounded-xl bg-black/35 p-2 text-gray-200 backdrop-blur-sm transition hover:bg-black/55 hover:text-red-300"
          title="Signaler ce profil"
        >
          <Flag className="h-4 w-4" />
        </button>

        {/* Infos principales sur l'image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="max-w-[220px] truncate text-2xl font-black text-white sm:max-w-none sm:text-3xl">
              {profile.pseudonyme || "Luna"}
              {profile.age ? `, ${profile.age}` : ""}
            </h2>

            {profile.identityVerified && (
              <span className="rounded-full border border-green-400/30 bg-green-500/30 px-2 py-0.5 text-[11px] font-semibold text-green-200">
                ✓ Vérifiée
              </span>
            )}
          </div>

          {profile.localisation && (
            <p className="mt-1 flex items-center gap-1 text-xs text-gray-200 sm:text-sm">
              <MapPin className="h-3.5 w-3.5" />
              {profile.localisation}
            </p>
          )}

          <button
            type="button"
            onClick={() => onOpenProfile(profile._id)}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-pink-500/25 transition hover:scale-105 hover:opacity-90"
          >
            <User className="h-3.5 w-3.5" />
            Voir le profil
          </button>
        </div>
      </div>

      {/* Infos compactes sous image */}
      <div className="space-y-3 p-3 sm:p-5">
        {intentLabels?.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/35">
              Recherche
            </p>

            <div className="flex flex-wrap gap-1.5">
              {intentLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-purple-400/25 bg-purple-500/20 px-2.5 py-1 text-[11px] text-purple-100"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.interets?.length > 0 && (
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-white/35">
              Centres d&apos;intérêt
            </p>

            <div className="flex flex-wrap gap-1.5">
              {profile.interets.slice(0, 4).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full border border-white/10 bg-white/7 px-2.5 py-1 text-[11px] text-gray-200"
                >
                  {interest}
                </span>
              ))}

              {profile.interets.length > 4 && (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-400">
                  +{profile.interets.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {isTopCard && likedIds.has(profile._id) && (
          <p className="rounded-xl border border-pink-400/20 bg-pink-500/10 px-3 py-2 text-center text-xs text-pink-200">
            Profil déjà liké 💜
          </p>
        )}

        {isTopCard && isLiking && (
          <p className="flex items-center justify-center gap-2 text-xs text-white/50">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Action en cours...
          </p>
        )}
      </div>
    </motion.article>
  );
}

// ─────────────────────────────────────────────
// État vide
// ─────────────────────────────────────────────

function EmptyState({
  onRefresh,
  accent,
}: {
  onRefresh: () => void;
  accent: { titleGradient: string; actionGradient: string; actionShadow: string };
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center sm:py-24">
      <div className="flex h-18 w-18 items-center justify-center rounded-full bg-purple-500/20 sm:h-20 sm:w-20">
        <Sparkles className="h-9 w-9 text-purple-300 sm:h-10 sm:w-10" />
      </div>

      <div>
        <h3 className="mb-2 text-xl font-bold">Vous avez tout exploré !</h3>

        <p className="mx-auto max-w-xs text-sm text-gray-400">
          Il n&apos;y a plus de nouveaux profils pour le moment. Revenez plus
          tard ou modifiez vos filtres.
        </p>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        className={`flex items-center gap-2 rounded-xl bg-gradient-to-r px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 ${accent.actionGradient}`}
      >
        <RefreshCw className="h-5 w-5" />
        Rafraîchir
      </button>

      <p className="flex items-center gap-1 text-xs text-gray-500">
        <Crown className="h-4 w-4 text-yellow-400" />
        Les membres Premium voient plus de profils
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Petit wrapper de champ filtre
// ─────────────────────────────────────────────

function FilterField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[11px] text-gray-400 sm:text-xs">
        {label}
      </span>
      {children}
    </label>
  );
}