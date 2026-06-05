// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import { User, type SubscriptionStatus, type UserPlan } from "@/models/User";

/**
 * Important pour Stripe Webhook avec Next.js App Router.
 *
 * Stripe a besoin du body brut via req.text().
 * Le runtime Node.js évite certains soucis liés au runtime edge.
 */
export const runtime = "nodejs";

/**
 * Plans SferaLuna payants autorisés.
 *
 * Ces valeurs doivent correspondre exactement à :
 * - src/models/User.ts
 * - src/app/paiement/page.tsx
 * - src/app/api/stripe/create-checkout-session/route.ts
 */
type LunaPlan = Exclude<UserPlan, "free">;

/**
 * Vérifie si le plan reçu depuis Stripe est bien un plan SferaLuna autorisé.
 */
function isValidLunaPlan(plan: unknown): plan is LunaPlan {
  return (
    plan === "essential-monthly" ||
    plan === "premium-monthly" ||
    plan === "elite-monthly"
  );
}

/**
 * Convertit le statut Stripe vers ton statut interne MongoDB.
 */
function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "past_due",
    incomplete: "inactive",
    incomplete_expired: "inactive",
    paused: "inactive",
  };

  return statusMap[status] || "inactive";
}

/**
 * Indique si un statut Stripe donne accès au premium.
 */
function isStripeSubscriptionPremiumActive(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing";
}

/**
 * Récupère une date d’expiration depuis l’abonnement Stripe quand possible.
 *
 * Selon la version de Stripe/types, current_period_end peut être typé
 * différemment. On sécurise donc avec un accès défensif.
 *
 * Fallback :
 * - si Stripe ne fournit pas de date exploitable ;
 * - on met +30 jours, car les offres actuelles sont mensuelles.
 */
function getPremiumExpirationDateFromSubscription(
  subscription?: Stripe.Subscription | null
) {
  const rawCurrentPeriodEnd = (subscription as any)?.current_period_end;

  if (typeof rawCurrentPeriodEnd === "number") {
    return new Date(rawCurrentPeriodEnd * 1000);
  }

  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

/**
 * Récupère un abonnement Stripe complet si on possède son ID.
 *
 * Utile dans checkout.session.completed, car checkoutSession.subscription
 * peut être uniquement une string.
 */
async function retrieveSubscription(subscriptionId?: string | null) {
  if (!subscriptionId) return null;

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error("❌ Impossible de récupérer l'abonnement Stripe :", error);
    return null;
  }
}

/**
 * Récupère proprement l'id d'abonnement depuis une checkout session.
 */
function getSubscriptionIdFromCheckoutSession(
  checkoutSession: Stripe.Checkout.Session
) {
  if (typeof checkoutSession.subscription === "string") {
    return checkoutSession.subscription;
  }

  return checkoutSession.subscription?.id || "";
}

/**
 * Met à jour l'utilisateur après paiement ou synchronisation Stripe.
 *
 * Cette fonction centralise la logique pour éviter les incohérences entre :
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 */
async function syncPremiumUserFromSubscription({
  userId,
  plan,
  subscription,
  checkoutSessionId,
  forceActive = false,
}: {
  userId: string;
  plan?: LunaPlan;
  subscription?: Stripe.Subscription | null;
  checkoutSessionId?: string;
  forceActive?: boolean;
}) {
  const stripeStatus = subscription?.status;

  const subscriptionStatus: SubscriptionStatus = stripeStatus
    ? mapStripeSubscriptionStatus(stripeStatus)
    : forceActive
      ? "active"
      : "inactive";

  const isPremium = stripeStatus
    ? isStripeSubscriptionPremiumActive(stripeStatus)
    : forceActive;

  const subscriptionId = subscription?.id || "";

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        ...(plan ? { plan } : {}),
        isPremium,
        subscriptionStatus,
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
        ...(checkoutSessionId
          ? { stripeCheckoutSessionId: checkoutSessionId }
          : {}),
        ...(isPremium
          ? {
              premiumStartedAt: new Date(),
              premiumExpiresAt:
                getPremiumExpirationDateFromSubscription(subscription),
              lastPaymentAt: new Date(),
            }
          : {}),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
}

/**
 * Désactive l'accès Premium après suppression/annulation Stripe.
 */
async function disablePremiumUser({
  userId,
  subscriptionId,
}: {
  userId: string;
  subscriptionId?: string;
}) {
  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        isPremium: false,
        subscriptionStatus: "canceled",
        premiumExpiresAt: new Date(),
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );
}

