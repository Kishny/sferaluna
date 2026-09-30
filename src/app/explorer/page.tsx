"use client";

/**
 * /explorer — « Vos découvertes du jour »
 *
 * Première page du parcours Explorer : uniquement les 6 profils de la
 * semaine sélectionnés par l'algorithme de compatibilité
 * (GET /api/explorer/selection). Liste à gauche, carte principale au
 * centre, raisons de la recommandation à droite.
 *
 * Le profil affiché est gardé dans l'URL (?p=) : un retour arrière depuis
 * le profil détaillé revient exactement sur la même découverte.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Heart,
  Info,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import HexagonSix from "@/components/icons/HexagonSix";
import {
  ActionButton,
  BackButton,
  Chip,
  ExplorerShell,
  MatchModal,
  PANEL,
  ProfileMenu,
  ProfilePhoto,
  VerifiedBadge,
  rememberList,
  useLike,
  type ExplorerProfile,
} from "@/components/explorer/shared";
import { cn } from "@/components/site/ui";
import { intentionLabel, interestLabel, type Compatibility, type ReasonKey } from "@/lib/compatibility";

type Discovery = ExplorerProfile & {
  compatibility: Compatibility;
  likedByMe: boolean;
  matchId: string | null;
};

const REASON_ICONS: Record<ReasonKey, { icon: LucideIcon; tone: string }> = {
  likedYou: { icon: Heart, tone: "bg-pink-500/20 text-pink-300 [&>svg]:fill-pink-300" },
  intentions: { icon: Heart, tone: "bg-fuchsia-500/20 text-fuchsia-200" },
  interests: { icon: Users, tone: "bg-violet-500/25 text-violet-200" },
  proximity: { icon: MapPin, tone: "bg-pink-500/20 text-pink-200" },
  age: { icon: Sparkles, tone: "bg-indigo-500/20 text-indigo-200" },
  active: { icon: Star, tone: "bg-amber-400/15 text-amber-300 [&>svg]:fill-amber-300" },
};

function DiscoveriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<Discovery[]>([]);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);
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
        router.replace("/auth?mode=login&callbackUrl=%2Fexplorer");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger vos découvertes.");
        return;
      }
      setProfiles(data.profiles ?? []);
      setRenewsAt(data.renewsAt ?? null);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Profil sélectionné : ?p=<id> (sinon le premier).
  const selectedId = searchParams.get("p");
  const index = useMemo(() => {
    const i = profiles.findIndex((p) => p._id === selectedId);
    return i >= 0 ? i : 0;
  }, [profiles, selectedId]);
  const current = profiles[index] ?? null;

  const select = (i: number) => {
    const target = profiles[(i + profiles.length) % profiles.length];
    if (!target) return;
    router.replace(`/explorer?p=${target._id}`, { scroll: false });
  };

  const openProfile = (profile: Discovery) => {
    rememberList("decouvertes", profiles.map((p) => p._id));
    router.push(`/explorer/profil/${profile._id}?from=decouvertes`);
  };

  const handleLike = async (profile: Discovery) => {
    const result = await like(profile._id);
    if (!result.ok) return;
    setProfiles((prev) =>
      prev.map((p) => (p._id === profile._id ? { ...p, likedByMe: true, matchId: result.matchId ?? p.matchId } : p))
    );
    if (result.matchId) setMatch({ profile, matchId: result.matchId });
    else if (index < profiles.length - 1) select(index + 1);
  };

  const renewLabel = renewsAt
    ? new Date(renewsAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="grid gap-5 pt-4 lg:grid-cols-[280px_1fr_280px] lg:items-start">
          <div>
            <BackButton fallbackHref="/mon-compte" fallbackLabel="Retour au compte" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px]">
              Vos découvertes{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">
                du jour
              </span>{" "}
              <span aria-hidden>✨</span>
            </h1>
            <p className="mt-2 text-base text-white/75">
              {loading || profiles.length >= 6
                ? "Voici les 6 profils qui vous correspondent le plus cette semaine."
                : "Voici les profils qui vous correspondent le plus cette semaine."}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm text-white/60">
              <Users className="h-4 w-4" />
              {profiles.length || 6} profil{(profiles.length || 6) > 1 ? "s" : ""} sélectionné{(profiles.length || 6) > 1 ? "s" : ""} cette semaine
              {renewLabel && <span className="hidden sm:inline">· nouvelle sélection {renewLabel}</span>}
            </p>
          </div>
          <div className="flex lg:justify-end">
            <Link
              href="/explorer/libre?from=decouvertes"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(217,70,239,0.8)] ring-1 ring-fuchsia-300/40 transition hover:brightness-110"
            >
              <Compass className="h-4 w-4" /> Explorer librement <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
          </div>
        ) : error ? (
          <div className={cn(PANEL, "mx-auto mt-10 max-w-md p-6 text-center")}>
            <p className="text-white/80">{error}</p>
            <button type="button" onClick={load} className="mt-4 rounded-full border border-violet-300/30 px-5 py-2 text-sm hover:bg-white/5">
              Réessayer
            </button>
          </div>
        ) : !current ? (
          <div className={cn(PANEL, "mx-auto mt-10 max-w-lg p-8 text-center")}>
            <HexagonSix size={48} className="mx-auto" />
            <p className="mt-4 text-xl font-semibold text-white">Pas encore de découvertes cette semaine</p>
            <p className="mt-2 text-sm text-white/65">
              Complétez vos intentions et centres d’intérêt pour affiner la sélection, ou parcourez tous les profils dès maintenant.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/explorer/libre?from=decouvertes" className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-semibold">
                Explorer librement
              </Link>
              <Link href="/mon-compte?tab=preferences" className="rounded-full border border-violet-300/30 px-5 py-2.5 text-sm">
                Affiner mes préférences
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[300px_minmax(0,1fr)_320px] xl:grid-cols-[340px_minmax(0,1fr)_360px]">
            {/* ── Liste des 6 ── */}
            <aside className={cn(PANEL, "order-1 min-w-0 p-4 lg:self-start")}>
              <div className="mb-3 flex items-center gap-3 px-1">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/20">
                  <HexagonSix size={26} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">Vos 6 découvertes</p>
                  <p className="text-xs text-white/55">Sélectionnées par notre algorithme</p>
                </div>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60"
                  title="Intentions et centres d’intérêt communs, proximité, âge et activité récente. Sélection renouvelée chaque lundi."
                >
                  <Info className="h-4 w-4" />
                </span>
              </div>

              {/* Mobile : bande horizontale */}
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 lg:hidden">
                {profiles.map((profile, i) => (
                  <button
                    key={profile._id}
                    type="button"
                    onClick={() => select(i)}
                    className="flex shrink-0 flex-col items-center gap-1.5"
                    aria-label={`${profile.pseudonyme}, ${profile.age ?? ""} ans`}
                  >
                    <span className={cn("relative h-16 w-16 overflow-hidden rounded-2xl ring-2", i === index ? "ring-fuchsia-400" : "ring-white/10")}>
                      <ProfilePhoto src={profile.gallery?.[0]} name={profile.pseudonyme} className="h-full w-full text-2xl" />
                      {profile.likedByMe && (
                        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500">
                          <Heart className="h-3 w-3 fill-white text-white" />
                        </span>
                      )}
                    </span>
                    <span className={cn("text-xs", i === index ? "font-semibold text-white" : "text-white/60")}>{profile.pseudonyme}</span>
                  </button>
                ))}
              </div>

              {/* Desktop : liste verticale */}
              <ul className="hidden space-y-2 lg:block">
                {profiles.map((profile, i) => (
                  <li key={profile._id}>
                    <button
                      type="button"
                      onClick={() => select(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition",
                        i === index
                          ? "bg-gradient-to-r from-fuchsia-500/20 to-violet-500/10 ring-1 ring-fuchsia-400/60"
                          : "hover:bg-white/[0.05]"
                      )}
                    >
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <ProfilePhoto src={profile.gallery?.[0]} name={profile.pseudonyme} className="h-full w-full text-2xl" />
                        {profile.recentlyActive && (
                          <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-[#1b0d38] bg-emerald-400" title="Active récemment" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 font-semibold text-white">
                          <span className="truncate">
                            {profile.pseudonyme}
                            {profile.age ? `, ${profile.age}` : ""}
                          </span>
                          {profile.likedByMe && <Heart className="h-3.5 w-3.5 shrink-0 fill-pink-400 text-pink-400" />}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1 truncate text-sm text-white/60">
                          <MapPin className="h-3.5 w-3.5 shrink-0" /> {profile.localisation || "France"}
                        </span>
                      </span>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-300/25">
                        <ChevronRight className="h-4 w-4" />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>

            {/* ── Carte principale ── */}
            <section className="order-2 min-w-0">
              <AnimatePresence mode="wait">
                <motion.article
                  key={current._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden rounded-[28px] border border-fuchsia-300/40 bg-[#1b0d38]/80 shadow-[0_30px_90px_-30px_rgba(192,38,211,0.6)] backdrop-blur-xl"
                >
                  <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
                    <button type="button" onClick={() => openProfile(current)} className="absolute inset-0" aria-label={`Voir le profil de ${current.pseudonyme}`}>
                      <ProfilePhoto src={current.gallery?.[0]} name={current.pseudonyme} className="h-full w-full" />
                    </button>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1b0d38] via-[#1b0d38]/20 to-transparent" />

                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500/90 to-pink-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                      <Sparkles className="h-3.5 w-3.5" /> Sélectionnée pour vous
                    </span>
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        {index + 1} / {profiles.length}
                      </span>
                      <ProfileMenu
                        profileId={current._id}
                        profileName={current.pseudonyme}
                        onBlocked={() => setProfiles((prev) => prev.filter((p) => p._id !== current._id))}
                      />
                    </div>

                    {profiles.length > 1 && (
                      <>
                        <button type="button" onClick={() => select(index - 1)} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 backdrop-blur transition hover:bg-black/55" aria-label="Profil précédent">
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => select(index + 1)} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 backdrop-blur transition hover:bg-black/55" aria-label="Profil suivant">
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 sm:p-6">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-bold text-white drop-shadow sm:text-4xl">
                          {current.pseudonyme}
                          {current.age ? `, ${current.age}` : ""}
                        </h2>
                        {current.identityVerified && <VerifiedBadge />}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" /> {current.localisation || "France"}
                          {current.compatibility.proximity === "same-city" && <span className="text-fuchsia-200">· même ville que vous</span>}
                          {current.compatibility.proximity === "same-department" && <span className="text-fuchsia-200">· votre département</span>}
                        </span>
                        {current.recentlyActive && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-200">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    {current.bio && <p className="line-clamp-3 text-[15px] leading-relaxed text-white/85">{current.bio}</p>}

                    {!!current.interets?.length && (
                      <div className="flex flex-wrap gap-2">
                        {current.interets.slice(0, 6).map((interest) => (
                          <Chip key={interest} tone={current.compatibility.sharedInterests.includes(interest) ? "shared" : "violet"}>
                            {current.compatibility.sharedInterests.includes(interest) && <Check className="h-3.5 w-3.5" />}
                            {interestLabel(interest)}
                          </Chip>
                        ))}
                      </div>
                    )}

                    {!!current.intentions?.length && (
                      <div className="border-t border-white/10 pt-4">
                        <p className="mb-2 text-sm text-white/60">Ses intentions</p>
                        <div className="flex flex-wrap gap-2">
                          {current.intentions.map((intent) => (
                            <Chip key={intent} tone="pink">
                              <Heart className="h-3.5 w-3.5 fill-current" /> {intentionLabel(intent)}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.article>
              </AnimatePresence>

              {likeError && <p className="mt-3 text-center text-sm text-rose-300">{likeError}</p>}

              <div className="sticky bottom-3 z-10 mt-4 grid grid-cols-3 gap-3 rounded-3xl bg-[#12081f]/70 p-1 backdrop-blur-xl lg:static lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                <ActionButton variant="pass" onClick={() => select(index + 1)}>
                  <X className="h-5 w-5" /> <span className="hidden sm:inline">Passer</span>
                </ActionButton>
                <ActionButton variant="info" onClick={() => openProfile(current)}>
                  <UserRound className="h-5 w-5" /> <span className="sm:hidden">Profil</span><span className="hidden sm:inline">Voir le profil</span>
                </ActionButton>
                {current.matchId ? (
                  <ActionButton variant="like" href={`/messages/${current.matchId}`}>
                    <Heart className="h-5 w-5" /> <span>Écrire</span>
                  </ActionButton>
                ) : current.likedByMe ? (
                  <ActionButton variant="liked" disabled>
                    <Check className="h-5 w-5" /> <span>Aimée</span>
                  </ActionButton>
                ) : (
                  <ActionButton variant="like" onClick={() => handleLike(current)} disabled={pendingId === current._id}>
                    {pendingId === current._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
                    <span>J’aime</span>
                  </ActionButton>
                )}
              </div>
            </section>

            {/* ── Pourquoi ce profil ? ── */}
            <aside className="order-3 min-w-0 space-y-5 lg:self-start">
              <div className={cn(PANEL, "p-5")}>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-7 w-7 shrink-0 text-fuchsia-300" />
                  <div>
                    <p className="text-lg font-semibold text-white">Pourquoi ce profil ?</p>
                    <p className="text-sm text-white/60">Basé sur vos préférences et votre activité</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-3">
                  <span className="text-2xl font-bold text-white">{current.compatibility.score}%</span>
                  <span className="text-xs leading-snug text-white/70">
                    d’affinité estimée
                    <br />
                    (intentions, passions, proximité, âge)
                  </span>
                </div>

                <ul className="mt-5 space-y-4">
                  {current.compatibility.reasons.length === 0 && (
                    <li className="text-sm text-white/60">
                      Un profil complet et vérifié proche de vos critères. Découvrez-la pour voir si le courant passe.
                    </li>
                  )}
                  {current.compatibility.reasons.slice(0, 4).map((reason) => {
                    const meta = REASON_ICONS[reason.key];
                    return (
                      <li key={reason.key} className="flex gap-3">
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5", meta.tone)}>
                          <meta.icon />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-white">{reason.title}</span>
                          <span className="block text-sm leading-snug text-white/65">{reason.text}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className={cn(PANEL, "p-5")}>
                <p className="flex items-center gap-2 font-semibold text-white">
                  <CalendarClock className="h-5 w-5 text-violet-300" /> Envie d’en voir plus ?
                </p>
                <p className="mt-1 text-sm text-white/65">
                  Votre sélection se renouvelle chaque lundi. En attendant, parcourez tous les profils à votre rythme.
                </p>
                <Link
                  href="/explorer/libre?from=decouvertes"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-pink-300 hover:text-pink-200"
                >
                  Explorer librement <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          </div>
        )}
      </div>

      <MatchModal profile={match?.profile ?? null} matchId={match?.matchId ?? null} onClose={() => setMatch(null)} />
    </ExplorerShell>
  );
}

export default function DiscoveriesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <DiscoveriesContent />
    </Suspense>
  );
}
