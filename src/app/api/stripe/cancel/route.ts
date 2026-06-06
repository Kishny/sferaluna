// src/app/api/stripe/cancel/route.ts
//
// POST /api/stripe/cancel
//
// Annule l'abonnement Stripe à la fin de la période en cours.
// L'utilisatrice garde l'accès premium jusqu'à premiumExpiresAt.
// À la date d'expiration, le webhook customer.subscription.deleted prend le relais.

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });

  if (!user) {
    return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });
  }

  if (!user.stripeSubscriptionId) {
    return NextResponse.json({ success: false, error: "Aucun abonnement actif." }, { status: 400 });
  }

  try {
    // Annuler à la fin de la période (pas immédiatement)
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    // Mettre à jour MongoDB pour refléter l'annulation programmée
    await User.findByIdAndUpdate(user._id, {
      $set: { subscriptionCancelAtPeriodEnd: true },
    });

    const periodEnd = typeof (subscription as any).current_period_end === "number"
      ? new Date((subscription as any).current_period_end * 1000)
      : null;

    return NextResponse.json({
      success: true,
      message: "Abonnement annulé. Vous conservez l'accès jusqu'à la fin de la période.",
      cancelAtPeriodEnd: true,
      accessUntil: periodEnd?.toISOString() ?? null,
    });
  } catch (err: any) {
    console.error("Erreur annulation Stripe :", err);
    return NextResponse.json(
      { success: false, error: "Erreur Stripe lors de l'annulation." },
      { status: 500 }
    );
  }
}
