/* src/app/auth/page.tsx */

"use client";

/**
 * Connexion & Inscription SferaLuna.
 *
 * - Connexion : directe (identifiant, mot de passe, Google / Apple).
 * - Inscription : guidée — étape 1 « Vous » ici, puis « Vos préférences »
 *   et « Votre profil » dans /inscription (onboarding existant).
 * - Colonne gauche : scène lunaire, 3 bénéfices, témoignage RÉEL
 *   (affiché uniquement si un témoignage approuvé existe).
 *
 * La logique d'authentification (NextAuth credentials + OAuth, redirections
 * selon hasCompletedProfile / identityVerified) est inchangée.
 */

import { Suspense, useEffect, useState, type ElementType, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  AtSign,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Heart,
  Info,
  Loader2,
  Lock,
  Mail,
  Moon,
  Quote,
  ShieldCheck,
  Sparkles,
  User,
  UsersRound,
} from "lucide-react";

import { MoonHorizon } from "@/components/site/art";
import { cn } from "@/components/site/ui";

type LunaSessionUser = {
  id?: string;
  role?: string;
  hasCompletedProfile?: boolean;
  identityVerified?: boolean;
};

type Testimonial = {
  _id: string;
  authorName: string;
  age?: number;
  city?: string;
  content: string;
  rating: number;
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

// ─────────────────────────────────────────────
// Champs
// ─────────────────────────────────────────────

const INPUT =
  "h-[52px] w-full rounded-2xl border bg-white/[0.04] pl-12 pr-4 text-[15px] text-white placeholder:text-white/40 outline-none transition focus:bg-white/[0.07] focus:ring-4";

function Field({
  label,
  name,
  type = "text",
  placeholder,
  icon: Icon,
  error,
  hint,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  icon: ElementType;
  error?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-white/85">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className={cn(
            INPUT,
            error
              ? "border-rose-400/60 focus:border-rose-400/70 focus:ring-rose-500/15"
              : "border-violet-300/20 focus:border-fuchsia-400/60 focus:ring-fuchsia-500/15"
          )}
        />
      </div>
      {hint && !error && <p className="mt-1.5 text-xs text-white/45">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-rose-300 sm:text-sm">{error}</p>}
    </div>
  );
}

function PasswordField({
  label,
  name,
  placeholder,
  autoComplete,
  error,
  onChange,
  aside,
}: {
  label: string;
  name: string;
  placeholder: string;
  autoComplete: string;
  error?: string;
  onChange?: (value: string) => void;
  aside?: ReactNode;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={name} className="text-sm font-medium text-white/85">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45" />
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          onChange={(e) => onChange?.(e.target.value)}
          className={cn(
            INPUT,
            "pr-12",
            error
              ? "border-rose-400/60 focus:border-rose-400/70 focus:ring-rose-500/15"
              : "border-violet-300/20 focus:border-fuchsia-400/60 focus:ring-fuchsia-500/15"
          )}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white"
          aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-300 sm:text-sm">{error}</p>}
    </div>
  );
}

