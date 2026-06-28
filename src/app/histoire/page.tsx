'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Heart,
  MessageCircle,
  Moon,
  Shield,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

/**
 * Statistiques dynamiques affichées dans la page.
 * Ces données viennent de /api/stats.
 */
interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

/**
 * Type d'un élément de timeline.
 */
interface TimelineItem {
  period: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

/**
 * Type d'une valeur SferaLuna.
 */
interface ValueItem {
  icon: ReactNode;
  mobileIcon: string;
  title: string;
  description: string;
  color: string;
  bg: string;
}

/**
 * Motif "orbites" discret en arrière-plan — fait écho au nom "Sfera"
 * et casse le fond plat des sections. `variant="light"` s'utilise sur
 * fond sombre (hero, citation, CTA), `variant="default"` sur fond clair.
 */
function OrbitGlow({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'light';
}) {
  const primary = variant === 'light' ? '#FFFFFF' : '#8E7AB5';
  const secondary = variant === 'light' ? '#FFFFFF' : '#5B4B8A';
  const opacityClass = variant === 'light' ? 'opacity-[0.12]' : 'opacity-[0.16]';

  return (
    <svg
      viewBox="0 0 400 400"
      className={`pointer-events-none absolute ${opacityClass} ${className}`}
      fill="none"
    >
      <circle cx="200" cy="200" r="190" stroke={primary} strokeWidth="2" />
      <circle
        cx="200"
        cy="200"
        r="140"
        stroke={primary}
        strokeWidth="2"
        strokeDasharray="8 12"
      />
      <circle cx="200" cy="200" r="90" stroke={secondary} strokeWidth="2" />
      <circle cx="200" cy="200" r="5" fill={secondary} />
      <circle cx="390" cy="200" r="6" fill={primary} />
      <circle cx="60" cy="90" r="5" fill={primary} />
      <circle cx="310" cy="320" r="4.5" fill={secondary} />
    </svg>
  );
}

/**
 * Formate les statistiques pour éviter les gros chiffres bruts.
 *
 * Exemples :
 * 1200 -> 1.2K+
 * 1000 -> 1K+
 * 0 -> —
 */
function formatStat(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}K+`;
  if (n === 0) return '—';
  return n.toString();
}

/**
 * Page Histoire SferaLuna.
 *
 * Objectif de cette version :
 * - garder le contenu existant ;
 * - améliorer fortement le mobile-first ;
 * - compacter les grosses sections sur mobile ;
 * - transformer timeline + valeurs en accordéons sur mobile ;
 * - conserver une mise en page riche sur tablette / desktop ;
 * - éviter les grands blocs qui prennent tout l'écran du téléphone.
 */
export default function HistoirePage() {
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  /**
   * Accordéon mobile de la timeline.
   * null = aucun bloc ouvert.
   */
  const [openTimelineIndex, setOpenTimelineIndex] = useState<number | null>(0);

  /**
   * Accordéon mobile des valeurs.
   * null = aucun bloc ouvert.
   */
  const [openValueIndex, setOpenValueIndex] = useState<number | null>(null);

  /**
   * Chargement des statistiques dynamiques.
   * Si l'API échoue, la page reste fonctionnelle.
   */
  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSiteStats(data.stats);
      })
      .catch(() => {
        // On ignore volontairement l'erreur pour ne pas bloquer l'affichage.
      });
  }, []);

  /**
   * Timeline de l'histoire SferaLuna.
   */
  const timeline: TimelineItem[] = [
    {
      period: 'Printemps 2024',
      title: 'Le déclic',
      description:
        "Tout part d'un constat simple et douloureux : les applications de rencontres ne sont pas conçues pour les femmes. Elles sont pensées pour le volume, pas pour la qualité. Pour la vitesse, pas pour la profondeur. SferaLuna naît de cette frustration — et de la conviction qu'on peut faire bien mieux.",
      icon: '💡',
      color: 'from-[#8E7AB5] to-[#D9B8FF]',
    },
    {
      period: 'Été 2024',
      title: 'La construction',
      description:
        "Des mois de travail, de réflexion, de tests. Chaque fonctionnalité est pensée avec une seule question en tête : est-ce que ça aide vraiment les femmes à rencontrer des personnes qui leur correspondent ? Le Circle of Six, le VibeSphere, le Mode Fantôme — tout est conçu pour mettre la femme au centre.",
      icon: '🔨',
      color: 'from-[#FF6B6B] to-[#FF8E8E]',
    },
    {
      period: 'Automne 2024',
      title: 'Les premières vagues',
      description:
        "Les premières utilisatrices arrivent. Leurs retours sont précieux, parfois brutaux, toujours utiles. On écoute, on ajuste, on améliore. La messagerie se perfectionne. Les matchs commencent à se former. Les premières histoires d'amour naissent sur SferaLuna.",
      icon: '🌊',
      color: 'from-[#4ECDC4] to-[#44A08D]',
    },
    {
      period: 'Hiver 2024 – 2025',
      title: "La communauté s'éveille",
      description:
        "SferaLuna grandit au-delà des rencontres. VibeMentor, les Événements Luna, la Communauté — autant d'espaces où les femmes échangent, s'entraident et construisent quelque chose ensemble. Ce n'est plus seulement une app de rencontres. C'est un refuge.",
      icon: '✨',
      color: 'from-[#FFD166] to-[#FF9A3C]',
    },
    {
      period: "Aujourd'hui",
      title: 'Le voyage continue',
      description:
        "SferaLuna évolue chaque jour. Notifications en temps réel, upload de photos, vérification des profils, nouvelles fonctionnalités premium — chaque mise à jour a un seul objectif : vous offrir l'expérience de rencontres que vous méritez vraiment.",
      icon: '🌙',
      color: 'from-[#5B4B8A] to-[#8E7AB5]',
    },
  ];

  /**
   * Valeurs fortes de la plateforme.
   */
  const values: ValueItem[] = [
    {
      icon: <Shield className="h-7 w-7" />,
      mobileIcon: '🛡️',
      title: "La sécurité d'abord",
      description:
        'Modération active, signalement, Mode Fantôme, vérification email — chaque décision technique est guidée par la sécurité des femmes sur la plateforme.',
      color: 'text-[#8E7AB5]',
      bg: 'bg-purple-50',
    },
    {
      icon: <Heart className="h-7 w-7" />,
      mobileIcon: '💜',
      title: "L'authenticité toujours",
      description:
        'Pas de swipe frénétique. Pas de filtre artificiel. SferaLuna valorise ce que tu es vraiment — tes valeurs, tes envies, ta vibe.',
      color: 'text-[#FF6B6B]',
      bg: 'bg-red-50',
    },
    {
      icon: <Users className="h-7 w-7" />,
      mobileIcon: '👭',
      title: 'Une communauté réelle',
      description:
        "SferaLuna n'est pas qu'une app. C'est un espace où les femmes s'entraident, échangent et se retrouvent — même au-delà des rencontres romantiques.",
      color: 'text-[#4ECDC4]',
      bg: 'bg-teal-50',
    },
    {
      icon: <Sparkles className="h-7 w-7" />,
      mobileIcon: '✨',
      title: "L'expérience féminine",
      description:
        'Conçu par et pour les femmes. Chaque parcours, chaque couleur, chaque mot a été pensé pour que tu te sentes enfin à ta place.',
      color: 'text-[#FFD166]',
      bg: 'bg-yellow-50',
    },
  ];

  /**
   * Thème couleur par carte de valeur (desktop) — contour/fond lumineux
   * distinct pour chacune, aligné sur les teintes déjà utilisées par
   * `value.bg` / `value.color` (purple, rouge corail, teal, jaune).
   */
  const valueThemes = [
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(142,122,181,0.4),0_14px_32px_-10px_rgba(142,122,181,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(142,122,181,0.4),0_22px_48px_-12px_rgba(142,122,181,0.45)]',
      overlay: 'from-purple-100 via-white to-white',
      iconBg: 'bg-purple-50',
      bar: 'from-violet-500 to-purple-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(255,107,107,0.4),0_14px_32px_-10px_rgba(255,107,107,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(255,107,107,0.4),0_22px_48px_-12px_rgba(255,107,107,0.45)]',
      overlay: 'from-red-100 via-white to-white',
      iconBg: 'bg-red-50',
      bar: 'from-red-400 to-rose-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(78,205,196,0.4),0_14px_32px_-10px_rgba(78,205,196,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(78,205,196,0.4),0_22px_48px_-12px_rgba(78,205,196,0.45)]',
      overlay: 'from-teal-100 via-white to-white',
      iconBg: 'bg-teal-50',
      bar: 'from-teal-400 to-cyan-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(255,209,102,0.4),0_14px_32px_-10px_rgba(255,209,102,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(255,209,102,0.4),0_22px_48px_-12px_rgba(255,209,102,0.45)]',
      overlay: 'from-yellow-100 via-white to-white',
      iconBg: 'bg-yellow-50',
      bar: 'from-amber-400 to-yellow-500',
    },
  ];

  const proofItems = [
    {
      emoji: '🛡️',
      text: 'Sécurité des femmes avant tout',
    },
    {
      emoji: '💜',
      text: 'Connexions par valeurs',
    },
    {
      emoji: '🌙',
      text: 'Espace bienveillant',
    },
    {
      emoji: '✨',
      text: 'Communauté évolutive',
    },
  ];

  const stats = [
    {
      stat: siteStats ? formatStat(siteStats.membres) : '…',
      label: 'Membres',
      icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    {
      stat: siteStats ? formatStat(siteStats.matchs) : '…',
      label: 'Matchs',
      icon: <Heart className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    {
      stat: siteStats ? formatStat(siteStats.messages) : '…',
      label: 'Messages',
      icon: <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    {
      stat: siteStats ? formatStat(siteStats.evenements) : '…',
      label: 'Events',
      icon: <Star className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-[#faf9ff] pt-14 text-[#1C1C1C] sm:pt-16 lg:pt-20">
        {/* ─────────────────────────────
            HERO COMPACT MOBILE
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-14 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]" />

          {/* Orbes décoratifs réduits sur mobile */}
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.25, 0.45, 0.25],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute left-1/4 top-12 h-44 w-44 rounded-full bg-purple-500/20 blur-3xl sm:h-72 sm:w-72"
          />

          <motion.div
            animate={{
              scale: [1.1, 1, 1.1],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute bottom-0 right-1/4 h-52 w-52 rounded-full bg-pink-500/15 blur-3xl sm:h-96 sm:w-96"
          />

          <OrbitGlow
            variant="light"
            className="right-[-6%] top-1/2 h-72 w-72 -translate-y-1/2 sm:h-96 sm:w-96"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm sm:mb-8 sm:px-4 sm:py-2 sm:text-sm">
                <Moon className="h-3.5 w-3.5 text-purple-300 sm:h-4 sm:w-4" />

                <span className="text-purple-100">
                  Née en 2024 · Made in France
                </span>
              </div>

              <h1 className="mb-3 text-3xl font-black leading-tight sm:mb-6 sm:text-5xl md:text-7xl">
                Notre{' '}
                <span className="bg-gradient-to-r from-[#D9B8FF] to-[#FFB3D9] bg-clip-text text-transparent">
                  histoire
                </span>
              </h1>

              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/75 sm:text-lg md:text-xl">
                Tout a commencé par une question : pourquoi les femmes
                mériteraient moins bien dans les rencontres en ligne ?
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            INTRO COMPACTE
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 sm:h-[34rem] sm:w-[34rem]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="grid gap-5 md:grid-cols-2 md:items-center md:gap-12"
            >
              <div>
                <h2 className="mb-3 text-xl font-black leading-tight text-[#1C1C1C] sm:mb-6 sm:text-3xl md:text-4xl">
                  Pourquoi{' '}
                  <span className="text-[#8E7AB5]">SferaLuna</span> existe
                </h2>

                {/* Texte mobile raccourci visuellement par tailles + spacing compact */}
                <div className="space-y-3 text-sm leading-relaxed text-[#555] sm:text-base">
                  <p>
                    En 2024, on a regardé les applications de rencontres et on a
                    vu le même problème : trop de volume, trop peu de vraie
                    qualité.
                  </p>

                  <p>
                    Les femmes y subissent trop souvent des interactions non
                    désirées, un manque de sécurité et des algorithmes centrés
                    sur l’apparence.
                  </p>

                  <p>
                    SferaLuna est notre réponse : une plateforme premium,
                    sécurisée, authentique et pensée pour l’expérience féminine.
                  </p>
                </div>
              </div>

              {/* Cartes preuves : compactes sur mobile */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-1 md:gap-4">
                {proofItems.map((item, index) => (
                  <motion.div
                    key={item.text}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="flex items-center gap-3 rounded-2xl border border-[#f0ecff] bg-white px-3 py-2.5 shadow-sm sm:p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-lg sm:text-2xl">
                      {item.emoji}
                    </span>

                    <span className="text-sm font-semibold text-[#444] sm:text-base">
                      {item.text}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            TIMELINE
            Mobile = accordéon compact
            Desktop = timeline complète
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-white px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="left-[-8%] top-1/4 h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />
          <OrbitGlow className="right-[-8%] bottom-0 h-72 w-72 sm:h-[26rem] sm:w-[26rem]" />

          <div className="relative z-10 mx-auto max-w-5xl">
            <div className="mb-4 text-center sm:mb-10">
              <h2 className="mb-1 text-xl font-black text-[#1C1C1C] sm:mb-4 sm:text-4xl">
                Le <span className="text-[#8E7AB5]">parcours</span>
              </h2>

              <p className="text-xs text-[#666] sm:text-lg">
                De l’idée à la plateforme.
              </p>
            </div>

            {/* Mobile : accordéon */}
            <div className="space-y-2 sm:hidden">
              {timeline.map((item, index) => {
                const isOpen = openTimelineIndex === index;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="overflow-hidden rounded-2xl border border-[#f0ecff] bg-[#faf9ff] shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenTimelineIndex(isOpen ? null : index)
                      }
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${item.color} text-lg text-white shadow-sm`}
                      >
                        {item.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-[#8E7AB5]">
                          {item.period}
                        </p>

                        <h3 className="truncate text-sm font-black text-[#1C1C1C]">
                          {item.title}
                        </h3>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#f0ecff] px-3 pb-3 pt-2">
                            <p className="text-xs leading-relaxed text-[#666]">
                              {item.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop / tablette : timeline complète */}
            <div className="relative hidden sm:block">
              {/* Ligne verticale */}
              <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#D9B8FF] via-[#8E7AB5] to-[#D9B8FF]" />

              {timeline.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{
                    opacity: 0,
                    x: index % 2 === 0 ? -36 : 36,
                  }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  className={`relative mb-8 flex items-center gap-6 ${
                    index % 2 !== 0 ? 'flex-row-reverse' : ''
                  }`}
                >
                  {/* Point central */}
                  <div className="absolute left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 border-[#8E7AB5] bg-white text-lg shadow-md">
                    {item.icon}
                  </div>

                  {/* Carte */}
                  <div
                    className={`w-5/12 ${
                      index % 2 === 0
                        ? 'pr-12 text-right'
                        : 'pl-12 text-left'
                    }`}
                  >
                    <div className="rounded-2xl border border-[#f0ecff] bg-[#faf9ff] p-6 shadow-sm transition-shadow hover:shadow-md">
                      <div
                        className={`mb-3 inline-block rounded-full bg-gradient-to-r ${item.color} px-3 py-1 text-xs font-semibold text-white`}
                      >
                        {item.period}
                      </div>

                      <h3 className="mb-3 text-xl font-bold text-[#1C1C1C]">
                        {item.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-[#666]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Espace opposé */}
                  <div className="w-5/12" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            VALEURS
            Mobile = accordéon compact
            Desktop = cards
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-[#faf9ff] px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 sm:h-[40rem] sm:w-[40rem]" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <div className="mb-4 text-center sm:mb-10">
              <h2 className="mb-1 text-xl font-black text-[#1C1C1C] sm:mb-4 sm:text-4xl">
                Ce qui nous <span className="text-[#8E7AB5]">guide</span>
              </h2>

              <p className="text-xs text-[#666] sm:text-lg">
                Les valeurs au cœur de chaque décision.
              </p>
            </div>

            {/* Mobile : accordéon compact */}
            <div className="space-y-2 sm:hidden">
              {values.map((value, index) => {
                const isOpen = openValueIndex === index;

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="overflow-hidden rounded-2xl border border-[#f0ecff] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenValueIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${value.bg} text-lg`}
                      >
                        {value.mobileIcon}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-sm font-black text-[#1C1C1C]">
                        {value.title}
                      </span>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#f0ecff] px-3 pb-3 pt-2">
                            <p className="text-xs leading-relaxed text-[#666]">
                              {value.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop / tablette : cards complètes, contour lumineux par couleur */}
            <div className="hidden gap-6 sm:grid md:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => {
                const theme = valueThemes[index] ?? valueThemes[0];

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className={`group relative overflow-hidden rounded-2xl border border-[#f0ecff] bg-white p-6 text-center transition-shadow duration-300 ${theme.shadowBase} ${theme.shadowHover}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${theme.overlay} opacity-40 transition-opacity duration-300 group-hover:opacity-80`}
                    />

                    <div className="relative">
                      <div
                        className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${theme.iconBg} ${value.color}`}
                      >
                        {value.icon}
                      </div>

                      <h3 className="mb-2 font-bold text-[#1C1C1C]">
                        {value.title}
                      </h3>

                      <p className="text-sm leading-relaxed text-[#666]">
                        {value.description}
                      </p>
                    </div>

                    <div
                      className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${theme.bar} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            CITATION COMPACTE
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1a0b2e] to-[#2d1b69] px-4 py-7 sm:px-6 sm:py-14">
          <OrbitGlow
            variant="light"
            className="left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 sm:h-[34rem] sm:w-[34rem]"
          />

          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <div className="mb-3 text-3xl sm:mb-8 sm:text-5xl">🌙</div>

              <blockquote className="mb-4 text-base font-light italic leading-relaxed text-white sm:mb-8 sm:text-2xl">
                “SferaLuna n&apos;est pas juste une application. C&apos;est la
                conviction que les femmes méritent un espace où elles peuvent
                rencontrer, vibrer et s&apos;épanouir — à leur rythme, selon
                leurs termes.”
              </blockquote>

              <p className="text-xs text-purple-300 sm:text-sm">
                — L&apos;équipe SferaLuna
              </p>
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            IMPACT / STATS COMPACTES
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-white px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="right-[-10%] top-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-5xl">
            <div className="mb-4 text-center sm:mb-8">
              <h2 className="mb-1 text-xl font-black text-[#1C1C1C] sm:mb-4 sm:text-4xl">
                Notre <span className="text-[#8E7AB5]">impact</span>
              </h2>

              <p className="text-xs text-[#666] sm:text-base">
                Données réelles, mises à jour en continu.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:gap-6">
              {stats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-2xl border border-[#f0ecff] bg-gradient-to-b from-[#faf9ff] to-white px-2 py-3 text-center shadow-sm sm:p-6"
                >
                  <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-[#8E7AB5] sm:mb-3 sm:h-10 sm:w-10">
                    {item.icon}
                  </div>

                  <div className="mb-0.5 text-lg font-black text-[#5B4B8A] sm:mb-1 sm:text-4xl">
                    {item.stat}
                  </div>

                  <div className="text-[10px] text-[#666] sm:text-sm">
                    {item.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            CTA FINAL COMPACT MOBILE
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-12">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <motion.div
            animate={{ scale: [1, 1.16, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 to-transparent"
          />

          <OrbitGlow
            variant="light"
            className="left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 sm:h-[36rem] sm:w-[36rem]"
          />

          <div className="relative z-10 mx-auto max-w-3xl text-center text-white">
            <h2 className="mb-3 text-2xl font-black leading-tight sm:mb-6 sm:text-4xl md:text-5xl">
              Écris ta propre{' '}
              <span className="text-[#FFD166]">histoire</span>
            </h2>

            <p className="mb-5 text-sm leading-relaxed text-white/90 sm:mb-10 sm:text-xl">
              SferaLuna n&apos;est pas que notre histoire — c&apos;est la
              tienne aussi.
            </p>

            <div className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4">
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#8E7AB5] shadow-xl transition-all duration-300 hover:scale-105 sm:px-8 sm:py-4 sm:text-lg"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                Rejoindre SferaLuna
              </Link>

              <Link
                href="/valeurs"
                className="rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:px-8 sm:py-4 sm:text-lg"
              >
                Nos valeurs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}