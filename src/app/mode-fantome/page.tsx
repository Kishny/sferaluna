// src/app/mode-fantome/page.tsx

"use client";

/**
 * /mode-fantome — présentation et activation du Mode Fantôme.
 *
 * Ce que fait réellement le Mode Fantôme (visibilite = "invisible") :
 * - le profil disparaît des découvertes, d'Explorer, de la recherche et de
 *   Affinités de la semaine ;
 * - les visites de profil ne sont pas enregistrées (aucune trace, aucune
 *   notification chez la personne visitée) ;
 * - les conversations en cours continuent.
 * Réservé aux offres Premium et Elite (feature "ghostMode").
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  EyeOff,
  Ghost,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  ToggleRight,
  User,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import MoonScene from "@/components/dashboard/MoonScene";
import { ExplorerShell } from "@/components/explorer/shared";
import { cn } from "@/components/site/ui";
import { usePremium } from "@/hooks/usePremium";

const CARD = "rounded-3xl border border-violet-300/[0.16] bg-[#1b0d38]/75 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] backdrop-blur-xl";

function GhostArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 240" className={className} aria-hidden>
      <defs>
        <radialGradient id="mf-body" cx="45%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#f5e8ff" />
          <stop offset="45%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#6d28d9" />
        </radialGradient>
        <radialGradient id="mf-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="130" cy="120" r="115" fill="url(#mf-glow)" />
      <ellipse cx="130" cy="125" rx="118" ry="44" fill="none" stroke="#e9d5ff" strokeOpacity="0.35" strokeWidth="1.5" transform="rotate(-14 130 125)" />
      <circle cx="22" cy="140" r="4" fill="#e9d5ff" opacity="0.8" />
      <circle cx="238" cy="96" r="3" fill="#e9d5ff" opacity="0.7" />
      <path
        d="M130 32c-40 0-66 30-66 72v86c0 7 8 10 13 5l12-12 13 13c4 4 10 4 14 0l14-14 14 14c4 4 10 4 14 0l13-13 12 12c5 5 13 2 13-5v-86c0-42-26-72-66-72Z"
        fill="url(#mf-body)"
        opacity="0.95"
      />
      <ellipse cx="111" cy="102" rx="9" ry="13" fill="#fff" />
      <ellipse cx="149" cy="102" rx="9" ry="13" fill="#fff" />
    </svg>
  );
}

export default function ModeFantomePage() {
  const { status } = useSession();
  const { isLoading: premiumLoading, can } = usePremium();
  const canGhost = can("ghostMode");

  const [visibility, setVisibility] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/users/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setVisibility(d?.success ? d.user?.visibilite ?? "public" : "public"))
      .catch(() => setVisibility("public"));
  }, [status]);

  const ghost = visibility === "invisible";

  const toggle = async (next: boolean) => {
    if (toggling || next === ghost) return;
    setToggling(true);
    setError("");
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibilite: next ? "invisible" : "public" }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.success) {
        setError(d?.error ?? "Le changement n’a pas pu être enregistré.");
        return;
      }
      setVisibility(next ? "invisible" : "public");
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
    } finally {
      setToggling(false);
    }
  };

  const ready = status !== "loading" && !premiumLoading && (status !== "authenticated" || visibility !== null);

  return (
    <ExplorerShell>
      <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6">
        <BackButton fallbackHref="/mon-compte?tab=preferences" fallbackLabel="Retour aux préférences" />

        {/* Hero */}
        <section className={cn(CARD, "relative isolate mt-5 overflow-hidden border-violet-300/30")}>
          <MoonScene className="pointer-events-none absolute -right-24 bottom-0 -z-10 h-full w-[760px] opacity-60" />
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#1b0b40] via-[#1b0b40]/75 to-transparent" />
          <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_260px]">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-400/10 px-3.5 py-1 text-xs font-semibold text-amber-200">
                <Crown className="h-3.5 w-3.5" /> Discrétion premium
              </span>
              <h1 className="mt-4 flex items-center gap-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
                <span className="bg-gradient-to-r from-white via-violet-100 to-fuchsia-200 bg-clip-text text-transparent">Mode Fantôme</span>
                <Ghost className="h-10 w-10 text-violet-200" />
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
                Naviguez en toute discrétion sur SferaLuna. Vous choisissez quand être visible, et quand rester dans l’ombre.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {["Plus de liberté", "Plus de contrôle", "En toute tranquillité"].map((t) => (
                  <span key={t} className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-[#1b0d38]/70 px-3 py-1.5 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 text-violet-300" /> {t}
                  </span>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }} transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}>
              <GhostArt className="mx-auto h-48 w-52 drop-shadow-[0_0_40px_rgba(192,132,252,0.6)] sm:h-56 sm:w-60" />
            </motion.div>
          </div>
        </section>

        {/* Fonctionnalités */}
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <section className={cn(CARD, "flex flex-col p-5")}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <EyeOff className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Navigation invisible</h2>
                <p className="mt-1 text-sm text-white/65">Parcourez les profils et leurs photos sans laisser de trace : vos visites ne sont pas enregistrées.</p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="relative space-y-2 rounded-2xl border border-violet-300/15 bg-[#140829]/80 p-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] p-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                      <User className="h-4 w-4 text-white/50" />
                    </span>
                    <span className="flex-1 space-y-1.5">
                      <span className="block h-1.5 w-2/3 rounded-full bg-white/15" />
                      <span className="block h-1.5 w-1/3 rounded-full bg-white/10" />
                    </span>
                  </div>
                ))}
                <span className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-violet-300/30 bg-[#1b0d38]">
                  <EyeOff className="h-5 w-5 text-violet-200" />
                </span>
              </div>
            </div>
          </section>

          <section className={cn(CARD, "flex flex-col p-5")}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500">
                <ToggleRight className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Contrôle de visibilité</h2>
                <p className="mt-1 text-sm text-white/65">Votre profil disparaît des découvertes, de la recherche et des Affinités de la semaine. Vous revenez quand vous voulez.</p>
              </div>
            </div>
            <div className="mt-auto space-y-2 pt-4" role="radiogroup" aria-label="Visibilité">
              {[
                { on: false, label: "Mode visible", icon: User },
                { on: true, label: "Mode fantôme", icon: Ghost },
              ].map((o) => {
                const active = ghost === o.on;
                return (
                  <button
                    key={o.label}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!canGhost || toggling || !ready}
                    onClick={() => toggle(o.on)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-sm transition disabled:cursor-not-allowed",
                      active ? "border-fuchsia-300/60 bg-fuchsia-500/15 font-semibold" : "border-violet-300/20 bg-white/[0.03] text-white/75 enabled:hover:border-fuchsia-300/40"
                    )}
                  >
                    <o.icon className="h-4 w-4 text-violet-200" />
                    <span className="flex-1 text-left">{o.label}</span>
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border", active ? "border-transparent bg-gradient-to-br from-fuchsia-500 to-pink-500" : "border-white/30")}>
                      {active && <span className="h-2 w-2 rounded-full bg-white" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(CARD, "flex flex-col p-5")}>
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Discrétion avancée</h2>
                <p className="mt-1 text-sm text-white/65">Aucune notification de visite n’est envoyée. Vos conversations en cours continuent normalement.</p>
              </div>
            </div>
            <div className="mt-auto flex justify-center pt-4">
              <svg viewBox="0 0 160 110" className="h-28 w-40" aria-hidden>
                <ellipse cx="80" cy="58" rx="74" ry="30" fill="none" stroke="#c4b5fd" strokeOpacity="0.4" strokeDasharray="3 5" />
                <circle cx="8" cy="60" r="3" fill="#e9d5ff" />
                <circle cx="152" cy="54" r="3" fill="#e9d5ff" />
                <path d="M80 10 L112 22 V54 C112 78 98 94 80 102 C62 94 48 78 48 54 V22 Z" fill="#4c1d95" stroke="#a78bfa" strokeWidth="2.5" />
                <path d="M80 36c-9 0-14 6-14 14v18l4-4 4 4 3-3 3 3 3-3 3 3 4-4 4 4V50c0-8-5-14-14-14Z" fill="#f5f3ff" />
                <circle cx="76" cy="50" r="2" fill="#4c1d95" />
                <circle cx="84" cy="50" r="2" fill="#4c1d95" />
              </svg>
            </div>
          </section>
        </div>

        {/* Statut / accès */}
        <section className={cn(CARD, "mt-4 flex flex-col items-center px-6 py-8 text-center", ghost && canGhost && "border-fuchsia-300/40")}>
          {!ready ? (
            <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
          ) : canGhost ? (
            <>
              <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl", ghost ? "bg-gradient-to-br from-violet-500 to-fuchsia-500" : "bg-white/[0.06]")}>
                <Ghost className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-2xl font-bold">{ghost ? "Mode Fantôme activé" : "Mode Fantôme désactivé"}</h2>
              <p className="mt-2 max-w-lg text-sm text-white/70">
                {ghost
                  ? "Votre profil est masqué des découvertes et de la recherche, et vos visites ne laissent aucune trace."
                  : "Votre profil est visible selon vos préférences de visibilité. Activez le Mode Fantôme pour passer incognito."}
              </p>
              <button
                type="button"
                onClick={() => toggle(!ghost)}
                disabled={toggling}
                className={cn(
                  "mt-5 inline-flex h-12 items-center gap-2 rounded-2xl px-7 font-semibold transition disabled:opacity-60",
                  ghost ? "border border-violet-200/30 hover:border-fuchsia-300/60" : "bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-[0_16px_40px_-16px_rgba(236,72,153,0.95)] hover:brightness-110"
                )}
              >
                {toggling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Ghost className="h-5 w-5" />}
                {ghost ? "Redevenir visible" : "Activer le Mode Fantôme"}
              </button>
              {error && (
                <p className="mt-3 flex items-center gap-2 text-sm text-red-300">
                  <AlertCircle className="h-4 w-4" /> {error}
                </p>
              )}
            </>
          ) : (
            <>
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/25 bg-white/[0.05]">
                <Lock className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-bold">Fonctionnalité Premium</h2>
              <p className="mt-2 max-w-lg text-sm text-white/70">
                Le Mode Fantôme est réservé aux membres avec une offre Premium ou Elite active. Passez à l’une de ces offres pour activer la navigation invisible.
              </p>
              <Link
                href={status === "authenticated" ? "/paiement" : "/tarifs"}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-8 font-semibold shadow-[0_16px_40px_-16px_rgba(236,72,153,0.95)] transition hover:brightness-110"
              >
                Découvrir les offres <Sparkles className="h-5 w-5" />
              </Link>
              <p className="mt-3 text-xs text-white/50">Activation possible dès la validation de l’abonnement.</p>
            </>
          )}
        </section>
      </div>
    </ExplorerShell>
  );
}
