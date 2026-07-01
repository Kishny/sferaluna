// src/lib/text-moderation.ts
//
// Filtre anti-harcèlement léger pour les contenus texte (messagerie).
//
// Objectif : bloquer les contenus clairement abusifs (insultes graves,
// misogynie, menaces) sans sur-bloquer les messages légitimes.
//
// Approche :
//  1. Normalisation du texte (minuscules, sans accents, leetspeak courant,
//     lettres répétées réduites) pour contrer les contournements simples.
//  2. Correspondance par mots entiers sur une liste de termes, plus quelques
//     expressions de menace en sous-chaîne.
//
// La liste est volontairement conservatrice : elle vise le harcèlement
// évident, ce n'est pas un filtre de politesse.

/** Termes bloqués — mots entiers (après normalisation). */
const BLOCKED_WORDS = [
  "salope",
  "salopes",
  "pute",
  "putes",
  "connasse",
  "connard",
  "conasse",
  "truie",
  "chienne",
  "pouffiasse",
  "petasse",
  "morue",
  "encule",
  "enculee",
  "ntm",
  "fdp",
  "pd",
  "tapette",
  "gouine",
];

/** Expressions bloquées — recherche en sous-chaîne (après normalisation). */
const BLOCKED_PHRASES = [
  "je vais te tuer",
  "je vais te frapper",
  "je vais te violer",
  "je vais te retrouver",
  "je sais ou tu habites",
  "je sais ou tu vis",
  "tu vas le regretter",
  "je vais te faire du mal",
  "ferme ta gueule",
  "ta gueule",
  "suce moi",
  "nique toi",
  "va te faire",
  "grosse vache",
];

/**
 * Normalise un texte pour la détection :
 * - minuscules
 * - suppression des accents
 * - leetspeak courant (0→o, 1→i, 3→e, 4→a, 5→s, @→a, $→s)
 * - lettres répétées 3+ réduites à 1 (saloooope → salope)
 * - ponctuation → espace, espaces normalisés
 */
export function normalizeForModeration(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/@/g, "a")
    .replace(/\$/g, "s")
    .replace(/(.)\1{2,}/g, "$1") // lettres répétées
    .replace(/[^a-z\s]/g, " ") // ponctuation → espace
    .replace(/\s+/g, " ")
    .trim();
}

export interface ModerationResult {
  blocked: boolean;
  category?: "insulte" | "menace";
  matched?: string;
}

/**
 * Vérifie si un message doit être bloqué par le filtre anti-harcèlement.
 */
export function moderateText(content: string): ModerationResult {
  const normalized = normalizeForModeration(content);
  if (!normalized) return { blocked: false };

  for (const phrase of BLOCKED_PHRASES) {
    if (normalized.includes(phrase)) {
      return { blocked: true, category: "menace", matched: phrase };
    }
  }

  const tokens = new Set(normalized.split(" "));
  for (const word of BLOCKED_WORDS) {
    if (tokens.has(word)) {
      return { blocked: true, category: "insulte", matched: word };
    }
  }

  return { blocked: false };
}
