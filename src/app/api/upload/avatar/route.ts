// src/app/api/upload/avatar/route.ts
//
// POST /api/upload/avatar
// Accepte un fichier image multipart/form-data (champ "file")
// Upload vers Cloudinary, sauvegarde l'URL dans User.image

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier fourni." },
        { status: 400 }
      );
    }

    // Validation type MIME
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Format non supporté. Utilisez JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    // Validation taille
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "Fichier trop lourd (max 5 Mo)." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Cloudinary
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "sferaluna/avatars",
              transformation: [
                { width: 400, height: 400, crop: "fill", gravity: "face" },
              ],
              resource_type: "image",
            },
            (err, res) => {
              if (err || !res) {
                reject(err ?? new Error("Cloudinary upload failed"));
              } else {
                resolve(res as { secure_url: string; public_id: string });
              }
            }
          )
          .end(buffer);
      }
    );

    // Sauvegarder l'URL dans MongoDB
    await connectDB();

    const email = session.user.email.toLowerCase().trim();
    await User.findOneAndUpdate(
      { email },
      { $set: { image: result.secure_url } }
    );

    return NextResponse.json(
      { success: true, imageUrl: result.secure_url },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur POST /api/upload/avatar :", error);
    const err = error as { message?: string };

    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'upload. Vérifiez vos clés Cloudinary.",
        message: process.env.NODE_ENV === "development" ? err.message : undefined,
      },
      { status: 500 }
    );
  }
}
