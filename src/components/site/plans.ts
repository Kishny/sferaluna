// src/components/site/plans.ts

/**
 * Offres affichées sur le site public (accueil + /tarifs).
 * Prix et ids alignés sur src/lib/subscription/config.ts.
 * Les listes de fonctionnalités reprennent le contenu validé de /tarifs.
 */

export type PublicPlanId =
  | "free"
  | "essential-monthly"
  | "premium-monthly"
  | "elite-monthly";

export interface PublicPlan {
  id: PublicPlanId;
  name: string;
  tagline: string;
  highlight: string;
  price: string;
  features: string[];
  cta: string;
  recommended?: boolean;
  tone: "moon" | "star" | "heart" | "diamond";
}

export const PUBLIC_PLANS: PublicPlan[] = [
  {
    id: "free",
    highlight: "Créez votre profil, explorez librement",
    name: "Gratuit",
    tagline: "Découvrir en toute liberté",
    price: "0 €",
    tone: "moon",
    features: [
      "Profil complet",
      "Explorer librement",
      "5 likes par jour",
      "10 messages par jour",
      "Communauté Luna",
    ],
    cta: "Créer mon profil",
  },
  {
    id: "essential-monthly",
    highlight: "Messages illimités et Circle of Six",
    name: "Essentiel",
    tagline: "Faire de vraies rencontres",
    price: "9,99 €",
    tone: "star",
    features: [
      "Likes et messages illimités",
      "Circle of Six chaque semaine",
      "VibePlanner (3 idées / mois)",
      "Événements LunaGather exclusifs",
      "Badge Essentiel",
    ],
    cta: "Choisir Essentiel",
  },
  {
    id: "premium-monthly",
    highlight: "Mode Fantôme et visiteuses de votre profil",
    name: "Premium",
    tagline: "Vivre pleinement l’expérience",
    price: "19,99 €",
    tone: "heart",
    recommended: true,
    features: [
      "Tout le contenu Essentiel",
      "Mode Fantôme",
      "Voir qui a visité votre profil",
      "VibePlanner illimité",
      "Filtres premium",
      "Badge Premium",
    ],
    cta: "Choisir Premium",
  },
  {
    id: "elite-monthly",
    highlight: "Coaching VibeMentor et cercle VIP",
    name: "Elite",
    tagline: "Pour des connexions exceptionnelles",
    price: "34,99 €",
    tone: "diamond",
    features: [
      "Tout le contenu Premium",
      "Coaching VibeMentor mensuel",
      "Cercle privé VIP",
      "Rencontres organisées exclusives",
      "Accès anticipé aux nouveautés",
      "Support dédié 7j/7",
    ],
    cta: "Choisir Elite",
  },
];

/** Tableau comparatif simplifié (valeurs reprises de /tarifs). */
export const COMPARISON: { feature: string; values: [string, string, string, string] }[] = [
  { feature: "Explorer librement", values: ["✓", "✓", "✓", "✓"] },
  { feature: "Likes", values: ["5 / jour", "Illimités", "Illimités", "Illimités"] },
  { feature: "Messages", values: ["10 / jour", "Illimités", "Illimités", "Illimités"] },
  { feature: "Circle of Six", values: ["—", "Chaque semaine", "Chaque semaine", "Chaque semaine"] },
  { feature: "LunaGather", values: ["Événements gratuits", "Exclusifs", "Exclusifs", "VIP"] },
  { feature: "VibePlanner", values: ["—", "3 / mois", "Illimité", "Illimité"] },
  { feature: "Mode Fantôme & visiteuses", values: ["—", "—", "✓", "✓"] },
  { feature: "Accompagnement", values: ["Formulaire", "Support 5j/7", "Support 7j/7", "Coaching VibeMentor"] },
];

/** FAQ reprise de l'ancienne page /tarifs. */
export const PRICING_FAQ = [
  {
    question: "Puis-je changer de formule à tout moment ?",
    answer:
      "Oui, depuis Mon compte → Premium. La différence est ajustée au prorata.",
  },
  {
    question: "Mon abonnement est-il résiliable facilement ?",
    answer:
      "Oui, sans engagement : vous annulez en un clic depuis votre espace et gardez vos avantages jusqu’à la fin de la période payée.",
  },
  {
    question: "Que se passe-t-il si j’annule ?",
    answer:
      "Votre compte repasse automatiquement en version gratuite à la fin de la période. Vous ne perdez ni vos matchs ni vos messages.",
  },
  {
    question: "Les paiements sont-ils sécurisés ?",
    answer:
      "Oui, tous les paiements passent par Stripe. SferaLuna ne voit ni ne stocke jamais vos données bancaires.",
  },
  {
    question: "Proposez-vous des tarifs étudiants ?",
    answer:
      "Oui, une réduction de 30 % est proposée aux étudiantes : contactez le support avec votre carte étudiante.",
  },
];
