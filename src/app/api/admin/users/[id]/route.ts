// src/app/api/admin/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v2 as cloudinary } from "cloudinary";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Like } from "@/models/Like";
import { Match } from "@/models/Match";
import { Message } from "@/models/Message";
import { ProfileVisit } from "@/models/ProfileVisit";
import { VibePost } from "@/models/VibePost";
import { CommunityPost } from "@/models/CommunityPost";
import { MentorPost } from "@/models/MentorPost";
import { JournalEntry } from "@/models/JournalEntry";
import { Boost } from "@/models/Boost";
import { Testimonial } from "@/models/Testimonial";
import { LunaEvent } from "@/models/LunaEvent";
import { stripe } from "@/lib/stripe";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Extrait le public_id Cloudinary depuis une URL. */
function extractPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * DELETE /api/admin/users/[id]
 *
 * Suppression définitive d'une utilisatrice par un admin.
 * Utile notamment pour nettoyer les comptes de test, afin que les
 * statistiques publiques (/api/stats) et les compteurs (matchs, messages,
 * événements) restent cohérents.
 *
 * Étapes (même logique que la suppression "self" dans /api/users/me) :
 * 1. Vérifier que l'appelant est bien admin.
 * 2. Empêcher la suppression de soi-même ou d'un autre admin.
 * 3. Annuler l'abonnement Stripe actif (fin de période, sans remboursement).
 * 4. Supprimer les photos Cloudinary (avatar + galerie).
 * 5. Supprimer toutes les données liées : likes, matches, messages, visites
 *    de profil, vibes, posts communauté, questions/réponses VibeMentor,
 *    journal émotionnel, boosts, témoignage, et retrait des listes
 *    d'inscrits aux événements Luna.
 * 6. Supprimer le document User.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    await connectDB();

    const adminUser = await User.findOne({
      email: session.user.email.toLowerCase().trim(),
    }).select("_id role");

    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Accès refusé." },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (adminUser._id.toString() === id) {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer votre propre compte depuis cet écran." },
        { status: 400 }
      );
    }

    const target = await User.findById(id).select(
      "_id email role stripeSubscriptionId image photos"
    );

    if (!target) {
      return NextResponse.json(
        { success: false, error: "Utilisatrice introuvable." },
        { status: 404 }
      );
    }

    if (target.role === "admin") {
      return NextResponse.json(
        { success: false, error: "Impossible de supprimer un autre compte admin." },
        { status: 400 }
      );
    }

    const userId = target._id;

    // ── 1. Annuler l'abonnement Stripe (fin de période, pas de remboursement) ──
    if (target.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(target.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch {
        // Non bloquant — on continue la suppression même si Stripe échoue.
      }
    }

    // ── 2. Supprimer les photos Cloudinary ──────────────────────────────────
    const allPhotos = [target.image, ...(target.photos ?? [])].filter(
      Boolean
    ) as string[];

    await Promise.allSettled(
      allPhotos.map((url) => {
        const publicId = extractPublicId(url);
        return publicId ? cloudinary.uploader.destroy(publicId) : Promise.resolve();
      })
    );

    // ── 3. Supprimer toutes les données liées ───────────────────────────────
    await Promise.allSettled([
      Like.deleteMany({ $or: [{ fromUserId: userId }, { toUserId: userId }] }),
      Match.deleteMany({ $or: [{ user1Id: userId }, { user2Id: userId }] }),
      Message.deleteMany({ senderId: userId }),
      ProfileVisit.deleteMany({ $or: [{ visitorId: userId }, { visitedId: userId }] }),
      VibePost.deleteMany({ userId }),
      CommunityPost.deleteMany({ userId }),
      MentorPost.deleteMany({ userId }),
      JournalEntry.deleteMany({ userId }),
      Boost.deleteMany({ userId }),
      Testimonial.deleteMany({ userId }),
      LunaEvent.updateMany({ attendees: userId }, { $pull: { attendees: userId } }),
    ]);

    // ── 4. Supprimer le document User ───────────────────────────────────────
    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { success: true, message: `${target.email} a été supprimée définitivement.` },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Erreur DELETE /api/admin/users/[id] :", error);

    return NextResponse.json(
      { success: false, error: "Erreur serveur lors de la suppression." },
      { status: 500 }
    );
  }
}
