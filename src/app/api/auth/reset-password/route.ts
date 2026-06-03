// src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendResetPasswordEmail } from "@/lib/emails";

/** POST /api/auth/reset-password — Demande de reset (envoi email) */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Réponse identique que l'utilisateur existe ou non (anti-énumération)
    if (!user || user.provider !== "credentials") {
      return NextResponse.json({
        success: true,
        message: "Si un compte existe, un email a été envoyé.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await user.save();

    sendResetPasswordEmail(user.email, user.pseudonyme, token).catch((err) =>
      console.error("Erreur envoi reset password :", err)
    );

    return NextResponse.json({
      success: true,
      message: "Si un compte existe, un email a été envoyé.",
    });
  } catch (err) {
    console.error("POST /api/auth/reset-password :", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/** PATCH /api/auth/reset-password — Nouveau mot de passe avec token */
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et nouveau mot de passe requis." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpiry");

    if (!user) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré." },
        { status: 400 }
      );
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    return NextResponse.json({ success: true, message: "Mot de passe mis à jour." });
  } catch (err) {
    console.error("PATCH /api/auth/reset-password :", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
