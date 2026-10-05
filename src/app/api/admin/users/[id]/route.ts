// src/app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { moveAccountToTrash } from "@/lib/account-trash";
import { connectDB } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { RETENTION_DAYS } from "@/models/DeletedAccount";
import { User } from "@/models/User";

/**
 * DELETE /api/admin/users/[id]
 *
 * Suppression d'une utilisatrice par un admin.
 *
 * Le compte et toutes ses données quittent le site immédiatement (les
 * statistiques publiques et les compteurs restent donc cohérents), mais ils
 * sont conservés RETENTION_DAYS jours dans la corbeille admin, d'où ils
 * peuvent être restaurés. Passé ce délai, ils sont effacés définitivement,
 * photos comprises (voir src/lib/account-trash.ts).
 *
 * Étapes :
 * 1. Vérifier que l'appelant est bien admin.
 * 2. Empêcher la suppression de soi-même ou d'un autre admin.
 * 3. Programmer l'arrêt de l'abonnement Stripe en fin de période (sans
 *    remboursement) ; annulé si le compte est restauré à temps.
 * 4. Mettre le compte en corbeille.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    await connectDB();

    const adminUser = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("_id role");

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (adminUser._id.toString() === id) {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer votre propre compte depuis cet écran." },
        { status: 400 }
      );
    }

    const target = await User.findById(id).select(
      "_id email role stripeSubscriptionId"
    );

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Utilisatrice introuvable." },
        { status: 404 }
      );
    }

    if (target.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer un autre compte admin." },
        { status: 400 }
      );
    }

    const userId = target._id;

    // ── 1. Annuler l'abonnement Stripe (fin de période, pas de remboursement) ──
    if (target.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(target.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch {
        // Non bloquant — on continue la suppression même si Stripe échoue.
      }
    }

    // ── 2. Mettre le compte et ses données en corbeille ─────────────────────
    await moveAccountToTrash(userId, {
      id: adminUser._id.toString(),
      email: session.user.email.toLowerCase().trim(),
    });

    return NextResponse.json(
      {
        success: true,
        message: `${target.email} a été supprimée. Le compte reste récupérable ${RETENTION_DAYS} jours dans la corbeille.`,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur DELETE /api/admin/users/[id] :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
