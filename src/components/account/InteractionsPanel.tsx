// src/components/account/InteractionsPanel.tsx

"use client";

/**
 * Mon compte → Mes interactions.
 *
 * Onglets : Matchs · Visiteurs (offre Premium/Elite) · Likes reçus · Historique
 * (likes envoyés). Compteurs cliquables, favoris, tri, et invitation à
 * témoigner pour les membres qui ont déjà matché.
 */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp,
  Bookmark,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Crown,
  Eye,
  Heart,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Sparkles,
  Star,
  ThumbsUp,
  X,
  type LucideIcon,
} from "lucide-react";

import MoonScene from "@/components/dashboard/MoonScene";
import TestimonialForm from "@/components/testimonials/TestimonialForm";
import { AccountHeader, BTN_GRADIENT, BTN_OUTLINE, CARD } from "@/components/account/kit";
import { MatchModal, ProfileMenu, ProfilePhoto, type ExplorerProfile } from "@/components/explorer/shared";
import { cn } from "@/components/site/ui";
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
  interets?: string[];
  recentlyActive?: boolean;
  photoVerified?: boolean;
};

type MatchItem = {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  isFavorite?: boolean;
  messageCount?: number;
  user: Person | null;
};

type Visitor = { user: Person | null; lastVisit: string; visitCount: number };
type LikeItem = { likedAt: string; user: Person; matched?: boolean };

type Tab = "matches" | "visitors" | "received" | "history";
type Sort = "recent" | "unread" | "favorites" | "name";

const SORT_LABELS: Record<Sort, string> = {
  recent: "Plus récents",
  unread: "Non lus d’abord",
  favorites: "Favoris d’abord",
  name: "Prénom (A → Z)",
};

