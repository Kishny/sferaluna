// src/app/api/events/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { LunaEvent } from "@/models/LunaEvent";
import mongoose from "mongoose";

/** POST /api/events/[id] — S'inscrire ou se désinscrire d'un événement */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "ID invalide." }, { status: 400 });
    }

    const event = await LunaEvent.findById(id);
    if (!event) {
      return NextResponse.json({ success: false, error: "Événement introuvable." }, { status: 404 });
    }

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const attendeeIndex = event.attendees.findIndex((uid) => uid.equals(currentUserId));
    const isRegistered = attendeeIndex !== -1;

    if (!isRegistered) {
      // Inscription — vérifier que l'événement n'est pas complet
      if (event.attendees.length >= event.maxAttendees) {
        return NextResponse.json(
          { success: false, error: "Cet événement est complet." },
          { status: 409 }
        );
      }
      event.attendees.push(currentUserId);
    } else {
      // Désinscription
      event.attendees.splice(attendeeIndex, 1);
    }

    await event.save();

    return NextResponse.json({
      success: true,
      registered: !isRegistered,
      attendeeCount: event.attendees.length,
    });
  } catch (err) {
    console.error("POST /api/events/[id] :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
