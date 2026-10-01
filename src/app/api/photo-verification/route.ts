// src/app/api/photo-verification/route.ts

/**
 * Vérification des photos de profil.
 *
 * GET                       → état de la vérification de la membre connectée
 * POST { action: "start", consent: true }
 *                           → crée une session de selfie vivant + identifiants
 *                             AWS temporaires limités à cette session
 * POST { action: "complete", sessionId }
 *                           → lit le résultat, enregistre le selfie (chiffré)
 *                             et compare toutes les photos du profil
 * POST { action: "recheck" } → recompare les photos avec le selfie existant
 * DELETE                    → retire le consentement : supprime le selfie et le badge
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { PhotoVerification } from "@/models/PhotoVerification";
import {
  LIVENESS_THRESHOLD,
  MAX_ATTEMPTS_PER_DAY,
  awsRegion,
  countFaces,
  createLivenessSession,
  encryptReference,
  evaluateProfilePhotos,
  getLivenessResult,
  isPhotoVerificationConfigured,
  isPhotoVerificationEnforced,
  loadReference,
} from "@/lib/photo-verification";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() })
    .select("_id image photos photoVerified photoVerificationStatus photoVerifiedAt photoMismatches banned")
    .lean();
}

export async function GET() {
  const user = await currentUser();
  if (!user) return json({ success: false, error: "Non autorisé." }, 401);

  const record = await PhotoVerification.findOne({ userId: user._id }).select("verifiedAt consentAt").lean();

  return json({
    success: true,
    configured: isPhotoVerificationConfigured(),
    enforced: isPhotoVerificationEnforced(),
    hasReference: Boolean(record?.verifiedAt),
    photoVerified: Boolean(user.photoVerified),
    status: user.photoVerificationStatus ?? "none",
    verifiedAt: user.photoVerifiedAt ?? record?.verifiedAt ?? null,
    hasMainPhoto: Boolean(user.image),
    mismatches: user.photoMismatches ?? [],
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return json({ success: false, error: "Non autorisé." }, 401);
  if (user.banned) return json({ success: false, error: "Compte suspendu." }, 403);
  if (!isPhotoVerificationConfigured()) {
    return json({ success: false, code: "NOT_CONFIGURED", error: "La vérification des photos n’est pas encore disponible." }, 503);
  }

  const body = (await req.json().catch(() => ({}))) as { action?: string; consent?: boolean; sessionId?: string };

  try {
    // ── Démarrer un selfie vivant ──
    if (body.action === "start") {
      if (body.consent !== true) {
        return json({ success: false, code: "CONSENT_REQUIRED", error: "Votre accord est nécessaire pour lancer la vérification." }, 400);
      }

      const record =
        (await PhotoVerification.findOne({ userId: user._id })) ?? new PhotoVerification({ userId: user._id, attempts: [] });
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      record.attempts = (record.attempts ?? []).filter((d) => new Date(d).getTime() > dayAgo);
      if (record.attempts.length >= MAX_ATTEMPTS_PER_DAY) {
        return json({ success: false, code: "TOO_MANY_ATTEMPTS", error: "Vous avez fait plusieurs essais aujourd’hui. Réessayez demain." }, 429);
      }

      const { sessionId, credentials } = await createLivenessSession(String(user._id));
      record.attempts.push(new Date());
      record.pendingSessionId = sessionId;
      record.pendingSessionAt = new Date();
      record.consentAt = new Date();
      await record.save();

      return json({ success: true, sessionId, region: awsRegion(), credentials });
    }

    // ── Résultat du selfie ──
    if (body.action === "complete") {
      const record = await PhotoVerification.findOne({ userId: user._id });
      const fresh = record?.pendingSessionAt && Date.now() - record.pendingSessionAt.getTime() < 20 * 60 * 1000;
      if (!record || !body.sessionId || record.pendingSessionId !== body.sessionId || !fresh) {
        return json({ success: false, code: "INVALID_SESSION", error: "Session de vérification expirée. Recommencez." }, 400);
      }

      const result = await getLivenessResult(body.sessionId);
      record.pendingSessionId = null;
      record.pendingSessionAt = null;

      if (result.status !== "SUCCEEDED" || result.confidence < LIVENESS_THRESHOLD || !result.reference) {
        await record.save();
        return json(
          {
            success: false,
            code: "LIVENESS_FAILED",
            error: "Nous n’avons pas pu confirmer que le selfie a été pris en direct. Réessayez dans un endroit bien éclairé, visage bien centré.",
          },
          422
        );
      }

      if ((await countFaces(result.reference)) !== 1) {
        await record.save();
        return json({ success: false, code: "LIVENESS_FAILED", error: "Un seul visage doit apparaître pendant le selfie. Réessayez." }, 422);
      }

      record.reference = encryptReference(result.reference);
      record.livenessConfidence = Math.round(result.confidence);
      record.verifiedAt = new Date();
      await record.save();

      const evaluation = await evaluateProfilePhotos(user._id, result.reference);
      return json({ success: true, ...evaluation });
    }

    // ── Revérifier les photos avec le selfie existant ──
    if (body.action === "recheck") {
      const reference = await loadReference(user._id);
      if (!reference) return json({ success: false, code: "NO_REFERENCE", error: "Faites d’abord le selfie de vérification." }, 400);
      const evaluation = await evaluateProfilePhotos(user._id, reference);
      return json({ success: true, ...evaluation });
    }

    return json({ success: false, error: "Action inconnue." }, 400);
  } catch (err) {
    console.error("POST /api/photo-verification :", err);
    const name = (err as { name?: string })?.name;
    if (name === "AccessDeniedException" || name === "AccessDenied") {
      return json({ success: false, code: "AWS_ACCESS_DENIED", error: "Service de vérification momentanément indisponible." }, 503);
    }
    return json({ success: false, error: "La vérification a échoué. Réessayez dans un instant." }, 500);
  }
}

/** Retrait du consentement : suppression du selfie de référence et du badge. */
export async function DELETE() {
  const user = await currentUser();
  if (!user) return json({ success: false, error: "Non autorisé." }, 401);

  await PhotoVerification.deleteOne({ userId: user._id });
  await User.updateOne(
    { _id: user._id },
    { $set: { photoVerified: false, photoVerificationStatus: "none", photoVerifiedAt: null, photoMismatches: [] } }
  );
  return json({ success: true });
}
