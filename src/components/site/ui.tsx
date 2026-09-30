// src/components/site/ui.tsx

/**
 * Briques visuelles du site public SferaLuna.
 *
 * Même langage que l'espace connecté (/mon-compte) :
 * nuit violette, cartes "verre fumé", rose lumineux réservé aux actions
 * importantes, or pour le premium.
 */

import Link from "next/link";
import type { ElementType, ReactNode } from "react";
import { ArrowRight, Moon, Sparkles } from "lucide-react";

import { scriptFont } from "./fonts";

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────
// Surfaces
// ─────────────────────────────────────────────

/** Carte verre fumé standard. */
export const GLASS =
  "rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/70 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] backdrop-blur-xl";

/** Carte interne, plus sombre. */
export const GLASS_INNER =
  "rounded-2xl border border-violet-300/[0.10] bg-[#140829]/80";

/** Contour lumineux rose des éléments "vedette". */
export const FEATURED_RING =
  "ring-2 ring-fuchsia-400/70 shadow-[0_0_0_1px_rgba(232,121,249,0.35),0_20px_60px_-15px_rgba(192,38,211,0.65)]";

// ─────────────────────────────────────────────
// Boutons
// ─────────────────────────────────────────────

type ButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
  icon?: ElementType | null;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: "h-10 px-4 text-sm gap-2 whitespace-nowrap",
  md: "h-12 px-6 text-[15px] gap-2.5 whitespace-nowrap",
  lg: "h-14 px-7 text-base gap-3 whitespace-nowrap",
};

/** Action principale : dégradé rose → violet lumineux. */
export function PrimaryButton({
  href,
  children,
  className = "",
  icon: Icon = Moon,
  size = "md",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 font-semibold text-white shadow-[0_10px_35px_-8px_rgba(217,70,239,0.75)] ring-1 ring-fuchsia-300/40 transition hover:brightness-110 hover:shadow-[0_14px_40px_-6px_rgba(217,70,239,0.9)]",
        SIZES[size],
        className
      )}
    >
      {Icon && <Icon className="h-[1.15em] w-[1.15em] shrink-0" />}
      <span>{children}</span>
      <ArrowRight className="h-[1em] w-[1em] shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Action secondaire : contour violet discret. */
export function GhostButton({
  href,
  children,
  className = "",
  icon: Icon = null,
  size = "md",
}: ButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center justify-center rounded-full border border-violet-300/30 bg-white/[0.04] font-medium text-white/90 backdrop-blur transition hover:border-fuchsia-300/60 hover:bg-fuchsia-500/10 hover:text-white",
        SIZES[size],
        className
      )}
    >
      {Icon && (
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-white/5">
          <Icon className="h-3.5 w-3.5" />
        </span>
      )}
      <span>{children}</span>
    </Link>
  );
}

/** Petit bouton rond "→" en bas des cartes. */
export function ArrowCircle({ className = "" }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-200/40 bg-white/[0.04] text-white transition group-hover:border-fuchsia-300/70 group-hover:bg-fuchsia-500/20",
        className
      )}
    >
      <ArrowRight className="h-4 w-4" />
    </span>
  );
}

// ─────────────────────────────────────────────
// Typographie
// ─────────────────────────────────────────────

