// src/app/api/identity-verification/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * POST /api/identity-verification
 *
 * Crée une session Stripe Identity pour vérifier l'identité de l'utilisateur connecté.
 * Retourne le client_secret à utiliser côté client avec le SDK Stripe.js.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; email?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });
  }

  await connectDB();

  const dbUser = await User.findById(user.id);
  if (!dbUser) {
    return NextResponse.json({ error: "Utilisatrice introuvable." }, { status: 404 });
  }

  if (dbUser.identityVerified) {
    return NextResponse.json(
      { error: "Identité déjà vérifiée." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://sferaluna.com";

  const verificationSession = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { userId: user.id },
    options: {
      document: {
        allowed_types: ["id_card", "passport", "driving_license"],
        require_id_number: false,
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
    return_url: `${appUrl}/mon-compte?verification=success`,
  });

  // Sauvegarder l'ID de session en base
  await User.findByIdAndUpdate(user.id, {
    stripeVerificationSessionId: verificationSession.id,
    identityVerificationStatus: "pending",
  });

  return NextResponse.json({
    url: verificationSession.url,
    sessionId: verificationSession.id,
  });
}

/**
 * GET /api/identity-verification
 *
 * Retourne le statut de vérification de l'utilisateur connecté.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string } | undefined;

  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });
  }

  await connectDB();

  const dbUser = await User.findById(user.id).select(
    "identityVerified identityVerificationStatus stripeVerificationSessionId"
  );

  if (!dbUser) {
    return NextResponse.json({ error: "Utilisatrice introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    identityVerified: dbUser.identityVerified,
    identityVerificationStatus: dbUser.identityVerificationStatus,
  });
}
