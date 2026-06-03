// src/app/api/admin/users/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * GET /api/admin/users
 *
 * Retourne la liste paginée des utilisateurs avec filtres.
 * Réservé aux admins.
 *
 * Query params :
 * - page (défaut : 1)
 * - limit (défaut : 20, max : 50)
 * - search (recherche sur email / pseudonyme)
 * - plan (filtre par plan)
 * - status (filtre par subscriptionStatus)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("role");

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1"), 1);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const search = searchParams.get("search")?.trim();
    const planFilter = searchParams.get("plan");
    const statusFilter = searchParams.get("status");
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (search && search.length >= 2) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { pseudonyme: { $regex: search, $options: "i" } },
      ];
    }

    if (planFilter && planFilter !== "all") {
      query.plan = planFilter;
    }

    if (statusFilter && statusFilter !== "all") {
      query.subscriptionStatus = statusFilter;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("_id email pseudonyme plan subscriptionStatus isPremium hasCompletedProfile role createdAt lastLoginAt localisation age")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + users.length < total,
      },
    }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    console.error("Erreur GET /api/admin/users :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 *
 * Permet de modifier le rôle ou de suspendre un utilisateur.
 *
 * Body : { userId: string, action: "promote" | "demote" | "toggle_premium" }
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const adminUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).select("role");

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès refusé." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, action } = body;

    if (!userId || !action) {
      return NextResponse.json({ success: false, error: "Paramètres manquants." }, { status: 400 });
    }

    const target = await User.findById(userId).select("_id role isPremium plan email");

    if (!target) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    // Empêcher l'admin de se modifier lui-même
    if (target.email === session.user.email) {
      return NextResponse.json({ success: false, error: "Impossible de modifier votre propre compte." }, { status: 400 });
    }

    let update: Record<string, unknown> = {};

    if (action === "promote") {
      update = { role: "admin" };
    } else if (action === "demote") {
      update = { role: "user" };
    } else if (action === "toggle_premium") {
      update = {
        isPremium: !target.isPremium,
        subscriptionStatus: target.isPremium ? "inactive" : "active",
        plan: target.isPremium ? "free" : "essential-monthly",
      };
    } else {
      return NextResponse.json({ success: false, error: "Action inconnue." }, { status: 400 });
    }

    const updated = await User.findByIdAndUpdate(userId, { $set: update }, { new: true })
      .select("_id email role isPremium plan subscriptionStatus");

    return NextResponse.json({ success: true, user: updated }, { status: 200 });
  } catch (error: unknown) {
    console.error("Erreur PATCH /api/admin/users :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
