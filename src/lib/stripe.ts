// src/lib/stripe.ts

import Stripe from "stripe";

/**
 * Client Stripe côté serveur.
 *
 * Important :
 * - ce fichier ne doit jamais être importé dans un composant client.
 * - STRIPE_SECRET_KEY doit rester uniquement côté serveur.
 */
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY est manquant dans .env.local");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  /**
   * Laisse Stripe utiliser la version API de ton compte.
   * C'est souvent plus stable pendant le développement.
   */
});