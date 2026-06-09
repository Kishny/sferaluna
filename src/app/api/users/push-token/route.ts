/**
 * PUT /api/users/push-token
 *
 * Enregistre ou met à jour le token Expo Push Notifications
 * de l'utilisatrice connectée dans MongoDB.
 * Appelé par l'app mobile au démarrage (lib/notifications.ts).
 *
 * Body : { pushToken: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifiée." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { pushToken } = body as { pushToken?: string };

  if (!pushToken || typeof pushToken !== "string" || pushToken.length < 10) {
    return NextResponse.json({ error: "pushToken invalide." }, { status: 400 });
  }

  await connectDB();

  await User.findByIdAndUpdate(session.user.id, {
    $set: { expoPushToken: pushToken, expoPushTokenUpdatedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
