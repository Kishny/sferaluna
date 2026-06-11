/**
 * POST /api/users/block   { targetUserId }  → bloquer
 * DELETE /api/users/block { targetUserId }  → débloquer
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifiée' }, { status: 401 });

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: 'targetUserId requis' }, { status: 400 });
  if (targetUserId === session.user.id) return NextResponse.json({ error: 'Impossible de se bloquer soi-même' }, { status: 400 });

  await connectDB();
  await User.findByIdAndUpdate(session.user.id, {
    $addToSet: { blockedUsers: targetUserId },
  });

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
