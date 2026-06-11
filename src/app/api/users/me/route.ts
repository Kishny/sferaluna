/**
 * DELETE /api/users/me — Suppression définitive du compte connecté.
 *
 * Obligatoire App Store Apple (guideline 5.1.1). Processus :
 * 1. Annule l'abonnement Stripe actif (en fin de période, sans remboursement)
 * 2. Supprime les photos Cloudinary (avatar + galerie)
 * 3. Supprime toutes les données liées (likes, matches, messages, visites, vibes…)
 * 4. Supprime le document User
 *
 * Authentification : session NextAuth obligatoire.
 */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Like } from '@/models/Like';
import { Match } from '@/models/Match';
import { Message } from '@/models/Message';
import { ProfileVisit } from '@/models/ProfileVisit';
import { VibePost } from '@/models/VibePost';
import { CommunityPost } from '@/models/CommunityPost';
import { MentorPost } from '@/models/MentorPost';
import { JournalEntry } from '@/models/JournalEntry';
import { stripe } from '@/lib/stripe';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Extrait le public_id Cloudinary depuis une URL */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifiée' }, { status: 401 });
  }

  const userId = session.user.id;
  await connectDB();

  const user = await User.findById(userId).select(
    'stripeSubscriptionId stripeCustomerId image photos'
  );
  if (!user) {
    return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
  }

  // ── 1. Annuler l'abonnement Stripe (fin de période, pas de remboursement) ──
  if (user.stripeSubscriptionId) {
    try {
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    } catch {
      // Non bloquant — on continue la suppression même si Stripe échoue
    }
  }

  // ── 2. Supprimer les photos Cloudinary ────────────────────────────────────
  const allPhotos = [user.image, ...(user.photos ?? [])].filter(Boolean) as string[];
  await Promise.allSettled(
    allPhotos.map((url) => {
      const publicId = extractPublicId(url);
      return publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
    })
  );

  // ── 3. Supprimer toutes les données liées ─────────────────────────────────
  await Promise.allSettled([
    Like.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] }),
    Match.deleteMany({ $or: [{ user1Id: userId }, { user2Id: userId }] }),
    Message.deleteMany({ senderId: userId }),
    ProfileVisit.deleteMany({ $or: [{ visitorId: userId }, { visitedId: userId }] }),
    VibePost.deleteMany({ userId }),
    CommunityPost.deleteMany({ userId }),
    MentorPost.deleteMany({ userId }),
    JournalEntry.deleteMany({ userId }),
  ]);

  // ── 4. Supprimer le document User ─────────────────────────────────────────
  await User.findByIdAndDelete(userId);

  return NextResponse.json({ success: true });
}
