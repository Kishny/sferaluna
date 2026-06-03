// src/app/api/users/update-profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Schéma de validation pour la finalisation du profil SferaLuna.
 *
 * Cette route sert UNIQUEMENT à sauvegarder le profil utilisateur.
 * Elle ne doit plus gérer le plan premium.
 *
 * Le choix du plan et l'activation premium sont maintenant gérés par :
 * - /api/stripe/create-checkout-session
 * - /api/stripe/webhook
 */
const updateProfileSchema = z.object({
  pseudonyme: z
    .string()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères")
    .optional(),

  email: z.string().email("Adresse email invalide").optional(),

  /**
   * Le mot de passe est optionnel.
   * Pour un utilisateur Google, ce champ peut rester vide.
   */
  password: z.string().min(6, "Mot de passe trop court").optional().or(z.literal("")),

  age: z.coerce
    .number()
    .min(28, "Vous devez avoir au moins 28 ans")
    .max(120, "Âge invalide")
    .optional(),

  orientation: z.string().max(100).optional(),

  intentions: z.array(z.string()).optional(),

  localisation: z.string().max(120).optional(),

  rayon: z.string().max(50).optional(),

  question: z.string().max(300).optional(),

  reponse: z
    .string()
    .max(200, "Votre réponse ne doit pas dépasser 200 caractères")
    .optional(),

  interets: z.array(z.string()).min(0).max(10).optional(),

  visibilite: z.string().max(50).optional(),

  consentement: z.boolean().optional(),

  hasCompletedProfile: z.boolean().optional(),
});

type UpdateProfileData = z.infer<typeof updateProfileSchema>;

/**
 * Nettoie l'utilisateur avant de l'envoyer au frontend.
 * On ne renvoie jamais le mot de passe.
 */
function sanitizeUser(user: any) {
  if (!user) return null;

  const plainUser = user.toObject ? user.toObject() : user;

  delete plainUser.password;
  delete plainUser.__v;

  return plainUser;
}

/**
 * POST /api/users/update-profile
 *
 * Finalise ou met à jour le profil de l'utilisateur connecté.
 * Cette route ne touche PAS aux champs Stripe :
 * - plan
 * - isPremium
 * - subscriptionStatus
 * - stripeCustomerId
 * - stripeSubscriptionId
 */
export async function POST(req: NextRequest) {
  try {
    /**
     * 1. Vérification de la session NextAuth.
     */
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Non autorisé. Veuillez vous connecter.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    /**
     * 2. Lecture du body JSON.
     */
    const body = await req.json();

    /**
     * 3. Validation Zod.
     */
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

    /**
     * 4. Connexion MongoDB.
     */
    await connectDB();

    /**
     * 5. On récupère l'utilisateur avec l'email de session.
     * Très important : on ne fait pas confiance à l'email envoyé par le frontend.
     */
    const sessionEmail = session.user.email.toLowerCase().trim();

    const user = await User.findOne({ email: sessionEmail });

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

    /**
     * 6. Préparation des champs autorisés.
     */
    const updateData: Record<string, unknown> = {};

    if (data.pseudonyme !== undefined) {
      updateData.pseudonyme = data.pseudonyme.trim();
    }

    /**
     * L'email n'est pas modifié ici.
     * Il vient de NextAuth et sert d'identifiant.
     */

    if (data.password && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password.trim(), 12);
    }

    if (data.age !== undefined) updateData.age = data.age;
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
     * Le profil est considéré complété dès que cette route passe correctement.
     */
    updateData.hasCompletedProfile = true;

    /**
     * On enregistre la date de complétion uniquement la première fois.
     */
    if (!user.hasCompletedProfile) {
      updateData.profileCompletedAt = new Date();
    }

    /**
     * 7. Mise à jour MongoDB.
     */
    const updatedUser = await User.findOneAndUpdate(
      { email: sessionEmail },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password -__v");

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
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
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

    const user = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("-password -__v");

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

/**
 * Calcule la complétion du profil.
 */
function calculateProfileCompletion(user: any) {
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
    const value = user[field];

    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "boolean") return value === true;

    return value !== undefined && value !== null && value !== "";
  });

  const missingFields = fields.filter((field) => {
    const value = user[field];

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