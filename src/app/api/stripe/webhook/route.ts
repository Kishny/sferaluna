// src/app/api/stripe/webhook/route.ts

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import { User, type SubscriptionStatus, type UserPlan } from "@/models/User";

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
 * Calcule une date d'expiration indicative.
 *
 * Pour l'instant, tes 3 offres sont mensuelles.
 * Donc on met +30 jours.
 *
 * Important :
 * Stripe reste la vraie source de vérité pour l'abonnement.
 * Cette date sert surtout à l'affichage rapide côté frontend.
 */
function getPremiumExpirationDate(_plan: LunaPlan) {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
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
 * POST /api/stripe/webhook
 *
 * Cette route reçoit les événements envoyés par Stripe.
 * Elle sert à confirmer réellement le paiement.
 *
 * Important :
 * - Le retour navigateur /mon-compte?payment=success ne suffit pas.
 * - Seul le webhook Stripe doit activer le premium en base de données.
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

    /**
     * 1. Checkout terminé.
     *
     * C'est l'événement principal après un paiement réussi via Stripe Checkout.
     * On active ici l'accès premium.
     */
    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as Stripe.Checkout.Session;

      const userId = checkoutSession.metadata?.userId;
      const rawPlan = checkoutSession.metadata?.plan;
      const plan = isValidLunaPlan(rawPlan) ? rawPlan : null;

      const subscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id;

      if (!userId || !plan) {

        return NextResponse.json(
          {
            received: true,
            warning: "Metadata Stripe manquante ou invalide.",
          },
          { status: 200 }
        );
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: {
            plan,
            isPremium: true,
            subscriptionStatus: "active",
            stripeSubscriptionId: subscriptionId || "",
            stripeCheckoutSessionId: checkoutSession.id,
            premiumStartedAt: new Date(),
            premiumExpiresAt: getPremiumExpirationDate(plan),
            lastPaymentAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      ).select("-password -reponse -__v");
    }

    /**
     * 2. Abonnement créé.
     *
     * Stripe l'envoie souvent juste après Checkout.
     * Ici on synchronise l'id d'abonnement et le statut.
     */
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.userId;
      const rawPlan = subscription.metadata?.plan;
      const plan = isValidLunaPlan(rawPlan) ? rawPlan : undefined;

      const subscriptionStatus = mapStripeSubscriptionStatus(
        subscription.status
      );

        userId,
        plan,
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      if (userId) {
        await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              ...(plan ? { plan } : {}),
              stripeSubscriptionId: subscription.id,
              isPremium: isStripeSubscriptionPremiumActive(subscription.status),
              subscriptionStatus,
              ...(isStripeSubscriptionPremiumActive(subscription.status)
                ? {
                    premiumStartedAt: new Date(),
                    premiumExpiresAt: plan
                      ? getPremiumExpirationDate(plan)
                      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    }

    /**
     * 3. Abonnement mis à jour.
     *
     * Cas possibles :
     * - paiement en retard
     * - abonnement réactivé
     * - période d'essai
     * - changement de statut
     */
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.userId;
      const rawPlan = subscription.metadata?.plan;
      const plan = isValidLunaPlan(rawPlan) ? rawPlan : undefined;

      const subscriptionStatus = mapStripeSubscriptionStatus(
        subscription.status
      );

        userId,
        plan,
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      if (userId) {
        const isPremium = isStripeSubscriptionPremiumActive(
          subscription.status
        );

        await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              ...(plan ? { plan } : {}),
              stripeSubscriptionId: subscription.id,
              isPremium,
              subscriptionStatus,
              ...(isPremium
                ? {
                    premiumExpiresAt: plan
                      ? getPremiumExpirationDate(plan)
                      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
    }

    /**
     * 4. Abonnement supprimé ou annulé.
     *
     * Dans ce cas, on retire l'accès premium.
     */
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;

      const userId = subscription.metadata?.userId;

        userId,
        subscriptionId: subscription.id,
        status: subscription.status,
      });

      if (userId) {
        await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              isPremium: false,
              subscriptionStatus: "canceled",
              premiumExpiresAt: new Date(),
              stripeSubscriptionId: subscription.id,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
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

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur webhook Stripe.",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}