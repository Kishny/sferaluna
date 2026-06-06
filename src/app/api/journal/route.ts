// src/app/api/journal/route.ts
//
// GET  /api/journal          → liste des entrées de l'utilisatrice connectée
// POST /api/journal          → créer une nouvelle entrée
// DELETE /api/journal        → supprimer toutes les entrées (reset journal)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { JournalEntry } from "@/models/JournalEntry";

async function getUser(email: string) {
  await connectDB();
  return User.findOne({ email: email.toLowerCase().trim() });
}

// ── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non authentifiée." }, { status: 401 });
  }

  const user = await getUser(session.user.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });
  }

  const entries = await JournalEntry.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({
    success: true,
    entries: entries.map((e) => ({
      id: (e._id as mongoose.Types.ObjectId).toString(),
      mood: e.mood,
      note: e.note,
      date: e.date,
      ritualDone: e.ritualDone,
      period: e.period,
      aiAnalysis: e.aiAnalysis ?? "",
    })),
  });
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non authentifiée." }, { status: 401 });
  }

  const user = await getUser(session.user.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.mood) {
    return NextResponse.json({ success: false, error: "L'humeur est requise." }, { status: 400 });
  }

  const entry = await JournalEntry.create({
    userId: user._id,
    mood: body.mood,
    note: body.note ?? "",
    date: body.date ?? new Date().toLocaleString("fr-FR"),
    ritualDone: false,
    period: body.period ?? "jour",
    aiAnalysis: body.aiAnalysis ?? "",
  });

  return NextResponse.json({
    success: true,
    entry: {
      id: (entry._id as mongoose.Types.ObjectId).toString(),
      mood: entry.mood,
      note: entry.note,
      date: entry.date,
      ritualDone: entry.ritualDone,
      period: entry.period,
      aiAnalysis: entry.aiAnalysis ?? "",
    },
  });
}

// ── DELETE (reset complet) ──────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non authentifiée." }, { status: 401 });
  }

  const user = await getUser(session.user.email);
  if (!user) {
    return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });
  }

  await JournalEntry.deleteMany({ userId: user._id });

  return NextResponse.json({ success: true });
}
