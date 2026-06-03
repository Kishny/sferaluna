// src/app/api/vibementor/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MentorPost } from "@/models/MentorPost";
import mongoose from "mongoose";

/** GET /api/vibementor — Liste des questions */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const before = searchParams.get("before");

    const query: Record<string, unknown> = {};
    if (category && category !== "all") query.category = category;
    if (before) query.createdAt = { $lt: new Date(before) };

    const posts = await MentorPost.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("userId", "pseudonyme image")
      .populate("answers.userId", "pseudonyme image")
      .lean();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    const currentUserId = currentUser?._id?.toString();

    const enriched = posts.map((p) => ({
      ...p,
      likesCount: p.likes.length,
      likedByMe: currentUserId ? p.likes.some((id) => id.toString() === currentUserId) : false,
      answersCount: p.answers.length,
    }));

    return NextResponse.json({ success: true, posts: enriched, hasMore: posts.length === limit });
  } catch (err) {
    console.error("GET /api/vibementor :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/vibementor — Poser une question */
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
    const { question, category } = body;

    if (!question?.trim() || question.trim().length > 500) {
      return NextResponse.json({ success: false, error: "Question invalide (1–500 caractères)." }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ success: false, error: "Catégorie requise." }, { status: 400 });
    }

    const post = await MentorPost.create({
      userId: currentUser._id,
      question: question.trim(),
      category,
    });

    const populated = await post.populate("userId", "pseudonyme image");
    return NextResponse.json({ success: true, post: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vibementor :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
