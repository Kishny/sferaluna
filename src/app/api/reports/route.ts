// src/app/api/reports/route.ts
//
// POST /api/reports
// Crée un signalement (utilisateur connecté uniquement)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Report } from "@/models/Report";

const VALID_TARGET_TYPES = ["user", "message", "community_post"] as const;
const VALID_REASONS = [
  "spam",
  "harcèlement",
  "contenu_inapproprié",
  "faux_profil",
  "autre",
] as const;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { targetType, targetId, reason, details } = body;

    // Validation
    if (!VALID_TARGET_TYPES.includes(targetType)) {
      return NextResponse.json(
        { success: false, error: "Type de cible invalide." },
        { status: 400 }
      );
    }

    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json(
        { success: false, error: "targetId invalide." },
        { status: 400 }
      );
    }

    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json(
        { success: false, error: "Raison invalide." },
        { status: 400 }
      );
    }

    if (details && typeof details === "string" && details.length > 500) {
      return NextResponse.json(
        { success: false, error: "Les détails ne doivent pas dépasser 500 caractères." },
        { status: 400 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("_id");

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable." },
        { status: 404 }
      );
    }

    const reporterId = currentUser._id as mongoose.Types.ObjectId;

    // Vérifier qu'un signalement identique n'existe pas déjà (index unique)
    const existing = await Report.findOne({
      reporterId,
      targetId: new mongoose.Types.ObjectId(targetId),
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Vous avez déjà signalé cet élément." },
        { status: 409 }
      );
    }

    const report = await Report.create({
      reporterId,
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
      reason,
      details: details?.trim() || undefined,
    });

    return NextResponse.json(
      { success: true, reportId: report._id.toString() },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/reports :", error);
    const err = error as { code?: number; message?: string };

    // Erreur index unique MongoDB
    if (err.code === 11000) {
      return NextResponse.json(
        { success: false, error: "Vous avez déjà signalé cet élément." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
