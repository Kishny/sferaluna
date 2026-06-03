"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ReportModal from "@/components/ReportModal";

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
  // Filtres premium
  orientation: string;
  actif_recemment: boolean;
}

const INTENTIONS_OPTIONS = [
  { value: "rencontre-serieuse", label: "Rencontre sérieuse" },
  { value: "amitie", label: "Amitié" },
  { value: "aventure", label: "Aventure" },
  { value: "reseautage", label: "Réseautage" },
  { value: "discussion", label: "Discussion" },
];

const ORIENTATION_OPTIONS = [
  { value: "hetero", label: "Hétérosexuel(le)" },
  { value: "homo", label: "Homosexuel(le)" },
  { value: "bi", label: "Bisexuel(le)" },
  { value: "pan", label: "Pansexuel(le)" },
  { value: "other", label: "Autre" },
];

export default function ExplorerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isPremium } = usePremium();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [matchModal, setMatchModal] = useState<{ profile: Profile; matchId: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [reportProfileId, setReportProfileId] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    age_min: "18",
    age_max: "99",
    intentions: "",
    localisation: "",
    orientation: "",
    actif_recemment: false,
  });

  const fetchProfiles = useCallback(
    async (reset = false) => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams();
        if (filters.age_min) params.set("age_min", filters.age_min);
        if (filters.age_max) params.set("age_max", filters.age_max);
        if (filters.intentions) params.set("intentions", filters.intentions);
        if (filters.localisation) params.set("localisation", filters.localisation);
        // Filtres premium — envoyés seulement si l'utilisateur est premium
        if (isPremium && filters.orientation) params.set("orientation", filters.orientation);
        if (isPremium && filters.actif_recemment) params.set("actif_recemment", "true");
        params.set("limit", "20");
        params.set("page", reset ? "1" : String(page));

        const res = await fetch(`/api/profiles?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!data.success) {
          console.error("Erreur chargement profils :", data.error);
          return;
        }

        if (reset) {
          setProfiles(data.profiles);
          setCurrentIndex(0);
          setPage(1);
        } else {
          setProfiles((prev) => [...prev, ...data.profiles]);
        }

        setHasMore(data.pagination?.hasMore ?? false);
      } catch (err) {
        console.error("Erreur fetchProfiles :", err);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, page]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchProfiles(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleApplyFilters = () => {
    setShowFilters(false);
    fetchProfiles(true);
  };

  const handleLike = async (profile: Profile) => {
    if (isLiking || likedIds.has(profile._id)) return;

    setIsLiking(true);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile._id }),
      });

      const data = await res.json();

      if (data.success) {
        setLikedIds((prev) => new Set([...prev, profile._id]));

        if (data.matched && data.matchId) {
          setMatchModal({ profile, matchId: data.matchId });
        } else {
          // Passer au profil suivant seulement si pas de match (le modal s'en charge)
          setCurrentIndex((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Erreur like :", err);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePass = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  // Enregistrer la visite dès qu'un profil est affiché
  useEffect(() => {
    const profile = profiles[currentIndex];
    if (!profile || status !== "authenticated") return;

    fetch("/api/visitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitedUserId: profile._id }),
    }).catch(() => {});
  }, [currentIndex, profiles, status]);

  // Charger plus de profils si on approche de la fin
  useEffect(() => {
    if (currentIndex >= profiles.length - 5 && hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [currentIndex, profiles.length, hasMore, isLoading]);

  useEffect(() => {
    if (page > 1) fetchProfiles(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const currentProfile = profiles[currentIndex] ?? null;
  const remainingCount = profiles.length - currentIndex;

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <Loader2 className="h-10 w-10 text-purple-300 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      <Header />

      {/* ── Modal Match ── */}
      <AnimatePresence>
        {matchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Fond blur */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Carte match */}
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="relative z-10 w-full max-w-sm rounded-3xl bg-gradient-to-br from-[#1a0b2e] to-[#3a2a82] border border-pink-400/30 shadow-2xl overflow-hidden"
            >
              {/* Confettis décoratifs */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {["💫","✨","🌟","💕","🌙","💜"].map((emoji, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-xl select-none"
                    initial={{ opacity: 0, y: 0, x: `${15 + i * 14}%` }}
                    animate={{ opacity: [0, 1, 0], y: -80 }}
                    transition={{ delay: i * 0.15, duration: 1.4, ease: "easeOut" }}
                    style={{ top: "60%" }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>

              <div className="relative p-8 text-center">
                {/* Titre */}
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm font-semibold text-pink-300 tracking-widest uppercase mb-2"
                >
                  C&apos;est un match !
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-3xl font-bold bg-gradient-to-r from-pink-300 to-purple-200 bg-clip-text text-transparent mb-6"
                >
                  💞 {matchModal.profile.pseudonyme}
                </motion.h2>

                {/* Avatar */}
                <motion.div
                  initial={{ scale: 0, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                  className="mx-auto h-28 w-28 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-5xl font-bold overflow-hidden border-4 border-pink-400/40 shadow-xl mb-6"
                >
                  {matchModal.profile.image ? (
                    <img src={matchModal.profile.image} alt={matchModal.profile.pseudonyme} className="h-full w-full object-cover" />
                  ) : (
                    matchModal.profile.pseudonyme.charAt(0).toUpperCase()
                  )}
                </motion.div>

                {/* Infos */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-white/60 text-sm mb-8"
                >
                  Vous vous êtes mutuellement likées.{" "}
                  {matchModal.profile.localisation && (
                    <span className="flex items-center justify-center gap-1 mt-1 text-white/40 text-xs">
                      <MapPin className="h-3 w-3" />
                      {matchModal.profile.localisation}
                    </span>
                  )}
                </motion.p>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-col gap-3"
                >
                  <Link
                    href={`/messages/${matchModal.matchId}`}
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-pink-500/30"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Envoyer un message
                  </Link>
                  <button
                    onClick={() => {
                      setMatchModal(null);
                      setCurrentIndex((prev) => prev + 1);
                    }}
                    className="w-full py-3 rounded-2xl border border-white/10 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition text-sm font-medium"
                  >
                    Continuer à explorer
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 pt-24 pb-8 max-w-2xl">
        {/* Header page */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
              Explorer
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              {remainingCount > 0
                ? `${remainingCount} profil${remainingCount > 1 ? "s" : ""} à découvrir`
                : "Tous les profils ont été explorés"}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchProfiles(true)}
              className="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              title="Rafraîchir"
            >
              <RefreshCw className="h-5 w-5 text-gray-300" />
            </button>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-gray-300"
            >
              <Filter className="h-4 w-4" />
              Filtres
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Panneau filtres */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-5 space-y-4">
                <h3 className="font-semibold text-white">Filtres de recherche</h3>

                {/* Âge */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs text-gray-400 mb-1 block">Âge min</span>
                    <input
                      type="number"
                      value={filters.age_min}
                      onChange={(e) => setFilters((f) => ({ ...f, age_min: e.target.value }))}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                      min={18}
                      max={120}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-gray-400 mb-1 block">Âge max</span>
                    <input
                      type="number"
                      value={filters.age_max}
                      onChange={(e) => setFilters((f) => ({ ...f, age_max: e.target.value }))}
                      className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                      min={18}
                      max={120}
                    />
                  </label>
                </div>

                {/* Localisation */}
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Ville / région</span>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.localisation}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, localisation: e.target.value }))
                      }
                      className="w-full bg-white/10 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                      placeholder="Paris, Lyon..."
                    />
                  </div>
                </label>

                {/* Intentions */}
                <label className="block">
                  <span className="text-xs text-gray-400 mb-1 block">Intention</span>
                  <select
                    value={filters.intentions}
                    onChange={(e) =>
                      setFilters((f) => ({ ...f, intentions: e.target.value }))
                    }
                    className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  >
                    <option value="">Toutes</option>
                    {INTENTIONS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-gray-900">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Filtres premium */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-4 w-4 text-yellow-400" />
                    <span className="text-xs font-semibold text-yellow-300">
                      Filtres Premium
                    </span>
                    {!isPremium && (
                      <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="h-3 w-3" />
                        Réservé aux abonnés
                      </span>
                    )}
                  </div>

                  {/* Orientation */}
                  <label className="block mb-3">
                    <span className="text-xs text-gray-400 mb-1 block">Orientation</span>
                    <select
                      value={filters.orientation}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, orientation: e.target.value }))
                      }
                      disabled={!isPremium}
                      className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <option value="">Toutes</option>
                      {ORIENTATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-gray-900">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Actif récemment */}
                  <label className={`flex items-center gap-3 cursor-pointer ${!isPremium ? "opacity-40 cursor-not-allowed" : ""}`}>
                    <input
                      type="checkbox"
                      checked={filters.actif_recemment}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, actif_recemment: e.target.checked }))
                      }
                      disabled={!isPremium}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <span className="text-sm text-gray-300">
                      Actif(ve) ces 7 derniers jours
                    </span>
                  </label>

                  {!isPremium && (
                    <p className="mt-2 text-xs text-gray-500">
                      <a href="/paiement" className="text-purple-400 hover:underline">
                        Passer Premium
                      </a>{" "}
                      pour accéder à ces filtres.
                    </p>
                  )}
                </div>

                <button
                  onClick={handleApplyFilters}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition"
                >
                  Appliquer les filtres
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carte profil */}
        {isLoading && profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 text-purple-300 animate-spin" />
            <p className="text-gray-400">Chargement des profils...</p>
          </div>
        ) : currentProfile ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentProfile._id}
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, x: -40 }}
              transition={{ duration: 0.25 }}
              className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl"
            >
              {/* Avatar / photo */}
              <div className="relative h-72 bg-gradient-to-br from-purple-800/60 to-pink-800/40 flex items-center justify-center">
                {currentProfile.image ? (
                  <img
                    src={currentProfile.image}
                    alt={currentProfile.pseudonyme}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl font-bold">
                    {currentProfile.pseudonyme.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Bouton signalement — coin supérieur droit */}
                <button
                  onClick={(e) => { e.stopPropagation(); setReportProfileId(currentProfile._id); }}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 backdrop-blur-sm text-gray-300 hover:text-red-400 hover:bg-black/60 transition"
                  title="Signaler ce profil"
                >
                  <Flag className="h-4 w-4" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-5">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {currentProfile.pseudonyme}
                    {currentProfile.age ? `, ${currentProfile.age} ans` : ""}
                    {currentProfile.identityVerified && (
                      <span className="text-xs font-medium bg-green-500/30 text-green-300 border border-green-400/30 rounded-full px-2 py-0.5">✓ Vérifiée</span>
                    )}
                  </h2>
                  {currentProfile.localisation && (
                    <p className="flex items-center gap-1 text-gray-300 text-sm mt-1">
                      <MapPin className="h-4 w-4" />
                      {currentProfile.localisation}
                    </p>
                  )}
                </div>
              </div>

              {/* Infos */}
              <div className="p-6 space-y-4">
                {/* Intentions */}
                {currentProfile.intentions?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recherche</p>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.intentions.map((intention) => (
                        <span
                          key={intention}
                          className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs"
                        >
                          {INTENTIONS_OPTIONS.find((o) => o.value === intention)?.label ??
                            intention}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Centres d'intérêt */}
                {currentProfile.interets?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Centres d&apos;intérêt</p>
                    <div className="flex flex-wrap gap-2">
                      {currentProfile.interets.slice(0, 5).map((interet) => (
                        <span
                          key={interet}
                          className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs"
                        >
                          {interet}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 pb-6 flex justify-center gap-6">
                <button
                  onClick={handlePass}
                  disabled={isLiking}
                  className="h-16 w-16 rounded-full border-2 border-white/20 bg-white/5 hover:bg-white/10 flex items-center justify-center transition hover:scale-105"
                >
                  <X className="h-7 w-7 text-gray-300" />
                </button>

                <button
                  onClick={() => handleLike(currentProfile)}
                  disabled={isLiking || likedIds.has(currentProfile._id)}
                  className="h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/30 hover:scale-110 transition disabled:opacity-50"
                >
                  {isLiking ? (
                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                  ) : (
                    <Heart
                      className={`h-8 w-8 text-white ${likedIds.has(currentProfile._id) ? "fill-white" : ""}`}
                    />
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* Plus de profils */
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="h-20 w-20 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-purple-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">
                Vous avez tout exploré !
              </h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Il n&apos;y a plus de nouveaux profils pour le moment. Revenez plus
                tard ou modifiez vos filtres.
              </p>
            </div>
            <button
              onClick={() => fetchProfiles(true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:opacity-90 transition flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Rafraîchir
            </button>
            <p className="text-gray-500 text-xs flex items-center gap-1">
              <Crown className="h-4 w-4 text-yellow-400" />
              Les membres Premium voient plus de profils
            </p>
          </div>
        )}
      </main>
    </div>
    <Footer />

    {/* Modale signalement profil */}
    <ReportModal
      isOpen={!!reportProfileId}
      onClose={() => setReportProfileId(null)}
      targetType="user"
      targetId={reportProfileId ?? ""}
    />
    </>
  );
}
