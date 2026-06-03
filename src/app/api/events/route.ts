// src/app/api/events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { LunaEvent } from "@/models/LunaEvent";
import mongoose from "mongoose";

/** GET /api/events — Liste des événements publiés */
export async function GET(req: NextRequest) {
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

    const currentUserId = currentUser._id as mongoose.Types.ObjectId;
    const now = new Date();

    const events = await LunaEvent.find({ isPublished: true })
      .sort({ date: 1 })
      .lean();

    const enriched = events.map((event) => {
      const isRegistered = event.attendees.some((uid) => uid.equals(currentUserId));
      const isPast = event.date < now;
      const isFull = event.attendees.length >= event.maxAttendees;

      return {
        ...event,
        attendeeCount: event.attendees.length,
        isRegistered,
        isPast,
        isFull,
      };
    });

    return NextResponse.json({ success: true, events: enriched });
  } catch (err) {
    console.error("GET /api/events :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

/** POST /api/events — Créer un événement (admin uniquement) */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Non autorisé." }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findOne({ email: session.user.email.toLowerCase() })
      .select("_id role")
      .lean();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Utilisateur introuvable." }, { status: 404 });
    }

    if (currentUser.role !== "admin") {
      return NextResponse.json({ success: false, error: "Accès réservé aux administrateurs." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, location, isOnline, maxAttendees, category, emoji, coverEmoji } = body;

    if (!title?.trim() || !description?.trim() || !date || !location?.trim() || !maxAttendees || !category || !emoji) {
      return NextResponse.json({ success: false, error: "Champs requis manquants." }, { status: 400 });
    }

    const event = await LunaEvent.create({
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      location: location.trim(),
      isOnline: isOnline ?? false,
      maxAttendees: Number(maxAttendees),
      category: category.trim(),
      emoji,
      coverEmoji: coverEmoji ?? "🌙",
      createdBy: currentUser._id,
      isPublished: true,
    });

    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err) {
    console.error("POST /api/events :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
