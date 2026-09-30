// src/app/circle/page.tsx

"use client";

/**
 * Circle of Six — les 6 affinités de la semaine.
 *
 * Même sélection hebdomadaire que « Vos découvertes du jour » (/explorer),
 * via GET /api/explorer/selection : les deux pages montrent toujours les
 * mêmes 6 profils, avec la même affinité estimée.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Compass,
  Heart,
  Loader2,
  MapPin,
  MessageSquareText,
  Sparkles,
  Star,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import HexagonSix from "@/components/icons/HexagonSix";
import {
  ExplorerShell,
  MatchModal,
  ProfilePhoto,
  VerifiedBadge,
  rememberList,
  useLike,
  type ExplorerProfile,
} from "@/components/explorer/shared";
import {
  ActiveBadge,
  BTN_GHOST,
  BTN_PRIMARY,
  EmptyState,
  ErrorBanner,
  Eyebrow,
  InterestChip,
  LoadingBlock,
  PANEL,
  PANEL_FEATURED,
} from "@/components/app/kit";
import { cn } from "@/components/site/ui";
import type { Compatibility, ReasonKey } from "@/lib/compatibility";

type CircleProfile = ExplorerProfile & {
  compatibility: Compatibility;
  likedByMe: boolean;
  matchId: string | null;
};

const REASON_ICONS: Record<ReasonKey, LucideIcon> = {
  likedYou: Heart,
  intentions: Heart,
  interests: Users,
  proximity: MapPin,
  age: Sparkles,
  active: Star,
};

function ScoreRing({ value }: { value: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
        />
        <defs>
          <linearGradient id="ring" x1="0" x2="1">
            <stop offset="0" stopColor="#c084fc" />
            <stop offset="1" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">{value}%</span>
    </div>
  );
}

function AffinityBar({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/75">Affinité estimée</span>
        <span className="font-semibold text-fuchsia-200">{value}%</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-pink-500" style={{ width: `${Math.max(4, value)}%` }} />
      </div>
    </div>
  );
}

function CircleContent() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<CircleProfile[]>([]);
  const [weekOf, setWeekOf] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<{ profile: ExplorerProfile; matchId: string } | null>(null);
  const { like, pendingId, error: likeError } = useLike();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explorer/selection", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/auth?mode=login&callbackUrl=%2Fcircle");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger votre cercle.");
        return;
      }
      setProfiles(data.profiles ?? []);
      setWeekOf(data.weekOf ?? null);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const openHref = (p: CircleProfile) => `/explorer/profil/${p._id}?from=circle`;
  const remember = () => rememberList("decouvertes", profiles.map((p) => p._id));

  const handleLike = async (p: CircleProfile) => {
    const result = await like(p._id);
    if (!result.ok) return;
    setProfiles((prev) => prev.map((x) => (x._id === p._id ? { ...x, likedByMe: true, matchId: result.matchId ?? x.matchId } : x)));
    if (result.matchId) setMatch({ profile: p, matchId: result.matchId });
  };

  const weekLabel = weekOf
    ? new Date(weekOf).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const [featured, ...others] = profiles;

  const likeButton = (p: CircleProfile, className = "") =>
    p.matchId ? (
      <Link href={`/messages/${p.matchId}`} className={cn(BTN_PRIMARY, "h-12", className)}>
        <MessageSquareText className="h-5 w-5" /> Écrire
      </Link>
    ) : p.likedByMe ? (
      <span className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-300/40 bg-emerald-500/15 px-5 font-semibold text-emerald-100", className)}>
        <Check className="h-5 w-5" /> Aimée
      </span>
    ) : (
      <button type="button" onClick={() => handleLike(p)} disabled={pendingId === p._id} className={cn(BTN_PRIMARY, "h-12", className)}>
        {pendingId === p._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />} J’aime
      </button>
    );

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── En-tête ── */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <Eyebrow icon={Sparkles}>Sélection hebdomadaire</Eyebrow>
            <h1 className="mt-4 flex items-center gap-3 text-[38px] font-extrabold leading-tight tracking-tight text-white sm:text-6xl">
              <HexagonSix size={52} className="shrink-0" />
              Circle of Six
            </h1>
            <p className="mt-3 text-lg text-white/85 sm:text-xl">Vos 6 affinités les plus alignées de la semaine.</p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
              Ces profils ont été choisis à partir de vos intentions, de vos centres d’intérêt, de la proximité et de l’activité récente. Une nouvelle sélection chaque lundi.
            </p>
            {weekLabel && (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-white/85 sm:text-base">
                <CalendarDays className="h-5 w-5 text-fuchsia-300" /> Semaine du {weekLabel}
              </p>
            )}
          </div>

          <div className={cn(PANEL, "grid gap-5 p-5 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10")}>
            {[
              { icon: Heart, title: "Des affinités réelles", text: "Calculées à partir de vos intentions et de vos passions." },
              { icon: Users, title: "Six profils, pas plus", text: "Une sélection courte, choisie avec soin chaque semaine." },
              { icon: Sparkles, title: "Plus de sens", text: "Moins de bruit, plus de belles connexions." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 sm:flex-col sm:items-center sm:px-4 sm:text-center">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15">
                  <f.icon className="h-5 w-5 text-fuchsia-200" />
                </span>
                <div>
                  <p className="font-semibold text-white">{f.title}</p>
                  <p className="mt-1 text-sm leading-snug text-white/65">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorBanner message={error} onRetry={load} />
          </div>
        )}
        {likeError && <p className="mt-4 text-center text-sm text-rose-300">{likeError}</p>}

        {loading ? (
          <LoadingBlock label="Préparation de votre cercle…" />
        ) : !featured ? (
          !error && (
            <div className="mt-10">
              <EmptyState
                icon={Users}
                title="Votre cercle se prépare"
                text="Aucun profil compatible n’est disponible pour le moment. Complétez votre profil pour de meilleures affinités, ou explorez librement."
                action={
                  <Link href="/explorer/libre" className={cn(BTN_PRIMARY, "h-12")}>
                    <Compass className="h-4 w-4" /> Explorer librement
                  </Link>
                }
              />
            </div>
          )
        ) : (
          <>
            {/* ── Profil n°1 + suivant ── */}
            <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <motion.article
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(PANEL_FEATURED, "grid gap-5 p-4 sm:p-5 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[260px_minmax(0,1fr)_minmax(0,0.9fr)]")}
              >
                <Link href={openHref(featured)} onClick={remember} className="relative block aspect-[4/5] overflow-hidden rounded-2xl md:aspect-auto md:min-h-[280px]">
                  <ProfilePhoto src={featured.image || featured.gallery?.[0]} name={featured.pseudonyme} className="absolute inset-0 h-full w-full" />
                  <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white">
                    <Star className="h-3.5 w-3.5 fill-white" /> N°1 de votre cercle
                  </span>
                </Link>

                <div className="flex min-w-0 flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                      {featured.pseudonyme}
                      {featured.age ? `, ${featured.age}` : ""}
                    </h2>
                    {featured.identityVerified && <VerifiedBadge small />}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/75">
                    {featured.localisation && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {featured.localisation}
                      </span>
                    )}
                    <ActiveBadge active={featured.recentlyActive} />
                  </div>
                  {featured.bio && <p className="mt-4 line-clamp-4 text-[15px] italic leading-relaxed text-white/85">“{featured.bio}”</p>}
                  {!!featured.interets?.length && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {featured.interets.slice(0, 4).map((i) => (
                        <InterestChip key={i} value={i} small highlight={featured.compatibility.sharedInterests.includes(i)} />
                      ))}
                    </div>
                  )}
                  <div className="mt-auto grid grid-cols-2 gap-2.5 pt-5">
                    <Link href={openHref(featured)} onClick={remember} className={cn(BTN_GHOST, "h-12 whitespace-nowrap px-3")}>
                      <UserRound className="h-5 w-5" /> Profil
                    </Link>
                    {likeButton(featured)}
                  </div>
                </div>

                <div className="rounded-2xl border border-violet-300/15 bg-[#160a31]/70 p-4 md:col-span-2 lg:col-span-1">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <Sparkles className="h-5 w-5 text-fuchsia-300" /> Pourquoi ce profil ?
                  </p>
                  <ul className="mt-3 space-y-3">
                    {featured.compatibility.reasons.slice(0, 3).map((r) => {
                      const Icon = REASON_ICONS[r.key];
                      return (
                        <li key={r.key} className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15">
                            <Icon className="h-4 w-4 text-fuchsia-200" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-white">{r.title}</span>
                            <span className="block text-xs leading-snug text-white/65">{r.text}</span>
                          </span>
                        </li>
                      );
                    })}
                    {featured.compatibility.reasons.length === 0 && (
                      <li className="text-sm text-white/60">Peu de points communs renseignés : laissez-vous surprendre.</li>
                    )}
                  </ul>
                  <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                    <ScoreRing value={featured.compatibility.score} />
                    <p className="text-sm text-white/75">Affinité estimée entre vos deux profils</p>
                  </div>
                </div>
              </motion.article>

              {others[0] && <SmallCard p={others[0]} href={openHref(others[0])} onOpen={remember} action={likeButton(others[0])} tall />}
            </div>

            {/* ── Les 4 suivants ── */}
            {others.length > 1 && (
              <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {others.slice(1).map((p, i) => (
                  <SmallCard key={p._id} p={p} href={openHref(p)} onOpen={remember} action={likeButton(p)} index={i} />
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-white/65">Envie d’en voir plus ? Parcourez tous les profils à votre rythme.</p>
              <Link href="/explorer/libre?from=circle" className={cn(BTN_GHOST, "h-12")}>
                <Compass className="h-5 w-5" /> Explorer librement
              </Link>
            </div>
          </>
        )}
      </div>

      <MatchModal profile={match?.profile ?? null} matchId={match?.matchId ?? null} onClose={() => setMatch(null)} />
    </ExplorerShell>
  );
}

function SmallCard({
  p,
  href,
  onOpen,
  action,
  tall = false,
  index = 0,
}: {
  p: CircleProfile;
  href: string;
  onOpen: () => void;
  action: React.ReactNode;
  tall?: boolean;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05 }}
      className={cn(PANEL, "flex flex-col p-4")}
    >
      <div className="flex gap-4">
        <Link href={href} onClick={onOpen} className={cn("relative shrink-0 overflow-hidden rounded-2xl", tall ? "h-40 w-32" : "h-28 w-24")}>
          <ProfilePhoto src={p.image || p.gallery?.[0]} name={p.pseudonyme} className="absolute inset-0 h-full w-full" />
          {p.recentlyActive && <span className="absolute bottom-2 right-2 h-3.5 w-3.5 rounded-full border-2 border-[#1b0d38] bg-emerald-400" />}
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-lg font-bold text-white">
              {p.pseudonyme}
              {p.age ? `, ${p.age}` : ""}
            </h3>
            {p.identityVerified && <VerifiedBadge small />}
          </div>
          {p.localisation && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/70">
              <MapPin className="h-4 w-4" /> {p.localisation}
            </p>
          )}
          <div className="mt-3">
            <AffinityBar value={p.compatibility.score} />
          </div>
        </div>
      </div>
      {tall && p.bio && <p className="mt-4 line-clamp-3 text-sm italic leading-relaxed text-white/80">“{p.bio}”</p>}
      {tall && p.compatibility.reasons[0] && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-violet-300/15 bg-white/[0.03] px-3 py-2.5 text-sm text-white/80">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" />
          <span>
            <span className="font-semibold text-white">{p.compatibility.reasons[0].title}</span> · {p.compatibility.reasons[0].text}
          </span>
        </p>
      )}
      {!!p.interets?.length && (
        <div className="mt-4 flex flex-wrap gap-2">
          {p.interets.slice(0, 3).map((i) => (
            <InterestChip key={i} value={i} small highlight={p.compatibility.sharedInterests.includes(i)} />
          ))}
        </div>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2.5 pt-4">
        <Link href={href} onClick={onOpen} className={cn(BTN_GHOST, "h-12 px-3")}>
          <UserRound className="h-5 w-5" /> Profil
        </Link>
        {action}
      </div>
    </motion.article>
  );
}

export default function CirclePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <CircleContent />
    </Suspense>
  );
}
