// src/components/account/kit.tsx

"use client";

/**
 * Briques communes aux pages de Mon compte (Mon profil, Préférences,
 * Premium, Sécurité) : en-tête avec fil d'Ariane, cartes, boutons,
 * interrupteur et barre d'enregistrement collante.
 */

import { useEffect, type ReactNode } from "react";
import { AlertCircle, Check, ChevronRight, Home, Info, Loader2, Pencil, type LucideIcon } from "lucide-react";

import { cn } from "@/components/site/ui";

export const CARD =
  "rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/75 p-4 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] backdrop-blur-xl sm:p-5";

export const BTN_GRADIENT =
  "inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(236,72,153,0.9)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_OUTLINE =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200/30 bg-[#140828]/60 font-medium text-white transition hover:border-fuchsia-300/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50";

export const BTN_DANGER =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 font-medium text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50";

/** Titre de page + fil d'Ariane (retour au tableau de bord). */
export function AccountHeader({
  icon: Icon,
  title,
  subtitle,
  onHome,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onHome: () => void;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className="mt-1 h-7 w-7 shrink-0 text-amber-200" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-white/60 sm:text-base">{subtitle}</p>
        </div>
      </div>
      <nav aria-label="Fil d’Ariane" className="hidden items-center gap-2 pt-2 text-sm text-white/60 sm:flex">
        <button type="button" onClick={onHome} className="rounded-md p-1 hover:bg-white/10 hover:text-white" aria-label="Tableau de bord">
          <Home className="h-4 w-4" />
        </button>
        <ChevronRight className="h-3.5 w-3.5 text-white/35" />
        <span className="text-white/80">{title}</span>
      </nav>
    </div>
  );
}

export function CardHead({
  icon: Icon,
  title,
  aside,
  iconClass = "text-violet-300",
  subtitle,
}: {
  icon: LucideIcon;
  title: string;
  aside?: ReactNode;
  iconClass?: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="flex items-center gap-2.5 font-semibold text-white">
          <Icon className={cn("h-5 w-5 shrink-0", iconClass)} />
          {title}
        </h3>
        {subtitle && <p className="mt-1 text-xs text-white/55">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

/** Interrupteur on / off. */
export function Toggle({
  checked,
  onChange,
  disabled,
  loading,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  loading?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled || loading}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        checked ? "bg-gradient-to-r from-fuchsia-500 to-pink-500" : "bg-white/15"
      )}
    >
      <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all", checked ? "left-[22px]" : "left-0.5")} />
      {loading && <Loader2 className="absolute inset-0 m-auto h-3.5 w-3.5 animate-spin text-fuchsia-600" />}
    </button>
  );
}

/** Avertit avant de quitter la page quand des modifications ne sont pas enregistrées. */
export function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

/** Barre collante en bas de page : état des modifications + bouton Enregistrer. */
export function SaveBar({
  dirty,
  saving,
  error,
  idleText,
  onSave,
  onCancel,
  extra,
}: {
  dirty: boolean;
  saving: boolean;
  error?: string;
  idleText: string;
  onSave: () => void;
  onCancel: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className="sticky bottom-3 z-30">
      <div className="flex flex-col gap-3 rounded-2xl border border-violet-300/20 bg-[#1a0b38]/90 p-3 shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-4 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1 text-sm">
          {error ? (
            <p className="flex items-center gap-2 text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </p>
          ) : dirty ? (
            <p className="flex items-center gap-2 text-amber-200">
              <Pencil className="h-4 w-4 shrink-0" /> Modifications non enregistrées.
              <button type="button" onClick={onCancel} disabled={saving} className="font-semibold text-white/70 underline-offset-2 hover:text-white hover:underline">
                Annuler
              </button>
            </p>
          ) : (
            <p className="hidden items-center gap-2 text-white/60 sm:flex">
              <Info className="h-4 w-4 shrink-0" />
              {idleText}
            </p>
          )}
        </div>
        <div className="flex gap-2 sm:gap-3">
          {extra}
          <button type="button" onClick={onSave} disabled={!dirty || saving} className={cn(BTN_GRADIENT, "h-11 flex-1 px-5 text-sm lg:flex-none")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Enregistrement…" : "Enregistrer les modifications"}
          </button>
        </div>
      </div>
    </div>
  );
}
