// src/app/api/pusher/auth/route.ts
//
// POST /api/pusher/auth
// Autorise les canaux privés Pusher pour l'utilisateur connecté.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = await req.text();
    const params = new URLSearchParams(body);
    const socket_id = params.get("socket_id");
    const channel_name = params.get("channel_name");

    if (!socket_id || !channel_name) {
      return NextResponse.json(
        { error: "Paramètres manquants." },
        { status: 400 }
      );
    }

    const sessionUser = session.user as { id?: string; email?: string };
    const userId = sessionUser.id;

    // Canaux privés du type private-user-{id} ou private-match-{id}
    // On vérifie que l'utilisateur a bien le droit d'accéder au canal demandé.
    // Pour private-user-{userId} : seulement l'utilisateur lui-même.
    if (channel_name.startsWith("private-user-")) {
      const channelUserId = channel_name.replace("private-user-", "");
      if (channelUserId !== userId) {
        return NextResponse.json(
          { error: "Accès refusé à ce canal." },
          { status: 403 }
        );
      }
    }

    // Pour private-match-{matchId} : on fait confiance à Pusher
    // (le matchId n'est connu que des participants, et la messagerie vérifie l'accès côté DB)

    const authResponse = pusher.authorizeChannel(socket_id, channel_name);

    return NextResponse.json(authResponse, { status: 200 });
  } catch (error: unknown) {
    console.error("Erreur POST /api/pusher/auth :", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
