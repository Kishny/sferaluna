// src/components/account/SecurityPanel.tsx

"use client";

/**
 * Mon compte → Sécurité : niveau de sécurité du compte, vérifications
 * (identité, photos), connexion (méthode, mot de passe), confidentialité
 * et suppression du compte.
 */

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Camera,
  ChevronRight,
  Circle,
  CircleCheck,
  Clock,
  Eye,
  FileText,
  IdCard,
  KeyRound,
  Loader2,
  LogIn,
  Mail,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
  type LucideIcon,
} from "lucide-react";

import { AccountHeader, BTN_DANGER, BTN_GRADIENT, BTN_OUTLINE, CARD, CardHead } from "@/components/account/kit";
import { cn } from "@/components/site/ui";

export type SecurityUser = {
  email: string;
  provider?: "credentials" | "google" | "apple";
  emailVerified?: boolean;
  question?: string;
  hasReponse?: boolean;
  identityVerified?: boolean;
  identityVerificationStatus?: "unverified" | "pending" | "verified" | "failed";
  photoVerified?: boolean;
  hasCompletedProfile?: boolean;
  createdAt?: string;
  lastLoginAt?: string | null;
};

const PROVIDER_LABEL: Record<string, string> = {
  credentials: "E-mail et mot de passe",
  google: "Compte Google",
  apple: "Compte Apple",
};

