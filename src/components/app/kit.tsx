// src/components/app/kit.tsx

"use client";

/**
 * Kit d'interface des pages connectées SferaLuna
 * (Mes matches, Circle of Six, Événements Luna, VibePlanner, VibeMentor,
 * VibeSphere). Même langage visuel que le parcours Explorer :
 * nuit violette, rose/lilas lumineux, verre dépoli, cartes arrondies.
 */

import type { ReactNode } from "react";
import {
  AlertCircle,
  BookOpen,
  Camera,
  ChefHat,
  ChevronDown,
  Clapperboard,
  Cpu,
  Dumbbell,
  Gamepad2,
  Leaf,
  Loader2,
  Music,
  Palette,
  Plane,
  Search,
  Shirt,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { interestLabel } from "@/lib/compatibility";

import { cn } from "@/components/site/ui";
import { PANEL, ProfilePhoto } from "@/components/explorer/shared";

export { PANEL };

/** Panneau mis en avant (carte « à la une »). */
export const PANEL_FEATURED =
  "rounded-3xl border border-fuchsia-300/45 bg-[#1f0d40]/80 shadow-[0_0_0_1px_rgba(232,121,249,0.18),0_30px_80px_-30px_rgba(192,38,211,0.7)] backdrop-blur-xl";

// ─────────────────────────────────────────────
// En-tête de page
// ─────────────────────────────────────────────

export function Eyebrow({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-[#1b0d38]/70 px-4 py-1.5 text-sm font-medium text-violet-50 backdrop-blur">
      <Icon className="h-4 w-4 text-fuchsia-300" /> {children}
    </span>
  );
}

export function GradientText({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">{children}</span>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  children?: ReactNode;
}) {
  return (
    <div className={cn("pt-4", align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl")}>
      {eyebrow && <div className="mb-4">{eyebrow}</div>}
      <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-white sm:text-5xl">{title}</h1>
      {subtitle && <p className="mt-3 text-base leading-relaxed text-white/75 sm:text-lg">{subtitle}</p>}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Chiffres
// ─────────────────────────────────────────────

export function StatTile({
  icon: Icon,
  value,
  label,
  tone = "text-pink-300",
}: {
  icon: LucideIcon;
  value: ReactNode;
  label: string;
  tone?: string;
}) {
  return (
    <div className={cn(PANEL, "flex flex-col items-start gap-2 rounded-2xl px-3.5 py-3 sm:flex-row sm:items-center sm:gap-3.5 sm:px-5 sm:py-3.5")}>
      <Icon className={cn("h-6 w-6 shrink-0 sm:h-7 sm:w-7", tone)} />
      <div className="min-w-0">
        <p className="text-xl font-bold leading-none text-white sm:text-2xl">{value}</p>
        <p className="mt-1 text-[11px] leading-tight text-white/65 sm:text-sm">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Filtres, recherche
// ─────────────────────────────────────────────

export function FilterPill({
  active,
  onClick,
  children,
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={!!active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition",
        active
          ? "border-fuchsia-300/70 bg-gradient-to-r from-fuchsia-500/90 to-pink-500/90 text-white shadow-[0_8px_24px_-10px_rgba(236,72,153,0.9)]"
          : "border-violet-300/25 bg-[#1b0d38]/70 text-white/85 backdrop-blur hover:border-fuchsia-300/50"
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Rangée de filtres défilante horizontalement sur mobile. */
export function PillRow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0", className)}>
      {children}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <label className={cn("relative block", className)}>
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/55" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-2xl border border-violet-300/25 bg-[#1b0d38]/70 pl-12 pr-10 text-sm text-white placeholder-white/45 backdrop-blur transition focus:border-fuchsia-300/60 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Effacer la recherche"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </label>
  );
}

export function SelectPill<T extends string>({
  value,
  onChange,
  options,
  icon: Icon,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  icon: LucideIcon;
  label: string;
}) {
  return (
    <label className="relative inline-flex h-12 shrink-0 items-center rounded-2xl border border-violet-300/25 bg-[#1b0d38]/70 pl-11 pr-3 text-sm text-white backdrop-blur focus-within:border-fuchsia-300/60">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-4 h-4 w-4 text-white/70" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-full cursor-pointer appearance-none border-0 bg-transparent bg-none py-0 pl-0 pr-7 text-sm font-medium text-white shadow-none outline-none focus:outline-none focus:ring-0 [&>option]:bg-[#1b0d38]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute right-3 h-4 w-4 text-white/60" />
    </label>
  );
}

// ─────────────────────────────────────────────
// Centres d'intérêt
// ─────────────────────────────────────────────

export const INTEREST_ICONS: Record<string, LucideIcon> = {
  voyage: Plane,
  cuisine: ChefHat,
  musique: Music,
  sport: Dumbbell,
  cinema: Clapperboard,
  lecture: BookOpen,
  art: Palette,
  technologie: Cpu,
  nature: Leaf,
  mode: Shirt,
  gaming: Gamepad2,
  photographie: Camera,
};

export function InterestChip({ value, highlight = false, small = false }: { value: string; highlight?: boolean; small?: boolean }) {
  const Icon = INTEREST_ICONS[value] ?? Sparkles;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        small ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
        highlight ? "border-emerald-300/40 bg-emerald-500/10 text-emerald-50" : "border-violet-300/25 bg-violet-500/10 text-violet-50"
      )}
    >
      <Icon className={cn(small ? "h-3.5 w-3.5" : "h-4 w-4", highlight ? "text-emerald-300" : "text-fuchsia-300")} />
      {interestLabel(value)}
    </span>
  );
}

// ─────────────────────────────────────────────
// Avatars
// ─────────────────────────────────────────────

export function Avatar({
  src,
  name,
  size = 44,
  online,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  online?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      <span className="block h-full w-full overflow-hidden rounded-full ring-2 ring-violet-300/30 [&_span]:!text-base">
        <ProfilePhoto src={src} name={name} className="h-full w-full" />
      </span>
      {online && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#1b0d38] bg-emerald-400" aria-label="Active récemment" />
      )}
    </span>
  );
}

export function AvatarPile({
  people,
  extra = 0,
  size = 36,
}: {
  people: { _id: string; pseudonyme: string; image?: string }[];
  extra?: number;
  size?: number;
}) {
  if (!people.length && extra <= 0) return null;
  return (
    <div className="flex items-center">
      {people.map((p, i) => (
        <span key={p._id} className={cn("rounded-full ring-2 ring-[#1b0d38]", i > 0 && "-ml-2.5")}>
          <Avatar src={p.image} name={p.pseudonyme} size={size} />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="-ml-2.5 flex items-center justify-center rounded-full bg-[#2a1553] text-xs font-semibold text-white ring-2 ring-[#1b0d38]"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

export function ActiveBadge({ active }: { active?: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
    </span>
  );
}

// ─────────────────────────────────────────────
// États
// ─────────────────────────────────────────────

export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-white/60">
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorBanner({ message, onClose, onRetry }: { message: string; onClose?: () => void; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-lg px-2 py-1 font-semibold underline-offset-2 hover:underline">
          Réessayer
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-lg p-1 hover:bg-white/10">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn(PANEL, "mx-auto flex max-w-lg flex-col items-center px-6 py-12 text-center")}>
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-fuchsia-500/15">
        <Icon className="h-8 w-8 text-fuchsia-200" />
      </span>
      <p className="mt-4 text-lg font-semibold text-white">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-white/65">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// Boutons
// ─────────────────────────────────────────────

export const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(236,72,153,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60";
export const BTN_GHOST =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-300/30 bg-[#1b0d38]/70 px-5 font-medium text-white transition hover:border-fuchsia-300/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60";

// ─────────────────────────────────────────────
// Dates
// ─────────────────────────────────────────────

export function timeAgo(date?: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  return `le ${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
}

export function longDate(date?: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
