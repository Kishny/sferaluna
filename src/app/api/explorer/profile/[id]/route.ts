// src/app/api/explorer/profile/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { User } from "@/models/User";
import { computeCompatibility } from "@/lib/compatibility";
import { PUBLIC_PROFILE_FIELDS, getViewer, publicProfile, relationStatus, toOid } from "@/lib/explorer-server";

/**
 * GET /api/explorer/profile/[id]
 *
 * Profil détaillé pour /explorer/profil/[id] : toutes les informations
 * publiques, l'affinité estimée et ses raisons, les vérifications et le
 * statut de la relation (aimée, match).
 */

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const viewer = await getViewer();
    if (!viewer) {
      return NextResponse.json({ success: false, error: "Non autorisée.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const { id } = await context.params;
    const profileId = toOid(id);
    if (!profileId) {
      return NextResponse.json({ success: false, error: "Profil introuvable.", code: "INVALID_ID" }, { status: 400 });
    }

    const isSelf = String(profileId) === String(viewer._id);
    const hidden = viewer.hiddenIds.some((hid) => String(hid) === String(profileId));

    const doc = (await User.findById(profileId)
      .select(`${PUBLIC_PROFILE_FIELDS} hasCompletedProfile banned role consentement`)
      .lean()) as any;

    const unavailable = () =>
      NextResponse.json(
        { success: false, error: "Ce profil n’est pas disponible.", code: "PROFILE_UNAVAILABLE" },
        { status: 404 }
      );

    if (!doc || (!isSelf && (hidden || doc.banned || doc.role === "admin" || !doc.hasCompletedProfile))) {
      return unavailable();
    }

    const relation = await relationStatus(viewer, [profileId]);
    const key = String(profileId);
    const matchId = relation.matches.get(key) ?? null;

    if (!isSelf) {
      if (doc.visibilite === "invisible") return unavailable();
      if (doc.visibilite === "matches" && !matchId) return unavailable();
      if (doc.visibilite === "premium" && !viewer.premiumActive && !matchId) {
        return NextResponse.json(
          { success: false, error: "Ce profil est réservé aux membres premium.", code: "PREMIUM_REQUIRED" },
          { status: 403 }
        );
      }
    }

    const compatibility = computeCompatibility(viewer, doc, { likedYou: relation.likedMe.has(key) });
    const { hasCompletedProfile, banned, role, consentement, ...clean } = doc;

    return NextResponse.json(
      {
        success: true,
        isSelf,
        profile: publicProfile(clean),
        compatibility,
        likedByMe: relation.likedByMe.has(key),
        matchId,
        verifications: {
          identity: Boolean(doc.identityVerified),
          email: Boolean(doc.emailVerified),
        },
        memberSince: doc.createdAt ?? null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/explorer/profile/[id] :", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger ce profil.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
