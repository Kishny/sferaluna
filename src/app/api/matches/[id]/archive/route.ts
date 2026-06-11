/**
 * PATCH /api/matches/[id]/archive
 *
 * Bascule l'état archivé de la conversation pour l'utilisateur connecté
 * (toggle : archivée → non archivée et vice-versa).
 * L'archivage est par utilisateur : n'affecte pas l'autre participant.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Match } from '@/models/Match';
import mongoose from 'mongoose';

export async function PATCH(
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

  let userId: string = session.user.id ?? '';
  if (!userId && session.user.email) {
    const u = await User.findOne({ email: session.user.email.toLowerCase() }).select('_id').lean();
    if (!u) return NextResponse.json({ error: 'Utilisatrice introuvable' }, { status: 404 });
    userId = (u._id as mongoose.Types.ObjectId).toString();
  }

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: userId }, { user2Id: userId }],
    isActive: true,
  }).select('archivedBy');

  if (!match) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }

  const userObjId = new mongoose.Types.ObjectId(userId);
  const alreadyArchived = match.archivedBy.some(
    (id: mongoose.Types.ObjectId) => id.toString() === userId
  );

  if (alreadyArchived) {
    await Match.findByIdAndUpdate(matchId, { $pull: { archivedBy: userObjId } });
    return NextResponse.json({ success: true, archived: false });
  } else {
    await Match.findByIdAndUpdate(matchId, { $addToSet: { archivedBy: userObjId } });
    return NextResponse.json({ success: true, archived: true });
  }
}
