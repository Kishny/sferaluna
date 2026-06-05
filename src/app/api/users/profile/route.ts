// src/app/api/users/profile/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

/**
 * Protection premium / abonnement.
 *
 * Sert ici à protéger le Mode Fantôme :
 * - visibilite: "invisible"
 *
 * Important :
 * ce helper doit être dans :
 * src/lib/subscription/subscription-check.ts
 */
import { SubscriptionChecker } from "@/lib/subscription/subscription-check";

/**
 * Route profil connecté.
 *
 * Utilisée principalement par :
 * - /mon-compte
 * - /mode-fantome
 * - les formulaires d'édition du profil
 *
 * Important :
 * Cette route NE DOIT PAS modifier directement les champs Stripe.
 * Les champs premium sont uniquement lus ici.
 * Les modifications premium doivent rester dans :
 * - /api/stripe/create-checkout-session
 * - /api/stripe/webhook
 */

// ─────────────────────────────────────────────
// Validation Zod
// ─────────────────────────────────────────────

const profileVisibilitySchema = z.enum([
  "public",
  "matches",
  "premium",
  "invisible",
]);

const profileUpdateSchema = z.object({
  pseudonyme: z
    .string()
    .trim()
    .min(3, "Le pseudonyme doit contenir au moins 3 caractères")
    .max(50, "Le pseudonyme ne doit pas dépasser 50 caractères")
    .optional(),

  age: z.coerce
    .number()
    .min(28, "Vous devez avoir au moins 28 ans")
    .max(120, "Âge invalide")
    .optional(),

  bio: z
    .string()
    .trim()
    .max(500, "La bio ne peut pas dépasser 500 caractères")
    .optional(),

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

  interets: z.array(z.string().trim()).max(10).optional(),

  /**
   * Visibilité du profil.
   *
   * "invisible" correspond au Mode Fantôme.
   * Cette valeur est protégée plus bas dans le PUT.
   */
  visibilite: profileVisibilitySchema.optional(),

  consentement: z.boolean().optional(),

  hasCompletedProfile: z.boolean().optional(),
});

type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function sanitizeUser(user: any) {
  if (!user) return null;

  const plainUser = user.toObject ? user.toObject({ virtuals: true }) : user;

  /**
   * On ne renvoie jamais les champs sensibles au frontend.
   */
  delete plainUser.password;
  delete plainUser.reponse;
  delete plainUser.emailVerificationToken;
  delete plainUser.emailVerificationExpiry;
  delete plainUser.resetPasswordToken;
  delete plainUser.resetPasswordExpiry;
  delete plainUser.__v;

  return plainUser;
}

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
 * Payload premium clair pour le frontend.
 *
 * Important :
 * On ne force PAS un statut "active" simplement parce qu'un plan est payant.
 * Stripe webhook reste la source de vérité.
 */
function buildPremiumPayload(user: any) {
  const subscriptionStatus = user.subscriptionStatus || "inactive";

  const isPremium =
    user.isPremium === true &&
    (subscriptionStatus === "active" || subscriptionStatus === "trialing");

  return {
    plan: user.plan || "free",
    planLabel: getPlanLabel(user.plan),

    isPremium,

    subscriptionStatus,
    subscriptionStatusLabel: getSubscriptionStatusLabel(subscriptionStatus),

    premiumStartedAt: user.premiumStartedAt || null,
    premiumExpiresAt: user.premiumExpiresAt || null,

    stripeCustomerId: user.stripeCustomerId || "",
    stripeSubscriptionId: user.stripeSubscriptionId || "",
    stripeCheckoutSessionId: user.stripeCheckoutSessionId || "",

    lastPaymentAt: user.lastPaymentAt || null,
  };
}

async function getSessionEmail() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) return null;

  return session.user.email.toLowerCase().trim();
}

