// src/app/api/admin/users/[id]/ban/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || user?.role !== "admin") return null;
  return user;
}

/**
 * POST /api/admin/users/[id]/ban
 * Bannit une utilisatrice (désactive son compte).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;

  await connectDB();

  const user = await User.findByIdAndUpdate(
    id,
    { $set: { banned: true, visibilite: "invisible", isPremium: false } },
    { new: true }
  );

  if (!user) return NextResponse.json({ error: "Utilisatrice introuvable." }, { status: 404 });

  return NextResponse.json({ success: true, message: `${user.pseudonyme} a été bannie.` });
}
