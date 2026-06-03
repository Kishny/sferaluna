// src/lib/resend.ts
// Client Resend pour l'envoi d'emails transactionnels SferaLuna
// Requires: npm install resend
// Env: RESEND_API_KEY, RESEND_FROM_EMAIL

import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "SferaLuna <noreply@sferaluna.com>";
