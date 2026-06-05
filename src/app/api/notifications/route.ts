// src/app/api/notifications/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";

import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { ProfileVisit } from "@/models/ProfileVisit";
import { User } from "@/models/User";

/**
 * GET /api/notifications
 *
 * Retourne les notifications non lues de l'utilisatrice connectée.
 *
 * Notifications comptabilisées :
 * - nouveaux messages reçus ;
 * - nouveaux matches ;
 * - nouvelles visites de profil.
 *
 * La comparaison se fait depuis :
 * - user.lastSeenNotificationsAt
 * - ou les 7 derniers jours si aucune date n'existe encore.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    /**
     * Selon ta configuration NextAuth, l'id peut être dans :
     * - session.user.id
     * - session.user._id
     * On sécurise les deux cas.
     */
    const sessionUser = session?.user as
      | {
          id?: string;
          _id?: string;
          email?: string | null;
        }
      | undefined;

    if (!sessionUser?.id && !sessionUser?._id && !sessionUser?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non authentifiée.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await connectDB();

    /**
     * Récupération fiable de l'utilisatrice.
     *
     * Priorité :
     * 1. id / _id depuis la session ;
     * 2. email en fallback.
     */
    let dbUser = null;

    const rawUserId = sessionUser.id || sessionUser._id;

    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      dbUser = await User.findById(rawUserId).select(
        "_id lastSeenNotificationsAt"
      );
    }

    if (!dbUser && sessionUser.email) {
      dbUser = await User.findOne({
        email: sessionUser.email.toLowerCase().trim(),
      }).select("_id lastSeenNotificationsAt");
    }

    if (!dbUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const userId = dbUser._id;

    /**
     * Date de référence.
     *
     * Si l'utilisatrice n'a jamais ouvert ses notifications,
     * on regarde les 7 derniers jours.
     */
    const since =
      dbUser.lastSeenNotificationsAt ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    /**
     * 1. Nouveaux matches.
     */
    const newMatches = await Match.countDocuments({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      createdAt: { $gte: since },
      isActive: { $ne: false },
    });

    /**
     * 2. Récupération des matches actifs pour compter les messages reçus.
     */
    const myMatches = await Match.find({
      $or: [{ user1Id: userId }, { user2Id: userId }],
      isActive: { $ne: false },
    }).select("_id");

    const matchIds = myMatches.map((match) => match._id);

    /**
     * 3. Messages reçus depuis la dernière lecture.
     *
     * On exclut les messages envoyés par soi-même.
     */
    const unreadMessages =
      matchIds.length > 0
        ? await Message.countDocuments({
            matchId: { $in: matchIds },
            senderId: { $ne: userId },
            createdAt: { $gte: since },
          })
        : 0;

    /**
 * 4. Nouvelles visites de profil.
 *
 * Modèle utilisé :
 * src/models/ProfileVisit.ts
 *
 * Champs attendus :
 * - visitorId : personne qui visite
 * - visitedId : personne visitée
 */
    const newVisits = await ProfileVisit.countDocuments({
      visitedId: userId,
      visitorId: { $ne: userId },
      createdAt: { $gte: since },
    });

    /**
     * Total affiché dans le header.
     *
     * Ici :
     * - les messages comptent individuellement ;
     * - les matches comptent comme 1 notification groupée ;
     * - les visites comptent comme 1 notification groupée.
     */
    const total =
      unreadMessages + (newMatches > 0 ? 1 : 0) + (newVisits > 0 ? 1 : 0);

    return NextResponse.json(
      {
        success: true,
        total,
        unreadMessages,
        newMatches,
        newVisits,
        since,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erreur GET /api/notifications :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors du chargement des notifications.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 *
 * Marque toutes les notifications comme lues.
 *
 * Important :
 * Comme ce fichier est src/app/api/notifications/route.ts,
 * cette fonction répond à POST /api/notifications.
 *
 * Si tu veux vraiment POST /api/notifications/seen,
 * il faudra créer :
 * src/app/api/notifications/seen/route.ts
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    const sessionUser = session?.user as
      | {
          id?: string;
          _id?: string;
          email?: string | null;
        }
      | undefined;

    if (!sessionUser?.id && !sessionUser?._id && !sessionUser?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non authentifiée.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const rawUserId = sessionUser.id || sessionUser._id;

    let updatedUser = null;

    if (rawUserId && mongoose.Types.ObjectId.isValid(rawUserId)) {
      updatedUser = await User.findByIdAndUpdate(
        rawUserId,
        {
          $set: {
            lastSeenNotificationsAt: new Date(),
          },
        },
        { new: true }
      ).select("_id lastSeenNotificationsAt");
    }

    if (!updatedUser && sessionUser.email) {
      updatedUser = await User.findOneAndUpdate(
        {
          email: sessionUser.email.toLowerCase().trim(),
        },
        {
          $set: {
            lastSeenNotificationsAt: new Date(),
          },
        },
        { new: true }
      ).select("_id lastSeenNotificationsAt");
    }

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Notifications marquées comme lues.",
        lastSeenNotificationsAt: updatedUser.lastSeenNotificationsAt,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erreur POST /api/notifications :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la mise à jour des notifications.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}