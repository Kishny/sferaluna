// src/app/paiement/page.tsx

"use client";

/**
 * /paiement — choix de l'offre puis paiement via Stripe Checkout.
 *
 * Contenu des offres : PUBLIC_PLANS (même source que /tarifs). Le montant
 * réellement débité vient des Price IDs Stripe côté serveur.
 */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CircleCheck,
  Crown,
  CreditCard,
  Flame,
  Ghost,
  Headphones,
  Heart,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import { ExplorerShell } from "@/components/explorer/shared";
import { PUBLIC_PLANS, type PublicPlan, type PublicPlanId } from "@/components/site/plans";
import { cn } from "@/components/site/ui";
import { usePremium } from "@/hooks/usePremium";

type PaidPlanId = Exclude<PublicPlanId, "free">;

const PAID_PLANS = PUBLIC_PLANS.filter((p): p is PublicPlan & { id: PaidPlanId } => p.id !== "free");

const STYLE: Record<PaidPlanId, { icon: LucideIcon; badge: string; check: string; ring: string }> = {
  "essential-monthly": { icon: Sparkles, badge: "from-violet-500 to-purple-500", check: "text-violet-300", ring: "border-violet-300/30" },
  "premium-monthly": { icon: Crown, badge: "from-fuchsia-500 to-pink-500", check: "text-pink-300", ring: "border-fuchsia-300/70" },
  "elite-monthly": { icon: Star, badge: "from-amber-400 to-yellow-500", check: "text-amber-200", ring: "border-amber-300/40" },
};

const BENEFITS = [
  { icon: Heart, title: "Plus de connexions", text: "Likes et messages illimités dès l’offre Essentiel." },
  { icon: Users, title: "Affinités de la semaine", text: "Une sélection de profils compatibles chaque semaine." },
  { icon: Ghost, title: "Plus de discrétion", text: "Mode Fantôme et visiteuses de votre profil (Premium)." },
];

const TRUST = [
  { icon: Heart, title: "Une communauté bienveillante", text: "Profils vérifiés et modération active" },
  { icon: ShieldCheck, title: "Vos données protégées", text: "Confidentialité et contrôle de votre visibilité" },
  { icon: Zap, title: "Annulation à tout moment", text: "Sans engagement, en quelques clics" },
  { icon: Headphones, title: "Une équipe à votre écoute", text: "Réponse sous 24–48 h" },
];

