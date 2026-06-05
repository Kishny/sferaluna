// src/app/messages/[matchId]/page.tsx

"use client";

/**
 * Page de conversation SferaLuna.
 *
 * Cette page gère :
 * - le chargement des messages d'un match ;
 * - l'affichage de l'autre utilisateur ;
 * - l'envoi de messages ;
 * - l'optimistic UI ;
 * - la réception temps réel avec Pusher ;
 * - le signalement de messages reçus ;
 * - le groupement des messages par jour ;
 * - le chargement des anciens messages avec pagination ;
 * - le responsive mobile-first.
 *
 * Améliorations importantes :
 * - un seul "use client" ;
 * - pagination réelle avec pagination.nextBefore ;
 * - scroll préservé quand on charge les anciens messages ;
 * - meilleure gestion des erreurs ;
 * - zone de saisie plus agréable sur mobile ;
 * - limitation frontend à 1000 caractères, alignée avec l'API.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  MapPin,
  Heart,
  AlertCircle,
  Flag,
  X,
} from "lucide-react";
import Link from "next/link";
import { getPusherClient } from "@/lib/pusher-client";
import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MessageItem {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface MatchUser {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  image?: string;
  identityVerified?: boolean;
}

interface MessagesPagination {
  limit?: number;
  before?: string | null;
  nextBefore?: string | null;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 1000;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTime(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "Date inconnue";

  const today = new Date();
  const yesterday = new Date(today);

  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (date.toDateString() === yesterday.toDateString()) return "Hier";

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

function mergeMessagesWithoutDuplicates(
  oldMessages: MessageItem[],
  newMessages: MessageItem[]
) {
  const map = new Map<string, MessageItem>();

  [...oldMessages, ...newMessages].forEach((message) => {
    map.set(message._id, message);
  });

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function ChatPage() {
  const { status } = useSession();
  const router = useRouter();
  const { matchId } = useParams<{ matchId: string }>();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [otherUser, setOtherUser] = useState<MatchUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [pagination, setPagination] = useState<MessagesPagination | null>(null);

  const [reportTarget, setReportTarget] = useState<{
    id: string;
    type: "message";
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  /**
   * Redirection si non connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Récupère les infos de l'autre utilisateur depuis /api/matches.
   *
   * On conserve ta logique :
   * - on charge tous les matches ;
   * - on cherche celui correspondant au matchId.
   */
  useEffect(() => {
    if (status !== "authenticated" || !matchId) return;

    fetch("/api/matches", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const found = data.matches?.find(
            (match: { matchId: string; user: MatchUser | null }) =>
              match.matchId === matchId
          );

          if (found?.user) {
            setOtherUser(found.user);
          }
        }
      })
      .catch((err) => {
        console.error("Erreur chargement match :", err);
      });
  }, [status, matchId]);

  /**
   * Scroll vers le bas.
   */
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  /**
   * Vérifie si l'utilisateur est proche du bas de la conversation.
   */
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;

    if (!container) return true;

    return (
      container.scrollHeight - container.scrollTop - container.clientHeight < 140
    );
  }, []);

  /**
   * Charge les messages récents.
   *
   * Cette fonction est appelée au premier chargement.
   */
  const fetchMessages = useCallback(async () => {
    if (!matchId) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/messages/${matchId}`, {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error ?? "Impossible de charger les messages.");
        return;
      }

      const incoming: MessageItem[] = data.messages ?? [];

      setCurrentUserId(data.currentUserId ?? "");
      setMessages(incoming);
      setHasMore(Boolean(data.hasMore));
      setPagination(data.pagination ?? null);

      window.setTimeout(() => {
        scrollToBottom("auto");
      }, 80);
    } catch (err) {
      console.error("Erreur fetchMessages :", err);
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsLoading(false);
    }
  }, [matchId, scrollToBottom]);

  /**
   * Charge les messages plus anciens.
   *
   * Important :
   * - on utilise pagination.nextBefore ;
   * - on préserve la position du scroll ;
   * - on ajoute les anciens messages en haut sans doublon.
   */
  const fetchOlderMessages = useCallback(async () => {
    if (!matchId || !pagination?.nextBefore || isLoadingMore) return;

    const container = messagesContainerRef.current;

    const previousScrollHeight = container?.scrollHeight ?? 0;
    const previousScrollTop = container?.scrollTop ?? 0;

    setIsLoadingMore(true);
    setError("");

    try {
      const url = `/api/messages/${matchId}?before=${encodeURIComponent(
        pagination.nextBefore
      )}`;

      const response = await fetch(url, {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setError(data?.error ?? "Impossible de charger les anciens messages.");
        return;
      }

      const olderMessages: MessageItem[] = data.messages ?? [];

      setMessages((previous) =>
        mergeMessagesWithoutDuplicates(olderMessages, previous)
      );

      setHasMore(Boolean(data.hasMore));
      setPagination(data.pagination ?? null);

      /**
       * Préservation du scroll.
       *
       * Après ajout de messages en haut, le scrollHeight augmente.
       * On replace donc l'utilisateur au même endroit visuel.
       */
      window.setTimeout(() => {
        const currentContainer = messagesContainerRef.current;

        if (!currentContainer) return;

        const newScrollHeight = currentContainer.scrollHeight;
        const heightDiff = newScrollHeight - previousScrollHeight;

        currentContainer.scrollTop = previousScrollTop + heightDiff;
      }, 50);
    } catch (err) {
      console.error("Erreur fetchOlderMessages :", err);
      setError("Erreur de connexion pendant le chargement des anciens messages.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [matchId, pagination?.nextBefore, isLoadingMore]);

  /**
   * Charge initiale.
   */
  useEffect(() => {
    if (status === "authenticated") {
      fetchMessages();
    }
  }, [status, fetchMessages]);

  /**
   * Pusher — abonnement temps réel au canal du match.
   */
  useEffect(() => {
    if (status !== "authenticated" || !matchId || !currentUserId) return;

    const channelName = `private-match-${matchId}`;
    const client = getPusherClient();
    const channel = client.subscribe(channelName);

    channel.bind("new-message", (data: MessageItem) => {
      /**
       * On ignore les messages envoyés par soi-même :
       * ils sont déjà ajoutés en optimistic UI.
       */
      if (data.senderId === currentUserId) return;

      setMessages((previous) => {
        if (previous.some((message) => message._id === data._id)) {
          return previous;
        }

        return [...previous, data];
      });

      if (isNearBottom()) {
        window.setTimeout(() => {
          scrollToBottom("smooth");
        }, 50);
      }
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(channelName);
    };
  }, [status, matchId, currentUserId, isNearBottom, scrollToBottom]);

  /**
   * Envoi d'un message.
   */
  const handleSend = async () => {
    const content = input.trim();

    if (!content || isSending || !matchId) return;

    if (content.length > MAX_MESSAGE_LENGTH) {
      setError(`Votre message ne doit pas dépasser ${MAX_MESSAGE_LENGTH} caractères.`);
      return;
    }

    setIsSending(true);
    setError("");
    setInput("");

    /**
     * Optimistic update :
     * on affiche le message immédiatement avec un ID temporaire.
     */
    const tempId = `temp-${Date.now()}`;

    const tempMessage: MessageItem = {
      _id: tempId,
      matchId,
      senderId: currentUserId,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, tempMessage]);

    window.setTimeout(() => {
      scrollToBottom("smooth");
    }, 50);

    try {
      const response = await fetch(`/api/messages/${matchId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setMessages((previous) =>
          previous.filter((message) => message._id !== tempId)
        );

        setInput(content);
        setError(data?.error ?? "Erreur lors de l'envoi.");
        return;
      }

      /**
       * Remplace le message temporaire par le vrai message renvoyé par l'API.
       */
      setMessages((previous) =>
        previous.map((message) =>
          message._id === tempId ? data.message : message
        )
      );
    } catch (err) {
      console.error("Erreur envoi message :", err);

      setMessages((previous) =>
        previous.filter((message) => message._id !== tempId)
      );

      setInput(content);
      setError("Erreur de connexion pendant l'envoi.");
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  /**
   * Entrée pour envoyer, Maj+Entrée pour retour à la ligne.
   *
   * Sur mobile, le bouton d'envoi reste plus naturel.
   * Sur desktop, Entrée accélère l'échange.
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  /**
   * Groupement des messages par jour.
   */
  const groupedMessages = useMemo(() => {
    const groups: { day: string; messages: MessageItem[] }[] = [];

    for (const message of messages) {
      const day = formatDay(message.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && lastGroup.day === day) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          day,
          messages: [message],
        });
      }
    }

    return groups;
  }, [messages]);

  /**
   * Auto-resize du textarea.
   */
  useEffect(() => {
    const textarea = inputRef.current;

    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [input]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <Loader2 className="h-10 w-10 animate-spin text-purple-300" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[100dvh] flex-col bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        {/* Header chat */}
        <header className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/20 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
          <Link
            href="/matches"
            className="rounded-xl p-2 transition hover:bg-white/10"
            aria-label="Retour aux matches"
          >
            <ArrowLeft className="h-5 w-5 text-gray-300" />
          </Link>

          {otherUser ? (
            <>
              <Link
                href={`/profil/${otherUser._id}?from=messages`}
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-bold"
              >
                {otherUser.image ? (
                  <img
                    src={otherUser.image}
                    alt={otherUser.pseudonyme}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  otherUser.pseudonyme.charAt(0).toUpperCase()
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/profil/${otherUser._id}?from=messages`}
                  className="block truncate font-bold text-white transition hover:text-purple-200"
                >
                  {otherUser.pseudonyme}
                  {otherUser.age ? `, ${otherUser.age} ans` : ""}
                </Link>

                {otherUser.localisation && (
                  <p className="flex items-center gap-1 truncate text-xs text-gray-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{otherUser.localisation}</span>
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            </div>
          )}

          <div className="hidden shrink-0 items-center gap-1 text-xs text-pink-300 min-[380px]:flex">
            <Heart className="h-4 w-4 fill-pink-300" />
            Match
          </div>
        </header>

        {/* Zone messages */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-4 sm:px-4"
        >
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-purple-300" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/20">
                <Heart className="h-8 w-8 text-pink-300" />
              </div>

              <div>
                <p className="font-semibold text-white">C&apos;est un match !</p>

                <p className="mt-1 max-w-xs text-sm text-gray-400">
                  Envoyez le premier message à{" "}
                  {otherUser?.pseudonyme ?? "votre match"} 💬
                </p>
              </div>
            </div>
          ) : (
            <>
              {hasMore && (
                <div className="mb-4 text-center">
                  <button
                    onClick={fetchOlderMessages}
                    disabled={isLoadingMore || !pagination?.nextBefore}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoadingMore && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    {isLoadingMore
                      ? "Chargement..."
                      : "Charger les messages précédents"}
                  </button>
                </div>
              )}

              {groupedMessages.map(({ day, messages: dayMessages }) => (
                <div key={day} className="space-y-2">
                  {/* Séparateur de jour */}
                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="rounded-full bg-black/20 px-3 py-1 text-xs text-gray-400">
                      {day}
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {dayMessages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId;
                    const isTemp = message._id.startsWith("temp-");

                    const nextMessage = dayMessages[index + 1];

                    const showTime =
                      index === dayMessages.length - 1 ||
                      Boolean(
                        nextMessage &&
                          new Date(nextMessage.createdAt).getTime() -
                            new Date(message.createdAt).getTime() >
                            5 * 60 * 1000
                      );

                    return (
                      <motion.div
                        key={message._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`group flex items-end gap-1.5 ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Signalement uniquement sur les messages reçus */}
                        {!isOwn && !isTemp && (
                          <button
                            onClick={() =>
                              setReportTarget({
                                id: message._id,
                                type: "message",
                              })
                            }
                            className="mb-1 shrink-0 rounded-lg p-1 text-gray-600 opacity-100 transition hover:bg-white/10 hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                            title="Signaler ce message"
                            aria-label="Signaler ce message"
                          >
                            <Flag className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <div
                          className={`flex max-w-[82%] flex-col gap-1 sm:max-w-[75%] ${
                            isOwn ? "items-end" : "items-start"
                          }`}
                        >
                          <div
                            className={`break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isOwn
                                ? "rounded-br-sm bg-gradient-to-br from-purple-600 to-pink-600 text-white"
                                : "rounded-bl-sm bg-white/10 text-white"
                            } ${isTemp ? "opacity-70" : ""}`}
                          >
                            {message.content}
                          </div>

                          {showTime && (
                            <span className="px-1 text-xs text-gray-500">
                              {formatTime(message.createdAt)}
                              {isOwn && message.readAt && (
                                <span className="ml-1 text-purple-400">
                                  · Lu
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Erreur */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-3 mb-2 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200 sm:mx-4"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="flex-1">{error}</span>

              <button
                onClick={() => setError("")}
                className="text-red-300 transition hover:text-white"
                aria-label="Fermer l'erreur"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zone de saisie */}
        <div className="shrink-0 border-t border-white/10 bg-black/20 px-3 py-3 backdrop-blur sm:px-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) =>
                  setInput(event.target.value.slice(0, MAX_MESSAGE_LENGTH))
                }
                onKeyDown={handleKeyDown}
                placeholder={`Message à ${
                  otherUser?.pseudonyme ?? "votre match"
                }...`}
                rows={1}
                className="max-h-32 w-full resize-none overflow-y-auto rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-relaxed text-white placeholder-gray-500 transition focus:border-purple-400 focus:outline-none"
              />

              <div className="mt-1 flex items-center justify-between px-1">
                <p className="hidden text-xs text-gray-600 sm:block">
                  Entrée pour envoyer · Maj+Entrée pour sauter une ligne
                </p>

                <p
                  className={`ml-auto text-[11px] ${
                    input.length > MAX_MESSAGE_LENGTH - 80
                      ? "text-pink-300"
                      : "text-gray-600"
                  }`}
                >
                  {input.length}/{MAX_MESSAGE_LENGTH}
                </p>
              </div>
            </div>

            <button
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className="mb-6 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-pink-600 transition hover:scale-105 hover:opacity-90 disabled:opacity-40 disabled:hover:scale-100 sm:mb-5"
              aria-label="Envoyer le message"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Send className="h-5 w-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modale signalement message */}
      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        targetType="message"
        targetId={reportTarget?.id ?? ""}
      />
    </>
  );
}
