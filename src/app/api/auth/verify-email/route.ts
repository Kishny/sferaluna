// src/app/api/auth/verify-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendWelcomeEmail } from "@/lib/emails";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/auth?error=token_manquant", req.url)
      );
    }

    await connectDB();

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpiry");

    if (!user) {
      return NextResponse.redirect(
        new URL("/auth?error=lien_invalide_ou_expire", req.url)
      );
    }

    // Marquer l'email comme vérifié
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpiry = null;
    await user.save();

    // Email de bienvenue (non bloquant)
    sendWelcomeEmail(user.email, user.pseudonyme).catch((err) =>
      console.error("Erreur email bienvenue :", err)
    );

    return NextResponse.redirect(
      new URL("/auth?verified=true", req.url)
    );
  } catch (err) {
    console.error("GET /api/auth/verify-email :", err);
    return NextResponse.redirect(new URL("/auth?error=erreur_serveur", req.url));
  }
}
