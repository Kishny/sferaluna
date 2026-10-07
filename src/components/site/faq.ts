// src/components/site/faq.ts

/**
 * Questions fréquentes : source unique, utilisée par /faq et par le guide.
 * Les réponses décrivent le fonctionnement réel du site (offres, chemins
 * dans Mon compte) : les tenir à jour quand une fonctionnalité change.
 */

import { CalendarDays, Compass, Crown, Ghost, PauseCircle, ShieldCheck, SlidersHorizontal, Sparkles, Star, Trash2, UsersRound, type LucideIcon } from "lucide-react";

export type CategoryId = "security" | "account" | "matching" | "premium";

export const BADGE: Record<CategoryId, { label: string; className: string }> = {
  security: { label: "Sécurité", className: "bg-blue-500/20 text-blue-200 ring-blue-300/30" },
  account: { label: "Compte", className: "bg-pink-500/20 text-pink-200 ring-pink-300/30" },
  matching: { label: "Rencontres", className: "bg-violet-500/25 text-violet-100 ring-violet-300/30" },
  premium: { label: "Premium", className: "bg-amber-400/15 text-amber-200 ring-amber-300/30" },
};

export type Faq = { id: string; icon: LucideIcon; question: string; answer: string; category: CategoryId; popular?: boolean };

export const FAQS: Faq[] = [
  {
    id: "circle",
    icon: UsersRound,
    question: "Comment fonctionnent les Affinités de la semaine ?",
    answer:
      "Chaque semaine, les Affinités de la semaine te présentent une sélection de 6 profils choisis selon tes centres d’intérêt, tes intentions et tes préférences. Tu prends le temps de les découvrir, sans la pression du swipe. Elles sont incluses à partir de l’offre Essentiel.",
    category: "matching",
    popular: true,
  },
  {
    id: "donnees",
    icon: ShieldCheck,
    question: "Mes données sont-elles vraiment sécurisées ?",
    answer:
      "Les connexions sont chiffrées (HTTPS), ton mot de passe n’est jamais lisible, et tes coordonnées bancaires sont saisies chez Stripe : nous ne les recevons pas. Nous ne vendons pas tes données et ne faisons pas de publicité ciblée. Le détail est dans la politique de confidentialité.",
    category: "security",
    popular: true,
  },
  {
    id: "anonyme",
    icon: Ghost,
    question: "Puis-je utiliser SferaLuna de manière discrète ?",
    answer:
      "Oui. Ton profil s’affiche sous un pseudonyme, jamais sous ton vrai nom, et tu choisis les informations que tu montres. Avec le Mode Fantôme (offre Premium), tu parcours les profils sans laisser de trace et tu peux retirer ton profil des découvertes quand tu le souhaites.",
    category: "account",
    popular: true,
  },
  {
    id: "annuler",
    icon: Crown,
    question: "Comment annuler mon abonnement ?",
    answer:
      "Depuis Mon compte → Premium, à tout moment et sans engagement. Tu gardes tes avantages jusqu’à la fin de la période déjà payée, puis ton compte repasse automatiquement à l’offre gratuite.",
    category: "premium",
  },
  {
    id: "signalement",
    icon: ShieldCheck,
    question: "Que faire en cas de comportement inapproprié ?",
    answer:
      "Signale le profil depuis son menu : chaque signalement est examiné par l’équipe de modération, en journée. Tu peux aussi bloquer la personne : elle ne te verra plus et la conversation est fermée. Un filtre bloque par ailleurs automatiquement les messages clairement abusifs.",
    category: "security",
  },
  {
    id: "vibeplanner",
    icon: Compass,
    question: "Comment fonctionne le VibePlanner ?",
    answer:
      "Le VibePlanner t’aide à proposer une sortie à un match : tu choisis une idée, un lieu et une date, et l’autre personne accepte ou propose autre chose. Il est disponible à partir de l’offre Essentiel.",
    category: "matching",
  },
  {
    id: "preferences",
    icon: SlidersHorizontal,
    question: "Puis-je modifier mes préférences de rencontre ?",
    answer: "Oui, à tout moment depuis Mon compte → Préférences. Les profils proposés tiennent compte de tes nouveaux critères dès l’enregistrement.",
    category: "matching",
  },
  {
    id: "gratuit",
    icon: Star,
    question: "Quelle est la différence entre le compte gratuit et les offres payantes ?",
    answer:
      "Le compte gratuit permet de créer ton profil et d’explorer, avec 5 likes et 10 messages par jour. L’offre Essentiel lève ces limites et ajoute les Affinités de la semaine et le VibePlanner. L’offre Premium ajoute notamment le Mode Fantôme, la liste de tes visiteuses et les filtres avancés. Le détail est sur la page Tarifs.",
    category: "premium",
  },
  {
    id: "supprimer",
    icon: Trash2,
    question: "Comment supprimer mon compte définitivement ?",
    answer:
      "Depuis Mon compte → Sécurité → Supprimer mon compte. Ton profil, tes photos et vidéos, tes matchs et tes messages envoyés sont effacés, et un abonnement en cours n’est pas renouvelé. Cette action est irréversible.",
    category: "account",
  },
  {
    id: "vibesphere",
    icon: Sparkles,
    question: "VibeSphere est-il inclus dans l’offre gratuite ?",
    answer: "Oui, VibeSphere et le journal émotionnel sont accessibles à toutes les membres. Certaines fonctions avancées sont réservées à l’offre Premium.",
    category: "premium",
  },
  {
    id: "lunagather",
    icon: CalendarDays,
    question: "Comment participer aux événements LunaGather ?",
    answer: "Les événements sont listés sur la page Événements : choisis celui qui t’intéresse et inscris-toi en un clic. Les conditions d’accès selon ton offre sont précisées sur la page Tarifs.",
    category: "matching",
  },
  {
    id: "pause",
    icon: PauseCircle,
    question: "Puis-je mettre mon abonnement en pause ?",
    answer: "Oui, depuis Mon compte → Premium. Pendant la pause, tu n’es pas prélevée ; tu peux reprendre ton abonnement quand tu le souhaites.",
    category: "account",
  },
];
