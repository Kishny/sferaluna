// src/app/api/vibesphere/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { VibePost } from "@/models/VibePost";
import mongoose from "mongoose";

/** GET /api/vibesphere — Feed des vibes (pagination cursor) */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const before = searchParams.get("before");

    const query: Record<string, unknown> = {};
    if (before) query.createdAt = { $lt: new Date(before) };

    const posts = await VibePost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "pseudonyme image age")
      .lean();

    // Récupérer l'ID de l'utilisateur connecté pour savoir s'il a liké
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    const currentUserId = currentUser?._id?.toString();

    const enriched = posts.map((p) => ({
      ...p,
      likesCount: p.likes.length,
      likedByMe: currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false,
    }));

    return NextResponse.json({ success: true, posts: enriched, hasMore: posts.length === limit });
  } catch (err) {
    console.error("GET /api/vibesphere :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/vibesphere — Créer un vibe */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });

    const body = await req.json();
    const { content, mood, emoji } = body;

    if (!content?.trim() || content.trim().length > 300)
      return NextResponse.json({ success: false, error: "Contenu invalide (1–300 caractères)." }, { status: 400 });
    if (!mood || !emoji)
      return NextResponse.json({ success: false, error: "Mood et emoji requis." }, { status: 400 });

    const post = await VibePost.create({
      userId: currentUser._id,
      content: content.trim(),
      mood,
      emoji,
    });

    const populated = await post.populate("userId", "pseudonyme image age");

    return NextResponse.json({ success: true, post: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vibesphere :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
