// src/app/api/auth/register/route.ts

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { sendVerificationEmail } from "@/lib/emails";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, pseudonyme } = body;

    // Validation champs obligatoires
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Nom, email et mot de passe sont requis." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    // Pseudonyme optionnel — validé uniquement si renseigné
    const trimmedPseudo = pseudonyme?.trim() || "";

    if (trimmedPseudo.length > 0) {
      if (trimmedPseudo.length < 2 || trimmedPseudo.length > 50) {
        return NextResponse.json(
          { error: "Le pseudonyme doit contenir entre 2 et 50 caractères." },
          { status: 400 }
        );
      }

      if (!/^[a-zA-ZÀ-ÿ0-9 _-]+$/.test(trimmedPseudo)) {
        return NextResponse.json(
          { error: "Le pseudonyme ne peut contenir que des lettres, chiffres, espaces, tirets ou underscores." },
          { status: 400 }
        );
      }
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectDB();

    // Vérifier si l'email est déjà utilisé
    const existingByEmail = await User.findOne({ email: normalizedEmail });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "Cette adresse email est déjà utilisée." },
        { status: 409 }
      );
    }

    // Vérifier l'unicité du pseudonyme uniquement si renseigné
    if (trimmedPseudo.length > 0) {
      const existingByPseudo = await User.findOne({
        pseudonyme: new RegExp(`^${trimmedPseudo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      });
      if (existingByPseudo) {
        return NextResponse.json(
          { error: "Ce pseudonyme est déjà utilisé. Choisissez-en un autre." },
          { status: 409 }
        );
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Générer un token de vérification email
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer l'utilisateur
    await User.create({
      email: normalizedEmail,
      pseudonyme: trimmedPseudo,
      name: name.trim(),
      password: hashedPassword,
      provider: "credentials",
      hasCompletedProfile: false,
      consentement: true,
      role: "user",
      plan: "free",
      isPremium: false,
      subscriptionStatus: "inactive",
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
      premiumStartedAt: null,
      premiumExpiresAt: null,
      stripeCustomerId: "",
      stripeSubscriptionId: "",
    });

    // Envoyer l'email de vérification (non bloquant)
    sendVerificationEmail(normalizedEmail, name.trim(), verificationToken).catch(
      (err) => console.error("Erreur envoi email vérification :", err)
    );

    return NextResponse.json(
      { success: true, message: "Compte créé. Vérifie ton email pour activer ton compte." },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/auth/register :", err);
    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}
