"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { getPusherClient } from "@/lib/pusher-client";
import ReportModal from "@/components/ReportModal";

interface MessageItem {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}

interface MatchUser {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  image?: string;
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { matchId } = useParams<{ matchId: string }>();

  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [otherUser, setOtherUser] = useState<MatchUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; type: "message" } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string>("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  // Charger les infos du match (autre utilisateur)
  useEffect(() => {
    if (status !== "authenticated" || !matchId) return;

    fetch("/api/matches", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const found = data.matches?.find(
            (m: { matchId: string; user: MatchUser }) => m.matchId === matchId
          );
          if (found?.user) setOtherUser(found.user);
        }
      })
      .catch(console.error);
  }, [status, matchId]);

  // Charger les messages
  const fetchMessages = useCallback(
    async (silent = false) => {
      if (!matchId) return;

      if (!silent) setIsLoading(true);

      try {
        const res = await fetch(`/api/messages/${matchId}`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!data.success) {
          setError(data.error ?? "Impossible de charger les messages.");
          return;
        }

        setCurrentUserId(data.currentUserId ?? "");
        setHasMore(data.hasMore ?? false);

        const incoming: MessageItem[] = data.messages ?? [];

        if (incoming.length === 0) return;

        const lastId = incoming[incoming.length - 1]._id;

        // Ne mettre à jour que si nouveaux messages (évite re-render inutile)
        if (lastId !== lastMessageIdRef.current) {
          lastMessageIdRef.current = lastId;
          setMessages(incoming);

          if (!silent) {
            // Scroll vers le bas à la première charge
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          } else {
            // Scroll seulement si on est déjà en bas
            const container = bottomRef.current?.parentElement;
            if (container) {
              const isAtBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight < 100;
              if (isAtBottom) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
              }
            }
          }
        }
      } catch (err) {
        console.error("Erreur fetchMessages :", err);
        if (!silent) setError("Erreur de connexion au serveur.");
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [matchId]
  );

  // Charge initiale
  useEffect(() => {
    if (status === "authenticated") {
      fetchMessages(false);
    }
  }, [status, fetchMessages]);

  // Pusher — abonnement temps réel au canal du match
  useEffect(() => {
    if (status !== "authenticated" || !matchId) return;

    const channelName = `private-match-${matchId}`;
    const client = getPusherClient();
    const channel = client.subscribe(channelName);

    channel.bind("new-message", (data: MessageItem) => {
      // Ignorer les messages envoyés par soi-même (déjà ajoutés en optimistic)
      if (data.senderId === currentUserId) return;

      setMessages((prev) => {
        // Éviter les doublons
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });

      // Auto-scroll si on est en bas
      setTimeout(() => {
        const container = bottomRef.current?.parentElement;
        if (container) {
          const isAtBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 120;
          if (isAtBottom) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
          }
        }
      }, 50);
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(channelName);
    };
  }, [status, matchId, currentUserId]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setInput("");

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempMessage: MessageItem = {
      _id: tempId,
      matchId,
      senderId: currentUserId,
      content,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

    try {
      const res = await fetch(`/api/messages/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!data.success) {
        // Retirer le message optimiste en cas d'erreur
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setInput(content);
        setError(data.error ?? "Erreur lors de l'envoi.");
        return;
      }

      // Remplacer le message temporaire par le vrai
      setMessages((prev) =>
        prev.map((m) => (m._id === tempId ? data.message : m))
      );
      lastMessageIdRef.current = data.message._id;
    } catch (err) {
      console.error("Erreur envoi message :", err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInput(content);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDay = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (d.toDateString() === yesterday.toDateString()) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  };

  // Grouper les messages par jour
  const groupedMessages: { day: string; messages: MessageItem[] }[] = [];
  for (const msg of messages) {
    const day = formatDay(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.day === day) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ day, messages: [msg] });
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82]">
        <Loader2 className="h-10 w-10 text-purple-300 animate-spin" />
      </div>
    );
  }

  return (
    <>
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      {/* Header chat */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur">
        <Link
          href="/matches"
          className="p-2 rounded-xl hover:bg-white/10 transition"
        >
          <ArrowLeft className="h-5 w-5 text-gray-300" />
        </Link>

        {otherUser ? (
          <>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
              {otherUser.image ? (
                <img
                  src={otherUser.image}
                  alt={otherUser.pseudonyme}
                  className="h-full w-full object-cover"
                />
              ) : (
                otherUser.pseudonyme.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-white truncate">
                {otherUser.pseudonyme}
                {otherUser.age ? `, ${otherUser.age} ans` : ""}
              </h2>
              {otherUser.localisation && (
                <p className="text-xs text-gray-400 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3" />
                  {otherUser.localisation}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1">
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-pink-300 flex-shrink-0">
          <Heart className="h-4 w-4 fill-pink-300" />
          Match
        </div>
      </header>

      {/* Zone messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 text-purple-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="h-16 w-16 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Heart className="h-8 w-8 text-pink-300" />
            </div>
            <div>
              <p className="font-semibold text-white">C&apos;est un match !</p>
              <p className="text-gray-400 text-sm mt-1">
                Envoyez le premier message à {otherUser?.pseudonyme ?? "votre match"} 💬
              </p>
            </div>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => fetchMessages(false)}
                  className="text-xs text-gray-400 hover:text-white transition"
                >
                  Charger les messages précédents
                </button>
              </div>
            )}

            {groupedMessages.map(({ day, messages: dayMsgs }) => (
              <div key={day} className="space-y-2">
                {/* Séparateur de jour */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-gray-500 px-2">{day}</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {dayMsgs.map((msg, i) => {
                  const isOwn = msg.senderId === currentUserId;
                  const isTemp = msg._id.startsWith("temp-");
                  const showTime =
                    i === dayMsgs.length - 1 ||
                    new Date(dayMsgs[i + 1].createdAt).getTime() -
                      new Date(msg.createdAt).getTime() >
                      5 * 60 * 1000;

                  return (
                    <motion.div
                      key={msg._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-1.5 group ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      {/* Bouton signalement (messages reçus uniquement, visible au hover) */}
                      {!isOwn && !isTemp && (
                        <button
                          onClick={() => setReportTarget({ id: msg._id, type: "message" })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-white/10 text-gray-600 hover:text-red-400 flex-shrink-0 mb-1"
                          title="Signaler ce message"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}

                      <div
                        className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}
                      >
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
                            isOwn
                              ? "bg-gradient-to-br from-purple-600 to-pink-600 text-white rounded-br-sm"
                              : "bg-white/10 text-white rounded-bl-sm"
                          } ${isTemp ? "opacity-70" : ""}`}
                        >
                          {msg.content}
                        </div>

                        {showTime && (
                          <span className="text-xs text-gray-500 px-1">
                            {formatTime(msg.createdAt)}
                            {isOwn && msg.readAt && (
                              <span className="ml-1 text-purple-400">· Lu</span>
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
            className="mx-4 mb-2 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-red-200 text-sm"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
            <button
              onClick={() => setError("")}
              className="ml-auto text-red-300 hover:text-white"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zone de saisie */}
      <div className="flex-shrink-0 border-t border-white/10 bg-black/20 backdrop-blur px-4 py-3">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message à ${otherUser?.pseudonyme ?? "votre match"}...`}
            rows={1}
            className="flex-1 resize-none bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-400 transition max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="h-11 w-11 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center hover:opacity-90 transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            ) : (
              <Send className="h-5 w-5 text-white" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-1">
          Entrée pour envoyer · Maj+Entrée pour sauter une ligne
        </p>
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
