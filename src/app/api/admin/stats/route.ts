// src/app/api/admin/stats/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";

/**
 * GET /api/admin/stats
 *
 * Retourne les statistiques globales de la plateforme.
 * Réservé aux utilisateurs avec role === "admin".
 */
export async function GET() {
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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const last7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last30days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      premiumUsers,
      activeSubscriptions,
      profilesCompleted,
      newUsersToday,
      newUsersLast7days,
      newUsersLast30days,
      totalMatches,
      activeMatches,
      matchesLast7days,
      totalMessages,
      messagesLast7days,
      planBreakdown,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isPremium: true }),
      User.countDocuments({ subscriptionStatus: { $in: ["active", "trialing"] } }),
      User.countDocuments({ hasCompletedProfile: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ createdAt: { $gte: last7days } }),
      User.countDocuments({ createdAt: { $gte: last30days } }),
      Match.countDocuments(),
      Match.countDocuments({ isActive: true }),
      Match.countDocuments({ createdAt: { $gte: last7days } }),
      Message.countDocuments(),
      Message.countDocuments({ createdAt: { $gte: last7days } }),
      User.aggregate([
        { $group: { _id: "$plan", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          premium: premiumUsers,
          activeSubscriptions,
          profilesCompleted,
          newToday: newUsersToday,
          newLast7days: newUsersLast7days,
          newLast30days: newUsersLast30days,
          conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
        },
        matches: {
          total: totalMatches,
          active: activeMatches,
          last7days: matchesLast7days,
        },
        messages: {
          total: totalMessages,
          last7days: messagesLast7days,
        },
        planBreakdown: planBreakdown.map((p) => ({ plan: p._id || "free", count: p.count })),
      },
    }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    console.error("Erreur GET /api/admin/stats :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
