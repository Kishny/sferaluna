// src/app/api/stripe/pause/route.ts
//
// POST /api/stripe/pause
//
// Met en pause la collecte de paiements (pause_collection).
// L'abonnement reste actif mais Stripe ne prélève plus.
// Utiliser /api/stripe/reactivate pour reprendre.

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
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      pause_collection: {
        behavior: "mark_uncollectible",
      },
    });

    await User.findByIdAndUpdate(user._id, {
      $set: {
        subscriptionPaused: true,
        subscriptionCancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement mis en pause. Aucun prélèvement ne sera effectué.",
      paused: true,
    });
  } catch (err: any) {
    console.error("Erreur pause Stripe :", err);
    return NextResponse.json(
      { success: false, error: "Erreur Stripe lors de la mise en pause." },
      { status: 500 }
    );
  }
}
