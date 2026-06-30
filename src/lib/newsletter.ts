// src/lib/newsletter.ts
//
// Synchronisation des abonnées vers l'Audience Resend + envoi de broadcasts
// (newsletters / actualités) depuis l'admin SferaLuna.

import { resend, FROM_EMAIL, AUDIENCE_ID } from "./resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sferaluna.com";

/**
 * Ajoute (ou réactive) une abonnée dans l'Audience Resend.
 * Silencieux si l'audience n'est pas configurée — la collecte MongoDB
 * reste la source de vérité, la sync Resend est un bonus.
 */
export async function addNewsletterContact(email: string): Promise<void> {
  if (!AUDIENCE_ID) return;

  try {
    await resend.contacts.create({
      audienceId: AUDIENCE_ID,
      email: email.toLowerCase().trim(),
      unsubscribed: false,
    });
  } catch {
    // Doublon ou erreur réseau : non bloquant.
  }
}

/**
 * Marque une abonnée comme désabonnée dans l'Audience Resend.
 */
export async function unsubscribeNewsletterContact(email: string): Promise<void> {
  if (!AUDIENCE_ID) return;

  try {
    await resend.contacts.update({
      audienceId: AUDIENCE_ID,
      email: email.toLowerCase().trim(),
      unsubscribed: true,
    });
  } catch {
    // Non bloquant.
  }
}

/**
 * Enveloppe HTML d'une newsletter, dans la charte SferaLuna.
 * Inclut le lien de désabonnement requis par Resend pour les broadcasts
 * (placeholder {{{RESEND_UNSUBSCRIBE_URL}}}), conforme RGPD.
 */
export function newsletterWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f3f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#5B4B8A,#8E7AB5);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;">🌙</span>
            <h1 style="color:#ffffff;margin:8px 0 0;font-size:24px;font-weight:700;">SferaLuna</h1>
          </td>
        </tr>
        <tr><td style="padding:40px;color:#444;line-height:1.7;font-size:15px;">${bodyHtml}</td></tr>
        <tr>
          <td style="background:#faf9ff;padding:24px 40px;text-align:center;border-top:1px solid #f0ecff;">
            <p style="color:#999;font-size:12px;margin:0 0 8px;">© ${new Date().getFullYear()} SferaLuna · Rencontrer au féminin, librement.</p>
            <p style="color:#bbb;font-size:11px;margin:0;">
              <a href="${APP_URL}" style="color:#8E7AB5;text-decoration:none;">sferaluna.com</a> ·
              <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#bbb;text-decoration:underline;">Se désabonner</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Convertit un texte brut (avec sauts de ligne) en HTML simple,
 * pour la zone de rédaction admin.
 */
export function plainTextToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 16px;">${para.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export interface BroadcastResult {
  ok: boolean;
  error?: string;
  broadcastId?: string;
}

/**
 * Crée et envoie immédiatement un broadcast à l'Audience Resend.
 * Resend gère la délivrabilité, le lien de désabonnement et l'en-tête
 * List-Unsubscribe au niveau de l'audience.
 */
export async function sendNewsletterBroadcast(
  subject: string,
  contentText: string
): Promise<BroadcastResult> {
  if (!AUDIENCE_ID) {
    return {
      ok: false,
      error:
        "Audience Resend non configurée (RESEND_AUDIENCE_ID manquant). Crée une Audience dans Resend puis renseigne l'ID.",
    };
  }

  try {
    const html = newsletterWrapper(subject, plainTextToHtml(contentText));

    const created = await resend.broadcasts.create({
      audienceId: AUDIENCE_ID,
      from: FROM_EMAIL,
      subject,
      html,
    });

    if (created.error) {
      return {
        ok: false,
        error: `Resend (création) : ${created.error.message}`,
      };
    }

    const broadcastId = created.data?.id;

    if (!broadcastId) {
      return { ok: false, error: "Création du broadcast : réponse vide de Resend." };
    }

    const sent = await resend.broadcasts.send(broadcastId);

    if (sent.error) {
      return { ok: false, error: sent.error.message, broadcastId };
    }

    return { ok: true, broadcastId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur d'envoi du broadcast.";
    return { ok: false, error: message };
  }
}
