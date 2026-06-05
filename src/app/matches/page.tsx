// src/app/matches/page.tsx

"use client";

/**
 * Page Mes Matches SferaLuna.
 *
 * Cette page gère :
 * - l'affichage des matches de l'utilisateur connecté ;
 * - la recherche par pseudonyme, localisation ou centres d'intérêt ;
 * - l'accès rapide à la conversation ;
 * - l'accès au profil public ;
 * - le signalement d'un profil depuis la liste ;
 * - le rafraîchissement manuel ;
 * - les états loading / erreur / vide ;
 * - un rendu mobile-first compact ;
 * - des cards accordéons sur mobile pour éviter de prendre trop de place.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  MapPin,
  Sparkles,
  Loader2,
  Search,
  RefreshCw,
  AlertCircle,
  X,
  User,
  ChevronRight,
  Flag,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MatchUser {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  interets: string[];
  intentions: string[];
  image?: string;
  identityVerified?: boolean;
}

interface MatchItem {
  matchId: string;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt: string | null;
  isActive?: boolean;
  user: MatchUser | null;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Formate une date en version lisible courte.
 * Exemple :
 * - À l'instant
 * - Il y a 5 min
 * - Il y a 2 h
 * - 09/06/2026
 */
function formatDate(dateStr: string | null) {
  if (!dateStr) return null;

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Retourne la première lettre du pseudonyme.
 * Sert d'avatar fallback si l'utilisateur n'a pas d'image.
 */
function getInitial(pseudonyme?: string) {
  return pseudonyme?.charAt(0)?.toUpperCase() || "?";
}

/**
 * Convertit une intention technique en texte affichable.
 * Tu pourras enrichir cette fonction plus tard selon tes vraies valeurs MongoDB.
 */
function formatIntention(intention: string) {
  const map: Record<string, string> = {
    "rencontre-serieuse": "Rencontre sérieuse",
    amitie: "Amitié",
    aventure: "Aventure",
    reseautage: "Réseautage",
    discussion: "Discussion",
  };

  return map[intention] ?? intention;
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function MatchesPage() {
  const { status } = useSession();
  const router = useRouter();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  /**
   * Accordéon mobile.
   * Sur mobile, chaque card est compacte par défaut.
   * Quand une card est ouverte, on affiche les infos secondaires.
   */
  const [openMatchId, setOpenMatchId] = useState<string | null>(null);

  /**
   * ID du profil à signaler.
   */
  const [reportUserId, setReportUserId] = useState<string | null>(null);

  /**
   * Redirection si non connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Charge les matches depuis l'API.
   *
   * refresh = true :
   * - active seulement l'animation du bouton refresh ;
   * - évite de remettre toute la page en loader plein écran.
   */
  const fetchMatches = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError("");

    try {
      const response = await fetch("/api/matches", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error ?? "Impossible de charger les matches.");
        return;
      }

      setMatches(data.matches ?? []);
    } catch (err) {
      console.error("Erreur fetchMatches :", err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Premier chargement après authentification.
   */
  useEffect(() => {
    if (status === "authenticated") {
      fetchMatches(false);
    }
  }, [status, fetchMatches]);

  /**
   * Recherche locale.
   *
   * On filtre côté client sur :
   * - pseudonyme ;
   * - localisation ;
   * - centres d'intérêt ;
   * - intentions.
   */
  const filteredMatches = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return matches;

    return matches.filter((match) => {
      const user = match.user;

      if (!user) return false;

      return (
        user.pseudonyme?.toLowerCase().includes(term) ||
        user.localisation?.toLowerCase().includes(term) ||
        user.interets?.some((interest) =>
          interest.toLowerCase().includes(term)
        ) ||
        user.intentions?.some((intention) =>
          intention.toLowerCase().includes(term)
        )
      );
    });
  }, [matches, searchTerm]);

  /**
   * Texte du compteur.
   */
  const counterLabel = useMemo(() => {
    if (isLoading) return "Chargement...";
    if (searchTerm.trim()) {
      return `${filteredMatches.length} résultat${
        filteredMatches.length > 1 ? "s" : ""
      }`;
    }

    return `${matches.length} match${matches.length > 1 ? "s" : ""}`;
  }, [filteredMatches.length, isLoading, matches.length, searchTerm]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-300" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <Header />

        <main className="mx-auto max-w-3xl px-3 pb-8 pt-20 sm:px-4 sm:pb-10 sm:pt-24">
          {/* Header page compact mobile */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm sm:mb-6 sm:bg-transparent sm:p-0 sm:border-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-pink-400/20 bg-pink-500/10 px-2.5 py-1 text-[11px] font-medium text-pink-200 sm:hidden">
                  <Heart className="h-3.5 w-3.5" />
                  Connexions Luna
                </div>

                <h1 className="truncate bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
                  Mes Matches
                </h1>

                <p className="mt-0.5 text-xs text-gray-400 sm:mt-1 sm:text-sm">
                  {counterLabel}
                </p>
              </div>

              <button
                type="button"
                onClick={() => fetchMatches(true)}
                disabled={isRefreshing}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-300 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                title="Rafraîchir"
                aria-label="Rafraîchir les matches"
              >
                <RefreshCw
                  className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
                />

                <span className="hidden sm:inline">Rafraîchir</span>
              </button>
            </div>
          </motion.div>

          {/* Recherche compacte */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative mb-4 sm:mb-6"
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none sm:py-3"
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-500 transition hover:bg-white/10 hover:text-white"
                aria-label="Effacer la recherche"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>

          {/* Erreur */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200 sm:mb-6 sm:px-4 sm:py-3"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-red-300 transition hover:text-white"
                  aria-label="Fermer l'erreur"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loader */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20 sm:py-24">
              <Loader2 className="h-10 w-10 animate-spin text-purple-300" />

              <p className="text-sm text-gray-400">
                Chargement de vos matches...
              </p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-5 rounded-3xl border border-white/10 bg-white/5 px-4 py-14 text-center backdrop-blur-sm sm:gap-6 sm:py-20"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/20 sm:h-20 sm:w-20">
                <Heart className="h-8 w-8 text-pink-300 sm:h-10 sm:w-10" />
              </div>

              <div>
                <h3 className="mb-2 text-lg font-bold sm:text-xl">
                  {searchTerm ? "Aucun résultat" : "Pas encore de matches"}
                </h3>

                <p className="mx-auto max-w-xs text-sm leading-relaxed text-gray-400">
                  {searchTerm
                    ? "Essaie un autre mot-clé, une ville ou un centre d'intérêt."
                    : "Commence à explorer des profils pour créer tes premiers matches."}
                </p>
              </div>

              {!searchTerm && (
                <Link
                  href="/explorer"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:px-6"
                >
                  <Sparkles className="h-5 w-5" />
                  Explorer des profils
                </Link>
              )}
            </motion.div>
          ) : (
            <>
              {/* Version mobile : cards accordéons compactes */}
              <div className="space-y-2.5 sm:hidden">
                {filteredMatches.map((match, index) => {
                  const user = match.user;

                  /**
                   * Sécurité UI :
                   * si l'API renvoie un match dont l'utilisateur n'existe plus,
                   * on évite de casser l'affichage.
                   */
                  if (!user) return null;

                  const isOpen = openMatchId === match.matchId;
                  const lastMessageDate = formatDate(match.lastMessageAt);
                  const matchDate = formatDate(match.createdAt);

                  return (
                    <motion.article
                      key={match.matchId}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.035, 0.25) }}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition"
                    >
                      {/* Ligne principale compacte */}
                      <div className="flex items-center gap-3 px-3 py-3">
                        <Link
                          href={`/profil/${user._id}?from=matches`}
                          className="relative shrink-0"
                          aria-label={`Voir le profil de ${user.pseudonyme}`}
                        >
                          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.pseudonyme}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              getInitial(user.pseudonyme)
                            )}
                          </div>

                          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1a0b2e] bg-green-400" />
                        </Link>

                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <Link
                              href={`/profil/${user._id}?from=matches`}
                              className="truncate text-sm font-bold text-white"
                            >
                              {user.pseudonyme}
                            </Link>

                            {user.age && (
                              <span className="shrink-0 text-xs text-gray-400">
                                {user.age}
                              </span>
                            )}

                            {user.identityVerified && (
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-300" />
                            )}
                          </div>

                          {user.localisation && (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                {user.localisation}
                              </span>
                            </p>
                          )}

                          <p className="mt-0.5 truncate text-[11px] text-gray-500">
                            {lastMessageDate
                              ? `Dernier message ${lastMessageDate}`
                              : `Match ${matchDate ?? "—"}`}
                          </p>
                        </div>

                        <Link
                          href={`/messages/${match.matchId}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-500/20 text-purple-300 transition hover:bg-purple-500/30"
                          title="Ouvrir la conversation"
                          aria-label={`Écrire à ${user.pseudonyme}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenMatchId(isOpen ? null : match.matchId)
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-purple-200 transition hover:bg-white/10"
                          aria-label={
                            isOpen
                              ? "Fermer les détails du match"
                              : "Ouvrir les détails du match"
                          }
                        >
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Contenu accordéon mobile */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-white/10 px-3 pb-3 pt-3">
                              {/* Dates */}
                              <div className="mb-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl bg-white/5 p-2">
                                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                    Match
                                  </p>

                                  <p className="mt-0.5 text-xs font-medium text-gray-300">
                                    {matchDate ?? "—"}
                                  </p>
                                </div>

                                <div className="rounded-xl bg-white/5 p-2">
                                  <p className="text-[10px] uppercase tracking-wide text-gray-500">
                                    Message
                                  </p>

                                  <p className="mt-0.5 text-xs font-medium text-gray-300">
                                    {lastMessageDate ?? "Aucun"}
                                  </p>
                                </div>
                              </div>

                              {/* Intentions */}
                              {user.intentions?.length > 0 && (
                                <div className="mb-3">
                                  <p className="mb-1.5 text-[11px] font-medium text-gray-400">
                                    Intentions
                                  </p>

                                  <div className="flex flex-wrap gap-1.5">
                                    {user.intentions.slice(0, 3).map((intention) => (
                                      <span
                                        key={intention}
                                        className="rounded-full border border-purple-400/20 bg-purple-500/15 px-2 py-1 text-[11px] text-purple-200"
                                      >
                                        {formatIntention(intention)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Intérêts */}
                              {user.interets?.length > 0 && (
                                <div className="mb-3">
                                  <p className="mb-1.5 text-[11px] font-medium text-gray-400">
                                    Centres d'intérêt
                                  </p>

                                  <div className="flex flex-wrap gap-1.5">
                                    {user.interets.slice(0, 6).map((interet) => (
                                      <span
                                        key={interet}
                                        className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-gray-300"
                                      >
                                        {interet}
                                      </span>
                                    ))}

                                    {user.interets.length > 6 && (
                                      <span className="rounded-full bg-white/5 px-2 py-1 text-[11px] text-gray-500">
                                        +{user.interets.length - 6}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Actions secondaires */}
                              <div className="grid grid-cols-2 gap-2">
                                <Link
                                  href={`/profil/${user._id}?from=matches`}
                                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
                                >
                                  <User className="h-4 w-4" />
                                  Profil
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => setReportUserId(user._id)}
                                  className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/20"
                                  title="Signaler ce profil"
                                  aria-label={`Signaler ${user.pseudonyme}`}
                                >
                                  <Flag className="h-4 w-4" />
                                  Signaler
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </div>

              {/* Version tablette / desktop : cards complètes */}
              <div className="hidden space-y-3 sm:block">
                {filteredMatches.map((match, index) => {
                  const user = match.user;

                  if (!user) return null;

                  const lastMessageDate = formatDate(match.lastMessageAt);
                  const matchDate = formatDate(match.createdAt);

                  return (
                    <motion.article
                      key={match.matchId}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.3) }}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        {/* Avatar + infos principales */}
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <Link
                            href={`/profil/${user._id}?from=matches`}
                            className="relative shrink-0"
                            aria-label={`Voir le profil de ${user.pseudonyme}`}
                          >
                            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xl font-bold">
                              {user.image ? (
                                <img
                                  src={user.image}
                                  alt={user.pseudonyme}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitial(user.pseudonyme)
                              )}
                            </div>

                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#1a0b2e] bg-green-400" />
                          </Link>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/profil/${user._id}?from=matches`}
                                className="truncate font-bold text-white transition hover:text-purple-200"
                              >
                                {user.pseudonyme}
                              </Link>

                              {user.age && (
                                <span className="shrink-0 text-sm text-gray-400">
                                  {user.age} ans
                                </span>
                              )}

                              {user.identityVerified && (
                                <span
                                  className="shrink-0 text-green-300"
                                  title="Profil vérifié"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </span>
                              )}
                            </div>

                            {user.localisation && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {user.localisation}
                                </span>
                              </p>
                            )}

                            {user.interets?.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {user.interets.slice(0, 3).map((interet) => (
                                  <span
                                    key={interet}
                                    className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-300"
                                  >
                                    {interet}
                                  </span>
                                ))}

                                {user.interets.length > 3 && (
                                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-500">
                                    +{user.interets.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3 border-t border-white/8 pt-3 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
                          <div className="min-w-0 text-right">
                            {lastMessageDate && (
                              <p className="text-xs text-gray-500">
                                Dernier message {lastMessageDate}
                              </p>
                            )}

                            <p className="text-xs text-gray-500">
                              Match {matchDate ?? "—"}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <Link
                              href={`/profil/${user._id}?from=matches`}
                              className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300 transition hover:bg-white/10 hover:text-white"
                            >
                              <User className="h-4 w-4" />
                              Profil
                            </Link>

                            <button
                              type="button"
                              onClick={() => setReportUserId(user._id)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 text-red-300 transition hover:bg-red-500/20"
                              title="Signaler ce profil"
                              aria-label={`Signaler ${user.pseudonyme}`}
                            >
                              <Flag className="h-4 w-4" />
                            </button>

                            <Link
                              href={`/messages/${match.matchId}`}
                              className="flex items-center gap-2 rounded-xl border border-purple-400/20 bg-purple-500/20 px-3 py-2 text-xs font-medium text-purple-300 transition hover:bg-purple-500/30"
                              title="Ouvrir la conversation"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span>Message</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Footer masqué sur mobile pour garder une sensation d'application */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      {/* Modale signalement profil */}
      <ReportModal
        isOpen={!!reportUserId}
        onClose={() => setReportUserId(null)}
        targetType="user"
        targetId={reportUserId ?? ""}
      />
    </>
  );
}
