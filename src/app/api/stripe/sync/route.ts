// src/app/api/stripe/sync/route.ts
//
// POST /api/stripe/sync
//
// Synchronise manuellement l'état de l'abonnement Stripe → MongoDB.
// Utile quand le webhook n'a pas pu activer le premium correctement
// (délai Stripe, secret webhook incorrect en prod, etc.).
//
// Sécurité :
// - nécessite une session NextAuth valide
// - lit uniquement depuis Stripe, n'accepte aucun param du client
// - met à jour uniquement les champs liés à l'abonnement

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
    return NextResponse.json(
      { success: false, error: "Non autorisé." },
      { status: 401 }
    );
  }

  await connectDB();

  const user = await User.findOne({
    email: session.user.email.toLowerCase().trim(),
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Utilisatrice introuvable." },
      { status: 404 }
    );
  }

  // Si pas de customer Stripe → rien à synchroniser
  if (!user.stripeCustomerId) {
    return NextResponse.json({
      success: true,
      synced: false,
      message: "Aucun compte Stripe associé.",
      plan: user.plan ?? "free",
      subscriptionStatus: user.subscriptionStatus ?? "inactive",
      isPremium: user.isPremium ?? false,
    });
  }

  try {
    // Récupérer tous les abonnements actifs du customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 5,
    });

    // Chercher le meilleur abonnement : active > trialing > past_due > others
    const priority = ["active", "trialing", "past_due", "incomplete", "canceled"];
    const sorted = subscriptions.data.sort(
      (a, b) => priority.indexOf(a.status) - priority.indexOf(b.status)
    );

    const best = sorted[0] ?? null;

    if (!best) {
      // Pas d'abonnement → forcer free
      await User.findByIdAndUpdate(user._id, {
        $set: {
          isPremium: false,
          subscriptionStatus: "inactive",
          plan: "free",
        },
      });

      return NextResponse.json({
        success: true,
        synced: true,
        message: "Aucun abonnement Stripe trouvé. Plan réinitialisé à Free.",
        plan: "free",
        subscriptionStatus: "inactive",
        isPremium: false,
      });
    }

    const isActive = best.status === "active" || best.status === "trialing";

    // Lire le plan depuis les metadata de l'abonnement
    const planFromMeta = best.metadata?.plan;
    const validPlans = ["essential-monthly", "premium-monthly", "elite-monthly"];
    const plan = validPlans.includes(planFromMeta) ? planFromMeta : user.plan;

    // Mapper le statut
    const statusMap: Record<string, string> = {
      active: "active",
      trialing: "trialing",
      past_due: "past_due",
      canceled: "canceled",
      incomplete: "inactive",
      incomplete_expired: "inactive",
      paused: "inactive",
      unpaid: "past_due",
    };
    const subscriptionStatus = statusMap[best.status] ?? "inactive";

    const currentPeriodEnd =
      typeof (best as any).current_period_end === "number"
        ? new Date((best as any).current_period_end * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        isPremium: isActive,
        subscriptionStatus,
        plan: plan ?? user.plan,
        stripeSubscriptionId: best.id,
        premiumExpiresAt: currentPeriodEnd,
        ...(isActive ? { premiumStartedAt: user.premiumStartedAt ?? new Date() } : {}),
        ...(isActive ? { lastPaymentAt: user.lastPaymentAt ?? new Date() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      synced: true,
      message: `Synchronisé depuis Stripe : ${best.status}`,
      plan: plan ?? user.plan,
      subscriptionStatus,
      isPremium: isActive,
      stripeSubscriptionId: best.id,
      stripeStatus: best.status,
    });
  } catch (err: any) {
    console.error("Erreur sync Stripe :", err);
    return NextResponse.json(
      { success: false, error: "Erreur Stripe lors de la synchronisation." },
      { status: 500 }
    );
  }
}
