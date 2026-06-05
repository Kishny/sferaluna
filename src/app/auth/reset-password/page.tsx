// src/app/auth/reset-password/page.tsx

"use client";

/**
 * Page de réinitialisation du mot de passe SferaLuna.
 *
 * Deux modes :
 * 1. Sans token dans l'URL :
 *    - l'utilisateur saisit son email ;
 *    - on appelle POST /api/auth/reset-password ;
 *    - l'API envoie normalement un email avec un lien.
 *
 * 2. Avec token dans l'URL :
 *    - l'utilisateur définit un nouveau mot de passe ;
 *    - on appelle PATCH /api/auth/reset-password ;
 *    - si succès, redirection vers /auth.
 *
 * Exemple d'URL avec token :
 * /auth/reset-password?token=xxxxx
 */

import { Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Moon,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Mail,
  Lock,
} from "lucide-react";
import Link from "next/link";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /**
   * Token de reset présent dans l'URL.
   * S'il existe, on affiche le formulaire de nouveau mot de passe.
   */
  const token = searchParams.get("token");

  /**
   * Mode de la page :
   * - true : formulaire nouveau mot de passe ;
   * - false : demande de lien par email.
   */
  const hasToken = Boolean(token);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  /**
   * États UI.
   */
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  /**
   * Validation visuelle simple du mot de passe.
   */
  const passwordChecks = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasLetter: /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(password),
      hasNumber: /\d/.test(password),
      same: password.length > 0 && password === confirmPassword,
    };
  }, [password, confirmPassword]);

  const canSubmitNewPassword =
    passwordChecks.minLength &&
    passwordChecks.hasLetter &&
    passwordChecks.hasNumber &&
    passwordChecks.same &&
    !loading;

  /**
   * Demande de réinitialisation par email.
   */
  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanedEmail,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erreur serveur.");
        return;
      }

      /**
       * Pour éviter de révéler si l'email existe ou non,
       * l'UI affiche un message générique.
       */
      setSent(true);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enregistrement du nouveau mot de passe avec token.
   */
  const handleNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("Lien de réinitialisation invalide ou manquant.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (!passwordChecks.hasLetter || !passwordChecks.hasNumber) {
      setError("Le mot de passe doit contenir au moins une lettre et un chiffre.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Lien invalide ou expiré.");
        return;
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.push("/auth?mode=login");
      }, 2200);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] px-3 pb-8 pt-8 sm:px-4 sm:pt-16">
      {/* Décor doux */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/3 h-64 w-64 rounded-full bg-[#8E7AB5]/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Retour */}
        <Link
          href="/auth?mode=login"
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e8e0ff] bg-white/70 px-3 py-2 text-sm font-medium text-[#6B5F8E] shadow-sm transition hover:bg-white hover:text-[#5B4B8A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>

        {/* Header */}
        <div className="mb-7 text-center sm:mb-8">
          <div className="mb-5 inline-flex items-center gap-2 sm:mb-6">
            <Moon className="h-7 w-7 text-[#8E7AB5]" />

            <span className="bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] bg-clip-text text-2xl font-bold text-transparent">
              SferaLuna
            </span>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-[#1C1C1C]">
            {hasToken ? "Nouveau mot de passe" : "Mot de passe oublié"}
          </h1>

          <p className="mx-auto max-w-sm text-sm leading-relaxed text-[#666]">
            {hasToken
              ? "Choisissez un nouveau mot de passe sécurisé pour votre compte."
              : "Saisissez votre email pour recevoir un lien de réinitialisation."}
          </p>
        </div>

        <div className="rounded-2xl border border-[#f0ecff] bg-white p-5 shadow-lg sm:p-8">
          {/* Email envoyé */}
          <AnimatePresence mode="wait">
            {sent && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="py-4 text-center"
              >
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />

                <p className="mb-2 font-semibold text-[#1C1C1C]">
                  Email envoyé !
                </p>

                <p className="text-sm leading-relaxed text-[#666]">
                  Si un compte existe pour{" "}
                  <strong className="text-[#1C1C1C]">{email}</strong>, vous
                  recevrez un lien sous peu. Vérifiez aussi vos spams.
                </p>

                <Link
                  href="/auth?mode=login"
                  className="mt-6 inline-block text-sm font-medium text-[#8E7AB5] hover:underline"
                >
                  ← Retour à la connexion
                </Link>
              </motion.div>
            )}

            {/* Mot de passe changé */}
            {success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="py-4 text-center"
              >
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />

                <p className="mb-2 font-semibold text-[#1C1C1C]">
                  Mot de passe mis à jour !
                </p>

                <p className="text-sm text-[#666]">
                  Redirection vers la connexion…
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Formulaire demande de reset */}
          {!sent && !hasToken && !success && (
            <form onSubmit={handleRequestReset} className="space-y-5">
              {error && <ErrorBox message={error} />}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#666]">
                  Adresse email
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />

                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    placeholder="vous@email.com"
                    className="w-full rounded-xl border border-[#e8e0ff] px-4 py-3 pl-10 text-sm text-[#1C1C1C] transition focus:outline-none focus:ring-2 focus:ring-[#8E7AB5]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Envoi en cours…" : "Envoyer le lien"}
              </button>

              <p className="text-center text-sm text-[#666]">
                <Link
                  href="/auth?mode=login"
                  className="font-medium text-[#8E7AB5] hover:underline"
                >
                  ← Retour à la connexion
                </Link>
              </p>
            </form>
          )}

          {/* Formulaire nouveau mot de passe */}
          {hasToken && !success && (
            <form onSubmit={handleNewPassword} className="space-y-5">
              {error && <ErrorBox message={error} />}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#666]">
                  Nouveau mot de passe
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                    className="w-full rounded-xl border border-[#e8e0ff] px-4 py-3 pl-10 pr-12 text-sm text-[#1C1C1C] transition focus:outline-none focus:ring-2 focus:ring-[#8E7AB5]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#999] transition hover:bg-[#f4efff] hover:text-[#5B4B8A]"
                    aria-label={
                      showPassword
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-[#666]">
                  Confirmer le mot de passe
                </label>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />

                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Répétez votre mot de passe"
                    className="w-full rounded-xl border border-[#e8e0ff] px-4 py-3 pl-10 text-sm text-[#1C1C1C] transition focus:outline-none focus:ring-2 focus:ring-[#8E7AB5]"
                  />
                </div>
              </div>

              {/* Indicateurs simples */}
              <div className="space-y-1 rounded-xl bg-[#faf9ff] p-3 text-xs text-[#666]">
                <PasswordCheck
                  ok={passwordChecks.minLength}
                  label="Au moins 8 caractères"
                />
                <PasswordCheck
                  ok={passwordChecks.hasLetter}
                  label="Au moins une lettre"
                />
                <PasswordCheck
                  ok={passwordChecks.hasNumber}
                  label="Au moins un chiffre"
                />
                <PasswordCheck
                  ok={passwordChecks.same}
                  label="Les deux mots de passe correspondent"
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmitNewPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Mise à jour…" : "Changer mon mot de passe"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function PasswordCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={ok ? "text-green-600" : "text-[#999]"}>
      {ok ? "✓" : "•"} {label}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9ff]">
          <Loader2 className="h-8 w-8 animate-spin text-[#8E7AB5]" />
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}