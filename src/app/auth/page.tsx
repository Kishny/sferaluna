/* src/app/auth/page.tsx */

"use client";

/**
 * Connexion & Inscription SferaLuna.
 *
 * - Connexion : identifiant (email ou pseudonyme) + mot de passe, Google / Apple.
 * - Inscription : nom, pseudonyme facultatif, email et mot de passe saisis
 *   deux fois ; la suite du profil se fait dans /inscription.
 * - Les boutons Google / Apple n'apparaissent que si le fournisseur est
 *   configuré côté serveur.
 *
 * La logique d'authentification (NextAuth credentials + OAuth, redirections
 * selon hasCompletedProfile / identityVerified) est inchangée.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProviders, signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { AlertCircle, AtSign, CheckCircle2, Loader2, Mail, Sparkles, User } from "lucide-react";

import { AuthShell, Field, PasswordField, SubmitButton } from "@/components/auth/AuthShell";
import { cn } from "@/components/site/ui";

type LunaSessionUser = {
  id?: string;
  role?: string;
  hasCompletedProfile?: boolean;
  identityVerified?: boolean;
};

const OAUTH_ERRORS: Record<string, string> = {
  OAuthSignin: "Erreur lors de l'initiation de la connexion.",
  OAuthCallback: "Erreur lors du retour de connexion. Réessayez dans un instant.",
  OAuthCreateAccount: "Impossible de créer le compte via ce service.",
  EmailCreateAccount: "Impossible de créer le compte avec cet email.",
  Callback: "Erreur de connexion.",
  OAuthAccountNotLinked: "Cet email est déjà associé à une autre méthode de connexion.",
  SessionRequired: "Vous devez être connectée pour accéder à cette page.",
  Default: "Une erreur est survenue lors de la connexion.",
};

function SocialButtons({
  onSelect,
  disabled,
  providers,
}: {
  onSelect: (provider: "google" | "apple") => void;
  disabled: boolean;
  providers: { google: boolean; apple: boolean };
}) {
  if (!providers.google && !providers.apple) return null;

  const btn =
    "flex h-14 w-full items-center justify-center gap-4 rounded-xl border border-violet-300/20 bg-white/[0.03] text-base font-medium text-white transition hover:border-violet-300/45 hover:bg-white/[0.08] disabled:opacity-60";

  return (
    <>
      <div className="flex items-center gap-4 text-sm text-white/55">
        <span className="h-px flex-1 bg-white/15" />
        ou continuer avec
        <span className="h-px flex-1 bg-white/15" />
      </div>
      <div className={cn("grid gap-4", providers.google && providers.apple && "sm:grid-cols-2")}>
        {providers.google && (
          <button type="button" disabled={disabled} onClick={() => onSelect("google")} className={btn}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/google-icon.svg" alt="" className="h-6 w-6" />
            Continuer avec Google
          </button>
        )}
        {providers.apple && (
          <button type="button" disabled={disabled} onClick={() => onSelect("apple")} className={btn}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Apple-icon.svg" alt="" className="h-6 w-6 invert" />
            Continuer avec Apple
          </button>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const mode = searchParams.get("mode");
  const oauthError = searchParams.get("error");
  const oauthErrorMessage = oauthError ? OAUTH_ERRORS[oauthError] ?? OAUTH_ERRORS.Default : null;

  const [isLogin, setIsLogin] = useState(mode !== "register");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [providers, setProviders] = useState<{ google: boolean; apple: boolean }>({ google: true, apple: true });

  // URL → onglet
  useEffect(() => {
    if (mode === "register") setIsLogin(false);
    if (mode === "login") setIsLogin(true);
  }, [mode]);


  // N'affiche que les connexions réellement configurées (Google / Apple).
  useEffect(() => {
    getProviders()
      .then((list) => list && setProviders({ google: Boolean(list.google), apple: Boolean(list.apple) }))
      .catch(() => {});
  }, []);

  // Déjà connectée → bonne destination
  useEffect(() => {
    if (status !== "authenticated") return;
    const user = session?.user as LunaSessionUser | undefined;
    if (user?.id) router.replace(destinationFor(user));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, router]);

  /** Page demandée avant la connexion (ex : /messages/…), chemin interne uniquement. */
  const callbackUrl = (() => {
    const raw = searchParams.get("callbackUrl") || "";
    return raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/auth") ? raw : null;
  })();

  /** Destination d'une membre connectée selon l'état de son compte. */
  const destinationFor = (user: LunaSessionUser) => {
    const verified = user.identityVerified === true || user.role === "admin";
    if (user.hasCompletedProfile === true && verified) {
      return callbackUrl && callbackUrl !== "/inscription" ? callbackUrl : "/mon-compte";
    }
    return "/inscription";
  };

  const redirectAfterLogin = async () => {
    const res = await fetch("/api/auth/session", { cache: "no-store" });
    const fresh = await res.json().catch(() => null);
    const user = fresh?.user as LunaSessionUser | undefined;

    // Sécurité : sans session réellement ouverte, on n'envoie JAMAIS vers
    // /inscription (qui afficherait un parcours vide à une membre existante).
    if (!user?.id) {
      setSuccess("");
      setErrors({
        form: "La connexion n’a pas pu être finalisée (session non ouverte). Vérifiez que les cookies sont autorisés puis réessayez.",
      });
      return;
    }

    router.push(destinationFor(user));
  };


  const validate = (formData: FormData, loginMode: boolean) => {
    const next: Record<string, string> = {};
    const identifier = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();
    const pseudonyme = String(formData.get("pseudonyme") || "").trim();

    if (loginMode) {
      if (!identifier || identifier.length < 2) {
        next.email = "Saisissez votre email ou votre pseudonyme";
      } else if (identifier.includes("@") && !/^\S+@\S+\.\S+$/.test(identifier)) {
        next.email = "Adresse email invalide";
      }
      if (!password) next.password = "Saisissez votre mot de passe";
    } else {
      if (name.length < 2) next.name = "Le nom doit contenir au moins 2 caractères";
      if (pseudonyme.length > 0) {
        if (pseudonyme.length < 2 || pseudonyme.length > 50) {
          next.pseudonyme = "Le pseudonyme doit contenir entre 2 et 50 caractères";
        } else if (!/^[a-zA-ZÀ-ÿ0-9 _-]+$/.test(pseudonyme)) {
          next.pseudonyme = "Lettres, chiffres, espaces, tirets ou underscores uniquement";
        }
      }
      if (!identifier || !/^\S+@\S+\.\S+$/.test(identifier)) next.email = "Adresse email invalide";
      else if (String(formData.get("emailConfirm") || "").trim().toLowerCase() !== identifier.toLowerCase()) {
        next.emailConfirm = "Les deux adresses email ne correspondent pas";
      }
      // Aligné sur /api/auth/register (8 caractères minimum)
      if (password.length < 8) next.password = "Le mot de passe doit contenir au moins 8 caractères";
      else if (String(formData.get("passwordConfirm") || "") !== password) {
        next.passwordConfirm = "Les deux mots de passe ne correspondent pas";
      }
      if (!formData.get("terms")) next.terms = "Merci d’accepter les conditions pour continuer";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setErrors({});
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    if (!validate(formData, true)) return;

    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: String(formData.get("email") || "").toLowerCase().trim(),
        password: String(formData.get("password") || ""),
      });

      if (!result?.ok) {
        setErrors({ form: "Identifiant ou mot de passe incorrect" });
        return;
      }

      setSuccess("Connexion réussie, à tout de suite…");
      await redirectAfterLogin();
    } catch {
      setErrors({ form: "Une erreur est survenue lors de la connexion" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setErrors({});
    setSuccess("");

    const formData = new FormData(event.currentTarget);
    if (!validate(formData, false)) return;

    const email = String(formData.get("email") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "");

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(formData.get("name") || "").trim(),
          pseudonyme: String(formData.get("pseudonyme") || "").trim(),
          email,
          password,
        }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrors({ form: data?.error || "Erreur lors de l'inscription" });
        return;
      }

      setSuccess("Votre compte est créé ! Direction votre profil…");

      const login = await signIn("credentials", { redirect: false, email, password });
      if (!login?.ok) {
        setErrors({ form: "Compte créé, mais connexion automatique impossible. Connectez-vous manuellement." });
        return;
      }

      router.push("/inscription");
    } catch {
      setErrors({ form: "Erreur de connexion au serveur" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "apple") => {
    if (isLoading) return;
    setIsLoading(true);
    setErrors({});
    try {
      await signIn(provider, {
        callbackUrl: callbackUrl ? `/auth?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/auth",
        redirect: true,
      });
    } catch {
      setErrors({ form: `Erreur lors de la connexion avec ${provider === "google" ? "Google" : "Apple"}` });
      setIsLoading(false);
    }
  };

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setErrors({});
    setSuccess("");
    router.replace(`/auth?mode=${loginMode ? "login" : "register"}`, { scroll: false });
  };

  return (
    <AuthShell label={isLogin ? "Connexion" : "Inscription"}>
      {/* Onglets */}
      <div className="mx-auto grid max-w-[620px] grid-cols-2 rounded-2xl border border-violet-300/20 bg-[#120826]/80 p-1" role="tablist">
        {[
          { login: true, label: "Connexion", icon: User },
          { login: false, label: "Inscription", icon: Sparkles },
        ].map((tab) => {
          const active = isLogin === tab.login;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchMode(tab.login)}
              className={cn(
                "flex h-[56px] items-center justify-center gap-3 rounded-xl text-[17px] font-medium transition",
                active ? "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-[0_8px_28px_-8px_rgba(217,70,239,0.9)]" : "text-white/75 hover:text-white"
              )}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <h1 className="mt-8 text-3xl font-bold tracking-tight text-white">{isLogin ? "Heureuse de vous revoir" : "Créer votre compte"}</h1>
      <p className="mt-2 text-base text-white/70">
        {isLogin ? "Reconnectez-vous à votre univers SferaLuna et retrouvez vos rencontres." : "Rejoignez SferaLuna et vivez une nouvelle façon de faire des rencontres."}
      </p>

      {/* Messages */}
      {oauthErrorMessage && (
        <p className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {oauthErrorMessage}
        </p>
      )}
      {errors.form && (
        <p role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errors.form}
        </p>
      )}
      {success && (
        <p role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
        </p>
      )}

      {isLogin ? (
        <form key="login" onSubmit={handleLogin} noValidate className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-7">
            <Field label="Email ou pseudonyme" name="email" placeholder="votre@email.com ou votre pseudo" icon={AtSign} autoComplete="username" error={errors.email} />
            <PasswordField
              label="Mot de passe"
              name="password"
              placeholder="Votre mot de passe"
              autoComplete="current-password"
              error={errors.password}
              aside={
                <Link href="/auth/reset-password" className="text-sm text-fuchsia-300 transition hover:text-fuchsia-200">
                  Mot de passe oublié ?
                </Link>
              }
            />
          </div>

          <SubmitButton loading={isLoading}>{isLoading ? "Connexion…" : "Se connecter"}</SubmitButton>
          <SocialButtons onSelect={handleSocial} disabled={isLoading} providers={providers} />

          <p className="pt-1 text-center text-[15px] text-white/70">
            Pas encore de compte ?{" "}
            <button type="button" onClick={() => switchMode(false)} className="font-medium text-fuchsia-300 hover:text-fuchsia-200">
              S’inscrire
            </button>
          </p>
        </form>
      ) : (
        <form key="register" onSubmit={handleRegister} noValidate className="mt-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-x-7">
            <Field label="Prénom et nom" name="name" placeholder="Votre nom et prénom" icon={User} autoComplete="name" error={errors.name} />
            <Field label="Pseudonyme (optionnel)" name="pseudonyme" placeholder="Votre pseudonyme" icon={AtSign} autoComplete="nickname" error={errors.pseudonyme} />
            <Field label="Adresse email" name="email" type="email" placeholder="votre@email.com" icon={Mail} autoComplete="email" error={errors.email} />
            <Field label="Confirmer l’email" name="emailConfirm" type="email" placeholder="Confirmez votre email" icon={Mail} autoComplete="off" error={errors.emailConfirm} />
            <PasswordField label="Mot de passe" name="password" placeholder="Minimum 8 caractères" autoComplete="new-password" error={errors.password} />
            <PasswordField label="Confirmer le mot de passe" name="passwordConfirm" placeholder="Retapez votre mot de passe" autoComplete="new-password" error={errors.passwordConfirm} />
          </div>

          <div>
            <label className="flex cursor-pointer items-center gap-3.5 text-[15px] text-white/85">
              <input
                type="checkbox"
                name="terms"
                required
                aria-describedby={errors.terms ? "terms-error" : undefined}
                className="h-6 w-6 shrink-0 cursor-pointer rounded-md border border-violet-300/40 bg-white/[0.06] text-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/40 focus:ring-offset-0"
              />
              <span>
                J’accepte les{" "}
                <Link href="/conditions" target="_blank" className="text-fuchsia-300 underline-offset-2 hover:underline">
                  conditions d’utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/confidentialite" target="_blank" className="text-fuchsia-300 underline-offset-2 hover:underline">
                  politique de confidentialité
                </Link>
              </span>
            </label>
            {errors.terms && (
              <p id="terms-error" className="mt-1.5 text-xs text-rose-300 sm:text-sm">
                {errors.terms}
              </p>
            )}
          </div>

          <SubmitButton loading={isLoading}>{isLoading ? "Création…" : "Créer mon compte"}</SubmitButton>
          <SocialButtons onSelect={handleSocial} disabled={isLoading} providers={providers} />

          <p className="pt-1 text-center text-[15px] text-white/70">
            Vous avez déjà un compte ?{" "}
            <button type="button" onClick={() => switchMode(true)} className="font-medium text-fuchsia-300 hover:text-fuchsia-200">
              Se connecter
            </button>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#12081f]">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
