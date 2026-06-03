// src/app/api/admin/reports/[id]/route.ts
//
// PATCH /api/admin/reports/[id]
// Met à jour le statut d'un signalement (admin uniquement)
// Body : { status: "reviewed" | "dismissed", adminNotes?: string }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Report } from "@/models/Report";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { role?: string; email?: string } | undefined;

    if (!session?.user || sessionUser?.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès réservé aux administrateurs." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "ID invalide." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status, adminNotes } = body;

    if (!["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json(
        { success: false, error: "Statut invalide. Utilisez 'reviewed' ou 'dismissed'." },
        { status: 400 }
      );
    }

    await connectDB();

    // Récupérer l'admin courant
    const adminUser = await User.findOne({
      email: sessionUser?.email?.toLowerCase().trim(),
    }).select("_id");

    const updated = await Report.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          adminNotes: adminNotes?.trim() || undefined,
          reviewedAt: new Date(),
          reviewedBy: adminUser?._id,
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Signalement introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, report: updated },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur PATCH /api/admin/reports/[id] :", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
