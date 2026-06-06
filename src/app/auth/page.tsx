/* src/app/auth/page.tsx */

"use client";

/**
 * Page d'authentification SferaLuna.
 *
 * Version optimisée mobile :
 * - formulaire plus compact ;
 * - flèche retour corrigée pour ne plus toucher la carte ;
 * - accordéons pour les blocs secondaires ;
 * - padding mobile réduit ;
 * - inputs et boutons moins hauts sur téléphone ;
 * - meilleur confort sur iPhone/Safari mobile.
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Sparkles,
  Star,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Crown,
  Shield,
  Smartphone,
  Gift,
  Users,
  Heart,
  Moon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type LunaSessionUser = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  pseudonyme?: string;
  hasCompletedProfile?: boolean;
  plan?: "free" | "essential-monthly" | "premium-monthly" | "elite-monthly";
  isPremium?: boolean;
  subscriptionStatus?:
    | "inactive"
    | "active"
    | "trialing"
    | "past_due"
    | "canceled";
};

/**
 * Fond étoilé léger.
 */
const starsStyles = `
.stars {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.stars::before,
.stars::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(1px 1px at 50px 160px, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.6), transparent);
  background-repeat: repeat;
  background-size: 200px 200px;
}

.stars::after {
  background-image:
    radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 160px 120px, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 200px 60px, rgba(255, 255, 255, 0.7), transparent),
    radial-gradient(1px 1px at 240px 90px, rgba(255, 255, 255, 0.6), transparent);
  background-size: 300px 300px;
  animation: twinkle 8s ease-in-out infinite alternate;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0.8;
  }

  50% {
    opacity: 0.4;
  }
}
`;

function PremiumAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const mode = searchParams.get("mode");

  // Erreurs OAuth renvoyées par NextAuth dans l'URL (?error=...)
  const oauthError = searchParams.get("error");
  const oauthErrorMessages: Record<string, string> = {
    OAuthSignin: "Erreur lors de l'initiation de la connexion OAuth.",
    OAuthCallback: "Erreur lors du retour OAuth. Vérifiez la configuration du provider.",
    OAuthCreateAccount: "Impossible de créer le compte via ce provider.",
    EmailCreateAccount: "Impossible de créer le compte avec cet email.",
    Callback: "Erreur de callback OAuth.",
    OAuthAccountNotLinked: "Cet email est déjà associé à une autre méthode de connexion.",
    SessionRequired: "Vous devez être connectée pour accéder à cette page.",
    Default: "Une erreur est survenue lors de la connexion.",
  };
  const oauthErrorMessage = oauthError
    ? (oauthErrorMessages[oauthError] ?? oauthErrorMessages.Default)
    : null;

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [showFeatures, setShowFeatures] = useState(false);

  /**
   * Accordéons mobile.
   * Fermés par défaut pour garder la page courte.
   */
  const [openMobileFeatures, setOpenMobileFeatures] = useState(false);
  const [openMobileStats, setOpenMobileStats] = useState(false);
  const [openSocialLogin, setOpenSocialLogin] = useState(false);

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.08,
          delayChildren: 0.15,
        },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { y: 16, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    }),
    []
  );

  /**
   * Injection du CSS étoilé côté client.
   */
  useEffect(() => {
    const styleId = "sferaluna-auth-stars-style";

    if (document.getElementById(styleId)) return;

    const styleSheet = document.createElement("style");
    styleSheet.id = styleId;
    styleSheet.textContent = starsStyles;
    document.head.appendChild(styleSheet);

    return () => {
      const existingStyle = document.getElementById(styleId);
      existingStyle?.remove();
    };
  }, []);

  /**
   * Synchronisation URL -> onglet actif.
   */
  useEffect(() => {
    if (mode === "register") {
      setIsLogin(false);
      return;
    }

    if (mode === "login") {
      setIsLogin(true);
    }
  }, [mode]);

  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 700);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Redirection si déjà connecté.
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    const currentUser = session?.user as LunaSessionUser | undefined;

    if (currentUser?.hasCompletedProfile === true) {
      router.replace("/mon-compte");
      return;
    }

    if (currentUser?.hasCompletedProfile === false) {
      router.replace("/inscription");
    }
  }, [status, session, router]);

  const redirectAfterLogin = async () => {
    const sessionRes = await fetch("/api/auth/session", {
      cache: "no-store",
    });

    const freshSession = await sessionRes.json();
    const currentUser = freshSession?.user as LunaSessionUser | undefined;

    if (currentUser?.hasCompletedProfile === true) {
      router.push("/mon-compte");
      return;
    }

    router.push("/inscription");
  };

  const checkPasswordStrength = (password: string) => {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
  };

  const validateForm = (formData: FormData, loginMode: boolean) => {
    const newErrors: Record<string, string> = {};

    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");
    const name = String(formData.get("name") || "").trim();

    if (!loginMode && name.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Adresse email invalide";
    }

    if (!password || password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }

    if (!loginMode && password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    if (!validateForm(formData, true)) {
      setIsLoading(false);
      return;
    }

    const email = String(formData.get("email") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result?.ok) {
        setErrors({
          form: "Email ou mot de passe incorrect",
        });
        return;
      }

      setTimeout(async () => {
        await redirectAfterLogin();
      }, 400);
    } catch (error) {
      console.error("Erreur login :", error);
      setErrors({
        form: "Une erreur est survenue lors de la connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    if (!validateForm(formData, false)) {
      setIsLoading(false);
      return;
    }

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").toLowerCase().trim();
    const password = String(formData.get("password") || "");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrors({
          form: data?.error || "Erreur lors de l'inscription",
        });
        return;
      }

      setSuccess("Compte créé avec succès ! Connexion en cours...");

      const loginResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!loginResult?.ok) {
        setErrors({
          form: "Compte créé, mais connexion automatique impossible. Connectez-vous manuellement.",
        });
        return;
      }

      setTimeout(() => {
        router.push("/inscription");
      }, 600);
    } catch (error) {
      console.error("Erreur inscription :", error);
      setErrors({
        form: "Erreur de connexion au serveur",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (
    provider: "google" | "facebook" | "apple"
  ) => {
    if (isLoading) return;

    setIsLoading(true);
    setErrors({});
    setSuccess("");

    try {
      await signIn(provider, {
        callbackUrl: "/auth",
        redirect: true,
      });
    } catch (error) {
      console.error(`Erreur connexion ${provider} :`, error);
      setErrors({
        form: `Erreur lors de la connexion avec ${provider}`,
      });
      setIsLoading(false);
    }
  };

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setErrors({});
    setSuccess("");
    setOpenSocialLogin(false);

    const nextMode = loginMode ? "login" : "register";

    router.replace(`/auth?mode=${nextMode}`, {
      scroll: false,
    });
  };

  const premiumFeatures = [
    {
      icon: <Crown className="h-4 w-4 sm:h-5 sm:w-5" />,
      text: "Profils vérifiés",
    },
    {
      icon: <Shield className="h-4 w-4 sm:h-5 sm:w-5" />,
      text: "Sécurité maximale",
    },
    {
      icon: <Smartphone className="h-4 w-4 sm:h-5 sm:w-5" />,
      text: "App mobile exclusive",
    },
    {
      icon: <Gift className="h-4 w-4 sm:h-5 sm:w-5" />,
      text: "Cadeaux premium",
    },
    {
      icon: <Users className="h-4 w-4 sm:h-5 sm:w-5" />,
      text: "Événements VIP",
    },
    {
      icon: <Heart className="h-4 w-4 sm:h-5 sm:w-5" />,
      text: "Matchs compatibles",
    },
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] font-sans text-white">
      {/* Décor de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute top-1/3 left-1/3 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl sm:h-64 sm:w-64" />
      </div>

      <div className="stars" />

      {/* 
        Bouton retour corrigé :
        - plus haut ;
        - plus petit sur mobile ;
        - ne touche plus la carte.
      */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed left-4 top-4 z-40 sm:left-6 sm:top-6"
      >
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-gray-200 shadow-lg shadow-black/20 backdrop-blur-xl transition-all hover:bg-white/15 hover:text-white sm:h-auto sm:w-auto sm:gap-2 sm:px-3 sm:py-2"
        >
          <ArrowLeft className="h-5 w-5 sm:h-5 sm:w-5" />

          <span className="hidden text-sm font-medium sm:inline">
            Retour
          </span>
        </Link>
      </motion.div>

      {/* 
        Contenu principal :
        - padding top augmenté pour éviter le conflit avec la flèche ;
        - gap réduit ;
        - meilleur rendu sur petit écran.
      */}
      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-start px-4 pb-10 pt-20 sm:px-6 sm:pb-16 sm:pt-24 lg:items-center lg:px-8 lg:py-20">
        <div className="grid w-full grid-cols-1 items-start gap-5 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Colonne gauche : branding + arguments */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="order-2 px-0 text-white lg:order-1 lg:px-4"
          >
            <div className="mb-4 sm:mb-8">
              <div className="mb-3 flex items-center justify-center gap-2.5 lg:justify-start">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-lg" />
                  <Moon className="relative h-7 w-7 text-white sm:h-12 sm:w-12" />
                </div>

                <h1 className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-2xl font-bold text-transparent sm:text-4xl md:text-5xl">
                  SferaLuna
                </h1>
              </div>

              <h2 className="text-center text-lg font-bold leading-tight sm:text-3xl md:text-4xl lg:text-left">
                Rencontrez l'amour sous un{" "}
                <span className="text-purple-300">nouvel angle</span>
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-center text-xs leading-relaxed text-gray-300 sm:text-base md:text-lg lg:mx-0 lg:text-left">
                Une expérience élégante, sûre et authentique pour créer des
                rencontres plus profondes.
              </p>
            </div>

            {/* Desktop : fonctionnalités visibles */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={showFeatures ? "visible" : "hidden"}
              className="mb-6 hidden grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid"
            >
              {premiumFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm transition-all hover:border-purple-500/30"
                >
                  <div className="text-purple-400">{feature.icon}</div>
                  <span className="text-sm font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Mobile : fonctionnalités en accordéon */}
            <div className="mb-3 lg:hidden">
              <button
                type="button"
                onClick={() => setOpenMobileFeatures(!openMobileFeatures)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left backdrop-blur-sm transition-all hover:bg-white/10"
                aria-expanded={openMobileFeatures}
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Pourquoi SferaLuna ?
                  </p>
                  <p className="text-xs text-gray-400">
                    Profils vérifiés, sécurité, matchs compatibles...
                  </p>
                </div>

                {openMobileFeatures ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-purple-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-purple-300" />
                )}
              </button>

              <AnimatePresence>
                {openMobileFeatures && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      {premiumFeatures.map((feature, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
                        >
                          <div className="text-purple-400">{feature.icon}</div>
                          <span className="text-sm font-medium">
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop : statistiques visibles */}
            <div className="hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/40 to-pink-900/40 p-4 backdrop-blur-sm sm:p-6 lg:block">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold sm:text-3xl">—</div>
                  <div className="text-xs text-gray-300 sm:text-sm">
                    Rencontres
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold sm:text-3xl">—</div>
                  <div className="text-xs text-gray-300 sm:text-sm">
                    Satisfaction
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-bold sm:text-3xl">24h</div>
                  <div className="text-xs text-gray-300 sm:text-sm">
                    Support
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                {[...Array(5)].map((_, index) => (
                  <Star
                    key={index}
                    className="h-4 w-4 fill-current text-yellow-400"
                  />
                ))}

                <span className="text-xs text-gray-300 sm:text-sm">
                  Bientôt sur l'App Store
                </span>
              </div>
            </div>

            {/* Mobile : statistiques en accordéon */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setOpenMobileStats(!openMobileStats)}
                className="flex w-full items-center justify-between rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-pink-900/30 px-4 py-3 text-left backdrop-blur-sm transition-all hover:from-purple-900/40 hover:to-pink-900/40"
                aria-expanded={openMobileStats}
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    Chiffres et avantages
                  </p>
                  <p className="text-xs text-gray-400">
                    Support, satisfaction et expérience premium
                  </p>
                </div>

                {openMobileStats ? (
                  <ChevronUp className="h-5 w-5 shrink-0 text-purple-300" />
                ) : (
                  <ChevronDown className="h-5 w-5 shrink-0 text-purple-300" />
                )}
              </button>

              <AnimatePresence>
                {openMobileStats && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-4 backdrop-blur-sm">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <div className="text-xl font-bold">—</div>
                          <div className="text-[11px] text-gray-300">
                            Rencontres
                          </div>
                        </div>

                        <div>
                          <div className="text-xl font-bold">—</div>
                          <div className="text-[11px] text-gray-300">
                            Satisfaction
                          </div>
                        </div>

                        <div>
                          <div className="text-xl font-bold">24h</div>
                          <div className="text-[11px] text-gray-300">
                            Support
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {[...Array(5)].map((_, index) => (
                          <Star
                            key={index}
                            className="h-3.5 w-3.5 fill-current text-yellow-400"
                          />
                        ))}

                        <span className="text-xs text-gray-300">
                          Bientôt sur l'App Store
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Colonne droite : formulaire */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55 }}
            className="order-1 flex justify-center lg:order-2"
          >
            <div className="relative w-full max-w-[360px] sm:max-w-md">
              <div className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-gray-900/90 to-gray-800/90 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
                {/* Haut du formulaire */}
                <div className="border-b border-white/10 p-3.5 sm:p-6">
                  <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6">
                    <button
                      type="button"
                      onClick={() => switchMode(true)}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all sm:py-3 sm:text-base ${
                        isLogin
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                      Connexion
                    </button>

                    <button
                      type="button"
                      onClick={() => switchMode(false)}
                      className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all sm:py-3 sm:text-base ${
                        !isLogin
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      Inscription
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {isLogin ? (
                      <motion.div
                        key="login-title"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="space-y-1"
                      >
                        <h2 className="text-lg font-bold text-white sm:text-2xl">
                          Bienvenue de retour
                        </h2>

                        <p className="text-xs text-gray-400 sm:text-base">
                          Connectez-vous à votre espace SferaLuna
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="register-title"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="space-y-1"
                      >
                        <h2 className="text-lg font-bold text-white sm:text-2xl">
                          Rejoignez l'aventure
                        </h2>

                        <p className="text-xs text-gray-400 sm:text-base">
                          Créez votre compte en quelques secondes
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-3.5 sm:p-6">
                  <AnimatePresence>
                    {/* Erreur OAuth (ex: redirect_uri_mismatch, app non configurée) */}
                    {oauthErrorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 text-orange-400" />
                          <span className="text-sm text-orange-300">
                            {oauthErrorMessage}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {errors.form && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                          <span className="text-sm text-red-300">
                            {errors.form}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {success && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-3 rounded-xl border border-green-500/30 bg-green-500/10 p-3 sm:p-4"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 shrink-0 text-green-400" />
                          <span className="text-sm text-green-300">
                            {success}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {isLogin ? (
                      <motion.form
                        key="login-form"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        onSubmit={handleLogin}
                        className="space-y-2.5 sm:space-y-4"
                      >
                        <AuthInput
                          label="Adresse email"
                          name="email"
                          type="email"
                          placeholder="votre@email.com"
                          icon={<Mail className="h-5 w-5 text-gray-500" />}
                          error={errors.email}
                        />

                        <PasswordInput
                          label="Mot de passe"
                          name="password"
                          placeholder="Votre mot de passe"
                          showPassword={showPassword}
                          setShowPassword={setShowPassword}
                          error={errors.password}
                        />

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              name="remember"
                              className="h-4 w-4 rounded border border-white/10 bg-white/5 checked:border-purple-500 checked:bg-purple-500 focus:ring-purple-500/20"
                            />
                            <span className="text-xs text-gray-400 sm:text-sm">
                              Se souvenir de moi
                            </span>
                          </label>

                          <Link
                            href="/auth/reset-password"
                            className="text-xs text-purple-400 transition-colors hover:text-purple-300 sm:text-sm"
                          >
                            Mot de passe oublié ?
                          </Link>
                        </div>

                        <SubmitButton
                          isLoading={isLoading}
                          loadingText="Connexion..."
                          text="Se connecter"
                        />
                      </motion.form>
                    ) : (
                      <motion.form
                        key="register-form"
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        onSubmit={handleRegister}
                        className="space-y-2.5 sm:space-y-4"
                      >
                        <AuthInput
                          label="Nom complet"
                          name="name"
                          type="text"
                          placeholder="Votre nom et prénom"
                          icon={<User className="h-5 w-5 text-gray-500" />}
                          error={errors.name}
                        />

                        <AuthInput
                          label="Adresse email"
                          name="email"
                          type="email"
                          placeholder="votre@email.com"
                          icon={<Mail className="h-5 w-5 text-gray-500" />}
                          error={errors.email}
                        />

                        <PasswordInput
                          label="Mot de passe"
                          name="password"
                          placeholder="Minimum 8 caractères"
                          showPassword={showPassword}
                          setShowPassword={setShowPassword}
                          error={errors.password}
                          onChange={(value) => checkPasswordStrength(value)}
                        />

                        {passwordStrength > 0 && (
                          <div>
                            <div className="h-1 overflow-hidden rounded-full bg-gray-700">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  passwordStrength < 50
                                    ? "bg-red-500"
                                    : passwordStrength < 75
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${passwordStrength}%` }}
                              />
                            </div>

                            <p className="mt-1 text-xs text-gray-400">
                              {passwordStrength < 50
                                ? "Faible"
                                : passwordStrength < 75
                                  ? "Moyen"
                                  : "Fort"}
                            </p>
                          </div>
                        )}

                        <PasswordInput
                          label="Confirmer le mot de passe"
                          name="confirmPassword"
                          placeholder="Retapez votre mot de passe"
                          showPassword={showConfirmPassword}
                          setShowPassword={setShowConfirmPassword}
                          error={errors.confirmPassword}
                        />

                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            name="terms"
                            required
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/10 bg-white/5 checked:border-purple-500 checked:bg-purple-500 focus:ring-purple-500/20 sm:h-5 sm:w-5"
                          />

                          <span className="text-xs leading-relaxed text-gray-400 sm:text-sm">
                            J'accepte les{" "}
                            <Link
                              href="/conditions"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              conditions d'utilisation
                            </Link>{" "}
                            et la{" "}
                            <Link
                              href="/confidentialite"
                              className="text-purple-400 hover:text-purple-300"
                            >
                              politique de confidentialité
                            </Link>
                          </span>
                        </label>

                        <SubmitButton
                          isLoading={isLoading}
                          loadingText="Création..."
                          text="Créer mon compte"
                        />
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Connexions sociales en accordéon */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setOpenSocialLogin(!openSocialLogin)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left transition-all hover:bg-white/10 sm:px-4 sm:py-3"
                      aria-expanded={openSocialLogin}
                    >
                      <div>
                        <p className="text-xs font-medium text-white sm:text-sm">
                          Autres méthodes de connexion
                        </p>
                        <p className="text-[11px] text-gray-400 sm:text-xs">
                          Google, Facebook ou Apple
                        </p>
                      </div>

                      {openSocialLogin ? (
                        <ChevronUp className="h-5 w-5 shrink-0 text-purple-300" />
                      ) : (
                        <ChevronDown className="h-5 w-5 shrink-0 text-purple-300" />
                      )}
                    </button>

                    <AnimatePresence>
                      {openSocialLogin && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4">
                            <div className="relative mb-4">
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                              </div>

                              <div className="relative flex justify-center text-sm">
                                <span className="bg-gray-900 px-3 text-gray-500">
                                  Ou continuer avec
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <SocialButton
                                label="Google"
                                imageSrc="/google-icon.svg"
                                onClick={() => handleSocialLogin("google")}
                                disabled={isLoading}
                              />

                              <button
                                type="button"
                                onClick={() => handleSocialLogin("facebook")}
                                disabled={isLoading}
                                className="group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
                              >
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600">
                                  <span className="text-xs font-bold text-white">
                                    f
                                  </span>
                                </div>

                                <span className="text-sm font-medium">
                                  Facebook
                                </span>
                              </button>
                            </div>

                            <SocialButton
                              label="Continuer avec Apple"
                              imageSrc="/Apple-icon.svg"
                              onClick={() => handleSocialLogin("apple")}
                              disabled={isLoading}
                              fullWidth
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Footer du formulaire */}
                <div className="border-t border-white/10 p-3.5 pt-3 sm:p-6 sm:pt-4">
                  <p className="text-center text-xs text-gray-400 sm:text-sm">
                    {isLogin ? (
                      <>
                        Pas encore de compte ?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode(false)}
                          className="font-medium text-purple-400 transition-colors hover:text-purple-300"
                        >
                          S'inscrire maintenant
                        </button>
                      </>
                    ) : (
                      <>
                        Vous avez déjà un compte ?{" "}
                        <button
                          type="button"
                          onClick={() => switchMode(true)}
                          className="font-medium text-purple-400 transition-colors hover:text-purple-300"
                        >
                          Se connecter
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* 
                Badge sécurité :
                - caché sur très petit mobile pour éviter de gêner ;
                - visible à partir de sm.
              */}
              <div className="pointer-events-none absolute -bottom-6 left-1/2 hidden w-max -translate-x-1/2 sm:block">
                <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-4 py-2 backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-green-300 sm:text-sm">
                    Sécurité SSL 256-bit
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

/**
 * Export principal.
 *
 * Suspense est utile avec useSearchParams dans l'App Router.
 */
export default function PremiumAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#1a0b2e] text-white">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Chargement...</span>
          </div>
        </main>
      }
    >
      <PremiumAuthContent />
    </Suspense>
  );
}

/**
 * Input classique réutilisable.
 *
 * Version mobile compacte :
 * - label plus petit ;
 * - padding vertical réduit ;
 * - meilleure hauteur sur mobile.
 */
function AuthInput({
  label,
  name,
  type,
  placeholder,
  icon,
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400 sm:mb-2 sm:text-sm">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>

        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 sm:py-3 sm:pl-12 sm:text-base"
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-400 sm:text-sm">{error}</p>}
    </div>
  );
}

/**
 * Input mot de passe réutilisable.
 *
 * Version mobile compacte :
 * - hauteur réduite ;
 * - texte plus petit ;
 * - icône alignée proprement.
 */
function PasswordInput({
  label,
  name,
  placeholder,
  showPassword,
  setShowPassword,
  error,
  onChange,
}: {
  label: string;
  name: string;
  placeholder: string;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  error?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-400 sm:mb-2 sm:text-sm">
        {label}
      </label>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-500 sm:h-5 sm:w-5" />

        <input
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          required
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-11 pr-11 text-sm text-white outline-none transition-all placeholder:text-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 sm:py-3 sm:pl-12 sm:pr-12 sm:text-base"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
          aria-label={
            showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {showPassword ? (
            <EyeOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          ) : (
            <Eye className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          )}
        </button>
      </div>

      {error && <p className="mt-1 text-xs text-red-400 sm:text-sm">{error}</p>}
    </div>
  );
}

/**
 * Bouton principal compact.
 */
function SubmitButton({
  isLoading,
  loadingText,
  text,
}: {
  isLoading: boolean;
  loadingText: string;
  text: string;
}) {
  return (
    <motion.button
      type="submit"
      disabled={isLoading}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 sm:text-base"
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-5 sm:w-5" />
          {loadingText}
        </div>
      ) : (
        text
      )}
    </motion.button>
  );
}

/**
 * Bouton de connexion sociale.
 *
 * Les fichiers doivent exister dans /public :
 * - public/google-icon.svg
 * - public/Apple-icon.svg
 */
function SocialButton({
  label,
  imageSrc,
  onClick,
  disabled,
  fullWidth = false,
}: {
  label: string;
  imageSrc: string;
  onClick: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm transition-all hover:border-white/20 hover:bg-white/10 disabled:opacity-50 sm:p-3 ${
        fullWidth ? "mt-3 w-full" : ""
      }`}
    >
      <Image
        src={imageSrc}
        alt={label}
        width={20}
        height={20}
        className="transition-transform group-hover:scale-110"
      />

      <span className="font-medium">{label}</span>
    </button>
  );
}
