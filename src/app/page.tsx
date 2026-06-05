'use client';

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import HexagonSix from '@/components/icons/HexagonSix';

/**
 * Type des statistiques affichées sur la homepage.
 * Ces données viennent de l'API /api/stats.
 */
interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

/**
 * Formate les statistiques pour éviter les gros chiffres bruts.
 * Exemple :
 * 1200 -> 1.2K+
 * 1000 -> 1K+
 * 0 -> —
 */
function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
  if (n === 0) return '—';
  return n.toString();
}

export default function Home() {
  /**
   * Progression de scroll utilisée pour la petite barre violette en haut.
   */
  const [scrollProgress, setScrollProgress] = useState(0);

  /**
   * Statistiques dynamiques du site.
   */
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  /**
   * Accordéon mobile de la section ADN.
   * null = aucun bloc ouvert.
   */
  const [openValueIndex, setOpenValueIndex] = useState<number | null>(null);

  /**
   * Accordéon mobile de la section fonctionnalités.
   * null = aucun bloc ouvert.
   */
  const [openFeatureIndex, setOpenFeatureIndex] = useState<number | null>(null);

  /**
   * Accordéon mobile de la section "Fini le swipe infini".
   * false = section fermée sur mobile pour gagner de la place.
   */
  const [isSwipeAccordionOpen, setIsSwipeAccordionOpen] = useState(false);

  /**
   * Animations liées au scroll Framer Motion.
   */
  const { scrollYProgress } = useScroll();

  /**
   * Sur mobile, le hero est volontairement beaucoup plus compact.
   * Ces transforms restent utiles surtout desktop/tablette.
   */
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  /**
   * Chargement des statistiques depuis l'API.
   * Si l'API échoue, on garde simplement les placeholders.
   */
  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSiteStats(d.stats);
      })
      .catch(() => {});
  }, []);

  /**
   * Calcule la progression de scroll manuellement pour la barre en haut.
   */
  useEffect(() => {
    const updateScrollProgress = () => {
      const totalScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (totalScroll <= 0) {
        setScrollProgress(0);
        return;
      }

      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };

    updateScrollProgress();

    window.addEventListener('scroll', updateScrollProgress);
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  /**
   * Fonctionnalités principales du site.
   */
  const features = [
    {
      icon: <HexagonSix size={48} />,
      title: 'Circle of Six',
      description: 'Des liens choisis, pas des milliers de swipes.',
      gradient: 'from-[#8E7AB5] to-[#D9B8FF]',
      link: '/circle',
    },
    {
      icon: '👻',
      title: 'Mode Fantôme',
      description: 'Discrétion assurée, photos floutées, pseudonymes.',
      gradient: 'from-[#7A6AA4] to-[#9B87C5]',
      link: '/mode-fantome',
    },
    {
      icon: '🌌',
      title: 'VibeSphere immersif',
      description: 'Exprime ta vibe dans ton espace personnalisé.',
      gradient: 'from-[#5B4B8A] to-[#8E7AB5]',
      link: '/vibesphere',
    },
    {
      icon: '💡',
      title: 'VibePlanner',
      description: 'Des idées de rendez-vous qui vous rassemblent.',
      gradient: 'from-[#8E7AB5] to-[#B5A3D9]',
      link: '/vibeplanner',
    },
    {
      icon: '🎉',
      title: 'Événements LunaGather',
      description: 'Participe à des moments inoubliables.',
      gradient: 'from-[#D9B8FF] to-[#8E7AB5]',
      link: '/evenements',
    },
    {
      icon: '🧠',
      title: 'Coaching VibeMentor',
      description: 'Sois guidée avec bienveillance et expertise.',
      gradient: 'from-[#7A6AA4] to-[#5B4B8A]',
      link: '/vibementor',
    },
  ];

  /**
   * Valeurs principales de SferaLuna.
   */
  const values = [
    {
      title: '✨ Authenticité',
      description: 'Des rencontres qui ont du sens.',
      details:
        'Pas de filtres, pas de jeu. Juste des femmes qui cherchent du vrai.',
    },
    {
      title: '🔒 Sécurité',
      description: 'Un espace pensé pour ta tranquillité.',
      details: 'Modération stricte, vérification manuelle, données protégées.',
    },
    {
      title: '🌈 Inclusivité',
      description: 'Toutes les femmes, toutes les histoires.',
      details:
        'Que tu sois hétérosexuelle, lesbienne, bisexuelle, pansexuelle ou en questionnement.',
    },
    {
      title: '💜 Bienveillance',
      description: 'Une communauté qui prend soin.',
      details: 'Zéro tolérance pour le harcèlement ou les jugements.',
    },
  ];

  return (
    <>
      <Header />

      {/* Barre de progression du scroll */}
      <motion.div
        className="fixed left-0 top-0 z-50 h-1 bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]"
        style={{ width: `${scrollProgress}%` }}
      />

      <main className="overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white pt-16 text-[#1C1C1C] sm:pt-20">
        {/* Hero Section compact mobile */}
        <section className="relative flex min-h-[auto] items-center justify-center overflow-hidden px-4 py-6 sm:min-h-[70vh] sm:px-6 sm:py-12">
          {/* Fond animé */}
          <motion.div
            className="absolute inset-0"
            style={{ y: parallaxY, opacity: heroOpacity }}
          >
            <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-[#FDF7FA]/80 via-[#F5F0FF]/60 to-[#E8DFFF]/40" />

            {/* Orbe décorative réduite sur mobile */}
            <motion.div
              animate={{
                x: [0, 80, 0],
                y: [0, 40, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 blur-3xl sm:h-64 sm:w-64"
            />

            <motion.div
              animate={{
                x: [0, -80, 0],
                y: [0, -40, 0],
                rotate: [360, 180, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-gradient-to-r from-[#FDF7FA]/20 to-[#8E7AB5]/10 blur-3xl sm:h-96 sm:w-96"
            />

            {/* Motif discret de fond */}
            <div className="absolute inset-0 opacity-5">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238E7AB5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px',
                }}
              />
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 mx-auto max-w-5xl text-center"
            style={{ scale: heroScale }}
          >
            {/* Badge compact */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-white/80 px-3 py-1.5 backdrop-blur-sm sm:mb-8 sm:px-4 sm:py-2"
            >
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8E7AB5] sm:h-2 sm:w-2" />

              <span className="text-xs font-medium text-[#5B4B8A] sm:text-sm">
                ✨ Plateforme exclusive WLW
              </span>
            </motion.div>

            {/* Titre réduit mobile */}
            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-3xl font-bold leading-[1.05] sm:text-5xl md:text-7xl"
            >
              <span className="bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent">
                Rencontrer au féminin,
              </span>

              <br />

              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-[#1C1C1C]"
              >
                librement.
              </motion.span>
            </motion.h1>

            {/* Texte hero compact mobile */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-[#4B4B4B] sm:mt-8 sm:text-xl md:text-2xl"
            >
              SferaLuna est une{' '}
              <span className="font-semibold text-[#8E7AB5]">
                oasis pour les femmes qui aiment les femmes
              </span>
              . Explore des relations sincères, sensuelles ou spirituelles en
              toute sécurité.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mx-auto mt-2 max-w-2xl text-xs text-[#666] sm:mt-4 sm:text-lg"
            >
              Sans jugements. Sans pression. Juste toi, et ta vibe.
            </motion.p>

            {/* Boutons hero plus serrés */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:mt-12 sm:flex-row sm:gap-4"
            >
              <Link href="/auth?mode=register" className="group w-full sm:w-auto">
                <button className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-5 py-3 text-sm font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                    Rejoindre SferaLuna

                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="transition-transform group-hover:scale-110"
                    >
                      ✨
                    </motion.span>
                  </span>

                  <span className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </button>
              </Link>

              <Link href="/explorer" className="w-full sm:w-auto">
                <button className="group flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#8E7AB5] px-5 py-3 text-sm font-semibold text-[#8E7AB5] transition-all duration-300 hover:bg-[#8E7AB5] hover:text-white sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                  Explorer librement

                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>
              </Link>
            </motion.div>

            {/* Statistiques compactes */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="mx-auto mt-5 grid max-w-2xl grid-cols-4 gap-2 sm:mt-12 sm:grid-cols-4 sm:gap-6"
            >
              {[
                {
                  value: siteStats ? formatStat(siteStats.membres) : '…',
                  label: 'Membres',
                },
                {
                  value: siteStats ? formatStat(siteStats.matchs) : '…',
                  label: 'Matchs',
                },
                {
                  value: siteStats ? formatStat(siteStats.messages) : '…',
                  label: 'Messages',
                },
                {
                  value: siteStats ? formatStat(siteStats.evenements) : '…',
                  label: 'Events',
                },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-lg font-bold text-[#5B4B8A] sm:text-3xl">
                    {stat.value}
                  </div>

                  <div className="mt-0.5 text-[10px] text-[#666] sm:mt-1 sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Valeurs / ADN */}
        <section
          id="valeurs"
          className="relative px-4 py-5 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F9F7FC]/60 to-transparent" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Notre <span className="text-[#8E7AB5]">ADN</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-xl">
                Les principes qui guident chaque interaction sur SferaLuna.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {values.map((value, index) => {
                const isOpen = openValueIndex === index;
                const icon = value.title.split(' ')[0];
                const title = value.title.split(' ').slice(1).join(' ');

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenValueIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-xl">
                        {icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {title}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {value.description}
                        </p>
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
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2">
                            <p className="text-xs font-medium leading-relaxed text-[#1C1C1C]">
                              {value.description}
                            </p>

                            <p className="mt-1.5 text-xs leading-relaxed text-[#666]">
                              {value.details}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Tablette / desktop : cards complètes */}
            <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group relative h-full"
                >
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-2xl sm:p-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F9F7FC] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative z-10 mb-4 text-4xl">
                      {value.title.split(' ')[0]}
                    </div>

                    <h3 className="relative z-10 mb-3 text-xl font-semibold text-[#5B4B8A] sm:text-2xl">
                      {value.title.split(' ').slice(1).join(' ')}
                    </h3>

                    <p className="relative z-10 mb-3 text-base font-medium text-[#1C1C1C] sm:text-lg">
                      {value.description}
                    </p>

                    <p className="relative z-10 text-sm leading-relaxed text-[#666] sm:text-base">
                      {value.details}
                    </p>

                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8E7AB5] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Fonctionnalités principales */}
        <section className="bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-5 sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Une expérience <span className="text-[#8E7AB5]">unique</span>
              </h2>

              <p className="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-xl">
                Des fonctionnalités pensées pour créer de vraies connexions.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {features.map((feature, index) => {
                const isOpen = openFeatureIndex === index;

                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
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
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} text-lg text-white`}
                      >
                        {feature.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {feature.title}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {feature.description}
                        </p>
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
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2">
                            <p className="text-xs leading-relaxed text-[#666]">
                              {feature.description}
                            </p>

                            <Link
                              href={feature.link}
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#8E7AB5]"
                            >
                              Découvrir
                              <span>→</span>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Tablette / desktop : cards complètes */}
            <div className="hidden grid-cols-1 gap-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ scale: 1.025, transition: { duration: 0.2 } }}
                >
                  <Link href={feature.link} className="block h-full">
                    <div className="group relative h-full overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white p-5 shadow-lg transition-all duration-300 hover:shadow-2xl sm:p-6">
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-5`}
                      />

                      <motion.div
                        className="relative z-10 mb-5 text-5xl"
                        animate={{
                          scale: [1, 1.08, 1],
                          rotate: [0, 4, -4, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          delay: index * 0.45,
                        }}
                      >
                        {feature.icon}
                      </motion.div>

                      <h3 className="relative z-10 mb-3 text-xl font-semibold text-[#5B4B8A] sm:text-2xl">
                        {feature.title}
                      </h3>

                      <p className="relative z-10 pr-6 text-sm leading-relaxed text-[#666] sm:text-base">
                        {feature.description}
                      </p>

                      <motion.div
                        className="absolute bottom-5 right-5 text-[#8E7AB5] opacity-0 transition-opacity group-hover:opacity-100"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Comparatif : accordéon mobile + bloc complet desktop */}
            <motion.div
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-5 sm:mt-16"
            >
              {/* Mobile : accordéon compact */}
              <div className="sm:hidden">
                <div className="overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() =>
                      setIsSwipeAccordionOpen((current) => !current)
                    }
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-lg">
                      💫
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                        Fini le swipe infini
                      </h3>

                      <p className="truncate text-[11px] text-[#666]">
                        6 profils vraiment compatibles, pas 247 au hasard.
                      </p>
                    </div>

                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                        isSwipeAccordionOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isSwipeAccordionOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-3 border-t border-[#F0ECFA] px-3 pb-3 pt-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-2xl border border-[#ddd] bg-[#f3f3f3] p-3 text-center">
                              <span className="mb-1 inline-block rounded-full bg-[#ddd] px-2 py-0.5 text-[10px] text-[#999]">
                                Autres apps
                              </span>

                              <p className="text-lg font-bold text-[#999]">
                                247
                              </p>

                              <p className="text-[11px] text-[#999]">
                                profils au hasard
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[#8E7AB5]/25 bg-[#f0ecff] p-3 text-center">
                              <span className="mb-1 inline-block rounded-full bg-[#8E7AB5] px-2 py-0.5 text-[10px] text-white">
                                SferaLuna
                              </span>

                              <p className="text-lg font-bold text-[#5B4B8A]">
                                6
                              </p>

                              <p className="text-[11px] text-[#8E7AB5]">
                                profils alignés
                              </p>
                            </div>
                          </div>

                          <p className="text-xs leading-relaxed text-[#666]">
                            Notre approche limite la fatigue du swipe : moins de
                            profils, mais plus de compatibilité, plus de sens et
                            plus de clarté.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop/tablette : version complète */}
              <div className="hidden sm:block">
                <div className="mb-5 text-center sm:mb-8">
                  <span className="mb-3 inline-block rounded-full bg-[#8E7AB5]/10 px-4 py-1 text-sm font-medium text-[#8E7AB5] sm:mb-4">
                    Une nouvelle façon de rencontrer
                  </span>

                  <h3 className="text-2xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                    Fini le{' '}
                    <span className="text-[#8E7AB5]">swipe infini</span>
                  </h3>
                </div>

                <div className="grid gap-5 md:grid-cols-2 md:gap-6">
                  {/* Les autres apps */}
                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-3xl border border-[#ddd] bg-gradient-to-br from-[#f5f5f5] to-[#ebebeb] p-4 sm:p-6"
                  >
                    <div className="absolute right-4 top-4 rounded-full bg-[#ddd] px-3 py-1 text-xs font-medium text-[#999]">
                      Les autres apps
                    </div>

                    <div className="mt-9 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0.3 + i * 0.1 }}
                          animate={{
                            opacity: [
                              0.3 + i * 0.08,
                              0.6,
                              0.3 + i * 0.08,
                            ],
                          }}
                          transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                          }}
                          className="flex items-center gap-3 rounded-2xl bg-white/60 p-3"
                        >
                          <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#ddd] to-[#ccc]" />

                          <div className="flex-1 space-y-1.5">
                            <div className="h-2.5 w-3/4 rounded-full bg-[#ddd]" />
                            <div className="h-2 w-1/2 rounded-full bg-[#e8e8e8]" />
                          </div>

                          <div className="flex gap-1.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffb3b3] text-sm">
                              ✕
                            </div>

                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#b3ffb3] text-sm">
                              ♥
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-2xl font-bold text-[#999]">
                        247 profils.
                      </p>

                      <p className="mt-1 text-[#aaa]">Toujours seule.</p>
                    </div>
                  </motion.div>

                  {/* SferaLuna */}
                  <motion.div
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden rounded-3xl border-2 border-[#8E7AB5]/30 bg-gradient-to-br from-[#f0ecff] to-[#e8e0ff] p-4 sm:p-6"
                  >
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] px-3 py-1 text-xs font-medium text-white">
                      SferaLuna ✨
                    </div>

                    <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {[
                        { mood: '🌟', name: 'Sofia', age: 29, compat: '94%' },
                        { mood: '🌙', name: 'Léa', age: 31, compat: '91%' },
                        { mood: '💕', name: 'Nour', age: 27, compat: '89%' },
                        { mood: '🦋', name: 'Emma', age: 33, compat: '87%' },
                        { mood: '⚡', name: 'Jade', age: 28, compat: '85%' },
                        { mood: '🌹', name: 'Iris', age: 30, compat: '83%' },
                      ].map((profile, i) => (
                        <motion.div
                          key={profile.name}
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="cursor-default rounded-2xl border border-[#8E7AB5]/10 bg-white p-3 text-center shadow-sm"
                        >
                          <div className="mb-1 text-2xl">{profile.mood}</div>

                          <div className="text-xs font-semibold text-[#1C1C1C]">
                            {profile.name}, {profile.age}
                          </div>

                          <div className="mt-1 text-xs font-medium text-[#8E7AB5]">
                            {profile.compat}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-6 text-center">
                      <p className="text-2xl font-bold text-[#5B4B8A]">
                        6 profils.
                      </p>

                      <p className="mt-1 text-[#8E7AB5]">
                        Vraiment compatibles.
                      </p>
                    </div>
                  </motion.div>
                </div>

                <p className="mt-6 text-center text-base leading-relaxed text-[#666] sm:mt-8 sm:text-lg">
                  Notre algorithme sélectionne{' '}
                  <span className="font-semibold text-[#8E7AB5]">
                    6 profils alignés avec tes valeurs
                  </span>{' '}
                  chaque semaine.
                  <br className="hidden md:block" />
                  Pas de fatigue du swipe. Juste des connexions qui ont du sens.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action final compact mobile */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-14 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          {/* Effets de fond */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -left-1/2 -top-1/2 h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
            className="absolute -bottom-1/2 -right-1/2 h-full w-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-2 text-2xl font-bold leading-tight sm:mb-4 sm:text-4xl md:text-6xl"
            >
              Prête à créer ton{' '}
              <span className="text-white">cercle Luna</span> ?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mb-4 text-sm leading-relaxed opacity-90 sm:mb-6 md:text-xl"
            >
              Rejoins <span className="font-semibold">10,000+ femmes</span> qui
              ont déjà trouvé leur communauté.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <Link href="/auth?mode=register" className="group w-full sm:w-auto">
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl sm:w-auto sm:px-12 sm:py-4 sm:text-lg">
                  <span>Commencer maintenant</span>

                  <span className="transition-transform group-hover:translate-x-1">
                    🚀
                  </span>
                </button>
              </Link>

              <Link href="/tarifs" className="w-full sm:w-auto">
                <button className="w-full rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:px-12 sm:py-4 sm:text-lg">
                  Voir les offres premium
                </button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-3 text-xs leading-relaxed text-white/80 sm:mt-5 sm:text-sm"
            >
              <span className="font-semibold">30 jours gratuits</span> · Aucune
              carte requise · Annulation à tout moment
            </motion.p>
          </div>
        </section>

        {/* Section application mobile compacte */}
        <section className="bg-gradient-to-br from-[#faf9ff] to-[#f0ecff] px-4 py-6 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-1 sm:mb-6 sm:px-4 sm:py-1.5">
              <span className="text-xs font-medium text-[#8E7AB5] sm:text-sm">
                ✨ Très bientôt
              </span>
            </div>

            <h2 className="mb-2 text-xl font-bold text-[#1C1C1C] sm:mb-4 sm:text-3xl">
              L&apos;application mobile{' '}
              <span className="bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent">
                SferaLuna
              </span>{' '}
              arrive
            </h2>

            <p className="mx-auto mb-4 max-w-xl text-xs leading-relaxed text-[#666] sm:mb-8 sm:text-base">
              Rencontres, messages et communauté directement depuis ton
              téléphone. iOS et Android, bientôt disponibles.
            </p>

            <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-4">
              <div className="flex w-full cursor-default select-none items-center justify-center gap-3 rounded-2xl bg-[#1a0b2e] px-5 py-3 text-white shadow-lg sm:w-auto sm:px-6 sm:py-3.5">
                <span className="text-xl sm:text-2xl">🍎</span>

                <div className="text-left">
                  <p className="text-[10px] leading-none text-white/60 sm:text-xs">
                    Bientôt sur
                  </p>

                  <p className="text-sm font-semibold sm:text-base">
                    App Store
                  </p>
                </div>
              </div>

              <div className="flex w-full cursor-default select-none items-center justify-center gap-3 rounded-2xl bg-[#1a0b2e] px-5 py-3 text-white shadow-lg sm:w-auto sm:px-6 sm:py-3.5">
                <span className="text-xl sm:text-2xl">🤖</span>

                <div className="text-left">
                  <p className="text-[10px] leading-none text-white/60 sm:text-xs">
                    Bientôt sur
                  </p>

                  <p className="text-sm font-semibold sm:text-base">
                    Google Play
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#999] sm:mt-6 sm:text-sm">
              Laisse-nous ton email pour être notifiée en première.
            </p>
          </motion.div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
}