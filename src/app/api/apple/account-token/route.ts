// src/app/api/apple/account-token/route.ts

import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export const runtime = "nodejs";

/**
 * POST /api/apple/account-token
 *
 * Renvoie l'identifiant que l'app iPhone joint à un achat intégré
 * (appAccountToken). Apple le recopie dans la preuve d'achat et dans ses
 * notifications : c'est ce qui rattache un abonnement au bon compte SferaLuna,
 * même si la preuve arrive par une notification avant que l'app ne l'envoie.
 *
 * Créé à la première demande, puis stable pour le compte.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email?.toLowerCase().trim();
    if (!email) return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });

    await connectDB();

    const user = await User.findOne({ email }).select("_id appleAccountToken");
    if (!user) return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });

    let token = user.appleAccountToken;
    if (!token) {
      token = randomUUID();
      await User.updateOne({ _id: user._id }, { $set: { appleAccountToken: token } });
    }

    return NextResponse.json({ success: true, appAccountToken: token });
  } catch (error) {
    console.error("Erreur POST /api/apple/account-token :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
