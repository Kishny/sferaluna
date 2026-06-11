/**
 * POST /api/messages/[matchId]/read
 *
 * Marque comme lus tous les messages reçus dans ce match
 * (senderId ≠ utilisatrice connectée, readAt null).
 * Émet l'event Pusher `messages-read` sur le canal du match
 * pour que l'expéditrice voie la double-coche bleue en temps réel.
 *
 * Appelé depuis le mobile dès que l'écran de chat prend le focus,
 * sans avoir à recharger tous les messages.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Match } from '@/models/Match';
import { Message } from '@/models/Message';
import { pusher } from '@/lib/pusher';
import mongoose from 'mongoose';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifiée' }, { status: 401 });
  }

  const { matchId } = await params;
  if (!mongoose.Types.ObjectId.isValid(matchId)) {
    return NextResponse.json({ error: 'matchId invalide' }, { status: 400 });
  }

  await connectDB();

  const currentUser = await User.findOne({
    email: session.user.email.toLowerCase().trim(),
  }).select('_id');
  if (!currentUser) {
    return NextResponse.json({ error: 'Utilisatrice introuvable' }, { status: 404 });
  }
  const currentUserId = currentUser._id as mongoose.Types.ObjectId;

  const match = await Match.findOne({
    _id: matchId,
    $or: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    isActive: true,
  });
  if (!match) {
    return NextResponse.json({ error: 'Match introuvable' }, { status: 404 });
  }

  const readNow = new Date();
  const result = await Message.updateMany(
    {
      matchId: match._id,
      senderId: { $ne: currentUserId },
      readAt: null,
    },
    { $set: { readAt: readNow } }
  );

  if (result.modifiedCount > 0) {
    try {
      await pusher.trigger(
        `private-match-${matchId}`,
        'messages-read',
        { readerId: currentUserId.toString(), readAt: readNow.toISOString() }
      );
    } catch {
      // non bloquant
    }
  }

  return NextResponse.json({ success: true, marked: result.modifiedCount });
}
