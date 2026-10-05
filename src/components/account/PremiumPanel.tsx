// src/components/account/PremiumPanel.tsx

"use client";

/**
 * Mon compte → Premium : offre actuelle, gestion de l'abonnement Stripe
 * (changer, mettre en pause, annuler, réactiver, synchroniser), avantages
 * inclus et comparatif des offres (contenu de /tarifs).
 */

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  Check,
  CircleCheck,
  Crown,
  CreditCard,
  Gem,
  Heart,
  Loader2,
  Moon,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { AccountHeader, BTN_DANGER, BTN_GRADIENT, BTN_OUTLINE, CARD, CardHead } from "@/components/account/kit";
import { PUBLIC_PLANS, type PublicPlan, type PublicPlanId } from "@/components/site/plans";
import { cn } from "@/components/site/ui";

export type PremiumUser = {
  plan: PublicPlanId;
  subscriptionStatus: "inactive" | "active" | "trialing" | "past_due" | "canceled";
  premiumStartedAt?: string | null;
  premiumExpiresAt?: string | null;
  lastPaymentAt?: string | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  subscriptionPaused?: boolean;
};

const TONE: Record<PublicPlan["tone"], { icon: LucideIcon; badge: string; ring: string; text: string }> = {
  moon: { icon: Moon, badge: "from-violet-400/40 to-indigo-500/40", ring: "border-violet-300/25", text: "text-violet-100" },
  star: { icon: Star, badge: "from-violet-500 to-purple-500", ring: "border-violet-300/45", text: "text-violet-200" },
  heart: { icon: Heart, badge: "from-fuchsia-500 to-pink-500", ring: "border-fuchsia-300/55", text: "text-pink-200" },
  diamond: { icon: Gem, badge: "from-amber-400 to-yellow-500", ring: "border-amber-300/55", text: "text-amber-200" },
};

