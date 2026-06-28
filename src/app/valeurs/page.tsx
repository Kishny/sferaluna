// src/app/valeurs/page.tsx

"use client";

/**
 * Page Valeurs SferaLuna.
 *
 * Cette page gère :
 * - l'affichage des valeurs fondamentales ;
 * - les principes directeurs ;
 * - les statistiques dynamiques ;
 * - les témoignages validés ;
 * - le formulaire de témoignage pour les utilisateurs connectés ;
 * - le CTA final.
 *
 * Objectif mobile-first :
 * - hero très compact sur mobile ;
 * - sections moins hautes ;
 * - cards valeurs en accordéon sur mobile ;
 * - principes affichés en pills compactes ;
 * - témoignages et formulaire plus courts visuellement ;
 * - desktop/tablette garde les grandes cards premium.
 */

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import {
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  Lock,
  MessageSquarePlus,
  Moon,
  Shield,
  Sparkles,
  Star,
  Zap,
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

interface Testimonial {
  _id: string;
  authorName: string;
  age?: number;
  content: string;
  createdAt: string;
}

interface ValueItem {
  icon: React.ReactNode;
  title: string;
  shortTitle: string;
  description: string;
  details: string;
  gradient: string;
  color: string;
  features: string[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Motif "orbites" décoratif en arrière-plan — fait écho au nom "Sfera"
 * et casse le fond plat des sections. `variant="light"` s'utilise sur
 * fond coloré/sombre (CTA final), `variant="default"` sur fond clair.
 */
function OrbitGlow({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "light";
}) {
  const primary = variant === "light" ? "#FFFFFF" : "#8E7AB5";
  const secondary = variant === "light" ? "#FFFFFF" : "#5B4B8A";
  const opacityClass = variant === "light" ? "opacity-[0.14]" : "opacity-[0.16]";

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
// Données statiques
// ─────────────────────────────────────────────

/**
 * Valeurs détaillées.
 * Sur mobile, chaque valeur est rendue en accordéon compact.
 * Sur tablette/desktop, elles sont affichées en cards complètes.
 */
const values: ValueItem[] = [
  {
    icon: <Sparkles className="h-5 w-5 sm:h-8 sm:w-8" />,
    title: "✨ Authenticité Radicale",
    shortTitle: "Authenticité",
    description: "Être soi, sans masque. Des profils vrais, des intentions claires.",
    details:
      "Nous encourageons chaque membre à montrer sa véritable nature, sans filtres ni artifices. C'est l'essence même de nos connexions.",
    gradient: "from-[#FFD166] to-[#FF9A3C]",
    color: "text-[#FF9A3C]",
    features: ["Profils vérifiés", "Intentions transparentes", "Communication honnête"],
  },
  {
    icon: <Shield className="h-5 w-5 sm:h-8 sm:w-8" />,
    title: "🔒 Sécurité Totale",
    shortTitle: "Sécurité",
    description: "Contrôle total de ta visibilité, de ton rythme et de ton intimité.",
    details:
      "Ton espace, tes règles. Modération, signalements, confidentialité et outils de discrétion avancés.",
    gradient: "from-[#8E7AB5] to-[#6B5F8E]",
    color: "text-[#8E7AB5]",
    features: ["Mode Fantôme", "Photos floutées", "Pseudonymes protégés"],
  },
  {
    icon: <Globe className="h-5 w-5 sm:h-8 sm:w-8" />,
    title: "🌈 Inclusivité Absolue",
    shortTitle: "Inclusivité",
    description: "Toutes les femmes, toutes les relations, toutes les histoires.",
    details:
      "Un espace où chaque femme est respectée. Hétérosexuelle, lesbienne, bisexuelle, pansexuelle ou en questionnement.",
    gradient: "from-[#FF6B6B] to-[#FF8E8E]",
    color: "text-[#FF6B6B]",
    features: ["Communauté LGBTQ+", "Espaces sûrs", "Ressources éducatives"],
  },
  {
    icon: <Heart className="h-5 w-5 sm:h-8 sm:w-8" />,
    title: "💜 Bienveillance Active",
    shortTitle: "Bienveillance",
    description: "Une communauté qui prend soin les unes des autres.",
    details:
      "Modération proactive, signalement simplifié et culture du consentement avant tout.",
    gradient: "from-[#D9B8FF] to-[#B5A3D9]",
    color: "text-[#D9B8FF]",
    features: ["Modération", "Consentement", "Support communautaire"],
  },
  {
    icon: <Zap className="h-5 w-5 sm:h-8 sm:w-8" />,
    title: "⚡ Évolution Personnelle",
    shortTitle: "Évolution",
    description: "Grandir ensemble à travers des expériences enrichissantes.",
    details:
      "Ateliers, événements et ressources pour le développement personnel et relationnel.",
    gradient: "from-[#4ECDC4] to-[#44A08D]",
    color: "text-[#4ECDC4]",
    features: ["Ateliers", "Ressources", "Événements exclusifs"],
  },
  {
    icon: <Moon className="h-5 w-5 sm:h-8 sm:w-8" />,
    title: "🌙 Spiritualité Connectée",
    shortTitle: "Connexion",
    description: "Renouer avec soi-même et les autres de manière profonde.",
    details:
      "Cercles de parole, méditations guidées et rituels pour une connexion plus authentique.",
    gradient: "from-[#9D4EDD] to-[#7B2CBF]",
    color: "text-[#9D4EDD]",
    features: ["Cercles de parole", "Méditations", "Rituels"],
  },
];

/**
 * Thème couleur par carte de valeur (desktop) — contour/fond lumineux
 * distinct pour chacune, basé sur la teinte déjà associée à `value.color`.
 */
const valueThemes = [
  {
    // Authenticité — #FF9A3C
    shadowBase:
      "shadow-[0_0_0_1.5px_rgba(255,154,60,0.4),0_14px_32px_-10px_rgba(255,154,60,0.28)]",
    shadowHover:
      "hover:shadow-[0_0_0_2px_rgba(255,154,60,0.4),0_22px_48px_-12px_rgba(255,154,60,0.45)]",
    overlay: "from-[#FF9A3C]/10 via-white to-white",
    iconBg: "bg-[#FF9A3C]/10",
  },
  {
    // Sécurité — #8E7AB5
    shadowBase:
      "shadow-[0_0_0_1.5px_rgba(142,122,181,0.4),0_14px_32px_-10px_rgba(142,122,181,0.28)]",
    shadowHover:
      "hover:shadow-[0_0_0_2px_rgba(142,122,181,0.4),0_22px_48px_-12px_rgba(142,122,181,0.45)]",
    overlay: "from-[#8E7AB5]/10 via-white to-white",
    iconBg: "bg-[#8E7AB5]/10",
  },
  {
    // Inclusivité — #FF6B6B
    shadowBase:
      "shadow-[0_0_0_1.5px_rgba(255,107,107,0.4),0_14px_32px_-10px_rgba(255,107,107,0.28)]",
    shadowHover:
      "hover:shadow-[0_0_0_2px_rgba(255,107,107,0.4),0_22px_48px_-12px_rgba(255,107,107,0.45)]",
    overlay: "from-[#FF6B6B]/10 via-white to-white",
    iconBg: "bg-[#FF6B6B]/10",
  },
  {
    // Bienveillance — #D9B8FF
    shadowBase:
      "shadow-[0_0_0_1.5px_rgba(217,184,255,0.5),0_14px_32px_-10px_rgba(217,184,255,0.35)]",
    shadowHover:
      "hover:shadow-[0_0_0_2px_rgba(217,184,255,0.5),0_22px_48px_-12px_rgba(217,184,255,0.5)]",
    overlay: "from-[#D9B8FF]/15 via-white to-white",
    iconBg: "bg-[#D9B8FF]/15",
  },
  {
    // Évolution — #4ECDC4
    shadowBase:
      "shadow-[0_0_0_1.5px_rgba(78,205,196,0.4),0_14px_32px_-10px_rgba(78,205,196,0.28)]",
    shadowHover:
      "hover:shadow-[0_0_0_2px_rgba(78,205,196,0.4),0_22px_48px_-12px_rgba(78,205,196,0.45)]",
    overlay: "from-[#4ECDC4]/10 via-white to-white",
    iconBg: "bg-[#4ECDC4]/10",
  },
  {
    // Connexion — #9D4EDD
    shadowBase:
      "shadow-[0_0_0_1.5px_rgba(157,78,221,0.4),0_14px_32px_-10px_rgba(157,78,221,0.28)]",
    shadowHover:
      "hover:shadow-[0_0_0_2px_rgba(157,78,221,0.4),0_22px_48px_-12px_rgba(157,78,221,0.45)]",
    overlay: "from-[#9D4EDD]/10 via-white to-white",
    iconBg: "bg-[#9D4EDD]/10",
  },
];

/**
 * Principes directeurs.
 * Sur mobile, ils sont affichés en grille compacte.
 */
const principles = [
  "Zéro harcèlement",
  "Respect des limites",
  "Confidentialité",
  "Écoute active",
  "Diversité célébrée",
  "Apprentissage continu",
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
  hidden: { y: 18, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.42, ease: "easeOut" },
  },
};

const cardVariants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: (index: number) => ({
    scale: 1,
    opacity: 1,
    transition: {
      delay: index * 0.06,
      duration: 0.42,
      ease: "easeOut",
    },
  }),
  hover: {
    y: -10,
    scale: 1.025,
    transition: { duration: 0.25 },
  },
};

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function ValeursPage() {
  const { data: session } = useSession();
  const sessionUser = session?.user as { id?: string } | undefined;

  /**
   * Index de la valeur ouverte sur mobile.
   * null = aucun accordéon ouvert.
   */
  const [openValueIndex, setOpenValueIndex] = useState<number | null>(null);

  /**
   * Hover desktop uniquement.
   */
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  /**
   * Statistiques dynamiques.
   */
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  /**
   * Témoignages publics validés.
   */
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  /**
   * Formulaire témoignage.
   */
  const [showForm, setShowForm] = useState(false);
  const [formContent, setFormContent] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formStatus, setFormStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [formError, setFormError] = useState("");

  /**
   * Effets scroll du hero.
   */
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.35]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.96]);

  /**
   * Chargement initial :
   * - statistiques ;
   * - témoignages.
   */
  useEffect(() => {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setSiteStats(data.stats);
      })
      .catch(() => {});

    fetch("/api/testimonials")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setTestimonials(data.testimonials ?? []);
      })
      .catch(() => {});
  }, []);

  /**
   * Envoi d'un témoignage.
   * L'API est conservée telle quelle.
   */
  const handleTestimonialSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setFormStatus("loading");
    setFormError("");

    try {
      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: formContent,
          age: formAge ? parseInt(formAge, 10) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus("success");
        setFormContent("");
        setFormAge("");
        setShowForm(false);
      } else {
        setFormError(data.error || "Une erreur est survenue.");
        setFormStatus("error");
      }
    } catch {
      setFormError("Une erreur est survenue. Réessaie.");
      setFormStatus("error");
    }
  };

  const currentTestimonial = testimonials[testimonialIdx];

  return (
    <>
      <Header />

      <main className="min-h-screen overflow-hidden bg-gradient-to-b from-[#F5F3F7] to-white pt-16 text-[#1C1C1C] sm:pt-20">
        {/* ─────────────────────────────
            Hero compact mobile
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-6 sm:px-6 sm:py-12 md:py-14">
          <motion.div
            className="absolute inset-0"
            style={{ opacity: heroOpacity, scale: heroScale }}
          >
            <div className="absolute left-0 top-0 h-full w-full bg-gradient-to-br from-[#FDF7FA]/80 via-[#F5F0FF]/60 to-[#E8DFFF]/40" />

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
          </motion.div>

          <OrbitGlow className="right-[-6%] top-1/4 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-5xl text-center">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.12, type: "spring" }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#5B4B8A] backdrop-blur sm:mb-8 sm:px-4 sm:py-2 sm:text-sm"
            >
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8E7AB5] sm:h-2 sm:w-2" />
              L&apos;ADN de SferaLuna
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.65 }}
              className="text-3xl font-black leading-tight sm:text-5xl md:text-7xl"
            >
              <span className="bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent">
                Nos valeurs
              </span>

              <br />

              <span className="text-2xl font-light text-[#1C1C1C] sm:text-4xl md:text-6xl">
                fondamentales
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.65 }}
              className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#4B4B4B] sm:mt-6 sm:text-xl"
            >
              SferaLuna est née pour créer un espace{" "}
              <span className="font-semibold text-[#8E7AB5]">
                sûr, doux et libre
              </span>
              , où chaque femme peut explorer ses connexions sans pression.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.65 }}
              className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-lg"
            >
              Notre mission : redéfinir les rencontres entre femmes avec plus de
              respect, de clarté et d&apos;humanité.
            </motion.p>
          </div>
        </section>

        {/* ─────────────────────────────
            Principes compacts
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-white px-4 py-5 sm:px-6 sm:py-12">
          <OrbitGlow className="left-[-8%] top-1/2 h-80 w-80 -translate-y-1/2 sm:h-[28rem] sm:w-[28rem]" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="mb-4 text-center sm:mb-8"
            >
              <h2 className="text-xl font-black text-[#1C1C1C] sm:text-4xl">
                Nos <span className="text-[#8E7AB5]">principes</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-3 sm:text-base">
                Les règles d&apos;or qui guident chaque interaction.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
            >
              {principles.map((principle) => (
                <motion.div
                  key={principle}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }}
                  className="flex items-center gap-2 rounded-xl border border-[#F0F0F0] bg-gradient-to-r from-[#F9F7FC] to-white px-3 py-2 text-xs font-medium text-[#1C1C1C] transition-all hover:border-[#8E7AB5]/30 sm:gap-3 sm:p-4 sm:text-base"
                >
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#8E7AB5] sm:h-2 sm:w-2" />
                  <span className="leading-snug">{principle}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            Valeurs détaillées
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-[#F9F7FC] px-4 py-5 sm:px-6 sm:py-12 lg:py-16">
          <OrbitGlow className="left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 sm:h-[40rem] sm:w-[40rem]" />

          <div className="relative z-10 mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-black text-[#1C1C1C] sm:text-4xl md:text-5xl">
                Les piliers de notre{" "}
                <span className="text-[#8E7AB5]">communauté</span>
              </h2>

              <p className="mx-auto mt-1 max-w-3xl text-xs leading-relaxed text-[#666] sm:mt-4 sm:text-xl">
                Six valeurs qui structurent l&apos;expérience SferaLuna.
              </p>
            </motion.div>

            {/* Mobile : accordéons compacts */}
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
                    className="overflow-hidden rounded-2xl border border-[#E9E3F5] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenValueIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left"
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${value.gradient} text-white`}
                      >
                        {value.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#5B4B8A]">
                          {value.shortTitle}
                        </h3>

                        <p className="truncate text-[11px] text-[#666]">
                          {value.description}
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
                              {value.description}
                            </p>

                            <p className="mt-1.5 text-xs leading-relaxed text-[#666]">
                              {value.details}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {value.features.map((feature) => (
                                <span
                                  key={feature}
                                  className="rounded-full bg-[#8E7AB5]/10 px-2 py-1 text-[10px] font-medium text-[#5B4B8A]"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
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
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="hidden grid-cols-1 gap-5 sm:grid md:grid-cols-2 lg:grid-cols-3"
            >
              {values.map((value, index) => {
                const theme = valueThemes[index] ?? valueThemes[0];

                return (
                <motion.div
                  key={value.title}
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  whileHover="hover"
                  viewport={{ once: true }}
                  onMouseEnter={() => setHoveredValue(index)}
                  onMouseLeave={() => setHoveredValue(null)}
                  className="group relative"
                >
                  <div
                    className={`relative h-full overflow-hidden rounded-3xl border border-[#F0F0F0] bg-white p-6 transition-all duration-300 ${theme.shadowBase} ${theme.shadowHover}`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${theme.overlay} opacity-40 transition-opacity duration-500 group-hover:opacity-80`}
                    />

                    <div className="relative">
                      <motion.div
                        className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${theme.iconBg} ${value.color}`}
                        animate={{
                          scale:
                            hoveredValue === index ? [1, 1.16, 1] : 1,
                          rotate:
                            hoveredValue === index ? [0, 8, -8, 0] : 0,
                        }}
                        transition={{ duration: 0.45 }}
                      >
                        {value.icon}
                      </motion.div>

                      <h3 className="mb-3 text-2xl font-semibold text-[#1C1C1C]">
                        {value.title}
                      </h3>

                      <p className="mb-3 text-base font-medium text-[#4B4B4B]">
                        {value.description}
                      </p>

                      <p className="mb-5 text-sm leading-relaxed text-[#666]">
                        {value.details}
                      </p>

                      <div className="space-y-2">
                        {value.features.map((feature, featureIndex) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2"
                          >
                            <motion.div
                              animate={{
                                x:
                                  hoveredValue === index ? [0, 5, 0] : 0,
                                opacity: hoveredValue === index ? 1 : 0.7,
                              }}
                              transition={{ delay: featureIndex * 0.08 }}
                              className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]"
                            />

                            <span className="text-sm text-[#666]">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${value.gradient} opacity-70 transition-opacity duration-300 group-hover:opacity-100`}
                    />
                  </div>
                </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* ─────────────────────────────
            Chiffres clés compacts
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-white px-4 py-5 sm:px-6 sm:py-12">
          <OrbitGlow className="right-[-10%] bottom-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center sm:mb-8"
            >
              <h2 className="text-xl font-black text-[#1C1C1C] sm:text-4xl">
                Notre impact en{" "}
                <span className="text-[#8E7AB5]">chiffres</span>
              </h2>

              <p className="mx-auto mt-1 max-w-2xl text-xs leading-relaxed text-[#666] sm:mt-3 sm:text-base">
                Des repères simples sur l&apos;activité de la communauté.
              </p>
            </motion.div>

            <div className="grid grid-cols-4 gap-2 sm:gap-8">
              {[
                {
                  value: siteStats ? formatStat(siteStats.membres) : "…",
                  label: "Membres",
                  icon: "👩‍❤️‍👩",
                },
                {
                  value: siteStats ? formatStat(siteStats.matchs) : "…",
                  label: "Matchs",
                  icon: "💜",
                },
                {
                  value: "24/7",
                  label: "Modération",
                  icon: "🛡️",
                },
                {
                  value: siteStats ? formatStat(siteStats.messages) : "…",
                  label: "Messages",
                  icon: "💞",
                },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="rounded-2xl border border-[#F0ECFA] bg-[#faf9ff] px-2 py-3 text-center sm:bg-white sm:p-6"
                >
                  <div className="mb-1 text-xl sm:mb-2 sm:text-4xl">
                    {stat.icon}
                  </div>

                  <div className="text-base font-black text-[#5B4B8A] sm:text-4xl">
                    {stat.value}
                  </div>

                  <div className="mt-0.5 text-[10px] text-[#666] sm:mt-2 sm:text-base">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ─────────────────────────────
            Témoignages compacts
        ───────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#F9F7FC] to-[#F0ECFF] px-4 py-5 sm:px-6 sm:py-12">
          <OrbitGlow className="left-[-8%] top-0 h-72 w-72 sm:h-96 sm:w-96" />

          <div className="relative z-10 mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 text-center sm:mb-10"
            >
              <h2 className="text-xl font-black text-[#1C1C1C] sm:text-4xl">
                Elles parlent de{" "}
                <span className="text-[#8E7AB5]">SferaLuna</span>
              </h2>

              <p className="mt-1 text-xs text-[#666] sm:text-base">
                Des vrais mots, de vraies femmes.
              </p>
            </motion.div>

            {testimonials.length > 0 && currentTestimonial ? (
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial._id}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -28 }}
                    transition={{ duration: 0.3 }}
                    className="relative overflow-hidden rounded-3xl border border-[#E8E0FF] bg-white p-4 shadow-lg sm:p-6 sm:shadow-xl"
                  >
                    <div className="absolute left-4 top-3 select-none text-5xl text-[#8E7AB5]/10 sm:left-6 sm:top-6 sm:text-6xl">
                      &quot;
                    </div>

                    <p className="relative z-10 mb-5 text-sm font-light leading-relaxed text-[#1C1C1C] sm:mb-8 sm:text-xl">
                      « {currentTestimonial.content} »
                    </p>

                    <div className="relative z-10 flex items-center gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-base font-bold text-white sm:h-12 sm:w-12 sm:text-lg">
                        {currentTestimonial.authorName[0].toUpperCase()}
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-[#1C1C1C] sm:text-base">
                          {currentTestimonial.authorName}
                          {currentTestimonial.age
                            ? `, ${currentTestimonial.age} ans`
                            : ""}
                        </div>

                        <div className="text-xs text-[#666] sm:text-sm">
                          Membre SferaLuna
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {testimonials.length > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-3 sm:mt-6 sm:gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setTestimonialIdx(
                          (index) =>
                            (index - 1 + testimonials.length) %
                            testimonials.length
                        )
                      }
                      className="rounded-full border border-[#E8E0FF] bg-white p-2 text-[#8E7AB5] transition-colors hover:border-[#8E7AB5]"
                      aria-label="Témoignage précédent"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex gap-1.5 sm:gap-2">
                      {testimonials.map((testimonial, index) => (
                        <button
                          key={testimonial._id}
                          type="button"
                          onClick={() => setTestimonialIdx(index)}
                          className={`h-2 rounded-full transition-all ${
                            index === testimonialIdx
                              ? "w-5 bg-[#8E7AB5] sm:w-6"
                              : "w-2 bg-[#D9B8FF]"
                          }`}
                          aria-label={`Voir le témoignage ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTestimonialIdx(
                          (index) => (index + 1) % testimonials.length
                        )
                      }
                      className="rounded-full border border-[#E8E0FF] bg-white p-2 text-[#8E7AB5] transition-colors hover:border-[#8E7AB5]"
                      aria-label="Témoignage suivant"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-dashed border-[#E8E0FF] bg-white px-4 py-6 text-center sm:px-6 sm:py-8"
              >
                <div className="mb-3 text-4xl sm:mb-4 sm:text-5xl">💜</div>

                <p className="mb-1 text-base font-semibold text-[#5B4B8A] sm:text-lg">
                  Les premiers témoignages arrivent bientôt
                </p>

                <p className="text-xs text-[#666] sm:text-sm">
                  Sois parmi les premières à partager ton expérience.
                </p>
              </motion.div>
            )}

            {/* Formulaire de soumission */}
            {sessionUser?.id && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-5 sm:mt-8"
              >
                {!showForm && formStatus !== "success" && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowForm(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#E8E0FF] bg-white px-5 py-2.5 text-sm font-medium text-[#5B4B8A] transition-all hover:border-[#8E7AB5] hover:shadow-md sm:px-6 sm:py-3"
                    >
                      <MessageSquarePlus size={16} />
                      Partager mon expérience
                    </button>
                  </div>
                )}

                {formStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700 sm:gap-3 sm:p-4"
                  >
                    <CheckCircle size={18} />
                    Merci ! Ton témoignage sera visible après validation. 💜
                  </motion.div>
                )}

                {showForm && formStatus !== "success" && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleTestimonialSubmit}
                    className="rounded-3xl border border-[#E8E0FF] bg-white p-4 shadow-lg sm:p-6"
                  >
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#5B4B8A] sm:mb-4 sm:text-base">
                      <MessageSquarePlus size={18} />
                      Partage ton expérience
                    </h3>

                    <textarea
                      value={formContent}
                      onChange={(event) => setFormContent(event.target.value)}
                      placeholder="Raconte-nous ton expérience… 20 à 500 caractères."
                      rows={3}
                      maxLength={500}
                      className="mb-1 w-full resize-none rounded-xl border border-[#E8E0FF] px-3 py-2.5 text-sm text-[#1C1C1C] placeholder-[#999] outline-none transition focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 sm:px-4 sm:py-3"
                    />

                    <p className="mb-3 text-right text-xs text-[#999] sm:mb-4">
                      {formContent.length}/500
                    </p>

                    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <input
                        type="number"
                        value={formAge}
                        onChange={(event) => setFormAge(event.target.value)}
                        placeholder="Âge optionnel"
                        min={18}
                        max={99}
                        className="w-full rounded-xl border border-[#E8E0FF] px-3 py-2 text-sm text-[#1C1C1C] placeholder-[#999] outline-none focus:border-[#8E7AB5] sm:w-44 sm:px-4"
                      />

                      <div className="flex items-center gap-1 text-xs text-[#999]">
                        <Clock size={12} />
                        Visible après validation
                      </div>
                    </div>

                    {formStatus === "error" && (
                      <p className="mb-3 text-sm text-red-500">{formError}</p>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <button
                        type="submit"
                        disabled={
                          formStatus === "loading" ||
                          formContent.trim().length < 20
                        }
                        className="rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 sm:px-6"
                      >
                        {formStatus === "loading" ? "Envoi…" : "Envoyer"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setFormError("");
                          setFormStatus("idle");
                        }}
                        className="rounded-full border border-[#E8E0FF] px-5 py-2.5 text-sm text-[#666] transition-all hover:border-[#8E7AB5] sm:px-6"
                      >
                        Annuler
                      </button>
                    </div>
                  </motion.form>
                )}
              </motion.div>
            )}

            {!sessionUser?.id && (
              <p className="mt-4 text-center text-xs text-[#999] sm:mt-6 sm:text-sm">
                <Link
                  href="/auth?mode=login"
                  className="text-[#8E7AB5] underline underline-offset-2 hover:text-[#5B4B8A]"
                >
                  Connecte-toi
                </Link>{" "}
                pour partager ton expérience.
              </p>
            )}
          </div>
        </section>

        {/* ─────────────────────────────
            CTA final compact
        ───────────────────────────── */}
        <section className="relative overflow-hidden px-4 py-7 sm:px-6 sm:py-14">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -left-1/2 -top-1/2 h-full w-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <OrbitGlow
            variant="light"
            className="left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 sm:h-[36rem] sm:w-[36rem]"
          />

          <div className="relative z-10 mx-auto max-w-4xl text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 sm:mb-8"
            >
              <h2 className="mb-2 text-2xl font-black leading-tight sm:mb-6 sm:text-5xl">
                Prête à rejoindre une communauté qui te{" "}
                <span className="text-white">ressemble</span> ?
              </h2>

              <p className="mx-auto max-w-2xl text-sm leading-relaxed opacity-90 sm:text-xl">
                Rejoins un espace authentique, bienveillant et pensé pour les
                femmes.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.12 }}
              className="flex flex-col justify-center gap-2.5 sm:flex-row sm:gap-4"
            >
              <Link href="/fonctionnalites" className="group w-full sm:w-auto">
                <button className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#8E7AB5] shadow-2xl transition-all duration-300 hover:scale-105 sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                  <span>Découvrir les fonctionnalités</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    🚀
                  </span>
                </button>
              </Link>

              <Link href="/auth?mode=register" className="w-full sm:w-auto">
                <button className="group flex w-full items-center justify-center gap-2 rounded-full border-2 border-white px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-white/10 sm:w-auto sm:px-8 sm:py-4 sm:text-lg">
                  Créer mon compte gratuit
                  <span className="transition-transform duration-500 group-hover:rotate-180">
                    ✨
                  </span>
                </button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.24 }}
              className="mt-3 text-xs text-white/80 sm:mt-8 sm:text-base"
            >
              <span className="font-semibold">Sans engagement</span> · 30 jours
              gratuits · Aucune carte requise
            </motion.p>
          </div>
        </section>
      </main>

      {/* Footer masqué sur mobile pour garder une page courte et app-like. */}
      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}