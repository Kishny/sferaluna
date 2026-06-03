// src/app/api/admin/reports/route.ts
//
// GET /api/admin/reports
// Liste les signalements (admin uniquement)
// Query params : status (pending|reviewed|dismissed|all), limit, before (cursor)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Report } from "@/models/Report";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string } | undefined;

    if (!session?.user || sessionUser?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status") ?? "pending";
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const before = searchParams.get("before");

    await connectDB();

    const query: Record<string, unknown> = {};

    if (statusFilter !== "all") {
      query.status = statusFilter;
    }

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("reporterId", "pseudonyme image email")
      .populate({
        path: "targetId",
        // Populate uniquement si la cible est un utilisateur
        model: "User",
        select: "pseudonyme image email",
        // On ignore les erreurs si targetId pointe vers autre chose (message, post…)
        justOne: true,
        options: { strictPopulate: false },
      })
      .lean();

    const hasMore = reports.length > limit;
    const paginated = hasMore ? reports.slice(0, limit) : reports;

    // Compte des signalements en attente (pour le badge)
    const pendingCount = await Report.countDocuments({ status: "pending" });

    return NextResponse.json(
      {
        success: true,
        reports: paginated,
        hasMore,
        pendingCount,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/admin/reports :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
