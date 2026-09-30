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

    /**
     * Aperçu des participantes (avatars) et organisatrice.
     * Les profils invisibles ou bannis n'apparaissent jamais dans l'aperçu.
     */
    const previewIds = new Set<string>();
    events.forEach((event) => {
      event.attendees.slice(0, 12).forEach((uid) => previewIds.add(uid.toString()));
      if (event.createdBy) previewIds.add(event.createdBy.toString());
    });

    const people = await User.find({ _id: { $in: [...previewIds] } })
      .select("_id pseudonyme image identityVerified visibilite banned role")
      .lean();
    const peopleById = new Map(people.map((p) => [p._id.toString(), p]));

    const enriched = events.map((event) => {
      const isRegistered = event.attendees.some((uid) => uid.equals(currentUserId));
      const isPast = event.date < now;
      const isFull = event.attendees.length >= event.maxAttendees;

      const attendeePreview = event.attendees
        .map((uid) => peopleById.get(uid.toString()))
        .filter((p): p is NonNullable<typeof p> => !!p && p.visibilite !== "invisible" && !p.banned)
        .slice(0, 4)
        .map((p) => ({ _id: p._id.toString(), pseudonyme: p.pseudonyme, image: p.image || "" }));

      const creator = event.createdBy ? peopleById.get(event.createdBy.toString()) : undefined;
      const organizer = creator
        ? creator.role === "admin"
          ? { pseudonyme: "L’équipe SferaLuna", image: "", identityVerified: true, isTeam: true }
          : { pseudonyme: creator.pseudonyme, image: creator.image || "", identityVerified: !!creator.identityVerified, isTeam: false }
        : null;

      return {
        ...event,
        attendeeCount: event.attendees.length,
        attendeePreview,
        organizer,
        isRegistered,
        isPast,
        isFull,
      };
    });

    /** Chiffres réels affichés en tête de page. */
    const pastAttendees = new Set<string>();
    events.filter((e) => e.date < now).forEach((e) => e.attendees.forEach((uid) => pastAttendees.add(uid.toString())));
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const stats = {
      participantsPast: pastAttendees.size,
      eventsThisYear: events.filter((e) => e.date >= yearStart).length,
      upcoming: events.filter((e) => e.date >= now).length,
    };

    return NextResponse.json({ success: true, events: enriched, stats });
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
