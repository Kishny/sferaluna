// src/app/vibeplanner/page.tsx

"use client";

/**
 * Page VibePlanner SferaLuna.
 *
 * Objectif :
 * - présenter une fonctionnalité bientôt disponible ;
 * - garder une page belle, compacte et cohérente avec le reste du site ;
 * - préparer la structure pour une future version dynamique.
 *
 * Version mobile-first :
 * - hero compact ;
 * - cards en accordéon sur mobile ;
 * - cards détaillées sur desktop ;
 * - footer masqué sur mobile pour éviter de surcharger l'écran.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  ChevronDown,
  Heart,
  Lightbulb,
  Loader2,
  MapPin,
  Sparkles,
  Users,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─────────────────────────────────────────────
// Données de présentation
// ─────────────────────────────────────────────

const plannerIdeas = [
  {
    emoji: "🎨",
    title: "Idées créatives",
    description:
      "Atelier peinture, expo immersive, carnet à deux, création d'une playlist commune…",
    icon: Lightbulb,
  },
  {
    emoji: "🌿",
    title: "Sorties nature",
    description:
      "Balade au parc, pique-nique lunaire, jardin botanique, coucher de soleil à deux…",
    icon: MapPin,
  },
  {
    emoji: "🛋️",
    title: "Soirées cosy",
    description:
      "Film choisi par vos vibes, dîner maison, conversation guidée, soirée sans pression…",
    icon: Heart,
  },
];

const futureFeatures = [
  {
    emoji: "💫",
    title: "Suggestions selon vos vibes",
    description:
      "Le VibePlanner proposera des idées selon vos centres d'intérêt, votre humeur et vos intentions.",
  },
  {
    emoji: "💜",
    title: "Activités pour chaque rythme",
    description:
      "Premier rendez-vous doux, moment complice, sortie spontanée ou activité plus intime.",
  },
  {
    emoji: "🌙",
    title: "Planning avec vos matchs",
    description:
      "À terme, vous pourrez proposer une activité directement depuis une conversation.",
  },
];

export default function VibePlannerPage() {
  const { status } = useSession();
  const router = useRouter();

  /**
   * Accordéon mobile.
   * null = aucun bloc ouvert.
   * 0 = premier bloc ouvert par défaut.
   */
  const [openIdeaIndex, setOpenIdeaIndex] = useState<number | null>(0);

  /**
   * VibePlanner est réservé aux utilisatrices connectées (même si l'aperçu
   * actuel n'est qu'une vitrine "bientôt disponible" : l'API /api/vibeplanner
   * existe déjà côté serveur et est protégée par session).
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Loading global — le temps que useSession() résolve son statut.
   */
  if (status === "loading" || status === "unauthenticated") {
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

              <p className="text-sm text-white/60">Chargement…</p>
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

        <main className="mx-auto max-w-5xl px-4 pb-8 pt-20 sm:px-6 sm:pb-16 sm:pt-28">
          {/* ─────────────────────────────
              Hero compact mobile
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 overflow-hidden rounded-3xl border border-white/10 bg-white/8 p-5 text-center shadow-2xl backdrop-blur-xl sm:mb-8 sm:p-10"
          >
            {/* Icône animée */}
            <motion.div
              animate={{
                rotate: [0, -8, 8, -8, 0],
                y: [0, -4, 0],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut",
              }}
              className="mb-3 text-5xl sm:mb-5 sm:text-7xl"
            >
              🗓️
            </motion.div>

            {/* Badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-200 sm:mb-5 sm:px-4 sm:text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Bientôt disponible
            </div>

            <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-3xl font-black text-transparent sm:text-5xl">
              VibePlanner
            </h1>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/60 sm:mt-5 sm:text-lg">
              Planifiez des idées de rendez-vous magiques avec vos matchs.
              Une fonctionnalité pensée pour éviter les blancs, réduire la
              pression et créer des moments vraiment alignés.
            </p>

            <div className="mt-5 flex flex-col justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-4">
              <Link
                href="/explorer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-pink-500 sm:w-auto sm:px-7"
              >
                Découvrir des profils
                <Users className="h-4 w-4" />
              </Link>

              <Link
                href="/fonctionnalites"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/8 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/14 hover:text-white sm:w-auto sm:px-7"
              >
                Voir les fonctionnalités
                <Sparkles className="h-4 w-4" />
              </Link>
            </div>
          </motion.section>

          {/* ─────────────────────────────
              Résumé compact
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="mb-5 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4"
          >
            {[
              { value: "3", label: "types d'idées" },
              { value: "IA", label: "suggestions" },
              { value: "Soon", label: "arrive vite" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/6 px-2 py-3 text-center backdrop-blur sm:px-4 sm:py-5"
              >
                <p className="text-lg font-black text-purple-200 sm:text-3xl">
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px] text-white/45 sm:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </motion.section>

          {/* ─────────────────────────────
              Mobile : idées en accordéon
          ───────────────────────────── */}
          <section className="space-y-2 sm:hidden">
            {plannerIdeas.map((item, index) => {
              const isOpen = openIdeaIndex === index;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/8 backdrop-blur"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdeaIndex(isOpen ? null : index)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-400/10 text-lg">
                      {item.emoji}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-sm font-bold text-white">
                        {item.title}
                      </h2>

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
              Desktop/tablette : cards complètes
          ───────────────────────────── */}
          <section className="hidden grid-cols-3 gap-4 sm:grid">
            {plannerIdeas.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="rounded-3xl border border-white/10 bg-white/8 p-6 shadow-xl backdrop-blur-xl transition"
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Icon className="h-7 w-7" />
                  </div>

                  <div className="mb-3 text-3xl">{item.emoji}</div>

                  <h2 className="mb-2 text-xl font-bold text-white">
                    {item.title}
                  </h2>

                  <p className="text-sm leading-relaxed text-white/55">
                    {item.description}
                  </p>
                </motion.article>
              );
            })}
          </section>

          {/* ─────────────────────────────
              Bloc "ce qui arrive"
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-5 rounded-3xl border border-purple-300/15 bg-purple-500/10 p-4 backdrop-blur-xl sm:mt-8 sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-400/15 text-xl">
                ✨
              </div>

              <div>
                <h2 className="text-base font-bold text-white sm:text-xl">
                  Ce que VibePlanner apportera
                </h2>

                <p className="text-xs text-white/45 sm:text-sm">
                  Une aide douce pour créer des moments qui ressemblent aux deux
                  personnes.
                </p>
              </div>
            </div>

            <div className="space-y-2 sm:grid sm:grid-cols-3 sm:gap-3 sm:space-y-0">
              {futureFeatures.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-white/6 p-3 sm:p-4"
                >
                  <div className="mb-2 text-xl">{item.emoji}</div>

                  <h3 className="mb-1 text-sm font-semibold text-white">
                    {item.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-white/50">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ─────────────────────────────
              Message final compact
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-center text-xs text-white/45 backdrop-blur sm:mt-8 sm:text-sm"
          >
            <Heart className="h-4 w-4 shrink-0 text-pink-400" />
            <span>Patience… cette fonctionnalité va vraiment servir 💜</span>
          </motion.section>
        </main>
      </div>

      {/* Footer masqué sur mobile pour garder une page compacte. */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
