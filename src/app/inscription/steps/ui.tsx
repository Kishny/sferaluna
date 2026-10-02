// src/app/inscription/steps/ui.tsx

"use client";

/**
 * Briques visuelles communes aux étapes de création du profil :
 * titre bicolore, libellés, champs avec icône, tuiles à cocher.
 */

import type { ElementType, ReactNode } from "react";
import { Check } from "lucide-react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Champ de saisie (avec place pour l'icône à gauche). */
export const INPUT =
  "h-[52px] w-full rounded-xl border border-violet-200/25 bg-white/[0.07] pl-14 pr-4 text-[15px] text-white placeholder:text-white/45 outline-none transition focus:border-fuchsia-400/70 focus:bg-white/[0.1] focus:ring-4 focus:ring-fuchsia-500/15";

/** Tuile sélectionnable (radio, case, ville…). */
export const TILE = "rounded-xl border border-violet-200/25 bg-white/[0.06] transition hover:border-fuchsia-300/60 hover:bg-white/[0.1]";
export const TILE_ON = "rounded-xl border border-fuchsia-400/80 bg-fuchsia-500/20 shadow-[0_0_24px_-8px_rgba(217,70,239,0.8)] transition";

/** Titre d'étape : début en blanc, fin en dégradé violet → rose. */
export function StepTitle({ plain, accent, joined = false, children }: { plain: string; accent: string; joined?: boolean; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-[28px] font-bold leading-tight tracking-tight text-white sm:text-[32px]">
        {plain}
        {joined ? "" : " "}
        <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">{accent}</span>
      </h2>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/75">{children}</p>
    </div>
  );
}

export function Label({ htmlFor, required, children, as: Tag = "label" }: { htmlFor?: string; required?: boolean; children: ReactNode; as?: "label" | "p" | "h3" }) {
  return (
    <Tag {...(Tag === "label" ? { htmlFor } : {})} className="block text-[15px] font-semibold text-white">
      {children} {required && <span className="text-pink-400">*</span>}
    </Tag>
  );
}

export function Helper({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-[13px] text-white/60">{children}</p>;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-sm text-rose-300">
      {children}
    </p>
  );
}

/** Enveloppe d'un champ : libellé, icône à gauche, aide, erreur. */
export function IconField({
  id,
  label,
  required,
  icon: Icon,
  helper,
  error,
  children,
  right,
}: {
  id: string;
  label: string;
  required?: boolean;
  icon: ElementType;
  helper?: ReactNode;
  error?: string;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-5 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-white/60" />
        {children}
        {right}
      </div>
      {helper && <Helper>{helper}</Helper>}
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** Pastille ronde (choix unique). */
export function RadioDot({ on }: { on: boolean }) {
  return (
    <span className={cx("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", on ? "border-fuchsia-400" : "border-white/55")}>
      {on && <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-fuchsia-400 to-pink-500" />}
    </span>
  );
}

/** Case carrée (choix multiple). */
export function CheckBox({ on, tone = "pink" }: { on: boolean; tone?: "pink" | "green" }) {
  return (
    <span
      className={cx(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2",
        on ? (tone === "green" ? "border-emerald-400 bg-emerald-500" : "border-fuchsia-400 bg-fuchsia-500") : "border-white/55"
      )}
    >
      {on && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
    </span>
  );
}
