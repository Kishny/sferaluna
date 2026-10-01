// src/lib/photo-verification.ts

/**
 * Vérification des photos de profil (côté serveur uniquement).
 *
 * 1. La membre fait un selfie vivant (contrôle de vivacité AWS Rekognition
 *    Face Liveness) : ce selfie devient son visage de référence.
 * 2. Chaque photo du profil est comparée à ce visage (Rekognition
 *    CompareFaces). La photo principale doit montrer son visage ; les autres
 *    photos peuvent ne contenir aucun visage (paysage, animal…), mais si un
 *    visage apparaît, ce doit être le sien.
 *
 * Variables d'environnement :
 *   AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_REGION
 *   PHOTO_VERIFICATION_ENFORCED=true  → refuse tout ajout de photo tant que
 *                                       la membre n'a pas fait son selfie
 *   PHOTO_VERIFICATION_KEY (facultatif) → clé de chiffrement du selfie
 *                                       (à défaut, dérivée de NEXTAUTH_SECRET)
 */

import crypto from "crypto";
import mongoose from "mongoose";
import {
  CompareFacesCommand,
  CreateFaceLivenessSessionCommand,
  DetectFacesCommand,
  GetFaceLivenessSessionResultsCommand,
  RekognitionClient,
} from "@aws-sdk/client-rekognition";
import { GetFederationTokenCommand, STSClient } from "@aws-sdk/client-sts";

import { PhotoVerification } from "@/models/PhotoVerification";
import { User } from "@/models/User";

/** Score minimal de ressemblance pour accepter une photo (sur 100). */
export const MATCH_THRESHOLD = 90;
/** Score minimal du contrôle de vivacité (sur 100). */
export const LIVENESS_THRESHOLD = 80;
/** Nombre maximal de selfies par 24 h (chaque contrôle est facturé). */
export const MAX_ATTEMPTS_PER_DAY = 5;

export const isPhotoVerificationConfigured = () =>
  Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION);

export const isPhotoVerificationEnforced = () => process.env.PHOTO_VERIFICATION_ENFORCED === "true";

export const awsRegion = () => process.env.AWS_REGION || "eu-west-1";

let rekognition: RekognitionClient | null = null;
let sts: STSClient | null = null;

function rk() {
  if (!rekognition) rekognition = new RekognitionClient({ region: awsRegion() });
  return rekognition;
}

function stsClient() {
  if (!sts) sts = new STSClient({ region: awsRegion() });
  return sts;
}

// ─────────────────────────────────────────────
// Chiffrement du selfie de référence
// ─────────────────────────────────────────────

function encryptionKey() {
  const secret = process.env.PHOTO_VERIFICATION_KEY || `${process.env.NEXTAUTH_SECRET || ""}:sferaluna-photo-verification`;
  if (secret.length < 16) throw new Error("Clé de chiffrement de la vérification photo absente.");
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptReference(bytes: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return { data, iv, tag: cipher.getAuthTag() };
}

export function decryptReference(ref: { data: Buffer; iv: Buffer; tag: Buffer }) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ref.iv));
  decipher.setAuthTag(Buffer.from(ref.tag));
  return Buffer.concat([decipher.update(Buffer.from(ref.data)), decipher.final()]);
}

// ─────────────────────────────────────────────
// Images
// ─────────────────────────────────────────────

/**
 * Rekognition n'accepte que le JPEG et le PNG : on demande à Cloudinary une
 * version JPEG (≤ 1200 px) de la photo.
 */
export function cloudinaryJpegUrl(url: string) {
  return url.includes("/image/upload/") ? url.replace("/image/upload/", "/image/upload/f_jpg,q_85,w_1200,c_limit/") : url;
}

export async function fetchProfileImage(url: string): Promise<Buffer> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") {
    throw new Error("Seules les photos hébergées sur Cloudinary peuvent être vérifiées.");
  }
  const res = await fetch(cloudinaryJpegUrl(url), { cache: "no-store" });
  if (!res.ok) throw new Error(`Photo introuvable (${res.status}).`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > 5 * 1024 * 1024) throw new Error("Photo trop lourde pour la vérification.");
  return buf;
}

