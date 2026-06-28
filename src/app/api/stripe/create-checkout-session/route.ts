// src/app/api/stripe/create-checkout-session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "../../auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { stripe } from "@/lib/stripe";

/**
 * Plans Stripe acceptés côté serveur.
 *
 * Important :
 * Le frontend n'envoie jamais un prix.
 * Il envoie uniquement un identifiant de plan.
 * Le vrai priceId Stripe est choisi ici, côté serveur.
 */
type CheckoutPlan = "essential-monthly" | "premium-monthly" | "elite-monthly";

/**
 * Liste des plans autorisés.
 *
 * Cette liste sert à empêcher qu'un utilisateur envoie une valeur arbitraire
 * comme "free", "admin", "0-euro", etc.
 */
const allowedPlans: CheckoutPlan[] = [
  "essential-monthly",
  "premium-monthly",
  "elite-monthly",
];

/**
 * Labels utiles pour les logs, metadata Stripe ou affichages futurs.
 */
const planLabels: Record<CheckoutPlan, string> = {
  "essential-monthly": "Essentiel",
  "premium-monthly": "Premium",
  "elite-monthly": "Elite",
};

/**
 * Vérifie qu'une valeur reçue est bien un plan SferaLuna valide.
 */
function isCheckoutPlan(plan: unknown): plan is CheckoutPlan {
  return typeof plan === "string" && allowedPlans.includes(plan as CheckoutPlan);
}

/**
 * Retourne le priceId Stripe correspondant au plan choisi.
 *
 * Ces variables doivent exister dans .env.local :
 * - STRIPE_PRICE_ESSENTIAL_MONTHLY
 * - STRIPE_PRICE_PREMIUM_MONTHLY
 * - STRIPE_PRICE_ELITE_MONTHLY
 */
function getStripePriceId(plan: CheckoutPlan) {
  const prices: Record<CheckoutPlan, string | undefined> = {
    "essential-monthly": process.env.STRIPE_PRICE_ESSENTIAL_MONTHLY,
    "premium-monthly": process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    "elite-monthly": process.env.STRIPE_PRICE_ELITE_MONTHLY,
  };

  return prices[plan] || null;
}

/**
 * Nettoie l'URL publique de l'application.
 *
 * Exemple :
 * NEXT_PUBLIC_APP_URL=http://localhost:3000/
 * devient :
 * http://localhost:3000
 */
function getCleanAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) return null;

  return appUrl.replace(/\/$/, "");
}

/**
 * POST /api/stripe/create-checkout-session
 *
 * Crée une session Stripe Checkout pour l'utilisateur connecté.
 *
 * Étapes :
 * 1. Vérifier la session NextAuth.
 * 2. Lire le plan envoyé par le frontend.
 * 3. Vérifier que le plan est autorisé.
 * 4. Récupérer le Price ID Stripe correspondant.
 * 5. Récupérer l'utilisateur MongoDB.
 * 6. Créer ou réutiliser un customer Stripe.
 * 7. Enregistrer le plan choisi en attente.
 * 8. Créer une session Checkout.
 * 9. Renvoyer l'URL Stripe au frontend.
 */