/** Mot mis en valeur dans un titre : dégradé lilas → rose. */
export function Glow({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

/** Note manuscrite rose (signature de marque). */
export function ScriptNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        scriptFont.className,
        "text-[26px] leading-[1.05] text-pink-200/95 drop-shadow-[0_0_12px_rgba(244,114,182,0.45)]",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Titre de section avec pictogramme étoile ou lune. */
export function SectionHeading({
  title,
  subtitle,
  icon = "star",
  className = "",
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: "star" | "moon" | "none";
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex items-start gap-4">
        {icon === "star" && (
          <Sparkles className="mt-1 h-8 w-8 shrink-0 fill-amber-200 text-amber-200 drop-shadow-[0_0_14px_rgba(253,230,138,0.7)] sm:h-10 sm:w-10" />
        )}
        {icon === "moon" && (
          <Moon className="mt-1 h-8 w-8 shrink-0 fill-amber-100 text-amber-100 drop-shadow-[0_0_14px_rgba(253,230,138,0.6)] sm:h-9 sm:w-9" />
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-white/70 sm:text-base">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────
// Avatars illustrés (aucune photo de personne réelle)
// ─────────────────────────────────────────────

const AVATAR_TONES = [
  ["#f0abfc", "#a21caf"],
  ["#c4b5fd", "#6d28d9"],
  ["#fbcfe8", "#be185d"],
  ["#fde68a", "#b45309"],
  ["#a5b4fc", "#4338ca"],
  ["#f9a8d4", "#7e22ce"],
];

/**
 * Silhouette stylisée (tête + épaules) sur fond dégradé.
 * Sert d'illustration dans les maquettes produit du site.
 */
export function IllustratedAvatar({
  seed = 0,
  size = 44,
  className = "",
  ring = true,
}: {
  seed?: number;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  const [light, dark] = AVATAR_TONES[seed % AVATAR_TONES.length];
  const id = `av-${seed}-${size}`;
  const hairStyles = [
    "M14 22c0-9 6-14 14-14s14 5 14 14c0 5-2 9-2 13-2-6-3-9-12-10-9 1-10 4-12 10 0-4-2-8-2-13z",
    "M13 26c0-11 6-17 15-17s15 6 15 17c0 8-1 14-3 20h-4c1-6 1-11 0-15-2-4-5-6-8-6s-6 2-8 6c-1 4-1 9 0 15h-4c-2-6-3-12-3-20z",
    "M15 20c1-8 7-12 13-12 7 0 13 4 13 12-3-3-7-5-13-5s-10 2-13 5z",
  ];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 overflow-hidden rounded-full",
        ring && "ring-2 ring-[#1b0d38]",
        className
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 56 56" width={size} height={size}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={light} />
            <stop offset="100%" stopColor={dark} />
          </linearGradient>
        </defs>
        <rect width="56" height="56" fill={`url(#${id})`} />
        <circle cx="28" cy="24" r="9" fill="#2a1240" opacity="0.55" />
        <path d="M10 56c2-11 9-17 18-17s16 6 18 17z" fill="#2a1240" opacity="0.55" />
        <path d={hairStyles[seed % hairStyles.length]} fill="#1a0826" opacity="0.6" />
      </svg>
    </span>
  );
}

export function AvatarStack({
  count = 4,
  size = 40,
  offset = 0,
  extra,
}: {
  count?: number;
  size?: number;
  offset?: number;
  extra?: string;
}) {
  return (
    <div className="flex items-center">
      <div className="flex -space-x-3">
        {Array.from({ length: count }).map((_, i) => (
          <IllustratedAvatar key={i} seed={i + offset} size={size} />
        ))}
      </div>
      {extra && (
        <span
          className="-ml-2 flex items-center justify-center rounded-full border border-violet-300/40 bg-[#1b0d38] text-xs font-semibold text-white/85"
          style={{ width: size, height: size }}
        >
          {extra}
        </span>
      )}
    </div>
  );
}

/** Pastille d'icône ronde (utilisée dans les listes de confiance). */
export function IconBadge({
  icon: Icon,
  tone = "violet",
  size = "md",
}: {
  icon: ElementType;
  tone?: "violet" | "pink" | "gold" | "green";
  size?: "sm" | "md" | "lg";
}) {
  const tones = {
    violet: "bg-violet-500/20 text-violet-200 ring-violet-300/25",
    pink: "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-300/30",
    gold: "bg-amber-400/15 text-amber-200 ring-amber-300/30",
    green: "bg-emerald-500/20 text-emerald-300 ring-emerald-300/30",
  };
  const sizes = { sm: "h-9 w-9 [&>svg]:h-4 [&>svg]:w-4", md: "h-11 w-11 [&>svg]:h-5 [&>svg]:w-5", lg: "h-14 w-14 [&>svg]:h-6 [&>svg]:w-6" };

  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full ring-1", tones[tone], sizes[size])}>
      <Icon />
    </span>
  );
}
