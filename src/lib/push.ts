/**
 * Push Notifications — Expo Push API
 *
 * Envoie des notifications push aux utilisatrices de l'app mobile
 * via l'API Expo Push (https://exp.host/--/api/v2/push/send).
 *
 * Usage (depuis une route API) :
 *   import { sendPushNotification, sendNewMessagePush, sendNewMatchPush } from "@/lib/push";
 *
 * Les tokens Expo Push sont stockés dans User.expoPushToken.
 */

import { User } from "@/models/User";
import { connectDB } from "@/lib/db";

export type PushPayload = {
  to: string;           // ExponentPushToken[xxx]
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;   // Android channel ID
};

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// ── Core send function ─────────────────────────────────────────────────────

export async function sendPushNotification(
  payload: PushPayload | PushPayload[]
): Promise<void> {
  const notifications = Array.isArray(payload) ? payload : [payload];

  // Filtre les tokens vides / invalides
  const valid = notifications.filter(
    (n) => n.to && n.to.startsWith("ExponentPushToken[")
  );
  if (valid.length === 0) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(valid),
    });

    if (!res.ok) {
      console.error("[Push] Expo API error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[Push] Erreur envoi:", err);
  }
}

// ── Helpers par type d'événement ───────────────────────────────────────────

/** Notification de nouveau message. */
export async function sendNewMessagePush(params: {
  recipientUserId: string;
  senderName: string;
  preview: string;
  matchId: string;
}): Promise<void> {
  const token = await getPushToken(params.recipientUserId);
  if (!token) return;

  await sendPushNotification({
    to: token,
    title: `💬 ${params.senderName}`,
    body: params.preview.length > 80 ? params.preview.slice(0, 77) + "…" : params.preview,
    data: { type: "new_message", matchId: params.matchId },
    sound: "default",
    channelId: "messages",
  });
}

/** Notification de nouveau match. */
export async function sendNewMatchPush(params: {
  recipientUserId: string;
  matchedWithName: string;
}): Promise<void> {
  const token = await getPushToken(params.recipientUserId);
  if (!token) return;

  await sendPushNotification({
    to: token,
    title: "✨ Nouveau match !",
    body: `Vous avez un match avec ${params.matchedWithName} 🌙`,
    data: { type: "new_match" },
    sound: "default",
    channelId: "matches",
    badge: 1,
  });
}

/** Notification de visite de profil (premium). */
export async function sendProfileVisitPush(params: {
  recipientUserId: string;
  visitorName: string;
}): Promise<void> {
  const token = await getPushToken(params.recipientUserId);
  if (!token) return;

  await sendPushNotification({
    to: token,
    title: "👀 Quelqu'un a visité votre profil",
    body: `${params.visitorName} a consulté votre profil.`,
    data: { type: "profile_visit" },
    sound: "default",
    channelId: "default",
  });
}

// ── Utilitaire ─────────────────────────────────────────────────────────────

async function getPushToken(userId: string): Promise<string | null> {
  await connectDB();
  const user = await User.findById(userId).select("expoPushToken").lean();
  return (user as { expoPushToken?: string } | null)?.expoPushToken ?? null;
}
