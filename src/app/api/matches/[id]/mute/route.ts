/**
 * PATCH /api/matches/[id]/mute
 *
 * Met en sourdine la conversation pour l'utilisateur connecté.
 * Body : { minutes: number }  — durée en minutes (15, 60, 480, 1440…)
 * Body : { minutes: 0 }       — désactiver la sourdine immédiatement
 *
 * La sourdine est par utilisateur : n'affecte pas l'autre participant.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Match } from '@/models/Match';
import mongoose from 'mongoose';

export async function PATCH(
  req: NextRequest,
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

  const body = await req.json().catch(() => ({}));
  const minutes = typeof body?.minutes === 'number' ? body.minutes : null;
  if (minutes === null || minutes < 0) {
    return NextResponse.json({ error: 'minutes requis (≥ 0)' }, { status: 400 });
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
  });

  if (!match) {
    return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 });
  }

  const userObjId = new mongoose.Types.ObjectId(userId);

  // Retirer l'entrée existante pour cet utilisateur (upsert manuel)
  await Match.findByIdAndUpdate(matchId, {
    $pull: { mutedBy: { userId: userObjId } },
  });

  if (minutes === 0) {
    // Sourdine désactivée
    return NextResponse.json({ success: true, mutedUntil: null });
  }

  const until = new Date(Date.now() + minutes * 60 * 1000);
  await Match.findByIdAndUpdate(matchId, {
    $push: { mutedBy: { userId: userObjId, until } },
  });

  return NextResponse.json({ success: true, mutedUntil: until.toISOString() });
}