// ─────────────────────────────────────────────
// Comparaison
// ─────────────────────────────────────────────

export type PhotoCheck =
  | { ok: true; result: "match"; similarity: number }
  | { ok: true; result: "no_face" }
  | { ok: false; result: "no_face" | "mismatch" | "several_faces_no_match"; similarity?: number };

export async function countFaces(image: Buffer) {
  const out = await rk().send(new DetectFacesCommand({ Image: { Bytes: image }, Attributes: ["DEFAULT"] }));
  return (out.FaceDetails ?? []).filter((f) => (f.Confidence ?? 0) >= 90).length;
}

/**
 * Compare une photo au visage de référence.
 * requireFace : la photo doit contenir le visage de la membre (photo principale).
 */
export async function checkPhoto(reference: Buffer, image: Buffer, { requireFace }: { requireFace: boolean }): Promise<PhotoCheck> {
  const faces = await countFaces(image);
  if (faces === 0) return requireFace ? { ok: false, result: "no_face" } : { ok: true, result: "no_face" };

  const out = await rk().send(
    new CompareFacesCommand({
      SourceImage: { Bytes: reference },
      TargetImage: { Bytes: image },
      SimilarityThreshold: 50,
      QualityFilter: "AUTO",
    })
  );
  const best = Math.max(0, ...(out.FaceMatches ?? []).map((m) => m.Similarity ?? 0));
  if (best >= MATCH_THRESHOLD) return { ok: true, result: "match", similarity: Math.round(best) };
  return { ok: false, result: faces > 1 ? "several_faces_no_match" : "mismatch", similarity: Math.round(best) };
}

export function rejectionMessage(check: PhotoCheck, kind: "avatar" | "photo") {
  if (check.result === "no_face")
    return "Nous ne voyons pas votre visage sur cette photo. Pour la photo principale, choisissez une photo nette de vous, de face.";
  if (check.result === "several_faces_no_match")
    return "Nous ne vous reconnaissons sur aucun des visages de cette photo. Ajoutez une photo où l’on vous voit bien.";
  return kind === "avatar"
    ? "Cette photo ne semble pas vous correspondre. Votre photo principale doit être une photo récente et nette de vous."
    : "Le visage sur cette photo ne semble pas être le vôtre. Seules vos propres photos peuvent être ajoutées à votre profil.";
}

// ─────────────────────────────────────────────
// Selfie de référence
// ─────────────────────────────────────────────

export async function loadReference(userId: mongoose.Types.ObjectId | string): Promise<Buffer | null> {
  const doc = await PhotoVerification.findOne({ userId }).select("+reference").lean();
  if (!doc?.reference?.data) return null;
  return decryptReference(doc.reference as { data: Buffer; iv: Buffer; tag: Buffer });
}

/** Crée une session de vivacité et des identifiants temporaires limités à cette session. */
export async function createLivenessSession(userId: string) {
  const session = await rk().send(new CreateFaceLivenessSessionCommand({ ClientRequestToken: crypto.randomUUID() }));
  if (!session.SessionId) throw new Error("Session de vivacité non créée.");

  const token = await stsClient().send(
    new GetFederationTokenCommand({
      Name: `sfl-${userId.slice(-12)}`,
      DurationSeconds: 900,
      Policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow", Action: "rekognition:StartFaceLivenessSession", Resource: "*" }],
      }),
    })
  );
  const c = token.Credentials;
  if (!c?.AccessKeyId || !c.SecretAccessKey || !c.SessionToken) throw new Error("Identifiants temporaires non créés.");

  return {
    sessionId: session.SessionId,
    credentials: {
      accessKeyId: c.AccessKeyId,
      secretAccessKey: c.SecretAccessKey,
      sessionToken: c.SessionToken,
      expiration: c.Expiration?.toISOString() ?? null,
    },
  };
}

export async function getLivenessResult(sessionId: string) {
  const out = await rk().send(new GetFaceLivenessSessionResultsCommand({ SessionId: sessionId }));
  return {
    status: out.Status,
    confidence: out.Confidence ?? 0,
    reference: out.ReferenceImage?.Bytes ? Buffer.from(out.ReferenceImage.Bytes) : null,
  };
}

