// src/components/site/pagekit.tsx

/**
 * Briques communes aux pages éditoriales du site public
 * (histoire, valeurs, équipe, témoignages, FAQ, communauté, cookies, guide,
 * accessibilité) :
 * en-tête illustré, titres de section, bandeau d'appel à l'action.
 *
 * Aucun hook ici : utilisable depuis une page serveur comme cliente.
 */

import type { ElementType, ReactNode } from "react";

import { Container } from "./sections";
import { ScriptNote, cn } from "./ui";

/** Carte standard des pages éditoriales. */
export const PANEL = "rounded-3xl border border-violet-300/[0.16] bg-[#1b0d38]/80 backdrop-blur-xl";

/** Carte interne, plus sombre. */
export const TILE = "rounded-2xl border border-violet-300/[0.14] bg-[#150a2c]/80";

// ─────────────────────────────────────────────
// Illustration : lune sur le lac
// ─────────────────────────────────────────────

/** Fondu des bords de l'illustration vers le ciel de la page. */
const FADE =
  "linear-gradient(to right, transparent 0%, #000 30%, #000 82%, transparent 100%), linear-gradient(to bottom, #000 0%, #000 62%, transparent 96%)";

/**
 * Grande lune rose au-dessus d'un lac bordé de montagnes.
 * Illustration vectorielle, fondue dans le ciel de la page.
 */
export function LakeScene({ className = "", id = "lk" }: { className?: string; id?: string }) {
  const lights = Array.from({ length: 46 }).map((_, i) => ({
    x: 20 + ((i * 97) % 760),
    y: 262 + ((i * 13) % 9),
    r: 0.9 + ((i * 7) % 3) * 0.45,
    warm: i % 3 !== 0,
  }));

  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="xMidYMax slice"
      className={className}
      style={{
        WebkitMaskImage: FADE,
        maskImage: FADE,
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
      }}
      aria-hidden
    >
      <defs>
        <radialGradient id={`${id}-moon`} cx="40%" cy="36%" r="70%">
          <stop offset="0%" stopColor="#ffe9fb" />
          <stop offset="45%" stopColor="#f3b4ec" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.6" />
          <stop offset="45%" stopColor="#c026d3" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b3fb8" />
          <stop offset="100%" stopColor="#3a1a78" />
        </linearGradient>
        <linearGradient id={`${id}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b1a78" />
          <stop offset="100%" stopColor="#1c0b40" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7e3bd0" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1a0a38" stopOpacity="0.95" />
        </linearGradient>
      </defs>

      <g>
        {/* Lune */}
        <circle cx="560" cy="150" r="230" fill={`url(#${id}-halo)`} />
        <circle cx="560" cy="150" r="104" fill={`url(#${id}-moon)`} />
        <g fill="#b25ad6" opacity="0.22">
          <circle cx="530" cy="112" r="17" />
          <circle cx="596" cy="140" r="23" />
          <circle cx="552" cy="186" r="12" />
          <circle cx="612" cy="92" r="9" />
          <circle cx="508" cy="168" r="10" />
        </g>

        {/* Montagnes */}
        <path d="M0 262 L70 214 L130 240 L210 178 L290 232 L360 200 L430 244 L520 206 L600 240 L680 190 L750 226 L800 208 L800 270 L0 270 Z" fill={`url(#${id}-far)`} opacity="0.85" />
        <path d="M0 270 L60 246 L140 262 L230 228 L310 258 L400 240 L470 262 L560 244 L650 262 L730 238 L800 256 L800 276 L0 276 Z" fill={`url(#${id}-near)`} />

        {/* Lac + reflet */}
        <rect x="0" y="270" width="800" height="130" fill={`url(#${id}-water)`} />
        <g fill="#f5b8f0">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={560 - (62 - i * 7)} y={280 + i * 14} width={(62 - i * 7) * 2} height={3.2} rx="1.6" opacity={0.6 - i * 0.07} />
          ))}
        </g>

        {/* Lumières de la rive */}
        {lights.map((l, i) => (
          <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={l.warm ? "#ffc98a" : "#f9a8d4"} opacity="0.9" />
        ))}

      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────
// Illustration peinte en fond d'en-tête
// ─────────────────────────────────────────────

/**
 * Illustration plein écran placée derrière l'en-tête (et sous la barre de
 * navigation), fondue vers le fond de page. À poser en premier enfant de
 * <PageBody>. Le voile sombre à gauche garde le titre lisible.
 */
export function PhotoBackdrop({ src, position = "center 38%" }: { src: string; position?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-48 -z-10 h-[640px] sm:h-[700px]" aria-hidden>
      <div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: position,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 58%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 58%, transparent 100%)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#12081f]/85 via-[#12081f]/30 to-transparent" />
      <div className="absolute inset-0 bg-[#12081f]/35 lg:hidden" />
    </div>
  );
}

// ─────────────────────────────────────────────
// En-tête de page
// ─────────────────────────────────────────────

