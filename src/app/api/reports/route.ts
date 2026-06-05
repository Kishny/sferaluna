// src/app/api/reports/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Message } from "@/models/Message";
import { Report } from "@/models/Report";

/**
 * API de signalement SferaLuna.
 *
 * POST /api/reports
 *
 * Permet à un utilisateur connecté de signaler :
 * - un profil utilisateur ;
 * - un message privé ;
 * - un post communautaire.
 *
 * Sécurité :
 * - session obligatoire ;
 * - cible validée ;
 * - raison validée ;
 * - doublon empêché ;
 * - impossible de se signaler soi-même ;
 * - les détails sont limités à 500 caractères.
 */

const reportSchema = z.object({
  targetType: z.enum(["user", "message", "community_post"], {
    message: "Type de cible invalide.",
  }),

  targetId: z
    .string()
    .min(1, "targetId est obligatoire.")
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
      message: "targetId invalide.",
    }),

  reason: z.enum(
    ["spam", "harcèlement", "contenu_inapproprié", "faux_profil", "autre"],
    {
      message: "Raison invalide.",
    }
  ),

  details: z
    .string()
    .trim()
    .max(500, "Les détails ne doivent pas dépasser 500 caractères.")
    .optional()
    .or(z.literal("")),
});

type ReportInput = z.infer<typeof reportSchema>;

/**
 * Récupère l'utilisateur connecté.
 */
async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Non autorisé.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      ),
    };
  }

  await connectDB();

  const currentUser = await User.findOne({
    email: session.user.email.toLowerCase().trim(),
  }).select("_id banned");

  if (!currentUser) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      ),
    };
  }

  if (currentUser.banned) {
    return {
      user: null,
      response: NextResponse.json(
        {
          success: false,
          error: "Compte suspendu.",
          code: "ACCOUNT_BANNED",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user: currentUser,
    response: null,
  };
}

/**
 * Vérifie que la cible signalée existe réellement.
 *
 * Pour community_post :
 * - je ne peux pas vérifier tant que tu ne m'as pas envoyé ton modèle VibePost.
 * - pour l'instant, on accepte l'ObjectId valide.
 */
async function validateReportTarget({
  targetType,
  targetId,
  reporterId,
}: {
  targetType: ReportInput["targetType"];
  targetId: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
}) {
  if (targetType === "user") {
    const targetUser = await User.findById(targetId).select("_id banned");

    if (!targetUser) {
      return {
        ok: false,
        error: "Profil introuvable.",
        code: "TARGET_USER_NOT_FOUND",
        status: 404,
      };
    }

    if (String(targetUser._id) === String(reporterId)) {
      return {
        ok: false,
        error: "Vous ne pouvez pas signaler votre propre profil.",
        code: "SELF_REPORT",
        status: 400,
      };
    }

    return { ok: true };
  }

  if (targetType === "message") {
    const targetMessage = await Message.findById(targetId).select(
      "_id senderId"
    );

    if (!targetMessage) {
      return {
        ok: false,
        error: "Message introuvable.",
        code: "TARGET_MESSAGE_NOT_FOUND",
        status: 404,
      };
    }

    if (String(targetMessage.senderId) === String(reporterId)) {
      return {
        ok: false,
        error: "Vous ne pouvez pas signaler votre propre message.",
        code: "SELF_REPORT",
        status: 400,
      };
    }

    return { ok: true };
  }

  if (targetType === "community_post") {
    /**
     * À brancher quand tu m'enverras le modèle VibeSphere/Post.
     *
     * Exemple plus tard :
     * const post = await VibePost.findById(targetId).select("_id userId");
     * if (!post) ...
     * if (String(post.userId) === String(reporterId)) ...
     */
    return { ok: true };
  }

  return {
    ok: false,
    error: "Type de cible invalide.",
    code: "INVALID_TARGET_TYPE",
    status: 400,
  };
}

/**
 * POST /api/reports
 */
export async function POST(req: NextRequest) {
  try {
    const { user: currentUser, response } = await getCurrentUser();

    if (response || !currentUser) return response;

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

    const validation = reportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides.",
          code: "VALIDATION_ERROR",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const reporterId = currentUser._id as mongoose.Types.ObjectId;
    const targetObjectId = new mongoose.Types.ObjectId(data.targetId);

    const targetValidation = await validateReportTarget({
      targetType: data.targetType,
      targetId: targetObjectId,
      reporterId,
    });

    if (!targetValidation.ok) {
      return NextResponse.json(
        {
          success: false,
          error: targetValidation.error,
          code: targetValidation.code,
        },
        { status: targetValidation.status }
      );
    }

    /**
     * Vérification doublon.
     *
     * Même protection aussi côté MongoDB via index unique.
     */
    const existingReport = await Report.findOne({
      reporterId,
      targetType: data.targetType,
      targetId: targetObjectId,
    }).select("_id");

    if (existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous avez déjà signalé cet élément.",
          code: "REPORT_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }

    const report = await Report.create({
      reporterId,
      targetType: data.targetType,
      targetId: targetObjectId,
      reason: data.reason,
      details: data.details?.trim() || "",
      status: "pending",
    });

    return NextResponse.json(
      {
        success: true,
        message: "Signalement envoyé avec succès.",
        reportId: report._id.toString(),
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/reports :", error);

    const err = error as {
      name?: string;
      code?: number;
      message?: string;
      errors?: unknown;
      keyPattern?: Record<string, unknown>;
    };

    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Vous avez déjà signalé cet élément.",
          code: "REPORT_ALREADY_EXISTS",
        },
        { status: 409 }
      );
    }

    if (err.name === "ValidationError") {
      return NextResponse.json(
        {
          success: false,
          error: "Erreur de validation MongoDB.",
          code: "DB_VALIDATION_ERROR",
          details: err.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur.",
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Une erreur est survenue.",
      },
      { status: 500 }
    );
  }
}