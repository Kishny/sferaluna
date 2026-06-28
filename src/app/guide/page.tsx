'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Users,
  MessageCircle,
  Heart,
  Shield,
  Star,
  Zap,
  Moon,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

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

export default function GuidePage() {
  /**
   * FAQ ouverte.
   * On garde un tableau pour permettre plusieurs FAQ ouvertes en même temps.
   */
  const [openSections, setOpenSections] = useState<number[]>([0]);

  /**
   * Accordéon mobile des étapes.
   * Sur mobile, on ouvre seulement la première par défaut pour garder la page compacte.
   */
  const [openStepIndex, setOpenStepIndex] = useState<number | null>(0);

  /**
   * Accordéon mobile des conseils communauté.
   */
  const [openTipIndex, setOpenTipIndex] = useState<number | null>(null);

  /**
   * Ouvre / ferme une FAQ.
   */
  const toggleSection = (index: number) => {
    setOpenSections((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  /**
   * Étapes du guide débutant.
   */
  const steps = [
    {
      title: '1. Création de ton profil Luna',
      shortTitle: 'Profil Luna',
      emoji: '✨',
      icon: <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />,
      content:
        "Commence par partager ce qui te définit vraiment. Ton profil Luna est plus qu'une photo : c'est l'expression de ta vibe intérieure.",
      details: [
        'Ajoute des photos qui te représentent authentiquement',
        'Partage tes intérêts, passions et valeurs',
        'Définis ce que tu recherches sur SferaLuna',
        'Configure tes préférences de confidentialité',
      ],
      color: 'from-[#8E7AB5] to-[#D9B8FF]',
      duration: '5-10 minutes',
      tip: 'Astuce : sois toi-même. Les profils authentiques reçoivent plus de réponses.',
    },
    {
      title: '2. Découverte du Circle of Six',
      shortTitle: 'Circle of Six',
      emoji: '💜',
      icon: <Users className="h-5 w-5 sm:h-6 sm:w-6" />,
      content:
        'Chaque semaine, notre algorithme te présente 6 femmes qui partagent tes valeurs et intérêts.',
      details: [
        'Reçois 6 suggestions personnalisées chaque dimanche',
        'Chaque profil est pré-sélectionné selon tes critères',
        'Prends ton temps pour découvrir chaque personne',
        'Pas de pression : tu décides du rythme',
      ],
      color: 'from-[#FF6B6B] to-[#FF8E8E]',
      duration: 'À ton rythme',
    },
    {
      title: '3. Personnalisation de ton VibeSphere',
      shortTitle: 'VibeSphere',
      emoji: '🌙',
      icon: <Moon className="h-5 w-5 sm:h-6 sm:w-6" />,
      content:
        'Crée ton espace émotionnel unique pour exprimer ton humeur du jour.',
      details: [
        'Choisis ta playlist Luna personnalisée',
        'Sélectionne tes couleurs et ambiance préférées',
        "Partage tes humeurs avec des avatars expressifs",
        "Utilise le journal émotionnel pour suivre ton évolution",
      ],
      color: 'from-[#4ECDC4] to-[#44A08D]',
      duration: 'Continuel',
    },
    {
      title: '4. Premières interactions',
      shortTitle: 'Interactions',
      emoji: '💬',
      icon: <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />,
      content:
        'Engage la conversation de manière authentique et bienveillante.',
      details: [
        'Utilise nos prompts de conversation pour briser la glace',
        'Partage tes intérêts communs pour créer un lien',
        'Propose un rendez-vous VibePlanner créatif',
        'Respecte toujours les limites et le consentement',
      ],
      color: 'from-[#FFD166] to-[#FF9A3C]',
      duration: 'Quand tu te sens prête',
    },
    {
      title: '5. Participation aux événements Luna',
      shortTitle: 'Événements Luna',
      emoji: '⭐',
      icon: <Star className="h-5 w-5 sm:h-6 sm:w-6" />,
      content:
        "Rejoins notre communauté lors d'événements exclusifs et enrichissants.",
      details: [
        'Participe aux LunaGather en ligne ou en présentiel',
        'Rejoins des ateliers thématiques',
        'Assiste à des conférences sur des sujets LGBTQ+',
        "Rencontre d'autres membres lors de soirées détente",
      ],
      color: 'from-[#9D4EDD] to-[#7B2CBF]',
      duration: 'Selon tes envies',
    },
  ];

  /**
   * FAQ du guide.
   */
  const faqs = [
    {
      question:
        'Combien de temps faut-il pour commencer à rencontrer des personnes ?',
      answer:
        'La plupart de nos membres font leur première connexion significative dans les 48h après avoir complété leur profil. Le Circle of Six te présente des suggestions chaque semaine, donc tu as toujours de nouvelles opportunités.',
    },
    {
      question: 'Dois-je révéler mon identité réelle ?',
      answer:
        "Non. Tu as le contrôle total sur ton anonymat. Le Mode Fantôme te permet d'utiliser un pseudonyme, de flouter tes photos et de ne révéler ton identité que quand tu le décides.",
    },
    {
      question: 'Comment fonctionne la modération sur SferaLuna ?',
      answer:
        'Notre équipe de modération travaille 24h/24 pour garantir la sécurité de toutes. Nous vérifions les profils, surveillons les interactions et agissons rapidement en cas de signalement.',
    },
    {
      question: 'Puis-je utiliser SferaLuna si je suis en couple ?',
      answer:
        "Oui. SferaLuna accueille toutes les femmes, quelle que soit leur situation amoureuse. Que tu cherches des amitiés, des relations polyamoureuses ou simplement à élargir ton cercle social, tu es la bienvenue.",
    },
    {
      question:
        'Comment gérer les rencontres qui ne correspondent pas à mes attentes ?',
      answer:
        "Tu peux ajuster tes préférences, prendre une pause ou simplement passer. L'objectif est que tu gardes toujours le contrôle de ton rythme et de ton expérience.",
    },
  ];

  /**
   * Palette de couleurs cycliques pour les cards FAQ et conseils.
   */
  const accentThemes = [
    'from-[#8E7AB5] to-[#D9B8FF]',
    'from-[#FF6B6B] to-[#FF8E8E]',
    'from-[#4ECDC4] to-[#44A08D]',
    'from-[#FFD166] to-[#FF9A3C]',
    'from-[#9D4EDD] to-[#7B2CBF]',
  ];

  /**
   * Conseils de la communauté.
   */
  const communityTips = [
    {
      tip: 'Prends le temps de remplir ton profil à 100%',
      details:
        'Un profil complet avec tes vraies passions attire des connexions bien plus alignées avec toi.',
      author: 'Conseil de la communauté',
      emoji: '📝',
    },
    {
      tip: 'Utilise le Mode Fantôme pour commencer en douceur',
      details:
        "Cela permet de s'habituer à la plateforme sans pression et de révéler ton identité quand tu te sens prête.",
      author: 'Conseil de la communauté',
      emoji: '👻',
    },
    {
      tip: 'Participe aux événements pour rencontrer plusieurs personnes',
      details:
        "C'est souvent moins intimidant que les échanges en tête-à-tête, et l'ambiance est toujours bienveillante.",
      author: 'Conseil de la communauté',
      emoji: '🎉',
    },
  ];

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white text-[#1C1C1C]">
        {/* Hero Section compact mobile */}
        <section className="relative overflow-hidden px-4 pb-6 pt-20 sm:px-6 sm:pb-12 sm:pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          {/* Orbes décoratives légères */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -left-12 top-16 h-40 w-40 rounded-full bg-white/15 blur-3xl sm:h-64 sm:w-64"
          />

          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -right-16 bottom-0 h-52 w-52 rounded-full bg-pink-200/20 blur-3xl sm:h-80 sm:w-80"
          />

          <OrbitGlow
            variant="light"
            className="left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 sm:h-[32rem] sm:w-[32rem]"
          />

          <div className="relative z-10 mx-auto max-w-6xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Guide débutant
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-3 text-3xl font-black leading-tight sm:mb-6 sm:text-5xl md:text-7xl"
            >
              Guide du débutant
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto mb-4 max-w-3xl text-sm leading-relaxed opacity-90 sm:mb-8 sm:text-xl"
            >
              Ton parcours étape par étape pour créer des connexions
              authentiques sur SferaLuna.
            </motion.p>

            {/* Badges compact mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mx-auto grid max-w-md grid-cols-2 gap-2 text-xs sm:flex sm:max-w-none sm:items-center sm:justify-center sm:gap-4 sm:text-sm"
            >
              <div className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <span>30 min</span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-full bg-white/10 px-3 py-2 backdrop-blur-sm">
                <Sparkles size={14} />
                <span>Débutant</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Introduction compacte */}
        <section className="px-4 py-5 sm:px-6 sm:py-12">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-[#E8E0FF] bg-gradient-to-r from-[#F9F7FC] to-white p-4 shadow-sm sm:rounded-3xl sm:p-6"
            >
              <h2 className="mb-2 text-xl font-bold text-[#5B4B8A] sm:mb-4 sm:text-3xl">
                ✨ Bienvenue dans l’univers Luna
              </h2>

              <p className="mb-4 text-sm leading-relaxed text-[#666] sm:mb-6 sm:text-lg">
                Ce guide t’accompagne dans tes premiers pas sur SferaLuna. Ici,
                le but n’est pas d’aller vite, mais de créer des connexions qui
                ont du sens.
              </p>

              <div className="flex items-start gap-2 rounded-xl bg-[#8E7AB5]/10 px-3 py-2 text-sm text-[#8E7AB5]">
                <Shield size={17} className="mt-0.5 shrink-0" />
                <span className="font-medium">
                  Conseil : avance à ton rythme. Tu gardes toujours le contrôle.
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Étapes détaillées */}
        <section className="relative overflow-hidden px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="right-[-8%] top-10 h-72 w-72 sm:h-96 sm:w-96" />
          <OrbitGlow className="left-[-10%] top-[60%] h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center sm:mb-8"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl">
                Ton parcours en <span className="text-[#8E7AB5]">5 étapes</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-3 sm:text-lg">
                Une progression simple, claire et rassurante.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {steps.map((step, index) => {
                const isOpen = openStepIndex === index;

                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${step.color}`}
                    />

                    <button
                      type="button"
                      onClick={() => setOpenStepIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${step.color} text-sm font-bold text-white`}
                      >
                        {index + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {step.shortTitle}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {step.duration}
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
                              {step.content}
                            </p>

                            <div className="mt-2 space-y-1.5">
                              {step.details.map((detail) => (
                                <div
                                  key={detail}
                                  className="flex items-start gap-2 text-xs leading-relaxed text-[#666]"
                                >
                                  <ChevronRight
                                    size={14}
                                    className="mt-0.5 shrink-0 text-[#8E7AB5]"
                                  />
                                  <span>{detail}</span>
                                </div>
                              ))}
                            </div>

                            {step.tip && (
                              <div className="mt-3 rounded-xl border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-2 text-xs font-medium leading-relaxed text-[#5B4B8A]">
                                💜 {step.tip}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop/tablette : version complète */}
            <div className="hidden space-y-6 sm:block">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="relative"
                >
                  <div className="relative overflow-hidden flex flex-col gap-8 rounded-3xl border border-[#F0F0F0] bg-white p-6 shadow-lg transition-shadow hover:shadow-xl lg:flex-row">
                    <div
                      className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${step.color}`}
                    />
                    {/* Numéro et icône */}
                    <div className="lg:w-1/4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r ${step.color} text-xl font-bold text-white`}
                        >
                          {index + 1}
                        </div>

                        <div className="lg:hidden">
                          <h3 className="text-xl font-semibold text-[#1C1C1C]">
                            {step.title}
                          </h3>

                          <div className="mt-2 flex items-center gap-2 text-sm text-[#666]">
                            <Zap size={14} />
                            <span>{step.duration}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-[#8E7AB5]">{step.icon}</div>
                    </div>

                    {/* Contenu */}
                    <div className="lg:w-3/4">
                      <div className="hidden lg:block">
                        <h3 className="mb-2 text-2xl font-semibold text-[#1C1C1C]">
                          {step.title}
                        </h3>

                        <div className="mb-4 flex items-center gap-2 text-[#666]">
                          <Zap size={14} />
                          <span>{step.duration}</span>
                        </div>
                      </div>

                      <p className="mb-6 text-lg text-[#4B4B4B]">
                        {step.content}
                      </p>

                      <div className="space-y-3">
                        {step.details.map((detail) => (
                          <div key={detail} className="flex items-start gap-3">
                            <ChevronRight
                              size={18}
                              className="mt-1 shrink-0 text-[#8E7AB5]"
                            />
                            <span className="text-[#666]">{detail}</span>
                          </div>
                        ))}
                      </div>

                      {step.tip && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 }}
                          className="mt-6 rounded-xl border border-[#8E7AB5]/20 bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 p-4"
                        >
                          <div className="flex items-center gap-3">
                            <Heart size={18} className="text-[#8E7AB5]" />
                            <span className="font-medium text-[#5B4B8A]">
                              {step.tip}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Ligne de connexion desktop */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-1/4 top-full ml-6 hidden h-8 w-0.5 bg-gradient-to-b from-[#8E7AB5] to-transparent lg:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Interactive */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="left-1/2 top-0 h-72 w-72 -translate-x-1/2 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center sm:mb-8"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl">
                Questions <span className="text-[#8E7AB5]">fréquentes</span>
              </h2>
            </motion.div>

            <div className="space-y-2 sm:space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openSections.includes(index);
                const theme = accentThemes[index % accentThemes.length];

                return (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="relative overflow-hidden rounded-2xl border border-[#F0F0F0] bg-white"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme}`}
                    />

                    <button
                      type="button"
                      onClick={() => toggleSection(index)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:border-[#8E7AB5]/30 sm:px-6 sm:py-5"
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r ${theme} text-sm font-bold text-white sm:h-8 sm:w-8`}
                      >
                        ?
                      </div>

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
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#F0ECFA] bg-white/60 px-3 pb-3 pt-2 sm:px-6 sm:pb-5 sm:pt-4">
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

        {/* Conseils de la communauté */}
        <section className="relative overflow-hidden px-4 py-5 sm:px-6 sm:py-14">
          <OrbitGlow className="right-[-10%] top-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center sm:mb-8"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl">
                Conseils de la{' '}
                <span className="text-[#8E7AB5]">communauté</span>
              </h2>
            </motion.div>

            {/* Mobile : accordéons */}
            <div className="space-y-2 sm:hidden">
              {communityTips.map((tip, index) => {
                const isOpen = openTipIndex === index;
                const theme = accentThemes[index % accentThemes.length];

                return (
                  <motion.div
                    key={tip.tip}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                    className="relative overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme}`}
                    />

                    <button
                      type="button"
                      onClick={() => setOpenTipIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${theme} text-xl`}
                      >
                        {tip.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {tip.tip}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {tip.author}
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
                              {tip.details}
                            </p>

                            <p className="mt-2 text-xs font-medium text-[#8E7AB5]">
                              — {tip.author}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop : cards */}
            <div className="hidden grid-cols-1 gap-6 sm:grid md:grid-cols-3">
              {communityTips.map((tip, index) => {
                const theme = accentThemes[index % accentThemes.length];

                return (
                <motion.div
                  key={tip.tip}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  className="relative overflow-hidden rounded-3xl border border-[#E8E0FF] bg-gradient-to-b from-white to-[#F9F7FC] p-6"
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${theme}`}
                  />

                  <div className="mb-4 text-4xl">{tip.emoji}</div>

                  <h3 className="mb-3 text-xl font-semibold text-[#1C1C1C]">
                    {tip.tip}
                  </h3>

                  <p className="mb-6 text-[#666]">{tip.details}</p>

                  <div className="text-sm font-medium text-[#8E7AB5]">
                    — {tip.author}
                  </div>
                </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to Action compact mobile */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <OrbitGlow
            variant="light"
            className="right-[-10%] top-[-20%] h-72 w-72 sm:h-96 sm:w-96"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 text-2xl font-bold leading-tight sm:mb-6 sm:text-4xl md:text-5xl"
            >
              Prête à commencer ton{' '}
              <span className="text-white">voyage</span> ?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed opacity-90 sm:mb-10 sm:text-xl"
            >
              Rejoins des femmes qui créent des connexions authentiques grâce à
              SferaLuna.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <Link
                href="/auth?mode=register"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <span>Commencer maintenant</span>
                <Sparkles className="h-4 w-4" />
              </Link>

              <Link
                href="/faq"
                className="w-full rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                Voir toutes les FAQs
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour rester cohérent avec les pages compactes */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}