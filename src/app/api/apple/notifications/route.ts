// src/app/api/apple/notifications/route.ts

import { NextRequest, NextResponse } from "next/server";

import {
  applyAppleTransaction,
  isAppleVerificationError,
  verifyAppleNotification,
  verifyAppleRenewalInfo,
  verifyAppleTransaction,
} from "@/lib/apple/iap";
import { connectDB } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * POST /api/apple/notifications   { signedPayload }
 *
 * Notifications de l'App Store (version 2) : renouvellement, échec de paiement,
 * résiliation, expiration, remboursement, changement de formule. C'est
 * l'équivalent, pour Apple, du webhook Stripe.
 *
 * Aucune session ici : c'est Apple qui appelle. L'authenticité repose sur la
 * signature du contenu, vérifiée jusqu'au certificat racine d'Apple.
 *
 * Réponses : 200 dès que la notification est comprise (même si elle ne change
 * rien), 400 si la signature est invalide, 500 en cas de panne — Apple renvoie
 * alors la notification plus tard.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const signedPayload = typeof body?.signedPayload === "string" ? body.signedPayload : "";
    if (!signedPayload) return NextResponse.json({ success: false, error: "signedPayload manquant." }, { status: 400 });

    let notification;
    try {
      notification = await verifyAppleNotification(signedPayload);
    } catch (error) {
      if (!isAppleVerificationError(error)) throw error;
      return NextResponse.json({ success: false, error: "Signature invalide." }, { status: 400 });
    }

    const { notificationType, subtype, data } = notification;

    // Notification de test envoyée depuis App Store Connect, ou sans transaction.
    if (!data?.signedTransactionInfo) {
      return NextResponse.json({ success: true, ignored: true, notificationType });
    }

    let transaction;
    let renewal = null;
    try {
      transaction = await verifyAppleTransaction(data.signedTransactionInfo);
      if (data.signedRenewalInfo) renewal = await verifyAppleRenewalInfo(data.signedRenewalInfo);
    } catch (error) {
      if (!isAppleVerificationError(error)) throw error;
      return NextResponse.json({ success: false, error: "Signature invalide." }, { status: 400 });
    }

    await connectDB();

    const result = await applyAppleTransaction({
      transaction,
      renewal,
      eventDate: new Date(notification.signedDate ?? Date.now()),
    });

    if (!result.applied) {
      console.log(`ℹ️ Notification Apple ${notificationType}${subtype ? `/${subtype}` : ""} non appliquée : ${result.reason}`);
    }

    return NextResponse.json({ success: true, applied: result.applied });
  } catch (error) {
    console.error("Erreur POST /api/apple/notifications :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
