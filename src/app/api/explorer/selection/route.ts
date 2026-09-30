// src/app/api/explorer/selection/route.ts

import { NextResponse } from "next/server";

import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { WeeklySelection } from "@/models/WeeklySelection";
import { computeCompatibility, currentWeekStart } from "@/lib/compatibility";
import {
  PUBLIC_PROFILE_FIELDS,
  discoverableQuery,
  getViewer,
  publicProfile,
  relationStatus,
} from "@/lib/explorer-server";

/**
 * GET /api/explorer/selection
 *
 * « Vos découvertes du jour » : les 6 profils les plus compatibles de la
 * semaine. Calculés au premier appel de la semaine puis figés
 * (modèle WeeklySelection) — la liste reste la même toute la semaine.
 *
 * Chaque profil est renvoyé avec son affinité estimée, les raisons de la
 * recommandation et le statut de la relation (déjà aimée, match…).
 */

export const dynamic = "force-dynamic";

const SELECTION_SIZE = 6;

export async function GET() {
  try {
    const viewer = await getViewer();

    if (!viewer) {
      return NextResponse.json({ success: false, error: "Non autorisée.", code: "UNAUTHORIZED" }, { status: 401 });
    }

    const weekOf = currentWeekStart();

    // 1. Sélection déjà calculée cette semaine ?
    let selection = await WeeklySelection.findOne({ userId: viewer._id, weekOf }).lean();

    // 2. Sinon : calcul à partir des profils découvrables, non encore aimés.
    if (!selection) {
      const [liked, likedMeDocs] = await Promise.all([
        Like.find({ fromUserId: viewer._id }).distinct("toUserId"),
        Like.find({ toUserId: viewer._id }).distinct("fromUserId"),
      ]);
      const likedMe = new Set(likedMeDocs.map(String));

      const candidates = await User.find(
        discoverableQuery(viewer, {
          _id: { $ne: viewer._id, $nin: [...viewer.hiddenIds, ...liked] },
          age: { $gte: 28 },
        })
      )
        .select("_id age localisation departement interets intentions lastLoginAt image")
        .limit(400)
        .lean();

      const ranked = candidates
        .map((candidate: any) => {
          const compat = computeCompatibility(viewer, candidate, {
            likedYou: likedMe.has(String(candidate._id)),
          });
          // Ordre : affinité, puis réciprocité, puis profils avec photo, puis activité.
          const rank =
            compat.score +
            (likedMe.has(String(candidate._id)) ? 12 : 0) +
            (candidate.image ? 3 : 0) +
            (compat.recentlyActive ? 2 : 0);
          return { id: candidate._id, rank };
        })
        .sort((a, b) => b.rank - a.rank)
        .slice(0, SELECTION_SIZE);

      if (ranked.length >= SELECTION_SIZE) {
        try {
          await WeeklySelection.create({
            userId: viewer._id,
            weekOf,
            profileIds: ranked.map((r) => r.id),
          });
        } catch {
          // Deux requêtes simultanées : l'autre a déjà créé la sélection.
        }
        selection = await WeeklySelection.findOne({ userId: viewer._id, weekOf }).lean();
      } else {
        // Pas encore assez de profils : on ne fige pas la semaine, pour que
        // les nouvelles membres apparaissent dès leur inscription.
        selection = { profileIds: ranked.map((r) => r.id) } as any;
      }
    }

    const ids = (selection?.profileIds || []) as any[];

    // 3. Relecture des profils (on retire ceux devenus indisponibles : bannis,
    //    bloqués, passés en Mode Fantôme…).
    const docs = await User.find(discoverableQuery(viewer, { _id: { $in: ids, $nin: viewer.hiddenIds } }))
      .select(PUBLIC_PROFILE_FIELDS)
      .lean();

    const byId = new Map(docs.map((doc: any) => [String(doc._id), doc]));
    const ordered = ids.map((id) => byId.get(String(id))).filter(Boolean) as any[];

    const relation = await relationStatus(viewer, ordered.map((doc) => doc._id));

    const profiles = ordered.map((doc) => {
      const id = String(doc._id);
      const compat = computeCompatibility(viewer, doc, { likedYou: relation.likedMe.has(id) });
      return {
        ...publicProfile(doc),
        compatibility: compat,
        likedByMe: relation.likedByMe.has(id),
        matchId: relation.matches.get(id) ?? null,
      };
    });

    const nextWeek = new Date(weekOf.getTime() + 7 * 24 * 60 * 60 * 1000);

    return NextResponse.json(
      { success: true, weekOf, renewsAt: nextWeek, profiles },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("GET /api/explorer/selection :", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger vos découvertes.", code: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
