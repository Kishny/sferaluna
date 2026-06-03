// src/lib/emails.ts
// Templates HTML pour les emails transactionnels SferaLuna

import { resend, FROM_EMAIL } from "./resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sferaluna.com";

// ─── Helpers de layout ────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SferaLuna</title>
</head>
<body style="margin:0;padding:0;background:#f5f3f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3f7;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#5B4B8A,#8E7AB5);padding:32px 40px;text-align:center;">
            <span style="font-size:28px;">🌙</span>
            <h1 style="color:#ffffff;margin:8px 0 0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">SferaLuna</h1>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#faf9ff;padding:24px 40px;text-align:center;border-top:1px solid #f0ecff;">
            <p style="color:#999;font-size:12px;margin:0;">© ${new Date().getFullYear()} SferaLuna · Rencontrer au féminin, librement.</p>
            <p style="color:#bbb;font-size:11px;margin:8px 0 0;">Si tu n'es pas à l'origine de cette action, ignore cet email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(text: string, url: string): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#5B4B8A,#8E7AB5);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:600;font-size:16px;">${text}</a>
  </div>`;
}

// ─── Email : vérification d'adresse email ─────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  pseudonyme: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Bienvenue sur SferaLuna, ${pseudonyme} 🌸</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Ton compte a bien été créé ! Il ne reste qu'une étape : confirmer ton adresse email pour activer ton profil.
    </p>
    ${primaryButton("Vérifier mon adresse email", verifyUrl)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">
      Ce lien expire dans <strong>24 heures</strong>.<br/>
      Si le bouton ne fonctionne pas, copie ce lien : <br/>
      <span style="color:#8E7AB5;word-break:break-all;">${verifyUrl}</span>
    </p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🌙 Confirme ton adresse email — SferaLuna",
    html,
  });
}

// ─── Email : reset mot de passe ───────────────────────────────────────────────

export async function sendResetPasswordEmail(
  to: string,
  pseudonyme: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;

  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Réinitialisation de mot de passe</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 8px;">Bonjour ${pseudonyme},</p>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Tu as demandé à réinitialiser ton mot de passe. Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.
    </p>
    ${primaryButton("Réinitialiser mon mot de passe", resetUrl)}
    <p style="color:#999;font-size:13px;text-align:center;margin:0;">
      Ce lien expire dans <strong>1 heure</strong>.<br/>
      Si tu n'as pas fait cette demande, ignore cet email — ton compte est en sécurité.
    </p>
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "🔐 Réinitialisation de ton mot de passe — SferaLuna",
    html,
  });
}

// ─── Email : bienvenue après vérification ─────────────────────────────────────

export async function sendWelcomeEmail(
  to: string,
  pseudonyme: string
): Promise<void> {
  const html = emailWrapper(`
    <h2 style="color:#1C1C1C;font-size:22px;margin:0 0 8px;">Ton email est confirmé ✨</h2>
    <p style="color:#666;line-height:1.6;margin:0 0 24px;">
      Bienvenue dans la communauté SferaLuna, ${pseudonyme} ! Ton profil est maintenant actif.
      Complète-le pour commencer à rencontrer des profils qui te correspondent vraiment.
    </p>
    ${primaryButton("Compléter mon profil", `${APP_URL}/inscription`)}
  `);

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "✨ Bienvenue sur SferaLuna !",
    html,
  });
}
