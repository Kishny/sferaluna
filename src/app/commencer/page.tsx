'use client';

import { useState, useEffect } from 'react';
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle,
  Users,
  Lock,
  Heart,
  Star,
  ChevronRight,
  ArrowRight,
  Shield,
  Moon,
  Zap,
  ChevronDown,
} from 'lucide-react';

/**
 * Type des statistiques dynamiques affichées sur la page.
 * Ces données viennent de /api/stats.
 */
interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

/**
 * Formate les gros chiffres pour un affichage plus propre.
 * Exemple :
 * 1200 => 1.2K+
 * 1000 => 1K+
 * 0 => —
 */
function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
  if (n === 0) return '—';
  return n.toString();
}

/**
 * Motif orbite décoratif (cercles concentriques + points d'accent),
 * écho visuel du nom "Sfera".
 */
function OrbitGlow({
  className = '',
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'light';
}) {
  const stroke = variant === 'light' ? '#FFFFFF' : '#8E7AB5';
  const dot = variant === 'light' ? '#FFFFFF' : '#5B4B8A';

  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute opacity-[0.14] ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke={stroke} strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="34" fill="none" stroke={stroke} strokeWidth="1" />
      <circle cx="100" cy="10" r="3" fill={dot} />
      <circle cx="190" cy="100" r="3" fill={dot} />
      <circle cx="100" cy="190" r="3" fill={dot} />
      <circle cx="10" cy="100" r="3" fill={dot} />
    </svg>
  );
}

/**
 * Barres d'accent associées aux avantages (même index que `benefits`).
 */
const benefitBars = [
  'from-[#8E7AB5] to-[#D9B8FF]',
  'from-[#FF6B6B] to-[#FF8E8E]',
  'from-[#4ECDC4] to-[#44A08D]',
  'from-[#FFD166] to-[#FF9A3C]',
];

/**
 * Thèmes cycliques pour les cards FAQ (pas de couleur propre dans la donnée).
 */
const faqAccentThemes = [
  'from-[#8E7AB5] to-[#D9B8FF]',
  'from-[#FF6B6B] to-[#FF8E8E]',
  'from-[#4ECDC4] to-[#44A08D]',
  'from-[#FFD166] to-[#FF9A3C]',
];

