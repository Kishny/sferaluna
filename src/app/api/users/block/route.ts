/**
 * POST /api/users/block   { targetUserId }  → bloquer (ferme aussi le match / la conversation)
 * DELETE /api/users/block { targetUserId }  → débloquer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { User } from '@/models/User';
import { Match } from '@/models/Match';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifiée' }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId requis' }, { status: 400 });
  if (targetUserId === session.user.id) return NextResponse.json({ error: 'Impossible de se bloquer soi-même' }, { status: 400 });

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    return NextResponse.json({ error: 'targetUserId invalide' }, { status: 400 });
  }

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { blockedUsers: targetUserId },
  });

  // Bloquer ferme aussi la conversation : si les deux membres avaient matché,
  // le match est désactivé (la messagerie exige un match actif). Il n'est pas
  // rétabli en cas de déblocage.
  const me = new mongoose.Types.ObjectId(session.user.id);
  const other = new mongoose.Types.ObjectId(targetUserId);
  await Match.updateMany(
    {
      isActive: true,
      $or: [
        { user1Id: me, user2Id: other },
        { user1Id: other, user2Id: me },
      ],
    },
    { $set: { isActive: false } }
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifiée' }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId requis' }, { status: 400 });

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $pull: { blockedUsers: targetUserId },
  });

  return NextResponse.json({ success: true });
}
