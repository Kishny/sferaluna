// src/app/fonctionnalites/page.tsx

"use client";

/**
 * Page Fonctionnalités SferaLuna.
 *
 * Cette page présente :
 * - les fonctionnalités principales ;
 * - une mise en avant détaillée de la fonctionnalité active sur desktop ;
 * - une version accordéon très compacte sur mobile ;
 * - les statistiques dynamiques ;
 * - un CTA final vers l'inscription ou les forfaits.
 *
 * Objectif mobile-first :
 * - réduire fortement la hauteur du hero ;
 * - éviter une navigation sticky trop volumineuse sur mobile ;
 * - transformer les cards en accordéons sur mobile ;
 * - garder une version premium, visuelle et plus détaillée sur tablette/desktop.
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HexagonSix from "@/components/icons/HexagonSix";

import {
  Brain,
  Calendar,
  ChevronDown,
  ChevronRight,
  Eye,
  Ghost,
  Heart,
  Lightbulb,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

interface FeatureItem {
  id: string;
  icon: React.ReactNode;
  mobileIcon: React.ReactNode;
  title: string;
  description: string;
  details: string;
  color: string;
  stats: string[];
  link: string;
  comingSoon?: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Formate les statistiques pour éviter les gros chiffres bruts.
 * Exemple :
 * 1200 -> 1.2K+
 * 1000 -> 1K+
 * 0 -> —
 */
