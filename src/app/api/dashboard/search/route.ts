// src/app/api/dashboard/search/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { LunaEvent } from "@/models/LunaEvent";

/**
 * GET /api/dashboard/search?q=...
 *
 * Recherche rapide de la barre du Tableau de bord :
 * - personnes (pseudonyme ou ville) — mêmes règles de visibilité qu'Explorer,
 *   plus les profils "matches" si on est déjà matchées ;
 * - événements à venir (titre, lieu, catégorie).
 *
 * Les raccourcis de pages sont filtrés côté client.
 */

export const dynamic = "force-dynamic";

type Oid = mongoose.Types.ObjectId;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toOid(value: unknown): Oid | null {
  const str = String(value ?? "");
  return mongoose.Types.ObjectId.isValid(str) ? new mongoose.Types.ObjectId(str) : null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 60);

    if (q.length < 2) {
      return NextResponse.json({ success: true, profiles: [], events: [] });
    }

    await connectDB();

    const me = (await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    })
      .select("_id isPremium subscriptionStatus blockedUsers")
      .lean()) as any;

    if (!me) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const meId = me._id as Oid;
    const premiumActive =
      me.isPremium === true &&
      (me.subscriptionStatus === "active" || me.subscriptionStatus === "trialing");

    const blockedByMe = ((me.blockedUsers as string[]) || [])
      .map(toOid)
      .filter((id): id is Oid => id !== null);

    const [blockedMeDocs, myMatches] = await Promise.all([
      User.find({ blockedUsers: meId.toString() }).select("_id").lean(),
      Match.find({
        $or: [{ user1Id: meId }, { user2Id: meId }],
        isActive: true,
      })
        .select("user1Id user2Id")
        .lean(),
    ]);

    const hiddenIds: Oid[] = [
      ...blockedByMe,
      ...blockedMeDocs.map((doc: any) => doc._id as Oid),
    ];

    const matchedIds = myMatches
      .map((match: any) =>
        String(match.user1Id) === String(meId) ? match.user2Id : match.user1Id
      )
      .map(toOid)
      .filter((id): id is Oid => id !== null);

    const regex = { $regex: escapeRegex(q), $options: "i" };

    const [profiles, events] = await Promise.all([
      User.find({
        _id: { $ne: meId, $nin: hiddenIds },
        hasCompletedProfile: true,
        consentement: true,
        banned: { $ne: true },
        role: { $ne: "admin" },
        $and: [
          { $or: [{ pseudonyme: regex }, { localisation: regex }] },
          {
            $or: [
              {
                visibilite: premiumActive
                  ? { $in: ["public", "premium"] }
                  : { $in: ["public"] },
              },
              { _id: { $in: matchedIds }, visibilite: { $ne: "invisible" } },
            ],
          },
        ],
      })
        .select("_id pseudonyme age localisation image identityVerified")
        .limit(5)
        .lean(),

      LunaEvent.find({
        isPublished: true,
        date: { $gte: new Date() },
        $or: [{ title: regex }, { location: regex }, { category: regex }],
      })
        .select("_id title date location isOnline emoji")
        .sort({ date: 1 })
        .limit(4)
        .lean(),
    ]);

    return NextResponse.json(
      { success: true, profiles, events },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erreur GET /api/dashboard/search :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
