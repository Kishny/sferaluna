'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Sparkles,
  Crown,
  Star,
  Zap,
  Users,
  Shield,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function TarifsPage() {
  /**
   * Plan sélectionné.
   * Sur desktop, cela sert surtout à mettre une bordure active.
   * Sur mobile, cela sert à ouvrir/fermer les accordéons des plans.
   */
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    'premium-monthly'
  );

  /**
   * Accordéon FAQ.
   */
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  /**
   * Accordéon comparaison mobile.
   */
  const [openComparisonIndex, setOpenComparisonIndex] = useState<number | null>(
    0
  );

  const plans = [
    {
      id: 'free',
      name: 'Gratuit',
      description: 'Découvre SferaLuna à ton rythme',
      price: 0,
      color: 'from-[#8E7AB5] to-[#D9B8FF]',
      icon: <Star className="h-6 w-6 text-white sm:h-8 sm:w-8" />,
      features: [
        'Profil complet',
        '5 likes par jour',
        '3 matchs maximum',
        'Messagerie limitée (10 messages/jour)',
        'VibeSphere basique',
        'Communauté Luna',
        'Support par formulaire',
      ],
      cta: 'Commencer gratuitement',
      ctaLink: '/auth?mode=register',
      popular: false,
    },
    {
      id: 'essential-monthly',
      name: 'Essentiel',
      description: 'Pour aller plus loin dans tes rencontres',
      price: 9.99,
      color: 'from-[#FF6B6B] to-[#FF8E8E]',
      icon: <Zap className="h-6 w-6 text-white sm:h-8 sm:w-8" />,
      features: [
        'Tout du plan Gratuit',
        'Circle of Six hebdomadaire',
        'VibePlanner (3/mois)',
        'Filtres avancés',
        'Événements exclusifs',
        'Badge Essentiel',
        'Support prioritaire 5j/7',
      ],
      cta: 'Choisir Essentiel',
      ctaLink: '/auth?mode=register',
      popular: false,
    },
    {
      id: 'premium-monthly',
      name: 'Premium',
      description: "L'expérience SferaLuna complète",
      price: 19.99,
      color: 'from-[#9D4EDD] to-[#7B2CBF]',
      icon: <Crown className="h-6 w-6 text-white sm:h-8 sm:w-8" />,
      features: [
        'Tout du plan Essentiel',
        'Mode Fantôme',
        'VibePlanner illimité',
        'Voir les visiteurs de ton profil',
        'VibeSphere avancé',
        'Filtres premium (distance, actif…)',
        'Badge Premium',
        'Support prioritaire 7j/7',
      ],
      cta: 'Choisir Premium',
      ctaLink: '/auth?mode=register',
      popular: true,
    },
    {
      id: 'elite-monthly',
      name: 'Elite',
      description: 'Pour les plus engagées',
      price: 34.99,
      color: 'from-[#FFD166] to-[#FF9A3C]',
      icon: <Sparkles className="h-6 w-6 text-white sm:h-8 sm:w-8" />,
      features: [
        'Tout du plan Premium',
        'Coaching VibeMentor mensuel',
        'Cercle privé VIP',
        'Accès anticipé aux nouvelles fonctionnalités',
        'Rencontres organisées exclusives',
        'Badge Elite',
        'Support dédié 7j/7',
      ],
      cta: 'Choisir Elite',
      ctaLink: '/auth?mode=register',
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'Puis-je annuler à tout moment ?',
      answer:
        "Oui, tu peux annuler ton abonnement à tout moment depuis ton espace Mon Compte. Tu conserves l'accès premium jusqu'à la fin de la période payée.",
    },
    {
      question: 'Y a-t-il un engagement minimum ?',
      answer:
        'Non, aucun engagement. Les abonnements sont mensuels et tu peux annuler quand tu veux.',
    },
    {
      question: 'Comment changer de forfait ?',
      answer:
        'Tu peux changer de forfait à tout moment depuis Mon Compte → onglet Premium. La différence sera ajustée au prorata.',
    },
    {
      question: 'Proposez-vous des tarifs étudiants ?',
      answer:
        'Oui, nous avons une réduction de 30% pour les étudiantes. Contacte notre support avec ta carte étudiante.',
    },
    {
      question: "Que se passe-t-il si j'annule mon abonnement ?",
      answer:
        'Ton compte revient automatiquement en version gratuite à la fin de la période payée. Tu ne perdras pas tes matches ni tes messages.',
    },
    {
      question: 'Les paiements sont-ils sécurisés ?',
      answer:
        'Oui, tous les paiements sont gérés par Stripe, leader mondial du paiement en ligne. Nous ne stockons jamais tes données bancaires.',
    },
  ];

  /**
   * Données de comparaison.
   * Sur desktop : affichées en tableau.
   * Sur mobile : affichées en accordéons compacts.
   */
  const comparisonRows = [
    {
      feature: 'Likes par jour',
      values: ['5/jour', 'Illimité', 'Illimité', 'Illimité'],
    },
    {
      feature: 'Matchs simultanés',
      values: ['3 max', 'Illimité', 'Illimité', 'Illimité'],
    },
    {
      feature: 'Messagerie',
      values: ['10 msg/jour', 'Illimitée', 'Illimitée', 'Illimitée'],
    },
    {
      feature: 'Circle of Six',
      values: ['❌', '1/semaine', '1/semaine', '1/semaine'],
    },
    {
      feature: 'VibePlanner',
      values: ['❌', '3/mois', 'Illimité', 'Illimité +'],
    },
    {
      feature: 'Mode Fantôme',
      values: ['❌', '❌', '✅', '✅'],
    },
    {
      feature: 'Visiteurs du profil',
      values: ['❌', '❌', '✅', '✅'],
    },
    {
      feature: 'Filtres premium',
      values: ['❌', 'Basiques', 'Avancés', 'Complets'],
    },
    {
      feature: 'Coaching VibeMentor',
      values: ['❌', '❌', '❌', '✅ Mensuel'],
    },
    {
      feature: 'Événements',
      values: ['Gratuits', 'Exclusifs', 'Exclusifs', 'VIP'],
    },
    {
      feature: 'Support',
      values: ['Formulaire', '5j/7', '7j/7', 'Dédié 7j/7'],
    },
    {
      feature: 'Badge',
      values: ['❌', 'Essentiel', 'Premium', 'Elite'],
    },
  ];

  /**
   * Plan actuellement mis en avant.
   */
  const selectedPlanData = useMemo(() => {
    return plans.find((plan) => plan.id === selectedPlan) ?? plans[2];
  }, [selectedPlan]);

  /**
   * Ouvre ou ferme une card tarif sur mobile.
   */
  const handlePlanToggle = (planId: string) => {
    setSelectedPlan((current) => (current === planId ? null : planId));
  };

  /**
   * Accent visuel (bordure + ring) par offre — permet de distinguer
   * immédiatement Essentiel (corail) / Premium (violet) / Elite (or)
   * au lieu d'un unique violet générique pour toute sélection.
   */
  const planAccent: Record<string, { border: string; ring: string }> = {
    free: { border: 'border-[#8E7AB5]', ring: 'ring-[#8E7AB5]/15' },
    'essential-monthly': { border: 'border-[#FF6B6B]', ring: 'ring-[#FF6B6B]/15' },
    'premium-monthly': { border: 'border-[#9D4EDD]', ring: 'ring-[#9D4EDD]/20' },
    'elite-monthly': { border: 'border-[#FFD166]', ring: 'ring-[#FFD166]/25' },
  };

  /**
   * Couleur de check selon le plan.
   */
  const getCheckColor = (planId: string) => {
    if (planId === 'elite-monthly') return 'text-[#FFD166]';
    if (planId === 'premium-monthly') return 'text-[#9D4EDD]';
    if (planId === 'essential-monthly') return 'text-[#FF6B6B]';
    return 'text-[#8E7AB5]';
  };

  /**
   * Style valeur tableau.
   */
  const getComparisonValueClass = (value: string) => {
    if (value.includes('✅')) return 'text-green-600';
    if (value.includes('❌')) return 'text-red-400';
    return 'text-[#1C1C1C]';
  };

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white text-[#1C1C1C]">
        {/* Hero compact mobile */}
        <section className="relative overflow-hidden px-4 pb-6 pt-20 sm:px-6 sm:pb-12 sm:pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          {/* Orbes premium légères */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 9, repeat: Infinity }}
            className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-white/15 blur-3xl sm:h-72 sm:w-72"
          />

          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 11, repeat: Infinity }}
            className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-pink-200/20 blur-3xl sm:h-96 sm:w-96"
          />

          <div className="relative z-10 mx-auto max-w-6xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
            >
              <Crown className="h-3.5 w-3.5" />
              Offres SferaLuna
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-3 text-3xl font-black leading-tight sm:mb-6 sm:text-5xl md:text-7xl"
            >
              Choisis ton aventure
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto mb-4 max-w-3xl text-sm leading-relaxed opacity-90 sm:mb-8 sm:text-xl"
            >
              Une tarification claire, élégante et sans engagement.
            </motion.p>

            {/* Avantages hero compacts */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto grid max-w-md grid-cols-1 gap-2 text-xs sm:max-w-3xl sm:grid-cols-3 sm:gap-4 sm:text-sm"
            >
              <div className="flex items-center justify-center gap-2 rounded-full bg-white/12 px-3 py-2 backdrop-blur">
                <Shield size={15} />
                <span>Paiement sécurisé</span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-full bg-white/12 px-3 py-2 backdrop-blur">
                <Zap size={15} />
                <span>Annulation libre</span>
              </div>

              <div className="flex items-center justify-center gap-2 rounded-full bg-white/12 px-3 py-2 backdrop-blur">
                <Users size={15} />
                <span>Sans engagement</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Plans */}
        <section className="px-4 py-5 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-7xl">
            {/* Résumé du plan sélectionné sur mobile */}
            <div className="mb-4 rounded-2xl border border-[#E8E0FF] bg-white p-3 shadow-sm sm:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8E7AB5]">
                Plan mis en avant
              </p>

              <div className="mt-1 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-[#1C1C1C]">
                    {selectedPlanData.name}
                  </p>

                  <p className="text-xs text-[#666]">
                    {selectedPlanData.price === 0
                      ? 'Gratuit pour toujours'
                      : `${selectedPlanData.price.toFixed(2)}€/mois`}
                  </p>
                </div>

                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r ${selectedPlanData.color}`}
                >
                  {selectedPlanData.icon}
                </span>
              </div>
            </div>

            {/* Mobile : plans en accordéons compacts */}
            <div className="space-y-3 sm:hidden">
              {plans.map((plan, index) => {
                const isOpen = selectedPlan === plan.id;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                      plan.popular
                        ? `${planAccent[plan.id].border} ring-2 ${planAccent[plan.id].ring}`
                        : isOpen
                          ? planAccent[plan.id].border
                          : 'border-[#E8E0FF]'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute right-3 top-2 z-10 rounded-full bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        Populaire
                      </div>
                    )}

                    {plan.id === 'elite-monthly' && (
                      <div className="absolute right-3 top-2 z-10 rounded-full bg-gradient-to-r from-[#FFD166] to-[#FF9A3C] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        VIP
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handlePlanToggle(plan.id)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${plan.color}`}
                      >
                        {plan.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-bold text-[#1C1C1C]">
                            {plan.name}
                          </h3>
                        </div>

                        <p className="truncate text-xs text-[#666]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-[#1C1C1C]">
                          {plan.price === 0
                            ? '0€'
                            : `${plan.price.toFixed(2)}€`}
                        </p>

                        <p className="text-[10px] text-[#666]">
                          {plan.price === 0 ? 'toujours' : '/mois'}
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
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-3">
                            <div className="mb-3 grid grid-cols-2 gap-2">
                              {plan.features.slice(0, 6).map((feature) => (
                                <div
                                  key={feature}
                                  className="flex items-start gap-1.5 rounded-xl bg-[#F9F7FC] px-2 py-2"
                                >
                                  <Check
                                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${getCheckColor(
                                      plan.id
                                    )}`}
                                  />

                                  <span
                                    className={`text-[11px] leading-snug ${
                                      feature.startsWith('Tout')
                                        ? 'font-bold text-[#1C1C1C]'
                                        : 'text-[#666]'
                                    }`}
                                  >
                                    {feature}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {plan.features.length > 6 && (
                              <div className="mb-3 rounded-xl bg-[#F9F7FC] px-2 py-2">
                                <div className="flex items-start gap-1.5">
                                  <Check
                                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${getCheckColor(
                                      plan.id
                                    )}`}
                                  />

                                  <span className="text-[11px] leading-snug text-[#666]">
                                    {plan.features[6]}
                                  </span>
                                </div>
                              </div>
                            )}

                            <Link
                              href={plan.ctaLink}
                              className={`block rounded-full bg-gradient-to-r px-4 py-2.5 text-center text-sm font-bold text-white shadow-sm transition ${plan.color}`}
                            >
                              {plan.cta}
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Desktop/tablette : cards complètes */}
            <div className="hidden grid-cols-1 gap-6 overflow-visible pt-6 sm:grid md:grid-cols-2 lg:grid-cols-4">
              {plans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="relative flex flex-col"
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] px-4 py-1 text-sm font-semibold text-white shadow-lg">
                      Le plus populaire
                    </div>
                  )}

                  <div
                    className={`relative flex h-full cursor-pointer flex-col rounded-3xl border-2 transition-all duration-300 hover:-translate-y-1 ${
                      plan.popular
                        ? `${planAccent[plan.id].border} bg-white p-6 pt-10 shadow-2xl ring-2 ${planAccent[plan.id].ring}`
                        : selectedPlan === plan.id
                          ? `${planAccent[plan.id].border} bg-white p-6 shadow-2xl ring-2 ${planAccent[plan.id].ring}`
                          : 'border-[#E8E0FF] bg-gradient-to-b from-white to-[#F9F7FC] p-6 hover:border-[#8E7AB5]/50'
                    }`}
                  >
                    <div className="mb-8 text-center">
                      <div
                        className={`mb-4 inline-block rounded-2xl bg-gradient-to-r ${plan.color} p-3`}
                      >
                        {plan.icon}
                      </div>

                      <h3 className="mb-2 text-2xl font-bold text-[#1C1C1C]">
                        {plan.name}
                      </h3>

                      <p className="mb-4 text-sm text-[#666]">
                        {plan.description}
                      </p>

                      <div className="mb-4">
                        <div className="text-5xl font-bold text-[#1C1C1C]">
                          {plan.price === 0
                            ? 'Gratuit'
                            : `${plan.price.toFixed(2)}€`}
                        </div>

                        <div className="text-sm text-[#666]">
                          {plan.price === 0 ? 'Pour toujours' : 'par mois'}
                        </div>
                      </div>
                    </div>

                    <div className="mb-8 flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-3">
                          <Check
                            className={`mt-0.5 h-5 w-5 shrink-0 ${getCheckColor(
                              plan.id
                            )}`}
                          />

                          <span
                            className={`text-sm ${
                              feature.startsWith('Tout')
                                ? 'font-semibold text-[#1C1C1C]'
                                : 'text-[#666]'
                            }`}
                          >
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={plan.ctaLink}
                      className={`mt-auto block rounded-full bg-gradient-to-r px-6 py-3 text-center text-sm font-semibold text-white transition-all hover:scale-[1.02] hover:shadow-xl ${plan.color}`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 text-center text-xs text-[#666] sm:mt-12 sm:text-sm">
              <p>
                Tous les prix sont en euros TTC. Abonnements mensuels sans
                engagement.
              </p>
            </div>
          </div>
        </section>

        {/* Comparaison détaillée */}
        <section className="bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-4 text-center text-2xl font-bold text-[#1C1C1C] sm:mb-8 sm:text-4xl">
              Comparaison <span className="text-[#8E7AB5]">détaillée</span>
            </h2>

            {/* Mobile : accordéons compacts */}
            <div className="space-y-2 sm:hidden">
              {comparisonRows.map((row, index) => {
                const isOpen = openComparisonIndex === index;

                return (
                  <div
                    key={row.feature}
                    className="overflow-hidden rounded-2xl border border-[#E8E0FF] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenComparisonIndex(isOpen ? null : index)
                      }
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-sm">
                        ✨
                      </span>

                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#1C1C1C]">
                        {row.feature}
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
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-2 border-t border-[#F0ECFA] px-3 pb-3 pt-3">
                            {plans.map((plan, planIndex) => (
                              <div
                                key={plan.id}
                                className="rounded-xl bg-[#F9F7FC] p-2 text-center"
                              >
                                <p className="text-[10px] font-bold text-[#8E7AB5]">
                                  {plan.name}
                                </p>

                                <p
                                  className={`mt-1 text-xs font-semibold ${getComparisonValueClass(
                                    row.values[planIndex]
                                  )}`}
                                >
                                  {row.values[planIndex]}
                                </p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Desktop/tablette : tableau complet */}
            <div className="hidden overflow-x-auto rounded-3xl border border-[#E8E0FF] bg-white shadow-sm sm:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8E0FF] bg-[#F9F7FC]">
                    <th className="px-4 py-4 text-left text-lg font-semibold text-[#1C1C1C]">
                      Fonctionnalité
                    </th>

                    {plans.map((plan) => (
                      <th key={plan.id} className="px-4 py-4 text-center">
                        <div className="font-semibold text-[#1C1C1C]">
                          {plan.name}
                        </div>

                        <div className="text-sm text-[#666]">
                          {plan.price === 0
                            ? 'Gratuit'
                            : `${plan.price.toFixed(2)}€/mois`}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.feature} className="border-b border-[#E8E0FF]">
                      <td className="px-4 py-4 text-[#666]">{row.feature}</td>

                      {row.values.map((value, index) => (
                        <td key={`${row.feature}-${index}`} className="px-4 py-4 text-center">
                          <span
                            className={`text-sm font-medium ${getComparisonValueClass(
                              value
                            )}`}
                          >
                            {value}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ accordéon */}
        <section className="px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-center text-2xl font-bold text-[#1C1C1C] sm:mb-8 sm:text-4xl">
              Questions <span className="text-[#8E7AB5]">fréquentes</span>
            </h2>

            <div className="space-y-2 sm:space-y-4">
              {faqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;

                return (
                  <motion.div
                    key={faq.question}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(index * 0.04, 0.2) }}
                    className="overflow-hidden rounded-2xl border border-[#E8E0FF] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-3 px-3 py-3 text-left sm:px-5 sm:py-4"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-sm text-[#8E7AB5]">
                        ?
                      </span>

                      <h3 className="min-w-0 flex-1 text-sm font-bold leading-snug text-[#1C1C1C] sm:text-lg">
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
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-4">
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

        {/* Garantie compacte */}
        <section className="bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-6 sm:px-6 sm:py-10">
          <div className="mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] p-4 text-white shadow-xl sm:p-6"
            >
              <div className="mb-4 flex items-center gap-3 sm:mb-6 sm:gap-4">
                <Shield className="h-9 w-9 shrink-0 sm:h-12 sm:w-12" />

                <div>
                  <h3 className="text-xl font-bold sm:text-2xl">
                    Paiement sécurisé
                  </h3>

                  <p className="text-sm opacity-90 sm:text-base">
                    Géré par Stripe, sans mauvaise surprise.
                  </p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 sm:gap-6">
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <Zap className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Annulation à tout moment</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <Shield className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Données bancaires protégées</span>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-3">
                  <Users className="h-5 w-5 shrink-0" />
                  <span className="text-sm">Support dédié selon le plan</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Call to Action compact */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-3 text-2xl font-bold leading-tight sm:mb-6 sm:text-4xl md:text-5xl"
            >
              Prête à <span className="text-white">vibrer</span> avec nous ?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed opacity-90 sm:mb-10 sm:text-xl"
            >
              Rejoins des femmes qui veulent des connexions plus vraies, plus
              douces et plus libres.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <Link
                href="/auth?mode=register"
                className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <span>Commencer gratuitement</span>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>

              <Link
                href="/guide"
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
              >
                <span>Lire le guide</span>
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour garder une page tarifs très compacte */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
