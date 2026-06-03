// src/app/api/testimonials/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";

// Cache 5 minutes — se remet à jour quand un témoignage est approuvé
export const revalidate = 300;

/**
 * GET /api/testimonials
 * Retourne les témoignages approuvés (public).
 */
export async function GET() {
  try {
    await connectDB();

    const testimonials = await Testimonial.find({ status: "approved" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("authorName age content createdAt")
      .lean();

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error("[Testimonials GET]", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/testimonials
 * Soumet un témoignage (auth requise, un seul par utilisatrice).
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;

    if (!sessionUser?.id) {
      return NextResponse.json(
        { error: "Connexion requise." },
        { status: 401 }
      );
    }

    const { content, authorName, age } = await req.json();

    if (!content || content.trim().length < 20) {
      return NextResponse.json(
        { error: "Le témoignage doit faire au moins 20 caractères." },
        { status: 400 }
      );
    }

    if (content.trim().length > 500) {
      return NextResponse.json(
        { error: "Le témoignage ne peut pas dépasser 500 caractères." },
        { status: 400 }
      );
    }

    await connectDB();

    // Upsert — remplace si l'utilisatrice avait déjà soumis un témoignage
    await Testimonial.findOneAndUpdate(
      { userId: sessionUser.id },
      {
        userId: sessionUser.id,
        authorName: (authorName || sessionUser.pseudonyme || sessionUser.name || "Membre Luna").slice(0, 50),
        age: age || undefined,
        content: content.trim(),
        status: "pending", // repasse en pending si modifié
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Testimonials POST]", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
