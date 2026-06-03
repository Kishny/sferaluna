/* src/app/auth/page.tsx */

"use client";

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
} from "lucide-react";

/**
 * Type minimal de l'utilisateur enrichi par NextAuth.
 *
 * Ces champs viennent normalement de :
 * src/app/api/auth/[...nextauth]/route.ts
 *
 * Grâce aux callbacks jwt() et session(), on récupère :
 * - hasCompletedProfile
 * - plan
 * - isPremium
 * - subscriptionStatus
 */
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
 * Styles des étoiles.
 *
 * On les garde dans ce fichier pour que la page soit autonome.
 * L'injection se fait dans un useEffect, donc uniquement côté navigateur.
 */
const starsStyles = `
.stars {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.stars::before,
.stars::after {
  content: '';
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
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

  /**
   * Session NextAuth.
   *
   * C'est elle qui permet de savoir :
   * - si l'utilisateur est connecté ;
   * - s'il a déjà terminé son profil ;
   * - s'il doit aller vers /mon-compte ou /inscription.
   */
  const { data: session, status } = useSession();

  /**
   * mode vient de l'URL :
   * /auth?mode=login
   * /auth?mode=register
   */
  const mode = searchParams.get("mode");

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  /**
   * Animations Framer Motion.
   */
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    }),
    []
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 },
    }),
    []
  );

  /**
   * Injection des styles étoiles.
   *
   * Important :
   * On évite de manipuler document directement en dehors d'un useEffect,
   * sinon Next.js peut provoquer des comportements bizarres.
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
   * Active le bon onglet selon l'URL.
   */
  useEffect(() => {
    if (mode === "register") {
      setIsLogin(false);
    }

    if (mode === "login") {
      setIsLogin(true);
    }
  }, [mode]);

  /**
   * Animation automatique des features.
   */
  useEffect(() => {
    const timer = setTimeout(() => setShowFeatures(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Redirection automatique si l'utilisateur est déjà connecté.
   *
   * C'est la correction essentielle.
   *
   * Si Google revient sur /auth après connexion :
   * - profil terminé => /mon-compte
   * - profil incomplet => /inscription
   *
   * Donc on ne force plus Google vers /inscription directement.
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

  /**
   * Fonction utilitaire.
   *
   * Elle récupère la session fraîche depuis NextAuth juste après connexion.
   * C'est plus fiable que de lire immédiatement la variable session,
   * car elle peut prendre quelques millisecondes à se mettre à jour.
   */
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

  /**
   * Vérification simple de la force du mot de passe.
   */
  const checkPasswordStrength = (password: string) => {
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    setPasswordStrength(strength);
  };

  /**
   * Validation simple des formulaires login/register.
   */
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

  /**
   * Connexion classique email + mot de passe.
   *
   * Important :
   * signIn("credentials", { redirect: false }) évite une redirection brutale.
   * Ensuite on récupère la session fraîche et on choisit la bonne page.
   */
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

      /**
       * Petite pause pour laisser NextAuth écrire le JWT.
       */
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

  /**
   * Inscription classique email + mot de passe.
   *
   * Après création :
   * - on connecte automatiquement l'utilisateur ;
   * - puis on l'envoie vers /inscription pour compléter le profil.
   */
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

  /**
   * Connexion sociale : Google / Facebook / Apple.
   *
   * Correction importante :
   * callbackUrl pointe vers /auth, pas /inscription.
   *
   * Pourquoi ?
   * Parce que /auth va ensuite lire la session et décider :
   * - hasCompletedProfile true => /mon-compte
   * - hasCompletedProfile false => /inscription
   */
  const handleSocialLogin = async (provider: "google" | "facebook" | "apple") => {
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

  /**
   * Fonctionnalités affichées à gauche.
   */
  const premiumFeatures = [
    { icon: <Crown className="h-5 w-5" />, text: "Profils vérifiés" },
    { icon: <Shield className="h-5 w-5" />, text: "Sécurité maximale" },
    { icon: <Smartphone className="h-5 w-5" />, text: "App mobile exclusive" },
    { icon: <Gift className="h-5 w-5" />, text: "Cadeaux premium" },
    { icon: <Users className="h-5 w-5" />, text: "Événements VIP" },
    { icon: <Heart className="h-5 w-5" />, text: "Matchs compatibles" },
  ];

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] font-sans text-white">
      {/* Décor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      <div className="stars" />

      {/* Retour accueil */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-30"
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-all group"
        >
          <motion.div
            whileHover={{ x: -5 }}
            className="p-2 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.div>

          <span className="text-sm font-medium">Retour à l'accueil</span>
        </Link>
      </motion.div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center z-10 py-8">
        {/* Colonne gauche */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white px-4 lg:px-8"
        >
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-lg opacity-50" />
                <Moon className="h-12 w-12 relative text-white" />
              </div>

              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                SferaLuna
              </h1>
            </div>

            <h2 className="text-3xl font-bold mb-4">
              Rencontrez l'amour sous un{" "}
              <span className="text-purple-300">nouvel angle</span>
            </h2>

            <p className="text-gray-300 text-lg mb-8">
              Rejoignez notre communauté exclusive où les rencontres sont
              magiques et authentiques. Votre histoire commence ici.
            </p>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={showFeatures ? "visible" : "hidden"}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            {premiumFeatures.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/30 transition-all"
              >
                <div className="text-purple-400">{feature.icon}</div>
                <span className="text-sm font-medium">{feature.text}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold">50,000+</div>
                <div className="text-gray-300 text-sm">Rencontres réussies</div>
              </div>

              <div>
                <div className="text-3xl font-bold">95%</div>
                <div className="text-gray-300 text-sm">Satisfaction</div>
              </div>

              <div>
                <div className="text-3xl font-bold">24h</div>
                <div className="text-gray-300 text-sm">Support premium</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className="h-4 w-4 text-yellow-400 fill-current"
                />
              ))}

              <span className="text-sm text-gray-300">
                4.9/5 sur l'App Store
              </span>
            </div>
          </div>
        </motion.div>

        {/* Colonne droite */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <div className="relative w-full max-w-md">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
              {/* Onglets */}
              <div className="p-6 border-b border-white/10">
                <div className="flex gap-2 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrors({});
                      setSuccess("");
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isLogin
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <User className="h-5 w-5" />
                    Connexion
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setErrors({});
                      setSuccess("");
                    }}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      !isLogin
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Sparkles className="h-5 w-5" />
                    Inscription
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {isLogin ? (
                    <motion.div
                      key="login-title"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-2"
                    >
                      <h2 className="text-2xl font-bold text-white">
                        Bienvenue de retour
                      </h2>

                      <p className="text-gray-400">
                        Connectez-vous à votre espace SferaLuna
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register-title"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-2"
                    >
                      <h2 className="text-2xl font-bold text-white">
                        Rejoignez l'aventure
                      </h2>

                      <p className="text-gray-400">
                        Créez votre compte en quelques secondes
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6">
                {/* Messages */}
                <AnimatePresence>
                  {errors.form && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-400" />
                        <span className="text-red-300 text-sm">
                          {errors.form}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span className="text-green-300 text-sm">
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
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleLogin}
                      className="space-y-4"
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

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            name="remember"
                            className="h-4 w-4 rounded bg-white/5 border border-white/10 checked:bg-purple-500 checked:border-purple-500 focus:ring-purple-500/20"
                          />
                          <span className="text-sm text-gray-400">
                            Se souvenir de moi
                          </span>
                        </label>

                        <Link
                          href="/auth/reset-password"
                          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          Mot de passe oublié ?
                        </Link>
                      </div>

                      <SubmitButton
                        isLoading={isLoading}
                        loadingText="Connexion en cours..."
                        text="Se connecter"
                      />
                    </motion.form>
                  ) : (
                    <motion.form
                      key="register-form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleRegister}
                      className="space-y-4"
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
                          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
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

                          <p className="text-xs text-gray-400 mt-1">
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

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="terms"
                          required
                          className="h-5 w-5 mt-0.5 rounded bg-white/5 border border-white/10 checked:bg-purple-500 checked:border-purple-500 focus:ring-purple-500/20"
                        />

                        <span className="text-sm text-gray-400">
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
                        loadingText="Création du compte..."
                        text="Créer mon compte"
                      />
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Séparateur */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>

                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-gray-900 text-gray-500">
                      Ou continuer avec
                    </span>
                  </div>
                </div>

                {/* Connexions sociales */}
                <div className="grid grid-cols-2 gap-3">
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
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50"
                  >
                    <div className="h-5 w-5 flex items-center justify-center bg-blue-600 rounded-full">
                      <span className="text-xs font-bold text-white">f</span>
                    </div>

                    <span className="text-sm font-medium">Facebook</span>
                  </button>
                </div>

                <SocialButton
                  label="Continuer avec Apple"
                  imageSrc="/apple-icon.svg"
                  onClick={() => handleSocialLogin("apple")}
                  disabled={isLoading}
                  fullWidth
                />
              </div>

              {/* Footer */}
              <div className="p-6 pt-4 border-t border-white/10">
                <p className="text-center text-sm text-gray-400">
                  {isLogin ? (
                    <>
                      Pas encore de compte ?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false);
                          setErrors({});
                          setSuccess("");
                        }}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                      >
                        S'inscrire maintenant
                      </button>
                    </>
                  ) : (
                    <>
                      Vous avez déjà un compte ?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(true);
                          setErrors({});
                          setSuccess("");
                        }}
                        className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                      >
                        Se connecter
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Badge sécurité */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-sm">
                <Shield className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-300">
                  Sécurité SSL 256-bit
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function PremiumAuthPage() {
  return (
    <Suspense>
      <PremiumAuthContent />
    </Suspense>
  );
}

/**
 * Champ input réutilisable.
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
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>

        <input
          name={name}
          type={type}
          placeholder={placeholder}
          required
          className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-white placeholder-gray-500"
        />
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Champ mot de passe réutilisable.
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
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {label}
      </label>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />

        <input
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          required
          onChange={(event) => onChange?.(event.target.value)}
          className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-white placeholder-gray-500"
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Bouton principal de formulaire.
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
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          {loadingText}
        </div>
      ) : (
        text
      )}
    </motion.button>
  );
}

/**
 * Bouton social réutilisable.
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
      className={`flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group disabled:opacity-50 ${
        fullWidth ? "w-full mt-3" : ""
      }`}
    >
      <Image
        src={imageSrc}
        alt={label}
        width={20}
        height={20}
        className="group-hover:scale-110 transition-transform"
      />

      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
