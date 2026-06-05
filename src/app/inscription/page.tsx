/* src/app/inscription/page.tsx */

"use client";

/**
 * Page d'onboarding / inscription profil SferaLuna.
 *
 * Cette page gère :
 * - la complétion du profil après inscription ou connexion OAuth ;
 * - un formulaire multi-étapes avec React Hook Form ;
 * - la validation Zod ;
 * - l'enregistrement du profil via /api/users/update-profile ;
 * - la redirection vers /paiement après profil complet ;
 * - un écran final avant les offres Premium.
 *
 * Correction importante :
 * L'ancien code validait seulement un champ par étape.
 * Maintenant chaque étape valide son groupe de champs dédié.
 */

import { useEffect, useMemo, useState } from "react";
import {
  useForm,
  FormProvider,
  type FieldPath,
  type Resolver,
  type SubmitErrorHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";

import {
  ArrowLeft,
  Check,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
  AlertCircle,
} from "lucide-react";

/**
 * Helper pour rendre un champ texte optionnel.
 *
 * Exemple :
 * - "" devient undefined ;
 * - "texte" reste "texte".
 *
 * Ici, il sert surtout pour password, car un utilisateur Google
 * n'a pas forcément besoin de créer un mot de passe à cette étape.
 */
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional()
);

/**
 * Schéma principal du formulaire d'inscription SferaLuna.
 *
 * Important :
 * - cette page ne gère plus le choix du plan Stripe ;
 * - le choix Essentiel / Premium / Elite se fait uniquement sur /paiement ;
 * - ici, on complète seulement le profil utilisateur.
 */
const formSchema = z.object({
  pseudonyme: z
    .string()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères"),

  email: z.string().email("Adresse email invalide"),

  password: optionalString,

  age: z.coerce
    .number({
      message: "L'âge est obligatoire",
    })
    .min(28, "Vous devez avoir au moins 28 ans")
    .max(120, "Âge invalide"),

  orientation: z.string().min(1, "Veuillez sélectionner votre orientation"),

  intentions: z
    .array(z.string())
    .min(1, "Veuillez choisir au moins une intention"),

  localisation: z.string().min(2, "Veuillez renseigner votre localisation"),

  rayon: z.string().min(1, "Veuillez choisir un rayon de recherche"),

  question: z.string().min(1, "Veuillez choisir une question de sécurité"),

  reponse: z
    .string()
    .min(2, "Votre réponse est trop courte")
    .max(200, "Votre réponse ne doit pas dépasser 200 caractères"),

  interets: z
    .array(z.string())
    .min(3, "Choisissez au moins 3 centres d'intérêt")
    .max(5, "Choisissez au maximum 5 centres d'intérêt"),

  visibilite: z.string().min(1, "Veuillez choisir une visibilité"),

  consentement: z.boolean().refine((val) => val === true, {
    message: "Le consentement est obligatoire.",
  }),
});

type FormData = z.infer<typeof formSchema>;

/**
 * Liste des composants d'étapes.
 *
 * step = 0 → Step1
 * step = 1 → Step2
 * step = 2 → Step3
 * step = 3 → Step4
 * step = 4 → Step5
 * step = 5 → écran final "profil prêt"
 */
const steps = [Step1, Step2, Step3, Step4, Step5];

/**
 * Champs à valider par étape.
 *
 * Correction clé :
 * Chaque étape valide maintenant les bons champs,
 * au lieu de valider seulement un champ isolé.
 */
const stepFields: FieldPath<FormData>[][] = [
  ["pseudonyme", "email", "age"],
  ["orientation", "intentions"],
  ["localisation", "rayon"],
  ["question", "reponse", "interets"],
  ["visibilite", "consentement"],
];

/**
 * Liste complète des champs du profil.
 * Elle sert à valider tout le formulaire avant la redirection vers /paiement.
 */
const allProfileFields: FieldPath<FormData>[] = stepFields.flat();

/**
 * Avantages affichés dans le panneau latéral.
 */
const lunaBenefits = [
  "Profils illimités sans swipes",
  "Messages prioritaires",
  "Vue complète des visiteurs",
  "Mode invisible",
  "Filtres avancés",
  "Statistiques détaillées",
  "Rencontres personnalisées",
  "Support VIP 24/7",
];

/**
 * Cartes affichées sur l'écran final avant /paiement.
 */
