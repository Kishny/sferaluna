// src/components/dashboard/useDashboardData.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData } from "./types";

/**
 * Charge /api/dashboard et le garde à jour :
 * - au retour sur l'onglet du navigateur ;
 * - en temps réel via Pusher (canal private-user-{id}) sur "new-match"
 *   et "new-message" ;
 * - via refresh() après une action (ex : inscription à un événement).
 *
 * onRealtime permet au parent de rafraîchir aussi ses notifications.
 */
export function useDashboardData(
  userId: string | undefined,
  enabled: boolean,
  onRealtime?: () => void
) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onRealtimeRef = useRef(onRealtime);
  onRealtimeRef.current = onRealtime;

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        setError(json?.error || "Impossible de charger le tableau de bord.");
        return;
      }

      const { success: _success, ...payload } = json;
      setData(payload as DashboardData);
      setError(null);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  // Rafraîchit quand l'utilisatrice revient sur l'onglet.
  useEffect(() => {
    if (!enabled) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh();
        onRealtimeRef.current?.();
      }
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, refresh]);

  // Temps réel Pusher (silencieux si Pusher n'est pas configuré).
  useEffect(() => {
    if (!userId || !enabled) return;

    let cleanup: (() => void) | undefined;
    let timer: number | undefined;
    let cancelled = false;

    const handler = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        refresh();
        onRealtimeRef.current?.();
      }, 400);
    };

    (async () => {
      try {
        const { getPusherClient } = await import("@/lib/pusher-client");
        if (cancelled) return;
        const pusher = getPusherClient();
        const channelName = `private-user-${userId}`;
        const channel = pusher.subscribe(channelName);

        channel.bind("new-match", handler);
        channel.bind("new-message", handler);

        cleanup = () => {
          channel.unbind("new-match", handler);
          channel.unbind("new-message", handler);
          pusher.unsubscribe(channelName);
        };
      } catch {
        // Pas de Pusher (clé absente en dev) : on reste sur le rafraîchissement manuel.
      }
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanup?.();
    };
  }, [userId, enabled, refresh]);

  return { data, isLoading, error, refresh };
}
