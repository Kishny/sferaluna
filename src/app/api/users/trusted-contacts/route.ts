// src/app/api/users/trusted-contacts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

/**
 * Circle of Six — contacts de confiance du réseau de sécurité personnel.
 *
 * GET    → liste des contacts de confiance de l'utilisatrice connectée
 * POST   → ajoute un contact { name, phone } (max 6)
 * DELETE → retire un contact (?id=<sousDocumentId>)
 *
 * Persistance serveur (champ User.trustedContacts) pour synchro multi-appareils
 * avec l'app mobile. On utilise findOneAndUpdate ($push/$pull) plutôt que
 * document.save() pour ne pas déclencher le pre-save hook du modèle.
 */

const MAX_CONTACTS = 6;

type RawContact = { _id?: unknown; name?: string; phone?: string; addedAt?: unknown };

function serialize(contacts: RawContact[] | undefined) {
  return (contacts ?? []).map((c) => ({
    id: c._id ? String(c._id) : undefined,
    name: c.name,
    phone: c.phone,
    addedAt: c.addedAt,
  }));
}

async function getSessionEmail() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return session.user.email.toLowerCase().trim();
}

export async function GET() {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email }).select("trustedContacts");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, contacts: serialize(user.trustedContacts as RawContact[]) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur GET /api/users/trusted-contacts :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Le numéro de téléphone est requis.", code: "PHONE_REQUIRED" },
        { status: 400 }
      );
    }

    await connectDB();

    const current = await User.findOne({ email }).select("trustedContacts");
    if (!current) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }
    if ((current.trustedContacts?.length ?? 0) >= MAX_CONTACTS) {
      return NextResponse.json(
        {
          success: false,
          error: `Vous ne pouvez pas dépasser ${MAX_CONTACTS} contacts de confiance.`,
          code: "MAX_CONTACTS_REACHED",
        },
        { status: 400 }
      );
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $push: { trustedContacts: { name: name || "Contact", phone, addedAt: new Date() } } },
      { new: true, runValidators: true }
    ).select("trustedContacts");

    return NextResponse.json(
      { success: true, contacts: serialize(updated?.trustedContacts as RawContact[]) },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur POST /api/users/trusted-contacts :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = await getSessionEmail();
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Non autorisé.", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Identifiant du contact manquant.", code: "ID_REQUIRED" },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await User.findOneAndUpdate(
      { email },
      { $pull: { trustedContacts: { _id: id } } },
      { new: true }
    ).select("trustedContacts");

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable.", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, contacts: serialize(updated.trustedContacts as RawContact[]) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur DELETE /api/users/trusted-contacts :", error);
    return NextResponse.json({ success: false, error: "Erreur serveur." }, { status: 500 });
  }
}
