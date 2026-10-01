// src/app/contact/page.tsx

"use client";

/**
 * /contact — formulaire de contact.
 * Le message est envoyé à l'équipe par /api/contact (e-mail Resend,
 * « Répondre » répond directement à l'expéditrice).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ChevronDown,
  Crown,
  Headphones,
  Heart,
  List,
  Loader2,
  Mail,
  MessageCircleMore,
  MessageSquare,
  Pencil,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";

import BackButton from "@/components/BackButton";
import { Container, SiteShell } from "@/components/site/sections";
import { cn } from "@/components/site/ui";

const SUBJECTS = [
  { value: "technique", label: "Problème technique" },
  { value: "abonnement", label: "Abonnement / Paiement" },
  { value: "compte", label: "Mon compte" },
  { value: "signalement", label: "Signalement / Sécurité" },
  { value: "autre", label: "Autre" },
];

const MAX = 1000;
const FIELD =
  "h-12 w-full rounded-2xl border border-violet-300/20 bg-white/[0.05] pl-11 pr-4 text-[15px] text-white placeholder:text-white/40 transition focus:border-fuchsia-300/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20";

export default function ContactPage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  // Pré-remplit le nom et l'e-mail pour une membre connectée.
  useEffect(() => {
    if (!session?.user) return;
    setForm((f) => ({ ...f, nom: f.nom || session.user?.name || "", email: f.email || session.user?.email || "" }));
  }, [session]);

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.success) {
        setError(d?.error ?? "L’envoi n’a pas abouti. Réessayez dans un instant.");
        return;
      }
      setSent(true);
    } catch {
      setError("Connexion impossible. Réessayez, ou écrivez-nous à contact@sferaluna.com.");
    } finally {
      setSending(false);
    }
  };

  const infos = [
    { icon: Mail, label: "E-mail", value: "contact@sferaluna.com", href: "mailto:contact@sferaluna.com" },
    { icon: MessageCircleMore, label: "Réponse", value: "Sous 24–48 h" },
    { icon: Crown, label: "Support premium", value: "Prioritaire" },
  ];

  return (
    <SiteShell>
      <Container className="relative pb-16 pt-24 sm:pt-28">
        <BackButton fallbackHref="/" fallbackLabel="Retour à l’accueil" />

        <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/50 bg-fuchsia-500/10 px-4 py-1.5 text-sm font-semibold text-fuchsia-100">
            <Mail className="h-4 w-4" /> Contactez-nous
          </span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            On est là <span className="bg-gradient-to-r from-fuchsia-200 to-pink-300 bg-clip-text text-transparent">pour vous</span> 💜
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            Une question, un problème ou juste envie de dire bonjour ? Écrivez-nous, notre équipe vous répond avec attention.
          </p>
        </motion.header>

        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
          {infos.map(({ icon: Icon, label, value, href }) => {
            const inner = (
              <>
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-500 shadow-lg">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-2 block text-sm text-white/60">{label}</span>
                <span className="block font-bold">{value}</span>
              </>
            );
            const cls = "rounded-3xl border border-violet-300/[0.16] bg-[#1b0d38]/70 p-4 text-center backdrop-blur-xl transition";
            return href ? (
              <a key={label} href={href} className={cn(cls, "hover:border-fuchsia-300/50")}>
                {inner}
              </a>
            ) : (
              <div key={label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-5 max-w-3xl rounded-3xl border border-fuchsia-300/25 bg-[#1b0d38]/80 p-5 shadow-[0_24px_70px_-30px_rgba(192,38,211,0.6)] backdrop-blur-xl sm:p-8"
        >
          {sent ? (
            <div className="py-8 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500">
                <Send className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-2xl font-bold">Message envoyé 💜</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
                Merci {form.nom.split(" ")[0]} ! Nous vous répondons à {form.email} sous 24 à 48 h.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setForm((f) => ({ ...f, sujet: "", message: "" }));
                  }}
                  className="h-11 rounded-2xl border border-violet-200/30 px-5 text-sm hover:border-fuchsia-300/60"
                >
                  Envoyer un autre message
                </button>
                <Link href="/faq" className="inline-flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 text-sm font-semibold">
                  Consulter la FAQ
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="mb-5 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2.5 text-xl font-bold sm:text-2xl">
                  <MessageSquare className="h-6 w-6 text-pink-300" /> Envoyez-nous un message
                </h2>
                <span className="hidden items-center gap-1.5 rounded-full border border-violet-300/30 px-3 py-1 text-xs text-violet-100 sm:inline-flex">
                  <Headphones className="h-3.5 w-3.5" /> Support Luna
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Votre nom" icon={User}>
                  <input value={form.nom} onChange={(e) => update("nom", e.target.value)} required maxLength={80} placeholder="Luna Dupont" className={FIELD} autoComplete="name" />
                </Field>
                <Field label="Votre e-mail" icon={Mail}>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required maxLength={160} placeholder="vous@email.com" className={FIELD} autoComplete="email" />
                </Field>
              </div>

              <Field label="Sujet" icon={List} className="mt-4">
                <select value={form.sujet} onChange={(e) => update("sujet", e.target.value)} required className={cn(FIELD, "appearance-none pr-10", !form.sujet && "text-white/40")}>
                  <option value="" disabled>
                    Choisir un sujet…
                  </option>
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value} className="bg-[#1b0d38] text-white">
                      {s.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
              </Field>

              <Field label="Message" icon={Pencil} className="mt-4" iconTop>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value.slice(0, MAX))}
                  required
                  rows={5}
                  placeholder="Décrivez votre demande en détail…"
                  className={cn(FIELD, "h-auto min-h-[120px] resize-y py-3")}
                />
              </Field>
              <p className="mt-1 text-right text-xs text-white/45">
                {form.message.length}/{MAX}
              </p>

              <p className="mt-3 flex items-start gap-3 rounded-2xl border border-violet-300/20 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-300" />
                Votre message reste confidentiel. Les demandes liées à la sécurité, au signalement ou au compte sont traitées avec attention.
              </p>

              {error && (
                <p className="mt-3 flex items-start gap-2 rounded-2xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 text-base font-semibold shadow-[0_16px_40px_-16px_rgba(236,72,153,0.95)] transition hover:brightness-110 disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                {sending ? "Envoi en cours…" : "Envoyer le message"}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/55">
                <Heart className="h-3.5 w-3.5 text-pink-300" /> Nous respectons votre vie privée. Aucun spam.
              </p>
            </form>
          )}
        </motion.section>
      </Container>
    </SiteShell>
  );
}

function Field({
  label,
  icon: Icon,
  children,
  className = "",
  iconTop = false,
}: {
  label: string;
  icon: typeof User;
  children: React.ReactNode;
  className?: string;
  iconTop?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm text-white/80">{label}</span>
      <span className="relative block">
        <Icon className={cn("pointer-events-none absolute left-4 h-4 w-4 text-white/50", iconTop ? "top-4" : "top-1/2 -translate-y-1/2")} />
        {children}
      </span>
    </label>
  );
}
