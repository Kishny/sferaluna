// src/lib/resend.ts
// Client Resend pour l'envoi d'emails transactionnels SferaLuna
// Requires: npm install resend
// Env: RESEND_API_KEY, RESEND_FROM_EMAIL

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "SferaLuna <contact@sferaluna.com>";

/**
 * ID de l'Audience Resend qui regroupe les abonnées newsletter.
 * À créer dans le dashboard Resend (Audiences) puis renseigner dans
 * l'environnement : RESEND_AUDIENCE_ID.
 */
export const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? "";
