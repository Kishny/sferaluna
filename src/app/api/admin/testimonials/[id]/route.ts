// src/app/api/admin/testimonials/[id]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user?.id || user?.role !== "admin") return null;
  return user;
}

/** PATCH /api/admin/testimonials/[id] — approuver ou rejeter */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  await connectDB();

  const updated = await Testimonial.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ error: "Témoignage introuvable." }, { status: 404 });
  }

  return NextResponse.json({ success: true, testimonial: updated });
}

/** DELETE /api/admin/testimonials/[id] — supprimer */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;

  await connectDB();
  await Testimonial.findByIdAndDelete(id);

  return NextResponse.json({ success: true });
}
