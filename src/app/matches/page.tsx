// src/app/matches/page.tsx

"use client";

/**
 * Mes matches — connexions réciproques.
 *
 * Données : GET /api/matches (matches actifs + profil public de l'autre
 * membre, messages non lus, activité récente).
 * Actions : voir le profil détaillé, écrire, proposer un rendez-vous
 * (VibePlanner), signaler / bloquer.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowDownUp,
  CalendarDays,
  Heart,
  MapPin,
  MessageCircle,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

import { ExplorerShell, PhotoVerifiedBadge, ProfileMenu, ProfilePhoto, VerifiedBadge } from "@/components/explorer/shared";
import {
  ActiveBadge,
  BTN_GHOST,
  BTN_PRIMARY,
  EmptyState,
  ErrorBanner,
  FilterPill,
  GradientText,
  INTEREST_ICONS,
  InterestChip,
  LoadingBlock,
  PANEL,
  PANEL_FEATURED,
  PageTitle,
  PillRow,
  SearchField,
  SelectPill,
  StatTile,
  longDate,
  timeAgo,
} from "@/components/app/kit";
import { cn } from "@/components/site/ui";
import { interestLabel } from "@/lib/compatibility";

interface MatchUser {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  interets?: string[];
  intentions?: string[];
  image?: string;
  bio?: string;
  identityVerified?: boolean;
  photoVerified?: boolean;
  recentlyActive?: boolean;
}

interface MatchItem {
  matchId: string;
  createdAt: string;
  lastMessageAt: string | null;
  unreadCount?: number;
  user: MatchUser | null;
}

type Filter = "all" | "active" | "new" | "unread" | `int:${string}`;
type Sort = "recent" | "messages" | "name";

const WEEK = 7 * 24 * 60 * 60 * 1000;

const isNewMatch = (m: MatchItem) => Date.now() - new Date(m.createdAt).getTime() < WEEK && !m.lastMessageAt;
const isThisMonth = (m: MatchItem) => {
  const d = new Date(m.createdAt);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};

function MatchesContent() {
  const router = useRouter();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/matches", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/auth?mode=login&callbackUrl=%2Fmatches");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger vos matches.");
        return;
      }
      setMatches((data.matches ?? []).filter((m: MatchItem) => m.user));
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      all: matches.length,
      active: matches.filter((m) => m.user?.recentlyActive).length,
      new: matches.filter(isNewMatch).length,
      month: matches.filter(isThisMonth).length,
      unread: matches.filter((m) => (m.unreadCount ?? 0) > 0).length,
    }),
    [matches]
  );

  // Les centres d'intérêt les plus fréquents parmi les matches deviennent des filtres rapides.
  const topInterests = useMemo(() => {
    const freq = new Map<string, number>();
    matches.forEach((m) => m.user?.interets?.forEach((i) => freq.set(i, (freq.get(i) ?? 0) + 1)));
    return [...freq.entries()]
      .filter(([key]) => INTEREST_ICONS[key])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([key]) => key);
  }, [matches]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = matches.filter((m) => {
      const u = m.user!;
      if (filter === "active" && !u.recentlyActive) return false;
      if (filter === "new" && !isNewMatch(m)) return false;
      if (filter === "unread" && !(m.unreadCount ?? 0)) return false;
      if (filter.startsWith("int:") && !u.interets?.includes(filter.slice(4))) return false;
      if (!term) return true;
      return (
        u.pseudonyme?.toLowerCase().includes(term) ||
        u.localisation?.toLowerCase().includes(term) ||
        u.interets?.some((i) => i.includes(term) || interestLabel(i).toLowerCase().includes(term))
      );
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return (a.user?.pseudonyme || "").localeCompare(b.user?.pseudonyme || "", "fr");
      if (sort === "messages") {
        const la = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const lb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        if (lb !== la) return lb - la;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return list;
  }, [matches, search, filter, sort]);

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/mon-compte" fallbackLabel="Retour au tableau de bord" />
        <PageTitle
          title={
            <>
              Mes <GradientText>matches</GradientText> <span aria-hidden>💗</span>
            </>
          }
          subtitle="Retrouvez vos connexions réciproques et reprenez la conversation."
        />

        {!loading && matches.length > 0 && (
          <div className="mx-auto mt-7 grid max-w-3xl grid-cols-3 gap-2.5 sm:gap-4">
            <StatTile icon={Heart} value={counts.all} label={`match${counts.all > 1 ? "s" : ""} au total`} />
            <StatTile icon={Users} value={counts.active} label="actives récemment" tone="text-emerald-300" />
            <StatTile icon={Sparkles} value={counts.month} label="nouveaux ce mois-ci" tone="text-amber-300" />
          </div>
        )}

        {error && (
          <div className="mt-6">
            <ErrorBanner message={error} onRetry={load} onClose={() => setError("")} />
          </div>
        )}

        {loading ? (
          <LoadingBlock label="Chargement de vos matches…" />
        ) : matches.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={Heart}
              title="Pas encore de match"
              text="Quand une personne que vous aimez vous aime en retour, elle apparaît ici. Commencez par vos découvertes de la semaine."
              action={
                <Link href="/explorer" className={cn(BTN_PRIMARY, "h-12")}>
                  <Sparkles className="h-4 w-4" /> Voir mes découvertes
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {/* Recherche + tri */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <SearchField
                value={search}
                onChange={setSearch}
                placeholder="Prénom, ville ou centre d’intérêt…"
                className="flex-1"
              />
              <SelectPill<Sort>
                value={sort}
                onChange={setSort}
                icon={ArrowDownUp}
                label="Trier"
                options={[
                  { value: "recent", label: "Plus récents" },
                  { value: "messages", label: "Derniers messages" },
                  { value: "name", label: "Prénom (A → Z)" },
                ]}
              />
            </div>

            {/* Filtres rapides */}
            <PillRow className="mt-4">
              <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
                Tous ({counts.all})
              </FilterPill>
              {counts.active > 0 && (
                <FilterPill
                  active={filter === "active"}
                  onClick={() => setFilter("active")}
                  icon={<span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />}
                >
                  Actives ({counts.active})
                </FilterPill>
              )}
              {counts.new > 0 && (
                <FilterPill active={filter === "new"} onClick={() => setFilter("new")} icon={<Sparkles className="h-4 w-4 text-amber-300" />}>
                  Nouveaux ({counts.new})
                </FilterPill>
              )}
              {counts.unread > 0 && (
                <FilterPill active={filter === "unread"} onClick={() => setFilter("unread")} icon={<MessageCircle className="h-4 w-4" />}>
                  Non lus ({counts.unread})
                </FilterPill>
              )}
              {topInterests.map((key) => {
                const Icon = INTEREST_ICONS[key];
                return (
                  <FilterPill
                    key={key}
                    active={filter === `int:${key}`}
                    onClick={() => setFilter(filter === `int:${key}` ? "all" : `int:${key}`)}
                    icon={<Icon className="h-4 w-4 text-fuchsia-300" />}
                  >
                    {interestLabel(key)}
                  </FilterPill>
                );
              })}
            </PillRow>

            {/* Liste */}
            <div className="mt-6 space-y-4">
              {visible.length === 0 && (
                <p className={cn(PANEL, "px-6 py-10 text-center text-sm text-white/65")}>
                  Aucun match ne correspond à cette recherche.
                </p>
              )}
              {visible.map((m, index) => (
                <MatchCard
                  key={m.matchId}
                  match={m}
                  index={index}
                  onBlocked={() => setMatches((prev) => prev.filter((x) => x.matchId !== m.matchId))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </ExplorerShell>
  );
}

function MatchCard({ match, index, onBlocked }: { match: MatchItem; index: number; onBlocked: () => void }) {
  const u = match.user!;
  const fresh = isNewMatch(match);
  const unread = match.unreadCount ?? 0;
  const interests = u.interets ?? [];

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className={cn(fresh ? PANEL_FEATURED : PANEL, "relative p-4 sm:p-5")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Photo + infos */}
        <div className="flex min-w-0 flex-1 gap-4">
          <Link
            href={`/explorer/profil/${u._id}?from=matches`}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl ring-1 ring-violet-300/25 sm:h-36 sm:w-36"
            aria-label={`Voir le profil de ${u.pseudonyme}`}
          >
            <ProfilePhoto src={u.image} name={u.pseudonyme} className="h-full w-full" />
            {u.recentlyActive && (
              <span className="absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-[#1b0d38] bg-emerald-400" />
            )}
          </Link>

          <div className="min-w-0 flex-1">
            {fresh && (
              <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white">
                <Sparkles className="h-3.5 w-3.5" /> Nouveau match
              </span>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {u.pseudonyme}
                {u.age ? <span className="font-medium">, {u.age}</span> : null}
              </h2>
              {u.identityVerified && <VerifiedBadge small />}
              {u.photoVerified && <PhotoVerifiedBadge small />}
              <ActiveBadge active={u.recentlyActive} />
            </div>
            {u.localisation && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
                <MapPin className="h-4 w-4" /> {u.localisation}
              </p>
            )}

            {interests.length > 0 && (
              <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
                {interests.slice(0, 4).map((i) => (
                  <InterestChip key={i} value={i} small />
                ))}
                {interests.length > 4 && (
                  <span className="rounded-full border border-violet-300/25 px-2.5 py-1 text-xs text-white/70">+{interests.length - 4}</span>
                )}
              </div>
            )}

            {u.bio && (
              <p className="mt-3 hidden max-w-xl truncate rounded-full border border-violet-300/15 bg-white/[0.03] px-4 py-1.5 text-sm italic text-white/80 sm:block">
                “{u.bio}”
              </p>
            )}
          </div>
        </div>

        {/* Mobile : intérêts + bio sous la ligne principale */}
        {(interests.length > 0 || u.bio) && (
          <div className="space-y-2.5 sm:hidden">
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {interests.slice(0, 3).map((i) => (
                  <InterestChip key={i} value={i} small />
                ))}
              </div>
            )}
            {u.bio && <p className="line-clamp-2 text-sm italic text-white/75">“{u.bio}”</p>}
          </div>
        )}

        {/* Actions */}
        <div className="w-full shrink-0 lg:w-[330px]">
          <div className="mb-3 flex items-start justify-between gap-2 lg:justify-end lg:text-right">
            <div className="text-xs text-white/60">
              <p>Match le {longDate(match.createdAt)}</p>
              {match.lastMessageAt ? (
                <p className="mt-0.5">Dernier message {timeAgo(match.lastMessageAt)}</p>
              ) : (
                <p className="mt-0.5 text-fuchsia-200">Pas encore de message</p>
              )}
            </div>
            <ProfileMenu profileId={u._id} profileName={u.pseudonyme} onBlocked={onBlocked} className="-mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href={`/explorer/profil/${u._id}?from=matches`} className={cn(BTN_GHOST, "h-11 px-3 text-sm")}>
              <UserRound className="h-4 w-4" /> Voir le profil
            </Link>
            <Link href={`/messages/${match.matchId}`} className={cn(BTN_PRIMARY, "relative h-11 px-3 text-sm")}>
              <MessageCircle className="h-4 w-4" /> Message
              {unread > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-fuchsia-600">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
            <Link href={`/vibeplanner?match=${match.matchId}`} className={cn(BTN_GHOST, "col-span-2 h-11 px-3 text-sm")}>
              <CalendarDays className="h-4 w-4" /> Planifier un rendez-vous
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <MatchesContent />
    </Suspense>
  );
}
