// src/app/api/insights/today/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { parisDayKey } from "@/lib/insights/select";
import { getInsightForDay, getPreviousInsights } from "@/lib/insights/service";

export const dynamic = "force-dynamic";

/**
 * GET /api/insights/today
 *
 * La connaissance du jour et celles des jours précédents, pour une membre
 * connectée. `today` vaut null tant que l'équipe n'a publié aucune connaissance.
 * Utilisée par le site et par l'application mobile.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    await connectDB();

    const day = parisDayKey();
    const [today, previous] = await Promise.all([getInsightForDay(day), getPreviousInsights(day)]);

    return NextResponse.json({ success: true, day, today, previous });
  } catch (error) {
    console.error("Erreur GET /api/insights/today :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
