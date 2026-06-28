// src/app/equipe/page.tsx

"use client";

/**
 * Page Équipe SferaLuna.
 *
 * Cette page gère :
 * - la présentation actuelle de l'équipe ;
 * - une section "équipe bientôt dévoilée" ;
 * - les valeurs internes du projet ;
 * - une future grille de membres d'équipe ;
 * - un CTA pour rejoindre / contacter l'équipe.
 *
 * Objectif mobile-first :
 * - page très compacte sur téléphone ;
 * - hero réduit ;
 * - valeurs en accordéon sur mobile ;
 * - futures cards équipe en accordéon sur mobile ;
 * - cards complètes uniquement à partir de sm/tablette ;
 * - footer masqué sur mobile pour éviter une page trop longue.
 */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  Mail,
  Shield,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ValueItem {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  desc: string;
}

interface TeamMember {
  emoji: string;
  role: string;
  title: string;
  description: string;
  status: string;
}

// ─────────────────────────────────────────────
// Données de la page
// ─────────────────────────────────────────────

/**
 * Valeurs de l'équipe.
 * Sur mobile, ces éléments deviennent des accordéons.
 */
const values: ValueItem[] = [
  {
    icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6" />,
    emoji: "💜",
    title: "Authenticité",
    desc: "Chaque décision est guidée par le souci de créer des connexions vraies, humaines et respectueuses.",
  },
  {
    icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
    emoji: "🛡️",
    title: "Sécurité",
    desc: "Nous voulons construire un environnement sûr, modéré et bienveillant pour toutes les utilisatrices.",
  },
  {
    icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
    emoji: "✨",
    title: "Innovation",
    desc: "Nos fonctionnalités sont pensées pour faciliter les vraies rencontres, pas pour créer une fatigue du swipe.",
  },
];

/**
 * Futures cards équipe.
 *
 * Pour l'instant, on reste volontairement sur des profils "rôles"
 * car l'équipe réelle n'est pas encore publiée.
 *
 * Quand tu voudras afficher de vraies personnes, il suffira de remplacer :
 * - emoji par image ;
 * - title par nom ;
 * - role par fonction ;
 * - description par bio courte.
 */
const teamPreview: TeamMember[] = [
  {
    emoji: "🌙",
    role: "Vision produit",
    title: "Direction créative",
    description:
      "Imagine l'expérience SferaLuna, la tonalité, les parcours et les fonctionnalités qui rendent le projet unique.",
    status: "Bientôt dévoilé",
  },
  {
    emoji: "🛡️",
    role: "Sécurité & confiance",
    title: "Modération",
    description:
      "Travaille sur la protection des utilisatrices, le signalement, la vérification et les règles communautaires.",
    status: "Bientôt dévoilé",
  },
  {
    emoji: "💻",
    role: "Développement",
    title: "Tech & plateforme",
    description:
      "Construit l'interface, les API, l'authentification, les matchs, la messagerie et les services premium.",
    status: "Bientôt dévoilé",
  },
  {
    emoji: "💬",
    role: "Communauté",
    title: "Expérience membre",
    description:
      "Écoute les retours, améliore les parcours et veille à garder une atmosphère douce, claire et inclusive.",
    status: "Bientôt dévoilé",
  },
];

// ─────────────────────────────────────────────
// Motif orbite décoratif
// ─────────────────────────────────────────────

/**
 * Motif orbite décoratif (cercles concentriques + points d'accent),
 * écho visuel du nom "Sfera".
 */
function OrbitGlow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute opacity-[0.14] ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke="#8E7AB5" strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke="#8E7AB5"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="34" fill="none" stroke="#8E7AB5" strokeWidth="1" />
      <circle cx="100" cy="10" r="3" fill="#5B4B8A" />
      <circle cx="190" cy="100" r="3" fill="#5B4B8A" />
      <circle cx="100" cy="190" r="3" fill="#5B4B8A" />
      <circle cx="10" cy="100" r="3" fill="#5B4B8A" />
    </svg>
  );
}

/**
 * Thèmes couleur cycliques pour les cards valeurs et équipe.
 */
