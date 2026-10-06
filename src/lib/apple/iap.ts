// src/lib/apple/iap.ts

/**
 * Abonnements achetés dans l'app iPhone (achat intégré Apple).
 *
 * Sur le site, les abonnements passent par Stripe ; dans l'app iPhone, par
 * Apple. Les deux alimentent les MÊMES champs du compte (plan,
 * subscriptionStatus, isPremium, premiumExpiresAt) : tout ce qui lit « est-elle
 * abonnée ? » fonctionne donc sans rien savoir de l'origine du paiement.
 * `subscriptionSource` vaut "apple" tant qu'un abonnement Apple est actif.
 *
 * Le serveur ne fait jamais confiance à l'app : il n'accepte qu'une preuve
 * d'achat signée par Apple, dont la signature est vérifiée par la bibliothèque
 * officielle (@apple/app-store-server-library) jusqu'au certificat racine.
 *
 * Trois points d'entrée (src/app/api/apple) :
 * - account-token   : identifiant que l'app joint à l'achat pour le lier au compte ;
 * - verify-purchase : l'app envoie la preuve juste après l'achat ou une restauration ;
 * - notifications   : Apple annonce renouvellements, résiliations, remboursements.
 */

import { Environment, SignedDataVerifier, VerificationException, VerificationStatus } from "@apple/app-store-server-library";
import type {
  JWSRenewalInfoDecodedPayload,
  JWSTransactionDecodedPayload,
  ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";

import { APPLE_ROOT_CA_G3_BASE64 } from "@/lib/apple/root-ca";
import { User } from "@/models/User";

// ─────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────

/** Identifiant de l'app (public, celui de app.json). */
export const APPLE_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || "com.sferaluna.app";

/** Identifiant numérique de l'app sur l'App Store (public, exigé en production). */
const APPLE_APP_ID = Number(process.env.APPLE_APP_ID || "6778860303");

/**
 * Les achats de test (bac à sable, TestFlight, examen d'Apple) sont signés pour
 * l'environnement « Sandbox ». Ils doivent être acceptés pour que l'examen
 * d'Apple fonctionne ; APPLE_IAP_ALLOW_SANDBOX=false les refuse.
 */
const allowSandbox = () => process.env.APPLE_IAP_ALLOW_SANDBOX !== "false";

type AppleBackedPlan = "essential-monthly" | "premium-monthly" | "elite-monthly";

/** Produits créés dans App Store Connect → formules SferaLuna. */
export const APPLE_PRODUCT_PLANS: Record<string, AppleBackedPlan> = {
  "com.sferaluna.app.essentiel.mensuel": "essential-monthly",
  "com.sferaluna.app.premium.mensuel": "premium-monthly",
  "com.sferaluna.app.elite.mensuel": "elite-monthly",
};

// ─────────────────────────────────────────────
// Vérification des signatures
// ─────────────────────────────────────────────

const verifiers = new Map<Environment, SignedDataVerifier>();

function verifierFor(environment: Environment) {
  let verifier = verifiers.get(environment);
  if (!verifier) {
    verifier = new SignedDataVerifier(
      [Buffer.from(APPLE_ROOT_CA_G3_BASE64, "base64")],
      true, // contrôle de révocation des certificats auprès d'Apple
      environment,
      APPLE_BUNDLE_ID,
      environment === Environment.PRODUCTION ? APPLE_APP_ID : undefined
    );
    verifiers.set(environment, verifier);
  }
  return verifier;
}

/**
 * Une preuve ne dit pas d'avance pour quel environnement elle est signée : on
 * essaie la production, puis le bac à sable si Apple répond « mauvais
 * environnement ». Toute autre erreur (signature invalide, autre app) remonte.
 */
async function verifyInAnyEnvironment<T>(run: (verifier: SignedDataVerifier) => Promise<T>): Promise<T> {
  try {
    return await run(verifierFor(Environment.PRODUCTION));
  } catch (error) {
    const wrongEnvironment = error instanceof VerificationException && error.status === VerificationStatus.INVALID_ENVIRONMENT;
    if (!wrongEnvironment || !allowSandbox()) throw error;
    return run(verifierFor(Environment.SANDBOX));
  }
}

export const verifyAppleTransaction = (jws: string): Promise<JWSTransactionDecodedPayload> =>
  verifyInAnyEnvironment((v) => v.verifyAndDecodeTransaction(jws));

export const verifyAppleRenewalInfo = (jws: string): Promise<JWSRenewalInfoDecodedPayload> =>
  verifyInAnyEnvironment((v) => v.verifyAndDecodeRenewalInfo(jws));

export const verifyAppleNotification = (signedPayload: string): Promise<ResponseBodyV2DecodedPayload> =>
  verifyInAnyEnvironment((v) => v.verifyAndDecodeNotification(signedPayload));

/** true si l'erreur vient d'une preuve refusée (et non d'une panne). */
export const isAppleVerificationError = (error: unknown) => error instanceof VerificationException;

// ─────────────────────────────────────────────
// De la preuve d'achat à l'état du compte
// ─────────────────────────────────────────────

export type AppleSubscriptionUpdate = {
  plan: "free" | AppleBackedPlan;
  subscriptionStatus: "active" | "past_due" | "canceled";
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  subscriptionCancelAtPeriodEnd: boolean;
  subscriptionPaused: false;
  subscriptionSource: "apple" | null;
};

/**
 * Traduit une transaction Apple (et, si on l'a, ses informations de
 * renouvellement) en état d'abonnement. Fonction pure : aucune lecture ni
 * écriture en base. Renvoie null pour un produit inconnu.
 *
 * - Abonnement en cours (ou en délai de grâce après un paiement échoué) : actif.
 * - Paiement échoué sans délai de grâce : accès coupé, statut « past_due ».
 * - Expiré, remboursé ou révoqué : retour à la formule gratuite.
 */
export function appleSubscriptionUpdate(
  transaction: Pick<JWSTransactionDecodedPayload, "productId" | "expiresDate" | "revocationDate">,
  renewal: Pick<JWSRenewalInfoDecodedPayload, "autoRenewStatus" | "isInBillingRetryPeriod" | "gracePeriodExpiresDate"> | null,
  now: Date = new Date()
): AppleSubscriptionUpdate | null {
  const plan = transaction.productId ? APPLE_PRODUCT_PLANS[transaction.productId] : undefined;
  if (!plan) return null;

  const expires = transaction.expiresDate ? new Date(transaction.expiresDate) : null;
  const grace = renewal?.gracePeriodExpiresDate ? new Date(renewal.gracePeriodExpiresDate) : null;
  const end = grace && (!expires || grace > expires) ? grace : expires;
  const revoked = Boolean(transaction.revocationDate);

  if (!revoked && end && end > now) {
    return {
      plan,
      subscriptionStatus: "active",
      isPremium: true,
      premiumExpiresAt: end,
      // 0 = renouvellement automatique désactivé : l'abonnement s'arrête à l'échéance.
      subscriptionCancelAtPeriodEnd: renewal ? Number(renewal.autoRenewStatus) === 0 : false,
      subscriptionPaused: false,
      subscriptionSource: "apple",
    };
  }

  return {
    plan: "free",
    subscriptionStatus: !revoked && renewal?.isInBillingRetryPeriod ? "past_due" : "canceled",
    isPremium: false,
    premiumExpiresAt: end,
    subscriptionCancelAtPeriodEnd: false,
    subscriptionPaused: false,
    subscriptionSource: null,
  };
}

// ─────────────────────────────────────────────
// Application au compte
// ─────────────────────────────────────────────

export type ApplyResult =
  | { applied: true; userId: string; update: AppleSubscriptionUpdate }
  | { applied: false; reason: "unknown_product" | "user_not_found" | "other_account" | "stale" | "stripe_active"; userId?: string };

/** L'app joint cet identifiant à l'achat ; Apple le renvoie en minuscules ou majuscules. */
const normalizeToken = (token?: string | null) => (token ? token.toLowerCase() : "");

/**
 * Applique une transaction Apple vérifiée au compte concerné.
 *
 * Le compte est retrouvé par l'identifiant joint à l'achat (appAccountToken),
 * sinon par l'identifiant de l'abonnement Apple déjà rattaché. `expectedUserId`
 * (route verify-purchase) impose que ce soit le compte connecté : un achat fait
 * avec un autre compte SferaLuna sur le même iPhone n'est jamais transféré.
 *
 * `eventDate` protège contre les notifications arrivées dans le désordre : un
 * événement plus ancien que le dernier appliqué est ignoré.
 */
export async function applyAppleTransaction({
  transaction,
  renewal = null,
  eventDate,
  expectedUserId,
  now = new Date(),
}: {
  transaction: JWSTransactionDecodedPayload;
  renewal?: JWSRenewalInfoDecodedPayload | null;
  eventDate: Date;
  expectedUserId?: string;
  now?: Date;
}): Promise<ApplyResult> {
  const update = appleSubscriptionUpdate(transaction, renewal, now);
  if (!update) return { applied: false, reason: "unknown_product" };

  const originalTransactionId = transaction.originalTransactionId || "";
  const token = normalizeToken(transaction.appAccountToken);

  const fields = "_id plan isPremium subscriptionSource stripeSubscriptionId appleAccountToken appleOriginalTransactionId appleLastEventAt";
  const byToken = token ? await User.findOne({ appleAccountToken: token }).select(fields) : null;
  const byTransaction = originalTransactionId ? await User.findOne({ appleOriginalTransactionId: originalTransactionId }).select(fields) : null;

  // L'abonnement Apple est déjà rattaché à un autre compte que celui désigné.
  if (byToken && byTransaction && String(byToken._id) !== String(byTransaction._id)) {
    return { applied: false, reason: "other_account", userId: String(byTransaction._id) };
  }

  let user = byToken ?? byTransaction;

  if (expectedUserId) {
    if (user && String(user._id) !== expectedUserId) return { applied: false, reason: "other_account", userId: String(user._id) };
    // Achat sans identifiant de compte (rare) et encore rattaché à personne : on le lie au compte connecté.
    if (!user && !token) user = await User.findById(expectedUserId).select(fields);
  }

  if (!user) return { applied: false, reason: "user_not_found" };
  const userId = String(user._id);

  if (user.appleLastEventAt && eventDate.getTime() < new Date(user.appleLastEventAt).getTime()) {
    return { applied: false, reason: "stale", userId };
  }

  const link = {
    appleOriginalTransactionId: originalTransactionId || undefined,
    appleProductId: transaction.productId,
    appleEnvironment: transaction.environment ? String(transaction.environment) : undefined,
    appleLastEventAt: eventDate,
  };

  // Un abonnement Stripe en cours garde la main : on mémorise le lien Apple
  // sans toucher à la formule (le site empêche normalement ce double paiement).
  const stripeActive = user.subscriptionSource !== "apple" && user.isPremium && Boolean(user.stripeSubscriptionId);
  if (stripeActive) {
    await User.updateOne({ _id: user._id }, { $set: link });
    return { applied: false, reason: "stripe_active", userId };
  }

  // Abonnement Apple terminé alors que le compte est abonné autrement : rien à retirer.
  if (!update.isPremium && user.subscriptionSource !== "apple" && user.isPremium) {
    await User.updateOne({ _id: user._id }, { $set: link });
    return { applied: false, reason: "stripe_active", userId };
  }

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        ...link,
        ...update,
        ...(update.isPremium && transaction.purchaseDate ? { lastPaymentAt: new Date(transaction.purchaseDate) } : {}),
        ...(update.isPremium && transaction.originalPurchaseDate ? { premiumStartedAt: new Date(transaction.originalPurchaseDate) } : {}),
      },
    }
  );

  return { applied: true, userId, update };
}
