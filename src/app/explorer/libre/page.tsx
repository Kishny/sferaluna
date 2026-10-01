"use client";

/**
 * /explorer/libre — « Explorer librement »
 *
 * Parcours libre de tous les profils découvrables (GET /api/profiles).
 * Cartes volontairement épurées : photo, prénom, âge, ville, badge vérifié,
 * quelques centres d'intérêt, et les actions Passer / Voir plus / J'aime.
 *
 * Filtres et position sont conservés dans l'URL : revenir du profil
 * détaillé ramène exactement sur la même carte, avec les mêmes filtres.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crown,
  Heart,
  Loader2,
  Lock,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";

import {
  BackButton,
  Chip,
  ExplorerShell,
  MatchModal,
  PANEL,
  ProfileMenu,
  ProfilePhoto,
  VerifiedBadge,
  PhotoVerifiedBadge,
  rememberList,
  useLike,
  type ExplorerProfile,
} from "@/components/explorer/shared";
import { cn } from "@/components/site/ui";
import { usePremium } from "@/hooks/usePremium";
import { INTENTION_LABELS, ORIENTATION_LABELS, interestLabel } from "@/lib/compatibility";
import { DEPARTEMENTS, getDepartementNom } from "@/lib/locations";

type Filters = {
  ageMin: string;
  ageMax: string;
  intention: string;
  dep: string; // "" = selon mes préférences, "all" = toute la France, sinon code
  verified: boolean;
  orientation: string;
  active: boolean;
};

const PAGE_SIZE = 20;

function filtersFromParams(params: URLSearchParams): Filters {
  const [ageMin = "", ageMax = ""] = (params.get("age") || "").split("-");
  return {
    ageMin,
    ageMax,
    intention: params.get("int") || "",
    dep: params.get("dep") || "",
    verified: params.get("v") === "1",
    orientation: params.get("o") || "",
    active: params.get("a") === "1",
  };
}

function filtersToParams(filters: Filters, base?: URLSearchParams) {
  const params = new URLSearchParams();
  if (base?.get("from")) params.set("from", base.get("from")!);
  if (filters.ageMin || filters.ageMax) params.set("age", `${filters.ageMin}-${filters.ageMax}`);
  if (filters.intention) params.set("int", filters.intention);
  if (filters.dep) params.set("dep", filters.dep);
  if (filters.verified) params.set("v", "1");
  if (filters.orientation) params.set("o", filters.orientation);
  if (filters.active) params.set("a", "1");
  return params;
}

function apiQuery(filters: Filters, page: number, limit: number, isPremium: boolean) {
  const q = new URLSearchParams();
  if (filters.ageMin) q.set("age_min", filters.ageMin);
  if (filters.ageMax) q.set("age_max", filters.ageMax);
  if (filters.intention) q.set("intentions", filters.intention);
  if (filters.dep) q.set("departement", filters.dep);
  if (filters.verified) q.set("verified", "true");
  if (isPremium && filters.orientation) q.set("orientation", filters.orientation);
  if (isPremium && filters.active) q.set("actif_recemment", "true");
  q.set("page", String(page));
  q.set("limit", String(limit));
  return q.toString();
}

function ExploreFreelyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isPremium } = usePremium();

  const filters = useMemo(() => filtersFromParams(new URLSearchParams(searchParams.toString())), [searchParams]);
  const filterKey = useMemo(() => filtersToParams(filters).toString(), [filters]);

  const [profiles, setProfiles] = useState<ExplorerProfile[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [match, setMatch] = useState<{ profile: ExplorerProfile; matchId: string } | null>(null);
  const { like, pendingId, error: likeError } = useLike();

  const restoreRef = useRef({ pid: searchParams.get("pid"), i: Number(searchParams.get("i") || 0) });

  // ── Chargement initial (et à chaque changement de filtres) ──
  useEffect(() => {
    let cancelled = false;
    const { pid, i } = restoreRef.current;
    // Au retour d'un profil, on recharge assez de profils pour retrouver la carte.
    const limit = Math.min(50, Math.max(PAGE_SIZE, i + 10));

    setLoading(true);
    setError(null);

    fetch(`/api/profiles?${apiQuery(filters, 1, limit, isPremium)}`, { cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) {
          router.replace("/auth?mode=login&callbackUrl=%2Fexplorer%2Flibre");
          return;
        }
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok || !data?.success) {
          setError(data?.error || "Impossible de charger les profils.");
          setProfiles([]);
          return;
        }
        const list: ExplorerProfile[] = data.profiles ?? [];
        setProfiles(list);
        setPage(Math.ceil(limit / PAGE_SIZE));
        setHasMore(Boolean(data.pagination?.hasMore));

        const found = pid ? list.findIndex((p) => p._id === pid) : -1;
        setIndex(found >= 0 ? found : Math.min(i, Math.max(list.length - 1, 0)));
        restoreRef.current = { pid: null, i: 0 };
      })
      .catch(() => !cancelled && setError("Connexion au serveur impossible."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, isPremium]);

  // ── Page suivante quand on approche de la fin ──
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/profiles?${apiQuery(filters, nextPage, PAGE_SIZE, isPremium)}`, { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        setProfiles((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          return [...prev, ...(data.profiles ?? []).filter((p: ExplorerProfile) => !seen.has(p._id))];
        });
        setPage(nextPage);
        setHasMore(Boolean(data.pagination?.hasMore));
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [filters, hasMore, isPremium, loadingMore, page]);

  useEffect(() => {
    if (profiles.length && index >= profiles.length - 4) loadMore();
  }, [index, profiles.length, loadMore]);

  // ── Position dans l'URL (sans créer d'entrée d'historique) ──
  const current = profiles[index] ?? null;
  useEffect(() => {
    if (loading || !current) return;
    const params = filtersToParams(filters, new URLSearchParams(searchParams.toString()));
    params.set("i", String(index));
    params.set("pid", current._id);
    const next = `/explorer/libre?${params.toString()}`;
    if (next !== `/explorer/libre?${searchParams.toString()}`) router.replace(next, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?._id, loading]);

  const applyFilters = (next: Filters) => {
    restoreRef.current = { pid: null, i: 0 };
    router.replace(`/explorer/libre?${filtersToParams(next, new URLSearchParams(searchParams.toString())).toString()}`, { scroll: false });
  };

  const go = (delta: number) => {
    // Peut aller jusqu'à profiles.length : écran « Vous avez tout parcouru ».
    setIndex((i) => Math.max(0, Math.min(i + delta, profiles.length)));
  };

  const openProfile = (profile: ExplorerProfile) => {
    rememberList("libre", profiles.map((p) => p._id));
    router.push(`/explorer/profil/${profile._id}?from=libre`);
  };

  const handleLike = async (profile: ExplorerProfile) => {
    const result = await like(profile._id);
    if (!result.ok) return;
    setLikedIds((prev) => new Set(prev).add(profile._id));
    if (result.matchId) setMatch({ profile, matchId: result.matchId });
    else go(1);
  };

  // Flèches du clavier
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (showFilters || (e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "SELECT") return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Puces des filtres actifs
  const chips: { key: keyof Filters | "age"; label: string; icon: typeof MapPin }[] = [];
  if (filters.ageMin || filters.ageMax)
    chips.push({ key: "age", label: `${filters.ageMin || 28} - ${filters.ageMax || "99"} ans`, icon: CalendarDays });
  if (filters.verified) chips.push({ key: "verified", label: "Profils vérifiés", icon: BadgeCheck });
  if (filters.dep)
    chips.push({ key: "dep", label: filters.dep === "all" ? "Toute la France" : getDepartementNom(filters.dep) || filters.dep, icon: MapPin });
  if (filters.intention) chips.push({ key: "intention", label: INTENTION_LABELS[filters.intention] || filters.intention, icon: Heart });
  if (filters.orientation && isPremium) chips.push({ key: "orientation", label: ORIENTATION_LABELS[filters.orientation] || filters.orientation, icon: Sparkles });
  if (filters.active && isPremium) chips.push({ key: "active", label: "Actives récemment", icon: Star });

  const removeChip = (key: keyof Filters | "age") => {
    const next = { ...filters };
    if (key === "age") {
      next.ageMin = "";
      next.ageMax = "";
    } else if (key === "verified" || key === "active") next[key] = false;
    else next[key] = "";
    applyFilters(next);
  };

  const prev = profiles[index - 1];
  const next = profiles[index + 1];

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* En-tête (aligné sur les deux autres pages du parcours) */}
        <div className="grid gap-4 pt-4 lg:grid-cols-[300px_1fr_300px] lg:items-start">
          <div>
            <BackButton fallbackHref="/explorer" fallbackLabel="Retour aux découvertes" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px]">
              Explorer{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">librement</span>
            </h1>
            <p className="mt-2 text-base text-white/70">Parcourez des profils près de chez vous, à votre rythme.</p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl">
        {/* Filtres */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-300/30 bg-[#1b0d38]/70 px-4 text-sm font-medium text-white backdrop-blur hover:border-fuchsia-300/60"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filtres <ChevronDown className="h-4 w-4 opacity-60" />
          </button>
          {chips.map((chip) => (
            <span key={chip.key} className="inline-flex h-10 items-center gap-2 rounded-full border border-violet-300/25 bg-[#1b0d38]/70 pl-4 pr-2 text-sm text-white/90 backdrop-blur">
              <chip.icon className="h-4 w-4 text-fuchsia-300" /> {chip.label}
              <button type="button" onClick={() => removeChip(chip.key)} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10" aria-label={`Retirer le filtre ${chip.label}`}>
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {!filters.verified && (
            <button
              type="button"
              onClick={() => applyFilters({ ...filters, verified: true })}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-dashed border-violet-300/30 px-4 text-sm text-white/65 hover:text-white"
            >
              <BadgeCheck className="h-4 w-4" /> Vérifiées uniquement
            </button>
          )}
        </div>

        {/* Carrousel */}
        <div className="relative mt-8">
          {loading ? (
            <div className="flex min-h-[440px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
            </div>
          ) : error ? (
            <div className={cn(PANEL, "mx-auto max-w-md p-6 text-center")}>
              <p className="text-white/80">{error}</p>
            </div>
          ) : !current ? (
            <div className={cn(PANEL, "mx-auto max-w-md p-8 text-center")}>
              <p className="text-xl font-semibold text-white">
                {profiles.length ? "Vous avez tout parcouru ✨" : "Aucun profil pour ces filtres"}
              </p>
              <p className="mt-2 text-sm text-white/65">
                {profiles.length ? "Revenez bientôt : de nouvelles membres rejoignent SferaLuna chaque semaine." : "Élargissez l’âge ou la zone pour découvrir plus de profils."}
              </p>
              <div className="mt-5 flex justify-center gap-3">
                {profiles.length > 0 && (
                  <button type="button" onClick={() => setIndex(0)} className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 px-4 py-2 text-sm">
                    <RotateCcw className="h-4 w-4" /> Revoir depuis le début
                  </button>
                )}
                {chips.length > 0 && (
                  <button type="button" onClick={() => applyFilters({ ageMin: "", ageMax: "", intention: "", dep: "all", verified: false, orientation: "", active: false })} className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-2 text-sm font-semibold">
                    Élargir la recherche
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Cartes voisines floutées (desktop) */}
              {prev && (
                <button type="button" onClick={() => go(-1)} className="absolute left-0 top-8 hidden h-[374px] w-[240px] -rotate-6 overflow-hidden rounded-[28px] opacity-60 transition hover:opacity-80 lg:block xl:left-6" aria-label="Profil précédent">
                  <ProfilePhoto src={prev.gallery?.[0] || prev.image} name={prev.pseudonyme} className="h-full w-full" blur />
                  <span className="absolute inset-0 bg-[#12081f]/40" />
                </button>
              )}
              {next && (
                <button type="button" onClick={() => go(1)} className="absolute right-0 top-8 hidden h-[374px] w-[240px] rotate-6 overflow-hidden rounded-[28px] opacity-60 transition hover:opacity-80 lg:block xl:right-6" aria-label="Profil suivant">
                  <ProfilePhoto src={next.gallery?.[0] || next.image} name={next.pseudonyme} className="h-full w-full" blur />
                  <span className="absolute inset-0 bg-[#12081f]/40" />
                </button>
              )}

              <button type="button" onClick={() => go(-1)} disabled={index === 0} className="absolute left-0 top-[240px] z-10 hidden h-14 w-14 items-center justify-center rounded-full border border-violet-300/30 bg-[#1b0d38]/80 backdrop-blur transition hover:border-fuchsia-300/60 disabled:opacity-30 md:flex" aria-label="Précédent">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button type="button" onClick={() => go(1)} className="absolute right-0 top-[240px] z-10 hidden h-14 w-14 items-center justify-center rounded-full border border-violet-300/30 bg-[#1b0d38]/80 backdrop-blur transition hover:border-fuchsia-300/60 md:flex" aria-label="Suivant">
                <ChevronRight className="h-6 w-6" />
              </button>

              <AnimatePresence mode="wait">
                <motion.article
                  key={current._id}
                  initial={{ opacity: 0, scale: 0.97, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.22 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) go(1);
                    if (info.offset.x > 80) go(-1);
                  }}
                  className="relative z-[5] mx-auto w-full max-w-[460px] overflow-hidden rounded-[30px] border-2 border-fuchsia-300/60 bg-[#1b0d38] shadow-[0_0_0_1px_rgba(232,121,249,0.25),0_30px_90px_-25px_rgba(192,38,211,0.8)]"
                >
                  <button type="button" onClick={() => openProfile(current)} className="relative block aspect-[16/17] w-full text-left" aria-label={`Voir le profil de ${current.pseudonyme}`}>
                    <ProfilePhoto src={current.gallery?.[0] || current.image} name={current.pseudonyme} className="h-full w-full" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#1b0d38] via-[#1b0d38]/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-5">
                      <span className="flex flex-wrap items-center gap-2.5">
                        <span className="text-3xl font-bold text-white drop-shadow">
                          {current.pseudonyme}
                          {current.age ? `, ${current.age}` : ""}
                        </span>
                        {current.identityVerified && <VerifiedBadge />}
                        {current.photoVerified && <PhotoVerifiedBadge />}
                      </span>
                      <span className="mt-1.5 flex items-center gap-1.5 text-sm text-white/85">
                        <MapPin className="h-4 w-4" /> {current.localisation || getDepartementNom(current.departement) || "France"}
                      </span>
                    </span>
                  </button>

                  <div className="absolute right-4 top-4">
                    <ProfileMenu
                      profileId={current._id}
                      profileName={current.pseudonyme}
                      onBlocked={() => setProfiles((list) => list.filter((p) => p._id !== current._id))}
                    />
                  </div>

                  <div className="space-y-3 px-5 pb-5">
                    {!!current.interets?.length && (
                      <div className="flex flex-wrap gap-2">
                        {current.interets.slice(0, 4).map((interest) => (
                          <Chip key={interest}>{interestLabel(interest)}</Chip>
                        ))}
                      </div>
                    )}
                    {current.bio && <p className="line-clamp-2 text-sm leading-relaxed text-white/80">{current.bio}</p>}
                  </div>
                </motion.article>
              </AnimatePresence>

              {likeError && <p className="mt-3 text-center text-sm text-rose-300">{likeError}</p>}

              {/* Actions rondes */}
              <div className="relative z-10 mt-5 flex items-start justify-center gap-6 sm:gap-10">
                <RoundAction label="Passer" onClick={() => go(1)}>
                  <X className="h-8 w-8" />
                </RoundAction>
                <RoundAction label="Voir plus" onClick={() => openProfile(current)}>
                  <Star className="h-7 w-7 fill-white" />
                </RoundAction>
                {likedIds.has(current._id) ? (
                  <RoundAction label="Aimée" disabled liked>
                    <Check className="h-8 w-8" />
                  </RoundAction>
                ) : (
                  <RoundAction label="J’aime" onClick={() => handleLike(current)} primary disabled={pendingId === current._id}>
                    {pendingId === current._id ? <Loader2 className="h-8 w-8 animate-spin" /> : <Heart className="h-9 w-9" />}
                  </RoundAction>
                )}
              </div>
              {loadingMore && <p className="mt-3 text-center text-xs text-white/50">Chargement de nouveaux profils…</p>}
            </>
          )}
        </div>
        </div>
      </div>

      <FiltersPanel
        open={showFilters}
        initial={filters}
        isPremium={isPremium}
        onClose={() => setShowFilters(false)}
        onApply={(f) => {
          setShowFilters(false);
          applyFilters(f);
        }}
      />

      <MatchModal profile={match?.profile ?? null} matchId={match?.matchId ?? null} onClose={() => { setMatch(null); go(1); }} />
    </ExplorerShell>
  );
}

function RoundAction({
  label,
  onClick,
  children,
  primary = false,
  liked = false,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  primary?: boolean;
  liked?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "flex items-center justify-center rounded-full text-white transition active:scale-95 disabled:cursor-not-allowed",
          primary
            ? "h-[88px] w-[88px] bg-gradient-to-br from-fuchsia-500 to-pink-500 shadow-[0_0_40px_-4px_rgba(236,72,153,0.9)] hover:brightness-110"
            : liked
              ? "h-20 w-20 border border-emerald-300/40 bg-emerald-500/15 text-emerald-200"
              : "h-20 w-20 border border-violet-300/30 bg-[#1b0d38]/80 backdrop-blur hover:border-fuchsia-300/60"
        )}
      >
        {children}
      </button>
      <span className="text-sm font-medium text-white/85">{label}</span>
    </div>
  );
}

function FiltersPanel({
  open,
  initial,
  isPremium,
  onClose,
  onApply,
}: {
  open: boolean;
  initial: Filters;
  isPremium: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;
}) {
  const [draft, setDraft] = useState<Filters>(initial);
  useEffect(() => {
    if (open) setDraft(initial);
  }, [open, initial]);

  const field = "h-11 w-full rounded-xl border border-violet-300/20 bg-white/[0.05] px-3 text-sm text-white outline-none focus:border-fuchsia-400/60 [&>option]:bg-[#1a0b2e]";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={onClose}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(PANEL, "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-b-none p-6 sm:rounded-3xl")}
            role="dialog"
            aria-label="Filtres"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-white">Filtres</p>
              <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fermer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-white/80">Âge</p>
                <div className="flex items-center gap-3">
                  <input type="number" min={28} max={99} placeholder="28" value={draft.ageMin} onChange={(e) => setDraft({ ...draft, ageMin: e.target.value })} className={field} aria-label="Âge minimum" />
                  <span className="text-white/50">à</span>
                  <input type="number" min={28} max={99} placeholder="99" value={draft.ageMax} onChange={(e) => setDraft({ ...draft, ageMax: e.target.value })} className={field} aria-label="Âge maximum" />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-white/80">Zone</p>
                <select value={draft.dep} onChange={(e) => setDraft({ ...draft, dep: e.target.value })} className={field}>
                  <option value="">Selon mes préférences</option>
                  <option value="all">Toute la France</option>
                  {DEPARTEMENTS.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} — {d.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-white/80">Intention</p>
                <select value={draft.intention} onChange={(e) => setDraft({ ...draft, intention: e.target.value })} className={field}>
                  <option value="">Toutes</option>
                  {Object.entries(INTENTION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-violet-300/15 bg-white/[0.03] px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-white/85">
                  <BadgeCheck className="h-4 w-4 text-emerald-300" /> Profils vérifiés uniquement
                </span>
                <input type="checkbox" checked={draft.verified} onChange={(e) => setDraft({ ...draft, verified: e.target.checked })} className="h-5 w-5 rounded border-violet-300/40 bg-white/5 text-fuchsia-500" />
              </label>

              <div className={cn("space-y-3 rounded-2xl border p-4", isPremium ? "border-amber-300/25" : "border-violet-300/15 opacity-70")}>
                <p className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                  <Crown className="h-4 w-4" /> Filtres premium {!isPremium && <Lock className="h-3.5 w-3.5" />}
                </p>
                <select disabled={!isPremium} value={draft.orientation} onChange={(e) => setDraft({ ...draft, orientation: e.target.value })} className={field}>
                  <option value="">Toutes les orientations</option>
                  {Object.entries(ORIENTATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <label className="flex items-center justify-between text-sm text-white/85">
                  Actives cette semaine
                  <input type="checkbox" disabled={!isPremium} checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} className="h-5 w-5 rounded border-violet-300/40 bg-white/5 text-fuchsia-500" />
                </label>
                {!isPremium && <p className="text-xs text-white/55">Disponibles avec Premium et Elite.</p>}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setDraft({ ageMin: "", ageMax: "", intention: "", dep: "", verified: false, orientation: "", active: false })} className="h-12 rounded-2xl border border-violet-300/25 text-sm text-white/80 hover:bg-white/5">
                Réinitialiser
              </button>
              <button type="button" onClick={() => onApply(draft)} className="h-12 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-600 to-pink-500 text-sm font-semibold text-white">
                Appliquer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function ExploreFreelyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <ExploreFreelyContent />
    </Suspense>
  );
}
