"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Heart, RefreshCw, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HexagonSix from "@/components/icons/HexagonSix";

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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatWeek(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function CirclePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [weekOf, setWeekOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ name: string } | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/circle");
      const data = await res.json();
      if (data.success) {
        setProfiles(data.profiles);
        setWeekOf(data.weekOf);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchProfiles();
  }, [status, fetchProfiles]);

  const handleLike = async (profile: Profile) => {
    if (likedIds.has(profile._id) || likingIds.has(profile._id)) return;

    setLikingIds((prev) => new Set(prev).add(profile._id));

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profile._id }),
      });
      const data = await res.json();
      if (data.success) {
        setLikedIds((prev) => new Set(prev).add(profile._id));
        if (data.matched) {
          setToast({ name: profile.pseudonyme });
          setTimeout(() => setToast(null), 3000);
        }
      }
    } catch {
      // silencieux
    } finally {
      setLikingIds((prev) => {
        const s = new Set(prev);
        s.delete(profile._id);
        return s;
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white/60 text-lg">Calcul de vos affinités…</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <Header />
        <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-white bg-clip-text text-transparent">
                <span className="inline-flex items-center gap-2">
                <HexagonSix size={36} />
                Circle of Six
              </span>
              </h1>
              <p className="text-white/60 mt-1 text-sm">Vos 6 affinités de la semaine</p>
              {weekOf && (
                <p className="text-purple-300 text-sm mt-1">Semaine du {formatWeek(weekOf)}</p>
              )}
            </div>
            <button
              onClick={fetchProfiles}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors border border-white/20 text-sm"
            >
              <RefreshCw size={14} />
              Actualiser
            </button>
          </motion.div>

          {/* Toast match */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-medium"
              >
                C&apos;est un match avec {toast.name} ! 💫
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          {profiles.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-24 text-white/50">
              <div className="flex justify-center mb-4 opacity-40">
                <HexagonSix size={64} />
              </div>
              <p className="text-lg">Aucun profil compatible cette semaine.</p>
              <p className="text-sm mt-2">Complétez votre profil pour de meilleures suggestions.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profiles.map((profile, i) => (
                <motion.div
                  key={profile._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:border-purple-400/50 transition-all"
                >
                  {/* Avatar + infos */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                      {profile.image ? (
                        <img src={profile.image} alt={profile.pseudonyme} className="w-full h-full object-cover" />
                      ) : (
                        getInitials(profile.pseudonyme)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {profile.pseudonyme}
                        {profile.age && <span className="text-white/60 font-normal">, {profile.age} ans</span>}
                      </p>
                      {profile.localisation && (
                        <div className="flex items-center gap-1 text-white/50 text-sm mt-0.5">
                          <MapPin size={11} />
                          <span>{profile.localisation}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Score de compatibilité */}
                  {typeof profile.compatibilityScore === "number" && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/50 flex items-center gap-1">
                          <Sparkles size={10} />
                          Compatibilité
                        </span>
                        <span className="text-xs font-semibold text-purple-300">
                          {Math.min(Math.round((profile.compatibilityScore / 30) * 100), 99)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((profile.compatibilityScore / 30) * 100, 99)}%` }}
                          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                        />
                      </div>
                      {profile.compatibilityHints && profile.compatibilityHints.length > 0 && (
                        <p className="text-xs text-white/40 mt-1 truncate">
                          {profile.compatibilityHints.slice(0, 2).join(" · ")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Intérêts */}
                  {profile.interets && profile.interets.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {profile.interets.slice(0, 3).map((interet) => (
                        <span
                          key={interet}
                          className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30"
                        >
                          {interet}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bouton like */}
                  <button
                    onClick={() => handleLike(profile)}
                    disabled={likedIds.has(profile._id) || likingIds.has(profile._id)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-all ${
                      likedIds.has(profile._id)
                        ? "bg-pink-500/20 text-pink-300 border border-pink-500/30 cursor-default"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white disabled:opacity-50"
                    }`}
                  >
                    <Heart size={14} fill={likedIds.has(profile._id) ? "currentColor" : "none"} />
                    {likedIds.has(profile._id) ? "Liké ✓" : likingIds.has(profile._id) ? "…" : "💜 Liker"}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
