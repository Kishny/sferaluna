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

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  useForm,
  FormProvider,
  type FieldPath,
  type Resolver,
  type SubmitErrorHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import Step1 from "./steps/Step1";
import Step2 from "./steps/Step2";
import Step3 from "./steps/Step3";
import Step4 from "./steps/Step4";
import Step5 from "./steps/Step5";
import { cx } from "./steps/ui";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  IdCard,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  UsersRound,
  Zap,
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

  departement: z.string().optional(),

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
  ["localisation", "departement", "rayon"],
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
  "Support dédié 7j/7",
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

type IdentityVerificationStatus = "unverified" | "pending" | "verified" | "failed";

/**
 * Décor spatial de secours (planètes, étoiles, horizon), utilisé tant
 * qu'aucune image n'est déposée dans public/images/inscription-bg.*
 * (voir layout.tsx). L'image, si elle existe, le recouvre entièrement.
 */
function SpaceBackdrop() {
  const stars = Array.from({ length: 90 }).map((_, i) => ({
    x: (i * 173) % 1600,
    y: (i * 97) % 760,
    r: 0.6 + ((i * 7) % 4) * 0.35,
    o: 0.35 + ((i * 13) % 6) * 0.1,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0d0822]" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_100%,#5b21b6_0%,#2a1163_35%,#130a2e_70%,#0d0822_100%)]" />
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="sp-planet" cx="72%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="45%" stopColor="#4c1d95" />
            <stop offset="100%" stopColor="#170a36" />
          </radialGradient>
          <radialGradient id="sp-planet2" cx="28%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#5b21b6" />
            <stop offset="100%" stopColor="#1a0b3a" />
          </radialGradient>
          <linearGradient id="sp-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b1a78" />
            <stop offset="100%" stopColor="#120726" />
          </linearGradient>
        </defs>
        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.o} />
        ))}
        <circle cx="-60" cy="470" r="330" fill="url(#sp-planet)" />
        <circle cx="1650" cy="640" r="250" fill="url(#sp-planet2)" />
        <circle cx="1470" cy="80" r="105" fill="url(#sp-planet2)" opacity="0.75" />
        <path d="M0 900 L0 760 L90 700 L180 740 L280 690 L360 750 L1240 750 L1330 690 L1420 730 L1510 680 L1600 720 L1600 900 Z" fill="url(#sp-ground)" />
        <rect x="0" y="800" width="1600" height="100" fill="#120726" opacity="0.6" />
      </svg>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "var(--inscription-bg, none)" }} />
    </div>
  );
}

/**
 * Palette tournante pour les cartes "finalHighlights" de l'écran final.
 */
const highlightBars = [
  "from-[#9D4EDD] to-[#C77DFF]",
  "from-[#4ECDC4] to-[#8FE9E0]",
  "from-[#FF6B9D] to-[#FF8E53]",
  "from-[#667EEA] to-[#764BA2]",
];

/** Surfaces et boutons du parcours. */
const CARD = "rounded-[28px] border border-violet-300/30 bg-[#150f38]/80 shadow-[0_30px_90px_-40px_rgba(124,58,237,0.9)] backdrop-blur-xl";
const BTN_NEXT =
  "flex h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-8 text-[17px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.9)] ring-1 ring-white/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto";
const BTN_BACK =
  "flex h-[50px] w-full items-center justify-center gap-3 rounded-xl border border-violet-200/35 bg-white/[0.03] px-7 text-base text-white transition hover:border-fuchsia-300/60 hover:bg-white/[0.08] disabled:opacity-50 sm:w-auto";

function InscriptionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  /**
   * Profil déjà enregistré en base (hasCompletedProfile).
   * Permet de savoir si l'utilisatrice revient sur cette page
   * uniquement pour finaliser la vérification d'identité.
   */
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  /**
   * Statut de vérification d'identité — obligatoire pour accéder au compte.
   */
  const [identityStatus, setIdentityStatus] =
    useState<IdentityVerificationStatus>("unverified");
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false);
  const [isLaunchingVerification, setIsLaunchingVerification] = useState(false);

  /**
   * Détection d'un navigateur intégré à une app (webview Instagram, Facebook,
   * TikTok, Snapchat, etc.). Ces navigateurs bloquent souvent l'accès à la
   * caméra, ce qui fait échouer la vérification d'identité Stripe. On avertit
   * la personne d'ouvrir la page dans Safari ou Chrome.
   */
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const ua = navigator.userAgent || "";

    // Tokens typiques des webviews intégrés aux applications.
    const inAppPatterns =
      /(FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|TikTok|musical_ly|BytedanceWebview|Trill|Snapchat|LinkedInApp|Pinterest\/|WhatsApp|Messenger|GSA\/)/i;

    setIsInAppBrowser(inAppPatterns.test(ua));
  }, []);

  /**
   * Statistiques réelles (MongoDB), affichées dans la colonne latérale.
   * Remplacent les chiffres marketing en dur — se mettent à jour
   * automatiquement à chaque inscription, message, match, etc.
   */
  const [liveStats, setLiveStats] = useState<{
    membres: number;
    matchs: number;
    messages: number;
    evenements: number;
  } | null>(null);

  /**
   * Témoignage réel le plus récent (modèle Testimonial, validé par un admin).
   * Tant qu'aucun témoignage n'est approuvé, on n'affiche aucun témoignage
   * fictif.
   */
  const [latestTestimonial, setLatestTestimonial] = useState<{
    authorName: string;
    age?: number;
    content: string;
  } | null>(null);

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
      departement: "",
      rayon: "departement",
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
   * Récupère le statut de vérification d'identité depuis l'API.
   * Source de vérité : MongoDB (mis à jour par le webhook Stripe Identity),
   * plus fiable que la session NextAuth qui peut être en cache.
   */
  const refreshIdentityStatus = async () => {
    setIsCheckingIdentity(true);

    try {
      const res = await fetch("/api/identity-verification", {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.identityVerificationStatus) {
        setIdentityStatus(data.identityVerificationStatus);
      }
    } catch {
      /* on garde le statut précédent en cas d'erreur réseau */
    } finally {
      setIsCheckingIdentity(false);
    }
  };

  /**
   * Si l'utilisatrice a déjà un profil complété (ex: retour après
   * vérification d'identité), on l'amène directement à l'écran final
   * au lieu de lui refaire remplir les 5 étapes.
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    const currentUser = session?.user as
      | { hasCompletedProfile?: boolean; identityVerified?: boolean }
      | undefined;

    if (currentUser?.hasCompletedProfile) {
      setIsProfileSaved(true);
      setStep(steps.length);
    }

    if (currentUser?.identityVerified) {
      setIdentityStatus("verified");
    }
  }, [status, session]);

  /**
   * Garde d'accès :
   * - pas de session → page de connexion (au lieu d'un formulaire vide) ;
   * - compte déjà complet ET identité vérifiée → directement l'espace membre.
   *   (Sauf au retour de Stripe Identity : on laisse l'écran de confirmation.)
   */
  const alreadyOnboarded = (() => {
    const u = session?.user as
      | { hasCompletedProfile?: boolean; identityVerified?: boolean; role?: string }
      | undefined;
    return (
      status === "authenticated" &&
      u?.hasCompletedProfile === true &&
      (u?.identityVerified === true || u?.role === "admin") &&
      !searchParams?.get("verification")
    );
  })();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth?mode=login&callbackUrl=%2Finscription");
      return;
    }
    if (alreadyOnboarded) {
      router.replace("/mon-compte");
    }
  }, [status, alreadyOnboarded, router]);

  /**
   * Vérifie le statut de vérification d'identité :
   * - au chargement de l'écran final ;
   * - au retour depuis Stripe Identity (?verification=success).
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (step !== steps.length) return;

    refreshIdentityStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, step, searchParams?.get("verification")]);

  /**
   * Charge les statistiques réelles et le dernier témoignage approuvé.
   * Données réelles uniquement — aucune valeur marketing en dur.
   */
  useEffect(() => {
    let isMounted = true;

    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success) {
          setLiveStats(data.stats);
        }
      })
      .catch(() => {});

    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => {
        const first = data?.testimonials?.[0];
        if (isMounted && first) {
          setLatestTestimonial({
            authorName: first.authorName,
            age: first.age,
            content: first.content,
          });
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

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

  /** À chaque changement d'étape, on revient en haut de la page. */
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

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
   * - marque hasCompletedProfile à true.
   *
   * Important : elle ne redirige plus automatiquement vers /paiement.
   * La vérification d'identité est désormais obligatoire avant tout accès
   * au compte (gratuit ou payant) — l'utilisatrice reste sur cet écran
   * pour la réaliser.
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

      setIsProfileSaved(true);
      await refreshIdentityStatus();
    } catch {
      setSubmitError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  /**
   * Bouton "Enregistrer mon profil" sur l'écran final.
   *
   * Cette fonction évite le blocage silencieux.
   * Elle :
   * 1. valide tout le profil ;
   * 2. si erreur, renvoie vers l'étape concernée ;
   * 3. si tout est bon, enregistre le profil.
   *
   * L'accès au compte (gratuit ou payant) n'est débloqué qu'après
   * vérification d'identité — gérée plus bas sur le même écran.
   */
  const handleSaveProfile = async () => {
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
   * Lance la session Stripe Identity.
   */
  const handleStartIdentityVerification = async () => {
    setSubmitError("");
    setIsLaunchingVerification(true);

    try {
      const res = await fetch("/api/identity-verification", {
        method: "POST",
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.url) {
        setSubmitError(
          data?.error || "Impossible de lancer la vérification d'identité."
        );
        return;
      }

      setIdentityStatus("pending");
      window.location.href = data.url;
    } catch {
      setSubmitError("Impossible de lancer la vérification d'identité.");
    } finally {
      setIsLaunchingVerification(false);
    }
  };

  /**
   * Accès au compte gratuit — uniquement possible une fois l'identité
   * vérifiée. Le paiement reste optionnel et accessible plus tard depuis
   * Mon Compte.
   */
  const handleAccessFreeAccount = () => {
    if (identityStatus !== "verified") return;
    router.push("/mon-compte");
  };

  /**
   * Accès aux offres Premium — également conditionné à la vérification
   * d'identité.
   */
  const handleGoToOffers = () => {
    if (identityStatus !== "verified") return;
    router.push("/paiement");
  };

  /**
   * Loader pendant le chargement de session NextAuth.
   */
  if (status === "loading" || status === "unauthenticated" || alreadyOnboarded) {
    return <PageLoader />;
  }

  const isFinal = step >= steps.length;

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden font-sans text-white">
      <SpaceBackdrop />

      <div className="relative z-10 mx-auto max-w-[1180px] px-4 pb-10 pt-5 sm:px-5 sm:pt-6">
        {/* En-tête */}
        <header className="relative text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group mb-5 inline-flex h-12 items-center gap-3 rounded-full border border-violet-300/30 bg-[#1b1040]/70 px-6 text-[15px] text-white/90 backdrop-blur transition hover:border-fuchsia-300/60 hover:text-white xl:absolute xl:left-0 xl:top-0 xl:mb-0 2xl:-left-20"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Retour à l’accueil
          </button>

          <h1 className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1 text-3xl font-bold leading-tight tracking-tight sm:text-[40px] xl:pt-3">
            <Crown className="h-9 w-9 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)] sm:h-11 sm:w-11" />
            <span>
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Création du</span> profil{" "}
              <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">SferaLuna</span>
            </span>
          </h1>
          <p className="mx-auto mt-1.5 max-w-3xl text-base text-white/80 sm:text-lg">Complétez votre profil, puis choisissez l’offre qui correspond à votre expérience.</p>

          {/* Progression */}
          <div className="mx-auto mt-4 max-w-[800px]">
            <div className="mb-2 flex items-center justify-between text-[15px] text-white/85">
              <span>
                Étape {step + 1} sur {totalScreens}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/15"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="Progression de la création du profil"
            >
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Colonne principale */}
          <div className={cx(CARD, "border-violet-300/45 p-5 sm:p-8 lg:px-10 lg:py-8")}>
            {submitError && (
              <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {!isFinal && StepComponent ? (
              <FormProvider {...methods}>
                <form onSubmit={(event) => event.preventDefault()}>
                  <span className="mb-4 inline-flex h-10 items-center gap-2.5 rounded-full border border-fuchsia-400/45 bg-fuchsia-500/15 px-4 text-sm font-medium text-white">
                    <Star className="h-4 w-4 text-amber-300" /> Étape profil
                  </span>

                  <StepComponent />

                  <div className="mt-6 flex flex-col-reverse gap-3 border-t border-white/12 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    {step > 0 ? (
                      <button type="button" onClick={onBack} className={BTN_BACK}>
                        <ArrowLeft className="h-4 w-4" /> Retour
                      </button>
                    ) : (
                      <span className="hidden sm:block" />
                    )}
                    <button type="button" onClick={onNext} className={cx(BTN_NEXT, "sm:w-[190px]")}>
                      Continuer <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </FormProvider>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-400/20">
                    <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_40px_-4px_rgba(52,211,153,0.9)] ring-2 ring-emerald-200/60">
                      <Check className="h-9 w-9 text-white" strokeWidth={3} />
                    </span>
                  </span>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-[38px]">
                    Votre profil est <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">prêt</span>
                  </h2>
                  <p className="mx-auto mt-2 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">
                    Dernière étape : enregistrez votre profil, puis vérifiez votre identité. C’est obligatoire pour accéder à votre compte — gratuit ou payant.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {finalHighlights.map((item, index) => (
                    <div key={item.title} className="relative overflow-hidden rounded-xl border border-violet-200/20 bg-white/[0.06] p-5">
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${highlightBars[index % highlightBars.length]}`} />
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/30 text-white">{item.icon}</span>
                      <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-white/70">{item.description}</p>
                    </div>
                  ))}
                </div>

                {/* Vérification d'identité — obligatoire */}
                <div
                  className={cx(
                    "rounded-2xl border p-5 sm:p-6",
                    identityStatus === "verified"
                      ? "border-emerald-400/40 bg-emerald-500/10"
                      : "border-fuchsia-400/60 bg-gradient-to-r from-violet-700/30 via-fuchsia-700/25 to-pink-700/25 shadow-[0_0_40px_-12px_rgba(217,70,239,0.8)]"
                  )}
                >
                  <div className="mb-3 flex items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500/35">
                      <IdCard className="h-6 w-6 text-white" />
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Vérification d’identité</h3>
                      <p className="text-sm font-semibold text-pink-300">Obligatoire — requise pour accéder à votre compte</p>
                    </div>
                  </div>

                  {/* Navigateur intégré (Instagram, Facebook, TikTok…) : la caméra y est souvent bloquée. */}
                  {isInAppBrowser && identityStatus !== "verified" && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Vous semblez naviguer depuis l’application d’un réseau social. La caméra peut y être bloquée et faire échouer la vérification.{" "}
                        <strong className="font-semibold">Ouvrez plutôt cette page dans Safari ou Chrome</strong> (menu « … » → « Ouvrir dans le navigateur ») avant de lancer la vérification.
                      </span>
                    </div>
                  )}

                  {identityStatus === "verified" ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                      <Check className="h-4 w-4 shrink-0" />
                      <span>Identité vérifiée. Vous pouvez maintenant accéder à votre compte.</span>
                    </div>
                  ) : identityStatus === "pending" ? (
                    <>
                      <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        <span>Vérification en cours de traitement. Cela peut prendre quelques minutes.</span>
                      </div>

                      <button type="button" onClick={refreshIdentityStatus} disabled={isCheckingIdentity} className={cx(BTN_BACK, "w-full sm:w-full")}>
                        {isCheckingIdentity ? "Vérification du statut…" : "Rafraîchir le statut"}
                      </button>

                      {/* Filet de sécurité : relancer si la personne est bloquée (page fermée, caméra refusée…). */}
                      <div className="mt-3 border-t border-white/10 pt-3">
                        <p className="mb-2 text-center text-xs text-white/60">Un problème, une fenêtre fermée ou un blocage technique pendant la vérification ?</p>
                        <button
                          type="button"
                          onClick={handleStartIdentityVerification}
                          disabled={isLaunchingVerification}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/15 text-sm font-semibold text-white transition hover:bg-fuchsia-500/25 disabled:opacity-60"
                        >
                          <RotateCcw className="h-4 w-4" /> {isLaunchingVerification ? "Préparation…" : "Recommencer la vérification"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mb-4 text-sm leading-relaxed text-white/85 sm:text-[15px]">
                        Pour la sécurité de toutes les utilisatrices, SferaLuna exige une pièce d’identité officielle et une photo prise en direct correspondant au visage sur la pièce. Sans cette
                        vérification, l’inscription n’est pas validée et l’accès au compte reste bloqué.
                        {identityStatus === "failed" && <span className="mt-2 block font-medium text-rose-300">La vérification précédente n’a pas pu être validée. Merci de réessayer.</span>}
                      </p>

                      <button type="button" onClick={handleStartIdentityVerification} disabled={isLaunchingVerification || !isProfileSaved} className={cx(BTN_NEXT, "relative w-full sm:w-full")}>
                        {isLaunchingVerification ? "Préparation…" : identityStatus === "failed" ? "Recommencer la vérification d’identité" : "Vérifier mon identité maintenant"}
                        <ArrowRight className="absolute right-5 h-5 w-5" />
                      </button>

                      {!isProfileSaved && <p className="mt-2 text-center text-xs text-white/60">Enregistrez d’abord votre profil ci-dessous pour lancer la vérification.</p>}
                    </>
                  )}
                </div>

                {/* Paiement — facultatif, possible plus tard */}
                <div className="rounded-2xl border border-blue-300/25 bg-blue-500/10 p-5 sm:p-6">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/25">
                      <ShieldCheck className="h-5 w-5 text-blue-200" />
                    </span>
                    <h3 className="text-lg font-bold text-white">Paiement — facultatif pour le moment</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-white/80 sm:text-[15px]">
                    Une fois votre identité vérifiée, vous pouvez accéder gratuitement à votre compte avec les fonctionnalités de base. Vous pourrez choisir une offre Essentiel, Premium ou Elite à tout
                    moment depuis Mon Compte.
                  </p>
                </div>

                {/* Boutons finaux */}
                <div className="border-t border-white/12 pt-5">
                  {!isProfileSaved ? (
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={() => setStep(steps.length - 1)} disabled={isSubmittingProfile} className={BTN_BACK}>
                        <ArrowLeft className="h-4 w-4" /> Retour
                      </button>
                      <button type="button" onClick={handleSaveProfile} disabled={isSubmittingProfile} className={BTN_NEXT}>
                        {isSubmittingProfile ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" /> Enregistrement…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" /> Enregistrer mon profil
                          </>
                        )}
                      </button>
                    </div>
                  ) : identityStatus === "verified" ? (
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button type="button" onClick={handleGoToOffers} className={BTN_BACK}>
                        <Star className="h-4 w-4" /> Voir les offres Premium
                      </button>
                      <button type="button" onClick={handleAccessFreeAccount} className={BTN_NEXT}>
                        <Sparkles className="h-5 w-5" /> Accéder à mon compte gratuit
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-sm text-white/70">Vérifiez votre identité ci-dessus pour débloquer l’accès à votre compte.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Colonne latérale */}
          <aside className="space-y-4 lg:sticky lg:top-6">
            <div className={cx(CARD, "border-fuchsia-400/45 bg-gradient-to-br from-[#2a1260]/85 to-[#3b1257]/80 p-6")}>
              <h2 className="flex items-center gap-4 text-[22px] font-bold text-white">
                <Crown className="h-7 w-7 text-amber-400" />
                <span>
                  Avantages <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">SferaLuna</span>
                </span>
              </h2>

              <ul className="mt-5 space-y-3">
                {lunaBenefits.map((feature) => (
                  <li key={feature} className="flex items-center gap-4">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/45 ring-1 ring-violet-300/40">
                      <Check className="h-4 w-4 text-white" strokeWidth={2.5} />
                    </span>
                    <span className="text-[15px] text-white/90">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center justify-between gap-4 border-t border-white/15 pt-4">
                <span className="text-[15px] text-fuchsia-200/90">Matches créés sur SferaLuna :</span>
                <span className="text-2xl font-bold text-fuchsia-400">{liveStats ? liveStats.matchs : "—"}</span>
              </div>
            </div>

            {/* Témoignage — uniquement réel et approuvé */}
            {latestTestimonial && (
              <figure className={cx(CARD, "p-6")}>
                <figcaption className="flex items-center gap-4">
                  <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500">
                    <UsersRound className="h-6 w-6 text-white" />
                  </span>
                  <span>
                    <span className="block text-lg font-semibold text-white">
                      {latestTestimonial.authorName}
                      {latestTestimonial.age ? `, ${latestTestimonial.age} ans` : ""}
                    </span>
                    <span className="mt-0.5 flex" aria-hidden>
                      {[...Array(5)].map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </span>
                </figcaption>
                <blockquote className="mt-4 text-[15px] italic leading-relaxed text-white/85">“{latestTestimonial.content}”</blockquote>
              </figure>
            )}

            {/* Compteur — données réelles */}
            <div className={cx(CARD, "flex items-center gap-6 border-blue-400/40 bg-gradient-to-r from-[#1b1a5e]/85 to-[#241a6e]/80 p-6")}>
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <Users className="h-7 w-7 text-blue-300" />
              </span>
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-cyan-300">Membres inscrits</p>
                <p className="text-4xl font-bold leading-tight text-white">{liveStats ? liveStats.membres : "—"}</p>
                <p className="text-[15px] text-white/75">{liveStats ? liveStats.messages : "—"} messages échangés</p>
              </div>
            </div>
          </aside>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/60">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" /> Paiement sécurisé par Stripe
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" /> Annulation à tout moment
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Données protégées
          </span>
        </footer>
      </div>
    </main>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0d0822] px-4 text-white">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-fuchsia-300" />
        <p className="text-sm text-white/75 sm:text-base">Chargement de votre espace SferaLuna…</p>
      </div>
    </div>
  );
}

export default function InscriptionPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <InscriptionPageContent />
    </Suspense>
  );
}
