// src/lib/moderation.ts
//
// Modération automatique des photos à l'upload (avatar, galerie profil, chat).
//
// Principe :
// Cloudinary propose un add-on de modération automatique (AWS Rekognition,
// "aws_rek") qui analyse l'image pendant l'upload et renvoie un verdict
// directement dans la réponse de l'API upload — pas besoin de webhook ni
// d'attente, contrairement à la modération manuelle ("manual").
//
// Activation requise côté compte Cloudinary (PAS du code) :
//   Dashboard Cloudinary → Add-ons → "AWS Rekognition AI Moderation" → activer.
//   C'est un service payant à l'usage (palier gratuit limité). Sans cet
//   add-on activé sur le compte, Cloudinary répond avec une erreur
//   explicite ("420 — Moderation type X is not supported"), qu'on capture
//   ci-dessous pour ne jamais bloquer un upload légitime à cause d'un
//   add-on non configuré (fail-open + log, voir evaluateModeration).
//
// Activation requise côté code (variable d'env) :
//   CLOUDINARY_MODERATION_ENABLED=true
// Tant que cette variable n'est pas "true", aucune option de modération
// n'est envoyée à Cloudinary — comportement strictement identique à avant
// ce changement. Permet d'activer la fonctionnalité uniquement une fois
// l'add-on Cloudinary réellement souscrit et testé.

export const MODERATION_ENABLED =
  process.env.CLOUDINARY_MODERATION_ENABLED === "true";

/**
 * Option à passer dans cloudinary.uploader.upload_stream(...).
 * Retourne undefined si la modération n'est pas activée — dans ce cas,
 * ne pas inclure la clé "moderation" du tout dans les options d'upload.
 */
export function getModerationUploadOption(): "aws_rek" | undefined {
  return MODERATION_ENABLED ? "aws_rek" : undefined;
}

export type ModerationVerdict = {
  /** false uniquement si Cloudinary a explicitement rejeté l'image. */
  approved: boolean;
  /** Raison lisible, utile pour le log / le message d'erreur. */
  reason?: string;
};

/**
 * Interprète le résultat d'upload Cloudinary pour savoir si l'image doit
 * être bloquée.
 *
 * Comportement "fail-open" volontaire : si la modération est désactivée,
 * ou si le champ moderation est absent/mal formé (ex : add-on non souscrit,
 * panne du service tiers), on APPROUVE par défaut plutôt que de bloquer
 * tout le monde à cause d'un problème de configuration ou de facturation
 * Cloudinary. Seul un rejet EXPLICITE ("rejected") bloque l'image.
 */
export function evaluateModeration(uploadResult: unknown): ModerationVerdict {
  if (!MODERATION_ENABLED) return { approved: true };

  const moderation = (uploadResult as { moderation?: Array<{ status?: string; kind?: string }> })
    ?.moderation;

  if (!Array.isArray(moderation) || moderation.length === 0) {
    console.warn(
      "[Modération photo] Champ 'moderation' absent de la réponse Cloudinary — " +
        "vérifiez que l'add-on AWS Rekognition est bien activé sur le compte. " +
        "Image approuvée par défaut (fail-open)."
    );
    return { approved: true };
  }

  const rejected = moderation.find((m) => m.status === "rejected");

  if (rejected) {
    return {
      approved: false,
      reason: `Contenu rejeté par la modération automatique (${rejected.kind ?? "aws_rek"}).`,
    };
  }

  return { approved: true };
}

/** Message affiché à l'utilisatrice quand sa photo est rejetée. */
export const MODERATION_REJECTION_MESSAGE =
  "Cette photo ne respecte pas nos règles de contenu (nudité ou contenu inapproprié détecté). Merci d'en choisir une autre.";
