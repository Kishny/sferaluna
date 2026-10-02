// src/app/auth/reset-password/page.tsx

"use client";

/**
 * Mot de passe oublié.
 *
 * 1. Sans jeton dans l'URL : saisie de l'email, envoi du lien
 *    (POST /api/auth/reset-password).
 * 2. Avec ?token=… : choix du nouveau mot de passe
 *    (PATCH /api/auth/reset-password), puis retour à la connexion.
 */

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Loader2, Mail, MailCheck } from "lucide-react";

import { AuthShell, Field, PasswordField, SubmitButton } from "@/components/auth/AuthShell";
import { cn } from "@/components/site/ui";

function ResetContent() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const checks = [
    { ok: password.length >= 8, label: "8 caractères minimum" },
    { ok: /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(password), label: "Une lettre" },
    { ok: /\d/.test(password), label: "Un chiffre" },
    { ok: password.length > 0 && password === confirm, label: "Les deux saisies sont identiques" },
  ];
  const valid = checks.every((c) => c.ok);

  const requestLink = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(cleaned)) {
      setError("Saisissez une adresse email valide.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleaned }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Erreur serveur. Réessayez dans un instant.");
        return;
      }
      // Message identique que l'adresse existe ou non (ne révèle rien).
      setSent(true);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setError("Lien de réinitialisation invalide ou manquant.");
      return;
    }
    if (!valid) {
      setError("Le mot de passe ne respecte pas encore toutes les conditions ci-dessous.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Ce lien n’est plus valide. Demandez-en un nouveau.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/auth?mode=login"), 2500);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const back = (
    <p className="pt-1 text-center text-[15px] text-white/70">
      <Link href="/auth?mode=login" className="inline-flex items-center gap-2 font-medium text-fuchsia-300 hover:text-fuchsia-200">
        <ArrowLeft className="h-4 w-4" /> Retour à la connexion
      </Link>
    </p>
  );

  const alert = error && (
    <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
    </p>
  );

  return (
    <AuthShell label="Mot de passe oublié" wide={false}>
      {done ? (
        <div className="py-6 text-center" role="status">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-300" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight">Mot de passe modifié</h1>
          <p className="mt-2 text-base text-white/70">Vous allez être redirigée vers la connexion…</p>
        </div>
      ) : sent ? (
        <div className="space-y-5 py-2 text-center" role="status">
          <MailCheck className="mx-auto h-14 w-14 text-fuchsia-300" />
          <h1 className="text-3xl font-bold tracking-tight">Vérifiez votre boîte mail</h1>
          <p className="text-base leading-relaxed text-white/70">
            Si un compte existe avec <span className="font-medium text-white">{email.trim().toLowerCase()}</span>, un lien pour choisir un nouveau mot de passe vient d’être envoyé. Pensez à regarder
            dans les courriers indésirables.
          </p>
          <button type="button" onClick={() => setSent(false)} className="text-sm text-white/65 underline-offset-2 hover:text-white hover:underline">
            Utiliser une autre adresse
          </button>
          {back}
        </div>
      ) : token ? (
        <form onSubmit={savePassword} noValidate className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau mot de passe</h1>
            <p className="mt-2 text-base text-white/70">Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</p>
          </div>
          {alert}
          <PasswordField label="Nouveau mot de passe" name="password" placeholder="Minimum 8 caractères" autoComplete="new-password" value={password} onChange={setPassword} />
          <PasswordField label="Confirmer le mot de passe" name="passwordConfirm" placeholder="Retapez votre mot de passe" autoComplete="new-password" value={confirm} onChange={setConfirm} />
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {checks.map(({ ok, label }) => (
              <li key={label} className={cn("flex items-center gap-2", ok ? "text-emerald-300" : "text-white/55")}>
                <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border", ok ? "border-emerald-400/60 bg-emerald-500/15" : "border-white/25")}>
                  {ok && <Check className="h-3 w-3" />}
                </span>
                {label}
              </li>
            ))}
          </ul>
          <SubmitButton loading={loading}>{loading ? "Enregistrement…" : "Enregistrer le mot de passe"}</SubmitButton>
          {back}
        </form>
      ) : (
        <form onSubmit={requestLink} noValidate className="space-y-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mot de passe oublié ?</h1>
            <p className="mt-2 text-base text-white/70">Indiquez l’adresse email de votre compte : nous vous envoyons un lien pour en choisir un nouveau.</p>
          </div>
          {alert}
          <Field label="Adresse email" name="email" type="email" placeholder="votre@email.com" icon={Mail} autoComplete="email" value={email} onChange={setEmail} />
          <SubmitButton loading={loading}>{loading ? "Envoi…" : "Recevoir le lien"}</SubmitButton>
          {back}
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#12081f]">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
        </div>
      }
    >
      <ResetContent />
    </Suspense>
  );
}
