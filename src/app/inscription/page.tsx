/* src/app/inscription/page.tsx */

"use client";

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
} from "lucide-react";

/**
 * Helper pour rendre un champ texte optionnel.
 *
 * Exemple :
 * - "" devient undefined
 * - "texte" reste "texte"
 *
 * Ici, il sert surtout pour password, car un utilisateur Google
 * n'a pas forcément besoin de créer un mot de passe à cette étape.
 */
const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

/**
 * Schéma principal du formulaire d'inscription SferaLuna.
 *
 * Important :
 * - Cette page ne gère PLUS le choix du plan Stripe.
 * - Le choix Essentiel / Premium / Elite se fait uniquement sur /paiement.
 * - Ici, on complète seulement le profil utilisateur.
 */
const formSchema = z.object({
  pseudonyme: z
    .string()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères"),

  email: z.string().email("Adresse email invalide"),

  /**
   * Password optionnel :
   * - utile pour inscription credentials ;
   * - non obligatoire si l'utilisateur vient de Google OAuth.
   */
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
 * Liste complète des champs du profil.
 * Elle sert à valider tout le formulaire avant la redirection vers /paiement.
 */
const allProfileFields: FieldPath<FormData>[] = [
  "pseudonyme",
  "email",
  "age",
  "orientation",
  "intentions",
  "localisation",
  "rayon",
  "question",
  "reponse",
  "interets",
  "visibilite",
  "consentement",
];

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
    handleSubmit,
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
   * - email Google → champ email
   * - nom Google → pseudonyme par défaut
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
   * Valide uniquement l'étape affichée.
   */
  const onNext = async () => {
    setSubmitError("");

    const fieldsToValidate = allProfileFields[step];

    if (!fieldsToValidate) return;

    const isValid = await trigger(fieldsToValidate, {
      shouldFocus: true,
    });

    if (!isValid) {
      setSubmitError(
        "Veuillez compléter les champs obligatoires de cette étape.",
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
      "Certains champs du profil sont incomplets ou invalides. Revenez aux étapes précédentes pour les corriger.",
    );

    if (firstErrorKey) {
      try {
        setFocus(firstErrorKey);
      } catch {
        // Certains champs comme les tableaux ne peuvent pas toujours recevoir le focus.
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
   * Elle n'envoie PLUS de plan Stripe.
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

        /**
         * On envoie uniquement les données profil.
         * Pas de plan ici.
         */
        body: JSON.stringify({
          ...data,
          hasCompletedProfile: true,
        }),
      });

      const responseData = await res.json().catch(() => null);

      if (!res.ok || !responseData?.success) {

        setSubmitError(
          responseData?.error ||
            "Une erreur est survenue lors de l'enregistrement du profil.",
        );
        return;
      }

      router.push("/paiement");

      /**
       * Une fois le profil enregistré,
       * l'utilisateur choisit son offre sur /paiement.
       */
      router.push("/paiement");
    } catch (err) {
      setSubmitError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  /**
   * Bouton final : Continuer vers les offres.
   *
   * Cette fonction évite le blocage silencieux de handleSubmit.
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


      if (
        currentErrors.pseudonyme ||
        currentErrors.email ||
        currentErrors.age
      ) {
        setStep(0);
      } else if (currentErrors.orientation || currentErrors.intentions) {
        setStep(1);
      } else if (currentErrors.localisation || currentErrors.rayon) {
        setStep(2);
      } else if (
        currentErrors.question ||
        currentErrors.reponse ||
        currentErrors.interets
      ) {
        setStep(3);
      } else if (currentErrors.visibilite || currentErrors.consentement) {
        setStep(4);
      }

      setSubmitError(
        "Certains champs sont incomplets. Corrigez l’étape indiquée puis réessayez.",
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <p className="text-gray-300">
            Chargement de votre espace SferaLuna...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] font-sans relative overflow-hidden text-white">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />
      </div>

      {/* Étoiles globales depuis globals.css */}
      <div className="stars" />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Bouton retour accueil */}
        <div className="mb-6">
          <button
            onClick={() => router.push("/")}
            className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-purple-400/50 transition-all duration-200 text-sm"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
            Retour à l&apos;accueil
          </button>
        </div>

        {/* En-tête */}
        <section className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Création du profil SferaLuna
            </h1>
          </div>

          <p className="text-gray-300 text-lg">
            Complétez votre profil, puis choisissez l'offre qui correspond à
            votre expérience.
          </p>
        </section>

        {/* Barre de progression */}
        <section className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-300">
              Étape {step + 1} sur {totalScreens}
            </span>

            <span className="text-sm text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6 lg:p-8 shadow-2xl">
              {/* Erreur globale */}
              {submitError && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-200">
                  {submitError}
                </div>
              )}

              {step < steps.length && StepComponent ? (
                <FormProvider {...methods}>
                  <form
                    onSubmit={(event) => event.preventDefault()}
                    className="space-y-6"
                  >
                    {/* Badge étape */}
                    <div className="mb-6">
                      <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <Star className="h-4 w-4 text-yellow-400 mr-2" />
                        <span className="text-sm font-medium text-white">
                          Étape profil
                        </span>
                      </div>
                    </div>

                    <StepComponent />

                    {/* Navigation entre étapes */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
                      {step > 0 ? (
                        <button
                          type="button"
                          onClick={onBack}
                          className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Retour
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={onNext}
                        className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
                      >
                        Continuer
                      </button>
                    </div>
                  </form>
                </FormProvider>
              ) : (
                /**
                 * Écran final.
                 * On ne sélectionne plus de plan ici.
                 */
                <FormProvider {...methods}>
                  <div className="space-y-8">
                    <div className="text-center">
                      <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
                        <Check className="h-8 w-8 text-green-300" />
                      </div>

                      <h2 className="text-3xl font-bold text-white mb-3">
                        Votre profil est prêt
                      </h2>

                      <p className="text-gray-300">
                        Dernière étape : enregistrez votre profil puis
                        choisissez votre offre SferaLuna sur la page paiement.
                      </p>
                    </div>

                    {/* Cartes de résumé */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {finalHighlights.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-xl border border-white/10 bg-white/5 p-5"
                        >
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-3">
                            <div className="text-purple-300">{item.icon}</div>
                          </div>

                          <h3 className="font-bold text-white">{item.title}</h3>

                          <p className="text-sm text-gray-400 mt-1">
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Bloc Stripe */}
                    <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-700/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <ShieldCheck className="h-5 w-5 text-blue-400" />
                        </div>

                        <h3 className="text-lg font-bold text-white">
                          Paiement sécurisé via Stripe
                        </h3>
                      </div>

                      <p className="text-gray-300">
                        Sur la page suivante, vous pourrez choisir entre
                        Essentiel, Premium ou Elite. Votre accès sera activé
                        après validation du paiement par Stripe.
                      </p>
                    </div>

                    {/* Boutons finaux */}
                    <div className="flex justify-between items-center pt-6 border-t border-gray-700">
                      <button
                        type="button"
                        onClick={() => setStep(steps.length - 1)}
                        disabled={isSubmittingProfile}
                        className="px-6 py-3 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                      </button>

                      <button
                        type="button"
                        onClick={handleContinueToOffers}
                        disabled={isSubmittingProfile}
                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
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
            <div className="sticky top-8 space-y-6">
              {/* Avantages */}
              <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl border border-purple-500/30 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Crown className="h-6 w-6 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white">
                    Avantages SferaLuna
                  </h3>
                </div>

                <ul className="space-y-4">
                  {lunaBenefits.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-green-400" />
                      </div>

                      <span className="text-gray-200 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-purple-500/30">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-gray-300">
                      Statistiques premium :
                    </span>

                    <span className="text-white font-bold">
                      +300% de matches
                    </span>
                  </div>
                </div>
              </div>

              {/* Témoignage */}
              <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                    <Users className="h-6 w-6 text-white" />
                  </div>

                  <div>
                    <h4 className="font-bold text-white">Marie, 34 ans</h4>

                    <div className="flex items-center">
                      {[...Array(5)].map((_, index) => (
                        <Star
                          key={index}
                          className="h-4 w-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <p className="text-gray-300 italic">
                  "Grâce à SferaLuna, j’ai rencontré mon compagnon en seulement 2
                  semaines. Les filtres avancés m’ont permis de trouver
                  exactement ce que je cherchais."
                </p>
              </div>

              {/* Compteur */}
              <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 backdrop-blur-sm rounded-2xl border border-cyan-500/30 p-6">
                <div className="text-center">
                  <div className="text-cyan-400 text-sm font-medium mb-2">
                    MEMBRES EN LIGNE
                  </div>

                  <div className="text-4xl font-bold text-white mb-2">
                    2,847
                  </div>

                  <div className="text-gray-300 text-sm">
                    Dont 64% de membres premium
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>

        {/* Footer sécurisé */}
        <footer className="max-w-3xl mx-auto mt-8 text-center">
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