function formatDate(date?: string | null, withTime = false) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default function SecurityPanel({
  user,
  onHome,
  onOpenTab,
}: {
  user: SecurityUser;
  onHome: () => void;
  onOpenTab: (tab: "profil" | "preferences") => void;
}) {
  const checks: { ok: boolean; label: string; hint: string; action?: { label: string; href?: string; tab?: "profil" | "preferences" } }[] = [
    { ok: Boolean(user.emailVerified), label: "Adresse e-mail confirmée", hint: user.email },
    {
      ok: Boolean(user.question && user.hasReponse),
      label: "Question de sécurité définie",
      hint: "Aide à récupérer votre compte.",
      action: { label: "Définir", tab: "profil" },
    },
    {
      ok: Boolean(user.photoVerified),
      label: "Photos vérifiées par selfie",
      hint: "Prouve que vos photos sont bien les vôtres.",
      action: { label: "Vérifier", href: "/verification-photo" },
    },
    {
      ok: Boolean(user.identityVerified),
      label: "Identité vérifiée",
      hint: "Badge « Vérifiée » sur votre profil.",
    },
    { ok: Boolean(user.hasCompletedProfile), label: "Profil complété", hint: "Bio, intentions, centres d’intérêt…", action: { label: "Compléter", tab: "profil" } },
  ];
  const score = checks.filter((c) => c.ok).length;
  const pct = Math.round((score / checks.length) * 100);
  const level = pct >= 100 ? "Excellent" : pct >= 60 ? "Bon" : "À renforcer";

  return (
    <div className="pb-4">
      <AccountHeader icon={ShieldCheck} title="Sécurité" subtitle="Vérification d’identité, connexion et confidentialité." onHome={onHome} />

      <div className="space-y-4">
        {/* ── Niveau de sécurité ── */}
        <section className={cn(CARD, "sm:p-6")}>
          <div className="flex flex-col gap-6 xl:flex-row">
            <div className="xl:w-[300px] xl:shrink-0 xl:border-r xl:border-white/10 xl:pr-6">
              <p className="text-sm font-semibold">Niveau de sécurité</p>
              <p className="mt-1 text-3xl font-bold">
                {level}
                <span className="ml-2 align-middle text-sm font-medium text-white/50">
                  {score}/{checks.length}
                </span>
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-3 text-xs text-white/55">Chaque vérification renforce la confiance des autres membres envers votre profil.</p>
            </div>

            <ul className="grid min-w-0 flex-1 grid-cols-1 gap-2.5 md:grid-cols-2">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={cn("flex items-center gap-3 rounded-2xl border px-3.5 py-3", c.ok ? "border-emerald-300/25 bg-emerald-500/[0.07]" : "border-white/10 bg-white/[0.03]")}
                >
                  {c.ok ? <CircleCheck className="h-5 w-5 shrink-0 text-emerald-300" /> : <Circle className="h-5 w-5 shrink-0 text-white/30" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm font-medium", c.ok ? "text-white" : "text-white/75")}>{c.label}</span>
                    <span className="block truncate text-xs text-white/45">{c.hint}</span>
                  </span>
                  {!c.ok &&
                    c.action &&
                    (c.action.href ? (
                      <Link href={c.action.href} className="shrink-0 text-xs font-semibold text-pink-300 hover:underline">
                        {c.action.label}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => onOpenTab(c.action!.tab!)} className="shrink-0 text-xs font-semibold text-pink-300 hover:underline">
                        {c.action.label}
                      </button>
                    ))}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-2">
          {/* ── Colonne gauche ── */}
          <div className="min-w-0 space-y-4">
            <IdentityCard user={user} />

            <section className={CARD}>
              <CardHead
                icon={Camera}
                iconClass="text-sky-300"
                title="Vérification des photos"
                aside={user.photoVerified ? <Badge>Photos vérifiées</Badge> : null}
              />
              <p className="text-sm text-white/65">
                Un selfie pris en direct est comparé à vos photos. Il est chiffré, n’est jamais affiché et vous pouvez le supprimer à tout moment.
              </p>
              <Link href="/verification-photo" className={cn(BTN_OUTLINE, "mt-4 h-11 w-full px-5 text-sm sm:w-auto")}>
                {user.photoVerified ? "Gérer ma vérification" : "Faire mon selfie"} <ChevronRight className="h-4 w-4" />
              </Link>
            </section>
          </div>

          {/* ── Colonne droite ── */}
          <div className="min-w-0 space-y-4">
            <ConnectionCard user={user} />

            <section className={CARD}>
              <CardHead icon={Eye} title="Confidentialité" />
              <div className="space-y-2">
                <LinkRow icon={Eye} label="Visibilité du profil et Mode Fantôme" onClick={() => onOpenTab("preferences")} />
                <LinkRow icon={ShieldCheck} label="Conseils pour des rencontres en sécurité" href="/securite" />
                <LinkRow icon={FileText} label="Politique de confidentialité" href="/confidentialite" />
              </div>
            </section>
          </div>
        </div>

        <DangerZone />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Identité
// ─────────────────────────────────────────────

function IdentityCard({ user }: { user: SecurityUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const status = user.identityVerified ? "verified" : user.identityVerificationStatus || "unverified";

  const start = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/identity-verification", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(data?.error || "Une erreur est survenue.");
    } catch {
      setError("Impossible de lancer la vérification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={cn(CARD, status === "verified" ? "border-emerald-300/30" : "border-fuchsia-300/30")}>
      <CardHead icon={IdCard} iconClass="text-fuchsia-300" title="Vérification d’identité" aside={status === "verified" ? <Badge>Vérifiée</Badge> : null} />
      <p className="text-sm text-white/65">
        Vérifiez votre identité avec une pièce d’identité officielle pour obtenir le badge « Vérifiée » sur votre profil.
      </p>
      {status === "pending" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-amber-200">
          <Clock className="h-4 w-4" /> Vérification en cours…
        </p>
      )}
      {status === "failed" && <p className="mt-3 text-sm text-red-300">La vérification a échoué. Vous pouvez réessayer.</p>}
      {status !== "verified" && status !== "pending" && (
        <button type="button" onClick={start} disabled={loading} className={cn(BTN_GRADIENT, "mt-4 h-11 w-full px-5 text-sm sm:w-auto")}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          Vérifier mon identité
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </section>
  );
}

// ─────────────────────────────────────────────
// Connexion
// ─────────────────────────────────────────────

function ConnectionCard({ user }: { user: SecurityUser }) {
  const provider = user.provider || "credentials";
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const sendReset = async () => {
    setState("sending");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      setState(res.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  };

  const rows: { icon: LucideIcon; label: string; value: string | null }[] = [
    { icon: LogIn, label: "Méthode de connexion", value: PROVIDER_LABEL[provider] ?? provider },
    { icon: Mail, label: "E-mail", value: user.email },
    { icon: Clock, label: "Dernière connexion", value: formatDate(user.lastLoginAt, true) },
    { icon: BadgeCheck, label: "Membre depuis", value: formatDate(user.createdAt) },
  ];

  return (
    <section className={CARD}>
      <CardHead icon={KeyRound} title="Connexion" />
      <dl className="space-y-2.5">
        {rows
          .filter((r) => r.value)
          .map(({ icon: Icon, label, value }) => (
            <div key={label} className="grid grid-cols-[18px_150px_minmax(0,1fr)] items-center gap-x-3 text-sm">
              <Icon className="h-4 w-4 text-violet-300" />
              <dt className="text-white/55">{label}</dt>
              <dd className="truncate text-white/90" title={value ?? undefined}>
                {value}
              </dd>
            </div>
          ))}
      </dl>

      {provider === "credentials" ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
          <p className="text-sm font-medium">Mot de passe</p>
          <p className="mt-0.5 text-xs text-white/55">Stocké chiffré. Pour le changer, recevez un lien sécurisé par e-mail.</p>
          {state === "sent" ? (
            <p className="mt-3 text-sm text-emerald-300">Lien envoyé à {user.email}. Pensez à vérifier vos spams.</p>
          ) : (
            <button type="button" onClick={sendReset} disabled={state === "sending"} className={cn(BTN_OUTLINE, "mt-3 h-10 px-4 text-sm")}>
              {state === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Changer mon mot de passe
            </button>
          )}
          {state === "error" && <p className="mt-2 text-xs text-red-300">L’envoi a échoué. Réessayez dans quelques minutes.</p>}
        </div>
      ) : (
        <p className="mt-4 text-xs text-white/55">
          Vous vous connectez avec votre {provider === "google" ? "compte Google" : "compte Apple"} : votre mot de passe est géré par {provider === "google" ? "Google" : "Apple"}.
        </p>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Suppression du compte
// ─────────────────────────────────────────────

function DangerZone() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const confirmed = text.trim().toUpperCase() === "SUPPRIMER";

  const remove = async () => {
    if (!confirmed) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "La suppression n’a pas abouti.");
        setDeleting(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Connexion impossible. Réessayez.");
      setDeleting(false);
    }
  };

  return (
    <section className="rounded-3xl border border-red-400/25 bg-red-950/20 p-4 backdrop-blur-xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2.5 font-semibold text-red-100">
            <Trash2 className="h-5 w-5 text-red-300" /> Supprimer mon compte
          </h3>
          <p className="mt-1 text-sm text-white/60">
            Votre profil, vos photos, vos matchs et vos messages seront définitivement effacés. Un abonnement en cours ne sera pas renouvelé.
          </p>
        </div>
        <button type="button" onClick={() => setOpen(true)} className={cn(BTN_DANGER, "h-11 shrink-0 px-5 text-sm")}>
          <Trash2 className="h-4 w-4" /> Supprimer mon compte
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setOpen(false)}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Supprimer mon compte"
              className="w-full max-w-md rounded-t-3xl border border-red-400/30 bg-[#1b0d38] p-6 text-white shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15">
                  <AlertTriangle className="h-6 w-6 text-red-300" />
                </span>
                <button type="button" onClick={() => setOpen(false)} disabled={deleting} aria-label="Fermer" className="rounded-full p-2 text-white/60 hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <h2 className="mt-4 text-xl font-bold">Supprimer définitivement votre compte ?</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Cette action est irréversible : profil, photos, vidéos, matchs, messages et publications seront effacés.
              </p>
              <label className="mt-5 block text-sm text-white/80">
                Tapez <span className="font-bold text-white">SUPPRIMER</span> pour confirmer
                <input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" className="input-luna mt-2" placeholder="SUPPRIMER" />
              </label>
              {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
              <button type="button" onClick={remove} disabled={!confirmed || deleting} className={cn(BTN_DANGER, "mt-5 h-12 w-full border-red-400/50 bg-red-600/80 text-white hover:bg-red-600")}>
                {deleting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                Supprimer mon compte
              </button>
              <button type="button" onClick={() => setOpen(false)} disabled={deleting} className="mt-2 h-11 w-full rounded-2xl text-sm text-white/65 hover:bg-white/5">
                Annuler
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─────────────────────────────────────────────
// Petites briques
// ─────────────────────────────────────────────

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">
      <BadgeCheck className="h-3.5 w-3.5" /> {children}
    </span>
  );
}

function LinkRow({ icon: Icon, label, href, onClick }: { icon: LucideIcon; label: string; href?: string; onClick?: () => void }) {
  const cls = "flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-left text-sm text-white/85 transition hover:border-fuchsia-300/45";
  const inner = (
    <>
      <Icon className="h-4 w-4 shrink-0 text-violet-300" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-white/40" />
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