const finalHighlights = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Profil prêt",
    description:
      "Votre profil est configuré pour recevoir de meilleures suggestions.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Rencontres ciblées",
    description:
      "Vos intentions et préférences servent à améliorer la compatibilité.",
  },
  {
    icon: <Lock className="h-5 w-5" />,
    title: "Sécurité renforcée",
    description: "Votre compte est associé à votre session sécurisée.",
  },
  {
    icon: <Star className="h-5 w-5" />,
    title: "Offres flexibles",
    description: "Vous choisissez ensuite Essentiel, Premium ou Elite.",
  },
];

/**
 * Retourne l'étape à afficher selon la première erreur trouvée.
 */
function getStepFromErrors(errors: Partial<Record<keyof FormData, unknown>>) {
  if (errors.pseudonyme || errors.email || errors.age) return 0;
  if (errors.orientation || errors.intentions) return 1;
  if (errors.localisation || errors.rayon) return 2;
  if (errors.question || errors.reponse || errors.interets) return 3;
  if (errors.visibilite || errors.consentement) return 4;

  return 0;
}

export default function InscriptionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  /**
   * step de navigation.
   *
   * 0 à 4 : étapes du profil
   * 5 : écran final avant redirection vers /paiement
   */
  const [step, setStep] = useState(0);

  /**
   * Erreur globale affichée dans la carte principale.
   */
  const [submitError, setSubmitError] = useState("");

  /**
   * Loader pendant l'enregistrement du profil.
   */
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema) as Resolver<FormData>,
    mode: "onTouched",
    defaultValues: {
      pseudonyme: "",
      email: "",
      password: "",
      age: 28,
      orientation: "",
      intentions: [],
      localisation: "",
      rayon: "10 km",
      question: "",
      reponse: "",
      interets: [],
      visibilite: "public",
      consentement: false,
    },
  });

  const {
    trigger,
    setValue,
    setFocus,
    formState: { errors },
  } = methods;

  /**
   * Composant de l'étape actuelle.
   * Si step = 5, StepComponent sera undefined et on affiche l'écran final.
   */
  const StepComponent = steps[step];

  /**
   * Préremplissage depuis NextAuth.
   *
   * Après connexion Google :
   * - email Google → champ email ;
   * - nom Google → pseudonyme par défaut.
   */
  useEffect(() => {
    if (session?.user?.email) {
      setValue("email", session.user.email, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (session?.user?.name) {
      setValue("pseudonyme", session.user.name, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [session, setValue]);

  /**
   * Progression visuelle.
   * Total = 5 étapes + 1 écran final.
   */
  const totalScreens = steps.length + 1;

  const progress = useMemo(() => {
    return ((step + 1) / totalScreens) * 100;
  }, [step, totalScreens]);

  /**
   * Bouton Continuer.
   *
   * Valide uniquement les champs de l'étape affichée.
   */
  const onNext = async () => {
    setSubmitError("");

    const fieldsToValidate = stepFields[step];

    if (!fieldsToValidate) return;

    const isValid = await trigger(fieldsToValidate, {
      shouldFocus: true,
    });

    if (!isValid) {
      setSubmitError(
        "Veuillez compléter les champs obligatoires de cette étape."
      );
      return;
    }

    setStep((currentStep) => Math.min(currentStep + 1, steps.length));
  };

  /**
   * Bouton Retour.
   */
  const onBack = () => {
    setSubmitError("");
    setStep((currentStep) => Math.max(currentStep - 1, 0));
  };

  /**
   * Gestion des erreurs de validation finale.
   *
   * Si React Hook Form bloque la soumission finale,
   * cette fonction affiche un message au lieu de laisser l'utilisateur bloqué.
   */
  const onInvalid: SubmitErrorHandler<FormData> = (formErrors) => {
    const firstErrorKey = Object.keys(formErrors)[0] as
      | FieldPath<FormData>
      | undefined;

    setSubmitError(
      "Certains champs du profil sont incomplets ou invalides. Revenez aux étapes précédentes pour les corriger."
    );

    if (firstErrorKey) {
      try {
        setFocus(firstErrorKey);
      } catch {
        /**
         * Certains champs comme les tableaux ne peuvent pas toujours recevoir le focus.
         */
      }
    }
  };

  /**
   * Soumission finale.
   *
   * Cette fonction :
   * - enregistre le profil dans MongoDB via /api/users/update-profile ;
   * - marque hasCompletedProfile à true ;
   * - redirige vers /paiement.
   *
   * Elle n'envoie plus de plan Stripe.
   */
  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    setIsSubmittingProfile(true);

    try {
      const res = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          hasCompletedProfile: true,
        }),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok || !responseData?.success) {
        setSubmitError(
          responseData?.error ||
            "Une erreur est survenue lors de l'enregistrement du profil."
        );
        return;
      }

      /**
       * Redirection unique vers /paiement.
       *
       * Correction :
       * l'ancien code appelait router.push("/paiement") deux fois.
       */
      router.push("/paiement");
    } catch {
      setSubmitError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  /**
   * Bouton final : Continuer vers les offres.
   *
   * Cette fonction évite le blocage silencieux.
   * Elle :
   * 1. valide tout le profil ;
   * 2. si erreur, renvoie vers l'étape concernée ;
   * 3. si tout est bon, enregistre le profil ;
   * 4. redirige vers /paiement.
   */
  const handleContinueToOffers = async () => {
    setSubmitError("");

    const isValid = await trigger(allProfileFields, {
      shouldFocus: true,
    });

    if (!isValid) {
      const currentErrors = methods.formState.errors;
      setStep(getStepFromErrors(currentErrors));

      setSubmitError(
        "Certains champs sont incomplets. Corrigez l’étape indiquée puis réessayez."
      );

      return;
    }

    const data = methods.getValues();
    await onSubmit(data);
  };

  /**
   * Loader pendant le chargement de session NextAuth.
   */
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] px-4 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-sm text-gray-300 sm:text-base">
            Chargement de votre espace SferaLuna...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] font-sans text-white">
      {/* Éléments décoratifs de fond */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute left-1/3 top-1/3 h-64 w-64 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      {/* Étoiles globales depuis globals.css */}
      <div className="stars" />

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-8">
        {/* Bouton retour accueil */}
        <div className="mb-5 sm:mb-6">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-all duration-200 hover:border-purple-400/50 hover:bg-white/10 hover:text-white sm:px-4"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
            Retour à l&apos;accueil
          </button>
        </div>

        {/* En-tête */}
        <section className="mb-6 text-center sm:mb-8">
          <div className="mb-3 flex items-center justify-center gap-2 sm:mb-4">
            <Crown className="h-7 w-7 text-yellow-400 sm:h-8 sm:w-8" />

            <h1 className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-2xl font-bold leading-tight text-transparent sm:text-4xl">
              Création du profil SferaLuna
            </h1>
          </div>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-lg">
            Complétez votre profil, puis choisissez l'offre qui correspond à
            votre expérience.
          </p>
        </section>

        {/* Barre de progression */}
        <section className="mx-auto mb-6 max-w-3xl sm:mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-gray-300 sm:text-sm">
              Étape {step + 1} sur {totalScreens}
            </span>

            <span className="text-xs text-gray-300 sm:text-sm">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-900/80 to-gray-800/80 p-4 shadow-2xl backdrop-blur-sm sm:p-6 lg:p-8">
              {/* Erreur globale */}
              {submitError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:mb-6">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {step < steps.length && StepComponent ? (
                <FormProvider {...methods}>
                  <form
                    onSubmit={(event) => event.preventDefault()}
                    className="space-y-5 sm:space-y-6"
                  >
                    {/* Badge étape */}
                    <div className="mb-4 sm:mb-6">
                      <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-4 py-2">
                        <Star className="mr-2 h-4 w-4 text-yellow-400" />
                        <span className="text-sm font-medium text-white">
                          Étape profil
                        </span>
                      </div>
                    </div>

                    <StepComponent />

                    {/* Navigation entre étapes */}
                    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-gray-700 pt-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={onBack}
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white sm:w-auto"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Retour
                        </button>
                      ) : (
                        <div className="hidden sm:block" />
                      )}

                      <button
                        type="button"
                        onClick={onNext}
                        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-medium text-white transition-all hover:from-purple-700 hover:to-pink-700 sm:w-auto"
                      >
                        Continuer
                      </button>
                    </div>
                  </form>
                </FormProvider>
              ) : (
                <FormProvider {...methods}>
                  <div className="space-y-6 sm:space-y-8">
                    <div className="text-center">
                      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-400/30 bg-green-500/20">
                        <Check className="h-8 w-8 text-green-300" />
                      </div>

                      <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
                        Votre profil est prêt
                      </h2>

                      <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                        Dernière étape : enregistrez votre profil puis
                        choisissez votre offre SferaLuna sur la page paiement.
                      </p>
                    </div>

                    {/* Cartes de résumé */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {finalHighlights.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-xl border border-white/10 bg-white/5 p-5"
                        >
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                            <div className="text-purple-300">{item.icon}</div>
                          </div>

                          <h3 className="font-bold text-white">
                            {item.title}
                          </h3>

                          <p className="mt-1 text-sm text-gray-400">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Vérification d'identité */}
                    <div className="rounded-xl border border-purple-700/30 bg-gradient-to-r from-purple-900/30 to-pink-900/30 p-5 sm:p-6">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20 text-xl">
                          🪪
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-white">
                            Vérification d&apos;identité
                          </h3>

                          <p className="text-xs text-white/40">
                            Recommandé — obtenir le badge &quot;Profil vérifié&quot;
                          </p>
                        </div>
                      </div>

                      <p className="mb-4 text-sm leading-relaxed text-gray-300">
                        Vérifiez votre identité avec une pièce d&apos;identité
                        officielle pour rassurer les autres utilisatrices et
                        booster votre visibilité. Cette étape est optionnelle
                        mais fortement recommandée.
                      </p>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await fetch("/api/identity-verification", {
                              method: "POST",
                            });
                            const data = await res.json();

                            if (data.url) window.open(data.url, "_blank");
                          } catch {
                            setSubmitError(
                              "Impossible de lancer la vérification d'identité."
                            );
                          }
                        }}
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Vérifier mon identité maintenant
                      </button>

                      <p className="mt-2 text-center text-xs text-white/30">
                        Vous pouvez aussi le faire plus tard depuis Mon Compte →
                        Sécurité
                      </p>
                    </div>

                    {/* Bloc Stripe */}
                    <div className="rounded-xl border border-blue-700/30 bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-5 sm:p-6">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                          <ShieldCheck className="h-5 w-5 text-blue-400" />
                        </div>

                        <h3 className="text-lg font-bold text-white">
                          Paiement sécurisé via Stripe
                        </h3>
                      </div>

                      <p className="text-sm leading-relaxed text-gray-300 sm:text-base">
                        Sur la page suivante, vous pourrez choisir entre
                        Essentiel, Premium ou Elite. Votre accès sera activé
                        après validation du paiement par Stripe.
                      </p>
                    </div>

                    {/* Boutons finaux */}
                    <div className="flex flex-col-reverse gap-3 border-t border-gray-700 pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                      <button
                        type="button"
                        onClick={() => setStep(steps.length - 1)}
                        disabled={isSubmittingProfile}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-600 px-6 py-3 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white disabled:opacity-50 sm:w-auto"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                      </button>

                      <button
                        type="button"
                        onClick={handleContinueToOffers}
                        disabled={isSubmittingProfile}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:text-lg"
                      >
                        {isSubmittingProfile ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            Continuer vers les offres
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </FormProvider>
              )}
            </div>
          </div>

          {/* Colonne latérale */}
          <aside className="lg:col-span-1">
            <div className="space-y-5 lg:sticky lg:top-8 lg:space-y-6">
              {/* Avantages */}
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-5 backdrop-blur-sm sm:p-6">
                <div className="mb-5 flex items-center gap-3 sm:mb-6">
                  <Crown className="h-6 w-6 text-yellow-400" />

                  <h3 className="text-lg font-bold text-white sm:text-xl">
                    Avantages SferaLuna
                  </h3>
                </div>

                <ul className="space-y-3 sm:space-y-4">
                  {lunaBenefits.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>

                      <span className="text-sm text-gray-200">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 border-t border-purple-500/30 pt-5 sm:mt-6 sm:pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-300">
                      Statistiques premium :
                    </span>

                    <span className="font-bold text-white">
                      +300% de matches
                    </span>
                  </div>
                </div>
              </div>

              {/* Témoignage */}
              <div className="rounded-2xl border border-gray-700 bg-gray-900/60 p-5 backdrop-blur-sm sm:p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                    <Users className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <h4 className="font-bold text-white">Marie, 34 ans</h4>

                    <div className="flex items-center">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className="h-4 w-4 fill-current text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-sm italic leading-relaxed text-gray-300 sm:text-base">
                  “Grâce à SferaLuna, j’ai rencontré mon compagnon en seulement
                  2 semaines. Les filtres avancés m’ont permis de trouver
                  exactement ce que je cherchais.”
                </p>
              </div>

              {/* Compteur */}
              <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-5 backdrop-blur-sm sm:p-6">
                <div className="text-center">
                  <div className="mb-2 text-sm font-medium text-cyan-400">
                    MEMBRES EN LIGNE
                  </div>

                  <div className="mb-2 text-3xl font-bold text-white sm:text-4xl">
                    2,847
                  </div>

                  <div className="text-sm text-gray-300">
                    Dont 64% de membres premium
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Footer sécurisé */}
        <footer className="mx-auto mt-8 max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Paiement 100% sécurisé</span>
            </div>

            <div className="hidden sm:block">•</div>

            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Annulation à tout moment</span>
            </div>

            <div className="hidden sm:block">•</div>

            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Données protégées</span>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
