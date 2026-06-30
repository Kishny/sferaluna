// src/app/api/admin/newsletter/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models/NewsletterSubscriber";
import { sendNewsletterBroadcast } from "@/lib/newsletter";
import { AUDIENCE_ID } from "@/lib/resend";

export const runtime = "nodejs";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id || user.role !== "admin") return null;
  return user;
}

/**
 * GET /api/admin/newsletter
 * Renvoie le nombre d'abonnées et l'état de configuration de l'Audience.
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  await connectDB();
  const subscriberCount = await NewsletterSubscriber.countDocuments();

  return NextResponse.json({
    success: true,
    subscriberCount,
    audienceConfigured: Boolean(AUDIENCE_ID),
  });
}

/**
 * POST /api/admin/newsletter
 * Rédige et envoie une newsletter à l'Audience Resend.
 * Body : { subject, content }
 */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const subject = (body?.subject ?? "").toString().trim();
  const content = (body?.content ?? "").toString().trim();

  if (subject.length < 3) {
    return NextResponse.json(
      { error: "L'objet doit faire au moins 3 caractères." },
      { status: 400 }
    );
  }

  if (content.length < 20) {
    return NextResponse.json(
      { error: "Le contenu doit faire au moins 20 caractères." },
      { status: 400 }
    );
  }

  const result = await sendNewsletterBroadcast(subject, content);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Envoi échoué." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    broadcastId: result.broadcastId,
  });
}
