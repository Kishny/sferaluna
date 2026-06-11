/**
 * POST /api/upload/chat-image
 *
 * Upload une image envoyée dans le chat.
 * Accepte un fichier multipart/form-data (champ "file").
 * Vérifie que l'utilisatrice est authentifiée.
 * Retourne { success: true, url: string }
 *
 * Contraintes :
 * - Formats : JPG, PNG, WebP, GIF
 * - Taille max : 8 Mo
 * - Redimensionnement : max 1200px côté le plus long, qualité 80
 * - Dossier Cloudinary : sferaluna/chat
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import cloudinary from '@/lib/cloudinary';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 8 * 1024 * 1024; // 8 Mo

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: 'Non authentifiée.' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ success: false, error: 'Aucun fichier fourni.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Format non supporté. Utilisez JPG, PNG, WebP ou GIF.' },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: 'Fichier trop lourd (max 8 Mo).' },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const result = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'sferaluna/chat',
              transformation: [
                { width: 1200, height: 1200, crop: 'limit', quality: 80 },
              ],
              resource_type: 'image',
            },
            (err, res) => {
              if (err || !res) reject(err ?? new Error('Cloudinary upload failed'));
              else resolve(res as { secure_url: string });
            }
          )
          .end(buffer);
      }
    );

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error('[upload/chat-image]', err);
    return NextResponse.json(
      { success: false, error: "Échec de l'upload. Réessayez." },
      { status: 500 }
    );
  }
}
