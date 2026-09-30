"use client";

/**
 * /explorer/profil/[id] — Profil détaillé
 *
 * Toutes les informations publiques d'une membre : galerie, bio, ville,
 * âge, centres d'intérêt, intentions, profession, valeurs, mode de vie,
 * langues, affinité estimée et ses raisons, vérifications, idées pour
 * briser la glace. Données : GET /api/explorer/profile/[id].
 *
 * « Profil précédent / suivant » suit la liste d'où l'on vient
 * (découvertes ou Explorer librement) ; « Retour » revient exactement
 * à la page précédente.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Gem,
  Heart,
  Image as ImageIcon,
  Languages,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  Quote,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

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
  readList,
  useLike,
  type ExplorerProfile,
} from "@/components/explorer/shared";
import { cn } from "@/components/site/ui";
import {
  ORIENTATION_LABELS,
  intentionLabel,
  interestLabel,
  type Compatibility,
  type ReasonKey,
} from "@/lib/compatibility";
import { getDepartementNom } from "@/lib/locations";

type Detail = {
  isSelf: boolean;
  profile: ExplorerProfile & { createdAt?: string };
  compatibility: Compatibility;
  likedByMe: boolean;
  matchId: string | null;
  verifications: { identity: boolean; email: boolean };
  memberSince: string | null;
};

const REASON_ICONS: Record<ReasonKey, LucideIcon> = {
  likedYou: Heart,
  intentions: Heart,
  interests: Users,
  proximity: MapPin,
  age: Sparkles,
  active: Sun,
};

const ICEBREAKERS: Record<string, string> = {
  voyage: "Quel est ton prochain voyage de rêve ? ✈️",
  cuisine: "Ta meilleure adresse pour bien manger près de chez toi ? 🍽️",
  sport: "Quel sport te fait vibrer en ce moment ?",
  musique: "Quel morceau tourne en boucle chez toi cette semaine ? 🎶",
  cinema: "Le dernier film qui t’a vraiment marquée ? 🎬",
  lecture: "Un livre que tu offrirais à tout le monde ? 📚",
  art: "Une expo ou une artiste qui t’a inspirée récemment ? 🎨",
  technologie: "Une appli dont tu ne peux plus te passer ?",
  nature: "Plutôt montagne, mer ou forêt pour un week-end ? 🌿",
  mode: "Ta pièce préférée dans ta garde-robe ?",
  gaming: "À quel jeu joues-tu en ce moment ? 🎮",
  photographie: "Ta plus belle photo récente, c’était quoi ? 📷",
};

function icebreakersFor(detail: Detail) {
  const { profile, compatibility } = detail;
  const ideas: string[] = [];
  const pool = [...compatibility.sharedInterests, ...(profile.interets || [])];
  pool.forEach((interest) => {
    const idea = ICEBREAKERS[interest];
    if (idea && !ideas.includes(idea)) ideas.push(idea);
  });
  if (profile.localisation) ideas.push(`Un endroit à ${profile.localisation} que tu adores ?`);
  ideas.push("Qu’est-ce qui t’a donné envie de rejoindre SferaLuna ? 🌙");
  return ideas.slice(0, 3);
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <li className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-fuchsia-300" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-white/50">{label}</span>
        <span className="block text-sm text-white/90">{value}</span>
      </span>
    </li>
  );
}

function DetailCard({ icon: Icon, title, children, tone = "text-fuchsia-300" }: { icon: LucideIcon; title: string; children: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-2xl border border-violet-300/[0.12] bg-[#160a31]/70 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-white">
        <Icon className={cn("h-5 w-5", tone)} /> {title}
      </p>
      <div className="mt-2 text-sm leading-relaxed text-white/75">{children}</div>
    </div>
  );
}

function ProfileDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [match, setMatch] = useState<string | null>(null);
  const [list, setList] = useState<{ source: string; ids: string[] } | null>(null);
  const { like, pendingId, error: likeError } = useLike();

  useEffect(() => setList(readList()), []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhotoIndex(0);
    try {
      const res = await fetch(`/api/explorer/profile/${id}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace(`/auth?mode=login&callbackUrl=${encodeURIComponent(`/explorer/profil/${id}`)}`);
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Ce profil n’est pas disponible.");
        setDetail(null);
        return;
      }
      setDetail(data as Detail);
      if (!data.isSelf) {
        fetch("/api/visitors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visitedUserId: id }),
        }).catch(() => {});
      }
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    load();
    window.scrollTo({ top: 0 });
  }, [load]);

  // Profil précédent / suivant dans la liste d'origine
  const position = useMemo(() => (list ? list.ids.indexOf(String(id)) : -1), [list, id]);
  const neighbour = (delta: number) => {
    if (!list || position < 0) return null;
    return list.ids[position + delta] ?? null;
  };
  const goTo = (targetId: string | null) => {
    if (!targetId) return;
    router.replace(`/explorer/profil/${targetId}?from=${from || list?.source || "libre"}`, { scroll: false });
  };

  const fallbackHref = from === "decouvertes" ? "/explorer" : "/explorer/libre";
  const fallbackLabel = from === "decouvertes" ? "Retour aux découvertes" : "Retour à Explorer librement";

  const handleLike = async () => {
    if (!detail) return;
    const result = await like(detail.profile._id);
    if (!result.ok) return;
    setDetail({ ...detail, likedByMe: true, matchId: result.matchId ?? detail.matchId });
    if (result.matchId) setMatch(result.matchId);
  };

  const pass = () => {
    const next = neighbour(1);
    if (next) goTo(next);
    else router.back();
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* presse-papiers indisponible */
    }
  };

  const p = detail?.profile;
  const gallery = p?.gallery?.length ? p.gallery : [""];
  const memberSince = detail?.memberSince
    ? new Date(detail.memberSince).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null;
  const city = p ? p.localisation || getDepartementNom(p.departement) || "" : "";

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="grid gap-4 pt-4 lg:grid-cols-[300px_1fr_300px] lg:items-start">
          <div>
            <BackButton fallbackHref={fallbackHref} fallbackLabel={fallbackLabel} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px]">
              Profil{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">détaillé</span>{" "}
              <span aria-hidden>✨</span>
            </h1>
            <p className="mt-2 text-base text-white/70">Découvrez-en plus sur cette personne et voyez si vous êtes sur la même longueur d’onde.</p>
          </div>
          {position >= 0 && list && list.ids.length > 1 && (
            <div className="flex items-center justify-center gap-2 lg:justify-end">
              <button type="button" onClick={() => goTo(neighbour(-1))} disabled={!neighbour(-1)} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-violet-300/25 bg-[#1b0d38]/70 px-4 text-sm text-white/85 backdrop-blur hover:border-fuchsia-300/50 disabled:opacity-35">
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
              <button type="button" onClick={() => goTo(neighbour(1))} disabled={!neighbour(1)} className="inline-flex h-11 items-center gap-1.5 rounded-full border border-violet-300/25 bg-[#1b0d38]/70 px-4 text-sm text-white/85 backdrop-blur hover:border-fuchsia-300/50 disabled:opacity-35">
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
          </div>
        ) : error || !detail || !p ? (
          <div className={cn(PANEL, "mx-auto mt-10 max-w-md p-8 text-center")}>
            <p className="text-lg font-semibold text-white">{error || "Profil introuvable."}</p>
            <p className="mt-2 text-sm text-white/60">Il a peut-être été masqué ou n’est plus disponible.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_340px]">
            {/* ── Colonne gauche ── */}
            <aside className="order-2 min-w-0 space-y-5 lg:order-1">
              <div className={cn(PANEL, "p-5")}>
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <ImageIcon className="h-5 w-5 text-fuchsia-300" /> Galerie photos
                  </p>
                  <span className="text-xs text-white/50">
                    {p.gallery?.length || 0} photo{(p.gallery?.length || 0) > 1 ? "s" : ""}
                  </span>
                </div>
                {p.gallery?.length ? (
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {p.gallery.slice(0, 9).map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setPhotoIndex(i)}
                        className={cn(
                          "aspect-square overflow-hidden rounded-xl ring-2 transition",
                          i === photoIndex ? "ring-fuchsia-400" : "ring-transparent opacity-80 hover:opacity-100",
                          i === 0 && "col-span-2 row-span-2"
                        )}
                        aria-label={`Photo ${i + 1}`}
                      >
                        <ProfilePhoto src={url} name={p.pseudonyme} className="h-full w-full" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/55">Pas encore de photo ajoutée.</p>
                )}
              </div>

              <div className={cn(PANEL, "p-5")}>
                <p className="flex items-center gap-2 font-semibold text-white">
                  <UserRound className="h-5 w-5 text-fuchsia-300" /> Informations principales
                </p>
                <ul className="mt-2 divide-y divide-white/[0.06]">
                  <InfoRow
                    icon={MapPin}
                    label="Localisation"
                    value={
                      city
                        ? `${city}${detail.compatibility.proximity === "same-city" ? " · même ville que vous" : detail.compatibility.proximity === "same-department" ? " · votre département" : ""}`
                        : null
                    }
                  />
                  <InfoRow icon={CalendarDays} label="Âge" value={p.age ? `${p.age} ans` : null} />
                  <InfoRow icon={Sparkles} label="Orientation" value={p.orientation ? ORIENTATION_LABELS[p.orientation] || p.orientation : null} />
                  <InfoRow icon={Briefcase} label="Profession" value={p.profession} />
                  <InfoRow icon={Languages} label="Langues" value={p.langues?.length ? p.langues.join(", ") : null} />
                  <InfoRow icon={Users} label="Membre depuis" value={memberSince} />
                </ul>
              </div>

              <div className={cn(PANEL, "p-5")}>
                <p className="flex items-center gap-2 font-semibold text-white">
                  <ShieldCheck className="h-5 w-5 text-emerald-300" /> Vérifications
                </p>
                <ul className="mt-3 space-y-2.5">
                  {[
                    { icon: BadgeCheck, label: "Identité vérifiée", ok: detail.verifications.identity },
                    { icon: Mail, label: "Adresse email confirmée", ok: detail.verifications.email },
                  ].map((v) => (
                    <li key={v.label} className="flex items-center gap-3 text-sm">
                      <v.icon className={cn("h-5 w-5", v.ok ? "text-emerald-300" : "text-white/35")} />
                      <span className={cn("flex-1", v.ok ? "text-white/90" : "text-white/45")}>{v.label}</span>
                      {v.ok ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                          <Check className="h-3 w-3 text-white" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">Non</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* ── Colonne centrale ── */}
            <section className="order-1 min-w-0 space-y-5 lg:order-2">
              <article className="overflow-hidden rounded-[28px] border border-fuchsia-300/40 bg-[#1b0d38]/80 shadow-[0_30px_90px_-30px_rgba(192,38,211,0.6)] backdrop-blur-xl">
                <div className="relative aspect-[4/5] w-full sm:aspect-[4/3]">
                  <AnimatePresence mode="wait">
                    <motion.div key={photoIndex} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} exit={{ opacity: 0.4 }} transition={{ duration: 0.2 }} className="absolute inset-0">
                      <ProfilePhoto src={gallery[photoIndex]} name={p.pseudonyme} className="h-full w-full" />
                    </motion.div>
                  </AnimatePresence>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1b0d38] via-transparent to-transparent" />

                  {from === "decouvertes" && (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-500/90 to-pink-500/90 px-3 py-1.5 text-xs font-semibold text-white">
                      <Sparkles className="h-3.5 w-3.5" /> Sélectionnée pour vous
                    </span>
                  )}
                  <div className="absolute right-4 top-4 flex items-center gap-2">
                    {gallery.length > 1 && (
                      <span className="rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold backdrop-blur">
                        {photoIndex + 1} / {gallery.length}
                      </span>
                    )}
                    {!detail.isSelf && (
                      <ProfileMenu profileId={p._id} profileName={p.pseudonyme} onBlocked={() => router.back()} />
                    )}
                  </div>

                  {gallery.length > 1 && (
                    <>
                      <button type="button" onClick={() => setPhotoIndex((i) => (i - 1 + gallery.length) % gallery.length)} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 backdrop-blur hover:bg-black/55" aria-label="Photo précédente">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button type="button" onClick={() => setPhotoIndex((i) => (i + 1) % gallery.length)} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/35 backdrop-blur hover:bg-black/55" aria-label="Photo suivante">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {!detail.isSelf && (
                    <div className="absolute bottom-5 right-5 rounded-2xl border border-fuchsia-300/40 bg-[#2a0f4f]/85 px-4 py-2.5 text-center backdrop-blur">
                      <p className="flex items-center justify-center gap-1.5 text-2xl font-bold text-white">
                        <Heart className="h-5 w-5 fill-pink-400 text-pink-400" /> {detail.compatibility.score}%
                      </p>
                      <p className="text-xs text-white/75">Affinité estimée</p>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 max-w-[65%] p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-bold text-white drop-shadow sm:text-4xl">
                        {p.pseudonyme}
                        {p.age ? `, ${p.age}` : ""}
                      </h2>
                      {p.identityVerified && <VerifiedBadge />}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
                      {city && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" /> {city}
                        </span>
                      )}
                      {p.recentlyActive && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-200">
                          <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  {detail.isSelf && (
                    <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                      Aperçu de votre profil tel que les autres membres le voient.{" "}
                      <Link href="/mon-compte?tab=profil" className="font-semibold underline">
                        Le modifier
                      </Link>
                    </p>
                  )}

                  {p.bio && (
                    <blockquote className="flex gap-3 rounded-2xl border border-violet-300/[0.12] bg-[#160a31]/70 p-4 text-[15px] leading-relaxed text-white/90">
                      <Quote className="h-6 w-6 shrink-0 text-fuchsia-300" />
                      <span>{p.bio}</span>
                    </blockquote>
                  )}

                  {!!p.interets?.length && (
                    <div className="flex flex-wrap gap-2">
                      {p.interets.map((interest) => {
                        const shared = detail.compatibility.sharedInterests.includes(interest);
                        return (
                          <Chip key={interest} tone={shared ? "shared" : "violet"}>
                            {shared && <Check className="h-3.5 w-3.5" />}
                            {interestLabel(interest)}
                          </Chip>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {!!p.intentions?.length && (
                      <DetailCard icon={Heart} title="Ses intentions">
                        <span className="font-semibold text-pink-200">{p.intentions.map(intentionLabel).join(" · ")}</span>
                      </DetailCard>
                    )}
                    {p.modeDeVie && (
                      <DetailCard icon={Sun} title="Mode de vie" tone="text-amber-300">
                        <span className="font-semibold text-amber-100">{p.modeDeVie}</span>
                      </DetailCard>
                    )}
                    {!!p.valeurs?.length && (
                      <DetailCard icon={Gem} title="Valeurs importantes" tone="text-violet-300">
                        {p.valeurs.join(", ")}
                      </DetailCard>
                    )}
                    {!!p.langues?.length && (
                      <DetailCard icon={Languages} title="Langues" tone="text-sky-300">
                        {p.langues.join(", ")}
                      </DetailCard>
                    )}
                  </div>
                </div>
              </article>

              {likeError && <p className="text-center text-sm text-rose-300">{likeError}</p>}

              {!detail.isSelf && (
                <div className="sticky bottom-3 z-10 grid grid-cols-2 gap-3 rounded-3xl bg-[#12081f]/70 p-1 backdrop-blur-xl lg:static lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
                  <ActionButton variant="pass" onClick={pass}>
                    <X className="h-5 w-5" /> Passer
                  </ActionButton>
                  {detail.matchId ? (
                    <ActionButton variant="like" href={`/messages/${detail.matchId}`}>
                      <MessageSquareText className="h-5 w-5" /> Écrire<span className="hidden sm:inline"> un message</span>
                    </ActionButton>
                  ) : detail.likedByMe ? (
                    <ActionButton variant="liked" disabled>
                      <Check className="h-5 w-5" /> Like envoyé
                    </ActionButton>
                  ) : (
                    <ActionButton variant="like" onClick={handleLike} disabled={pendingId === p._id}>
                      {pendingId === p._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className="h-5 w-5" />}
                      <span className="sm:hidden">J’aime</span>
                      <span className="hidden sm:inline">Envoyer un like</span>
                    </ActionButton>
                  )}
                </div>
              )}
            </section>

            {/* ── Colonne droite ── */}
            {!detail.isSelf && (
              <aside className="order-3 space-y-5 lg:col-span-2 xl:col-span-1">
                <div className={cn(PANEL, "p-5")}>
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-6 w-6 shrink-0 text-fuchsia-300" />
                    <div>
                      <p className="text-lg font-semibold text-white">Pourquoi ce profil ?</p>
                      <p className="text-xs text-white/55">Calculé à partir de vos deux profils</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-white/80">
                    Vous avez <span className="font-bold text-fuchsia-300">{detail.compatibility.score}% d’affinité estimée</span>{" "}
                    (intentions, passions, proximité, âge et activité).
                  </p>
                  <ul className="mt-4 space-y-3.5">
                    {detail.compatibility.reasons.length === 0 && (
                      <li className="text-sm text-white/60">Peu de points communs renseignés pour l’instant : sa personnalité vous surprendra peut-être !</li>
                    )}
                    {detail.compatibility.reasons.map((reason) => {
                      const Icon = REASON_ICONS[reason.key];
                      return (
                        <li key={reason.key} className="flex gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/15">
                            <Icon className="h-4 w-4 text-fuchsia-200" />
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
                    <MessageSquareText className="h-5 w-5 text-fuchsia-300" /> Idées pour briser la glace
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    {detail.matchId ? "Copiez une idée et lancez la conversation." : "Utilisables dès que vous avez matché."}
                  </p>
                  <ul className="mt-3 space-y-2">
                    {icebreakersFor(detail).map((idea) => (
                      <li key={idea} className="flex items-center gap-2 rounded-xl border border-violet-300/15 bg-white/[0.03] py-2 pl-3 pr-1.5 text-sm text-white/85">
                        <span className="flex-1">« {idea} »</span>
                        <button type="button" onClick={() => copy(idea)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fuchsia-500/20 text-fuchsia-100 hover:bg-fuchsia-500/35" aria-label="Copier">
                          {copied === idea ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {detail.matchId && (
                    <Link href={`/messages/${detail.matchId}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pink-300 hover:text-pink-200">
                      Ouvrir la conversation <ChevronRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}
      </div>

      <MatchModal profile={match && p ? p : null} matchId={match} onClose={() => setMatch(null)} />
    </ExplorerShell>
  );
}

export default function ProfileDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <ProfileDetailContent />
    </Suspense>
  );
}
