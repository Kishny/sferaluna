// src/lib/compatibility.ts

/**
 * Compatibilité entre deux membres SferaLuna.
 *
 * Utilisé par :
 * - la sélection hebdomadaire « Vos découvertes du jour » (/explorer) ;
 * - le profil détaillé (/explorer/profil/[id]).
 *
 * Aucun appel base de données ici : fonctions pures, utilisables côté
 * serveur comme côté client (libellés).
 *
 * Le pourcentage est une « affinité estimée » transparente, construite
 * uniquement à partir de données réellement renseignées :
 *   intentions communes 35 · centres d'intérêt communs 30 · âge 15 ·
 *   proximité 15 · activité récente 5.
 */

// ─────────────────────────────────────────────
// Libellés (alignés sur l'onboarding /inscription)
// ─────────────────────────────────────────────

export const INTEREST_LABELS: Record<string, string> = {
  voyage: "Voyages",
  cuisine: "Cuisine",
  sport: "Sport",
  musique: "Musique",
  cinema: "Cinéma",
  lecture: "Lecture",
  art: "Art",
  technologie: "Technologie",
  nature: "Nature",
  mode: "Mode",
  gaming: "Jeux vidéo",
  photographie: "Photographie",
};

export const INTENTION_LABELS: Record<string, string> = {
  "rencontre-serieuse": "Rencontre sérieuse",
  amitie: "Amitié",
  aventure: "Aventure",
  reseautage: "Réseautage",
  discussion: "Discussion",
};

export const ORIENTATION_LABELS: Record<string, string> = {
  hetero: "Hétérosexuelle",
  homo: "Lesbienne",
  bi: "Bisexuelle",
  pan: "Pansexuelle",
  curieuse: "Curieuse",
  other: "Autre",
};

/** Valeurs proposées dans Mon profil (champ `valeurs`). */
export const VALUE_OPTIONS = [
  "Authenticité",
  "Bienveillance",
  "Communication",
  "Liberté",
  "Loyauté",
  "Humour",
  "Curiosité",
  "Respect",
  "Engagement",
  "Indépendance",
];

/** Modes de vie proposés dans Mon profil (champ `modeDeVie`). */
export const LIFESTYLE_OPTIONS = [
  "Équilibré",
  "Plutôt casanière",
  "Sociable et sortie",
  "Aventurière",
  "Sportive",
  "Créative",
];

export const LANGUAGE_OPTIONS = [
  "Français",
  "Anglais",
  "Espagnol",
  "Italien",
  "Allemand",
  "Portugais",
  "Arabe",
  "Créole",
];

export function interestLabel(value: string) {
  return INTEREST_LABELS[value] || value;
}

export function intentionLabel(value: string) {
  return INTENTION_LABELS[value] || value;
}

// ─────────────────────────────────────────────
// Calcul
// ─────────────────────────────────────────────

export interface CompatMember {
  age?: number | null;
  localisation?: string | null;
  departement?: string | null;
  interets?: string[] | null;
  intentions?: string[] | null;
  lastLoginAt?: Date | string | null;
}

export type ReasonKey = "intentions" | "interests" | "proximity" | "age" | "active" | "likedYou";

export interface CompatReason {
  key: ReasonKey;
  title: string;
  text: string;
}

export interface Compatibility {
  score: number; // 0 → 100
  sharedInterests: string[];
  sharedIntentions: string[];
  proximity: "same-city" | "same-department" | null;
  recentlyActive: boolean;
  reasons: CompatReason[];
}

const DAY = 24 * 60 * 60 * 1000;

function norm(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function list(values?: string[] | null) {
  return Array.isArray(values) ? values.filter(Boolean) : [];
}

function joinFr(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

export function computeCompatibility(
  me: CompatMember,
  other: CompatMember,
  options: { likedYou?: boolean } = {}
): Compatibility {
  const myIntentions = list(me.intentions);
  const theirIntentions = list(other.intentions);
  const myInterests = list(me.interets);
  const theirInterests = list(other.interets);

  const sharedIntentions = myIntentions.filter((i) => theirIntentions.includes(i));
  const sharedInterests = myInterests.filter((i) => theirInterests.includes(i));

  // Intentions : part de ses propres intentions retrouvées chez l'autre.
  const intentionRatio = myIntentions.length ? sharedIntentions.length / myIntentions.length : 0;
  // Intérêts : 3 intérêts communs = maximum.
  const interestRatio = Math.min(sharedInterests.length / 3, 1);

  let ageRatio = 0;
  if (typeof me.age === "number" && typeof other.age === "number") {
    const gap = Math.abs(me.age - other.age);
    ageRatio = gap <= 3 ? 1 : gap <= 6 ? 0.75 : gap <= 10 ? 0.45 : gap <= 15 ? 0.2 : 0;
  }

  let proximity: Compatibility["proximity"] = null;
  if (me.localisation && other.localisation && norm(me.localisation) === norm(other.localisation)) {
    proximity = "same-city";
  } else if (me.departement && other.departement && me.departement === other.departement) {
    proximity = "same-department";
  }
  const proximityRatio = proximity === "same-city" ? 1 : proximity === "same-department" ? 0.6 : 0;

  const lastLogin = other.lastLoginAt ? new Date(other.lastLoginAt).getTime() : 0;
  const recentlyActive = lastLogin > 0 && Date.now() - lastLogin < 7 * DAY;

  const raw =
    intentionRatio * 35 +
    interestRatio * 30 +
    ageRatio * 15 +
    proximityRatio * 15 +
    (recentlyActive ? 5 : 0);

  // Score brut, sans plancher ni arrondi flatteur : il reflète uniquement
  // ce que les deux profils ont réellement renseigné.
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const reasons: CompatReason[] = [];

  if (options.likedYou) {
    reasons.push({
      key: "likedYou",
      title: "Elle s’intéresse à vous",
      text: "Elle a déjà aimé votre profil : un like de votre part crée le match.",
    });
  }

  if (sharedIntentions.length) {
    reasons.push({
      key: "intentions",
      title: "Vous cherchez la même chose",
      text: `Vous partagez ${sharedIntentions.length > 1 ? "les intentions" : "l’intention"} ${joinFr(
        sharedIntentions.map((i) => `« ${intentionLabel(i)} »`)
      )}.`,
    });
  }

  if (sharedInterests.length) {
    reasons.push({
      key: "interests",
      title: sharedInterests.length > 1 ? "Des passions communes" : "Une passion commune",
      text: `Vous aimez toutes les deux ${joinFr(sharedInterests.map((i) => interestLabel(i).toLowerCase()))}.`,
    });
  }

  if (proximity) {
    reasons.push({
      key: "proximity",
      title: "À proximité de vous",
      text:
        proximity === "same-city"
          ? `Elle vit aussi à ${other.localisation}, idéal pour se rencontrer.`
          : "Elle vit dans votre département, idéal pour se rencontrer.",
    });
  }

  if (ageRatio >= 0.75 && typeof other.age === "number") {
    reasons.push({
      key: "age",
      title: "Une même étape de vie",
      text: `Elle a ${other.age} ans, un âge proche du vôtre.`,
    });
  }

  if (recentlyActive) {
    reasons.push({
      key: "active",
      title: "Active récemment",
      text: "Elle s’est connectée cette semaine, ce qui facilite un premier échange.",
    });
  }

  return { score, sharedInterests, sharedIntentions, proximity, recentlyActive, reasons };
}

/** Lundi 00:00 (heure serveur) de la semaine en cours. */
export function currentWeekStart(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}
