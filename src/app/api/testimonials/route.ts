// src/app/api/testimonials/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { Testimonial } from "@/models/Testimonial";
import { User } from "@/models/User";

// Cache 5 minutes — se remet à jour quand un témoignage est approuvé
export const revalidate = 300;

/**
 * GET /api/testimonials
 * Retourne les témoignages approuvés (public).
 *
 * Champs publics retournés : auteur, âge, ville, note, contenu, avatar
 * (uniquement si la membre a explicitement consenti via showAvatar).
 */
export async function GET() {
  try {
    await connectDB();

    const docs = await Testimonial.find({ status: "approved" })
      .sort({ featured: -1, createdAt: -1 })
      .limit(30)
      .select(
        "authorName age city content rating avatar showAvatar featured createdAt"
      )
      .lean();

    // On n'expose l'avatar que si le consentement est explicite.
    const testimonials = docs.map((t: any) => ({
      _id: String(t._id),
      authorName: t.authorName,
      age: t.age,
      city: t.city,
      content: t.content,
      rating: t.rating ?? 5,
      avatar: t.showAvatar ? t.avatar || null : null,
      featured: Boolean(t.featured),
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ success: true, testimonials });
  } catch (error) {
    console.error("[Testimonials GET]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

/**
 * POST /api/testimonials
 * Soumet un témoignage (auth requise, un seul par utilisatrice).
 *
 * Body : { content, authorName?, age?, city?, rating?, showAvatar? }
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;

    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    const body = await req.json();
    const { content, authorName, age, city, rating, showAvatar } = body ?? {};

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

    // Note : 1 à 5, défaut 5.
    let parsedRating = Number(rating);
    if (!Number.isFinite(parsedRating)) parsedRating = 5;
    parsedRating = Math.min(5, Math.max(1, Math.round(parsedRating)));

    await connectDB();

    // On récupère le profil pour les valeurs par défaut + le snapshot avatar.
    const dbUser = await User.findById(sessionUser.id)
      .select("pseudonyme name image localisation")
      .lean<{
        pseudonyme?: string;
        name?: string;
        image?: string;
        localisation?: string;
      } | null>();

    const wantsAvatar = Boolean(showAvatar);
    const avatarSnapshot = wantsAvatar ? dbUser?.image || "" : "";

    const finalAuthorName = (
      authorName ||
      sessionUser.pseudonyme ||
      dbUser?.pseudonyme ||
      sessionUser.name ||
      dbUser?.name ||
      "Membre Luna"
    ).slice(0, 50);

    const finalCity = (city || dbUser?.localisation || "").toString().slice(0, 60);

    // Upsert — remplace si l'utilisatrice avait déjà soumis un témoignage
    await Testimonial.findOneAndUpdate(
      { userId: sessionUser.id },
      {
        userId: sessionUser.id,
        authorName: finalAuthorName,
        age: age || undefined,
        city: finalCity || undefined,
        content: content.trim(),
        rating: parsedRating,
        showAvatar: wantsAvatar,
        avatar: avatarSnapshot || undefined,
        status: "pending", // repasse en pending si modifié
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Testimonials POST]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