function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 text-base font-semibold text-white shadow-[0_14px_40px_-12px_rgba(217,70,239,0.8)] ring-1 ring-fuchsia-300/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
      <span>{children}</span>
      {!loading && (
        <ArrowRight className="absolute right-5 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      )}
    </button>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 text-xs text-white/45">
      <span className="h-px flex-1 bg-white/10" />
      ou
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function SocialButtons({
  onSelect,
  disabled,
}: {
  onSelect: (provider: "google" | "apple") => void;
  disabled: boolean;
}) {
  const btn =
    "flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-violet-300/20 bg-white/[0.05] text-[15px] font-medium text-white transition hover:border-violet-300/40 hover:bg-white/[0.09] disabled:opacity-60";

  return (
    <div className="grid gap-3">
      <button type="button" disabled={disabled} onClick={() => onSelect("google")} className={btn}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/google-icon.svg" alt="Google" className="h-5 w-5" />
        Continuer avec Google
      </button>
      <button type="button" disabled={disabled} onClick={() => onSelect("apple")} className={btn}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/Apple-icon.svg" alt="Continuer avec Apple" className="h-5 w-5 invert" />
        Continuer avec Apple
      </button>
    </div>
  );
}

function SecureBadge({ label }: { label: string }) {
  return (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/[0.08] px-3.5 py-1.5 text-xs text-emerald-200/90">
        <ShieldCheck className="h-3.5 w-3.5" />
        {label}
        <span className="h-3 w-px bg-white/15" />
        <span className="flex items-center gap-1 text-white/55">
          <Lock className="h-3 w-3" /> HTTPS
        </span>
      </span>
    </div>
  );
}

function Stepper() {
  const steps = ["Vous", "Vos préférences", "Votre profil"];
  return (
    <div className="mb-6">
      <ol className="flex items-center">
        {steps.map((step, i) => (
          <li key={step} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                  i === 0
                    ? "bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-[0_0_16px_-2px_rgba(236,72,153,0.8)]"
                    : "border border-violet-300/30 text-white/60"
                )}
              >
                {i + 1}
              </span>
              <span className={cn("whitespace-nowrap text-[11px]", i === 0 ? "font-semibold text-white" : "text-white/50")}>
                {step}
              </span>
            </div>
            {i < steps.length - 1 && (
              <span className="mx-2 mb-5 h-px flex-1 bg-gradient-to-r from-violet-300/40 to-violet-300/10" />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

// ─────────────────────────────────────────────
// Colonne "histoire"
// ─────────────────────────────────────────────

function Story({ isLogin, testimonial }: { isLogin: boolean; testimonial: Testimonial | null }) {
  const benefits = [
    { icon: BadgeCheck, title: "Profils vérifiés", text: "Chaque membre confirme son identité." },
    {
      icon: Heart,
      title: isLogin ? "Une communauté bienveillante" : "Des rencontres sincères",
      text: isLogin ? "Des femmes sincères, qui partagent vos valeurs." : "Des personnes qui cherchent la même chose que vous.",
    },
    {
      icon: UsersRound,
      title: isLogin ? "Des rencontres authentiques" : "Un espace qui vous ressemble",
      text: isLogin ? "Plus que des matchs, de vraies connexions." : "Vous choisissez qui vous voit, à votre rythme.",
    },
  ];

  return (
    <div className="max-w-xl">
      <p className="hidden items-center gap-3 text-4xl font-bold tracking-tight sm:text-5xl lg:flex">
        <Moon className="h-10 w-10 fill-transparent text-white sm:h-12 sm:w-12" strokeWidth={2.2} />
        <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
          SferaLuna
        </span>
      </p>

      <h1 className="text-4xl lg:mt-6 font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[56px]">
        {isLogin ? (
          <>
            Rencontrez l’amour{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              sous un nouvel angle
            </span>
          </>
        ) : (
          <>
            Commencez une{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
              belle histoire
            </span>
          </>
        )}
      </h1>

      <p className="mt-5 text-base leading-relaxed text-white/75 sm:text-lg">
        {isLogin
          ? "Une expérience élégante, sûre et authentique, pour des rencontres entre femmes plus profondes et des connexions qui comptent vraiment."
          : "Rejoignez une communauté bienveillante de femmes qui aiment les femmes, pour des rencontres authentiques et des connexions qui comptent vraiment."}
      </p>

      <ul className="mt-8 space-y-5">
        {benefits.map((b) => (
          <li key={b.title} className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/25 bg-fuchsia-500/15 shadow-[0_0_24px_-6px_rgba(217,70,239,0.6)]">
              <b.icon className="h-6 w-6 text-fuchsia-100" />
            </span>
            <span>
              <span className="block text-base font-semibold text-white">{b.title}</span>
              <span className="block text-sm text-white/65">{b.text}</span>
            </span>
          </li>
        ))}
      </ul>

      {testimonial && (
        <figure className="mt-8 flex gap-4 rounded-3xl border border-violet-300/20 bg-[#1b0d38]/70 p-5 backdrop-blur-xl">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-lg font-semibold">
            {testimonial.authorName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-amber-300">{"★".repeat(Math.max(1, Math.min(5, testimonial.rating || 5)))}</p>
            <blockquote className="mt-1 text-sm leading-relaxed text-white/90">“{testimonial.content}”</blockquote>
            <figcaption className="mt-2 text-xs text-white/55">
              {testimonial.authorName}
              {testimonial.age ? `, ${testimonial.age} ans` : ""}
              {testimonial.city ? ` · ${testimonial.city}` : ""}
            </figcaption>
          </div>
          <Quote className="hidden h-6 w-6 shrink-0 text-white/30 sm:block" />
        </figure>
      )}
    </div>
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
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);

  // URL → onglet
  useEffect(() => {
    if (mode === "register") setIsLogin(false);
    if (mode === "login") setIsLogin(true);
  }, [mode]);

  // Témoignage réel (aucun affichage s'il n'y en a pas)
  useEffect(() => {
    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => data?.success && data.testimonials?.length && setTestimonial(data.testimonials[0]))
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

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
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
      // Aligné sur /api/auth/register (8 caractères minimum)
      if (password.length < 8) next.password = "Le mot de passe doit contenir au moins 8 caractères";
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

      setSuccess("Votre espace est créé ! Direction vos préférences…");

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
    setPasswordStrength(0);
    router.replace(`/auth?mode=${loginMode ? "login" : "register"}`, { scroll: false });
  };

  const strengthLabel = ["Trop court", "Faible", "Correct", "Bon", "Excellent"][passwordStrength / 25];

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#12081f] text-white">
      <MoonHorizon fixed />
      {/* Voile à gauche : garde le texte lisible au-dessus de la scène */}
      <div className="pointer-events-none fixed inset-y-0 left-0 -z-10 hidden w-[55%] bg-gradient-to-r from-[#12081f]/80 via-[#12081f]/40 to-transparent lg:block" />

      {/* Header minimal */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SferaLuna — accueil">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-sferaluna.png" alt="" className="h-9 w-9 rounded-full object-cover shadow-[0_0_18px_rgba(217,70,239,0.5)]" />
          <span className="text-lg font-semibold lg:hidden">SferaLuna</span>
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-300/25 bg-[#1b0d38]/60 px-4 text-sm text-white/85 backdrop-blur-xl transition hover:border-fuchsia-300/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l’accueil
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 sm:px-6 lg:min-h-[calc(100vh-96px)] lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-16 lg:px-8">
        {/* Histoire (sous le formulaire sur mobile) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="order-2 lg:order-1"
        >
          <Story isLogin={isLogin} testimonial={testimonial} />
        </motion.div>

        {/* Carte formulaire */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="order-1 w-full rounded-[28px] border border-fuchsia-300/30 bg-[#1a0b35]/80 p-5 shadow-[0_30px_100px_-30px_rgba(192,38,211,0.6)] ring-1 ring-white/5 backdrop-blur-2xl sm:p-8 lg:order-2"
          aria-label={isLogin ? "Connexion" : "Inscription"}
        >
          {/* Onglets */}
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-violet-300/15 bg-white/[0.03] p-1.5" role="tablist">
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
                    "relative flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-medium transition",
                    active ? "text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="auth-tab"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-500 shadow-[0_8px_24px_-8px_rgba(217,70,239,0.9)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <tab.icon className="relative h-4 w-4" />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-7">
            {!isLogin && <Stepper />}

            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-head" : "register-head"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {!isLogin && <p className="mb-1 text-sm font-semibold text-pink-300">Étape 1 sur 3</p>}
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                  {isLogin ? "Heureuse de vous revoir" : "Créez votre espace SferaLuna"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65 sm:text-[15px]">
                  {isLogin
                    ? "Reconnectez-vous à votre univers SferaLuna et retrouvez vos rencontres."
                    : "Quelques informations pour démarrer. Vos préférences et votre profil viendront juste après."}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Messages */}
            {oauthErrorMessage && (
              <p className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {oauthErrorMessage}
              </p>
            )}
            {errors.form && (
              <p role="alert" className="mt-5 flex items-start gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {errors.form}
              </p>
            )}
            {success && (
              <p className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
              </p>
            )}

            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleLogin}
                  noValidate
                  className="mt-6 space-y-5"
                >
                  <Field
                    label="Email ou pseudonyme"
                    name="email"
                    placeholder="votre@email.com ou votre pseudo"
                    icon={AtSign}
                    autoComplete="username"
                    error={errors.email}
                  />
                  <PasswordField
                    label="Mot de passe"
                    name="password"
                    placeholder="Votre mot de passe"
                    autoComplete="current-password"
                    error={errors.password}
                    aside={
                      <Link href="/auth/reset-password" className="text-sm text-pink-300 transition hover:text-pink-200">
                        Mot de passe oublié ?
                      </Link>
                    }
                  />

                  <div className="pt-1">
                    <SubmitButton loading={isLoading}>{isLoading ? "Connexion…" : "Se connecter"}</SubmitButton>
                  </div>

                  <Divider />
                  <SocialButtons onSelect={handleSocial} disabled={isLoading} />
                  <SecureBadge label="Connexion sécurisée" />

                  <p className="border-t border-white/10 pt-5 text-center text-sm text-white/65">
                    Pas encore de compte ?{" "}
                    <button type="button" onClick={() => switchMode(false)} className="inline-flex items-center gap-1 font-semibold text-pink-300 hover:text-pink-200">
                      S’inscrire maintenant <ArrowRight className="h-4 w-4" />
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleRegister}
                  noValidate
                  className="mt-6 space-y-5"
                >
                  <Field
                    label="Prénom ou nom"
                    name="name"
                    placeholder="Votre prénom"
                    icon={User}
                    autoComplete="given-name"
                    error={errors.name}
                  />
                  <Field
                    label="Pseudo (optionnel)"
                    name="pseudonyme"
                    placeholder="Votre pseudo visible par les autres"
                    icon={AtSign}
                    autoComplete="nickname"
                    hint="Modifiable ensuite depuis votre profil."
                    error={errors.pseudonyme}
                  />
                  <Field
                    label="Adresse email"
                    name="email"
                    type="email"
                    placeholder="votre@email.com"
                    icon={Mail}
                    autoComplete="email"
                    error={errors.email}
                  />
                  <div>
                    <PasswordField
                      label="Mot de passe"
                      name="password"
                      placeholder="Minimum 8 caractères"
                      autoComplete="new-password"
                      error={errors.password}
                      onChange={checkPasswordStrength}
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <div className="grid flex-1 grid-cols-4 gap-1.5">
                        {[25, 50, 75, 100].map((step) => (
                          <span
                            key={step}
                            className={cn(
                              "h-1.5 rounded-full transition-colors",
                              passwordStrength >= step
                                ? passwordStrength >= 75
                                  ? "bg-emerald-400"
                                  : passwordStrength >= 50
                                    ? "bg-amber-300"
                                    : "bg-rose-400"
                                : "bg-white/10"
                            )}
                          />
                        ))}
                      </div>
                      <span className="w-20 text-right text-xs text-white/50">{strengthLabel}</span>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 text-sm text-white/75">
                    <input
                      type="checkbox"
                      name="terms"
                      required
                      className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-violet-300/40 bg-white/5 text-fuchsia-500 focus:ring-fuchsia-500/30 focus:ring-offset-0"
                    />
                    <span>
                      J’accepte les{" "}
                      <Link href="/conditions" target="_blank" className="text-pink-300 underline-offset-2 hover:underline">
                        conditions d’utilisation
                      </Link>{" "}
                      et la{" "}
                      <Link href="/confidentialite" target="_blank" className="text-pink-300 underline-offset-2 hover:underline">
                        politique de confidentialité
                      </Link>
                      .
                    </span>
                  </label>
                  {errors.terms && <p className="-mt-3 text-xs text-rose-300 sm:text-sm">{errors.terms}</p>}

                  <p className="flex items-start gap-3 rounded-2xl border border-violet-300/15 bg-white/[0.03] px-4 py-3 text-xs leading-relaxed text-white/65">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet-200" />
                    <span>
                      <span className="block text-sm text-white/85">Vos préférences et intentions seront définies ensuite.</span>
                      Une vérification d’identité vous sera demandée pour garantir des profils authentiques.
                    </span>
                  </p>

                  <SubmitButton loading={isLoading}>{isLoading ? "Création…" : "Créer mon compte"}</SubmitButton>

                  <Divider />
                  <SocialButtons onSelect={handleSocial} disabled={isLoading} />
                  <SecureBadge label="Inscription sécurisée" />

                  <p className="border-t border-white/10 pt-5 text-center text-sm text-white/65">
                    Vous avez déjà un compte ?{" "}
                    <button type="button" onClick={() => switchMode(true)} className="inline-flex items-center gap-1 font-semibold text-pink-300 hover:text-pink-200">
                      Se connecter <ArrowRight className="h-4 w-4" />
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.section>
      </div>
    </main>
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
