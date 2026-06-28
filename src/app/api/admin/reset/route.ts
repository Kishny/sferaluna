// src/app/api/admin/reset/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { ProfileVisit } from "@/models/ProfileVisit";
import { VibePost } from "@/models/VibePost";
import { CommunityPost } from "@/models/CommunityPost";
import { MentorPost } from "@/models/MentorPost";
import { JournalEntry } from "@/models/JournalEntry";

/**
 * Cibles de reset autorisées.
 *
 * Chaque cible ne touche jamais à la collection User : seules les données
 * "d'activité" sont supprimées, pour repartir avec des statistiques propres
 * sans perdre les comptes existants.
 */
type ResetTarget = "messages" | "matches" | "visits" | "posts" | "journal";

const allowedTargets: ResetTarget[] = [
  "messages",
  "matches",
  "visits",
  "posts",
  "journal",
];

const targetLabels: Record<ResetTarget, string> = {
  messages: "Messages",
  matches: "Matchs & likes",
  visits: "Visites de profil",
  posts: "Posts (VibeSphere / Communauté / VibeMentor)",
  journal: "Journal émotionnel",
};

function isResetTarget(value: unknown): value is ResetTarget {
  return typeof value === "string" && allowedTargets.includes(value as ResetTarget);
}

/**
 * POST /api/admin/reset
 *
 * Vide une catégorie de données d'activité (réservé admin).
 * Body : { target: "messages" | "matches" | "visits" | "posts" | "journal" }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    await connectDB();

    const adminUser = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("role");

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    let body: { target?: unknown } | null = null;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Body JSON invalide." },
        { status: 400 }
      );
    }

    const target = body?.target;

    if (!isResetTarget(target)) {
      return NextResponse.json(
        {
          success: false,
          error: "Cible de reset invalide.",
          allowedTargets,
        },
        { status: 400 }
      );
    }

    let deletedCount = 0;

    switch (target) {
      case "messages": {
        const res = await Message.deleteMany({});
        deletedCount = res.deletedCount ?? 0;
        break;
      }

      case "matches": {
        const [matches, likes] = await Promise.all([
          Match.deleteMany({}),
          Like.deleteMany({}),
        ]);
        deletedCount = (matches.deletedCount ?? 0) + (likes.deletedCount ?? 0);
        break;
      }

      case "visits": {
        const res = await ProfileVisit.deleteMany({});
        deletedCount = res.deletedCount ?? 0;
        break;
      }

      case "posts": {
        const [vibes, community, mentor] = await Promise.all([
          VibePost.deleteMany({}),
          CommunityPost.deleteMany({}),
          MentorPost.deleteMany({}),
        ]);
        deletedCount =
          (vibes.deletedCount ?? 0) +
          (community.deletedCount ?? 0) +
          (mentor.deletedCount ?? 0);
        break;
      }

      case "journal": {
        const res = await JournalEntry.deleteMany({});
        deletedCount = res.deletedCount ?? 0;
        break;
      }
    }

    console.log(
      `🧹 Reset admin "${target}" par ${session.user.email} — ${deletedCount} document(s) supprimé(s).`
    );

    return NextResponse.json(
      {
        success: true,
        target,
        label: targetLabels[target],
        deletedCount,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/admin/reset :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur lors du reset." },
      { status: 500 }
    );
  }
}
