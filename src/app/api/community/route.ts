// src/app/api/community/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { CommunityPost } from "@/models/CommunityPost";
import mongoose from "mongoose";

/** GET /api/community — Liste des posts communautaires */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const query: Record<string, unknown> = {};
    if (category && category !== "all") query.category = category;

    const posts = await CommunityPost.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .populate("userId", "pseudonyme image")
      .lean();

    const enriched = posts.map((post) => ({
      ...post,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      likedByMe: post.likes.some((uid) => uid.equals(currentUserId)),
    }));

    return NextResponse.json({ success: true, posts: enriched });
  } catch (err) {
    console.error("GET /api/community :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/community — Créer un post communautaire */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const { title, content, category, emoji } = body;

    if (!title?.trim() || title.trim().length > 150) {
      return NextResponse.json({ success: false, error: "Titre invalide (1–150 caractères)." }, { status: 400 });
    }
    if (!content?.trim() || content.trim().length > 2000) {
      return NextResponse.json({ success: false, error: "Contenu invalide (1–2000 caractères)." }, { status: 400 });
    }
    if (!category || !emoji) {
      return NextResponse.json({ success: false, error: "Catégorie et emoji requis." }, { status: 400 });
    }

    const post = await CommunityPost.create({
      userId: currentUser._id,
      title: title.trim(),
      content: content.trim(),
      category,
      emoji,
    });

    const populated = await post.populate("userId", "pseudonyme image");

    return NextResponse.json({ success: true, post: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/community :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