export function PageHero({
  pill,
  pillIcon: PillIcon,
  title,
  text,
  note,
  id,
  scene = true,
  children,
}: {
  pill: string;
  pillIcon?: ElementType;
  title: ReactNode;
  text?: ReactNode;
  /** Note manuscrite affichée à droite sur grand écran. */
  note?: ReactNode;
  id?: string;
  /** false quand la page pose sa propre illustration (<PhotoBackdrop />). */
  scene?: boolean;
  children?: ReactNode;
}) {
  return (
    <header className="relative">
      {scene && (
        <LakeScene
          id={id}
          className="pointer-events-none absolute -top-20 right-0 -z-10 h-[320px] w-[150%] max-w-none opacity-50 sm:w-full sm:opacity-75 lg:right-[9%] lg:h-[400px] lg:w-[64%] lg:opacity-100"
        />
      )}
      <div className="relative max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-[#1b0d38]/70 px-4 py-1.5 text-sm text-white/90 backdrop-blur">
          {PillIcon && <PillIcon className="h-4 w-4 text-fuchsia-300" />} {pill}
        </span>
        <h1 className="mt-4 text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">{title}</h1>
        {text && <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">{text}</p>}
        {children}
      </div>
      {/* Sur une illustration peinte, la note se confondrait avec la lune : on ne l'affiche pas. */}
      {note && scene && <ScriptNote className="absolute -right-2 top-2 hidden rotate-[-8deg] text-right xl:block">{note}</ScriptNote>}
    </header>
  );
}

/** Mot du titre en dégradé rose. */
export function Pink({ children }: { children: ReactNode }) {
  return <span className="bg-gradient-to-r from-fuchsia-300 to-pink-400 bg-clip-text text-transparent">{children}</span>;
}

// ─────────────────────────────────────────────
// Titre de section
// ─────────────────────────────────────────────

export function SectionTitle({
  icon: Icon,
  title,
  subtitle,
  action,
  tone = "pink",
  className = "",
}: {
  icon?: ElementType;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  tone?: "pink" | "gold";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        {Icon && <Icon className={cn("mt-0.5 h-6 w-6 shrink-0", tone === "gold" ? "fill-amber-300 text-amber-300" : "text-fuchsia-300")} />}
        <div>
          <h2 className="text-xl font-bold text-white sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-white/65">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────────────────────────
// Bandeau d'appel à l'action
// ─────────────────────────────────────────────

/** Petite lune posée sur l'horizon, à gauche des bandeaux. */
function BandMoon() {
  return (
    <svg viewBox="0 0 220 110" className="pointer-events-none absolute bottom-0 left-0 hidden h-full w-auto opacity-90 md:block" aria-hidden>
      <defs>
        <radialGradient id="bm-moon" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffe9fb" />
          <stop offset="55%" stopColor="#f0a8ea" />
          <stop offset="100%" stopColor="#a855f7" />
        </radialGradient>
        <radialGradient id="bm-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="92" r="90" fill="url(#bm-halo)" />
      <circle cx="110" cy="92" r="46" fill="url(#bm-moon)" />
      <path d="M0 110 L0 92 Q50 74 104 90 T220 84 L220 110 Z" fill="#1c0b40" />
    </svg>
  );
}

export function CtaBand({
  title,
  text,
  children,
  moon = true,
  icon: Icon,
  className = "",
}: {
  title: ReactNode;
  text?: ReactNode;
  children?: ReactNode;
  moon?: boolean;
  icon?: ElementType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-fuchsia-300/35 bg-gradient-to-r from-[#3a1470]/85 via-[#2a1158]/85 to-[#3a1470]/85 p-5 backdrop-blur-xl md:flex-row md:items-center",
        moon && !Icon && "md:pl-60",
        className
      )}
    >
      {moon && !Icon && <BandMoon />}
      <div className="relative flex min-w-0 flex-1 items-center gap-4">
        {Icon && (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 shadow-lg">
            <Icon className="h-5 w-5 text-white" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
          {text && <p className="mt-0.5 text-sm text-white/70">{text}</p>}
        </div>
      </div>
      {children && <div className="relative flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>}
    </div>
  );
}

/** Boutons des bandeaux (liens). */
export const BAND_PRIMARY =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 font-semibold text-white shadow-lg transition hover:brightness-110";
export const BAND_GHOST =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-2xl border border-violet-200/30 px-6 font-medium text-white transition hover:border-fuchsia-300/60 hover:bg-fuchsia-500/10";

// ─────────────────────────────────────────────
// Chiffres réels (/api/stats)
// ─────────────────────────────────────────────

/** Tuile de statistique. `value` null = en cours de chargement ou inconnu. */
export function StatTile({ icon: Icon, label, hint, value }: { icon: ElementType; label: string; hint: string; value: string | null }) {
  return (
    <div className={cn(TILE, "flex items-center gap-4 p-4")}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 ring-1 ring-violet-300/25">
        <Icon className="h-6 w-6 text-fuchsia-200" />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none text-white">{value ?? "—"}</p>
        <p className="mt-1.5 text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-white/55">{hint}</p>
      </div>
    </div>
  );
}

/** Affiche un compteur réel ; « — » tant qu'il est nul ou inconnu. */
export function statValue(n: number | undefined | null) {
  if (!n) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k`;
  return n.toLocaleString("fr-FR");
}

/** Enveloppe de page : conteneur + espacement vertical commun. */
export function PageBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className="relative pb-16">
      <Container className={cn("space-y-4", className)}>{children}</Container>
    </section>
  );
}
