// src/app/api/contact/route.ts

/**
 * POST /api/contact  { nom, email, sujet, message }
 *
 * Envoie le message du formulaire de contact à l'équipe (Resend).
 * Destinataire : CONTACT_EMAIL, sinon contact@sferaluna.com.
 * « Répondre » dans la boîte mail répond directement à la membre.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { FROM_EMAIL, resend } from "@/lib/resend";
import { rateLimit } from "@/lib/rate-limiter";

const SUBJECTS: Record<string, string> = {
  technique: "Problème technique",
  abonnement: "Abonnement / Paiement",
  compte: "Mon compte",
  signalement: "Signalement / Sécurité",
  autre: "Autre",
};

const schema = z.object({
  nom: z.string().trim().min(1, "Indiquez votre nom.").max(80),
  email: z.string().trim().email("Adresse e-mail invalide.").max(160),
  sujet: z.enum(["technique", "abonnement", "compte", "signalement", "autre"], { message: "Choisissez un sujet." }),
  message: z.string().trim().min(10, "Votre message est un peu court.").max(1000, "1000 caractères maximum."),
});

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req, 5, 900);
  if (rl.limited) {
    return NextResponse.json({ success: false, error: "Trop de messages envoyés. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide." }, { status: 400 });
  }
  const { nom, email, sujet, message } = parsed.data;

  const session = await getServerSession(authOptions).catch(() => null);
  const memberLine = session?.user?.email
    ? `Membre connectée : ${escape(session.user.email)}${session.user.id ? ` (id ${escape(String(session.user.id))})` : ""}`
    : "Visiteuse non connectée";

  const to = process.env.CONTACT_EMAIL || "contact@sferaluna.com";
  const html = `
    <h2 style="margin:0 0 12px;font-family:sans-serif">Nouveau message — ${escape(SUBJECTS[sujet])}</h2>
    <p style="font-family:sans-serif;margin:0 0 4px"><strong>Nom :</strong> ${escape(nom)}</p>
    <p style="font-family:sans-serif;margin:0 0 4px"><strong>E-mail :</strong> ${escape(email)}</p>
    <p style="font-family:sans-serif;margin:0 0 16px;color:#666">${memberLine}</p>
    <div style="font-family:sans-serif;white-space:pre-wrap;border-left:3px solid #8E7AB5;padding:8px 12px;background:#faf9ff">${escape(message)}</div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: email,
      subject: `[Contact SferaLuna] ${SUBJECTS[sujet]} — ${nom}`,
      html,
    });
    if (error) throw error;
  } catch (err) {
    console.error("POST /api/contact :", err);
    return NextResponse.json(
      { success: false, error: "L’envoi n’a pas abouti. Écrivez-nous directement à contact@sferaluna.com." },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true });
}
