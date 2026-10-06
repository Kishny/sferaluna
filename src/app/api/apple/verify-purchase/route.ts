// src/app/api/apple/verify-purchase/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { applyAppleTransaction, isAppleVerificationError, verifyAppleTransaction } from "@/lib/apple/iap";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const runtime = "nodejs";

/**
 * POST /api/apple/verify-purchase   { signedTransaction }
 *
 * Appelée par l'app iPhone juste après un achat intégré ou une restauration.
 * `signedTransaction` est la preuve d'achat signée par Apple (JWS) : on vérifie
 * sa signature, qu'elle concerne bien cette app et ce compte, puis on active la
 * formule. Rien n'est accordé sur la seule parole de l'app.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });

    const body = await req.json().catch(() => null);
    const signedTransaction = typeof body?.signedTransaction === "string" ? body.signedTransaction : "";
    if (!signedTransaction) {
      return NextResponse.json({ success: false, error: "Preuve d'achat manquante.", code: "MISSING_PURCHASE" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ email }).select("_id banned");
    if (!user) return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });

    let transaction;
    try {
      transaction = await verifyAppleTransaction(signedTransaction);
    } catch (error) {
      if (!isAppleVerificationError(error)) throw error;
      return NextResponse.json(
        { success: false, error: "Cet achat n'a pas pu être vérifié auprès d'Apple.", code: "INVALID_PURCHASE" },
        { status: 400 }
      );
    }

    const result = await applyAppleTransaction({
      transaction,
      eventDate: new Date(transaction.signedDate ?? Date.now()),
      expectedUserId: user._id.toString(),
    });

    if (!result.applied) {
      if (result.reason === "other_account") {
        return NextResponse.json(
          {
            success: false,
            error: "Cet abonnement Apple est déjà rattaché à un autre compte SferaLuna.",
            code: "PURCHASE_BELONGS_TO_OTHER_ACCOUNT",
          },
          { status: 409 }
        );
      }
      if (result.reason === "unknown_product") {
        return NextResponse.json({ success: false, error: "Formule inconnue.", code: "UNKNOWN_PRODUCT" }, { status: 400 });
      }
      // "stale" (une notification plus récente est déjà passée) ou "stripe_active" :
      // rien à changer, on renvoie l'état actuel du compte.
    }

    const fresh = await User.findById(user._id).select("plan isPremium subscriptionStatus premiumExpiresAt subscriptionSource").lean();

    return NextResponse.json({
      success: true,
      applied: result.applied,
      plan: fresh?.plan ?? "free",
      isPremium: Boolean(fresh?.isPremium),
      subscriptionStatus: fresh?.subscriptionStatus ?? "inactive",
      premiumExpiresAt: fresh?.premiumExpiresAt ?? null,
      subscriptionSource: fresh?.subscriptionSource ?? null,
    });
  } catch (error) {
    console.error("Erreur POST /api/apple/verify-purchase :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur lors de la vérification de l'achat." }, { status: 500 });
  }
}
