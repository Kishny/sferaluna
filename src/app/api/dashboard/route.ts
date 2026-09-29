// src/app/api/dashboard/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { ProfileVisit } from "@/models/ProfileVisit";
import { LunaEvent } from "@/models/LunaEvent";
import { Like } from "@/models/Like";
import { SUBSCRIPTION_PLANS, normalizePlanId } from "@/lib/subscription/config";
import { getDepartementNom } from "@/lib/locations";

/**
 * GET /api/dashboard
 *
 * Endpoint agrégé qui alimente le Tableau de bord de /mon-compte en un seul
 * aller-retour :
 * - compteurs (messages non lus, nouveaux matchs, visites de la semaine,
 *   profils à découvrir) ;
 * - aperçu des dernières visiteuses (feature "profileVisitors" uniquement,
 *   sinon on ne renvoie que le compteur → teaser flouté côté UI) ;
 * - aperçu des derniers matchs ;
 * - prochain événement proche de l'utilisatrice (ville / département),
 *   à défaut un événement en ligne, à défaut le prochain tout court ;
 * - features du plan réellement actif (Stripe confirmé).
 *
 * Règles de confidentialité appliquées partout :
 * - comptes bannis et admins exclus ;
 * - utilisatrices bloquées (dans les deux sens) exclues ;
 * - uniquement des champs publics.
 */

export const dynamic = "force-dynamic";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PUBLIC_USER_FIELDS = "_id pseudonyme age localisation image identityVerified";

type Oid = mongoose.Types.ObjectId;

function toOid(value: unknown): Oid | null {
  const str = String(value ?? "");
  return mongoose.Types.ObjectId.isValid(str) ? new mongoose.Types.ObjectId(str) : null;
}

