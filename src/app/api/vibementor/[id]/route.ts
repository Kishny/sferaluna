// src/app/api/vibementor/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { MentorPost } from "@/models/MentorPost";
import mongoose from "mongoose";

/** POST /api/vibementor/[id] — Répondre ou liker une question */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id pseudonyme image")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID invalide." }, { status: 400 });
    }

    const post = await MentorPost.findById(id);
    if (!post) {
      return NextResponse.json({ success: false, error: "Question introuvable." }, { status: 404 });
    }

    const body = await req.json();
    const { action, content } = body;

    if (action === "answer") {
      if (!content?.trim() || content.trim().length > 1000) {
        return NextResponse.json({ success: false, error: "Réponse invalide (1–1000 caractères)." }, { status: 400 });
      }

      post.answers.push({
        _id: new mongoose.Types.ObjectId(),
        userId: currentUser._id as mongoose.Types.ObjectId,
        content: content.trim(),
        likes: [],
        isAccepted: false,
        createdAt: new Date(),
      });

      await post.save();

      const updated = await MentorPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("answers.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    if (action === "like") {
      const currentUserId = currentUser._id as mongoose.Types.ObjectId;
      const likeIndex = post.likes.findIndex((uid) => uid.equals(currentUserId));

      if (likeIndex === -1) {
        post.likes.push(currentUserId);
      } else {
        post.likes.splice(likeIndex, 1);
      }

      await post.save();

      const updated = await MentorPost.findById(id)
        .populate("userId", "pseudonyme image")
        .populate("answers.userId", "pseudonyme image")
        .lean();

      return NextResponse.json({ success: true, post: updated });
    }

    return NextResponse.json({ success: false, error: "Action invalide. Utilisez 'answer' ou 'like'." }, { status: 400 });
  } catch (err) {
    console.error("POST /api/vibementor/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
