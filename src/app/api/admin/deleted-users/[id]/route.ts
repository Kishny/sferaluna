// src/app/api/admin/deleted-users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { getAdmin } from "@/lib/admin-auth";
import { purgeAccount, restoreAccount } from "@/lib/account-trash";
import { stripe } from "@/lib/stripe";
import { User } from "@/models/User";

type Context = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/deleted-users/[id]
 *
 * Restaure un compte de la corbeille : profil, matchs, conversations,
 * publications. Si son abonnement Stripe est encore en cours, l'arrêt en fin
 * de période programmé à la suppression est annulé.
 */
export async function POST(_req: NextRequest, { params }: Context) {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });

    const { id } = await params;
    const result = await restoreAccount(id);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, code: result.code }, { status: result.code === "NOT_FOUND" ? 404 : 409 });
    }

    const restored = await User.findOne({ email: result.email }).select("stripeSubscriptionId");
    if (restored?.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(restored.stripeSubscriptionId);
        if (subscription.status !== "canceled" && subscription.cancel_at_period_end) {
          await stripe.subscriptions.update(restored.stripeSubscriptionId, { cancel_at_period_end: false });
        }
      } catch {
        // Non bloquant : le compte est restauré même si Stripe ne répond pas.
      }
    }

    return NextResponse.json({
      success: true,
      skipped: result.skipped,
      message:
        `${result.pseudonyme || result.email} a été restaurée.` +
        (result.skipped > 0 ? ` ${result.skipped} élément(s) liés à des membres supprimées depuis n'ont pas été repris.` : ""),
    });
  } catch (error) {
    console.error("Erreur POST /api/admin/deleted-users/[id] :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur lors de la restauration." }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/deleted-users/[id]
 *
 * Efface définitivement un compte de la corbeille, sans attendre l'échéance.
 */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const admin = await getAdmin();
    if (!admin) return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });

    const { id } = await params;
    if (!(await purgeAccount(id))) {
      return NextResponse.json({ success: false, error: "Compte introuvable dans la corbeille." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Compte effacé définitivement." });
  } catch (error) {
    console.error("Erreur DELETE /api/admin/deleted-users/[id] :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur lors de l'effacement." }, { status: 500 });
  }
}
