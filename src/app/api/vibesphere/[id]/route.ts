// src/app/api/vibesphere/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { VibePost } from "@/models/VibePost";
import mongoose from "mongoose";

/** POST /api/vibesphere/[id] — Toggle like */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID invalide." }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });

    const userId = currentUser._id as mongoose.Types.ObjectId;
    const post = await VibePost.findById(id);
    if (!post) return NextResponse.json({ success: false, error: "Post introuvable." }, { status: 404 });

    const alreadyLiked = post.likes.some((id) => id.equals(userId));

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => !id.equals(userId));
    } else {
      post.likes.push(userId);
    }
    await post.save();

    return NextResponse.json({ success: true, liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (err) {
    console.error("POST /api/vibesphere/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** DELETE /api/vibesphere/[id] — Supprimer un post (auteur uniquement) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id role").lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });

    const post = await VibePost.findById(id);
    if (!post) return NextResponse.json({ success: false, error: "Post introuvable." }, { status: 404 });

    const isAuthor = post.userId.equals(currentUser._id as mongoose.Types.ObjectId);
    const isAdmin = (currentUser as any).role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 403 });
    }

    await post.deleteOne();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/vibesphere/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
