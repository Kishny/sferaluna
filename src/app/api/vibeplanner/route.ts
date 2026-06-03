// src/app/api/vibeplanner/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { VibePlan } from "@/models/VibePlan";
import mongoose from "mongoose";

/** GET /api/vibeplanner?matchId=xxx — Plans d'un match */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;

    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get("matchId");

    if (matchId) {
      // Plans d'un match spécifique — vérifier accès
      if (!mongoose.Types.ObjectId.isValid(matchId)) {
        return NextResponse.json({ success: false, error: "matchId invalide." }, { status: 400 });
      }
      const match = await Match.findOne({
        _id: matchId,
        $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
        isActive: true,
      }).lean();
      if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

      const plans = await VibePlan.find({ matchId })
        .populate("proposedById", "pseudonyme image")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ success: true, plans });
    }

    // Tous les plans de l'utilisateur (dans tous ses matches)
    const myMatches = await Match.find({
      $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      isActive: true,
    }).select("_id").lean();

    const matchIds = myMatches.map((m) => m._id);
    const plans = await VibePlan.find({ matchId: { $in: matchIds } })
      .populate("proposedById", "pseudonyme image")
      .populate("matchId", "user1Id user2Id")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, plans });
  } catch (err) {
    console.error("GET /api/vibeplanner :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/vibeplanner — Proposer un plan à un match */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const body = await req.json();
    const { matchId, title, description, category, emoji, scheduledAt } = body;

    if (!matchId || !title || !description || !category || !emoji) {
      return NextResponse.json({ success: false, error: "Champs requis manquants." }, { status: 400 });
    }

    // Vérifier que l'utilisateur fait partie du match
    const match = await Match.findOne({
      _id: matchId,
      $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
      isActive: true,
    }).lean();
    if (!match) return NextResponse.json({ success: false, error: "Match introuvable." }, { status: 404 });

    const plan = await VibePlan.create({
      matchId,
      proposedById: currentUserId,
      title: title.trim(),
      description: description.trim(),
      category,
      emoji,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });

    const populated = await plan.populate("proposedById", "pseudonyme image");

    return NextResponse.json({ success: true, plan: populated }, { status: 201 });
  } catch (err) {
    console.error("POST /api/vibeplanner :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** PATCH /api/vibeplanner — Accepter ou refuser un plan */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() }).select("_id").lean();
    if (!currentUser) return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });

    const body = await req.json();
    const { planId, status } = body;

    if (!planId || !["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ success: false, error: "planId et status (accepted|rejected) requis." }, { status: 400 });
    }

    const plan = await VibePlan.findById(planId).populate("matchId");
    if (!plan) return NextResponse.json({ success: false, error: "Plan introuvable." }, { status: 404 });

    // Seul l'autre participant du match (pas l'auteur) peut répondre
    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    if (plan.proposedById.equals(currentUserId)) {
      return NextResponse.json({ success: false, error: "Vous ne pouvez pas répondre à votre propre proposition." }, { status: 403 });
    }

    plan.status = status;
    await plan.save();

    return NextResponse.json({ success: true, plan });
  } catch (err) {
    console.error("PATCH /api/vibeplanner :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
