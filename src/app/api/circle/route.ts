// src/app/api/circle/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import mongoose from "mongoose";

/**
 * GET /api/circle
 *
 * Retourne 6 profils curatés pour la semaine en cours.
 *
 * Algorithme de compatibilité (score sur ~50 pts max) :
 *
 *  [Intentions]    +3 pts par intention commune        → max ~15 pts
 *  [Intérêts]      +1 pt  par intérêt commun           → max ~10 pts
 *  [Réciprocité]   +10 pts si elle a déjà liké l'user  → très fort signal
 *  [Âge proche]    +3 si écart ≤ 5 ans                 → confort relationnel
 *                  +1 si écart ≤ 10 ans
 *                  -3 si écart > 15 ans
 *  [Localisation]  +4 si même ville/région              → proximité géo
 *  [Activité]      +3 si connectée cette semaine        → profil actif
 *                  +1 si connectée ce mois
 *  [Profil riche]  +2 si a une photo                   → profil soigné
 *                  +1 si a rempli question/réponse
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id interets intentions isPremium age localisation")
      .lean();

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const userIsPremium = currentUser.isPremium === true;

    // IDs déjà likés par l'utilisatrice
    const alreadyLiked = await Like.find({ fromUserId: currentUserId }).select("toUserId").lean();
    const likedIds = alreadyLiked.map((l) => l.toUserId);

    // IDs qui ont déjà liké l'utilisatrice (signal de réciprocité)
    const likedMeBack = await Like.find({ toUserId: currentUserId }).select("fromUserId").lean();
    const likedMeIds = new Set(likedMeBack.map((l) => l.fromUserId.toString()));

    // Requête de base
    const baseQuery: Record<string, unknown> = {
      _id: { $ne: currentUserId, $nin: likedIds },
      hasCompletedProfile: true,
      visibilite: userIsPremium
        ? { $nin: ["invisible"] }
        : { $nin: ["invisible", "premium"] },
    };

    const candidates = await User.find(baseQuery)
      .select("pseudonyme age localisation interets intentions image question reponse visibilite lastLoginAt")
      .limit(200)
      .lean();

    // Données de l'utilisatrice courante
    const myInterets: string[]   = Array.isArray(currentUser.interets)   ? currentUser.interets   : [];
    const myIntentions: string[] = Array.isArray(currentUser.intentions) ? currentUser.intentions : [];
    const myAge: number | null   = typeof currentUser.age === "number" ? currentUser.age : null;
    const myCity: string         = (currentUser.localisation || "").toLowerCase().trim();

    const now = new Date();
    const oneWeekAgo  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const scored = candidates.map((candidate) => {
      let score = 0;
      const details: string[] = [];

      // ── 1. Intentions communes ──────────────────────────────────────
      const candIntentions: string[] = Array.isArray(candidate.intentions) ? candidate.intentions : [];
      const sharedIntentions = myIntentions.filter((i) => candIntentions.includes(i)).length;
      score += sharedIntentions * 3;
      if (sharedIntentions > 0) details.push(`${sharedIntentions} intention(s) communes`);

      // ── 2. Intérêts communs ─────────────────────────────────────────
      const candInterets: string[] = Array.isArray(candidate.interets) ? candidate.interets : [];
      const sharedInterets = myInterets.filter((i) => candInterets.includes(i)).length;
      score += sharedInterets;
      if (sharedInterets > 0) details.push(`${sharedInterets} intérêt(s) communs`);

      // ── 3. Réciprocité ──────────────────────────────────────────────
      if (likedMeIds.has(candidate._id.toString())) {
        score += 10;
        details.push("t'a déjà likée");
      }

      // ── 4. Âge proche ───────────────────────────────────────────────
      if (myAge !== null && typeof candidate.age === "number") {
        const diff = Math.abs(myAge - candidate.age);
        if (diff <= 5)       { score += 3; details.push("âge très proche"); }
        else if (diff <= 10) { score += 1; details.push("âge proche"); }
        else if (diff > 15)  { score -= 3; }
      }

      // ── 5. Localisation ─────────────────────────────────────────────
      if (myCity && candidate.localisation) {
        const candCity = (candidate.localisation as string).toLowerCase().trim();
        if (candCity === myCity) {
          score += 4;
          details.push("même ville");
        } else {
          // Même région/département (premier mot de la localisation)
          const myRegion   = myCity.split(" ")[0];
          const candRegion = candCity.split(" ")[0];
          if (myRegion.length > 2 && myRegion === candRegion) {
            score += 2;
            details.push("même région");
          }
        }
      }

      // ── 6. Activité récente ─────────────────────────────────────────
      if (candidate.lastLoginAt) {
        const lastLogin = new Date(candidate.lastLoginAt as Date);
        if (lastLogin >= oneWeekAgo)       { score += 3; details.push("active cette semaine"); }
        else if (lastLogin >= oneMonthAgo) { score += 1; details.push("active ce mois"); }
      }

      // ── 7. Profil riche ─────────────────────────────────────────────
      if (candidate.image) { score += 2; }
      if (candidate.question) { score += 1; }

      return { ...candidate, _score: score, _details: details };
    });

    // Trier par score décroissant
    // En cas d'égalité, favoriser les profils actifs récemment
    const top6 = scored
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        const aLogin = a.lastLoginAt ? new Date(a.lastLoginAt as Date).getTime() : 0;
        const bLogin = b.lastLoginAt ? new Date(b.lastLoginAt as Date).getTime() : 0;
        return bLogin - aLogin;
      })
      .slice(0, 6)
      .map(({ _score, _details, lastLoginAt, question, reponse, ...profile }) => ({
        ...profile,
        compatibilityScore: _score,
        compatibilityHints: _details,
      }));

    return NextResponse.json({
      success: true,
      profiles: top6,
      weekOf: getWeekStart().toISOString(),
    });
  } catch (err) {
    console.error("GET /api/circle :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}