// ─────────────────────────────────────────────
// Évaluation de toutes les photos du profil
// ─────────────────────────────────────────────

export type ProfileEvaluation = {
  photoVerified: boolean;
  mainPhoto: "match" | "mismatch" | "no_face" | "missing" | "error";
  mismatches: { url: string; reason: string }[];
};

export async function evaluateProfilePhotos(userId: mongoose.Types.ObjectId | string, reference: Buffer): Promise<ProfileEvaluation> {
  const user = await User.findById(userId).select("image photos").lean();
  if (!user) throw new Error("Utilisateur introuvable.");

  const mismatches: { url: string; reason: string }[] = [];
  let mainPhoto: ProfileEvaluation["mainPhoto"] = "missing";
  let hadError = false;

  if (user.image) {
    try {
      const check = await checkPhoto(reference, await fetchProfileImage(user.image), { requireFace: true });
      mainPhoto = check.ok ? "match" : check.result === "no_face" ? "no_face" : "mismatch";
      if (!check.ok) mismatches.push({ url: user.image, reason: rejectionMessage(check, "avatar") });
    } catch (err) {
      console.error("Vérification photo principale :", err);
      mainPhoto = "error";
      hadError = true;
    }
  }

  for (const url of user.photos ?? []) {
    try {
      const check = await checkPhoto(reference, await fetchProfileImage(url), { requireFace: false });
      if (!check.ok) mismatches.push({ url, reason: rejectionMessage(check, "photo") });
    } catch (err) {
      console.error("Vérification photo de galerie :", err);
      hadError = true;
    }
  }

  const photoVerified = mainPhoto === "match" && mismatches.length === 0 && !hadError;

  await User.updateOne(
    { _id: userId },
    {
      $set: {
        photoVerified,
        photoVerificationStatus: photoVerified ? "verified" : "needs_review",
        photoVerifiedAt: photoVerified ? new Date() : null,
        photoMismatches: mismatches.map((m) => m.url),
      },
    }
  );

  return { photoVerified, mainPhoto, mismatches };
}

// ─────────────────────────────────────────────
// Contrôle à l'ajout d'une photo (routes d'upload)
// ─────────────────────────────────────────────

export type UploadScreening =
  | { allowed: true; verifiedMatch: boolean }
  | { allowed: false; status: number; code: string; error: string };

/**
 * À appeler après l'upload Cloudinary et avant d'enregistrer la photo.
 * - Sans selfie de référence : autorisé (sauf si PHOTO_VERIFICATION_ENFORCED).
 * - Avec selfie : la photo doit correspondre.
 * - En cas d'indisponibilité d'AWS : la photo est acceptée mais le badge
 *   « Photo vérifiée » est retiré jusqu'à la prochaine vérification.
 */
export async function screenUpload(userId: mongoose.Types.ObjectId | string, imageUrl: string, kind: "avatar" | "photo"): Promise<UploadScreening> {
  if (!isPhotoVerificationConfigured()) return { allowed: true, verifiedMatch: false };

  const reference = await loadReference(userId).catch(() => null);

  if (!reference) {
    if (isPhotoVerificationEnforced()) {
      return {
        allowed: false,
        status: 403,
        code: "PHOTO_VERIFICATION_REQUIRED",
        error: "Avant d’ajouter des photos, faites la vérification par selfie : elle garantit que les photos du profil sont bien les vôtres.",
      };
    }
    return { allowed: true, verifiedMatch: false };
  }

  try {
    const check = await checkPhoto(reference, await fetchProfileImage(imageUrl), { requireFace: kind === "avatar" });
    if (!check.ok) return { allowed: false, status: 422, code: "PHOTO_MISMATCH", error: rejectionMessage(check, kind) };
    return { allowed: true, verifiedMatch: check.result === "match" };
  } catch (err) {
    console.error("Vérification photo à l’upload :", err);
    await User.updateOne({ _id: userId }, { $set: { photoVerified: false, photoVerificationStatus: "needs_review" } }).catch(() => {});
    return { allowed: true, verifiedMatch: false };
  }
}
