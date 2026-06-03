// src/app/api/profiles/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * GET /api/profiles/[id]
 *
 * Retourne le profil public d'une utilisatrice.
 * Seuls les champs publics sont exposés (pas d'email, pas de données sensibles).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });
  }

  await connectDB();

  const profile = await User.findById(params.id).select(
    "pseudonyme age localisation interets intentions orientation bio image identityVerified visibilite createdAt"
  );

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });
  }

  // Ne pas exposer les profils invisibles
  if (profile.visibilite === "invisible") {
    return NextResponse.json({ error: "Profil non disponible." }, { status: 403 });
  }

  return NextResponse.json({ profile });
}
