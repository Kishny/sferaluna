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
 * le frontend n'envoie jamais un prix.
 * Il envoie uniquement un identifiant de plan.
 * Le vrai priceId Stripe est choisi ici, côté serveur.
 */
type CheckoutPlan = "essential-monthly" | "premium-monthly" | "elite-monthly";

/**
 * Liste des plans autorisés.
 * Elle sert à valider proprement ce que le frontend envoie.
 */
const allowedPlans: CheckoutPlan[] = [
  "essential-monthly",
  "premium-monthly",
  "elite-monthly",
];

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
 * POST /api/stripe/create-checkout-session
 *
 * Crée une session Stripe Checkout pour l'utilisateur connecté.
 */
export async function POST(req: NextRequest) {
  try {
    /**
     * 1. Vérifier que l'utilisateur est connecté.
     */
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

    /**
     * 2. Lire et valider le plan envoyé par le frontend.
     */
    const body = await req.json();
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

    /**
     * 3. Récupérer le priceId Stripe associé au plan.
     */
    const priceId = getStripePriceId(plan);

    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          error: `Price ID Stripe manquant pour le plan : ${plan}`,
          code: "MISSING_STRIPE_PRICE_ID",
        },
        { status: 500 }
      );
    }

    /**
     * 4. Vérifier l'URL publique de l'application.
     */
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

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

    /**
     * 5. Récupérer l'utilisateur MongoDB connecté.
     */
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

    /**
     * 6. Créer ou réutiliser le client Stripe.
     *
     * On stocke stripeCustomerId dans MongoDB pour éviter de créer
     * plusieurs clients Stripe pour le même utilisateur.
     */
    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.pseudonyme || user.name || "Utilisateur SferaLuna",
        metadata: {
          userId: user._id.toString(),
          email: user.email,
        },
      });

      stripeCustomerId = customer.id;

      /**
       * On rattache le customer Stripe à l'utilisateur MongoDB.
       */
      user.stripeCustomerId = stripeCustomerId;
    }

    /**
     * 7. Enregistrer le plan choisi avant paiement.
     *
     * Important :
     * - plan = choix utilisateur ;
     * - subscriptionStatus reste inactive tant que le webhook Stripe
     *   n'a pas confirmé le paiement ;
     * - isPremium reste false tant que le webhook n'a pas validé.
     */
    user.plan = plan;
    user.isPremium = false;
    user.subscriptionStatus = "inactive";

    /**
     * Amélioration demandée :
     * Mongoose valide explicitement le document avant la sauvegarde.
     *
     * user.save() valide déjà par défaut, mais validateBeforeSave()
     * permet de détecter clairement les incohérences du modèle avant save().
     */
    await user.validate();

    /**
     * Sauvegarde réelle en base de données.
     */
    await user.save();

    /**
     * 8. Créer la session Stripe Checkout.
     *
     * mode: "subscription" car SferaLuna fonctionne par abonnement mensuel.
     */
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      payment_method_types: ["card"],

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      /**
       * URLs de retour.
       * La validation réelle se fait quand même via le webhook.
       */
      success_url: `${appUrl}/mon-compte?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/paiement?payment=cancelled`,

      /**
       * Metadata utilisée par le webhook pour retrouver l'utilisateur.
       */
      metadata: {
        userId: user._id.toString(),
        email: user.email,
        plan,
      },

      /**
       * Metadata aussi attachée à l'abonnement Stripe.
       * Très utile pour customer.subscription.created/updated/deleted.
       */
      subscription_data: {
        metadata: {
          userId: user._id.toString(),
          email: user.email,
          plan,
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

    console.log("✅ Session Stripe Checkout créée :", {
      email: user.email,
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
      code?: number;
      message?: string;
      errors?: unknown;
      keyPattern?: Record<string, unknown>;
    };

    /**
     * Erreur Mongoose : validation du modèle User.
     * Exemple : plan non autorisé dans l'enum, champ manquant, etc.
     */
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

    /**
     * Erreur MongoDB : doublon, souvent email unique.
     */
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