/**
 * DELETE /api/matches/[id]
 *
 * Supprime la conversation du point de vue de l'utilisateur connecté.
 * Si les deux participants ont supprimé → isActive passe à false.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Match } from '@/models/Match';
import mongoose from 'mongoose';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id && !session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifiée' }, { status: 401 });
  }

  const { id: matchId } = await params;
  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json({ error: 'matchId invalide' }, { status: 400 });
  }

  await connectDB();

  // Résoudre l'userId depuis la session
  let userId: string = session.user.id ?? '';
  if (!userId && session.user.email) {
    const u = await User.findOne({ email: session.user.email.toLowerCase() }).select('_id').lean();
    if (!u) return NextResponse.json({ error: 'Utilisatrice introuvable' }, { status: 404 });
    userId = (u._id as mongoose.Types.ObjectId).toString();
  }

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
  });

  if (!match) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }

  // Ajoute l'utilisateur à deletedBy (si pas déjà présent)
  await Match.findByIdAndUpdate(matchId, {
    $addToSet: { deletedBy: new mongoose.Types.ObjectId(userId) },
  });

  // Si les deux participants ont supprimé → désactiver le match
  const updated = await Match.findById(matchId).select('deletedBy user1Id user2Id');
  if (updated) {
    const deletedIds = updated.deletedBy.map((id: mongoose.Types.ObjectId) => id.toString());
    if (
      deletedIds.includes(updated.user1Id.toString()) &&
      deletedIds.includes(updated.user2Id.toString())
    ) {
      await Match.findByIdAndUpdate(matchId, { isActive: false });
    }
  }

  return NextResponse.json({ success: true });
}
