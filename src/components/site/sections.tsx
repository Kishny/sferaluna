// src/components/site/sections.tsx

"use client";

/**
 * Sections réutilisées par les pages publiques (accueil, fonctionnalités,
 * sécurité, tarifs) : grille "Que souhaitez-vous découvrir ?", étapes,
 * bandeau de confiance, CTA final, coquille de page.
 */

import BackButton from "@/components/BackButton";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Compass,
  Heart,
  Lock,
  MessageSquareText,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

import { CityGlow, NightBackdrop, SceneArt, type SceneVariant } from "./art";
import {
  ArrowCircle,
  AvatarStack,
  FEATURED_RING,
  GLASS,
  IconBadge,
  PrimaryButton,
  cn,
} from "./ui";

// ─────────────────────────────────────────────
// Coquille de page
// ─────────────────────────────────────────────

export function SiteShell({
  children,
  moon = true,
  back = false,
}: {
  children: ReactNode;
  moon?: boolean;
  /** Affiche un bouton Retour sous l'en-tête (la 1re section perd alors sa marge haute). */
  back?: boolean;
}) {
  return (
    <>
      <Header />
      <main className="relative isolate overflow-hidden bg-[#12081f] text-white">
        <NightBackdrop moon={moon} />
        {back ? (
          <>
            <Container className="relative z-20 pt-24 sm:pt-28">
              <BackButton fallbackHref="/" fallbackLabel="Retour à l’accueil" />
            </Container>
            <div className="[&>section:first-child]:!pt-8 lg:[&>section:first-child]:!pt-12">{children}</div>
          </>
        ) : (
          children
        )}
      </main>
      <Footer />
    </>
  );
}

/** Conteneur horizontal commun. */
export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: "easeOut" as const },
};

// ─────────────────────────────────────────────
// Session : liens "app" ou "présentation"
// ─────────────────────────────────────────────

/** true si connectée — les cartes pointent alors directement vers l'app. */
export function useIsLoggedIn() {
  const { status } = useSession();
  return status === "authenticated";
}

// ─────────────────────────────────────────────
// Que souhaitez-vous découvrir ?
// ─────────────────────────────────────────────

type DiscoverItem = {
  key: string;
  title: string;
  text: string;
  appHref: string;
  infoHref: string;
  scene?: SceneVariant;
  visual: "search" | "circle" | "messages" | "calendar" | "compass";
};

export const DISCOVER_ITEMS: DiscoverItem[] = [
  {
    key: "explorer",
    title: "Explorer librement",
    text: "Découvrez des profils inspirants près de chez vous et ailleurs.",
    appHref: "/explorer",
    infoHref: "/fonctionnalites#explorer",
    scene: "night",
    visual: "search",
  },
  {
    key: "circle",
    title: "Circle of Six",
    text: "Des profils sélectionnés selon vos affinités pour des rencontres plus justes.",
    appHref: "/circle",
    infoHref: "/fonctionnalites#circle",
    visual: "circle",
  },
  {
    key: "messages",
    title: "Messages",
    text: "Des conversations sincères et de nouvelles rencontres.",
    appHref: "/matches",
    infoHref: "/fonctionnalites#messages",
    visual: "messages",
  },
  {
    key: "lunagather",
    title: "LunaGather",
    text: "Participez à des sorties, ateliers et événements près de chez vous.",
    appHref: "/evenements",
    infoHref: "/fonctionnalites#lunagather",
    scene: "rooftop",
    visual: "calendar",
  },
  {
    key: "vibeplanner",
    title: "VibePlanner",
    text: "Trouvez des lieux, des idées et des sorties qui vous ressemblent.",
    appHref: "/vibeplanner",
    infoHref: "/fonctionnalites#vibeplanner",
    scene: "dusk",
    visual: "compass",
  },
];

function DiscoverVisual({ item }: { item: DiscoverItem }) {
  if (item.visual === "circle") {
    return (
      <div className="flex items-center pt-2">
        <AvatarStack count={3} size={52} offset={1} extra="+3" />
      </div>
    );
  }

  if (item.visual === "messages") {
    return (
      <div className="relative flex items-start gap-3 pt-2">
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/25 ring-1 ring-violet-300/30">
          <MessageSquareText className="h-6 w-6 text-violet-100" />
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[10px] font-bold">3</span>
        </span>
        <div className="flex flex-col gap-2 pt-1">
          <span className="h-5 w-20 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500/90" />
          <span className="ml-5 h-5 w-24 rounded-lg bg-violet-500/60" />
        </div>
      </div>
    );
  }

  const Icon = item.visual === "search" ? Search : item.visual === "calendar" ? CalendarDays : Compass;

  return (
    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-fuchsia-200/40 backdrop-blur-md">
      <Icon className={cn("h-7 w-7", item.visual === "compass" ? "text-amber-200" : item.visual === "calendar" ? "text-amber-200" : "text-white")} />
    </span>
  );
}

