// src/app/api/visitors/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ProfileVisit, getVisitDay } from "@/models/ProfileVisit";
import { checkSubscriptionAccess } from "@/lib/subscription/subscription-check";

/**
 * GET /api/visitors
 *
 * Retourne la liste des utilisatrices qui ont visité le profil connecté.
 *
 * Fonctionnalité premium :
 * - nécessite la feature "profileVisitors"
 * - donc accessible aux plans qui l'ont activée dans :
 *   src/lib/subscription/config.ts
 *
 * Query params :
 * - limit : nombre maximum de visiteurs retournés, défaut 30, maximum 100.
 */
export async function GET(req: NextRequest) {
  try {
    /**
     * Protection premium officielle.
     *
     * Cette ligne remplace la vérification manuelle :
     * currentUser.isPremium && subscriptionStatus === "active"
     *
     * Avantage :
     * - même logique partout ;
     * - compatible avec SUBSCRIPTION_PLANS ;
     * - plus simple à maintenir.
     */
    const access = await checkSubscriptionAccess({
      requiredFeature: "profileVisitors",
    });

    if (!access.allowed || !access.user) {
      return access.response;
    }

    await connectDB();

    const currentUserId = access.user._id as mongoose.Types.ObjectId;

    const { searchParams } = new URL(req.url);

    /**
     * Limite sécurisée :
     * - défaut : 30
     * - maximum : 100
     * - évite les abus côté API.
     */
    const parsedLimit = Number(searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 30;

    /**
     * Récupération des visites.
     *
     * Objectif :
     * - récupérer les personnes qui ont visité mon profil ;
     * - grouper par visiteur ;
     * - garder la visite la plus récente ;
     * - compter le nombre total de visites par visiteur.
     */
    const visits = await ProfileVisit.aggregate([
      {
        $match: {
          visitedId: currentUserId,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $group: {
          _id: "$visitorId",
          lastVisit: {
            $first: "$createdAt",
          },
          visitCount: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          lastVisit: -1,
        },
      },
      {
        $limit: limit,
      },
    ]);

    if (visits.length === 0) {
      return NextResponse.json(
        {
          success: true,
          visitors: [],
          total: 0,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const visitorIds = visits.map((visit) => visit._id);

    /**
     * Récupère les profils des visiteuses.
     *
     * On ne renvoie que les champs publics utiles.
     */
    const users = await User.find({
      _id: {
        $in: visitorIds,
      },
    })
      .select("_id pseudonyme age localisation image interets identityVerified")
      .lean();

    const usersById = new Map(
      users.map((user: any) => [user._id.toString(), user])
    );

    const visitors = visits
      .map((visit) => {
        const user = usersById.get(visit._id.toString());

        /**
         * Si une utilisatrice a été supprimée entre-temps,
         * on évite de renvoyer une entrée cassée.
         */
        if (!user) return null;

        return {
          user,
          lastVisit: visit.lastVisit,
          visitCount: visit.visitCount,
        };
      })
      .filter(Boolean);

    return NextResponse.json(
      {
        success: true,
        visitors,
        total: visitors.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur GET /api/visitors :", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la récupération des visiteurs.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/visitors
 *
 * Enregistre une visite de profil.
 *
 * Appelé quand une utilisatrice consulte un profil :
 * - depuis Explorer ;
 * - depuis Matches ;
 * - depuis une page profil publique ;
 * - ou autre page future.
 *
 * Body attendu :
 * {
 *   visitedUserId: string
 * }
 *
 * Important :
 * - une visite de soi-même n'est pas enregistrée ;
 * - une visite en mode invisible n'est pas enregistrée ;
 * - une même visiteuse ne compte qu'une seule fois par jour
 *   pour le même profil grâce à visitDay.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Body JSON invalide.",
          code: "INVALID_JSON_BODY",
        },
        { status: 400 }
      );
    }

    const { visitedUserId } = body as {
      visitedUserId?: string;
    };

    if (!visitedUserId || !mongoose.Types.ObjectId.isValid(visitedUserId)) {
      return NextResponse.json(
        {
          success: false,
          error: "visitedUserId invalide.",
          code: "INVALID_VISITED_USER_ID",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const email = session.user.email.toLowerCase().trim();

    /**
     * On récupère :
     * - _id pour identifier le visiteur ;
     * - visibilite pour savoir si le mode fantôme est actif.
     */
    const currentUser = await User.findOne({ email }).select("_id visibilite");

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const visitorId = currentUser._id as mongoose.Types.ObjectId;
    const visitedId = new mongoose.Types.ObjectId(visitedUserId);

    /**
     * On ne comptabilise pas une visite de son propre profil.
     */
    if (visitorId.equals(visitedId)) {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "self_visit",
        },
        { status: 200 }
      );
    }

    /**
     * Mode Fantôme :
     * si l'utilisatrice est invisible, on ne laisse pas de trace.
     *
     * C'est logique :
     * - elle navigue discrètement ;
     * - son passage ne doit pas apparaître dans les visiteurs.
     */
    if (currentUser.visibilite === "invisible") {
      return NextResponse.json(
        {
          success: true,
          skipped: true,
          reason: "ghost_mode",
        },
        { status: 200 }
      );
    }

    const visitDay = getVisitDay();

    /**
     * Upsert propre.
     *
     * Grâce à l'index unique :
     * visitorId + visitedId + visitDay
     *
     * On garantit :
     * - une seule visite comptabilisée par jour ;
     * - pas de doublons sauvages ;
     * - une mise à jour de updatedAt si la visite existe déjà.
     */
    await ProfileVisit.findOneAndUpdate(
      {
        visitorId,
        visitedId,
        visitDay,
      },
      {
        $setOnInsert: {
          visitorId,
          visitedId,
          visitDay,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    /**
     * Ici, on reste volontairement doux :
     * une erreur d'enregistrement de visite ne doit pas casser
     * l'expérience utilisateur.
     *
     * Par contre, on log quand même côté serveur.
     */
    console.error("Erreur POST /api/visitors :", error);

    return NextResponse.json(
      {
        success: true,
        skipped: true,
        reason: "visit_tracking_failed",
      },
      { status: 200 }
    );
  }
}