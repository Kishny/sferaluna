// src/app/api/users/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Schéma de modification du profil depuis /mon-compte.
 *
 * Important :
 * cette route ne doit jamais modifier directement les champs Stripe.
 * Les champs premium sont lus par GET, mais modifiés uniquement par :
 * - /api/stripe/create-checkout-session
 * - /api/stripe/webhook
 */
const profileUpdateSchema = z.object({
  pseudonyme: z
    .string()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères")
    .optional(),

  age: z.coerce
    .number()
    .min(28, "Vous devez avoir au moins 28 ans")
    .max(120, "Âge invalide")
    .optional(),

  orientation: z.string().max(100).optional(),

  intentions: z.array(z.string()).max(10).optional(),

  localisation: z.string().max(120).optional(),

  rayon: z.string().max(50).optional(),

  question: z.string().max(300).optional(),

  reponse: z
    .string()
    .max(200, "Votre réponse ne doit pas dépasser 200 caractères")
    .optional(),

  interets: z.array(z.string()).max(10).optional(),

  visibilite: z.string().max(50).optional(),

  consentement: z.boolean().optional(),

  hasCompletedProfile: z.boolean().optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

/**
 * Nettoie l'objet utilisateur avant de l'envoyer au frontend.
 * On ne renvoie jamais :
 * - password
 * - __v
 */
function sanitizeUser(user: any) {
  if (!user) return null;

  const plainUser = user.toObject ? user.toObject() : user;

  delete plainUser.password;
  delete plainUser.__v;

  return plainUser;
}

/**
 * Labels lisibles côté frontend.
 */
function getPlanLabel(plan?: string) {
  const labels: Record<string, string> = {
    free: "Gratuit",
    "essential-monthly": "Essentiel",
    "premium-monthly": "Premium",
    "elite-monthly": "Elite",
  };

  return labels[plan || "free"] || "Gratuit";
}

function getSubscriptionStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    inactive: "En attente de paiement",
    active: "Actif",
    trialing: "Période d’essai",
    past_due: "Paiement en retard",
    canceled: "Annulé",
  };

  return labels[status || "inactive"] || "Inactif";
}

/**
 * Construit un objet premium clair.
 * Ça évite de dupliquer la logique dans GET et PUT.
 */
function buildPremiumPayload(user: any) {
  const hasPaidPlan = user.plan && user.plan !== "free";
  // Si le plan est payant mais que le webhook n'a pas encore confirmé, on corrige l'affichage
  const effectiveStatus = hasPaidPlan && (!user.subscriptionStatus || user.subscriptionStatus === "inactive")
    ? "active"
    : user.subscriptionStatus || "inactive";

  return {
    plan: user.plan || "free",
    planLabel: getPlanLabel(user.plan),

    isPremium: hasPaidPlan ? true : Boolean(user.isPremium),

    subscriptionStatus: effectiveStatus,
    subscriptionStatusLabel: getSubscriptionStatusLabel(effectiveStatus),

    premiumStartedAt: user.premiumStartedAt || null,
    premiumExpiresAt: user.premiumExpiresAt || null,

    stripeCustomerId: user.stripeCustomerId || "",
    stripeSubscriptionId: user.stripeSubscriptionId || "",
    stripeCheckoutSessionId: user.stripeCheckoutSessionId || "",

    lastPaymentAt: user.lastPaymentAt || null,
  };
}

/**
 * Récupère l'email de l'utilisateur connecté.
 * On utilise toujours l'email de la session pour éviter qu'un utilisateur
 * puisse récupérer/modifier le profil de quelqu'un d'autre.
 */
async function getSessionEmail() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  return session.user.email.toLowerCase().trim();
}

/**
 * GET /api/users/profile
 *
 * Route utilisée par /mon-compte.
 * Elle renvoie le profil + les infos premium Stripe.
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
      "-password -__v +reponse"
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

    const sanitizedUser = sanitizeUser(user);

    return NextResponse.json(
      {
        success: true,

        /**
         * user contient tout le profil + les champs premium présents dans MongoDB.
         */
        user: sanitizedUser,

        /**
         * premium est un raccourci propre pour /mon-compte.
         * Ton frontend peut fusionner data.user + data.premium.
         */
        premium: buildPremiumPayload(sanitizedUser),

        metadata: {
          profileCompletion: calculateProfileCompletion(sanitizedUser),
          lastUpdated: sanitizedUser.updatedAt,
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
    console.error("Erreur GET /api/users/profile :", error);

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
 * PUT /api/users/profile
 *
 * Met à jour uniquement les champs du profil.
 *
 * Important :
 * cette route ne modifie jamais :
 * - plan
 * - isPremium
 * - subscriptionStatus
 * - stripeCustomerId
 * - stripeSubscriptionId
 * - stripeCheckoutSessionId
 * - premiumStartedAt
 * - premiumExpiresAt
 * - lastPaymentAt
 */
export async function PUT(req: NextRequest) {
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

    const body = await req.json();

    const validation = profileUpdateSchema.safeParse(body);

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

    const data: ProfileUpdateData = validation.data;

    await connectDB();

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
     * Construction sécurisée de l'objet de mise à jour.
     * On n'envoie à MongoDB que les champs autorisés.
     */
    const updateData: Record<string, unknown> = {};

    if (data.pseudonyme !== undefined) {
      updateData.pseudonyme = data.pseudonyme.trim();
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

    if (data.hasCompletedProfile !== undefined) {
      updateData.hasCompletedProfile = data.hasCompletedProfile;
    }

    /**
     * Si le profil n'était pas encore complété et qu'on le marque comme complété,
     * on ajoute une date de complétion.
     */
    if (data.hasCompletedProfile === true && !user.hasCompletedProfile) {
      updateData.profileCompletedAt = new Date();
    }

    /**
     * Si aucun champ n'a été envoyé, on renvoie simplement l'utilisateur actuel.
     */
    if (Object.keys(updateData).length === 0) {
      const sanitizedUser = sanitizeUser(user);

      return NextResponse.json(
        {
          success: true,
          message: "Aucune modification détectée.",
          user: sanitizedUser,
          premium: buildPremiumPayload(sanitizedUser),
          metadata: {
            profileCompletion: calculateProfileCompletion(sanitizedUser),
            lastUpdated: sanitizedUser.updatedAt,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: sessionEmail },
      { $set: updateData },
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

    const sanitizedUpdatedUser = sanitizeUser(updatedUser);

    return NextResponse.json(
      {
        success: true,
        message: "Profil mis à jour avec succès.",
        user: sanitizedUpdatedUser,

        /**
         * On renvoie aussi premium après PUT.
         * Comme ça, /mon-compte ne perd pas l'affichage premium
         * après une simple sauvegarde du profil.
         */
        premium: buildPremiumPayload(sanitizedUpdatedUser),

        metadata: {
          profileCompletion: calculateProfileCompletion(sanitizedUpdatedUser),
          lastUpdated: sanitizedUpdatedUser.updatedAt,
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
    console.error("Erreur PUT /api/users/profile :", error);

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
 * POST /api/users/profile
 *
 * Alias de PUT.
 */
export async function POST(req: NextRequest) {
  return PUT(req);
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