const valueThemes = [
  { iconBg: "from-[#FF6B6B] to-[#FF8E8E]", bar: "from-[#FF6B6B] to-[#FF8E8E]" },
  { iconBg: "from-[#4ECDC4] to-[#8FE9E0]", bar: "from-[#4ECDC4] to-[#8FE9E0]" },
  { iconBg: "from-purple-100 to-pink-100", bar: "from-purple-400 to-pink-400" },
];

const teamThemes = [
  { iconText: "text-[#9D4EDD]", bar: "from-[#9D4EDD] to-[#C77DFF]", badge: "bg-[#9D4EDD]/10 text-[#7B2CBF]" },
  { iconText: "text-[#667EEA]", bar: "from-[#667EEA] to-[#764BA2]", badge: "bg-[#667EEA]/10 text-[#4F5FB8]" },
  { iconText: "text-[#4ECDC4]", bar: "from-[#4ECDC4] to-[#8FE9E0]", badge: "bg-[#4ECDC4]/10 text-[#2E8C84]" },
  { iconText: "text-[#FF6B9D]", bar: "from-[#FF6B9D] to-[#FF8E53]", badge: "bg-[#FF6B9D]/10 text-[#D14E80]" },
];

export default function EquipePage() {
  /**
   * Accordéon mobile des valeurs.
   * null = aucun bloc ouvert.
   */
  const [openValueIndex, setOpenValueIndex] = useState<number | null>(null);

  /**
   * Accordéon mobile des futures cards équipe.
   * null = aucun bloc ouvert.
   */
  const [openTeamIndex, setOpenTeamIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#faf9ff] text-[#1C1C1C]">
      <Header />

      <main className="relative overflow-hidden pt-16 sm:pt-20">
        <OrbitGlow className="right-[-10%] top-32 h-72 w-72 sm:h-96 sm:w-96" />
        <OrbitGlow className="left-[-12%] top-[55%] h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />

        {/* ─────────────────────────────
            Hero compact
        ───────────────────────────── */}
        <section className="relative px-4 py-6 sm:px-6 sm:py-12 md:py-14">
          {/* Fond doux */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]" />

          {/* Orbes décoratives légères */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-20 top-8 h-44 w-44 rounded-full bg-purple-300/30 blur-3xl sm:h-72 sm:w-72"
          />

          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.18, 0.35, 0.18] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-pink-300/25 blur-3xl sm:h-64 sm:w-64"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/80 px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm backdrop-blur sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Notre équipe
              </div>

              <h1 className="mx-auto max-w-3xl text-2xl font-black leading-tight text-[#1C1C1C] sm:text-4xl md:text-5xl">
                L&apos;équipe SferaLuna se{" "}
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  dévoilera bientôt
                </span>
              </h1>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#666] sm:mt-5 sm:text-lg">
                Nous construisons une expérience de rencontres plus sûre, plus
                humaine et plus élégante pour les femmes.
              </p>
            </motion.div>

            {/* Mini illustration compacte */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="mt-5 flex justify-center gap-3 sm:mt-8 sm:gap-6"
            >
              {["💜", "🌙", "✨", "💫", "🌸"].map((emoji, index) => (
                <motion.div
                  key={emoji}
                  animate={{ y: [0, -6, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.22,
                    ease: "easeInOut",
                  }}
                  className="text-2xl sm:text-4xl"
                >
                  {emoji}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            Valeurs
        ───────────────────────────── */}
        <section className="px-4 py-5 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="mb-4 text-center sm:mb-8"
            >
              <h2 className="text-xl font-black sm:text-3xl">
                Ce qui guide{" "}
                <span className="text-[#8E7AB5]">notre équipe</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-3 sm:text-base">
                Des principes simples, mais essentiels, pour construire une
                plateforme crédible.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {values.map((value, index) => {
                const isOpen = openValueIndex === index;
                const theme = valueThemes[index % valueThemes.length];

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm"
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.bar}`} />

                    <button
                      type="button"
                      onClick={() => setOpenValueIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme.iconBg} text-purple-600`}>
                        {value.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {value.emoji} {value.title}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {value.desc}
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
                          <div className="border-t border-purple-50 px-3 pb-3 pt-2">
                            <p className="text-xs leading-relaxed text-[#666]">
                              {value.desc}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop / tablette : cards complètes */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-3"
            >
              {values.map((value, index) => {
                const theme = valueThemes[index % valueThemes.length];

                return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="relative overflow-hidden rounded-2xl border border-purple-50 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.bar}`} />

                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${theme.iconBg} text-purple-600`}>
                    {value.icon}
                  </div>

                  <h3 className="mb-2 font-bold text-[#1C1C1C]">
                    {value.emoji} {value.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-[#666]">
                    {value.desc}
                  </p>
                </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            Aperçu de l'équipe / futures cards
        ───────────────────────────── */}
        <section className="bg-white px-4 py-5 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="mb-4 text-center sm:mb-8"
            >
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/15 bg-[#8E7AB5]/10 px-3 py-1 text-xs font-semibold text-[#8E7AB5]">
                <Users className="h-3.5 w-3.5" />
                Préparation de l&apos;équipe
              </div>

              <h2 className="text-xl font-black text-[#1C1C1C] sm:text-3xl">
                Les pôles SferaLuna
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-3 sm:text-base">
                Les profils réels seront ajoutés plus tard. La structure est
                déjà prête pour accueillir les futures cards.
              </p>
            </motion.div>

            {/* Mobile : accordéons équipe */}
            <div className="space-y-2 sm:hidden">
              {teamPreview.map((member, index) => {
                const isOpen = openTeamIndex === index;
                const theme = teamThemes[index % teamThemes.length];

                return (
                  <motion.div
                    key={member.role}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-[#f0ecff] bg-[#faf9ff] shadow-sm"
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.bar}`} />

                    <button
                      type="button"
                      onClick={() => setOpenTeamIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                        {member.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {member.title}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {member.role}
                        </p>
                      </div>

                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${theme.badge}`}>
                        bientôt
                      </span>

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
                          <div className="border-t border-[#f0ecff] px-3 pb-3 pt-2">
                            <p className="text-xs font-semibold text-[#8E7AB5]">
                              {member.status}
                            </p>

                            <p className="mt-1.5 text-xs leading-relaxed text-[#666]">
                              {member.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop / tablette : grille équipe */}
            <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4">
              {teamPreview.map((member, index) => {
                const theme = teamThemes[index % teamThemes.length];

                return (
                <motion.article
                  key={member.role}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -6 }}
                  className="relative overflow-hidden rounded-3xl border border-[#f0ecff] bg-[#faf9ff] p-5 text-center shadow-sm transition hover:shadow-md"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme.bar}`} />

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                    {member.emoji}
                  </div>

                  <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${theme.iconText}`}>
                    {member.role}
                  </p>

                  <h3 className="mb-2 font-bold text-[#1C1C1C]">
                    {member.title}
                  </h3>

                  <p className="mb-4 text-sm leading-relaxed text-[#666]">
                    {member.description}
                  </p>

                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                    {member.status}
                  </span>
                </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            CTA contact compact
        ───────────────────────────── */}
        <section className="px-4 py-6 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="overflow-hidden rounded-3xl border border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 p-4 text-center shadow-sm sm:p-8"
            >
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#8E7AB5] shadow-sm sm:mb-5 sm:h-14 sm:w-14">
                <WandSparkles className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>

              <h2 className="mb-2 text-lg font-black text-[#1C1C1C] sm:text-2xl">
                Envie de nous rejoindre ?
              </h2>

              <p className="mx-auto mb-4 max-w-xl text-sm leading-relaxed text-[#666] sm:mb-6 sm:text-base">
                SferaLuna est un projet porté par une vision forte. Si tu
                partages notre envie de créer une expérience plus sûre et plus
                humaine, écris-nous.
              </p>

              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-6"
              >
                <Mail className="h-4 w-4" />
                Nous contacter
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour garder une page courte et app-like. */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </div>
  );
}
