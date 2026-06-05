// src/app/mode-fantome/page.tsx

"use client";

/**
 * Page Mode Fantôme SferaLuna.
 *
 * Cette page permet à une utilisatrice Premium :
 * - d'activer le mode invisible ;
 * - de désactiver le mode invisible ;
 * - de comprendre ce que ce mode change dans l'expérience.
 *
 * Version mobile-first :
 * - hero très compact sur mobile ;
 * - contenu principal resserré ;
 * - explications en accordéon mobile ;
 * - version plus détaillée sur desktop ;
 * - footer masqué sur mobile pour une sensation app.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";

import { usePremium } from "@/hooks/usePremium";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ProfileVisibility = "public" | "matches" | "premium" | "invisible";

// ─────────────────────────────────────────────
// Données affichées dans les accordéons
// ─────────────────────────────────────────────

const ghostBenefits = [
  {
    icon: "👻",
    title: "Profil invisible",
    description:
      "Votre profil disparaît des résultats de recherche et de la page Explorer tant que le mode est actif.",
  },
  {
    icon: "🔍",
    title: "Navigation discrète",
    description:
      "Vous pouvez continuer à parcourir les profils sans être affichée dans les suggestions publiques.",
  },
  {
    icon: "💬",
    title: "Messages conservés",
    description:
      "Vos conversations et vos matches existants restent accessibles. Vous ne perdez aucun échange.",
  },
  {
    icon: "🛡️",
    title: "Contrôle renforcé",
    description:
      "Vous choisissez quand redevenir visible. Le contrôle reste entre vos mains, à tout moment.",
  },
];

export default function ModeFantomePage() {
  const { status } = useSession();
  const router = useRouter();

  /**
   * Hook Premium global.
   * isPremium doit être true uniquement si l'abonnement est actif.
   */
  const { isPremium, isLoading: premiumLoading } = usePremium();

  /**
   * Visibilité actuelle du profil.
   */
  const [visibilite, setVisibilite] = useState<ProfileVisibility | null>(null);

  /**
   * Loading du profil utilisateur.
   */
  const [loading, setLoading] = useState(true);

  /**
   * Loading pendant l'activation / désactivation.
   */
  const [toggling, setToggling] = useState(false);

  /**
   * Message d'erreur affiché dans l'interface.
   */
  const [error, setError] = useState("");

  /**
   * Accordéon mobile pour les explications.
   * null = aucun bloc ouvert.
   * 0 = premier bloc ouvert par défaut.
   */
  const [openInfoIndex, setOpenInfoIndex] = useState<number | null>(0);

  /**
   * Redirection si l'utilisateur n'est pas connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Récupération du profil connecté pour connaître sa visibilité actuelle.
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await fetch("/api/users/profile", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Impossible de récupérer votre profil.");
          return;
        }

        setVisibilite(data.user?.visibilite ?? "public");
      } catch {
        setError("Erreur de connexion au serveur.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [status]);

  const isInvisible = visibilite === "invisible";

  /**
   * Active ou désactive le mode fantôme.
   *
   * Important :
   * On passe par /api/users/profile car ton code actuel utilise déjà ce endpoint
   * pour mettre à jour visibilite.
   */
  const handleToggle = async () => {
    if (toggling) return;

    setToggling(true);
    setError("");

    const newVisibilite: ProfileVisibility = isInvisible
      ? "public"
      : "invisible";

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visibilite: newVisibilite,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error ?? "Erreur lors du changement de mode.");
        return;
      }

      setVisibilite(newVisibilite);
    } catch {
      setError("Erreur réseau. Réessayez dans quelques secondes.");
    } finally {
      setToggling(false);
    }
  };

  /**
   * Loading global.
   */
  if (status === "loading" || premiumLoading || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#0d0a1e] via-[#1a0b2e] to-[#2d1b69] text-white">
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
                Chargement du Mode Fantôme…
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
      <div className="min-h-screen bg-gradient-to-br from-[#0d0a1e] via-[#1a0b2e] to-[#2d1b69] text-white">
        <Header />

        <main className="mx-auto max-w-4xl px-4 pb-8 pt-20 sm:px-6 sm:pb-16 sm:pt-28">
          {/* ─────────────────────────────
              Hero compact mobile
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/8 p-4 text-center backdrop-blur-xl sm:mb-8 sm:p-8"
          >
            {/* Ghost SVG animé */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mx-auto mb-3 flex h-16 w-16 items-center justify-center sm:mb-5 sm:h-24 sm:w-24"
            >
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <ellipse
                  cx="40"
                  cy="38"
                  rx="30"
                  ry="30"
                  fill="white"
                  fillOpacity="0.14"
                />
                <ellipse
                  cx="40"
                  cy="35"
                  rx="22"
                  ry="24"
                  fill="white"
                  fillOpacity="0.92"
                />
                <rect
                  x="18"
                  y="55"
                  width="44"
                  height="16"
                  rx="4"
                  fill="white"
                  fillOpacity="0.92"
                />
                <path
                  d="M18 65 Q22 72 27 65 Q32 72 37 65 Q42 72 47 65 Q52 72 57 65 Q62 72 62 71 V71 H18 Z"
                  fill="white"
                  fillOpacity="0.92"
                />
                <ellipse cx="33" cy="33" rx="4" ry="5" fill="#1a0b2e" />
                <ellipse cx="47" cy="33" rx="4" ry="5" fill="#1a0b2e" />
              </svg>
            </motion.div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1 text-xs font-semibold text-purple-200">
              <Shield className="h-3.5 w-3.5" />
              Discrétion premium
            </div>

            <h1 className="bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-2xl font-black text-transparent sm:text-4xl">
              Mode Fantôme 👻
            </h1>

            <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-white/55 sm:text-base">
              Naviguez en toute discrétion sur SferaLuna. Vous choisissez quand
              être visible, et quand rester dans l&apos;ombre.
            </p>
          </motion.section>

          {/* ─────────────────────────────
              Message erreur global
          ───────────────────────────── */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="flex-1">{error}</span>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="text-red-200/70 hover:text-red-100"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─────────────────────────────
              Gate Premium
          ───────────────────────────── */}
          {!isPremium ? (
            <motion.section
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 text-center shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-400/10 sm:h-16 sm:w-16">
                <Lock className="h-7 w-7 text-purple-200 sm:h-8 sm:w-8" />
              </div>

              <h2 className="text-lg font-bold text-white sm:text-2xl">
                Fonctionnalité Premium
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
                Le Mode Fantôme est réservé aux membres avec un abonnement
                actif. Passez à un plan payant pour activer la navigation
                invisible.
              </p>

              <Link
                href="/paiement"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-pink-500 sm:w-auto"
              >
                Découvrir les offres
                <Sparkles className="h-4 w-4" />
              </Link>

              <p className="mt-3 text-xs text-white/35">
                Activation possible après validation de l&apos;abonnement.
              </p>
            </motion.section>
          ) : (
            <>
              {/* ─────────────────────────────
                  Toggle principal
              ───────────────────────────── */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-5 text-center shadow-2xl backdrop-blur-xl sm:mb-6 sm:p-8"
              >
                <div
                  className={`mb-5 inline-flex items-center gap-3 rounded-full px-4 py-2.5 text-sm sm:px-5 sm:py-3 sm:text-lg ${
                    isInvisible
                      ? "border border-green-400/40 bg-green-500/15 text-green-200"
                      : "border border-white/20 bg-white/10 text-white/65"
                  }`}
                >
                  {isInvisible ? (
                    <>
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-bold">Mode actif 👻</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="font-medium">Mode inactif</span>
                    </>
                  )}
                </div>

                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  {isInvisible
                    ? "Vous êtes invisible"
                    : "Votre profil est visible"}
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">
                  {isInvisible
                    ? "Votre profil est masqué dans les recherches et dans Explorer. Vous pouvez continuer à utiliser SferaLuna discrètement."
                    : "Votre profil peut apparaître dans les résultats, les suggestions et la page Explorer."}
                </p>

                <button
                  type="button"
                  onClick={handleToggle}
                  disabled={toggling}
                  className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto ${
                    isInvisible
                      ? "border border-white/25 bg-white/15 text-white hover:bg-white/25"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500"
                  }`}
                >
                  {toggling && <Loader2 className="h-4 w-4 animate-spin" />}

                  {!toggling &&
                    (isInvisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    ))}

                  {toggling
                    ? "Changement…"
                    : isInvisible
                      ? "Désactiver le mode"
                      : "Activer le mode fantôme"}
                </button>
              </motion.section>

              {/* ─────────────────────────────
                  Mobile : accordéon compact
              ───────────────────────────── */}
              <section className="space-y-2 sm:hidden">
                {ghostBenefits.map((item, index) => {
                  const isOpen = openInfoIndex === index;

                  return (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="overflow-hidden rounded-2xl border border-white/10 bg-white/8 backdrop-blur"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenInfoIndex(isOpen ? null : index)}
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-400/10 text-lg">
                          {item.icon}
                        </span>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold text-white">
                            {item.title}
                          </h3>

                          <p className="truncate text-[11px] text-white/45">
                            {item.description}
                          </p>
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
                            <div className="border-t border-white/10 px-3 pb-3 pt-2">
                              <p className="text-xs leading-relaxed text-white/60">
                                {item.description}
                              </p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </section>

              {/* ─────────────────────────────
                  Desktop : explication complète
              ───────────────────────────── */}
              <motion.section
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="hidden rounded-3xl border border-white/10 bg-white/6 p-6 backdrop-blur-xl sm:block"
              >
                <h3 className="mb-5 flex items-center gap-2 font-semibold text-white">
                  <Shield className="h-5 w-5 text-purple-200" />
                  Ce que fait le Mode Fantôme
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  {ghostBenefits.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="mb-3 text-2xl">{item.icon}</div>

                      <h4 className="mb-1 font-semibold text-white">
                        {item.title}
                      </h4>

                      <p className="text-sm leading-relaxed text-white/55">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.section>
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
