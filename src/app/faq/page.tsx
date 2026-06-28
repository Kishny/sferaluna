'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  HelpCircle,
  Shield,
  Lock,
  Users,
  Heart,
  MessageCircle,
  X,
} from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

export default function FAQPage() {
  /**
   * Recherche utilisateur.
   * Elle filtre les questions et les réponses.
   */
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Questions ouvertes.
   * On utilise des IDs en string pour éviter les conflits entre :
   * - questions populaires ;
   * - toutes les questions.
   */
  const [openQuestions, setOpenQuestions] = useState<string[]>(['popular-0']);

  /**
   * Catégorie active.
   */
  const [activeCategory, setActiveCategory] = useState<string>('all');

  /**
   * Ouvre / ferme une question.
   */
  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) =>
      prev.includes(id)
        ? prev.filter((questionId) => questionId !== id)
        : [...prev, id]
    );
  };

  /**
   * Catégories principales.
   */
  const categories = [
    { id: 'all', label: 'Toutes', shortLabel: 'Tout', icon: <HelpCircle size={16} /> },
    { id: 'security', label: 'Sécurité', shortLabel: 'Sécurité', icon: <Shield size={16} /> },
    { id: 'account', label: 'Compte', shortLabel: 'Compte', icon: <Lock size={16} /> },
    { id: 'matching', label: 'Rencontres', shortLabel: 'Rencontres', icon: <Users size={16} /> },
    { id: 'premium', label: 'Premium', shortLabel: 'Premium', icon: <Heart size={16} /> },
  ];

  /**
   * Liste complète des questions.
   */
  const allFAQs = [
    {
      question: 'Comment fonctionne le Circle of Six ?',
      answer:
        'Le Circle of Six est notre système de matching unique. Chaque semaine, notre algorithme te présente 6 profils qui correspondent à tes valeurs, intérêts et préférences. Tu peux interagir avec ces 6 personnes toute la semaine, sans la pression des applications de swipe traditionnelles.',
      category: 'matching',
      popular: true,
    },
    {
      question: 'Mes données sont-elles vraiment sécurisées ?',
      answer:
        "Absolument. Nous utilisons un chiffrement sécurisé pour protéger les communications et les données sensibles. Tes photos sont stockées avec précaution et tu peux utiliser le Mode Fantôme pour mieux contrôler ta visibilité. L'équipe de modération vérifie les profils et surveille les interactions.",
      category: 'security',
      popular: true,
    },
    {
      question: 'Puis-je utiliser SferaLuna de manière anonyme ?',
      answer:
        "Oui, grâce au Mode Fantôme. Tu peux créer un profil avec un pseudonyme, flouter tes photos et contrôler précisément qui voit tes informations. Tu décides quand et à qui révéler ton identité.",
      category: 'security',
      popular: true,
    },
    {
      question: 'Comment annuler mon abonnement premium ?',
      answer:
        "Tu peux annuler ton abonnement à tout moment depuis la section Abonnement de tes paramètres. L'accès premium reste actif jusqu'à la fin de la période payée, puis ton compte revient automatiquement à l'offre gratuite.",
      category: 'premium',
    },
    {
      question: 'Que faire en cas de comportement inapproprié ?',
      answer:
        "Signale immédiatement le profil ou le message via le bouton de signalement. Notre équipe de modération traite les signalements rapidement. Tu peux aussi bloquer la personne pour qu'elle ne puisse plus te contacter.",
      category: 'security',
    },
    {
      question: 'Comment fonctionne le VibePlanner ?',
      answer:
        'Le VibePlanner te suggère des idées de rendez-vous créatives basées sur vos intérêts communs. Tu peux proposer une activité, fixer une date et laisser l’autre personne accepter. C’est un excellent moyen de briser la glace avec des plans originaux.',
      category: 'matching',
    },
    {
      question: 'Puis-je modifier mes préférences de matching ?',
      answer:
        "Oui, tu peux ajuster tes préférences à tout moment dans les paramètres de ton compte. L'algorithme s'adapte ensuite à tes nouveaux critères pour les prochaines suggestions.",
      category: 'account',
    },
    {
      question: 'Quelle est la différence entre le compte gratuit et premium ?',
      answer:
        "Le compte gratuit permet de découvrir SferaLuna avec des limites. Les offres payantes débloquent davantage de likes, de messages, de filtres, le Circle of Six, le Mode Fantôme, la visibilité des visiteurs et d'autres avantages selon le plan choisi.",
      category: 'premium',
    },
    {
      question: 'Comment supprimer mon compte définitivement ?',
      answer:
        "Dans les paramètres de ton compte, tu peux demander la suppression définitive. Tes données sont ensuite supprimées selon les délais prévus par notre politique de confidentialité et les obligations légales applicables.",
      category: 'account',
    },
    {
      question: "Le VibeSphere est-il inclus dans l'offre gratuite ?",
      answer:
        'Oui, chaque membre peut accéder au VibeSphere de base. Les plans supérieurs peuvent débloquer des fonctionnalités avancées comme les statistiques détaillées, les playlists personnalisées ou des options communautaires supplémentaires.',
      category: 'premium',
    },
    {
      question: 'Comment participer aux événements LunaGather ?',
      answer:
        "Consulte la section Événements dans l'application ou sur le site. Tu peux t'inscrire aux événements en ligne ou en présentiel. Les membres premium peuvent bénéficier d'un accès anticipé selon les événements.",
      category: 'matching',
    },
    {
      question: 'Puis-je mettre mon compte en pause ?',
      answer:
        "Oui, tu peux mettre ton compte en pause depuis les paramètres. Ton profil est temporairement masqué et tu peux revenir quand tu le souhaites.",
      category: 'account',
    },
  ];

  /**
   * Filtrage par catégorie.
   */
  const categoryFilteredFAQs = useMemo(() => {
    if (activeCategory === 'all') return allFAQs;

    return allFAQs.filter((faq) => faq.category === activeCategory);
  }, [activeCategory]);

  /**
   * Filtrage par recherche.
   */
  const searchResults = useMemo(() => {
    const cleanedSearch = searchTerm.trim().toLowerCase();

    if (!cleanedSearch) return categoryFilteredFAQs;

    return categoryFilteredFAQs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(cleanedSearch) ||
        faq.answer.toLowerCase().includes(cleanedSearch)
    );
  }, [categoryFilteredFAQs, searchTerm]);

  /**
   * Questions populaires.
   * Elles restent visibles seulement quand on n'a pas lancé de recherche.
   */
  const popularFAQs = useMemo(() => {
    return allFAQs.filter((faq) => faq.popular);
  }, []);

  /**
   * Récupère une icône/label lisible selon la catégorie.
   */
  const getCategoryMeta = (category: string) => {
    switch (category) {
      case 'security':
        return {
          emoji: '🔒',
          label: 'Sécurité',
          color: 'from-[#FF6B6B] to-[#FF8E8E]',
        };
      case 'matching':
        return {
          emoji: '👥',
          label: 'Rencontres',
          color: 'from-[#4ECDC4] to-[#44A08D]',
        };
      case 'premium':
        return {
          emoji: '💎',
          label: 'Premium',
          color: 'from-[#FFD166] to-[#FF9A3C]',
        };
      case 'account':
        return {
          emoji: '⚙️',
          label: 'Compte',
          color: 'from-[#8E7AB5] to-[#D9B8FF]',
        };
      default:
        return {
          emoji: '❔',
          label: 'Aide',
          color: 'from-[#8E7AB5] to-[#D9B8FF]',
        };
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white text-[#1C1C1C]">
        {/* Hero compact mobile */}
        <section className="relative overflow-hidden px-4 pb-6 pt-20 sm:px-5 sm:pb-12 sm:pt-28">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <OrbitGlow variant="light" className="left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 sm:h-[36rem] sm:w-[36rem]" />

          {/* Décor léger */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute -left-14 top-16 h-44 w-44 rounded-full bg-white/15 blur-3xl sm:h-72 sm:w-72"
          />

          <motion.div
            animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-pink-200/20 blur-3xl sm:h-80 sm:w-80"
          />

          <div className="relative z-10 mx-auto max-w-6xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium backdrop-blur-sm sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Centre d’aide
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="mb-3 text-3xl font-black leading-tight sm:mb-6 sm:text-5xl md:text-7xl"
            >
              FAQ SferaLuna
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto mb-4 max-w-3xl text-sm leading-relaxed opacity-90 sm:mb-8 sm:text-xl"
            >
              Trouve rapidement les réponses à tes questions.
            </motion.p>

            {/* Barre de recherche compacte */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mx-auto max-w-2xl"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8E7AB5] sm:left-4 sm:h-5 sm:w-5" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Rechercher une question..."
                  className="w-full rounded-2xl border border-white/25 bg-white/15 py-3 pl-10 pr-10 text-sm text-white placeholder-white/65 backdrop-blur-sm outline-none transition focus:ring-2 focus:ring-white/30 sm:py-4 sm:pl-12 sm:pr-12 sm:text-base"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-1 text-white/80 transition hover:bg-white/25 hover:text-white sm:right-4"
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="mt-3 text-xs text-white/80 sm:mt-4 sm:text-sm">
                {searchResults.length} résultat
                {searchResults.length !== 1 ? 's' : ''} trouvé
                {searchResults.length !== 1 ? 's' : ''}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Catégories compactes */}
        <section className="border-b border-[#F0F0F0] bg-white px-4 py-3 sm:px-5 sm:py-5">
          <div className="mx-auto max-w-6xl">
            {/* Mobile : scroll horizontal */}
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0 sm:pb-0">
              {categories.map((category) => {
                const isActive = activeCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all sm:gap-2 sm:px-5 sm:py-3 sm:text-sm ${
                      isActive
                        ? 'border-transparent bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white shadow-md'
                        : 'border-[#E8E0FF] bg-white text-[#666] hover:border-[#8E7AB5]'
                    }`}
                  >
                    {category.icon}
                    <span className="sm:hidden">{category.shortLabel}</span>
                    <span className="hidden sm:inline">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Questions populaires + toutes les questions */}
        <section className="relative overflow-hidden px-4 py-5 sm:px-5 sm:py-10">
          <OrbitGlow className="right-[-10%] top-0 h-72 w-72 sm:h-96 sm:w-96" />
          <OrbitGlow className="left-[-10%] bottom-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-4xl">
            {/* Questions populaires masquées si recherche active */}
            {!searchTerm.trim() && activeCategory === 'all' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-4 sm:mb-8"
                >
                  <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-3xl">
                    Questions{' '}
                    <span className="text-[#8E7AB5]">populaires</span>
                  </h2>

                  <p className="mt-1 text-xs text-[#666] sm:text-sm">
                    Les réponses les plus consultées.
                  </p>
                </motion.div>

                <div className="mb-6 space-y-2 sm:mb-10 sm:space-y-4">
                  {popularFAQs.map((faq, index) => {
                    const id = `popular-${index}`;
                    const isOpen = openQuestions.includes(id);
                    const meta = getCategoryMeta(faq.category);

                    return (
                      <FAQAccordionItem
                        key={id}
                        id={id}
                        faq={faq}
                        isOpen={isOpen}
                        meta={meta}
                        isPopular
                        onToggle={toggleQuestion}
                        index={index}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {/* Toutes les questions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 sm:mb-8"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-3xl">
                Toutes les <span className="text-[#8E7AB5]">questions</span>
              </h2>

              <p className="mt-1 text-xs text-[#666] sm:text-sm">
                Filtre par catégorie ou utilise la recherche.
              </p>
            </motion.div>

            <div className="space-y-2 sm:space-y-4">
              {searchResults.length > 0 ? (
                searchResults.map((faq, index) => {
                  const id = `all-${faq.category}-${index}`;
                  const isOpen = openQuestions.includes(id);
                  const meta = getCategoryMeta(faq.category);

                  return (
                    <FAQAccordionItem
                      key={id}
                      id={id}
                      faq={faq}
                      isOpen={isOpen}
                      meta={meta}
                      onToggle={toggleQuestion}
                      index={index}
                    />
                  );
                })
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-[#D9B8FF] bg-white p-6 text-center sm:p-10"
                >
                  <HelpCircle
                    size={42}
                    className="mx-auto mb-3 text-[#8E7AB5]/50"
                  />

                  <h3 className="mb-2 text-lg font-bold text-[#1C1C1C] sm:text-xl">
                    Aucun résultat trouvé
                  </h3>

                  <p className="text-sm leading-relaxed text-[#666]">
                    Essaie d’autres mots-clés ou change de catégorie.
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* Contact rapide compact */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-6 sm:px-5 sm:py-10">
          <OrbitGlow className="left-1/2 top-0 h-80 w-80 -translate-x-1/2 sm:h-[28rem] sm:w-[28rem]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] p-4 text-white shadow-xl sm:p-6"
            >
              <OrbitGlow variant="light" className="right-[-10%] top-[-20%] h-72 w-72 sm:h-96 sm:w-96" />
              <div className="relative z-10 mb-4 text-center sm:mb-8">
                <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
                  Tu n’as pas trouvé ta réponse ?
                </h2>

                <p className="text-sm leading-relaxed opacity-90 sm:text-lg">
                  Notre support peut t’aider rapidement.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 sm:gap-6">
                <a
                  href="mailto:contact@sferaluna.com"
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/20 sm:block sm:p-5 sm:text-center"
                >
                  <MessageCircle className="h-6 w-6 shrink-0 sm:mx-auto sm:mb-3 sm:h-8 sm:w-8" />

                  <div>
                    <div className="text-sm font-semibold sm:text-base">
                      Email
                    </div>

                    <div className="text-xs opacity-80 sm:text-sm">
                      Réponse sous 24h
                    </div>
                  </div>
                </a>

                <a
                  href="/guide"
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/20 sm:block sm:p-5 sm:text-center"
                >
                  <HelpCircle className="h-6 w-6 shrink-0 sm:mx-auto sm:mb-3 sm:h-8 sm:w-8" />

                  <div>
                    <div className="text-sm font-semibold sm:text-base">
                      Guide complet
                    </div>

                    <div className="text-xs opacity-80 sm:text-sm">
                      Toutes les ressources
                    </div>
                  </div>
                </a>

                <a
                  href="/contact"
                  className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm transition hover:bg-white/20 sm:block sm:p-5 sm:text-center"
                >
                  <Users className="h-6 w-6 shrink-0 sm:mx-auto sm:mb-3 sm:h-8 sm:w-8" />

                  <div>
                    <div className="text-sm font-semibold sm:text-base">
                      Contact
                    </div>

                    <div className="text-xs opacity-80 sm:text-sm">
                      Formulaire détaillé
                    </div>
                  </div>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour rester compact comme les autres pages */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}

/**
 * Petite card accordéon réutilisable pour :
 * - questions populaires ;
 * - toutes les questions.
 */
function FAQAccordionItem({
  id,
  faq,
  isOpen,
  meta,
  isPopular = false,
  onToggle,
  index,
}: {
  id: string;
  faq: {
    question: string;
    answer: string;
    category: string;
    popular?: boolean;
  };
  isOpen: boolean;
  meta: {
    emoji: string;
    label: string;
    color: string;
  };
  isPopular?: boolean;
  onToggle: (id: string) => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: Math.min(index * 0.04, 0.2) }}
      className="relative overflow-hidden rounded-2xl border border-[#E8E0FF] bg-white shadow-sm"
    >
      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${meta.color}`} />

      <button
        type="button"
        onClick={() => onToggle(id)}
        className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:border-[#8E7AB5]/30 sm:gap-4 sm:px-5 sm:py-4 ${
          isPopular ? 'bg-gradient-to-r from-[#F9F7FC] to-white' : 'bg-white'
        }`}
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r ${meta.color} text-sm text-white sm:h-10 sm:w-10`}
        >
          {meta.emoji}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#1C1C1C] transition-colors group-hover:text-[#8E7AB5] sm:text-lg">
            {faq.question}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isPopular && (
              <span className="rounded-full bg-[#8E7AB5]/10 px-2 py-0.5 text-[10px] font-semibold text-[#8E7AB5] sm:text-xs">
                Populaire
              </span>
            )}

            <span className="text-[10px] text-[#666] sm:text-xs">
              {meta.label}
            </span>
          </div>
        </div>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform sm:h-5 sm:w-5 ${
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
            <div className="border-t border-[#F0ECFA] bg-white/60 px-3 pb-3 pt-2 sm:px-5 sm:pb-5 sm:pt-4">
              <p className="text-xs leading-relaxed text-[#666] sm:text-base">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}