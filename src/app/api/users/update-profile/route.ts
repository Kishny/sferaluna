// src/app/api/users/update-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Route de finalisation du profil après inscription.
 *
 * Utilisée principalement par :
 * - /inscription
 *
 * Important :
 * Cette route ne gère PAS le plan premium.
 * Le paiement est géré par Stripe :
 * - /api/stripe/create-checkout-session
 * - /api/stripe/webhook
 */

const profileVisibilitySchema = z.enum([
  "public",
  "matches",
  "premium",
  "invisible",
]);

const updateProfileSchema = z.object({
  pseudonyme: z
    .string()
    .trim()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères")
    .optional(),

  email: z.string().email("Adresse email invalide").optional(),

  password: z
    .preprocess(
      (value) => (value === "" ? undefined : value),
      z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères").optional()
    )
    .optional(),

  age: z.coerce
    .number()
    .min(28, "Vous devez avoir au moins 28 ans")
    .max(120, "Âge invalide")
    .optional(),

  bio: z.string().trim().max(500).optional(),

  orientation: z.string().trim().max(100).optional(),

  intentions: z.array(z.string().trim()).max(10).optional(),

  localisation: z.string().trim().max(120).optional(),

  rayon: z.string().trim().max(50).optional(),

  question: z.string().trim().max(300).optional(),

  reponse: z
    .string()
    .trim()
    .max(200, "Votre réponse ne doit pas dépasser 200 caractères")
    .optional(),

  interets: z.array(z.string().trim()).min(0).max(10).optional(),

  visibilite: profileVisibilitySchema.optional(),

  consentement: z.boolean().optional(),

  hasCompletedProfile: z.boolean().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

function sanitizeUser(user: any) {
  if (!user) return null;

  const plainUser = user.toObject ? user.toObject({ virtuals: true }) : user;

  delete plainUser.password;
  delete plainUser.reponse;
  delete plainUser.emailVerificationToken;
  delete plainUser.emailVerificationExpiry;
  delete plainUser.resetPasswordToken;
  delete plainUser.resetPasswordExpiry;
  delete plainUser.__v;

  return plainUser;
}

function calculateProfileCompletion(user: any) {
  const raw = user?.toObject ? user.toObject() : user;

  const fields = [
    "pseudonyme",
    "email",
    "age",
    "orientation",
    "intentions",
    "localisation",
    "rayon",
    "question",
    "reponse",
    "interets",
    "visibilite",
    "consentement",
  ];

  const completedFields = fields.filter((field) => {
    const value = raw?.[field];

    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value === true;

    return value !== undefined && value !== null && value !== "";
  });

  const missingFields = fields.filter((field) => {
    const value = raw?.[field];

    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "boolean") return value !== true;

    return value === undefined || value === null || value === "";
  });

  return {
    percentage: Math.round((completedFields.length / fields.length) * 100),
    completedFields,
    missingFields,
  };
}

async function getSessionEmail() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  return session.user.email.toLowerCase().trim();
}

/**
 * POST /api/users/update-profile
 */
export async function POST(req: NextRequest) {
  try {
    const sessionEmail = await getSessionEmail();

    if (!sessionEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé. Veuillez vous connecter.",
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

    const validation = updateProfileSchema.safeParse(body);

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

    const data: UpdateProfileData = validation.data;

    await connectDB();

    const user = await User.findOne({ email: sessionEmail }).select("+reponse");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Utilisateur introuvable.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (data.pseudonyme !== undefined) updateData.pseudonyme = data.pseudonyme;

    /**
     * L'email envoyé par le frontend est ignoré volontairement.
     * L'email de session NextAuth reste la source de vérité.
     */

    if (data.password && data.password.trim().length >= 8) {
      updateData.password = await bcrypt.hash(data.password.trim(), 12);
    }

    if (data.age !== undefined) updateData.age = data.age;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.orientation !== undefined) updateData.orientation = data.orientation;
    if (data.intentions !== undefined) updateData.intentions = data.intentions;
    if (data.localisation !== undefined) updateData.localisation = data.localisation;
    if (data.rayon !== undefined) updateData.rayon = data.rayon;
    if (data.question !== undefined) updateData.question = data.question;
    if (data.reponse !== undefined) updateData.reponse = data.reponse;
    if (data.interets !== undefined) updateData.interets = data.interets;
    if (data.visibilite !== undefined) updateData.visibilite = data.visibilite;
    if (data.consentement !== undefined) updateData.consentement = data.consentement;

    /**
     * Cette route sert à finaliser l'inscription.
     * On marque donc le profil comme complété.
     */
    updateData.hasCompletedProfile = true;

    if (!user.hasCompletedProfile) {
      updateData.profileCompletedAt = new Date();
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: sessionEmail },
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      }
    ).select("+reponse -password -__v");

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de mettre à jour le profil.",
          code: "UPDATE_FAILED",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Profil mis à jour avec succès.",
        user: sanitizeUser(updatedUser),
        metadata: {
          profileCompletion: calculateProfileCompletion(updatedUser),
          lastUpdated: updatedUser.updatedAt,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur API update-profile :", error);

    const err = error as {
      name?: string;
      code?: number;
      message?: string;
      errors?: unknown;
      keyPattern?: Record<string, unknown>;
    };

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

    if (err.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          error: "Une donnée existe déjà.",
          code: "DUPLICATE_KEY",
          field: err.keyPattern ? Object.keys(err.keyPattern)[0] : null,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la mise à jour du profil.",
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

/**
 * PUT /api/users/update-profile
 *
 * Alias de POST.
 */
export async function PUT(req: NextRequest) {
  return POST(req);
}

/**
 * GET /api/users/update-profile
 *
 * Récupère le profil connecté.
 */
export async function GET() {
  try {
    const sessionEmail = await getSessionEmail();

    if (!sessionEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé. Veuillez vous connecter.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: sessionEmail }).select(
      "+reponse -password -__v"
    );

    if (!user) {
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
        user: sanitizeUser(user),
        metadata: {
          profileCompletion: calculateProfileCompletion(user),
          lastUpdated: user.updatedAt,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error: unknown) {
    console.error("Erreur API GET update-profile :", error);

    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur serveur lors de la récupération du profil.",
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