// src/components/dashboard/shared.tsx

"use client";

import type { ReactNode } from "react";
import type { DashboardPlan } from "./types";

// ─────────────────────────────────────────────
// Libellés
// ─────────────────────────────────────────────

export const PLAN_LABELS: Record<DashboardPlan, string> = {
  free: "Gratuit",
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

export const SUBSCRIPTION_LABELS: Record<string, string> = {
  inactive: "Inactif",
  active: "Actif",
  trialing: "Essai gratuit",
  past_due: "Paiement en retard",
  canceled: "Annulé",
};

export const VISIBILITY_LABELS: Record<string, string> = {
  public: "Profil public",
  matches: "Mes matchs uniquement",
  premium: "Membres premium",
  invisible: "Mode fantôme",
};

export const INTENTION_LABELS: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion enrichissante",
};

// ─────────────────────────────────────────────
// Styles communs
// ─────────────────────────────────────────────

/** Carte "verre fumé" violette du dashboard. */
export const CARD =
  "rounded-2xl border border-violet-300/[0.12] bg-[#1d0f3d]/70 shadow-[0_8px_32px_-12px_rgba(10,0,30,0.6)] backdrop-blur-xl";

/** Carte interne, un cran plus sombre. */
export const INNER_CARD =
  "rounded-xl border border-violet-300/[0.10] bg-[#160a31]/70";

export function isPremiumActive(user: {
  isPremium: boolean;
  subscriptionStatus: string;
}) {
  return (
    user.isPremium === true &&
    (user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing")
  );
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─────────────────────────────────────────────
// Avatar
// ─────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-fuchsia-500 to-purple-600",
  "from-violet-500 to-indigo-600",
  "from-pink-500 to-rose-600",
  "from-purple-500 to-pink-500",
  "from-indigo-500 to-fuchsia-500",
];

export function Avatar({
  src,
  name,
  size = 44,
  className = "",
  children,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  children?: ReactNode;
}) {
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  const gradient =
    AVATAR_GRADIENTS[(name || "").length % AVATAR_GRADIENTS.length];

  return (
    <span
      className={cn("relative inline-flex shrink-0 rounded-full", className)}
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name || ""}
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
            gradient
          )}
          style={{ fontSize: Math.max(11, size * 0.38) }}
        >
          {initial}
        </span>
      )}
      {children}
    </span>
  );
}

/** Pastille compteur rose. */
export function CountBadge({ value, className = "" }: { value: number; className?: string }) {
  if (!value) return null;

  return (
    <span
      className={cn(
        "inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 px-1.5 text-[11px] font-bold text-white shadow-md shadow-pink-500/40",
        className
      )}
    >
      {value > 99 ? "99+" : value}
    </span>
  );
}