function PaiementContent() {
  const params = useSearchParams();
  const cancelled = params.get("payment") === "cancelled";
  const { plan: currentPlan, isPremium } = usePremium();

  const [selected, setSelected] = useState<PaidPlanId>("premium-monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waiver, setWaiver] = useState(false);

  const offer = useMemo(() => PAID_PLANS.find((p) => p.id === selected) ?? PAID_PLANS[1], [selected]);
  const style = STYLE[offer.id];
  const OfferIcon = style.icon;
  const isCurrent = isPremium && currentPlan === offer.id;

  const pay = async () => {
    if (loading || isCurrent) return;
    if (!waiver) {
      setError("Cochez la case d’accès immédiat avant de payer.");
      document.getElementById("waiver")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selected, withdrawalWaiver: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success || !data?.url) {
        setError(data?.error || "Impossible de démarrer le paiement. Réessayez dans un instant.");
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Connexion impossible. Réessayez dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExplorerShell>
      <div className="relative mx-auto max-w-[1360px] px-4 pb-24 sm:px-6 xl:pb-0">
        <BackButton fallbackHref="/mon-compte?tab=premium" fallbackLabel="Retour à Premium" />

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
          {/* ── Colonne principale ── */}
          <div className="min-w-0">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/50 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-200">
                <Crown className="h-4 w-4" /> Abonnements Premium
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl xl:text-[56px]">
                Choisissez votre offre{" "}
                <span className="bg-gradient-to-r from-fuchsia-200 via-pink-200 to-violet-200 bg-clip-text text-transparent">SferaLuna</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
                Accédez à une expérience complète avec des fonctionnalités exclusives et des outils pensés pour des rencontres plus vraies et plus profondes.
              </p>
            </motion.div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {BENEFITS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-fuchsia-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-0.5 text-sm text-white/65">{text}</p>
                  </div>
                </div>
              ))}
            </div>

            {cancelled && (
              <p className="mt-6 flex items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <AlertCircle className="h-4 w-4 shrink-0" /> Paiement annulé : aucun montant n’a été débité. Vous pouvez reprendre quand vous voulez.
              </p>
            )}

            {/* Offres */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {PAID_PLANS.map((p) => {
                const s = STYLE[p.id];
                const Icon = s.icon;
                const on = p.id === selected;
                const current = isPremium && currentPlan === p.id;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "relative flex flex-col rounded-3xl border bg-[#1b0d38]/75 p-5 backdrop-blur-xl transition",
                      on ? cn(s.ring, "bg-gradient-to-b from-fuchsia-500/15 to-[#1b0d38]/80 shadow-[0_24px_60px_-28px_rgba(236,72,153,0.9)]") : "border-violet-300/[0.14] hover:border-violet-300/35"
                    )}
                  >
                    {p.recommended && (
                      <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-xs font-bold">
                        <Flame className="h-3.5 w-3.5" /> Plus populaire
                      </span>
                    )}
                    <button type="button" onClick={() => setSelected(p.id)} className="text-left" aria-pressed={on}>
                      <div className="flex items-start justify-between">
                        <span className={cn("flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", s.badge)}>
                          <Icon className="h-6 w-6 text-white" />
                        </span>
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border-2", on ? "border-transparent bg-gradient-to-br from-fuchsia-500 to-pink-500" : "border-white/30")}>
                          {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                        </span>
                      </div>
                      <p className="mt-4 text-2xl font-bold">{p.name}</p>
                      <p className="mt-1 min-h-[40px] text-sm text-white/65">{p.tagline}</p>
                      <p className="mt-3">
                        <span className="text-3xl font-extrabold">{p.price}</span>
                        <span className="ml-1 text-sm text-white/60">/ mois</span>
                      </p>
                    </button>
                    <ul className="mt-4 flex-1 space-y-2.5">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                          <CircleCheck className={cn("mt-0.5 h-4 w-4 shrink-0", s.check)} /> {f}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={cn(
                        "mt-5 h-11 rounded-2xl text-sm font-semibold transition",
                        on ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 shadow-lg" : "border border-violet-200/30 hover:border-fuchsia-300/60"
                      )}
                    >
                      {current ? "Votre offre actuelle" : on ? "Offre sélectionnée" : "Choisir cette offre"}
                    </button>
                  </motion.div>
                );
              })}
            </div>

            {/* Confiance */}
            <div className="mt-6 grid gap-4 rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/70 p-5 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
              {TRUST.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-300" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs text-white/60">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Récapitulatif ── */}
          <aside className="min-w-0 xl:sticky xl:top-28 xl:self-start">
            <div className="rounded-3xl border border-violet-300/25 bg-[#1b0d38]/85 p-5 shadow-[0_24px_60px_-30px_rgba(8,0,24,0.9)] backdrop-blur-xl sm:p-6">
              <h2 className="flex items-center gap-2.5 text-2xl font-bold">
                <Sparkles className="h-6 w-6 text-fuchsia-300" /> Votre offre
              </h2>

              <div className="mt-5 flex items-center gap-3 rounded-2xl border border-fuchsia-300/40 bg-fuchsia-500/10 p-4">
                <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br", style.badge)}>
                  <OfferIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">SferaLuna {offer.name}</p>
                  <p className="text-xs text-white/65">{offer.tagline}</p>
                </div>
                <p className="text-right">
                  <span className="block text-xl font-bold">{offer.price}</span>
                  <span className="text-xs text-white/60">/ mois</span>
                </p>
              </div>

              <ul className="mt-5 space-y-2.5">
                {offer.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-white/85">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between text-white/70">
                  <dt>Sous-total</dt>
                  <dd>{offer.price}</dd>
                </div>
                <div className="flex justify-between text-white/70">
                  <dt>TVA</dt>
                  <dd>Incluse</dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                  <dt className="text-lg font-bold">Total</dt>
                  <dd>
                    <span className="text-xl font-bold">{offer.price}</span>
                    <span className="text-sm text-white/60"> / mois</span>
                  </dd>
                </div>
              </dl>

              <label htmlFor="waiver" className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-300/25 bg-white/[0.04] p-3.5 text-sm leading-relaxed text-white/80">
                <input
                  id="waiver"
                  type="checkbox"
                  checked={waiver}
                  onChange={(e) => {
                    setWaiver(e.target.checked);
                    setError("");
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-fuchsia-500"
                />
                <span>
                  Je demande l’accès immédiat à mon abonnement et je reconnais renoncer à mon droit de rétractation de 14 jours.{" "}
                  <a href="/conditions#section-4" target="_blank" rel="noreferrer" className="text-pink-300 hover:underline">
                    Voir les conditions
                  </a>
                </span>
              </label>

              {error && (
                <p className="mt-4 flex items-start gap-2 rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </p>
              )}

              <button
                type="button"
                onClick={pay}
                disabled={loading || isCurrent}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-base font-semibold shadow-[0_16px_40px_-16px_rgba(236,72,153,0.95)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                {isCurrent ? "C’est déjà votre offre" : loading ? "Redirection vers Stripe…" : "Payer avec Stripe"}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/60">
                <Lock className="h-3.5 w-3.5" /> Paiement 100 % sécurisé par Stripe · sans engagement
              </p>
            </div>

            <div className="mt-4 rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/75 p-5 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-8 w-8 shrink-0 text-fuchsia-300" />
                <div>
                  <p className="font-semibold">Paiement sécurisé Stripe</p>
                  <p className="mt-1 text-sm text-white/65">
                    Vous serez redirigée vers Stripe Checkout pour finaliser votre abonnement. Aucune donnée bancaire n’est stockée sur SferaLuna.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 pl-11">
                {["VISA", "Mastercard", "AMEX", "Apple Pay"].map((b) => (
                  <span key={b} className="rounded-lg border border-white/15 bg-white/[0.06] px-2.5 py-1 text-xs font-bold tracking-wide text-white/85">
                    {b}
                  </span>
                ))}
              </div>
              <p className="mt-3 pl-11 text-[11px] text-white/45">Moyens proposés selon votre appareil et votre banque.</p>
            </div>
          </aside>
        </div>
      </div>

      {/* Barre de paiement mobile : l'offre choisie reste visible pendant le défilement */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-violet-300/20 bg-[#140828]/95 px-4 py-3 backdrop-blur-xl xl:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">SferaLuna {offer.name}</p>
            <p className="text-xs text-white/65">{offer.price} / mois · TVA incluse</p>
          </div>
          <button
            type="button"
            onClick={pay}
            disabled={loading || isCurrent}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 text-sm font-semibold shadow-lg disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            {isCurrent ? "Offre actuelle" : "Payer"}
          </button>
        </div>
      </div>
    </ExplorerShell>
  );
}

export default function PaiementPage() {
  return (
    <Suspense fallback={null}>
      <PaiementContent />
    </Suspense>
  );
}