function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K+`;
  if (n === 0) return "—";
  return n.toString();
}

// ─────────────────────────────────────────────
// Données fonctionnalités
// ─────────────────────────────────────────────

const features: FeatureItem[] = [
  {
    id: "circle",
    icon: <HexagonSix size={32} />,
    mobileIcon: <HexagonSix size={20} />,
    title: "Circle of Six",
    description: "Des liens choisis, pas des milliers de swipes.",
    details:
      "Chaque semaine, notre algorithme te présente 6 femmes qui correspondent à tes valeurs et intérêts. Une approche qualitative pour des rencontres plus authentiques.",
    color: "from-[#8E7AB5] to-[#D9B8FF]",
    stats: [
      "6 personnes par semaine",
      "Compatibilité optimisée",
      "Moins de fatigue du swipe",
    ],
    link: "/circle",
  },
  {
    id: "ghost",
    icon: <Ghost className="h-8 w-8" />,
    mobileIcon: <Ghost className="h-5 w-5" />,
    title: "Mode Fantôme",
    description: "Discrétion assurée, photos floutées, pseudonymes.",
    details:
      "Protège ton intimité avec des photos floutées et un pseudonyme. Tu décides quand et à qui révéler ton identité.",
    color: "from-[#4ECDC4] to-[#44A08D]",
    stats: [
      "Contrôle total",
      "Anonymat renforcé",
      "Activation rapide",
    ],
    link: "/mode-fantome",
  },
  {
    id: "vibesphere",
    icon: <Moon className="h-8 w-8" />,
    mobileIcon: <Moon className="h-5 w-5" />,
    title: "VibeSphere",
    description: "Exprime ta vibe dans ton espace personnalisé.",
    details:
      "Crée ton univers digital avec des playlists personnalisées, un journal émotionnel et des avatars d'humeur.",
    color: "from-[#FF6B6B] to-[#FF8E8E]",
    stats: [
      "Journal émotionnel",
      "Playlists personnalisées",
      "Avatars d'humeur",
    ],
    link: "/vibesphere",
  },
  {
    id: "vibeplanner",
    icon: <Lightbulb className="h-8 w-8" />,
    mobileIcon: <Lightbulb className="h-5 w-5" />,
    title: "VibePlanner",
    description: "Des idées de rendez-vous qui vous rassemblent.",
    details:
      'Plus jamais de "On fait quoi ?". Des suggestions créatives basées sur vos intérêts communs.',
    color: "from-[#FFD166] to-[#FF9A3C]",
    stats: [
      "Idées personnalisées",
      "Adapté aux budgets",
      "Planning intégré",
    ],
    link: "/vibeplanner",
  },
  {
    id: "events",
    icon: <Calendar className="h-8 w-8" />,
    mobileIcon: <Calendar className="h-5 w-5" />,
    title: "Événements Luna",
    description: "Participe à des moments inoubliables.",
    details:
      "Rejoins notre communauté lors d'événements exclusifs en ligne et en présentiel.",
    color: "from-[#9D4EDD] to-[#7B2CBF]",
    stats: [
      "Événements mensuels",
      "Communauté bienveillante",
      "Rencontres organisées",
    ],
    link: "/evenements",
    comingSoon: true,
  },
  {
    id: "coaching",
    icon: <Brain className="h-8 w-8" />,
    mobileIcon: <Brain className="h-5 w-5" />,
    title: "VibeMentor",
    description: "Sois guidée avec bienveillance et expertise.",
    details:
      "Accompagnement personnalisé pour naviguer dans tes relations et ton développement personnel.",
    color: "from-[#00B09B] to-[#96C93D]",
    stats: [
      "Coaching individuel",
      "Ateliers thématiques",
      "Ressources exclusives",
    ],
    link: "/vibementor",
    comingSoon: true,
  },
  {
    id: "security",
    icon: <Shield className="h-8 w-8" />,
    mobileIcon: <Shield className="h-5 w-5" />,
    title: "Sécurité Totale",
    description: "Un espace protégé et bienveillant.",
    details:
      "Modération, données protégées et outils de contrôle pour ton bien-être numérique.",
    color: "from-[#667EEA] to-[#764BA2]",
    stats: [
      "Modération active",
      "Données protégées",
      "Signalement rapide",
    ],
    link: "/securite",
  },
  {
    id: "community",
    icon: <Heart className="h-8 w-8" />,
    mobileIcon: <Heart className="h-5 w-5" />,
    title: "Communauté Luna",
    description: "Rejoins un réseau bienveillant de femmes.",
    details:
      "Échange, partage et grandis avec une communauté qui te comprend et te soutient.",
    color: "from-[#FF6B9D] to-[#FF8E53]",
    stats: [
      "Groupes thématiques",
      "Forum bienveillant",
      "Support entre membres",
    ],
    link: "/communaute",
  },
];

// ─────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: "easeOut" },
  },
};

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function FonctionnalitesPage() {
  /**
   * Fonction active sur tablette/desktop.
   * Sur mobile, on utilise plutôt openFeatureIndex pour l'accordéon.
   */
  const [activeFeature, setActiveFeature] = useState<string>("circle");

  /**
   * Accordéon mobile :
   * null = aucune fonctionnalité ouverte.
   */
  const [openFeatureIndex, setOpenFeatureIndex] = useState<number | null>(0);

  /**
   * État hover uniquement pour desktop.
   */
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  /**
   * Statistiques dynamiques.
   */
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  /**
   * Chargement des statistiques depuis /api/stats.
   */
  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setSiteStats(data.stats);
      })
      .catch(() => {});
  }, []);

  const selectedFeature =
    features.find((feature) => feature.id === activeFeature) || features[0];

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white pt-16 text-[#1C1C1C] sm:pt-20">
        {/* ─────────────────────────────
            Hero compact mobile
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-6 sm:px-6 sm:py-12 md:py-14">
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-[#FDF7FA]/80 via-[#F5F0FF]/60 to-[#E8DFFF]/40" />

            {/* Orbes décoratives réduites sur mobile */}
            <motion.div
              animate={{
                x: [0, 80, 0],
                y: [0, 35, 0],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 blur-3xl sm:h-64 sm:w-64"
            />

            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, -35, 0],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-[#FDF7FA]/20 to-[#8E7AB5]/10 blur-3xl sm:h-96 sm:w-96"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              {/* Badge compact */}
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.12, type: "spring" }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#5B4B8A] backdrop-blur sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
              >
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8E7AB5] sm:h-2 sm:w-2" />
                ✨ Expérience complète
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.65 }}
                className="text-3xl font-black leading-tight sm:text-5xl md:text-7xl"
              >
                <span className="bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent">
                  Fonctionnalités
                </span>

                <br />

                <span className="text-2xl font-light text-[#1C1C1C] sm:text-4xl md:text-6xl">
                  exclusives
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.65 }}
                className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#4B4B4B] sm:mt-6 sm:text-xl"
              >
                Conçues{" "}
                <span className="font-semibold text-[#8E7AB5]">pour toi</span>,
                pour ta liberté, ta sécurité et ta vibe.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            Mobile : accordéons fonctionnalités
        ───────────────────────────── */}
        <section className="bg-white px-4 py-5 sm:hidden">
          <div className="mx-auto max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="mb-4 text-center"
            >
              <h2 className="text-xl font-black text-[#1C1C1C]">
                Tout dans une expérience{" "}
                <span className="text-[#8E7AB5]">mobile-first</span>
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-[#666]">
                Ouvre une fonctionnalité pour voir l&apos;essentiel.
              </p>
            </motion.div>

            <div className="space-y-2">
              {features.map((feature, index) => {
                const isOpen = openFeatureIndex === index;

                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.035 }}
                    className="overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenFeatureIndex(isOpen ? null : index)
                      }
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white`}
                      >
                        {feature.mobileIcon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                            {feature.title}
                          </h3>

                          {feature.comingSoon && (
                            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              Bientôt
                            </span>
                          )}
                        </div>

                        <p className="truncate text-[11px] text-[#666]">
                          {feature.description}
                        </p>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
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
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2">
                            <p className="text-xs font-medium leading-relaxed text-[#1C1C1C]">
                              {feature.details}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {feature.stats.map((stat) => (
                                <span
                                  key={stat}
                                  className="rounded-full bg-[#8E7AB5]/10 px-2 py-1 text-[10px] font-medium text-[#5B4B8A]"
                                >
                                  {stat}
                                </span>
                              ))}
                            </div>

                            {feature.comingSoon ? (
                              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                ⏳ Cette fonctionnalité arrive bientôt.
                              </div>
                            ) : (
                              <Link
                                href={feature.link}
                                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#8E7AB5]"
                              >
                                Découvrir
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            Tablette / desktop : navigation sticky
        ───────────────────────────── */}
        <section className="sticky top-20 z-10 hidden border-b border-[#F0F0F0] bg-white px-4 py-4 sm:block md:px-6 md:py-5">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap justify-center gap-2">
              {features.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveFeature(feature.id)}
                  onMouseEnter={() => setHoveredFeature(feature.id)}
                  onMouseLeave={() => setHoveredFeature(null)}
                  className={`group relative flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-all ${
                    activeFeature === feature.id
                      ? `bg-gradient-to-r ${feature.color} border-transparent text-white`
                      : "border-[#E8E0FF] bg-white text-[#666] hover:border-[#8E7AB5]"
                  }`}
                >
                  <div
                    className={
                      activeFeature === feature.id
                        ? "text-white"
                        : "text-[#8E7AB5]"
                    }
                  >
                    {feature.mobileIcon}
                  </div>

                  <span className="font-medium">{feature.title}</span>

                  {feature.comingSoon && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        activeFeature === feature.id
                          ? "bg-white/20 text-white"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      Bientôt
                    </span>
                  )}

                  {activeFeature === feature.id && (
                    <motion.div
                      layoutId="activeFeature"
                      className="absolute inset-0 rounded-full border-2 border-white/30"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            Desktop / tablette : détail de la fonctionnalité active
        ───────────────────────────── */}
        <section className="hidden px-4 py-8 sm:block md:px-6">
          <div className="mx-auto max-w-6xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedFeature.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.3 }}
                className="grid items-center gap-10 lg:grid-cols-2"
              >
                {/* Colonne gauche - Détails */}
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <div
                      className={`rounded-2xl bg-gradient-to-r ${selectedFeature.color} p-4 text-white`}
                    >
                      {selectedFeature.icon}
                    </div>

                    <div>
                      <h2 className="text-4xl font-black text-[#1C1C1C]">
                        {selectedFeature.title}
                      </h2>

                      <p className="text-lg font-medium text-[#8E7AB5]">
                        {selectedFeature.description}
                      </p>
                    </div>
                  </div>

                  <p className="mb-8 text-lg leading-relaxed text-[#666]">
                    {selectedFeature.details}
                  </p>

                  <div className="mb-8 space-y-4">
                    {selectedFeature.stats.map((stat, index) => (
                      <motion.div
                        key={stat}
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08 }}
                        className="flex items-center gap-3"
                      >
                        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]" />
                        <span className="text-[#1C1C1C]">{stat}</span>
                      </motion.div>
                    ))}
                  </div>

                  {selectedFeature.comingSoon ? (
                    <div className="flex items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <span className="mt-0.5 text-2xl">⏳</span>

                      <div>
                        <p className="mb-1 font-semibold text-amber-800">
                          Bientôt disponible
                        </p>

                        <p className="text-sm leading-relaxed text-amber-700">
                          Cette fonctionnalité est en cours de déploiement. Tout
                          se met en place pour t&apos;offrir une expérience
                          propre, utile et fiable.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={selectedFeature.link}
                      className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] px-6 py-3 font-semibold text-white transition-all duration-300 hover:shadow-xl"
                    >
                      <span>Découvrir</span>
                      <ChevronRight className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  )}
                </div>

                {/* Colonne droite - Visuel simulé */}
                <div className="relative">
                  <div
                    className={`absolute -inset-4 rounded-3xl bg-gradient-to-r ${selectedFeature.color} opacity-20 blur-xl`}
                  />

                  <div className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] shadow-2xl">
                    <div className="bg-gradient-to-br from-[#1a1529] to-[#2d2750] p-6">
                      {/* En-tête mockup */}
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]" />

                          <div>
                            <div className="h-2 w-32 rounded bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]/50" />
                            <div className="mt-1 h-1 w-24 rounded bg-gradient-to-r from-[#8E7AB5]/30 to-transparent" />
                          </div>
                        </div>

                        <div className="text-white/60">
                          {selectedFeature.id === "ghost"
                            ? "👻 Mode"
                            : "✨ Premium"}
                        </div>
                      </div>

                      <div className="space-y-4">
                        {selectedFeature.id === "circle" && (
                          <>
                            <div className="text-center text-white">
                              <div className="mb-4 text-6xl">👥</div>
                              <h3 className="mb-2 text-2xl font-bold">
                                Ton Circle of Six
                              </h3>
                              <p className="text-white/80">
                                6 femmes qui partagent tes valeurs
                              </p>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              {["🎨", "📚", "🌿", "🎵", "🍳", "🧳"].map(
                                (emoji) => (
                                  <div
                                    key={emoji}
                                    className="flex aspect-square items-center justify-center rounded-xl bg-white/10"
                                  >
                                    <div className="text-2xl">{emoji}</div>
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        )}

                        {selectedFeature.id === "ghost" && (
                          <div className="text-center text-white">
                            <div className="mb-4 text-6xl">👻</div>
                            <h3 className="mb-2 text-2xl font-bold">
                              Mode Fantôme activé
                            </h3>
                            <p className="mb-4 text-white/80">
                              Ton profil est flouté pour protéger ton intimité.
                            </p>

                            <div className="flex justify-center gap-2">
                              <div className="rounded-full bg-white/10 px-3 py-1 text-sm">
                                Photos floutées
                              </div>

                              <div className="rounded-full bg-white/10 px-3 py-1 text-sm">
                                Pseudonyme
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedFeature.id === "vibesphere" && (
                          <div className="text-center text-white">
                            <div className="mb-4 text-6xl">🌌</div>
                            <h3 className="mb-2 text-2xl font-bold">
                              Ton VibeSphere
                            </h3>
                            <p className="text-white/80">
                              Exprime ton humeur du jour.
                            </p>

                            <div className="mt-4 flex justify-center gap-3">
                              {["🌿", "⚡️", "💭"].map((emoji) => (
                                <div
                                  key={emoji}
                                  className="rounded-lg bg-white/10 p-2 text-3xl"
                                >
                                  {emoji}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!["circle", "ghost", "vibesphere"].includes(
                          selectedFeature.id
                        ) && (
                          <div className="text-center text-white">
                            <div className="mb-4 text-6xl">✨</div>

                            <h3 className="mb-2 text-2xl font-bold">
                              {selectedFeature.title}
                            </h3>

                            <p className="text-white/80">
                              {selectedFeature.description}
                            </p>

                            <div className="mt-6 rounded-xl bg-white/5 p-4">
                              <div className="flex items-center justify-center gap-4">
                                <Eye className="text-white/60" />
                                <MessageCircle className="text-white/60" />
                                <Heart className="text-white/60" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* ─────────────────────────────
            Desktop / tablette : grille complète
        ───────────────────────────── */}
        <section className="hidden bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-10 sm:block md:px-6">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-8 text-center"
            >
              <h2 className="mb-4 text-4xl font-black text-[#1C1C1C]">
                Une expérience{" "}
                <span className="text-[#8E7AB5]">complète</span>
              </h2>

              <p className="mx-auto max-w-3xl text-xl text-[#666]">
                Tout ce dont tu as besoin pour créer des connexions
                authentiques.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {features.map((feature) => {
                const isActive = activeFeature === feature.id;
                const isInactive = activeFeature !== null && !isActive;

                return (
                  <motion.button
                    key={feature.id}
                    variants={itemVariants}
                    type="button"
                    onMouseEnter={() => setHoveredFeature(feature.id)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    onClick={() => setActiveFeature(feature.id)}
                    animate={{
                      opacity: isInactive ? 0.35 : 1,
                      scale: isActive ? 1.02 : 1,
                    }}
                    whileHover={{
                      opacity: isInactive ? 0.7 : 1,
                      scale: isActive ? 1.02 : 1.01,
                    }}
                    transition={{ duration: 0.2 }}
                    className="group relative cursor-pointer text-left"
                  >
                    <div
                      className={`relative h-full overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 ${
                        isActive
                          ? "border-[#8E7AB5]/30 shadow-xl shadow-[#8E7AB5]/20 ring-2 ring-[#8E7AB5]"
                          : "border-[#F0F0F0] shadow-lg hover:shadow-xl"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.color} transition-opacity duration-300 ${
                          isActive
                            ? "opacity-5"
                            : "opacity-0 group-hover:opacity-5"
                        }`}
                      />

                      <div className="relative z-10 mb-4 text-[#8E7AB5]">
                        {feature.icon}
                      </div>

                      <h3 className="relative z-10 mb-2 text-xl font-semibold text-[#1C1C1C]">
                        {feature.title}
                      </h3>

                      <p className="relative z-10 text-sm leading-relaxed text-[#666]">
                        {feature.description}
                      </p>

                      {feature.comingSoon && (
                        <div className="absolute right-4 top-4">
                          <div className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-1 text-xs font-medium text-white shadow-sm">
                            <span>⏳</span>
                            <span>Bientôt</span>
                          </div>
                        </div>
                      )}

                      {isActive && !feature.comingSoon && (
                        <div className="absolute right-4 top-4">
                          <div className="rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] px-2 py-1 text-xs font-medium text-white">
                            Actif
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            Statistiques compactes
        ───────────────────────────── */}
        <section className="bg-white px-4 py-5 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-3 gap-2 sm:gap-6">
              {[
                {
                  value: siteStats ? formatStat(siteStats.membres) : "…",
                  label: "Membres",
                  description: "Communauté active",
                  icon: "👩‍❤️‍👩",
                },
                {
                  value: siteStats ? formatStat(siteStats.matchs) : "…",
                  label: "Matchs",
                  description: "Connexions créées",
                  icon: "💜",
                },
                {
                  value: "24/7",
                  label: "Sécurité",
                  description: "Modération active",
                  icon: "🛡️",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-2xl border border-[#E8E0FF] bg-gradient-to-b from-[#F9F7FC] to-white px-2 py-3 text-center sm:rounded-3xl sm:p-6"
                >
                  <div className="mb-1 text-xl sm:mb-4 sm:text-4xl">
                    {stat.icon}
                  </div>

                  <div className="text-lg font-black text-[#5B4B8A] sm:text-5xl">
                    {stat.value}
                  </div>

                  <div className="mt-0.5 text-xs font-semibold text-[#1C1C1C] sm:mt-2 sm:text-xl">
                    {stat.label}
                  </div>

                  <div className="hidden text-[#666] sm:mt-2 sm:block">
                    {stat.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            CTA final compact mobile
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -left-1/2 -top-1/2 h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-2 text-2xl font-black leading-tight sm:mb-6 sm:text-5xl"
            >
              Prête à découvrir toutes nos{" "}
              <span className="text-white">fonctionnalités</span> ?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="mx-auto mb-4 max-w-2xl text-sm leading-relaxed opacity-90 sm:mb-10 sm:text-xl"
            >
              Rejoins des femmes qui utilisent déjà SferaLuna pour créer des
              connexions plus authentiques.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.22 }}
              className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <Link
                href="/auth?mode=register"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <span>Essayer gratuitement</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>

              <Link
                href="/tarifs"
                className="w-full rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                Voir les forfaits
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.32 }}
              className="mt-3 text-xs text-white/80 sm:mt-8 sm:text-base"
            >
              <span className="font-semibold">30 jours d&apos;essai premium</span>{" "}
              · Aucune carte requise · Annulation à tout moment
            </motion.p>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour garder une page plus courte et app-like. */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}