function formatDate(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function PremiumPanel({
  user,
  active,
  onChanged,
  onHome,
}: {
  user: PremiumUser;
  active: boolean;
  onChanged: () => void;
  onHome: () => void;
}) {
  const plan = PUBLIC_PLANS.find((p) => p.id === user.plan) ?? PUBLIC_PLANS[0];
  const tone = TONE[plan.tone];
  const PlanIcon = tone.icon;
  const paid = user.plan !== "free";

  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const call = async (endpoint: string, key: string) => {
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setMessage({ ok: true, text: data.message ?? "C’est fait." });
        setConfirmCancel(false);
        onChanged();
      } else {
        setMessage({ ok: false, text: data?.error ?? "L’opération n’a pas abouti." });
      }
    } catch {
      setMessage({ ok: false, text: "Connexion impossible. Réessayez." });
    } finally {
      setBusy(null);
    }
  };

  const sync = async () => {
    setBusy("sync");
    setMessage(null);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setMessage({ ok: true, text: data.isPremium ? "Abonnement activé !" : data.message ?? "Synchronisé." });
        if (data.isPremium) onChanged();
      } else {
        setMessage({ ok: false, text: data?.error ?? "Erreur de synchronisation." });
      }
    } catch {
      setMessage({ ok: false, text: "Connexion impossible. Réessayez." });
    } finally {
      setBusy(null);
    }
  };

  const status = user.subscriptionPaused
    ? { label: "En pause", cls: "border-sky-300/40 bg-sky-500/15 text-sky-100" }
    : user.subscriptionCancelAtPeriodEnd
      ? { label: "Annulation programmée", cls: "border-orange-300/40 bg-orange-500/15 text-orange-100" }
      : active
        ? { label: user.subscriptionStatus === "trialing" ? "Essai en cours" : "Actif", cls: "border-emerald-300/40 bg-emerald-500/15 text-emerald-100" }
        : user.subscriptionStatus === "past_due"
          ? { label: "Paiement en retard", cls: "border-red-300/40 bg-red-500/15 text-red-100" }
          : paid
            ? { label: "En attente", cls: "border-amber-300/40 bg-amber-500/15 text-amber-100" }
            : { label: "Offre gratuite", cls: "border-violet-300/30 bg-white/[0.06] text-white/80" };

  const details = [
    { icon: CreditCard, label: "Dernier paiement", value: formatDate(user.lastPaymentAt) },
    {
      icon: CalendarClock,
      label: user.subscriptionCancelAtPeriodEnd ? "Fin de l’accès" : "Prochain renouvellement",
      value: active || user.subscriptionCancelAtPeriodEnd ? formatDate(user.premiumExpiresAt) : null,
    },
    { icon: CalendarCheck, label: "Abonnée depuis", value: formatDate(user.premiumStartedAt) },
  ].filter((d) => d.value);

  const canManage = active && !user.subscriptionCancelAtPeriodEnd && !user.subscriptionPaused;

  return (
    <div className="pb-4">
      <AccountHeader icon={Crown} title="Premium" subtitle="Votre offre, vos avantages et la gestion de votre abonnement." onHome={onHome} />

      <div className="space-y-4">
        {/* ── Offre actuelle ── */}
        <section className={cn(CARD, "relative overflow-hidden sm:p-6", tone.ring)}>
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg", tone.badge)}>
                <PlanIcon className="h-8 w-8 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Votre offre</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", status.cls)}>{status.label}</span>
                </div>
                <p className="mt-1 text-sm text-white/65">
                  {plan.tagline}
                  {paid && <span className="text-white/45"> · {plan.price} / mois</span>}
                </p>
              </div>
            </div>

            {details.length > 0 && (
              <dl className="grid min-w-0 grid-cols-1 gap-2.5 border-white/10 sm:grid-cols-3 xl:w-[460px] xl:shrink-0 xl:grid-cols-1 xl:border-l xl:pl-6">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5 text-sm">
                    <Icon className="h-4 w-4 shrink-0 text-violet-300" />
                    <dt className="text-white/55">{label}</dt>
                    <dd className="ml-auto font-medium text-white/90 sm:ml-0 xl:ml-auto">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row xl:w-[240px] xl:shrink-0 xl:flex-col">
              {!active && !user.subscriptionCancelAtPeriodEnd && !user.subscriptionPaused && (
                <Link href="/paiement" className={cn(BTN_GRADIENT, "h-11 px-5 text-sm")}>
                  <Sparkles className="h-4 w-4" /> {paid ? "Finaliser mon abonnement" : "Découvrir les offres"}
                </Link>
              )}
              {canManage && (
                <Link href="/paiement" className={cn(BTN_GRADIENT, "h-11 px-5 text-sm")}>
                  <Sparkles className="h-4 w-4" /> Changer d’offre
                </Link>
              )}
              {(user.subscriptionCancelAtPeriodEnd || user.subscriptionPaused) && (
                <button type="button" onClick={() => call("/api/stripe/reactivate", "reactivate")} disabled={!!busy} className={cn(BTN_GRADIENT, "h-11 px-5 text-sm")}>
                  {busy === "reactivate" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
                  Réactiver l’abonnement
                </button>
              )}
              {!active && paid && !user.subscriptionCancelAtPeriodEnd && !user.subscriptionPaused && (
                <button type="button" onClick={sync} disabled={!!busy} className={cn(BTN_OUTLINE, "h-11 px-5 text-sm")}>
                  {busy === "sync" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  J’ai payé : synchroniser
                </button>
              )}
            </div>
          </div>

          {/* Alertes */}
          {(user.subscriptionCancelAtPeriodEnd || user.subscriptionPaused || (!active && paid) || message) && (
            <div className="relative mt-5 space-y-2">
              {user.subscriptionCancelAtPeriodEnd && (
                <Alert tone="orange">
                  Votre abonnement s’arrêtera {formatDate(user.premiumExpiresAt) ? `le ${formatDate(user.premiumExpiresAt)}` : "à la fin de la période payée"}. Vous gardez vos avantages jusqu’à cette date.
                </Alert>
              )}
              {user.subscriptionPaused && <Alert tone="sky">Abonnement en pause : aucun prélèvement pendant la pause. Réactivez-le quand vous voulez.</Alert>}
              {!active && paid && !user.subscriptionCancelAtPeriodEnd && !user.subscriptionPaused && (
                <Alert tone="amber">Offre choisie mais accès pas encore activé. Si vous avez déjà payé, cliquez sur « J’ai payé : synchroniser ».</Alert>
              )}
              {message && <Alert tone={message.ok ? "emerald" : "red"}>{message.text}</Alert>}
            </div>
          )}
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Avantages */}
          <section className={CARD}>
            <CardHead icon={Sparkles} iconClass="text-amber-200" title={`Inclus dans l’offre ${plan.name}`} subtitle={plan.highlight} />
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white/85">
                  <CircleCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          {/* Gestion + paiement */}
          <div className="min-w-0 space-y-4">
            {canManage && (
              <section className={CARD}>
                <CardHead icon={Crown} title="Gérer mon abonnement" subtitle="Sans engagement. Vous gardez vos avantages jusqu’à la fin de la période payée." />
                {confirmCancel ? (
                  <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-3.5">
                    <p className="flex items-start gap-2 text-sm text-red-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      Confirmer l’annulation ? L’abonnement ne sera pas renouvelé{formatDate(user.premiumExpiresAt) ? ` après le ${formatDate(user.premiumExpiresAt)}` : ""}.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button type="button" onClick={() => call("/api/stripe/cancel", "cancel")} disabled={!!busy} className={cn(BTN_DANGER, "h-10 flex-1 px-4 text-sm")}>
                        {busy === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        Oui, annuler
                      </button>
                      <button type="button" onClick={() => setConfirmCancel(false)} disabled={!!busy} className={cn(BTN_OUTLINE, "h-10 flex-1 px-4 text-sm")}>
                        Garder mon abonnement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button type="button" onClick={() => call("/api/stripe/pause", "pause")} disabled={!!busy} className={cn(BTN_OUTLINE, "h-10 flex-1 px-4 text-sm")}>
                      {busy === "pause" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
                      Mettre en pause
                    </button>
                    <button type="button" onClick={() => setConfirmCancel(true)} disabled={!!busy} className={cn(BTN_DANGER, "h-10 flex-1 px-4 text-sm")}>
                      <XCircle className="h-4 w-4" />
                      Annuler l’abonnement
                    </button>
                  </div>
                )}
              </section>
            )}

            <section className={CARD}>
              <CardHead icon={ShieldCheck} iconClass="text-emerald-300" title="Paiement sécurisé" />
              <div className="flex flex-wrap gap-2">
                {["Carte bancaire", "PayPal", "Apple Pay", "Google Pay"].map((m) => (
                  <span key={m} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75">
                    {m}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-white/50">Transactions sécurisées par Stripe. SferaLuna ne stocke aucune donnée bancaire.</p>
            </section>
          </div>
        </div>

        {/* ── Comparatif ── */}
        <section className={CARD}>
          <CardHead
            icon={Gem}
            iconClass="text-fuchsia-300"
            title="Les offres SferaLuna"
            aside={
              <Link href="/tarifs" className="text-xs font-semibold text-pink-300 hover:underline">
                Comparer en détail
              </Link>
            }
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {PUBLIC_PLANS.map((p) => {
              const t = TONE[p.tone];
              const Icon = t.icon;
              const current = p.id === user.plan;
              return (
                <div
                  key={p.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl border p-4",
                    current ? "border-fuchsia-300/60 bg-gradient-to-b from-fuchsia-500/15 to-transparent" : "border-white/10 bg-white/[0.03]"
                  )}
                >
                  {current && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Votre offre
                    </span>
                  )}
                  <div className="flex items-center gap-2.5">
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br", t.badge)}>
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                    <div>
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-xs text-white/55">
                        <span className={cn("font-semibold", t.text)}>{p.price}</span>
                        {p.id !== "free" && " / mois"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-white/65">{p.highlight}</p>
                  {!current && p.id !== "free" && (
                    <Link href="/paiement" className={cn(BTN_OUTLINE, "mt-3 h-9 rounded-xl px-3 text-xs")}>
                      Choisir {p.name}
                    </Link>
                  )}
                  {current && (
                    <span className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 text-xs font-medium text-emerald-200">
                      <Check className="h-3.5 w-3.5" /> Offre actuelle
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Alert({ tone, children }: { tone: "orange" | "sky" | "amber" | "emerald" | "red"; children: React.ReactNode }) {
  const cls = {
    orange: "border-orange-300/30 bg-orange-500/10 text-orange-100",
    sky: "border-sky-300/30 bg-sky-500/10 text-sky-100",
    amber: "border-amber-300/30 bg-amber-500/10 text-amber-100",
    emerald: "border-emerald-300/30 bg-emerald-500/10 text-emerald-100",
    red: "border-red-300/30 bg-red-500/10 text-red-100",
  }[tone];
  return <p className={cn("rounded-xl border px-3.5 py-2.5 text-sm", cls)}>{children}</p>;
}
