// src/app/api/visitors/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ProfileVisit } from "@/models/ProfileVisit";

/**
 * GET /api/visitors
 *
 * Retourne la liste des utilisateurs qui ont visité le profil connecté.
 * Réservé aux membres premium (essential-monthly+).
 *
 * Query params :
 * - limit (défaut : 30)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    await connectDB();

    const email = session.user.email.toLowerCase().trim();
    const currentUser = await User.findOne({ email }).select(
      "_id isPremium subscriptionStatus plan"
    );

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Vérification premium
    const isPremiumActive =
      currentUser.isPremium &&
      (currentUser.subscriptionStatus === "active" ||
        currentUser.subscriptionStatus === "trialing");

    if (!isPremiumActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Cette fonctionnalité est réservée aux membres premium.",
          code: "PREMIUM_REQUIRED",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "30"), 100);

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    // Récupérer les visites, groupées par visiteur (la plus récente par visiteur)
    const visits = await ProfileVisit.aggregate([
      { $match: { visitedId: currentUserId } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$visitorId",
          lastVisit: { $first: "$createdAt" },
          visitCount: { $sum: 1 },
        },
      },
      { $sort: { lastVisit: -1 } },
      { $limit: limit },
    ]);

    if (visits.length === 0) {
      return NextResponse.json({ success: true, visitors: [], total: 0 }, { status: 200 });
    }

    const visitorIds = visits.map((v) => v._id);

    const users = await User.find({ _id: { $in: visitorIds } })
      .select("_id pseudonyme age localisation image interets")
      .lean();

    const usersById = new Map(users.map((u) => [u._id.toString(), u]));

    const result = visits.map((v) => ({
      user: usersById.get(v._id.toString()) ?? null,
      lastVisit: v.lastVisit,
      visitCount: v.visitCount,
    }));

    return NextResponse.json(
      { success: true, visitors: result, total: result.length },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/visitors :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visitors
 *
 * Enregistre une visite de profil.
 * Appelé côté client quand on consulte un profil dans l'Explorer.
 *
 * Body : { visitedUserId: string }
 */
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
    const { visitedUserId } = body;

    if (!visitedUserId || !mongoose.Types.ObjectId.isValid(visitedUserId)) {
      return NextResponse.json(
        { success: false, error: "visitedUserId invalide." },
        { status: 400 }
      );
    }

    await connectDB();

    const email = session.user.email.toLowerCase().trim();
    const currentUser = await User.findOne({ email }).select("_id visibilite");

    if (!currentUser) {
      return NextResponse.json({ success: false }, { status: 404 });
    }

    const visitorId = currentUser._id as mongoose.Types.ObjectId;
    const visitedId = new mongoose.Types.ObjectId(visitedUserId);

    // Ne pas enregistrer si l'utilisateur se visite lui-même
    if (visitorId.equals(visitedId)) {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    // Ne pas enregistrer si le visiteur est en mode invisible
    if (currentUser.visibilite === "invisible") {
      return NextResponse.json({ success: true, skipped: true }, { status: 200 });
    }

    // Upsert : une visite unique par (visiteur, visité) par jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await ProfileVisit.findOneAndUpdate(
      {
        visitorId,
        visitedId,
        createdAt: { $gte: today },
      },
      { visitorId, visitedId },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    // On ignore silencieusement les erreurs d'upsert (index dupliqué, etc.)
    console.error("Erreur POST /api/visitors :", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