export async function POST(req: NextRequest) {
  try {
    // ─────────────────────────────────────────────
    // 1. Vérifier que l'utilisateur est connecté
    // ─────────────────────────────────────────────

    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé. Veuillez vous connecter.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // ─────────────────────────────────────────────
    // 2. Lire et valider le body JSON
    // ─────────────────────────────────────────────

    let body: { plan?: unknown } | null = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Body JSON invalide.",
          code: "INVALID_JSON_BODY",
        },
        { status: 400 }
      );
    }

    const plan = body?.plan;

    if (!isCheckoutPlan(plan)) {
      console.log("❌ Plan reçu invalide :", plan);

      return NextResponse.json(
        {
          success: false,
          error: "Plan premium invalide.",
          receivedPlan: plan || null,
          allowedPlans,
          code: "INVALID_PLAN",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // 3. Récupérer le Price ID Stripe
    // ─────────────────────────────────────────────

    const priceId = getStripePriceId(plan);

    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          error: `Price ID Stripe manquant pour le plan : ${plan}`,
          expectedEnv:
            plan === "essential-monthly"
              ? "STRIPE_PRICE_ESSENTIAL_MONTHLY"
              : plan === "premium-monthly"
                ? "STRIPE_PRICE_PREMIUM_MONTHLY"
                : "STRIPE_PRICE_ELITE_MONTHLY",
          code: "MISSING_STRIPE_PRICE_ID",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────
    // 4. Vérifier l'URL publique de l'application
    // ─────────────────────────────────────────────

    const appUrl = getCleanAppUrl();

    if (!appUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "NEXT_PUBLIC_APP_URL est manquant dans .env.local.",
          code: "MISSING_APP_URL",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────
    // 5. Récupérer l'utilisateur MongoDB connecté
    // ─────────────────────────────────────────────

    await connectDB();

    const email = session.user.email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // ─────────────────────────────────────────────
    // 6. Créer ou réutiliser le customer Stripe
    // ─────────────────────────────────────────────

    let stripeCustomerId =
      typeof user.stripeCustomerId === "string" ? user.stripeCustomerId : "";

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.pseudonyme || user.name || "Utilisateur SferaLuna",
        metadata: {
          userId: user._id.toString(),
          email: user.email,
          source: "sferaluna",
        },
      });

      stripeCustomerId = customer.id;

      /**
       * On rattache le customer Stripe à l'utilisateur MongoDB
       * pour éviter de créer plusieurs customers pour le même compte.
       */
      user.stripeCustomerId = stripeCustomerId;
    }

    // ─────────────────────────────────────────────
    // 7. Enregistrer le plan choisi avant paiement
    // ─────────────────────────────────────────────

    /**
     * Ici on garde une trace du plan choisi.
     *
     * Important :
     * - subscriptionStatus reste "inactive" tant que le webhook Stripe
     *   n'a pas confirmé le paiement ;
     * - isPremium reste false tant que le webhook n'a pas validé ;
     * - le webhook sera la vraie source de vérité.
     */
    user.plan = plan;
    user.isPremium = false;
    user.subscriptionStatus = "inactive";
    user.stripeCheckoutSessionId = "";

    // validateModifiedOnly : on ne valide que les champs modifiés ici.
    // Évite qu'un champ déjà invalide ailleurs sur le document (ex : un
    // pseudonyme vide laissé par un ancien flux d'inscription) bloque le
    // paiement d'un utilisateur qui n'a pas touché à ce champ.
    await user.save({ validateModifiedOnly: true });

    // ─────────────────────────────────────────────
    // 8. Créer la session Stripe Checkout
    // ─────────────────────────────────────────────

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      client_reference_id: user._id.toString(),

      // Stripe Checkout affiche automatiquement les moyens de paiement
      // activés dans le Dashboard (CB, PayPal, Apple Pay, Google Pay, etc.)
      // sans qu'il soit nécessaire de préciser de paramètre ici.
      // (`automatic_payment_methods` n'est pas un paramètre valide pour
      // checkout.sessions.create — il appartient à l'API PaymentIntents.)

      // Désactiver la collecte d'identifiant fiscal (TVA / numéro fiscal).
      // Stripe le demande parfois pour PayPal en Europe — on le désactive
      // car SferaLuna est un service B2C grand public, pas B2B.
      tax_id_collection: { enabled: false },

      allow_promotion_codes: true,
      billing_address_collection: "auto",

      customer_update: {
        name: "auto",
        address: "auto",
      },

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      /**
       * URLs de retour.
       *
       * Attention :
       * Même si l'utilisateur revient sur success_url,
       * la vraie activation Premium doit être faite par le webhook Stripe.
       */
      success_url: `${appUrl}/mon-compte?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/paiement?payment=cancelled`,

      /**
       * Metadata attachée à la session Checkout.
       * Le webhook pourra s'en servir pour retrouver l'utilisateur.
       */
      metadata: {
        userId: user._id.toString(),
        email: user.email,
        plan,
        planLabel: planLabels[plan],
      },

      /**
       * Metadata attachée à l'abonnement Stripe.
       * Très utile pour :
       * - customer.subscription.created
       * - customer.subscription.updated
       * - customer.subscription.deleted
       */
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          email: user.email,
          plan,
          planLabel: planLabels[plan],
        },
      },
    });

    if (!checkoutSession.url) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe n'a pas renvoyé d'URL Checkout.",
          code: "NO_CHECKOUT_URL",
        },
        { status: 500 }
      );
    }

    /**
     * On stocke l'ID de session Checkout.
     * Pratique pour debug, support client et vérifications futures.
     */
    user.stripeCheckoutSessionId = checkoutSession.id;
    await user.save({ validateModifiedOnly: true });

    console.log("✅ Session Stripe Checkout créée :", {
      email: user.email,
      userId: user._id.toString(),
      plan,
      priceId,
      checkoutSessionId: checkoutSession.id,
    });

    return NextResponse.json(
      {
        success: true,
        url: checkoutSession.url,
        checkoutSessionId: checkoutSession.id,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ Erreur création session Stripe :", error);

    const err = error as {
      name?: string;
      type?: string;
      code?: number | string;
      message?: string;
      errors?: unknown;
      keyPattern?: Record<string, unknown>;
    };

    // ─────────────────────────────────────────────
    // Erreur Mongoose : validation du modèle User
    // ─────────────────────────────────────────────

    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation MongoDB avant création Stripe.",
          details: err.errors,
          code: "DB_VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // ─────────────────────────────────────────────
    // Erreur MongoDB : doublon
    // ─────────────────────────────────────────────

    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Une donnée existe déjà.",
          field: err.keyPattern ? Object.keys(err.keyPattern)[0] : null,
          code: "DUPLICATE_KEY",
        },
        { status: 409 }
      );
    }

    // ─────────────────────────────────────────────
    // Erreur Stripe
    // ─────────────────────────────────────────────

    if (err.type && String(err.type).startsWith("Stripe")) {
      return NextResponse.json(
        {
          success: false,
          error: "Stripe a refusé la création de la session.",
          message:
            process.env.NODE_ENV === "development"
              ? err.message
              : "Une erreur est survenue avec Stripe.",
          code: "STRIPE_ERROR",
        },
        { status: 500 }
      );
    }

    // ─────────────────────────────────────────────
    // Erreur générique
    // ─────────────────────────────────────────────

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de la session Stripe.",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
        code: "STRIPE_CHECKOUT_SESSION_ERROR",
      },
      { status: 500 }
    );
  }
}