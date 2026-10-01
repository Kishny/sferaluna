// src/app/api/upload/video/route.ts

/**
 * Courtes vidéos de profil (≤ 15 s, max 2).
 *
 * Les vidéos sont trop lourdes pour passer par nos fonctions serveur :
 * le navigateur les envoie directement à Cloudinary avec une signature
 * que nous fournissons, puis nous contrôlons le résultat.
 *
 * POST { action: "sign" }            → paramètres d'upload signés (dossier et
 *                                      identifiant imposés par le serveur)
 * POST { action: "save", publicId }  → contrôle (durée, poids, visage) puis
 *                                      enregistrement sur le profil
 * DELETE ?publicId=…                 → retrait de la vidéo
 */

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { User } from "@/models/User";
import { MAX_PROFILE_VIDEOS, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from "@/lib/media-limits";
import {
  checkPhoto,
  fetchProfileImage,
  isPhotoVerificationConfigured,
  loadReference,
} from "@/lib/photo-verification";

export const runtime = "nodejs";

const FOLDER = "sferaluna/videos";

const json = (body: Record<string, unknown>, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  await connectDB();
  return User.findOne({ email: session.user.email.toLowerCase().trim() }).select("_id videos banned");
}

/** Image extraite de la vidéo à un instant donné (Cloudinary). */
function frameUrl(publicId: string, offset: string) {
  return cloudinary.url(`${publicId}.jpg`, {
    resource_type: "video",
    secure: true,
    transformation: [{ start_offset: offset, width: 1000, crop: "limit", quality: 85 }],
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return json({ success: false, error: "Non autorisée." }, 401);
  if (user.banned) return json({ success: false, error: "Compte suspendu." }, 403);

  const body = (await req.json().catch(() => ({}))) as { action?: string; publicId?: string };
  const userId = String(user._id);

  // ── Signature d'upload ──
  if (body.action === "sign") {
    if ((user.videos ?? []).length >= MAX_PROFILE_VIDEOS) {
      return json({ success: false, error: `Maximum ${MAX_PROFILE_VIDEOS} vidéos.` }, 400);
    }
    // Les vidéos exigent toujours le selfie de vérification : on doit pouvoir
    // contrôler que c'est bien la membre qui apparaît.
    if (isPhotoVerificationConfigured() && !(await loadReference(user._id).catch(() => null))) {
      return json(
        { success: false, code: "PHOTO_VERIFICATION_REQUIRED", error: "Faites d’abord le selfie de vérification pour ajouter des vidéos." },
        403
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const publicId = `${userId}_${crypto.randomBytes(6).toString("hex")}`;
    const params = { folder: FOLDER, public_id: publicId, timestamp };
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET as string);

    return json({
      success: true,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      ...params,
      signature,
    });
  }

  // ── Contrôle + enregistrement ──
  if (body.action === "save") {
    const publicId = String(body.publicId || "");
    if (!publicId.startsWith(`${FOLDER}/${userId}_`)) {
      return json({ success: false, error: "Vidéo invalide." }, 400);
    }

    const reject = async (status: number, error: string, code = "VIDEO_REJECTED") => {
      await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
      return json({ success: false, code, error }, status);
    };

    let resource: { duration?: number; bytes?: number; secure_url?: string };
    try {
      resource = await cloudinary.api.resource(publicId, { resource_type: "video" });
    } catch {
      return json({ success: false, error: "Vidéo introuvable. Réessayez l’envoi." }, 404);
    }

    if ((user.videos ?? []).length >= MAX_PROFILE_VIDEOS) return reject(400, `Maximum ${MAX_PROFILE_VIDEOS} vidéos.`);
    if (!resource.duration || resource.duration > MAX_VIDEO_SECONDS + 0.5) {
      return reject(422, `Votre vidéo doit durer ${MAX_VIDEO_SECONDS} secondes maximum.`);
    }
    if ((resource.bytes ?? 0) > MAX_VIDEO_BYTES) return reject(422, "Vidéo trop lourde (50 Mo maximum).");

    // Vérification du visage sur 3 images de la vidéo : au moins une doit
    // montrer la membre, et aucun autre visage ne doit être celui de quelqu'un d'autre.
    if (isPhotoVerificationConfigured()) {
      const reference = await loadReference(user._id).catch(() => null);
      if (!reference) return reject(403, "Faites d’abord le selfie de vérification pour ajouter des vidéos.", "PHOTO_VERIFICATION_REQUIRED");

      try {
        let matched = false;
        for (const offset of ["0.5", "50p", "90p"]) {
          const check = await checkPhoto(reference, await fetchProfileImage(frameUrl(publicId, offset)), { requireFace: false });
          if (!check.ok) return reject(422, "Une autre personne semble apparaître dans cette vidéo. Seules des vidéos de vous peuvent être ajoutées.");
          if (check.result === "match") matched = true;
        }
        if (!matched) return reject(422, "Nous ne vous voyons pas dans cette vidéo. Ajoutez une vidéo où l’on voit bien votre visage.");
      } catch (err) {
        console.error("Vérification vidéo :", err);
        return reject(503, "Vérification de la vidéo momentanément indisponible. Réessayez dans un instant.", "VERIFICATION_UNAVAILABLE");
      }
    }

    const video = {
      url: resource.secure_url || cloudinary.url(publicId, { resource_type: "video", secure: true }),
      publicId,
      posterUrl: frameUrl(publicId, "0.5"),
      duration: Math.round((resource.duration ?? 0) * 10) / 10,
      createdAt: new Date(),
    };

    const updated = await User.findOneAndUpdate(
      { _id: user._id, [`videos.${MAX_PROFILE_VIDEOS - 1}`]: { $exists: false } },
      { $push: { videos: video } },
      { new: true }
    ).select("videos");

    if (!updated) return reject(400, `Maximum ${MAX_PROFILE_VIDEOS} vidéos.`);
    return json({ success: true, videos: updated.videos });
  }

  return json({ success: false, error: "Action inconnue." }, 400);
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return json({ success: false, error: "Non autorisée." }, 401);

  const publicId = req.nextUrl.searchParams.get("publicId") || "";
  if (!(user.videos ?? []).some((v: { publicId: string }) => v.publicId === publicId)) {
    return json({ success: false, error: "Vidéo introuvable." }, 404);
  }

  const updated = await User.findOneAndUpdate({ _id: user._id }, { $pull: { videos: { publicId } } }, { new: true }).select("videos");
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" }).catch(() => {});
  return json({ success: true, videos: updated?.videos ?? [] });
}
