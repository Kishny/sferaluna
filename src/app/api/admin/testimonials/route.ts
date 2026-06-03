// src/app/api/admin/testimonials/route.ts

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

/** GET /api/admin/testimonials — liste tous les témoignages */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  await connectDB();
  const testimonials = await Testimonial.find()
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ success: true, testimonials });
}
