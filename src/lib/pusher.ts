// src/lib/pusher.ts

import Pusher from "pusher";

/**
 * Client Pusher côté serveur uniquement.
 *
 * Utilisé dans les routes API pour envoyer des événements :
 * - new-match
 * - new-message
 *
 * Variables nécessaires dans .env.local :
 *
 * PUSHER_APP_ID=
 * PUSHER_KEY=
 * PUSHER_SECRET=
 * PUSHER_CLUSTER=eu
 */

/**
 * Petite fonction de validation des variables d'environnement.
 * Ça évite les erreurs silencieuses difficiles à comprendre.
 */
function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }

  return value;
}

const appId = getRequiredEnv("PUSHER_APP_ID");
const key = getRequiredEnv("PUSHER_KEY");
const secret = getRequiredEnv("PUSHER_SECRET");
const cluster = process.env.PUSHER_CLUSTER || "eu";

/**
 * Instance Pusher serveur.
 *
 * Attention :
 * Ce fichier ne doit jamais être importé directement dans un composant client.
 */
export const pusher = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
});