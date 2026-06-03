"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { EyeOff, Eye, Lock } from "lucide-react";
import { usePremium } from "@/hooks/usePremium";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ModeFantomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isPremium, isLoading: premiumLoading } = usePremium();

  const [visibilite, setVisibilite] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/users/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.success) setVisibilite(data.user?.visibilite ?? "public");
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status]);

  const isInvisible = visibilite === "invisible";

  const handleToggle = async () => {
    setToggling(true);
    setError("");
    const newVisibilite = isInvisible ? "public" : "invisible";
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilite: newVisibilite }),
      });
      const data = await res.json();
      if (data.success) {
        setVisibilite(newVisibilite);
      } else {
        setError(data.error ?? "Erreur lors du changement de mode.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setToggling(false);
    }
  };

  if (status === "loading" || premiumLoading || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#0d0a1e] via-[#1a0b2e] to-[#2d1b69] text-white">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white/60 text-lg">Chargement…</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#0d0a1e] via-[#1a0b2e] to-[#2d1b69] text-white">
        <Header />
        <main className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* Ghost SVG animé */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="inline-block mb-6"
            >
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="40" cy="38" rx="30" ry="30" fill="white" fillOpacity="0.15" />
                <ellipse cx="40" cy="35" rx="22" ry="24" fill="white" fillOpacity="0.9" />
                <rect x="18" y="55" width="44" height="16" rx="4" fill="white" fillOpacity="0.9" />
                {/* Bas festonné */}
                <path d="M18 65 Q22 72 27 65 Q32 72 37 65 Q42 72 47 65 Q52 72 57 65 Q62 72 62 71 V71 H18 Z" fill="white" fillOpacity="0.9" />
                {/* Yeux */}
                <ellipse cx="33" cy="33" rx="4" ry="5" fill="#1a0b2e" />
                <ellipse cx="47" cy="33" rx="4" ry="5" fill="#1a0b2e" />
              </svg>
            </motion.div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent">
              Mode Fantôme 👻
            </h1>
            <p className="text-white/60 mt-2">Naviguez en toute discrétion sur SferaLuna</p>
          </motion.div>

          {/* Gate premium */}
          {!isPremium ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center"
            >
              <Lock size={40} className="mx-auto mb-4 text-purple-300" />
              <h2 className="text-xl font-bold text-white mb-2">Fonctionnalité Premium</h2>
              <p className="text-white/60 mb-6">
                Le Mode Fantôme est réservé aux membres avec un abonnement actif.
                Passez à un plan payant pour activer la navigation invisible.
              </p>
              <Link
                href="/paiement"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                Découvrir les offres ✨
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Toggle principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center mb-6"
              >
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-full mb-6 ${isInvisible ? "bg-green-500/20 border border-green-500/40" : "bg-white/10 border border-white/20"}`}>
                  {isInvisible ? (
                    <>
                      <EyeOff size={18} className="text-green-400" />
                      <span className="font-bold text-green-300 text-lg">Mode actif 👻</span>
                    </>
                  ) : (
                    <>
                      <Eye size={18} className="text-white/60" />
                      <span className="font-medium text-white/60 text-lg">Mode inactif</span>
                    </>
                  )}
                </div>

                <p className="text-white/60 text-sm mb-6">
                  {isInvisible
                    ? "Votre profil est invisible. Vous parcourez en mode fantôme."
                    : "Votre profil est visible par les autres membres."}
                </p>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <button
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`px-8 py-3 rounded-full font-semibold transition-all disabled:opacity-50 ${
                    isInvisible
                      ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white"
                  }`}
                >
                  {toggling
                    ? "Changement…"
                    : isInvisible
                    ? "Désactiver le mode"
                    : "Activer le mode fantôme"}
                </button>
              </motion.div>

              {/* Explication */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
              >
                <h3 className="font-semibold text-white mb-4">Ce que fait le Mode Fantôme :</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-white/75 text-sm">
                    <span className="mt-0.5 text-purple-300 flex-shrink-0">👻</span>
                    Votre profil disparaît des résultats de recherche et de la page Explorer.
                  </li>
                  <li className="flex items-start gap-3 text-white/75 text-sm">
                    <span className="mt-0.5 text-purple-300 flex-shrink-0">🔍</span>
                    Vous pouvez quand même parcourir les profils et voir vos matches existants.
                  </li>
                  <li className="flex items-start gap-3 text-white/75 text-sm">
                    <span className="mt-0.5 text-purple-300 flex-shrink-0">💬</span>
                    Vos conversations en cours restent actives — vous pouvez continuer à discuter.
                  </li>
                </ul>
              </motion.div>
            </>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
