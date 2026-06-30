/**
 * POST /api/upload/photo
 * Ajoute une photo supplémentaire au profil (max 3).
 * Accepte un fichier multipart/form-data (champ "file").
 * Retourne { success: true, url: string, photos: string[] }
 *
 * DELETE /api/upload/photo?url=<encoded_url>
 * Supprime une photo du tableau User.photos et sur Cloudinary.
 * Retourne { success: true, photos: string[] }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { ModerationLog } from "@/models/ModerationLog";
import cloudinary from "@/lib/cloudinary";
import {
  getModerationUploadOption,
  evaluateModeration,
  MODERATION_REJECTION_MESSAGE,
} from "@/lib/moderation";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo
const MAX_PHOTOS = 3;

// ── POST — ajouter une photo ───────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisée." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Aucun fichier fourni." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Format non supporté. Utilisez JPG, PNG ou WebP." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Fichier trop lourd (max 5 Mo)." }, { status: 400 });
    }

    await connectDB();
    const email = session.user.email.toLowerCase().trim();
    const user = await User.findOne({ email }).select("photos");

    if (!user) {
      return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });
    }
    if ((user.photos ?? []).length >= MAX_PHOTOS) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_PHOTOS} photos autorisées.` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string; public_id: string; moderation?: unknown }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "sferaluna/photos",
              transformation: [
                { width: 800, height: 1000, crop: "fill", gravity: "face" },
              ],
              resource_type: "image",
              moderation: getModerationUploadOption(),
            },
            (err, res) => {
              if (err || !res) reject(err ?? new Error("Cloudinary upload failed"));
              else resolve(res as { secure_url: string; public_id: string; moderation?: unknown });
            }
          )
          .end(buffer);
      }
    );

    // Modération automatique : rejet → suppression Cloudinary, jamais ajoutée à User.photos.
    const verdict = evaluateModeration(result);
    if (!verdict.approved) {
      await cloudinary.uploader.destroy(result.public_id).catch(() => {});
      await ModerationLog.create({
        userId: user._id,
        context: "profile_photo",
        reason: verdict.reason ?? "Contenu rejeté",
      }).catch(() => {});
      return NextResponse.json(
        { success: false, error: MODERATION_REJECTION_MESSAGE },
        { status: 400 }
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $push: { photos: result.secure_url } },
      { new: true }
    ).select("photos");

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      photos: updatedUser?.photos ?? [],
    });
  } catch (err) {
    console.error("POST /api/upload/photo :", err);
    return NextResponse.json({ success: false, error: "Erreur lors de l'upload." }, { status: 500 });
  }
}

// ── DELETE — supprimer une photo ───────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisée." }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ success: false, error: "Paramètre url manquant." }, { status: 400 });
    }

    await connectDB();
    const email = session.user.email.toLowerCase().trim();

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $pull: { photos: url } },
      { new: true }
    ).select("photos");

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: "Utilisatrice introuvable." }, { status: 404 });
    }

    // Supprimer sur Cloudinary (silencieux si échec)
    try {
      const publicId = extractCloudinaryPublicId(url);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (cloudErr) {
      console.warn("Cloudinary delete échoué :", cloudErr);
    }

    return NextResponse.json({
      success: true,
      photos: updatedUser.photos ?? [],
    });
  } catch (err) {
    console.error("DELETE /api/upload/photo :", err);
    return NextResponse.json({ success: false, error: "Erreur lors de la suppression." }, { status: 500 });
  }
}

// ── Utilitaire ─────────────────────────────────────────────────────────────

/**
 * Extrait le public_id Cloudinary depuis une secure_url.
 * Ex: https://res.cloudinary.com/demo/image/upload/v123/sferaluna/photos/abc.jpg
 *   → sferaluna/photos/abc
 */
function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