export default function CommencerPage() {
  /**
   * Étape active animée automatiquement sur desktop.
   */
  const [step, setStep] = useState(1);

  /**
   * Animation des boutons du hero.
   */
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  /**
   * Statistiques dynamiques.
   */
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  /**
   * Accordéons mobile.
   * Sur mobile, on affiche uniquement les titres par défaut pour gagner de la place.
   */
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(0);
  const [openBenefitIndex, setOpenBenefitIndex] = useState<number | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const { scrollYProgress } = useScroll();

  /**
   * Effets légers liés au scroll.
   * Sur mobile, le hero reste compact grâce aux classes Tailwind.
   */
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  /**
   * Rotation automatique des étapes pour l'indicateur visuel desktop.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev % 4) + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Récupération des statistiques.
   * En cas d'erreur, on garde simplement les placeholders.
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
   * Étapes du parcours utilisateur.
   */
  const steps = [
    {
      number: 1,
      title: 'Création du profil',
      description: 'Partage ce qui te définit vraiment',
      icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
      details: 'Ajoute tes intérêts, tes valeurs et ce que tu recherches.',
      color: 'from-[#8E7AB5] to-[#D9B8FF]',
      emoji: '👤',
    },
    {
      number: 2,
      title: 'Découverte du Circle of Six',
      description: 'Rencontre 6 femmes qui te correspondent',
      icon: <Heart className="h-5 w-5 sm:h-6 sm:w-6" />,
      details:
        'Notre algorithme te présente 6 profils alignés avec ta vibe.',
      color: 'from-[#FF6B6B] to-[#FF8E8E]',
      emoji: '💜',
    },
    {
      number: 3,
      title: 'Personnalisation de ton VibeSphere',
      description: 'Crée ton espace émotionnel unique',
      icon: <Moon className="h-5 w-5 sm:h-6 sm:w-6" />,
      details: 'Choisis ta playlist, tes couleurs et ton ambiance.',
      color: 'from-[#4ECDC4] to-[#44A08D]',
      emoji: '🌙',
    },
    {
      number: 4,
      title: 'Première connexion',
      description: 'Commence à vibrer avec ta communauté',
      icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
      details: 'Participe à un événement ou envoie ton premier message.',
      color: 'from-[#FFD166] to-[#FF9A3C]',
      emoji: '✨',
    },
  ];

  /**
   * Avantages principaux de la plateforme.
   */
  const benefits = [
    {
      icon: <Shield className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Sécurité maximale',
      description: 'Modération 24/7 et données protégées.',
      color: 'text-[#8E7AB5]',
      emoji: '🛡️',
    },
    {
      icon: <Lock className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Contrôle total',
      description: 'Gère ta visibilité comme tu le souhaites.',
      color: 'text-[#FF6B6B]',
      emoji: '🔒',
    },
    {
      icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Matching intelligent',
      description: 'Basé sur les valeurs et les vibes, pas juste les photos.',
      color: 'text-[#4ECDC4]',
      emoji: '⚡',
    },
    {
      icon: <Star className="h-5 w-5 sm:h-6 sm:w-6" />,
      title: 'Expérience premium',
      description: 'Interface élégante et expérience fluide.',
      color: 'text-[#FFD166]',
      emoji: '⭐',
    },
  ];

  /**
   * Questions fréquentes.
   */
  const faqs = [
    {
      question: "L'inscription est-elle vraiment gratuite ?",
      answer:
        "Oui. L'inscription est gratuite. Le compte gratuit est limité : 5 likes par jour, 3 matchs et 10 messages par jour. Les plans payants lèvent ces limites.",
    },
    {
      question: 'Comment fonctionne le Circle of Six ?',
      answer:
        'Chaque semaine, notre algorithme te présente 6 profils qui correspondent à tes valeurs et intérêts. Moins de swipe, plus de sens.',
    },
    {
      question: 'Mes données sont-elles protégées ?',
      answer:
        'Oui. SferaLuna te donne un contrôle fort sur ta visibilité, tes informations et ton expérience sur la plateforme.',
    },
    {
      question: 'Puis-je utiliser SferaLuna discrètement ?',
      answer:
        'Oui. Le Mode Fantôme permet de contrôler ta visibilité, de naviguer plus discrètement et de garder le contrôle sur ton rythme.',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.45, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { scale: 0.96, opacity: 0 },
    visible: (i: number) => ({
      scale: 1,
      opacity: 1,
      transition: {
        delay: i * 0.08,
        duration: 0.4,
        ease: 'easeOut',
      },
    }),
    hover: {
      y: -8,
      scale: 1.02,
      transition: { duration: 0.25 },
    },
  };

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white text-[#1C1C1C]">
        {/* Hero Section compact mobile */}
        <section className="relative overflow-hidden px-4 pb-6 pt-20 sm:px-6 sm:pb-12 sm:pt-28 md:pb-14">
          {/* Fond animé */}
          <motion.div
            className="absolute inset-0"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

            {/* Orbes décoratives réduites sur mobile */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 180, 360],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute left-1/4 top-1/4 h-40 w-40 rounded-full bg-gradient-to-r from-white/10 to-white/5 blur-3xl sm:h-64 sm:w-64"
            />

            <motion.div
              animate={{
                scale: [1.15, 1, 1.15],
                rotate: [360, 180, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute bottom-1/4 right-1/4 h-52 w-52 rounded-full bg-gradient-to-r from-white/5 to-transparent blur-3xl sm:h-96 sm:w-96"
            />

            <OrbitGlow
              variant="light"
              className="left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 sm:h-[32rem] sm:w-[32rem]"
            />

            {/* Motif discret */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px',
                }}
              />
            </div>
          </motion.div>

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center text-white"
            >
              {/* Badge compact */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: 'spring' }}
                className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3 py-1.5 text-xs backdrop-blur-sm sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
              >
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white sm:h-2 sm:w-2" />
                <span className="font-medium">✨ Commence ton voyage</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.7 }}
                className="mb-3 text-3xl font-black leading-tight sm:mb-6 sm:text-5xl md:text-7xl"
              >
                <span>Prête à rejoindre</span>
                <br />
                <span className="bg-gradient-to-r from-white to-[#F9F5FF] bg-clip-text text-transparent">
                  SferaLuna ?
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed opacity-90 sm:mb-8 sm:text-xl"
              >
                Inscris-toi gratuitement et découvre une manière de rencontrer
                plus douce, plus consciente, plus libre.
              </motion.p>

              {/* Boutons hero compact */}
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.6 }}
                className="flex flex-col items-center justify-center gap-2.5 sm:flex-row sm:gap-4"
              >
                <Link
                  href="/auth?mode=register"
                  onMouseEnter={() => setHoveredButton('register')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="group relative w-full sm:w-auto"
                >
                  <button className="relative w-full overflow-hidden rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:shadow-3xl sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                    <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                      Créer mon compte gratuit
                      <motion.span
                        animate={{
                          rotate: hoveredButton === 'register' ? 360 : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="transition-transform group-hover:scale-110"
                      >
                        ✨
                      </motion.span>
                    </span>

                    <span className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </button>
                </Link>

                <Link
                  href="/"
                  onMouseEnter={() => setHoveredButton('home')}
                  onMouseLeave={() => setHoveredButton(null)}
                  className="w-full sm:w-auto"
                >
                  <button className="group flex w-full items-center justify-center gap-2 rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                    Découvrir l’accueil
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>
                </Link>
              </motion.div>

              {/* Statistiques compactes */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.8 }}
                className="mx-auto mt-5 grid max-w-3xl grid-cols-4 gap-2 sm:mt-12 sm:gap-6"
              >
                {[
                  { value: '48h', label: '1ère co.' },
                  {
                    value: siteStats ? formatStat(siteStats.membres) : '…',
                    label: 'Membres',
                  },
                  {
                    value: siteStats ? formatStat(siteStats.matchs) : '…',
                    label: 'Matchs',
                  },
                  {
                    value: siteStats ? formatStat(siteStats.evenements) : '…',
                    label: 'Events',
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-lg font-bold text-white sm:text-3xl">
                      {stat.value}
                    </div>

                    <div className="mt-0.5 text-[10px] text-white/80 sm:mt-1 sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Étapes du parcours */}
        <section className="relative overflow-hidden bg-white px-4 py-5 sm:px-6 sm:py-16 lg:py-20">
          <OrbitGlow className="right-[-8%] top-10 h-72 w-72 sm:h-96 sm:w-96" />
          <OrbitGlow className="left-[-10%] top-[55%] h-64 w-64 sm:h-80 sm:w-80" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Ton parcours en <span className="text-[#8E7AB5]">4 étapes</span>
              </h2>

              <p className="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-xl">
                Un processus simple pour te connecter avec des femmes
                authentiques.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {steps.map((stepItem, index) => {
                const isOpen = openStepIndex === index;

                return (
                  <motion.div
                    key={stepItem.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${stepItem.color}`}
                    />

                    <button
                      type="button"
                      onClick={() => setOpenStepIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${stepItem.color} text-xs font-bold text-white`}
                      >
                        {stepItem.number}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {stepItem.title}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {stepItem.description}
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
                              {stepItem.description}
                            </p>

                            <p className="mt-1.5 text-xs leading-relaxed text-[#666]">
                              {stepItem.details}
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
            <div className="relative hidden sm:block">
              {/* Ligne de progression desktop */}
              <div className="absolute left-0 right-0 top-12 h-1 bg-gradient-to-r from-[#8E7AB5] via-[#A68BC9] to-[#8E7AB5] opacity-20" />

              <motion.div
                className="absolute left-0 top-12 h-1 bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: 'easeInOut' }}
              />

              <div className="relative grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((stepItem, index) => (
                  <motion.div
                    key={stepItem.title}
                    custom={index}
                    variants={cardVariants}
                    initial="hidden"
                    whileInView="visible"
                    whileHover="hover"
                    viewport={{ once: true }}
                    className="relative"
                  >
                    <div className="relative overflow-hidden rounded-3xl border border-[#F0F0F0] bg-gradient-to-b from-white to-[#F9F7FC] p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
                      <div
                        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stepItem.color}`}
                      />

                      <div className="absolute -top-4 left-8 flex h-16 w-16 items-center justify-center rounded-full border border-[#F0F0F0] bg-gradient-to-r from-white to-[#F9F7FC]">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${stepItem.color} text-xl font-bold text-white`}
                        >
                          {stepItem.number}
                        </div>
                      </div>

                      <div className="pt-8">
                        <div className="mb-6 text-[#8E7AB5]">
                          {stepItem.icon}
                        </div>

                        <h3 className="mb-3 text-2xl font-semibold text-[#1C1C1C]">
                          {stepItem.title}
                        </h3>

                        <p className="mb-4 text-lg font-medium text-[#4B4B4B]">
                          {stepItem.description}
                        </p>

                        <p className="text-[#666]">{stepItem.details}</p>
                      </div>

                      {step === stepItem.number && (
                        <motion.div
                          layoutId="activeStep"
                          className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E]"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F9F7FC] to-white px-4 py-5 sm:px-6 sm:py-16 lg:py-20">
          <OrbitGlow className="right-[-10%] top-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Pourquoi choisir{' '}
                <span className="text-[#8E7AB5]">SferaLuna</span> ?
              </h2>

              <p className="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-xl">
                Une expérience repensée pour les femmes qui aiment les femmes.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {benefits.map((benefit, index) => {
                const isOpen = openBenefitIndex === index;

                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${benefitBars[index % benefitBars.length]}`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setOpenBenefitIndex(isOpen ? null : index)
                      }
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-xl">
                        {benefit.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {benefit.title}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {benefit.description}
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
                              {benefit.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop : cards complètes */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="hidden grid-cols-1 gap-6 sm:grid md:grid-cols-2 lg:grid-cols-4"
            >
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  variants={itemVariants}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="group relative"
                >
                  <div className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${benefitBars[index % benefitBars.length]}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F9F7FC] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className={`relative z-10 mb-6 ${benefit.color}`}>
                      {benefit.icon}
                    </div>

                    <h3 className="relative z-10 mb-3 text-xl font-semibold text-[#1C1C1C]">
                      {benefit.title}
                    </h3>

                    <p className="relative z-10 text-[#666]">
                      {benefit.description}
                    </p>

                    <div className="absolute bottom-6 right-6 opacity-0 transition-opacity group-hover:opacity-100">
                      <CheckCircle className="text-[#8E7AB5]" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ rapide */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-5 sm:px-6 sm:py-16 lg:py-20">
          <OrbitGlow className="left-1/2 top-0 h-72 w-72 -translate-x-1/2 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Questions <span className="text-[#8E7AB5]">fréquentes</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-xl">
                Tout ce que tu dois savoir avant de commencer.
              </p>
            </motion.div>

            <div className="space-y-2 sm:space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white transition-all hover:border-[#8E7AB5]/30"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${faqAccentThemes[index % faqAccentThemes.length]}`}
                    />

                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-6 sm:py-5"
                    >
                      <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#8E7AB5]" />

                      <h3 className="min-w-0 flex-1 text-sm font-semibold text-[#1C1C1C] sm:text-lg">
                        {faq.question}
                      </h3>

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
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2 sm:px-6 sm:pb-5 sm:pt-0">
                            <p className="text-xs leading-relaxed text-[#666] sm:text-base">
                              {faq.answer}
                            </p>
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

        {/* Call to Action final compact */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
            className="absolute -left-1/2 -top-1/2 h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <OrbitGlow
            variant="light"
            className="right-[-10%] top-[-15%] h-72 w-72 sm:h-96 sm:w-96"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-5 sm:mb-10"
            >
              <h2 className="mb-2 text-2xl font-bold leading-tight sm:mb-6 sm:text-4xl md:text-6xl">
                Commence ton <span className="text-white">voyage</span>{' '}
                aujourd’hui
              </h2>

              <p className="mx-auto max-w-2xl text-sm leading-relaxed opacity-90 sm:text-xl">
                Rejoins des femmes qui ont déjà trouvé leur communauté
                bienveillante.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <Link href="/auth?mode=register" className="group w-full sm:w-auto">
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl sm:w-auto sm:px-12 sm:py-4 sm:text-lg">
                  <span>Créer mon compte gratuit</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>

              <Link href="/tarifs" className="w-full sm:w-auto">
                <button className="w-full rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:px-12 sm:py-4 sm:text-lg">
                  Découvrir les offres
                </button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-4 text-xs text-white/80 sm:mt-8 sm:text-base"
            >
              <span className="font-semibold">Inscription gratuite</span> ·
              Accès immédiat · Annulation à tout moment
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-5 grid grid-cols-1 gap-2 text-xs sm:mt-10 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 sm:text-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={15} />
                <span>Profils vérifiés</span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={15} />
                <span>Modération 24h/24</span>
              </div>

              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={15} />
                <span>Support dédié</span>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour garder une navigation plus compacte */}
      <div className="hidden sm:block">
        <Footer />
      </div>

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