/**
 * POST /api/stripe/webhook
 *
 * Cette route reçoit les événements envoyés par Stripe.
 *
 * Important :
 * - Le retour navigateur /mon-compte?payment=success ne suffit pas.
 * - Seul le webhook Stripe doit activer réellement Premium en base de données.
 * - Il faut utiliser req.text(), jamais req.json(), pour vérifier la signature Stripe.
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "STRIPE_WEBHOOK_SECRET est manquant.",
      },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      {
        success: false,
        error: "Signature Stripe manquante.",
      },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    /**
     * Stripe exige le body brut pour vérifier la signature.
     */
    const rawBody = await req.text();

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error: unknown) {
    console.error("❌ Signature webhook Stripe invalide :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Signature webhook invalide.",
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    switch (event.type) {
      /**
       * 1. Checkout terminé.
       *
       * C'est l'événement principal après un paiement réussi via Stripe Checkout.
       * On active ici l'accès Premium, idéalement en récupérant l'abonnement Stripe.
       */
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as Stripe.Checkout.Session;

        const userId = checkoutSession.metadata?.userId;
        const rawPlan = checkoutSession.metadata?.plan;
        const plan = isValidLunaPlan(rawPlan) ? rawPlan : undefined;

        const subscriptionId =
          getSubscriptionIdFromCheckoutSession(checkoutSession);

        if (!userId || !plan) {
          console.warn("⚠️ Metadata Stripe manquante ou invalide :", {
            eventId: event.id,
            userId,
            rawPlan,
          });

          return NextResponse.json(
            {
              received: true,
              warning: "Metadata Stripe manquante ou invalide.",
            },
            { status: 200 }
          );
        }

        const subscription = await retrieveSubscription(subscriptionId);

        await syncPremiumUserFromSubscription({
          userId,
          plan,
          subscription,
          checkoutSessionId: checkoutSession.id,
          forceActive: true,
        });

        console.log("✅ Checkout Stripe confirmé :", {
          userId,
          plan,
          checkoutSessionId: checkoutSession.id,
          subscriptionId,
        });

        break;
      }

      /**
       * 2. Abonnement créé.
       *
       * Stripe l'envoie souvent juste après Checkout.
       * Ici on synchronise l'id d'abonnement et le statut.
       */
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;
        const rawPlan = subscription.metadata?.plan;
        const plan = isValidLunaPlan(rawPlan) ? rawPlan : undefined;

        if (!userId) {
          console.warn("⚠️ Subscription created sans userId metadata :", {
            eventId: event.id,
            subscriptionId: subscription.id,
          });

          break;
        }

        await syncPremiumUserFromSubscription({
          userId,
          plan,
          subscription,
        });

        console.log("✅ Abonnement Stripe créé :", {
          userId,
          plan,
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        break;
      }

      /**
       * 3. Abonnement mis à jour.
       *
       * Cas possibles :
       * - paiement en retard ;
       * - abonnement réactivé ;
       * - période d'essai ;
       * - changement de statut ;
       * - passage actif vers past_due.
       */
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;
        const rawPlan = subscription.metadata?.plan;
        const plan = isValidLunaPlan(rawPlan) ? rawPlan : undefined;

        if (!userId) {
          console.warn("⚠️ Subscription updated sans userId metadata :", {
            eventId: event.id,
            subscriptionId: subscription.id,
          });

          break;
        }

        await syncPremiumUserFromSubscription({
          userId,
          plan,
          subscription,
        });

        console.log("✅ Abonnement Stripe mis à jour :", {
          userId,
          plan,
          subscriptionId: subscription.id,
          status: subscription.status,
        });

        break;
      }

      /**
       * 4. Abonnement supprimé ou annulé.
       *
       * Dans ce cas, on retire l'accès Premium.
       */
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        const userId = subscription.metadata?.userId;

        if (!userId) {
          console.warn("⚠️ Subscription deleted sans userId metadata :", {
            eventId: event.id,
            subscriptionId: subscription.id,
          });

          break;
        }

        await disablePremiumUser({
          userId,
          subscriptionId: subscription.id,
        });

        console.log("✅ Abonnement Stripe supprimé / annulé :", {
          userId,
          subscriptionId: subscription.id,
        });

        break;
      }

      /**
       * 5. Vérification d'identité réussie.
       */
      case "identity.verification_session.verified": {
        const verificationSession =
          event.data.object as Stripe.Identity.VerificationSession;

        const userId = verificationSession.metadata?.userId;

        if (!userId) {
          console.warn("⚠️ Vérification identité sans userId metadata :", {
            eventId: event.id,
            verificationSessionId: verificationSession.id,
          });

          break;
        }

        await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              identityVerified: true,
              identityVerificationStatus: "verified",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        console.log("✅ Identité vérifiée :", {
          userId,
          verificationSessionId: verificationSession.id,
        });

        break;
      }

      /**
       * 6. Vérification d'identité échouée ou action requise.
       */
      case "identity.verification_session.requires_input": {
        const verificationSession =
          event.data.object as Stripe.Identity.VerificationSession;

        const userId = verificationSession.metadata?.userId;

        if (!userId) {
          console.warn("⚠️ Vérification identité requires_input sans userId :", {
            eventId: event.id,
            verificationSessionId: verificationSession.id,
          });

          break;
        }

        await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              identityVerified: false,
              identityVerificationStatus: "failed",
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );

        console.log("⚠️ Vérification identité échouée/action requise :", {
          userId,
          verificationSessionId: verificationSession.id,
        });

        break;
      }

      /**
       * Events Stripe non traités.
       *
       * On répond quand même 200 pour éviter les retries inutiles Stripe.
       */
      default: {
        console.log("ℹ️ Event Stripe ignoré :", event.type);
        break;
      }
    }

    /**
     * Réponse obligatoire pour Stripe.
     * Si Stripe reçoit un 200, il considère que l'événement est traité.
     */
    return NextResponse.json(
      {
        received: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ Erreur traitement webhook Stripe :", error);

    const err = error as {
      name?: string;
      message?: string;
      errors?: unknown;
      code?: number | string;
    };

    /**
     * Erreur Mongoose validation.
     */
    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation MongoDB dans le webhook Stripe.",
          details: err.errors,
          code: "WEBHOOK_DB_VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur webhook Stripe.",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
        code: "STRIPE_WEBHOOK_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}