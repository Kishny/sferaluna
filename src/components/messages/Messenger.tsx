// src/components/messages/Messenger.tsx

"use client";

/**
 * Messagerie SferaLuna — 3 colonnes :
 *   1. liste des conversations (recherche, Tous / Non lus / Favoris)
 *   2. conversation (messages temps réel via Pusher, accusés de lecture)
 *   3. profil de la personne (à propos, centres d'intérêt, brise-glace,
 *      proposer une activité)
 *
 * /messages            → liste (+ invitation à choisir une conversation)
 * /messages/[matchId]  → conversation ouverte (sur mobile : conversation seule)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CalendarHeart,
  Check,
  CheckCheck,
  ChevronRight,
  Flag,
  Heart,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircle,
  PenSquare,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  User,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import ReportModal from "@/components/ReportModal";
import { NightBackdrop } from "@/components/site/art";
import { cn } from "@/components/site/ui";
import { ProfileMenu, ProfilePhoto } from "@/components/explorer/shared";
import { getPusherClient } from "@/lib/pusher-client";
import { interestLabel } from "@/lib/compatibility";
import { getDepartementNom } from "@/lib/locations";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Person = {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  image?: string;
  bio?: string;
  interets?: string[];
  recentlyActive?: boolean;
};

type Conversation = {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  isFavorite?: boolean;
  lastMessage?: { content: string; fromMe: boolean; createdAt: string } | null;
  user: Person | null;
};

type MessageItem = {
  _id: string;
  matchId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
};

type Filter = "all" | "unread" | "favorites";

const MAX_LENGTH = 1000;
const PANEL = "rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/75 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] backdrop-blur-xl";
const EMOJIS = ["😊", "😂", "🥰", "😍", "😉", "🙏", "👍", "🔥", "✨", "💜", "🌙", "🎶", "☕", "🌊", "🍷", "🙌"];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function listTime(date?: string | null) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
}

function dayLabel(date: string) {
  const d = new Date(date);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Aujourd’hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

const timeOf = (date: string) => new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function mergeMessages(a: MessageItem[], b: MessageItem[]) {
  const map = new Map<string, MessageItem>();
  [...a, ...b].forEach((m) => map.set(m._id, m));
  return [...map.values()].sort((x, y) => new Date(x.createdAt).getTime() - new Date(y.createdAt).getTime());
}

const ICEBREAKERS: Record<string, string> = {
  voyage: "Tu as une destination de rêve ?",
  musique: "Quelle est ta playlist du moment ?",
  nature: "Plutôt montagne ou plage ?",
  cuisine: "Quel est le plat que tu préfères cuisiner ?",
  lecture: "Quel livre t’a marquée dernièrement ?",
  cinema: "Un film que tu pourrais revoir dix fois ?",
  sport: "Quel sport te fait du bien en ce moment ?",
  art: "Une expo ou une artiste qui t’a touchée récemment ?",
  photographie: "Qu’est-ce que tu aimes le plus photographier ?",
  gaming: "À quel jeu tu joues en ce moment ?",
  technologie: "Une appli ou une invention dont tu ne te passerais plus ?",
  mode: "Ta pièce préférée dans ta garde-robe ?",
};
const GENERIC_ICEBREAKERS = ["Qu’est-ce qui t’a fait sourire aujourd’hui ?", "Ton week-end idéal, ça ressemble à quoi ?", "Plutôt lever de soleil ou coucher de soleil ?"];

function icebreakersFor(person?: Person | null) {
  const fromInterests = (person?.interets ?? []).map((i) => ICEBREAKERS[i]).filter(Boolean);
  return [...new Set([...fromInterests, ...GENERIC_ICEBREAKERS])].slice(0, 3);
}

function cityOf(p?: Person | null) {
  if (!p) return "";
  const dept = p.departement ? getDepartementNom(p.departement) : "";
  if (p.localisation && p.departement) return `${p.localisation} (${p.departement})`;
  return p.localisation || dept || "";
}

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

export default function Messenger({ matchId }: { matchId?: string }) {
  const router = useRouter();
  const { status } = useSession();

  // Liste
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  // Conversation ouverte
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [me, setMe] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const current = conversations?.find((c) => c.matchId === matchId) ?? null;
  const other = current?.user ?? null;

  // ── Conversations ──
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      setConversations(data?.success ? data.matches ?? [] : []);
    } catch {
      setConversations((c) => c ?? []);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadConversations();
  }, [status, loadConversations]);

  // ── Messages de la conversation ouverte ──
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const nearBottom = () => {
    const el = scrollRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  useEffect(() => {
    if (status !== "authenticated" || !matchId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setMessages([]);
    fetch(`/api/messages/${matchId}`, { cache: "no-store" })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return;
        if (!ok || !d?.success) {
          setError(d?.error ?? "Impossible de charger la conversation.");
          return;
        }
        setMe(d.currentUserId ?? "");
        setMessages(d.messages ?? []);
        setHasMore(Boolean(d.hasMore));
        setNextBefore(d.pagination?.nextBefore ?? null);
        // La conversation est lue : on met la liste à jour.
        setConversations((list) => list?.map((c) => (c.matchId === matchId ? { ...c, unreadCount: 0 } : c)) ?? list);
        setTimeout(() => scrollToBottom("auto"), 60);
      })
      .catch(() => !cancelled && setError("Erreur de connexion au serveur."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, matchId, scrollToBottom]);

  const loadOlder = async () => {
    if (!matchId || !nextBefore || loadingMore) return;
    const el = scrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    const prevTop = el?.scrollTop ?? 0;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/messages/${matchId}?before=${encodeURIComponent(nextBefore)}`, { cache: "no-store" });
      const d = await res.json().catch(() => null);
      if (res.ok && d?.success) {
        setMessages((prev) => mergeMessages(d.messages ?? [], prev));
        setHasMore(Boolean(d.hasMore));
        setNextBefore(d.pagination?.nextBefore ?? null);
        setTimeout(() => {
          const c = scrollRef.current;
          if (c) c.scrollTop = prevTop + (c.scrollHeight - prevHeight);
        }, 40);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  // ── Temps réel ──
  useEffect(() => {
    if (status !== "authenticated" || !matchId || !me) return;
    const client = getPusherClient();
    const name = `private-match-${matchId}`;
    const channel = client.subscribe(name);
    channel.bind("new-message", (m: MessageItem) => {
      if (m.senderId === me) return;
      setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
      setConversations((list) =>
        list?.map((c) => (c.matchId === matchId ? { ...c, lastMessageAt: m.createdAt, lastMessage: { content: m.content, fromMe: false, createdAt: m.createdAt } } : c)) ?? list
      );
      if (nearBottom()) setTimeout(() => scrollToBottom(), 50);
    });
    channel.bind("messages-read", (e: { readerId: string; readAt: string }) => {
      if (e.readerId === me) return;
      setMessages((prev) => prev.map((m) => (m.senderId === me && !m.readAt ? { ...m, readAt: e.readAt } : m)));
    });
    return () => {
      channel.unbind_all();
      client.unsubscribe(name);
    };
  }, [status, matchId, me, scrollToBottom]);

  // Nouveaux messages dans les autres conversations → la liste se met à jour.
  useEffect(() => {
    if (status !== "authenticated" || !me) return;
    const client = getPusherClient();
    const name = `private-user-${me}`;
    const channel = client.subscribe(name);
    const refresh = () => loadConversations();
    channel.bind("new-message", refresh);
    channel.bind("new-match", refresh);
    return () => {
      channel.unbind("new-message", refresh);
      channel.unbind("new-match", refresh);
      client.unsubscribe(name);
    };
  }, [status, me, loadConversations]);

  // ── Envoi ──
  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || sending || !matchId) return;
    if (content.length > MAX_LENGTH) return setError(`Votre message ne doit pas dépasser ${MAX_LENGTH} caractères.`);
    setSending(true);
    setError("");
    setInput("");
    setEmojiOpen(false);
    const tempId = `temp-${Date.now()}`;
    const temp: MessageItem = { _id: tempId, matchId, senderId: me, content, readAt: null, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, temp]);
    setTimeout(() => scrollToBottom(), 40);
    try {
      const res = await fetch(`/api/messages/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok || !d?.success) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setInput(content);
        setError(d?.error ?? "Le message n’a pas pu être envoyé.");
        return;
      }
      setMessages((prev) => prev.map((m) => (m._id === tempId ? d.message : m)));
      setConversations((list) =>
        list?.map((c) => (c.matchId === matchId ? { ...c, lastMessageAt: d.message.createdAt, lastMessage: { content, fromMe: true, createdAt: d.message.createdAt } } : c)) ?? list
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setInput(content);
      setError("Erreur de connexion pendant l’envoi.");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  useEffect(() => {
    const t = inputRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
  }, [input]);

  const insert = (text: string) => {
    const t = inputRef.current;
    if (!t) return setInput((v) => v + text);
    const start = t.selectionStart ?? input.length;
    const end = t.selectionEnd ?? input.length;
    const next = input.slice(0, start) + text + input.slice(end);
    setInput(next);
    requestAnimationFrame(() => {
      t.focus();
      t.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const applyIcebreaker = (text: string) => {
    setInput(text);
    setPlusOpen(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const toggleFavorite = async (c: Conversation) => {
    const next = !c.isFavorite;
    setConversations((list) => list?.map((x) => (x.matchId === c.matchId ? { ...x, isFavorite: next } : x)) ?? list);
    const res = await fetch("/api/matches/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: c.matchId, favorite: next }),
    }).catch(() => null);
    if (!res?.ok) setConversations((list) => list?.map((x) => (x.matchId === c.matchId ? { ...x, isFavorite: !next } : x)) ?? list);
  };

  // ── Liste filtrée ──
  const unreadTotal = (conversations ?? []).filter((c) => (c.unreadCount ?? 0) > 0).length;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (conversations ?? [])
      .filter((c) => c.user)
      .filter((c) => (filter === "unread" ? (c.unreadCount ?? 0) > 0 : filter === "favorites" ? c.isFavorite : true))
      .filter((c) => !q || c.user!.pseudonyme.toLowerCase().includes(q));
  }, [conversations, filter, query]);

  const grouped = useMemo(() => {
    const groups: { day: string; items: MessageItem[] }[] = [];
    for (const m of messages) {
      const day = dayLabel(m.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.items.push(m);
      else groups.push({ day, items: [m] });
    }
    return groups;
  }, [messages]);

  const notFound = matchId && conversations !== null && !current;

  return (
    <>
      <Header />
      <main className="relative isolate h-[100dvh] overflow-hidden bg-[#12081f] pb-3 pt-20 text-white lg:pt-24">
        <NightBackdrop />
        <div className="mx-auto grid h-full max-w-[1600px] grid-cols-[minmax(0,1fr)] gap-3 px-3 sm:px-4 lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_340px]">
          {/* ── 1. Conversations ── */}
          <aside className={cn(PANEL, "min-h-0 flex-col p-4", matchId ? "hidden lg:flex" : "flex")}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Link href="/mon-compte" className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white lg:hidden" aria-label="Retour au tableau de bord">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <MessageCircle className="hidden h-6 w-6 text-fuchsia-300 lg:block" />
                <h1 className="text-xl font-bold">Messages</h1>
              </div>
              <Link
                href="/mon-compte?tab=connexions"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white shadow-lg hover:brightness-110"
                aria-label="Écrire à un match"
                title="Écrire à un match"
              >
                <PenSquare className="h-4 w-4" />
              </Link>
            </div>

            <label className="relative mt-4 block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une conversation…"
                className="h-11 w-full rounded-2xl border border-violet-300/20 bg-white/[0.04] pl-10 pr-3 text-sm text-white placeholder:text-white/40 focus:border-fuchsia-300/60 focus:outline-none"
              />
            </label>

            <div className="mt-3 flex gap-2">
              {(
                [
                  ["all", "Tous", (conversations ?? []).length],
                  ["unread", "Non lus", unreadTotal],
                  ["favorites", "Favoris", 0],
                ] as [Filter, string, number][]
              ).map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={cn(
                    "relative h-9 rounded-full px-4 text-sm transition",
                    filter === key ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 font-semibold text-white" : "border border-violet-300/25 text-white/75 hover:text-white"
                  )}
                >
                  {label}
                  {key === "unread" && count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white">{count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="-mx-2 mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto px-2">
              {conversations === null ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-fuchsia-300" />
                </div>
              ) : visible.length === 0 ? (
                <div className="px-3 py-10 text-center text-sm text-white/55">
                  {conversations.length === 0 ? (
                    <>
                      Pas encore de conversation.
                      <br />
                      <Link href="/explorer" className="mt-2 inline-block font-semibold text-pink-300 hover:underline">
                        Découvrir des profils
                      </Link>
                    </>
                  ) : filter === "favorites" ? (
                    "Aucune conversation en favori. Touchez le cœur dans une conversation pour l’ajouter."
                  ) : filter === "unread" ? (
                    "Tout est lu ✨"
                  ) : (
                    "Aucun résultat."
                  )}
                </div>
              ) : (
                visible.map((c) => {
                  const u = c.user!;
                  const active = c.matchId === matchId;
                  const unread = c.unreadCount ?? 0;
                  return (
                    <Link
                      key={c.matchId}
                      href={`/messages/${c.matchId}`}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl p-2.5 transition",
                        active ? "border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/25 to-violet-500/15" : "border border-transparent hover:bg-white/[0.04]"
                      )}
                    >
                      <span className="relative shrink-0">
                        <span className="block h-12 w-12 overflow-hidden rounded-full">
                          <ProfilePhoto src={u.image} name={u.pseudonyme} className="h-full w-full" />
                        </span>
                        {u.recentlyActive && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#1b0d38] bg-emerald-400" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {u.pseudonyme}
                            {u.age ? `, ${u.age} ans` : ""}
                          </span>
                          <span className="shrink-0 text-[11px] text-white/45">{listTime(c.lastMessage?.createdAt || c.lastMessageAt || c.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={cn("truncate text-xs", unread ? "font-semibold text-white" : "text-white/55")}>
                            {c.lastMessage ? `${c.lastMessage.fromMe ? "Vous : " : ""}${c.lastMessage.content}` : "Nouveau match ! Dites bonjour 👋"}
                          </span>
                          {unread > 0 && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold">{unread > 9 ? "9+" : unread}</span>
                          )}
                          {!unread && c.isFavorite && <Heart className="h-3.5 w-3.5 shrink-0 fill-fuchsia-400 text-fuchsia-400" />}
                        </span>
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </aside>

          {/* ── 2. Conversation ── */}
          <section className={cn(PANEL, "min-h-0 flex-col overflow-hidden", matchId ? "flex" : "hidden lg:flex")}>
            {!matchId ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-fuchsia-500/15">
                  <MessageCircle className="h-8 w-8 text-fuchsia-200" />
                </span>
                <p className="mt-4 text-lg font-semibold">Choisissez une conversation</p>
                <p className="mt-1 max-w-sm text-sm text-white/60">Retrouvez ici tous vos échanges avec vos matchs.</p>
              </div>
            ) : notFound ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-300" />
                <p className="mt-3 font-semibold">Conversation indisponible</p>
                <p className="mt-1 max-w-sm text-sm text-white/60">Ce match n’existe plus ou la conversation a été fermée.</p>
                <Link href="/messages" className="mt-4 text-sm font-semibold text-pink-300 hover:underline">
                  Retour aux messages
                </Link>
              </div>
            ) : (
              <>
                {/* En-tête */}
                <div className="flex shrink-0 items-center gap-3 border-b border-white/10 p-3 sm:p-4">
                  <Link
                    href="/messages"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
                    aria-label="Retour aux conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Link>
                  {other ? (
                    <>
                      <Link href={`/profil/${other._id}?from=messages`} className="relative shrink-0">
                        <span className="block h-12 w-12 overflow-hidden rounded-full ring-2 ring-fuchsia-400/60">
                          <ProfilePhoto src={other.image} name={other.pseudonyme} className="h-full w-full" />
                        </span>
                        {other.recentlyActive && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#1b0d38] bg-emerald-400" />}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-lg font-bold">
                          {other.pseudonyme}
                          {other.age ? `, ${other.age} ans` : ""}
                        </p>
                        <p className="flex flex-wrap items-center gap-x-3 text-xs text-white/60">
                          {other.recentlyActive && (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
                            </span>
                          )}
                          {cityOf(other) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {other.localisation || cityOf(other)}
                            </span>
                          )}
                        </p>
                      </div>
                      <Link
                        href={`/profil/${other._id}?from=messages`}
                        className="hidden h-10 items-center gap-2 rounded-xl border border-violet-200/30 px-4 text-sm text-white/90 hover:border-fuchsia-300/60 sm:inline-flex"
                      >
                        <User className="h-4 w-4" /> Voir le profil
                      </Link>
                      <ProfileMenu
                        profileId={other._id}
                        profileName={other.pseudonyme}
                        onBlocked={() => {
                          loadConversations();
                          router.push("/messages");
                        }}
                        className="[&>button]:h-10 [&>button]:w-10 [&>button]:border [&>button]:border-violet-200/25 [&>button]:bg-white/[0.04]"
                      />
                      {current && (
                        <button
                          type="button"
                          onClick={() => toggleFavorite(current)}
                          aria-pressed={!!current.isFavorite}
                          aria-label={current.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                          title={current.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition",
                            current.isFavorite ? "bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-lg" : "border border-violet-200/25 bg-white/[0.04] hover:border-fuchsia-300/60"
                          )}
                        >
                          <Heart className={cn("h-5 w-5", current.isFavorite && "fill-white")} />
                        </button>
                      )}
                    </>
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                  )}
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
                  {hasMore && (
                    <div className="mb-4 flex justify-center">
                      <button type="button" onClick={loadOlder} disabled={loadingMore} className="rounded-full border border-violet-300/25 px-4 py-1.5 text-xs text-white/70 hover:text-white">
                        {loadingMore ? "Chargement…" : "Charger les messages précédents"}
                      </button>
                    </div>
                  )}
                  {loading ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-7 w-7 animate-spin text-fuchsia-300" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <Sparkles className="h-8 w-8 text-amber-200" />
                      <p className="mt-3 font-semibold">C’est un match !</p>
                      <p className="mt-1 max-w-xs text-sm text-white/60">Lancez la conversation, ou piochez une idée de brise-glace.</p>
                      <div className="mt-4 flex flex-col gap-2">
                        {icebreakersFor(other).map((t) => (
                          <button key={t} type="button" onClick={() => applyIcebreaker(t)} className="rounded-full border border-fuchsia-300/40 px-4 py-2 text-sm text-fuchsia-50 hover:bg-fuchsia-500/10">
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    grouped.map((g) => (
                      <div key={g.day}>
                        <div className="my-4 flex items-center gap-3">
                          <span className="h-px flex-1 bg-white/10" />
                          <span className="rounded-full border border-violet-300/20 bg-[#1b0d38] px-3 py-1 text-xs text-white/70">{g.day}</span>
                          <span className="h-px flex-1 bg-white/10" />
                        </div>
                        <div className="space-y-3">
                          {g.items.map((m, i) => {
                            const own = m.senderId === me;
                            const prev = g.items[i - 1];
                            const showAvatar = !own && (!prev || prev.senderId !== m.senderId);
                            const pending = m._id.startsWith("temp-");
                            return (
                              <div key={m._id} className={cn("group flex items-end gap-2.5", own ? "justify-end" : "justify-start")}>
                                {!own && (
                                  <span className="block h-9 w-9 shrink-0 overflow-hidden rounded-full">
                                    {showAvatar && other && <ProfilePhoto src={other.image} name={other.pseudonyme} className="h-full w-full" />}
                                  </span>
                                )}
                                <div className={cn("flex max-w-[78%] flex-col sm:max-w-[65%]", own ? "items-end" : "items-start")}>
                                  <div
                                    className={cn(
                                      "whitespace-pre-wrap break-words rounded-3xl px-4 py-3 text-[15px] leading-relaxed",
                                      own
                                        ? "rounded-br-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-[0_10px_30px_-14px_rgba(236,72,153,0.9)]"
                                        : "rounded-bl-lg border border-violet-300/15 bg-[#2a1655]/90 text-white/90",
                                      pending && "opacity-70"
                                    )}
                                  >
                                    {m.content}
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-white/45">
                                    {timeOf(m.createdAt)}
                                    {own &&
                                      (pending ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : m.readAt ? (
                                        <CheckCheck className="h-3.5 w-3.5 text-fuchsia-300" aria-label="Lu" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" aria-label="Envoyé" />
                                      ))}
                                    {!own && (
                                      <button
                                        type="button"
                                        onClick={() => setReportId(m._id)}
                                        className="ml-1 opacity-0 transition hover:text-red-300 focus:opacity-100 group-hover:opacity-100"
                                        aria-label="Signaler ce message"
                                        title="Signaler ce message"
                                      >
                                        <Flag className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Saisie */}
                <div className="relative shrink-0 border-t border-white/10 p-3 sm:p-4">
                  {error && (
                    <p className="mb-2 flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                      <button type="button" onClick={() => setError("")} className="ml-auto" aria-label="Fermer">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </p>
                  )}

                  <AnimatePresence>
                    {plusOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute bottom-full left-3 z-20 mb-2 w-72 rounded-2xl border border-violet-300/20 bg-[#1a0c38]/95 p-2 shadow-2xl backdrop-blur-2xl"
                      >
                        <Link href={`/vibeplanner?match=${matchId}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5">
                          <CalendarHeart className="h-4 w-4 text-fuchsia-300" /> Proposer une activité
                        </Link>
                        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-white/45">Brise-glace</p>
                        {icebreakersFor(other).map((t) => (
                          <button key={t} type="button" onClick={() => applyIcebreaker(t)} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white/85 hover:bg-white/5">
                            {t}
                          </button>
                        ))}
                      </motion.div>
                    )}
                    {emojiOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="absolute bottom-full left-16 z-20 mb-2 grid grid-cols-8 gap-1 rounded-2xl border border-violet-300/20 bg-[#1a0c38]/95 p-2 shadow-2xl backdrop-blur-2xl"
                      >
                        {EMOJIS.map((e) => (
                          <button key={e} type="button" onClick={() => insert(e)} className="flex h-9 w-9 items-center justify-center rounded-lg text-xl hover:bg-white/10">
                            {e}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-end gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPlusOpen((v) => !v);
                        setEmojiOpen(false);
                      }}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-200/25 bg-white/[0.04] text-white/85 hover:border-fuchsia-300/60"
                      aria-label="Plus d’options"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmojiOpen((v) => !v);
                        setPlusOpen(false);
                      }}
                      className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-200/25 bg-white/[0.04] text-white/85 hover:border-fuchsia-300/60 sm:flex"
                      aria-label="Émojis"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          send();
                        }
                      }}
                      rows={1}
                      maxLength={MAX_LENGTH}
                      placeholder={other ? `Écrire un message à ${other.pseudonyme}…` : "Écrire un message…"}
                      className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-violet-300/20 bg-white/[0.05] px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:border-fuchsia-300/60 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => send()}
                      disabled={!input.trim() || sending}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white shadow-[0_10px_30px_-10px_rgba(236,72,153,0.9)] transition hover:brightness-110 disabled:opacity-50"
                      aria-label="Envoyer"
                    >
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                  {input.length > MAX_LENGTH - 150 && <p className="mt-1 text-right text-[11px] text-white/45">{input.length}/{MAX_LENGTH}</p>}
                </div>
              </>
            )}
          </section>

          {/* ── 3. Profil ── */}
          <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto xl:flex">
            {other && current ? (
              <>
                <section className={cn(PANEL, "overflow-hidden p-2")}>
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                    <ProfilePhoto src={other.image} name={other.pseudonyme} className="h-full w-full" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1b0d38] via-transparent to-transparent" />
                    {other.recentlyActive && (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs text-emerald-200 backdrop-blur">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
                      </span>
                    )}
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-2xl font-bold">
                        {other.pseudonyme}
                        {other.age ? `, ${other.age} ans` : ""}
                      </p>
                      {cityOf(other) && (
                        <p className="mt-0.5 flex items-center gap-1 text-sm text-white/75">
                          <MapPin className="h-3.5 w-3.5" /> {cityOf(other)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 p-2 pt-3">
                    <Link
                      href={`/profil/${other._id}?from=messages`}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 font-semibold shadow-lg hover:brightness-110"
                    >
                      <User className="h-5 w-5" /> Voir le profil
                    </Link>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(current)}
                      aria-pressed={!!current.isFavorite}
                      aria-label={current.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                      className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border transition", current.isFavorite ? "border-fuchsia-300/60 bg-fuchsia-500/20" : "border-violet-200/25 hover:border-fuchsia-300/60")}
                    >
                      <Heart className={cn("h-5 w-5", current.isFavorite ? "fill-fuchsia-300 text-fuchsia-300" : "text-fuchsia-300")} />
                    </button>
                  </div>
                </section>

                {other.bio && (
                  <section className={cn(PANEL, "p-4")}>
                    <h3 className="flex items-center gap-2 font-semibold">
                      <span className="h-4 w-4 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400" /> À propos
                    </h3>
                    <p className="mt-2 line-clamp-5 text-sm leading-relaxed text-white/70">{other.bio}</p>
                  </section>
                )}

                {!!other.interets?.length && (
                  <section className={cn(PANEL, "p-4")}>
                    <div className="flex items-center justify-between">
                      <h3 className="flex items-center gap-2 font-semibold">
                        <Heart className="h-4 w-4 fill-pink-400 text-pink-400" /> Centres d’intérêt
                      </h3>
                      <Link href={`/profil/${other._id}?from=messages`} className="text-xs text-pink-300 hover:underline">
                        Voir tout
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {other.interets.slice(0, 8).map((i) => (
                        <span key={i} className="rounded-full border border-violet-300/25 bg-white/[0.04] px-3 py-1.5 text-xs text-white/85">
                          {interestLabel(i)}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className={cn(PANEL, "p-4")}>
                  <h3 className="flex items-center gap-2 font-semibold">
                    <Lightbulb className="h-4 w-4 text-amber-200" /> Brise-glace
                  </h3>
                  <div className="mt-3 space-y-2">
                    {icebreakersFor(other).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => applyIcebreaker(t)}
                        className="flex w-full items-center justify-between gap-2 rounded-2xl border border-violet-300/25 px-3.5 py-2.5 text-left text-sm text-white/85 transition hover:border-fuchsia-300/60"
                      >
                        {t}
                        <Send className="h-4 w-4 shrink-0 text-fuchsia-300" />
                      </button>
                    ))}
                  </div>
                </section>

                <Link
                  href={`/vibeplanner?match=${current.matchId}`}
                  className="flex items-center gap-3 rounded-3xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 p-4 shadow-[0_18px_40px_-18px_rgba(236,72,153,0.9)] transition hover:brightness-110"
                >
                  <CalendarHeart className="h-7 w-7 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">Proposer une activité</span>
                    <span className="block text-xs text-white/85">Suggère une sortie ou une rencontre</span>
                  </span>
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </>
            ) : (
              <section className={cn(PANEL, "flex flex-1 flex-col items-center justify-center p-6 text-center text-sm text-white/55")}>
                <User className="h-8 w-8 text-white/30" />
                <p className="mt-2">Le profil de votre match s’affichera ici.</p>
              </section>
            )}
          </aside>
        </div>
      </main>

      <ReportModal isOpen={!!reportId} targetId={reportId ?? ""} targetType="message" onClose={() => setReportId(null)} />
    </>
  );
}