export function DiscoverGrid() {
  const loggedIn = useIsLoggedIn();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
      {DISCOVER_ITEMS.map((item, i) => {
        const featured = i === 0;
        const withScene = Boolean(item.scene);

        return (
          <motion.div key={item.key} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }} className={cn(featured && "sm:col-span-2 lg:col-span-1")}>
            <Link
              href={loggedIn ? item.appHref : item.infoHref}
              className={cn(
                "group relative flex h-full min-h-[230px] flex-col justify-between overflow-hidden rounded-3xl p-5 transition duration-300 hover:-translate-y-1",
                withScene ? "border border-violet-300/20" : GLASS,
                featured && FEATURED_RING
              )}
            >
              {withScene && (
                <>
                  <SceneArt variant={item.scene} seed={i + 2} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#150629] via-[#150629]/55 to-transparent" />
                </>
              )}

              <div className="relative">
                <DiscoverVisual item={item} />
              </div>

              <div className="relative mt-6 flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className={cn("font-semibold text-white", featured ? "text-2xl" : "text-xl")}>{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-snug text-white/75">{item.text}</p>
                </div>
                <ArrowCircle />
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// Étapes numérotées
// ─────────────────────────────────────────────

export type Step = { icon: ElementType; title: string; text: string };

export function StepsRow({ steps }: { steps: Step[] }) {
  return (
    <div className={cn("grid gap-3", steps.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {steps.map((step, i) => (
        <motion.div
          key={step.title}
          {...reveal}
          transition={{ ...reveal.transition, delay: i * 0.08 }}
          className="relative flex items-center gap-4 rounded-2xl border border-violet-300/[0.12] bg-[#170b30]/70 p-4 backdrop-blur"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-bold shadow-[0_0_18px_-2px_rgba(217,70,239,0.7)]">
            {i + 1}
          </span>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-300/25 bg-violet-500/10">
            <step.icon className="h-6 w-6 text-violet-100" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-white">{step.title}</p>
            <p className="mt-0.5 text-sm leading-snug text-white/65">{step.text}</p>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-fuchsia-300 lg:block" />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Bandeau de confiance
// ─────────────────────────────────────────────

const TRUST = [
  { icon: Check, tone: "green" as const, title: "Profils vérifiés", text: "Identité confirmée par pièce d’identité et selfie" },
  { icon: Lock, tone: "violet" as const, title: "Confidentialité", text: "Vous choisissez qui voit votre profil" },
  { icon: Users, tone: "violet" as const, title: "Modération active", text: "Messages filtrés, signalements traités" },
  { icon: Heart, tone: "pink" as const, title: "Communauté inclusive", text: "Toutes les femmes sont les bienvenues" },
];

export function TrustBar({ href = "/securite" }: { href?: string }) {
  return (
    <motion.div {...reveal}>
      <Link
        href={href}
        className={cn(GLASS, "group flex flex-col gap-5 rounded-3xl p-5 transition hover:border-violet-300/30 lg:flex-row lg:items-center lg:gap-6 lg:p-6")}
      >
        <div className="flex items-center gap-3 lg:w-56 lg:shrink-0 lg:border-r lg:border-violet-300/15 lg:pr-6">
          <ShieldCheck className="h-9 w-9 shrink-0 text-amber-200" />
          <p className="text-lg font-semibold leading-tight text-white">
            Un espace sûr
            <br className="hidden lg:block" /> pour être vous-même.
          </p>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.title} className="flex items-center gap-3">
              <IconBadge icon={item.icon} tone={item.tone} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs leading-snug text-white/60">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Statistiques réelles (/api/stats)
// ─────────────────────────────────────────────

export interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

export function useSiteStats() {
  const [stats, setStats] = useState<SiteStats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => data?.success && setStats(data.stats))
      .catch(() => {});
  }, []);

  return stats;
}

export function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k`;
  return n.toLocaleString("fr-FR");
}

// ─────────────────────────────────────────────
// CTA final
// ─────────────────────────────────────────────

export function FinalCta({
  title,
  text,
  cta = "Créer mon profil",
  href,
  aside,
}: {
  title: ReactNode;
  text: ReactNode;
  cta?: string;
  href?: string;
  aside?: ReactNode;
}) {
  const loggedIn = useIsLoggedIn();
  const stats = useSiteStats();
  const target = href ?? (loggedIn ? "/explorer" : "/auth?mode=register");
  const label = loggedIn && !href ? "Explorer librement" : cta;

  return (
    <section className="relative isolate overflow-hidden pb-20 pt-10 sm:pb-28">
      <CityGlow />
      <Container>
        <motion.div {...reveal} className="relative flex flex-col items-center text-center">
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
            <span className="text-amber-200">✦</span>
            {title}
            <span className="text-amber-200">✦</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">{text}</p>
          <PrimaryButton href={target} className="mt-6" size="lg">
            {label}
          </PrimaryButton>

          {aside ??
            (stats && stats.membres >= 50 ? (
              <div className="mt-8 flex items-center gap-3 text-left">
                <AvatarStack count={4} size={38} />
                <p className="text-xs leading-snug text-white/70">
                  Déjà {formatCount(stats.membres)} membres
                  <br />
                  nous font confiance <span className="text-amber-200">✦</span>
                </p>
              </div>
            ) : null)}
        </motion.div>
      </Container>
    </section>
  );
}