/**
 * Calcule la complétion du profil.
 *
 * Attention :
 * On peut calculer la complétion avec l'objet MongoDB complet,
 * y compris reponse si elle est sélectionnée côté requête.
 * Mais on ne renvoie pas reponse au frontend.
 */
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

/**
 * Vérifie si l'utilisateur a accès au Mode Fantôme.
 *
 * La feature attendue dans :
 * src/lib/subscription/config.ts
 *
 * doit être :
 * ghostMode
 */
async function canUseGhostMode(userId: string) {
  const checker = new SubscriptionChecker(userId);

  const hasGhostMode = await checker.hasFeature("ghostMode");
  const currentPlan = await checker.getCurrentPlan();

  return {
    allowed: hasGhostMode,
    currentPlan,
  };
}

// ─────────────────────────────────────────────
// GET /api/users/profile
// ─────────────────────────────────────────────

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

    /**
     * +reponse sert uniquement au calcul de complétion.
     * sanitizeUser la supprime avant réponse frontend.
     */
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

    const sanitizedUser = sanitizeUser(user);

    return NextResponse.json(
      {
        success: true,
        user: sanitizedUser,
        premium: buildPremiumPayload(user),
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

// ─────────────────────────────────────────────
// PUT /api/users/profile
// ─────────────────────────────────────────────

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

    /**
     * Protection du Mode Fantôme.
     *
     * Règle :
     * - passer en "invisible" nécessite la feature premium "ghostMode" ;
     * - repasser en "public", "matches" ou "premium" reste autorisé ;
     * - cela évite de bloquer une utilisatrice qui veut désactiver le mode fantôme.
     */
    if (data.visibilite === "invisible") {
      const ghostAccess = await canUseGhostMode(user._id.toString());

      if (!ghostAccess.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Le Mode Fantôme est réservé aux membres Premium.",
            code: "PREMIUM_REQUIRED",
            requiredFeature: "ghostMode",
            currentPlan: ghostAccess.currentPlan,
            upgradeUrl: "/tarifs",
          },
          { status: 403 }
        );
      }
    }

    /**
     * Construction sécurisée.
     * On ignore volontairement tous les champs non autorisés.
     *
     * Important :
     * aucun champ Stripe / premium sensible ne peut être modifié ici.
     */
    const updateData: Record<string, unknown> = {};

    if (data.pseudonyme !== undefined) {
      updateData.pseudonyme = data.pseudonyme;
    }

    if (data.age !== undefined) {
      updateData.age = data.age;
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio;
    }

    if (data.orientation !== undefined) {
      updateData.orientation = data.orientation;
    }

    if (data.intentions !== undefined) {
      updateData.intentions = data.intentions;
    }

    if (data.localisation !== undefined) {
      updateData.localisation = data.localisation;
    }

    if (data.rayon !== undefined) {
      updateData.rayon = data.rayon;
    }

    if (data.question !== undefined) {
      updateData.question = data.question;
    }

    if (data.reponse !== undefined) {
      updateData.reponse = data.reponse;
    }

    if (data.interets !== undefined) {
      updateData.interets = data.interets;
    }

    if (data.visibilite !== undefined) {
      updateData.visibilite = data.visibilite;
    }

    if (data.consentement !== undefined) {
      updateData.consentement = data.consentement;
    }

    if (data.hasCompletedProfile !== undefined) {
      updateData.hasCompletedProfile = data.hasCompletedProfile;
    }

    if (data.hasCompletedProfile === true && !user.hasCompletedProfile) {
      updateData.profileCompletedAt = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      const sanitizedUser = sanitizeUser(user);

      return NextResponse.json(
        {
          success: true,
          message: "Aucune modification détectée.",
          user: sanitizedUser,
          premium: buildPremiumPayload(user),
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

    const sanitizedUpdatedUser = sanitizeUser(updatedUser);

    return NextResponse.json(
      {
        success: true,
        message: "Profil mis à jour avec succès.",
        user: sanitizedUpdatedUser,
        premium: buildPremiumPayload(updatedUser),
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