// src/app/profil/[id]/page.tsx

"use client";

/**
 * Profil public d'une membre (/profil/[id]) et « Mode aperçu » de son
 * propre profil (/profil/[id]?preview=1, ouvert depuis Mon profil).
 *
 * Les données viennent de /api/explorer/profile/[id] : mêmes règles de
 * visibilité que le parcours Explorer (profil masqué, réservé aux matchs,
 * réservé Premium, bloqué…).
 */

import { Suspense, useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Cake,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Flag,
  Heart,
  HeartHandshake,
  Image as ImageIcon,
  Languages,
  Leaf,
  Loader2,
  MapPin,
  MessageCircle,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import Footer from "@/components/Footer";
import ReportModal from "@/components/ReportModal";
import MoonScene from "@/components/dashboard/MoonScene";
import {
  ExplorerShell,
  MatchModal,
  PANEL,
  ProfilePhoto,
  useLike,
  type ExplorerProfile,
} from "@/components/explorer/shared";
import { BTN_GHOST, BTN_PRIMARY } from "@/components/app/kit";
import { cn } from "@/components/site/ui";
import { ORIENTATION_LABELS, intentionLabel, interestLabel } from "@/lib/compatibility";
import { getDepartementNom } from "@/lib/locations";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Detail = {
  isSelf: boolean;
  profile: ExplorerProfile;
  likedByMe: boolean;
  matchId: string | null;
  verifications: { identity: boolean; photo: boolean; email: boolean };
  memberSince: string | null;
};

/** Bio courte : affichée dans le bandeau. Plus longue : dans « À propos ». */
const SHORT_BIO = 180;

type MediaItem =
  | { kind: "photo"; url: string }
  | { kind: "video"; url: string; poster?: string; duration?: number };

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

function ProfilContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const previewParam = searchParams.get("preview") === "1";

  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [match, setMatch] = useState<string | null>(null);
  const { like, pendingId, error: likeError, clearError } = useLike();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    fetch(`/api/explorer/profile/${id}`, { cache: "no-store" })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (cancelled) return;
        if (ok && data?.success && data.profile) {
          setDetail(data as Detail);
          setLiked(Boolean(data.likedByMe));
        } else {
          setError(data?.error || "Ce profil n’est pas disponible.");
        }
      })
      .catch(() => !cancelled && setError("Impossible de charger le profil."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  const preview = previewParam || Boolean(detail?.isSelf);

  const handleBack = () => {
    if (from === "connexions") return router.push("/mon-compte?tab=connexions");
    if (from === "explorer") return router.push("/explorer");
    if (from === "matches") return router.push("/matches");
    if (window.history.length > 1) return router.back();
    router.push("/explorer");
  };

  const closePreview = () => {
    window.close();
    // Si l'onglet n'a pas été ouvert par le site, le navigateur refuse de le fermer.
    setTimeout(() => router.push("/mon-compte?tab=profil"), 150);
  };

  const onLike = async () => {
    if (!detail || preview || liked) return;
    const result = await like(detail.profile._id);
    if (result.ok) {
      setLiked(true);
      if (result.matchId) setMatch(result.matchId);
    }
  };

  const p = detail?.profile;
  const media: MediaItem[] = p
    ? [
        ...(p.gallery ?? []).map((url) => ({ kind: "photo" as const, url })),
        ...(p.videos ?? []).map((v) => ({ kind: "video" as const, url: v.url, poster: v.posterUrl, duration: v.duration })),
      ]
    : [];
  const matchId = match || detail?.matchId || null;

  return (
    <>
      <ExplorerShell>
        <div className="relative mx-auto max-w-[1100px] px-4 sm:px-6">
          {/* Bandeau aperçu */}
          {preview && detail && (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-violet-300/25 bg-[#2a1458]/70 px-4 py-3 backdrop-blur-xl">
              <Eye className="h-5 w-5 shrink-0 text-violet-200" />
              <p className="min-w-0 flex-1 text-sm text-white/85">
                <span className="font-semibold text-white">Mode aperçu</span> — voici ce que les autres membres voient de votre profil.
              </p>
              <button
                type="button"
                onClick={closePreview}
                className="shrink-0 rounded-xl border border-violet-300/30 px-3.5 py-1.5 text-xs font-medium text-violet-100 transition hover:bg-white/10"
              >
                Fermer
              </button>
            </div>
          )}

          {/* Retour + signaler */}
          {!preview && (
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Retour
              </button>
              {detail && (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200 transition hover:bg-red-500/20"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Signaler
                </button>
              )}
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center gap-4 py-28 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-fuchsia-300" />
              <p className="text-sm text-white/55">Chargement du profil…</p>
            </div>
          )}

          {!loading && error && (
            <div className={cn(PANEL, "flex flex-col items-center gap-5 px-6 py-16 text-center")}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
                <AlertCircle className="h-8 w-8 text-red-300" />
              </span>
              <div>
                <h1 className="text-xl font-bold">Profil indisponible</h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-white/60">{error}</p>
              </div>
              <button type="button" onClick={handleBack} className={cn(BTN_PRIMARY, "h-11")}>
                Revenir en arrière
              </button>
            </div>
          )}

          {!loading && detail && p && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <Hero profile={p} verifications={detail.verifications} />

              <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.22fr)_minmax(0,1fr)]">
                {/* Colonne gauche */}
                <div className="min-w-0 space-y-4">
                  {p.bio && p.bio.length > SHORT_BIO && (
                    <Card icon={FileText} title="À propos">
                      <p className="whitespace-pre-line text-[15px] leading-relaxed text-white/80">{p.bio}</p>
                    </Card>
                  )}
                  {!!p.intentions?.length && (
                    <Card icon={HeartHandshake} title="Recherche" iconClass="text-pink-400">
                      <Pills items={p.intentions.map(intentionLabel)} />
                    </Card>
                  )}
                  {!!p.interets?.length && (
                    <Card icon={Star} title="Centres d’intérêt">
                      <Pills items={p.interets.map(interestLabel)} />
                    </Card>
                  )}
                  {!!p.valeurs?.length && (
                    <Card icon={Leaf} title="Mes valeurs">
                      <Pills items={p.valeurs} />
                    </Card>
                  )}
                  {!(p.bio && p.bio.length > SHORT_BIO) && !p.intentions?.length && !p.interets?.length && !p.valeurs?.length && (
                    <Card icon={User} title="Profil encore discret">
                      <p className="text-sm text-white/60">
                        {preview
                          ? "Ajoutez une bio, vos intentions et vos centres d’intérêt pour que les autres membres apprennent à vous connaître."
                          : "Cette membre n’a pas encore complété les détails de son profil."}
                      </p>
                    </Card>
                  )}
                </div>

                {/* Colonne droite */}
                <div className="min-w-0 space-y-4">
                  <Card
                    icon={ImageIcon}
                    title="Galerie"
                    aside={
                      media.length > 0 ? (
                        <button type="button" onClick={() => setViewer(0)} className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
                          {mediaCount(p)} <ChevronRight className="h-4 w-4" />
                        </button>
                      ) : null
                    }
                  >
                    {media.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2">
                        {media.slice(0, 8).map((item, i) => (
                          <button
                            key={item.url}
                            type="button"
                            onClick={() => setViewer(i)}
                            className="group relative aspect-square w-full overflow-hidden rounded-xl ring-1 ring-white/10 transition hover:ring-fuchsia-300/60"
                            aria-label={item.kind === "video" ? `Voir la vidéo ${i + 1}` : `Voir la photo ${i + 1}`}
                          >
                            {item.kind === "video" ? (
                              <>
                                {item.poster ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={item.poster} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="block h-full w-full bg-black" />
                                )}
                                <span className="absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-black/55 backdrop-blur">
                                  <Play className="h-3.5 w-3.5 fill-white text-white" />
                                </span>
                              </>
                            ) : (
                              <ProfilePhoto src={item.url} name={p.pseudonyme} className="h-full w-full transition group-hover:scale-105" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-white/55">Pas encore de photo ajoutée.</p>
                    )}
                  </Card>

                  <InfosCard profile={p} />

                  <Card icon={ShieldCheck} title="Vérifications">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Check ok={detail.verifications.email} label="E-mail vérifié" />
                      <Check ok={detail.verifications.photo} label="Photos vérifiées" />
                      <Check ok={detail.verifications.identity} label="Identité vérifiée" />
                    </div>
                    {preview && (!detail.verifications.photo || !detail.verifications.identity) && (
                      <p className="mt-4 text-xs text-white/55">
                        Visible uniquement par vous :{" "}
                        <Link href={detail.verifications.photo ? "/mon-compte?tab=securite" : "/verification-photo"} className="font-semibold text-pink-300 hover:underline">
                          compléter mes vérifications
                        </Link>
                      </p>
                    )}
                  </Card>
                </div>
              </div>

              {/* CTA */}
              <section className="relative overflow-hidden rounded-3xl border border-fuchsia-300/40 bg-gradient-to-r from-[#2a0f55]/90 via-[#3a1470]/85 to-[#4a1678]/80 p-5 shadow-[0_24px_70px_-30px_rgba(217,70,239,0.7)] backdrop-blur-xl sm:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center sm:h-16 sm:w-16" aria-hidden>
                      <Heart className="absolute h-12 w-12 -rotate-12 text-fuchsia-400/70 sm:h-14 sm:w-14" strokeWidth={1.4} />
                      <Heart className="absolute h-8 w-8 translate-x-3 -translate-y-2 rotate-12 fill-pink-500/30 text-pink-300" strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold sm:text-xl">
                        {matchId ? "Vous avez matché !" : "Ce profil vous intéresse ?"}
                      </h2>
                      <p className="mt-1 text-sm text-white/65">
                        {matchId
                          ? "Écrivez-lui pour faire connaissance."
                          : liked && !preview
                            ? "Votre like est envoyé. Si c’est réciproque, vous serez prévenue."
                            : "Revenez à l’exploration pour liker et continuer vos découvertes."}
                      </p>
                    </div>
                  </div>

                  <div className={cn("flex flex-col gap-3 sm:flex-row", preview && "pointer-events-none select-none")} aria-disabled={preview || undefined}>
                    <Link href="/explorer" tabIndex={preview ? -1 : undefined} className={cn(BTN_GHOST, "h-12")}>
                      <ArrowLeft className="h-4 w-4" />
                      Retour à l’exploration
                    </Link>
                    {matchId && !preview ? (
                      <Link href={`/messages/${matchId}`} className={cn(BTN_PRIMARY, "h-12")}>
                        <MessageCircle className="h-5 w-5" />
                        Envoyer un message
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={onLike}
                        tabIndex={preview ? -1 : undefined}
                        disabled={!preview && (liked || pendingId === p._id)}
                        className={cn(BTN_PRIMARY, "h-12")}
                      >
                        {pendingId === p._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-5 w-5", liked && !preview && "fill-white")} />}
                        {liked && !preview ? "Profil liké" : "Liker ce profil"}
                      </button>
                    )}
                  </div>
                </div>
                {likeError && (
                  <p className="mt-3 flex items-center gap-2 text-sm text-red-200">
                    <AlertCircle className="h-4 w-4" /> {likeError}
                    <button type="button" onClick={clearError} aria-label="Fermer" className="ml-auto">
                      <X className="h-4 w-4" />
                    </button>
                  </p>
                )}
              </section>
            </motion.div>
          )}
        </div>
      </ExplorerShell>

      <Footer />

      {p && (
        <MediaViewer
          media={media}
          index={viewer}
          name={p.pseudonyme || "Profil"}
          onChange={setViewer}
          onClose={() => setViewer(null)}
        />
      )}

      <MatchModal profile={match ? p ?? null : null} matchId={match} onClose={() => setMatch(null)} />

      <ReportModal isOpen={reportOpen} targetId={detail?.profile._id ?? ""} targetType="user" onClose={() => setReportOpen(false)} />
    </>
  );
}

// ─────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────

function Hero({ profile: p, verifications }: { profile: ExplorerProfile; verifications: Detail["verifications"] }) {
  const city = p.localisation || getDepartementNom(p.departement) || "";
  const orientation = p.orientation ? ORIENTATION_LABELS[p.orientation] || p.orientation : "";

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-fuchsia-300/45 bg-gradient-to-br from-[#241052] via-[#2c1260] to-[#3b1670] shadow-[0_30px_90px_-34px_rgba(192,38,211,0.75)]">
      <MoonScene className="pointer-events-none absolute -right-[260px] bottom-0 -z-10 h-full w-[720px] opacity-60 sm:-right-[240px] sm:w-[860px] sm:opacity-100" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#1b0b40] via-[#1b0b40]/70 to-transparent" />

      <div className="flex flex-col items-center gap-6 px-5 py-7 text-center sm:flex-row sm:items-center sm:gap-8 sm:px-10 sm:py-8 sm:text-left">
        <div className="relative shrink-0">
          <div className="rounded-full bg-gradient-to-br from-fuchsia-400 via-pink-400 to-violet-500 p-[3px] shadow-[0_0_40px_-6px_rgba(232,121,249,0.8)]">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-[#1b0b40] sm:h-40 sm:w-40">
              <ProfilePhoto src={p.image || p.gallery?.[0]} name={p.pseudonyme} className="h-full w-full" />
            </div>
          </div>
          {p.recentlyActive && (
            <span className="absolute bottom-3 right-3 h-5 w-5 rounded-full border-[3px] border-[#1b0b40] bg-emerald-400" title="Active récemment" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <h1 className="max-w-full truncate text-3xl font-bold tracking-tight sm:text-[34px]">{p.pseudonyme || "Membre SferaLuna"}</h1>
            {verifications.identity && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                <BadgeCheck className="h-3.5 w-3.5" /> Vérifiée
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-white/75 sm:justify-start">
            {!!p.age && <span>{p.age} ans</span>}
            {city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-violet-300" /> {city}
              </span>
            )}
            {orientation && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-violet-300" /> {orientation}
              </span>
            )}
          </div>

          {p.bio && p.bio.length <= SHORT_BIO && <p className="mx-auto mt-4 line-clamp-4 max-w-xl text-[15px] leading-relaxed text-white/85 sm:mx-0">{p.bio}</p>}

          {(verifications.photo || p.recentlyActive) && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {verifications.photo && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-[#1b0b40]/70 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-violet-200" /> Photos vérifiées
                </span>
              )}
              {p.recentlyActive && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/30 bg-[#1b0b40]/70 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active récemment
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────
// Briques
// ─────────────────────────────────────────────

function Card({
  icon: Icon,
  title,
  aside,
  iconClass = "text-violet-300",
  children,
}: {
  icon: LucideIcon;
  title: string;
  aside?: ReactNode;
  iconClass?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn(PANEL, "p-5 sm:p-6")}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[17px] font-semibold text-white">
          <Icon className={cn("h-5 w-5", iconClass)} />
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Pills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-fuchsia-300/35 bg-fuchsia-500/10 px-3.5 py-1.5 text-sm text-fuchsia-50">
          {item}
        </span>
      ))}
    </div>
  );
}

function InfosCard({ profile: p }: { profile: ExplorerProfile }) {
  const rows: { icon: LucideIcon; label: string; value?: string }[] = [
    { icon: MapPin, label: "Ville", value: p.localisation || getDepartementNom(p.departement) || "" },
    { icon: Cake, label: "Âge", value: p.age ? `${p.age} ans` : "" },
    { icon: Languages, label: "Langue(s)", value: (p.langues ?? []).join(", ") },
    { icon: Heart, label: "Orientation", value: p.orientation ? ORIENTATION_LABELS[p.orientation] || p.orientation : "" },
    { icon: Leaf, label: "Mode de vie", value: p.modeDeVie },
    { icon: Briefcase, label: "Profession", value: p.profession },
  ].filter((row) => row.value);

  if (!rows.length) return null;

  return (
    <Card icon={User} title="Infos principales">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
            <div className="min-w-0">
              <dt className="text-xs text-white/50">{label}</dt>
              <dd className="text-sm text-white/90">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
          ok ? "border-emerald-400/40 bg-emerald-500/15" : "border-white/10 bg-white/5"
        )}
      >
        {ok ? <BadgeCheck className="h-4 w-4 text-emerald-300" /> : <span className="h-1.5 w-1.5 rounded-full bg-white/30" />}
      </span>
      <span className={ok ? "text-white/90" : "text-white/40"}>{ok ? label : label.replace("vérifié", "non vérifié")}</span>
    </div>
  );
}

function mediaCount(p: ExplorerProfile) {
  const photos = p.gallery?.length || 0;
  const videos = p.videos?.length || 0;
  const parts = [`${photos} photo${photos > 1 ? "s" : ""}`];
  if (videos) parts.push(`${videos} vidéo${videos > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

// ─────────────────────────────────────────────
// Visionneuse photos / vidéos
// ─────────────────────────────────────────────

function MediaViewer({
  media,
  index,
  name,
  onChange,
  onClose,
}: {
  media: MediaItem[];
  index: number | null;
  name: string;
  onChange: (i: number) => void;
  onClose: () => void;
}) {
  const go = useCallback(
    (delta: number) => {
      if (index === null || media.length < 2) return;
      onChange((index + delta + media.length) % media.length);
    },
    [index, media.length, onChange]
  );

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, onClose]);

  const item = index !== null ? media[index] : null;

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-label={`Galerie de ${name}`}
        >
          <div onClick={(e) => e.stopPropagation()} className="relative flex max-h-full w-full max-w-3xl items-center justify-center">
            {item.kind === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video key={item.url} src={item.url} poster={item.poster} controls autoPlay playsInline className="max-h-[85vh] w-auto max-w-full rounded-2xl bg-black" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt={`Photo de ${name}`} className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain" />
            )}

            {media.length > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70" aria-label="Précédent">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => go(1)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70" aria-label="Suivant">
                  <ChevronRight className="h-5 w-5" />
                </button>
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs text-white">
                  {(index ?? 0) + 1} / {media.length}
                </span>
              </>
            )}
          </div>
          <button type="button" onClick={onClose} className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────

export default function ProfilPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#12081f] text-white">
          <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
        </div>
      }
    >
      <ProfilContent />
    </Suspense>
  );
}
