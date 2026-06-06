// src/app/api/journal/[id]/route.ts
//
// PATCH  /api/journal/[id]   → toggle ritualDone
// DELETE /api/journal/[id]   → supprimer une entrée

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { JournalEntry } from "@/models/JournalEntry";

type RouteContext = { params: Promise<{ id: string }> };

async function getUserAndEntry(email: string, id: string) {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return { user: null, entry: null };

  if (!mongoose.Types.ObjectId.isValid(id)) return { user, entry: null };

  const entry = await JournalEntry.findOne({ _id: id, userId: user._id });
  return { user, entry };
}

// ── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non authentifiée." }, { status: 401 });
  }

  const { id } = await params;
  const { entry } = await getUserAndEntry(session.user.email, id);
  if (!entry) {
    return NextResponse.json({ success: false, error: "Entrée introuvable." }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));

  if (typeof body.ritualDone === "boolean") {
    entry.ritualDone = body.ritualDone;
  }

  await entry.save();

  return NextResponse.json({
    success: true,
    entry: {
      id: (entry._id as mongoose.Types.ObjectId).toString(),
      ritualDone: entry.ritualDone,
    },
  });
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Non authentifiée." }, { status: 401 });
  }

  const { id } = await params;
  const { entry } = await getUserAndEntry(session.user.email, id);
  if (!entry) {
    return NextResponse.json({ success: false, error: "Entrée introuvable." }, { status: 404 });
  }

  await entry.deleteOne();

  return NextResponse.json({ success: true });
}