/** Minuscule + sans accents, pour comparer "Évry" et "evry". */
function normalizeText(value?: string | null) {
  return (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    await connectDB();

    const me = (await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    })
      .select(
        "_id plan isPremium subscriptionStatus localisation departement rayon blockedUsers"
      )
      .lean()) as any;

    if (!me) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    const meId = me._id as Oid;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - WEEK_MS);
    const weekAhead = new Date(now.getTime() + WEEK_MS);

    /**
     * Plan réellement actif : même règle que isPremiumActive() côté client.
     * Un plan payant non confirmé par Stripe = features du plan gratuit.
     */
    const premiumActive =
      me.isPremium === true &&
      (me.subscriptionStatus === "active" || me.subscriptionStatus === "trialing");
    const effectivePlan = premiumActive ? normalizePlanId(me.plan) : "free";
    const features = SUBSCRIPTION_PLANS[effectivePlan].features;

    /**
     * Profils masqués : celles que j'ai bloquées + celles qui m'ont bloquée.
     */
    const blockedByMe = ((me.blockedUsers as string[]) || [])
      .map(toOid)
      .filter((id): id is Oid => id !== null);

    const blockedMeDocs = await User.find({ blockedUsers: meId.toString() })
      .select("_id")
      .lean();

    const hiddenIds: Oid[] = [
      ...blockedByMe,
      ...blockedMeDocs.map((doc: any) => doc._id as Oid),
    ];

    // ─────────────────────────────────────────
    // Matchs + messages non lus
    // ─────────────────────────────────────────

    const rawMatches = await Match.find({
      $or: [{ user1Id: meId }, { user2Id: meId }],
      isActive: true,
      deletedBy: { $ne: meId },
    })
      .sort({ createdAt: -1 })
      .select("_id user1Id user2Id createdAt lastMessageAt")
      .lean();

    const otherIdOf = (match: any) =>
      String(match.user1Id) === String(meId) ? String(match.user2Id) : String(match.user1Id);

    const otherIds = rawMatches
      .map(otherIdOf)
      .map(toOid)
      .filter((id): id is Oid => id !== null);

    const matchUsers = otherIds.length
      ? await User.find({
          _id: { $in: otherIds, $nin: hiddenIds },
          banned: { $ne: true },
        })
          .select(PUBLIC_USER_FIELDS)
          .lean()
      : [];

    const matchUsersById = new Map(matchUsers.map((u: any) => [String(u._id), u]));

    const visibleMatches = rawMatches
      .map((match: any) => ({
        matchId: String(match._id),
        createdAt: match.createdAt as Date,
        lastMessageAt: (match.lastMessageAt as Date | null) ?? null,
        user: matchUsersById.get(otherIdOf(match)) ?? null,
      }))
      .filter((match) => match.user !== null);

    const visibleMatchIds = visibleMatches
      .map((match) => toOid(match.matchId))
      .filter((id): id is Oid => id !== null);

    const unreadByMatch = visibleMatchIds.length
      ? await Message.aggregate([
          {
            $match: {
              matchId: { $in: visibleMatchIds },
              senderId: { $ne: meId },
              readAt: null,
            },
          },
          { $group: { _id: "$matchId", count: { $sum: 1 } } },
        ])
      : [];

    const unreadMessages = unreadByMatch.reduce((sum, entry) => sum + entry.count, 0);
    const unreadConversations = unreadByMatch.length;

    /** Si une seule conversation a du non-lu, on peut y envoyer directement. */
    const firstUnreadMatchId =
      unreadConversations === 1 ? String(unreadByMatch[0]._id) : null;

    const newMatchesWeek = visibleMatches.filter(
      (match) => match.createdAt && match.createdAt >= weekAgo
    ).length;

    /** Nouveaux matchs sans aucun message échangé : "brise la glace". */
    const silentMatches = visibleMatches.filter((match) => !match.lastMessageAt).length;

    // ─────────────────────────────────────────
    // Visites de la semaine
    // ─────────────────────────────────────────

    const weeklyVisits = await ProfileVisit.aggregate([
      {
        $match: {
          visitedId: meId,
          visitorId: { $ne: meId, $nin: hiddenIds },
          createdAt: { $gte: weekAgo },
        },
      },
      { $group: { _id: "$visitorId", lastVisit: { $max: "$updatedAt" } } },
      { $sort: { lastVisit: -1 } },
      { $limit: 200 },
    ]);

    let visitorItems: any[] = [];

    if (features.profileVisitors && weeklyVisits.length > 0) {
      const previewIds = weeklyVisits.slice(0, 12).map((visit) => visit._id as Oid);

      const visitorUsers = await User.find({
        _id: { $in: previewIds },
        banned: { $ne: true },
        role: { $ne: "admin" },
      })
        .select(PUBLIC_USER_FIELDS)
        .lean();

      const byId = new Map(visitorUsers.map((u: any) => [String(u._id), u]));

      visitorItems = weeklyVisits
        .map((visit) => {
          const user = byId.get(String(visit._id));
          return user ? { ...user, lastVisit: visit.lastVisit } : null;
        })
        .filter(Boolean)
        .slice(0, 5);
    }

    // ─────────────────────────────────────────
    // Profils à découvrir (mêmes règles que /api/profiles)
    // ─────────────────────────────────────────

    const likedIds = (await Like.find({ fromUserId: meId }).distinct("toUserId")) as Oid[];

    const discoverQuery: Record<string, unknown> = {
      _id: { $ne: meId, $nin: [...likedIds, ...hiddenIds] },
      hasCompletedProfile: true,
      consentement: true,
      banned: { $ne: true },
      role: { $ne: "admin" },
      age: { $gte: 28 },
      visibilite: premiumActive ? { $in: ["public", "premium"] } : { $in: ["public"] },
    };

    if (me.rayon === "departement" && me.departement) {
      discoverQuery.departement = me.departement;
    }

    const [discoverable, newProfilesWeek] = await Promise.all([
      User.countDocuments(discoverQuery),
      User.countDocuments({ ...discoverQuery, createdAt: { $gte: weekAgo } }),
    ]);

    // ─────────────────────────────────────────
    // Événement proche
    // ─────────────────────────────────────────

    const upcoming = await LunaEvent.find({ isPublished: true, date: { $gte: now } })
      .sort({ date: 1 })
      .limit(50)
      .lean();

    const city = normalizeText(me.localisation);
    const deptName = normalizeText(getDepartementNom(me.departement));

    const isLocal = (event: any) => {
      if (event.isOnline) return false;
      const location = normalizeText(event.location);
      return Boolean(
        (city && location.includes(city)) || (deptName && location.includes(deptName))
      );
    };

    const localEvents = upcoming.filter(isLocal);
    const onlineEvents = upcoming.filter((event: any) => event.isOnline);

    const picked: any =
      localEvents[0] ?? onlineEvents[0] ?? upcoming[0] ?? null;
    const pickedMode: "local" | "online" | "any" | null = picked
      ? localEvents[0]
        ? "local"
        : onlineEvents[0]
          ? "online"
          : "any"
      : null;

    let event: Record<string, unknown> | null = null;

    if (picked) {
      const attendeeIds = (picked.attendees || []) as Oid[];

      const attendeePreview = attendeeIds.length
        ? await User.find({
            _id: { $in: attendeeIds.slice(0, 12), $nin: hiddenIds },
            banned: { $ne: true },
          })
            .select("_id pseudonyme image")
            .limit(4)
            .lean()
        : [];

      event = {
        _id: String(picked._id),
        title: picked.title,
        date: picked.date,
        location: picked.location,
        isOnline: Boolean(picked.isOnline),
        category: picked.category,
        emoji: picked.emoji,
        coverEmoji: picked.coverEmoji || "🌙",
        maxAttendees: picked.maxAttendees,
        attendeeCount: attendeeIds.length,
        isRegistered: attendeeIds.some((id) => String(id) === String(meId)),
        isFull: attendeeIds.length >= picked.maxAttendees,
        attendees: attendeePreview,
        mode: pickedMode,
      };
    }

    const localEventsWeek = localEvents.filter(
      (item: any) => new Date(item.date) <= weekAhead
    ).length;

    return NextResponse.json(
      {
        success: true,
        plan: effectivePlan,
        premiumActive,
        features: {
          profileVisitors: Boolean(features.profileVisitors),
          eventsAccess: Boolean(features.eventsAccess),
          circleOfSix: Boolean(features.circleOfSix),
          vibePlanner: Boolean(features.vibePlanner),
          ghostMode: Boolean(features.ghostMode),
        },
        counts: {
          unreadMessages,
          unreadConversations,
          firstUnreadMatchId,
          totalMatches: visibleMatches.length,
          newMatchesWeek,
          silentMatches,
          visitsWeek: weeklyVisits.length,
          discoverable,
          newProfilesWeek,
          localEvents: localEvents.length,
          localEventsWeek,
          upcomingEvents: upcoming.length,
        },
        visitors: {
          locked: !features.profileVisitors,
          items: visitorItems,
        },
        matches: {
          items: visibleMatches.slice(0, 5),
        },
        event,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erreur GET /api/dashboard :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors du chargement du tableau de bord.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