function shortDate(date?: string | null) {
  if (!date) return "";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────

export default function InteractionsPanel({
  canSeeVisitors,
  profileImage,
  onHome,
}: {
  canSeeVisitors: boolean;
  profileImage?: string | null;
  onHome: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("matches");
  const [sort, setSort] = useState<Sort>("recent");
  const [sortOpen, setSortOpen] = useState(false);

  const [matches, setMatches] = useState<MatchItem[] | null>(null);
  const [visitors, setVisitors] = useState<Visitor[] | null>(null);
  const [received, setReceived] = useState<LikeItem[] | null>(null);
  const [sent, setSent] = useState<LikeItem[] | null>(null);
  const [exchanges, setExchanges] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [hasTestimonial, setHasTestimonial] = useState<boolean | null>(null);
  const [testimonialOpen, setTestimonialOpen] = useState(false);

  const [likingId, setLikingId] = useState<string | null>(null);
  const [newMatch, setNewMatch] = useState<{ profile: ExplorerProfile; matchId: string } | null>(null);

  const loadMatches = () =>
    fetch("/api/matches", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setMatches(d?.success ? d.matches ?? [] : []))
      .catch(() => setMatches([]));

  const loadInteractions = () =>
    fetch("/api/interactions", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!d?.success) throw new Error(d?.error);
        setReceived(d.likesReceived ?? []);
        setSent(d.likesSent ?? []);
        setExchanges(d.counts?.exchanges ?? 0);
      })
      .catch(() => {
        setReceived([]);
        setSent([]);
        setError("Une partie de vos interactions n’a pas pu être chargée.");
      });

  useEffect(() => {
    loadMatches();
    loadInteractions();
    fetch("/api/testimonials/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => d?.success && setHasTestimonial(Boolean(d.hasTestimonial)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!canSeeVisitors) {
      setVisitors([]);
      return;
    }
    fetch("/api/visitors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setVisitors(d?.success ? d.visitors ?? [] : []))
      .catch(() => setVisitors([]));
  }, [canSeeVisitors]);

  const sortedMatches = useMemo(() => {
    const list = (matches ?? []).filter((m) => m.user);
    const time = (m: MatchItem) => new Date(m.lastMessageAt || m.createdAt).getTime();
    return [...list].sort((a, b) => {
      if (sort === "unread") return (b.unreadCount ?? 0) - (a.unreadCount ?? 0) || time(b) - time(a);
      if (sort === "favorites") return Number(!!b.isFavorite) - Number(!!a.isFavorite) || time(b) - time(a);
      if (sort === "name") return (a.user!.pseudonyme || "").localeCompare(b.user!.pseudonyme || "", "fr");
      return time(b) - time(a);
    });
  }, [matches, sort]);

  const toggleFavorite = async (m: MatchItem) => {
    const next = !m.isFavorite;
    setMatches((list) => (list ?? []).map((x) => (x.matchId === m.matchId ? { ...x, isFavorite: next } : x)));
    const res = await fetch("/api/matches/favorite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: m.matchId, favorite: next }),
    }).catch(() => null);
    if (!res?.ok) setMatches((list) => (list ?? []).map((x) => (x.matchId === m.matchId ? { ...x, isFavorite: !next } : x)));
  };

  const likeBack = async (person: Person) => {
    setLikingId(person._id);
    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: person._id }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        if (data.matched && data.matchId) setNewMatch({ profile: person as unknown as ExplorerProfile, matchId: data.matchId });
        await Promise.all([loadMatches(), loadInteractions()]);
      } else {
        setError(data?.error || "Le like n’a pas pu être envoyé.");
      }
    } finally {
      setLikingId(null);
    }
  };

  const counts = {
    matches: matches?.length ?? null,
    visitors: canSeeVisitors ? visitors?.length ?? null : null,
    received: received?.length ?? null,
    exchanges,
  };

  const TABS: { id: Tab; label: string; icon: LucideIcon; locked?: boolean }[] = [
    { id: "matches", label: "Matchs", icon: Heart },
    { id: "visitors", label: "Visiteurs", icon: Eye, locked: !canSeeVisitors },
    { id: "received", label: "Likes reçus", icon: ThumbsUp },
    { id: "history", label: "Historique", icon: Clock },
  ];

  const showTestimonial = (matches?.length ?? 0) > 0 && hasTestimonial === false;

  return (
    <div className="relative pb-4">
      <MoonScene className="pointer-events-none absolute -right-10 -top-24 -z-10 hidden h-[260px] w-[760px] opacity-80 md:block" />

      <AccountHeader title="Mes interactions" subtitle="Retrouvez vos matchs, visites et échanges au même endroit." onHome={onHome} />

      <div className="space-y-4">
        {/* Onglets */}
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-violet-300/[0.14] bg-[#1b0d38]/70 p-1.5 backdrop-blur-xl sm:grid-cols-4">
          {TABS.map(({ id, label, icon: Icon, locked }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-medium transition",
                tab === id ? "bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-lg" : "text-white/75 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" /> {label}
              {locked && <Lock className="h-3 w-3 text-amber-200" />}
            </button>
          ))}
        </div>

        {/* Bandeau */}
        <section className="relative overflow-hidden rounded-3xl border border-fuchsia-300/30 bg-gradient-to-r from-[#3a1470]/80 via-[#2a1158]/80 to-[#1b0d38]/80 p-5 backdrop-blur-xl sm:p-6">
          <MoonScene className="pointer-events-none absolute -right-24 bottom-0 h-full w-[520px] opacity-50" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center" aria-hidden>
              <Heart className="absolute h-12 w-12 fill-fuchsia-500/80 text-fuchsia-400" />
              <Heart className="absolute h-7 w-7 translate-x-4 -translate-y-3 text-pink-300" strokeWidth={1.6} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">Vos connexions du moment 💜</h2>
              <p className="mt-1 text-sm text-white/70">
                Découvrez vos matchs et profitez de ces belles opportunités de discussion pour faire de nouvelles rencontres.
              </p>
            </div>
            <Link
              href="/explorer"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 font-semibold text-white shadow-[0_12px_30px_-12px_rgba(251,146,60,0.9)] transition hover:brightness-110"
            >
              <Sparkles className="h-5 w-5" /> Explorer
            </Link>
          </div>
        </section>

        {/* Compteurs */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile tone="pink" icon={Heart} value={counts.matches} label={(n) => (n > 1 ? "matchs" : "match")} onClick={() => setTab("matches")} />
          <StatTile
            tone="blue"
            icon={Eye}
            value={counts.visitors}
            locked={!canSeeVisitors}
            label={(n) => (n > 1 ? "visiteurs" : "visiteur")}
            onClick={() => setTab("visitors")}
          />
          <StatTile tone="amber" icon={ThumbsUp} value={counts.received} label={(n) => (n > 1 ? "likes reçus" : "like reçu")} onClick={() => setTab("received")} />
          <StatTile tone="violet" icon={MessageCircle} value={counts.exchanges} label={(n) => (n > 1 ? "échanges" : "échange")} onClick={() => router.push("/messages")} />
        </div>

        {error && (
          <p className="flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-100">
            {error}
            <button type="button" onClick={() => setError(null)} className="ml-auto" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </p>
        )}

        {/* Contenu de l'onglet */}
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {tab === "matches" && (
              <>
                <ListHead
                  title={`Mes matchs${matches ? ` (${sortedMatches.length})` : ""}`}
                  aside={
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSortOpen((v) => !v)}
                        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-violet-300/25 bg-[#1b0d38]/70 px-4 text-sm text-white/85 hover:border-fuchsia-300/50"
                      >
                        <ArrowDownUp className="h-4 w-4" /> Tri : {SORT_LABELS[sort]} <ChevronDown className="h-4 w-4" />
                      </button>
                      {sortOpen && (
                        <div className="absolute right-0 top-12 z-20 w-56 rounded-2xl border border-violet-300/20 bg-[#1a0c38]/95 p-1.5 shadow-2xl backdrop-blur-2xl">
                          {(Object.keys(SORT_LABELS) as Sort[]).map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setSort(key);
                                setSortOpen(false);
                              }}
                              className={cn("block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/5", key === sort ? "text-fuchsia-200" : "text-white/80")}
                            >
                              {SORT_LABELS[key]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  }
                />
                {matches === null ? (
                  <Loading />
                ) : sortedMatches.length === 0 ? (
                  <Empty icon={Heart} title="Pas encore de match" text="Likez les profils qui vous plaisent : quand c’est réciproque, le match apparaît ici." cta={{ href: "/explorer", label: "Découvrir des profils" }} />
                ) : (
                  <div className="space-y-3">
                    {sortedMatches.map((m) => (
                      <PersonCard
                        key={m.matchId}
                        person={m.user!}
                        badge="💞"
                        meta={{ label: "Dernière activité", date: m.lastMessageAt || m.createdAt }}
                        menu={<ProfileMenu profileId={m.user!._id} profileName={m.user!.pseudonyme} onBlocked={loadMatches} className="[&>button]:bg-white/5" />}
                        actions={
                          <>
                            <Link href={`/profil/${m.user!._id}?from=connexions`} className={cn(BTN_OUTLINE, "h-11 px-4 text-sm")}>
                              <Eye className="h-4 w-4" /> Voir le profil
                            </Link>
                            <Link href={`/messages/${m.matchId}`} className={cn(BTN_GRADIENT, "relative h-11 px-5 text-sm")}>
                              <MessageCircle className="h-4 w-4" /> Message
                              {(m.unreadCount ?? 0) > 0 && (
                                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-fuchsia-600">
                                  {m.unreadCount! > 9 ? "9+" : m.unreadCount}
                                </span>
                              )}
                            </Link>
                            <button
                              type="button"
                              onClick={() => toggleFavorite(m)}
                              aria-pressed={!!m.isFavorite}
                              aria-label={m.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                              className={cn(BTN_OUTLINE, "h-11 w-11 shrink-0 rounded-xl px-0", m.isFavorite && "border-fuchsia-300/60 bg-fuchsia-500/15")}
                            >
                              <Bookmark className={cn("h-4 w-4", m.isFavorite && "fill-fuchsia-300 text-fuchsia-300")} />
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "visitors" &&
              (!canSeeVisitors ? (
                <Locked />
              ) : (
                <>
                  <ListHead title={`Visiteurs${visitors ? ` (${visitors.length})` : ""}`} />
                  {visitors === null ? (
                    <Loading />
                  ) : visitors.length === 0 ? (
                    <Empty icon={Eye} title="Pas encore de visite" text="Complétez votre profil et ajoutez des photos pour être plus visible." cta={{ href: "/mon-compte?tab=profil", label: "Compléter mon profil" }} />
                  ) : (
                    <div className="space-y-3">
                      {visitors
                        .filter((v) => v.user)
                        .map((v) => (
                          <PersonCard
                            key={v.user!._id}
                            person={v.user!}
                            meta={{ label: v.visitCount > 1 ? `${v.visitCount} visites · dernière` : "Visite", date: v.lastVisit }}
                            actions={
                              <Link href={`/profil/${v.user!._id}?from=visiteurs`} className={cn(BTN_OUTLINE, "h-11 px-4 text-sm")}>
                                <Eye className="h-4 w-4" /> Voir le profil
                              </Link>
                            }
                          />
                        ))}
                    </div>
                  )}
                </>
              ))}

            {tab === "received" && (
              <>
                <ListHead title={`Likes reçus${received ? ` (${received.length})` : ""}`} subtitle="Ces membres vous ont likée. Likez en retour pour matcher." />
                {received === null ? (
                  <Loading />
                ) : received.length === 0 ? (
                  <Empty icon={ThumbsUp} title="Aucun like en attente" text="Les likes que vous recevez apparaîtront ici tant que vous n’y avez pas répondu." cta={{ href: "/explorer", label: "Explorer" }} />
                ) : (
                  <div className="space-y-3">
                    {received.map((l) => (
                      <PersonCard
                        key={l.user._id}
                        person={l.user}
                        meta={{ label: "Vous a likée le", date: l.likedAt }}
                        menu={<ProfileMenu profileId={l.user._id} profileName={l.user.pseudonyme} onBlocked={loadInteractions} className="[&>button]:bg-white/5" />}
                        actions={
                          <>
                            <Link href={`/profil/${l.user._id}`} className={cn(BTN_OUTLINE, "h-11 px-4 text-sm")}>
                              <Eye className="h-4 w-4" /> Voir le profil
                            </Link>
                            <button type="button" onClick={() => likeBack(l.user)} disabled={likingId === l.user._id} className={cn(BTN_GRADIENT, "h-11 px-5 text-sm")}>
                              {likingId === l.user._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                              Liker en retour
                            </button>
                          </>
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {tab === "history" && (
              <>
                <ListHead title={`Historique${sent ? ` (${sent.length})` : ""}`} subtitle="Les profils que vous avez likés." />
                {sent === null ? (
                  <Loading />
                ) : sent.length === 0 ? (
                  <Empty icon={Clock} title="Aucun like envoyé" text="Les profils que vous likez apparaîtront ici, avec leur réponse." cta={{ href: "/explorer", label: "Explorer" }} />
                ) : (
                  <div className="space-y-3">
                    {sent.map((l) => (
                      <PersonCard
                        key={l.user._id}
                        person={l.user}
                        status={
                          l.matched ? (
                            <span className="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-200">Match</span>
                          ) : (
                            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-white/65">En attente</span>
                          )
                        }
                        meta={{ label: "Likée le", date: l.likedAt }}
                        actions={
                          <Link href={`/profil/${l.user._id}`} className={cn(BTN_OUTLINE, "h-11 px-4 text-sm")}>
                            <Eye className="h-4 w-4" /> Voir le profil
                          </Link>
                        }
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Témoignage */}
        {showTestimonial && (
          <section className={cn(CARD, "flex flex-col gap-4 sm:flex-row sm:items-center sm:p-6")}>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/15">
              <Star className="h-6 w-6 text-fuchsia-200" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Tu vis l’aventure SferaLuna ?</p>
              <p className="mt-1 text-sm text-white/65">Partage ton expérience pour rassurer les nouvelles membres. Visible après validation.</p>
            </div>
            <button
              type="button"
              onClick={() => setTestimonialOpen(true)}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-pink-500 px-7 font-semibold text-white shadow-lg transition hover:brightness-110"
            >
              <Star className="h-5 w-5" /> Témoigner
            </button>
          </section>
        )}
      </div>

      <AnimatePresence>
        {testimonialOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setTestimonialOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.96 }} animate={{ scale: 1 }} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
              <button
                type="button"
                onClick={() => setTestimonialOpen(false)}
                className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-[#5B4B8A] shadow hover:bg-white"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
              <TestimonialForm
                profileImage={profileImage || null}
                onSuccess={() => {
                  setHasTestimonial(true);
                  setTimeout(() => setTestimonialOpen(false), 1800);
                }}
                onCancel={() => setTestimonialOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <MatchModal profile={newMatch?.profile ?? null} matchId={newMatch?.matchId ?? null} onClose={() => setNewMatch(null)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Briques
// ─────────────────────────────────────────────

const TONES = {
  pink: { card: "border-fuchsia-300/30 from-fuchsia-500/20 to-[#1b0d38]/80", icon: "bg-fuchsia-500/20 text-fuchsia-200" },
  blue: { card: "border-indigo-300/30 from-indigo-500/25 to-[#1b0d38]/80", icon: "bg-indigo-500/25 text-indigo-200" },
  amber: { card: "border-amber-300/30 from-amber-500/20 to-[#1b0d38]/80", icon: "bg-amber-400/20 text-amber-200" },
  violet: { card: "border-violet-300/30 from-violet-500/25 to-[#1b0d38]/80", icon: "bg-violet-500/25 text-violet-200" },
};

function StatTile({
  tone,
  icon: Icon,
  value,
  label,
  onClick,
  locked,
}: {
  tone: keyof typeof TONES;
  icon: LucideIcon;
  value: number | null;
  label: (n: number) => string;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("group flex items-center gap-3 rounded-2xl border bg-gradient-to-br p-4 text-left backdrop-blur-xl transition hover:brightness-110 sm:p-5", TONES[tone].card)}
    >
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14", TONES[tone].icon)}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        {locked ? (
          <>
            <Lock className="h-6 w-6 text-amber-200" />
            <span className="mt-1 block text-sm text-white/70">Premium</span>
          </>
        ) : value === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-white/60" />
        ) : (
          <>
            <span className="block text-2xl font-bold leading-none sm:text-3xl">{value}</span>
            <span className="mt-1 block truncate text-sm text-white/70">{label(value)}</span>
          </>
        )}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/40 transition group-hover:translate-x-0.5" />
    </button>
  );
}

function ListHead({ title, subtitle, aside }: { title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <div className="mb-3 mt-2 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-white/55">{subtitle}</p>}
      </div>
      {aside}
    </div>
  );
}

function PersonCard({
  person,
  badge,
  status,
  meta,
  actions,
  menu,
}: {
  person: Person;
  badge?: string;
  status?: ReactNode;
  meta?: { label: string; date?: string | null };
  actions: ReactNode;
  menu?: ReactNode;
}) {
  const city = person.localisation || getDepartementNom(person.departement) || "";
  const interests = person.interets ?? [];
  return (
    <article className={cn(CARD, "relative flex flex-col gap-4 sm:p-5 lg:flex-row lg:items-center")}>
      {menu && <div className="absolute right-3 top-3">{menu}</div>}
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="relative shrink-0">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-fuchsia-300/40 sm:h-24 sm:w-24">
            <ProfilePhoto src={person.image} name={person.pseudonyme} className="h-full w-full" />
          </div>
          {person.recentlyActive && <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-[#1b0d38] bg-emerald-400" />}
        </div>
        <div className="min-w-0 flex-1 pr-8 lg:pr-0">
          <p className="flex flex-wrap items-center gap-2 text-lg font-bold">
            <span className="truncate">
              {person.pseudonyme}
              {person.age ? <span className="text-fuchsia-200">, {person.age} ans</span> : null}
            </span>
            {badge && <span aria-hidden>{badge}</span>}
            {status}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/70">
            {city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {city}
              </span>
            )}
            {person.recentlyActive && (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
              </span>
            )}
          </p>
          {interests.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {interests.slice(0, 3).map((i) => (
                <span key={i} className="rounded-full border border-violet-300/25 bg-white/[0.04] px-3 py-1 text-xs text-white/85">
                  {interestLabel(i)}
                </span>
              ))}
              {interests.length > 3 && <span className="rounded-full border border-violet-300/25 px-2.5 py-1 text-xs text-white/60">+{interests.length - 3}</span>}
            </div>
          )}
        </div>
      </div>
      {meta?.date && (
        <p className="flex items-start gap-2 text-xs text-white/55 lg:w-40 lg:shrink-0">
          <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {meta.label}
            <br />
            <span className="text-white/75">{shortDate(meta.date)}</span>
          </span>
        </p>
      )}
      <div className="flex flex-wrap gap-2.5 lg:mr-8 lg:shrink-0">{actions}</div>
    </article>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
    </div>
  );
}

function Empty({ icon: Icon, title, text, cta }: { icon: LucideIcon; title: string; text: string; cta?: { href: string; label: string } }) {
  return (
    <div className={cn(CARD, "flex flex-col items-center px-6 py-10 text-center")}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-500/15">
        <Icon className="h-6 w-6 text-fuchsia-200" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-white/60">{text}</p>
      {cta && (
        <Link href={cta.href} className={cn(BTN_GRADIENT, "mt-5 h-11 px-5 text-sm")}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function Locked() {
  return (
    <div className={cn(CARD, "flex flex-col items-center border-amber-300/30 px-6 py-10 text-center")}>
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15">
        <Crown className="h-6 w-6 text-amber-200" />
      </span>
      <p className="mt-4 font-semibold">Voir qui visite votre profil</p>
      <p className="mt-1 max-w-md text-sm text-white/60">Avec l’offre Premium ou Elite, découvrez les membres qui ont consulté votre profil.</p>
      <Link href="/paiement" className={cn(BTN_GRADIENT, "mt-5 h-11 px-5 text-sm")}>
        Voir les offres
      </Link>
    </div>
  );
}

