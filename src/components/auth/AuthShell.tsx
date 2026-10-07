// src/components/auth/AuthShell.tsx

"use client";

/**
 * Coquille commune des formulaires d'accès (connexion, inscription,
 * mot de passe oublié) : fond plein écran, colonne de présentation à gauche,
 * carte du formulaire à droite.
 *
 * Fond : l'image déposée dans public/images/auth-bg.* (voir app/auth/layout)
 * recouvre la scène lunaire vectorielle, qui reste le fond de secours.
 */

import { useState, type ElementType, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Crown, Eye, EyeOff, Heart, Loader2, Lock, Moon, Shield } from "lucide-react";

import { MoonHorizon } from "@/components/site/art";
import { cn } from "@/components/site/ui";

const BENEFITS = [
  { icon: Crown, title: "Profils vérifiés", text: "Des membres authentiques pour des rencontres en toute confiance." },
  { icon: Shield, title: "Sécurité renforcée", text: "Vos données sont protégées et votre vie privée respectée." },
  { icon: Heart, title: "Rencontres plus authentiques", text: "Des échanges sincères et des connexions qui comptent vraiment." },
];

export function AuthShell({ children, label, wide = true }: { children: ReactNode; label: string; wide?: boolean }) {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#12081f] text-white">
      <MoonHorizon fixed />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: "var(--auth-bg, none)" }} aria-hidden />
      {/* Voiles : texte lisible à gauche, bas de page fondu */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-r from-[#12081f]/75 via-[#12081f]/25 to-transparent" aria-hidden />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#12081f]/30 xl:hidden" aria-hidden />

      <div
        className={cn(
          "relative z-10 mx-auto grid min-h-screen w-full max-w-[1760px] items-center gap-10 px-4 py-6 sm:px-6 sm:py-8 xl:gap-12 xl:pl-[107px] xl:pr-12",
          wide ? "xl:grid-cols-[minmax(0,1fr)_minmax(0,790px)]" : "xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]"
        )}
      >
        {/* Présentation (sous le formulaire sur mobile) */}
        <div className="order-2 max-w-xl xl:order-1">
          <Link href="/" className="mb-6 hidden w-fit items-center gap-2 text-sm text-white/70 transition hover:text-white xl:inline-flex">
            <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
          </Link>

          <Link href="/" className="flex w-fit items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl" aria-label="SferaLuna — accueil">
            <Moon className="h-10 w-10 text-white drop-shadow-[0_0_14px_rgba(240,171,252,0.9)] sm:h-12 sm:w-12" strokeWidth={2.2} />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">SferaLuna</span>
          </Link>

          <p className="mt-8 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            Entrez dans l’univers
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">SferaLuna</span>
          </p>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-white/80">Un réseau social élégant, sûr et authentique, pour des liens plus profonds.</p>

          <ul className="mt-9 space-y-7">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/40 bg-[#2a0f52]/70 shadow-[0_0_24px_-6px_rgba(217,70,239,0.7)] backdrop-blur">
                  <Icon className="h-6 w-6 text-fuchsia-200" />
                </span>
                <span>
                  <span className="block text-lg font-semibold text-white">{title}</span>
                  <span className="block max-w-[300px] text-sm leading-relaxed text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Carte formulaire */}
        <section
          aria-label={label}
          className="order-1 w-full rounded-[32px] border border-violet-300/30 bg-[#170b30]/85 p-5 shadow-[0_30px_100px_-30px_rgba(88,28,135,0.9)] backdrop-blur-2xl sm:p-8 xl:order-2 xl:p-10"
        >
          <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-white/70 transition hover:text-white xl:hidden">
            <ArrowLeft className="h-4 w-4" /> Retour à l’accueil
          </Link>
          {children}
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Champs
// ─────────────────────────────────────────────

const INPUT =
  "h-[54px] w-full rounded-xl border bg-white/[0.04] pl-14 pr-4 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:bg-white/[0.07] focus:ring-4";
const OK = "border-violet-300/20 focus:border-fuchsia-400/60 focus:ring-fuchsia-500/15";
const KO = "border-rose-400/60 focus:border-rose-400/70 focus:ring-rose-500/15";

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  autoComplete,
  value,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  icon: ElementType;
  error?: string;
  autoComplete?: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-white/90">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...(onChange ? { value: value ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
          className={cn(INPUT, error ? KO : OK)}
        />
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-rose-300 sm:text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({
  label,
  name,
  placeholder,
  autoComplete,
  error,
  aside,
  value,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  aside?: ReactNode;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={name} className="text-sm font-medium text-white/90">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          {...(onChange ? { value: value ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value) } : {})}
          className={cn(INPUT, "pr-12", error ? KO : OK)}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-rose-300 sm:text-sm">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ loading, disabled, children }: { loading: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="group flex h-[58px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-[17px] font-semibold text-white shadow-[0_14px_40px_-12px_rgba(217,70,239,0.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      <span>{children}</span>
      {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />}
    </button>
  );
}
