'use client';

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import HexagonSix from '@/components/icons/HexagonSix';
import TestimonialsCarousel from '@/components/testimonials/TestimonialsCarousel';
import NewsletterSignup from '@/components/NewsletterSignup';

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

/**
 * Grain discret en fond de page entière.
 * Donne un rendu "édité" plutôt qu'un aplat de couleur plat.
 * Très faible opacité, ne gêne jamais la lisibilité.
 */
function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] opacity-[0.035] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }}
    />
  );
}

/**
 * Particules scintillantes qui dérivent lentement vers le haut.
 * Motif lunaire discret, réutilisé entre les sections pour garder
 * une continuité d'ambiance sur toute la page.
 */
function DriftingSparkles({ count = 8 }: { count?: number }) {
  const sparkles = Array.from({ length: count }, (_, i) => i);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparkles.map((i) => {
        const left = `${(i * 37 + 8) % 100}%`;
        const size = 3 + (i % 3);
        const duration = 9 + (i % 5) * 2;
        const delay = i * 0.7;

        return (
          <motion.span
            key={i}
            className="absolute rounded-full bg-[#D9B8FF]"
            style={{
              left,
              bottom: '-4%',
              width: size,
              height: size,
              boxShadow: '0 0 6px 1px rgba(217,184,255,0.7)',
            }}
            animate={{
              y: ['0%', '-120%'],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
              ease: 'linear',
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Orbes flous animées, réutilisées entre les sections pour que
 * l'ambiance "clair de lune" du hero se prolonge sur toute la page
 * au lieu de retomber brutalement sur du blanc plat.
 */
function AmbientOrbs({ variant = 'default' }: { variant?: 'default' | 'reverse' }) {
  const reverse = variant === 'reverse';

  return (
    <>
      <motion.div
        animate={{
          x: reverse ? [0, -60, 0] : [0, 60, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-[-5%] top-[10%] h-56 w-56 rounded-full bg-gradient-to-r from-[#8E7AB5]/8 to-[#D9B8FF]/8 blur-3xl sm:h-72 sm:w-72"
      />
      <motion.div
        animate={{
          x: reverse ? [0, 50, 0] : [0, -50, 0],
          y: [0, -25, 0],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[-5%] bottom-[5%] h-64 w-64 rounded-full bg-gradient-to-r from-[#D9B8FF]/8 to-[#8E7AB5]/8 blur-3xl sm:h-80 sm:w-80"
      />
    </>
  );
}

/**
 * Croissant de lune décoratif très discret — clin d'œil à la marque
 * "Luna", posé en filigrane derrière certaines sections.
 */
function CrescentMoon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`pointer-events-none absolute opacity-[0.06] ${className}`}
      fill="none"
    >
      <path
        d="M62 8C40 14 26 34 26 56c0 26 20 42 44 42-30 4-58-18-58-50C12 22 34 2 62 8Z"
        fill="#5B4B8A"
      />
    </svg>
  );
}

/**
 * Motif "orbites" discret en arrière-plan — fait écho au nom "Sfera"
 * et casse le fond plat des sections texte (ex. Notre ADN), sans
 * jamais voler l'attention au contenu (opacité très faible).
 */
function OrbitGlow({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 400"
      className={`pointer-events-none absolute opacity-[0.16] ${className}`}
      fill="none"
    >
      <circle cx="200" cy="200" r="190" stroke="#8E7AB5" strokeWidth="2.5" />
      <circle
        cx="200"
        cy="200"
        r="140"
        stroke="#8E7AB5"
        strokeWidth="2.5"
        strokeDasharray="8 12"
      />
      <circle cx="200" cy="200" r="90" stroke="#5B4B8A" strokeWidth="2.5" />
      <circle cx="200" cy="200" r="5" fill="#5B4B8A" />
      <circle cx="390" cy="200" r="7" fill="#8E7AB5" />
      <circle cx="60" cy="90" r="6" fill="#8E7AB5" />
      <circle cx="310" cy="320" r="5" fill="#5B4B8A" />
    </svg>
  );
}

/**
 * Card avec léger effet de bascule 3D au survol (desktop uniquement).
 * Donne une sensation de profondeur/relief plus marquée qu'un simple scale.
 */
function TiltCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        setRotate({ x: py * -8, y: px * 8 });
      }}
      onMouseLeave={() => setRotate({ x: 0, y: 0 })}
      animate={{ rotateX: rotate.x, rotateY: rotate.y }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ transformPerspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Portrait hero (image fournie : deux femmes).
 * Place le fichier dans /public/images/hero-women.jpg (ou .png/.webp,
 * adapter `src` ci-dessous en conséquence).
 *
 * - Mobile : image compacte au-dessus du texte (hauteur plafonnée pour
 *   ne pas pousser les CTA trop bas).
 * - Desktop (lg+) : colonne de gauche, pleine hauteur, badges flottants.
 */
function HeroPortrait() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8 }}
      className="relative mx-auto w-full max-w-sm sm:max-w-md lg:mx-0 lg:max-w-none"
    >
      {/* Halo décoratif derrière le portrait */}
      <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-[#8E7AB5]/25 via-[#D9B8FF]/20 to-transparent blur-2xl sm:-inset-6" />

      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white/60 shadow-[0_24px_60px_-16px_rgba(91,75,138,0.45),0_8px_20px_-8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)] sm:aspect-[4/5] sm:rounded-[2rem] lg:aspect-[3/4]">
        <Image
          src="/images/image.png"
          alt="Deux femmes souriantes, complices, illustrant la communauté SferaLuna"
          fill
          priority
          sizes="(min-width: 1024px) 480px, (min-width: 640px) 420px, 90vw"
          className="object-cover"
        />

        {/* Léger voile pour fondre l'image dans la palette du site */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0b2e]/15 via-transparent to-[#8E7AB5]/10" />
      </div>

      {/* Badge flottant — masqué sur mobile pour ne pas surcharger */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute -right-4 -top-4 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3 py-2 shadow-[0_10px_24px_-8px_rgba(91,75,138,0.4)] backdrop-blur-md sm:flex lg:-right-6"
      >
        <span className="text-base">✓</span>
        <span className="text-xs font-semibold text-[#5B4B8A]">
          Profils vérifiés
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-3 py-2 shadow-[0_10px_24px_-8px_rgba(91,75,138,0.4)] backdrop-blur-md sm:flex lg:-left-6"
      >
        <span className="text-base">💜</span>
        <span className="text-xs font-semibold text-[#5B4B8A]">
          Rencontres sincères
        </span>
      </motion.div>
    </motion.div>
  );
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
      icon: <HexagonSix size={26} />,
      title: 'Circle of Six',
      description: 'Des liens choisis, pas des milliers de swipes.',
      gradient: 'from-violet-500 to-purple-500',
      link: '/circle',
    },
    {
      icon: '👻',
      title: 'Mode Fantôme',
      description: 'Discrétion assurée, photos floutées, pseudonymes.',
      gradient: 'from-indigo-500 to-blue-500',
      link: '/mode-fantome',
    },
    {
      icon: '🌌',
      title: 'VibeSphere immersif',
      description: 'Exprime ta vibe dans ton espace personnalisé.',
      gradient: 'from-blue-500 to-sky-500',
      link: '/vibesphere',
    },
    {
      icon: '💡',
      title: 'VibePlanner',
      description: 'Des idées de rendez-vous qui vous rassemblent.',
      gradient: 'from-amber-400 to-yellow-500',
      link: '/vibeplanner',
    },
    {
      icon: '🎉',
      title: 'Événements LunaGather',
      description: 'Participe à des moments inoubliables.',
      gradient: 'from-pink-500 to-fuchsia-500',
      link: '/evenements',
    },
    {
      icon: '🧠',
      title: 'Coaching VibeMentor',
      description: 'Sois guidée avec bienveillance et expertise.',
      gradient: 'from-emerald-500 to-teal-500',
      link: '/vibementor',
    },
  ];

  /**
   * Identité visuelle par fonctionnalité — chaque card reçoit sa propre
   * couleur (contour lumineux, fond teinté, badge icône, barre d'accent).
   */
  const featureThemes = [
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(142,122,181,0.4),0_14px_32px_-10px_rgba(142,122,181,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(142,122,181,0.4),0_22px_48px_-12px_rgba(142,122,181,0.45)]',
      overlay: 'from-violet-100 via-white to-white',
      iconBg: 'bg-violet-400/15',
      bar: 'from-violet-500 to-purple-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(99,102,241,0.4),0_14px_32px_-10px_rgba(99,102,241,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(99,102,241,0.4),0_22px_48px_-12px_rgba(99,102,241,0.45)]',
      overlay: 'from-indigo-100 via-white to-white',
      iconBg: 'bg-indigo-400/15',
      bar: 'from-indigo-500 to-blue-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(59,130,246,0.4),0_14px_32px_-10px_rgba(59,130,246,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(59,130,246,0.4),0_22px_48px_-12px_rgba(59,130,246,0.45)]',
      overlay: 'from-blue-100 via-white to-white',
      iconBg: 'bg-blue-400/15',
      bar: 'from-blue-500 to-sky-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(245,158,11,0.4),0_14px_32px_-10px_rgba(245,158,11,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(245,158,11,0.4),0_22px_48px_-12px_rgba(245,158,11,0.45)]',
      overlay: 'from-amber-100 via-white to-white',
      iconBg: 'bg-amber-400/15',
      bar: 'from-amber-400 to-yellow-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(236,72,153,0.4),0_14px_32px_-10px_rgba(236,72,153,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(236,72,153,0.4),0_22px_48px_-12px_rgba(236,72,153,0.45)]',
      overlay: 'from-pink-100 via-white to-white',
      iconBg: 'bg-pink-400/15',
      bar: 'from-pink-500 to-fuchsia-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(16,185,129,0.4),0_14px_32px_-10px_rgba(16,185,129,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(16,185,129,0.4),0_22px_48px_-12px_rgba(16,185,129,0.45)]',
      overlay: 'from-emerald-100 via-white to-white',
      iconBg: 'bg-emerald-400/15',
      bar: 'from-emerald-500 to-teal-500',
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

  /**
   * Identité visuelle par valeur — chaque card ADN reçoit sa propre
   * couleur (contour lumineux, fond teinté, badge icône, barre d'accent).
   */
  const valueThemes = [
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(245,158,11,0.4),0_14px_32px_-10px_rgba(245,158,11,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(245,158,11,0.4),0_22px_48px_-12px_rgba(245,158,11,0.45)]',
      overlay: 'from-amber-100 via-white to-white',
      iconBg: 'bg-amber-400/15',
      bar: 'from-amber-400 to-yellow-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(59,130,246,0.4),0_14px_32px_-10px_rgba(59,130,246,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(59,130,246,0.4),0_22px_48px_-12px_rgba(59,130,246,0.45)]',
      overlay: 'from-blue-100 via-white to-white',
      iconBg: 'bg-blue-400/15',
      bar: 'from-blue-400 to-cyan-500',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(168,85,247,0.4),0_14px_32px_-10px_rgba(168,85,247,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(168,85,247,0.4),0_22px_48px_-12px_rgba(168,85,247,0.45)]',
      overlay: 'from-purple-100 via-pink-50 to-white',
      iconBg: 'bg-purple-400/15',
      bar: 'from-pink-400 via-purple-400 to-blue-400',
    },
    {
      shadowBase:
        'shadow-[0_0_0_1.5px_rgba(236,72,153,0.4),0_14px_32px_-10px_rgba(236,72,153,0.28)]',
      shadowHover:
        'hover:shadow-[0_0_0_2px_rgba(236,72,153,0.4),0_22px_48px_-12px_rgba(236,72,153,0.45)]',
      overlay: 'from-pink-100 via-white to-white',
      iconBg: 'bg-pink-400/15',
      bar: 'from-pink-500 to-fuchsia-500',
    },
  ];

  return (
    <>
      <Header />
      <GrainOverlay />

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

            <CrescentMoon className="right-[6%] top-[8%] h-32 w-32 rotate-[-15deg] sm:h-48 sm:w-48" />
            <DriftingSparkles count={10} />
          </motion.div>

          <motion.div
            className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 xl:gap-16"
            style={{ scale: heroScale }}
          >
            <HeroPortrait />

            <div className="text-center lg:text-left">
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
              <span
                className="bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent [filter:drop-shadow(0_6px_28px_rgba(142,122,181,0.4))]"
              >
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
              className="mx-auto mt-4 max-w-2xl text-sm font-light leading-relaxed text-[#4B4B4B] sm:mt-8 sm:text-xl md:text-2xl lg:mx-0"
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
              className="mx-auto mt-2 max-w-2xl text-xs text-[#666] sm:mt-4 sm:text-lg lg:mx-0"
            >
              Sans jugements. Sans pression. Juste toi, et ta vibe.
            </motion.p>

            {/* Boutons hero plus serrés */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-5 flex flex-col items-center justify-center gap-2.5 sm:mt-12 sm:flex-row sm:gap-4 lg:justify-start"
            >
              <Link href="/auth?mode=register" className="group w-full sm:w-auto">
                <button className="relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_36px_-8px_rgba(91,75,138,0.55),0_4px_10px_-4px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-300 hover:shadow-[0_20px_46px_-8px_rgba(91,75,138,0.65),0_6px_14px_-4px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
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
                <button className="group flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#8E7AB5] px-5 py-3 text-sm font-semibold text-[#8E7AB5] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#8E7AB5] hover:text-white hover:shadow-[0_14px_32px_-10px_rgba(142,122,181,0.45)] sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
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
              className="mx-auto mt-5 grid max-w-2xl grid-cols-4 gap-2 sm:mt-12 sm:grid-cols-4 sm:gap-6 lg:mx-0 lg:max-w-xl"
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
            </div>
          </motion.div>
        </section>

        {/* Valeurs / ADN */}
        <section
          id="valeurs"
          className="relative overflow-hidden px-4 py-5 sm:px-6 sm:py-16 lg:py-20"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F9F7FC]/60 to-transparent" />
          <AmbientOrbs />
          <CrescentMoon className="left-[4%] top-[12%] h-24 w-24 rotate-[20deg] sm:h-36 sm:w-36" />
          <OrbitGlow className="right-[-8%] top-1/2 h-[22rem] w-[22rem] -translate-y-1/2 sm:h-[30rem] sm:w-[30rem]" />

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
                    className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_24px_-8px_rgba(142,122,181,0.18)] backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenValueIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl ${
                          (valueThemes[index] ?? valueThemes[0]).iconBg
                        }`}
                      >
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
              {values.map((value, index) => {
                const theme = valueThemes[index] ?? valueThemes[0];

                return (
                  <motion.div
                    key={value.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    whileHover={{ y: -8, transition: { duration: 0.2 } }}
                    className="group relative h-full"
                  >
                    <TiltCard
                      className={`relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-5 backdrop-blur-xl transition-all duration-300 sm:p-6 ${theme.shadowBase} ${theme.shadowHover}`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${theme.overlay} opacity-40 transition-opacity duration-500 group-hover:opacity-80`}
                      />

                      <div
                        className={`relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${theme.iconBg}`}
                      >
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

                      <div
                        className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.bar} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
                      />
                    </TiltCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Fonctionnalités principales */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-5 sm:px-6 sm:py-10 lg:py-12">
          <AmbientOrbs variant="reverse" />
          <DriftingSparkles count={6} />
          <OrbitGlow className="left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 sm:h-[42rem] sm:w-[42rem]" />
          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-4 text-center sm:mb-6"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-3xl md:text-4xl">
                Une expérience <span className="text-[#8E7AB5]">unique</span>
              </h2>

              <p className="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-[#666] sm:mt-2 sm:text-base">
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
                    className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-[0_8px_24px_-8px_rgba(142,122,181,0.18)] backdrop-blur-xl"
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
            <div className="hidden grid-cols-1 gap-3 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {features.map((feature, index) => {
                const theme = featureThemes[index] ?? featureThemes[0];

                return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                >
                  <Link href={feature.link} className="block h-full">
                    <TiltCard
                      className={`group relative h-full overflow-hidden rounded-2xl border border-white/70 bg-white/70 p-4 backdrop-blur-xl transition-all duration-300 sm:p-5 ${theme.shadowBase} ${theme.shadowHover}`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${theme.overlay} opacity-40 transition-opacity duration-500 group-hover:opacity-80`}
                      />

                      <motion.div
                        className={`relative z-10 mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${theme.iconBg}`}
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

                      <h3 className="relative z-10 mb-1.5 text-lg font-semibold text-[#5B4B8A] sm:text-xl">
                        {feature.title}
                      </h3>

                      <p className="relative z-10 pr-6 text-sm leading-relaxed text-[#666]">
                        {feature.description}
                      </p>

                      <div
                        className={`absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.bar} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
                      />

                      <motion.div
                        className="absolute bottom-5 right-5 text-[#8E7AB5] opacity-0 transition-opacity group-hover:opacity-100"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </TiltCard>
                  </Link>
                </motion.div>
                );
              })}
            </div>

            {/* Comparatif : accordéon mobile + bloc complet desktop */}
            <motion.div
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-5 sm:mt-10"
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
                    className="relative overflow-hidden rounded-3xl border-2 border-[#8E7AB5]/30 bg-gradient-to-br from-[#f0ecff] to-[#e8e0ff] p-4 shadow-[0_18px_44px_-14px_rgba(142,122,181,0.4)] sm:p-6"
                  >
                    <div className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] px-3 py-1 text-xs font-medium text-white shadow-[0_4px_12px_-2px_rgba(142,122,181,0.5)]">
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

        {/* Témoignages — preuve sociale juste avant la conversion */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F9F7FC] to-[#F0ECFF] px-4 py-7 sm:px-6 sm:py-14">
          <OrbitGlow className="right-[-8%] top-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              className="mb-5 text-center sm:mb-10"
            >
              <h2 className="text-xl font-bold text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Elles parlent de{' '}
                <span className="text-[#8E7AB5]">SferaLuna</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-3 sm:text-xl">
                Des vrais mots, de vraies femmes. La confiance se construit
                ensemble.
              </p>
            </motion.div>

            <TestimonialsCarousel layout="carousel" limit={6} autoPlay />
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
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-[0_16px_40px_-10px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_22px_50px_-10px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.7)] sm:w-auto sm:px-12 sm:py-4 sm:text-lg">
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
        <section className="relative overflow-hidden bg-gradient-to-br from-[#faf9ff] to-[#f0ecff] px-4 py-6 md:py-12">
          <AmbientOrbs />
          <CrescentMoon className="right-[8%] bottom-[10%] h-28 w-28 rotate-[10deg] sm:h-40 sm:w-40" />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 mx-auto max-w-3xl text-center"
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
              <div className="flex w-full cursor-default select-none items-center justify-center gap-3 rounded-2xl bg-[#1a0b2e] px-5 py-3 text-white shadow-[0_14px_32px_-10px_rgba(26,11,46,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto sm:px-6 sm:py-3.5">
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

              <div className="flex w-full cursor-default select-none items-center justify-center gap-3 rounded-2xl bg-[#1a0b2e] px-5 py-3 text-white shadow-[0_14px_32px_-10px_rgba(26,11,46,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto sm:px-6 sm:py-3.5">
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

            <div className="mx-auto mt-4 max-w-md">
              <NewsletterSignup variant="light" />
            </div>
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