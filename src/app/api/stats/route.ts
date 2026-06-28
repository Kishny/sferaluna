// src/app/api/stats/route.ts
// Endpoint public — stats réelles pour la homepage

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { LunaEvent } from "@/models/LunaEvent";

export const revalidate = 300; // cache 5 minutes

export async function GET() {
  try {
    await connectDB();

    // Comptes admin exclus des statistiques publiques (pas de vraies membres).
    const adminIds = await User.find({ role: "admin" }).distinct("_id");

    const [membres, matchs, messages, evenements] = await Promise.all([
      User.countDocuments({ hasCompletedProfile: true, role: { $ne: "admin" } }),
      Match.countDocuments({
        isActive: true,
        user1Id: { $nin: adminIds },
        user2Id: { $nin: adminIds },
      }),
      Message.countDocuments({ senderId: { $nin: adminIds } }),
      LunaEvent.countDocuments({ isPublished: true }),
    ]);

    return NextResponse.json({
      success: true,
      stats: { membres, matchs, messages, evenements },
    });
  } catch (err) {
    console.error("GET /api/stats :", err);
    return NextResponse.json({ success: false, stats: { membres: 0, matchs: 0, messages: 0, evenements: 0 } });
  }
}
