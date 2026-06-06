// src/app/api/stripe/reactivate/route.ts
//
// POST /api/stripe/reactivate
//
// Réactive un abonnement en cours d'annulation (cancel_at_period_end = true).
// Uniquement si l'abonnement n'est pas encore expiré.

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
    return NextResponse.json({ success: false, error: "Aucun abonnement trouvé." }, { status: 400 });
  }

  try {
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
      // Si l'abonnement était en pause, on la lève aussi
      pause_collection: "",
    } as any);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        subscriptionCancelAtPeriodEnd: false,
        subscriptionPaused: false,
        subscriptionStatus: "active",
        isPremium: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement réactivé avec succès.",
      status: subscription.status,
    });
  } catch (err: any) {
    console.error("Erreur réactivation Stripe :", err);
    return NextResponse.json(
      { success: false, error: "Erreur Stripe lors de la réactivation." },
      { status: 500 }
    );
  }
}
