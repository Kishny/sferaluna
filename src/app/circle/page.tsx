// src/app/circle/page.tsx

"use client";

/**
 * Page Circle of Six SferaLuna.
 *
 * Cette page affiche les 6 profils les plus compatibles de la semaine.
 *
 * Version mobile-first :
 * - hero très compact sur mobile ;
 * - cards mobiles en accordéon ;
 * - informations essentielles visibles immédiatement ;
 * - détails seulement à l'ouverture ;
 * - grille complète conservée sur tablette/desktop ;
 * - footer masqué sur mobile pour garder une sensation app.
 */

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HexagonSix from "@/components/icons/HexagonSix";

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
  compatibilityScore?: number;
  compatibilityHints?: string[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Retourne les initiales d'un pseudonyme.
 * Exemple : "Luna Rose" -> "LR"
 */
function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Formate la date de la semaine en français.
 */
function formatWeek(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "cette semaine";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Transforme le score brut en pourcentage visuel.
 * Ton backend semble envoyer un score sur 30.
 */
function getCompatibilityPercent(score?: number) {
  if (typeof score !== "number") return null;

  return Math.min(Math.round((score / 30) * 100), 99);
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function CirclePage() {
  const { status } = useSession();
  const router = useRouter();

  /**
   * Liste des profils du Circle of Six.
   */
  const [profiles, setProfiles] = useState<Profile[]>([]);

  /**
   * Date de référence de la semaine renvoyée par /api/circle.
   */
  const [weekOf, setWeekOf] = useState<string | null>(null);

  /**
   * États de chargement.
   */
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Profils déjà likés côté UI pour éviter les doubles clics.
   */
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  /**
   * Profils actuellement en cours de like.
   */
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  /**
   * Accordéon mobile.
   * null = aucune card ouverte.
   * 0 = première card ouverte par défaut.
   */
  const [openProfileIndex, setOpenProfileIndex] = useState<number | null>(0);

  /**
   * Toast de match.
   */
  const [toast, setToast] = useState<{ name: string } | null>(null);

  /**
   * Redirection si l'utilisateur n'est pas connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Chargement des profils Circle of Six.
   */
  const fetchProfiles = useCallback(async () => {
    setRefreshing(true);

    try {
      const res = await fetch("/api/circle", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setProfiles(data.profiles ?? []);
        setWeekOf(data.weekOf ?? null);

        /**
         * On ouvre automatiquement la première card sur mobile
         * quand des profils sont disponibles.
         */
        setOpenProfileIndex((data.profiles ?? []).length > 0 ? 0 : null);
      }
    } catch {
      /**
       * Silencieux volontairement :
       * tu peux ajouter un setError si tu veux afficher un message.
       */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Premier chargement après authentification.
   */
  useEffect(() => {
    if (status === "authenticated") {
      fetchProfiles();
    }
  }, [status, fetchProfiles]);

  /**
   * Like d'un profil.
   */
  const handleLike = async (profile: Profile) => {
    if (likedIds.has(profile._id) || likingIds.has(profile._id)) return;

    setLikingIds((prev) => new Set(prev).add(profile._id));

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId: profile._id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setLikedIds((prev) => new Set(prev).add(profile._id));

        /**
         * Si l'API indique un match, on affiche un toast.
         */
        if (data.matched) {
          setToast({ name: profile.pseudonyme });
          setTimeout(() => setToast(null), 3000);
        }
      }
    } catch {
      /**
       * Silencieux volontairement.
       */
    } finally {
      setLikingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(profile._id);
        return updated;
      });
    }
  };

  /**
   * Loading global.
   */
  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
          <Header />

          <main className="flex min-h-screen items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/10 backdrop-blur">
                <Loader2 className="h-8 w-8 animate-spin text-purple-200" />
              </div>

              <p className="text-sm text-white/60">
                Calcul de vos affinités…
              </p>
            </motion.div>
          </main>
        </div>

        <div className="hidden sm:block">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <Header />

        <main className="mx-auto max-w-6xl px-4 pb-8 pt-20 sm:px-6 sm:pb-16 sm:pt-28">
          {/* ─────────────────────────────
              Toast match
          ───────────────────────────── */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.96 }}
                className="fixed left-1/2 top-20 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-green-300/30 bg-green-500/90 px-4 py-3 text-center text-sm font-semibold text-white shadow-2xl backdrop-blur sm:top-24"
              >
                C&apos;est un match avec {toast.name} ! 💫
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────────────────────────
              Header page compact mobile
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur-xl sm:mb-8 sm:p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sélection hebdomadaire
                </div>

                <h1 className="flex items-center gap-2 bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-2xl font-black text-transparent sm:text-4xl">
                  <HexagonSix size={30} />
                  Circle of Six
                </h1>

                <p className="mt-1 text-xs leading-relaxed text-white/55 sm:text-sm">
                  Vos 6 affinités les plus alignées de la semaine.
                </p>

                {weekOf && (
                  <p className="mt-1 text-xs font-medium text-purple-300 sm:text-sm">
                    Semaine du {formatWeek(weekOf)}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={fetchProfiles}
                disabled={refreshing}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/15 disabled:opacity-60 sm:w-auto"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Actualiser
              </button>
            </div>
          </motion.section>

          {/* ─────────────────────────────
              État vide
          ───────────────────────────── */}
          {profiles.length === 0 ? (
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-4 py-14 text-center backdrop-blur"
            >
              <div className="mb-4 flex justify-center text-white/30">
                <HexagonSix size={64} />
              </div>

              <h2 className="text-lg font-bold text-white">
                Aucun profil compatible cette semaine.
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">
                Complétez votre profil pour obtenir de meilleures suggestions
                dans votre prochain Circle of Six.
              </p>

              <button
                type="button"
                onClick={() => router.push("/mon-compte?tab=profil")}
                className="mt-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:opacity-90"
              >
                Compléter mon profil
              </button>
            </motion.section>
          ) : (
            <>
              {/* ─────────────────────────────
                  Mobile : accordéons compacts
              ───────────────────────────── */}
              <section className="space-y-2 sm:hidden">
                {profiles.map((profile, index) => {
                  const isOpen = openProfileIndex === index;
                  const compatibilityPercent = getCompatibilityPercent(
                    profile.compatibilityScore
                  );
                  const isLiked = likedIds.has(profile._id);
                  const isLiking = likingIds.has(profile._id);

                  return (
                    <motion.article
                      key={profile._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.045 }}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/8 shadow-xl backdrop-blur"
                    >
                      {/* Header accordéon */}
                      <button
                        type="button"
                        onClick={() =>
                          setOpenProfileIndex(isOpen ? null : index)
                        }
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                      >
                        {/* Avatar compact */}
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                          {profile.image ? (
                            <img
                              src={profile.image}
                              alt={profile.pseudonyme}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(profile.pseudonyme)
                          )}
                        </div>

                        {/* Infos principales */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h2 className="truncate text-sm font-bold text-white">
                              {profile.pseudonyme}
                              {profile.age && (
                                <span className="font-normal text-white/55">
                                  , {profile.age}
                                </span>
                              )}
                            </h2>

                            {compatibilityPercent && (
                              <span className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-200">
                                {compatibilityPercent}%
                              </span>
                            )}
                          </div>

                          {profile.localisation && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-white/45">
                              <MapPin className="h-3 w-3" />
                              {profile.localisation}
                            </p>
                          )}
                        </div>

                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-purple-200 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

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
                              {/* Compatibilité */}
                              {compatibilityPercent !== null && (
                                <div className="mb-3">
                                  <div className="mb-1 flex items-center justify-between">
                                    <span className="flex items-center gap-1 text-[11px] text-white/45">
                                      <Sparkles className="h-3 w-3" />
                                      Compatibilité
                                    </span>

                                    <span className="text-xs font-semibold text-purple-200">
                                      {compatibilityPercent}%
                                    </span>
                                  </div>

                                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${compatibilityPercent}%`,
                                      }}
                                      transition={{
                                        delay: 0.1,
                                        duration: 0.65,
                                        ease: "easeOut",
                                      }}
                                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Hints de compatibilité */}
                              {profile.compatibilityHints &&
                                profile.compatibilityHints.length > 0 && (
                                  <div className="mb-3 flex flex-wrap gap-1.5">
                                    {profile.compatibilityHints
                                      .slice(0, 3)
                                      .map((hint) => (
                                        <span
                                          key={hint}
                                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/55"
                                        >
                                          {hint}
                                        </span>
                                      ))}
                                  </div>
                                )}

                              {/* Intérêts */}
                              {profile.interets?.length > 0 && (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                  {profile.interets.slice(0, 4).map((interet) => (
                                    <span
                                      key={interet}
                                      className="rounded-full border border-purple-400/25 bg-purple-500/15 px-2 py-1 text-[10px] text-purple-200"
                                    >
                                      {interet}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Actions compactes */}
                              <div className="grid grid-cols-[1fr_auto] gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/profil/${profile._id}?from=circle`
                                    )
                                  }
                                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/10"
                                >
                                  Voir le profil
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleLike(profile)}
                                  disabled={isLiked || isLiking}
                                  className={`flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                                    isLiked
                                      ? "border border-pink-400/30 bg-pink-500/20 text-pink-200"
                                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50"
                                  }`}
                                >
                                  {isLiking ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Heart
                                      className="h-3.5 w-3.5"
                                      fill={isLiked ? "currentColor" : "none"}
                                    />
                                  )}

                                  {isLiked ? "Liké" : "Liker"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </section>

              {/* ─────────────────────────────
                  Tablette / desktop : cards complètes
              ───────────────────────────── */}
              <section className="hidden grid-cols-1 gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile, index) => {
                  const compatibilityPercent = getCompatibilityPercent(
                    profile.compatibilityScore
                  );
                  const isLiked = likedIds.has(profile._id);
                  const isLiking = likingIds.has(profile._id);

                  return (
                    <motion.article
                      key={profile._id}
                      initial={{ opacity: 0, y: 28 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      whileHover={{ y: -6 }}
                      className="group overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl transition-all hover:border-purple-300/50"
                    >
                      {/* Avatar + infos */}
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold text-white">
                          {profile.image ? (
                            <img
                              src={profile.image}
                              alt={profile.pseudonyme}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(profile.pseudonyme)
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-white">
                            {profile.pseudonyme}
                            {profile.age && (
                              <span className="font-normal text-white/60">
                                , {profile.age} ans
                              </span>
                            )}
                          </p>

                          {profile.localisation && (
                            <div className="mt-0.5 flex items-center gap-1 truncate text-sm text-white/50">
                              <MapPin className="h-3 w-3" />
                              <span>{profile.localisation}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score de compatibilité */}
                      {compatibilityPercent !== null && (
                        <div className="mb-3">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-xs text-white/50">
                              <Sparkles className="h-3 w-3" />
                              Compatibilité
                            </span>

                            <span className="text-xs font-semibold text-purple-300">
                              {compatibilityPercent}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${compatibilityPercent}%` }}
                              transition={{
                                delay: 0.25,
                                duration: 0.8,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                          </div>

                          {profile.compatibilityHints &&
                            profile.compatibilityHints.length > 0 && (
                              <p className="mt-1 truncate text-xs text-white/40">
                                {profile.compatibilityHints
                                  .slice(0, 2)
                                  .join(" · ")}
                              </p>
                            )}
                        </div>
                      )}

                      {/* Intérêts */}
                      {profile.interets?.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {profile.interets.slice(0, 4).map((interet) => (
                            <span
                              key={interet}
                              className="rounded-full border border-purple-500/30 bg-purple-500/20 px-2.5 py-1 text-xs text-purple-300"
                            >
                              {interet}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/profil/${profile._id}?from=circle`)
                          }
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          Voir profil
                        </button>

                        <button
                          type="button"
                          onClick={() => handleLike(profile)}
                          disabled={isLiked || isLiking}
                          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                            isLiked
                              ? "cursor-default border border-pink-500/30 bg-pink-500/20 text-pink-300"
                              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
                          }`}
                        >
                          {isLiking ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Heart
                              className="h-4 w-4"
                              fill={isLiked ? "currentColor" : "none"}
                            />
                          )}

                          {isLiked ? "Liké" : "Liker"}
                        </button>
                      </div>
                    </motion.article>
                  );
                })}
              </section>
            </>
          )}
        </main>
      </div>

      {/* Footer masqué sur mobile pour garder une expérience plus compacte. */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
