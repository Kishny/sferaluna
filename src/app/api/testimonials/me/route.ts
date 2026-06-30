// src/app/api/testimonials/me/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";

/**
 * GET /api/testimonials/me
 *
 * Retourne le témoignage de la membre connectée (ou null si aucun).
 * Sert à :
 * - savoir s'il faut afficher la bannière d'incitation ;
 * - pré-remplir le formulaire si elle modifie son témoignage.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;

    if (!sessionUser?.id) {
      return NextResponse.json(
        { success: false, error: "Connexion requise." },
        { status: 401 }
      );
    }

    await connectDB();

    const doc = await Testimonial.findOne({ userId: sessionUser.id })
      .select("authorName age city content rating showAvatar status")
      .lean<{
        authorName?: string;
        age?: number;
        city?: string;
        content?: string;
        rating?: number;
        showAvatar?: boolean;
        status?: string;
      } | null>();

    return NextResponse.json(
      {
        success: true,
        hasTestimonial: Boolean(doc),
        testimonial: doc
          ? {
              authorName: doc.authorName,
              age: doc.age,
              city: doc.city,
              content: doc.content,
              rating: doc.rating ?? 5,
              showAvatar: Boolean(doc.showAvatar),
              status: doc.status,
            }
          : null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[Testimonials ME GET]", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
