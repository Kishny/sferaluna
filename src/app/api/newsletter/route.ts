// src/app/api/newsletter/route.ts

import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { NewsletterSubscriber } from "@/models/NewsletterSubscriber";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Adresse email invalide." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await NewsletterSubscriber.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existing) {
      // On ne révèle pas si l'email existe déjà — même réponse positive
      return NextResponse.json({ success: true });
    }

    await NewsletterSubscriber.create({ email: email.toLowerCase().trim() });

    // Envoi email de bienvenue newsletter via Resend (non-bloquant)
    try {
      const { resend, FROM_EMAIL } = await import("@/lib/resend");
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: "Bienvenue dans la newsletter SferaLuna 💜",
        html: `
          <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background: #faf9ff;">
            <div style="background: linear-gradient(135deg, #5B4B8A, #8E7AB5); border-radius: 16px; padding: 32px; text-align: center; margin-bottom: 24px;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🌙 SferaLuna</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 15px;">La newsletter de ta communauté</p>
            </div>
            <h2 style="color: #5B4B8A; font-size: 20px; margin-bottom: 12px;">Tu fais partie de l'aventure 💜</h2>
            <p style="color: #444; line-height: 1.7; margin-bottom: 16px;">
              Merci pour ton inscription ! Tu seras parmi les premières à recevoir :
            </p>
            <ul style="color: #666; line-height: 2; padding-left: 20px; margin-bottom: 24px;">
              <li>Les conseils exclusifs de la communauté Luna</li>
              <li>Les événements à venir</li>
              <li>Les nouvelles fonctionnalités en avant-première</li>
            </ul>
            <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E8E0FF; color: #999; font-size: 12px;">
              © 2025 SferaLuna — Une communauté sécurisée pour femmes
            </div>
          </div>
        `,
      });
    } catch {
      // L'email de confirmation n'est pas critique
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Newsletter] Erreur :", error);
    return NextResponse.json(
      { error: "Une erreur est survenue. Réessaie." },
      { status: 500 }
    );
  }
}
