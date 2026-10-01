// src/app/vibesphere/page.tsx

"use client";

/**
 * VibeSphere — communauté émotionnelle.
 *
 * Données : GET /api/vibesphere (fil paginé ?before=, filtre ?mood=,
 * tendances réelles des 30 derniers jours en première page).
 * Actions : POST /api/vibesphere (publier), POST /api/vibesphere/[id]
 * (aimer), DELETE /api/vibesphere/[id] (supprimer sa vibe), signalement.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3,
  BookOpen,
  Flag,
  Heart,
  Loader2,
  MoreVertical,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";

import ReportModal from "@/components/ReportModal";
import { ExplorerShell } from "@/components/explorer/shared";
import {
  Avatar,
  BTN_GHOST,
  BTN_PRIMARY,
  ErrorBanner,
  Eyebrow,
  LoadingBlock,
  PANEL,
  PANEL_FEATURED,
  PageTitle,
  timeAgo,
} from "@/components/app/kit";
import { SceneArt } from "@/components/site/art";
import { cn } from "@/components/site/ui";

type VibeMood = "joyeuse" | "sereine" | "mélancolique" | "amoureuse" | "curieuse" | "fière" | "mystérieuse";

interface VibePost {
  _id: string;
  userId: { _id: string; pseudonyme: string; image?: string; age?: number; identityVerified?: boolean } | null;
  content: string;
  mood: VibeMood;
  emoji: string;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
}

const MAX = 300;
const LIMIT = 10;

const MOODS: { mood: VibeMood; emoji: string; label: string; badge: string; bar: string }[] = [
  { mood: "joyeuse", emoji: "🌟", label: "Joyeuse", badge: "bg-fuchsia-500/85", bar: "from-amber-300 to-yellow-400" },
  { mood: "sereine", emoji: "🌊", label: "Sereine", badge: "bg-indigo-500/85", bar: "from-indigo-400 to-violet-500" },
  { mood: "mélancolique", emoji: "🌧️", label: "Mélancolique", badge: "bg-slate-500/85", bar: "from-slate-300 to-slate-500" },
  { mood: "amoureuse", emoji: "💕", label: "Amoureuse", badge: "bg-pink-500/85", bar: "from-pink-400 to-rose-500" },
  { mood: "curieuse", emoji: "🔮", label: "Curieuse", badge: "bg-violet-500/85", bar: "from-violet-300 to-purple-500" },
  { mood: "fière", emoji: "✨", label: "Fière", badge: "bg-amber-500/85", bar: "from-amber-300 to-orange-400" },
  { mood: "mystérieuse", emoji: "🌙", label: "Mystérieuse", badge: "bg-purple-700/85", bar: "from-purple-400 to-indigo-600" },
];
const moodOf = (m: VibeMood) => MOODS.find((x) => x.mood === m) ?? MOODS[0];

const GROUPS: { key: string; label: string; emoji: string; moods: VibeMood[] }[] = [
  { key: "all", label: "Toutes", emoji: "💫", moods: [] },
  { key: "positives", label: "Positives", emoji: "☀️", moods: ["joyeuse", "fière", "sereine"] },
  { key: "introspectives", label: "Introspectives", emoji: "🌙", moods: ["mélancolique", "mystérieuse"] },
  { key: "romantiques", label: "Romantiques", emoji: "💗", moods: ["amoureuse"] },
  { key: "curieuses", label: "Curieuses", emoji: "🔮", moods: ["curieuse"] },
];

function VibeSphereContent() {
  const router = useRouter();
  const { data: session } = useSession();
  const me = useMemo(() => {
    const u = session?.user as { _id?: string; id?: string } | undefined;
    return u?._id ?? u?.id ?? "";
  }, [session]);

  const [posts, setPosts] = useState<VibePost[]>([]);
  const [moodStats, setMoodStats] = useState<{ mood: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [group, setGroup] = useState("all");

  const [mood, setMood] = useState<VibeMood | null>(null);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [reportId, setReportId] = useState<string | null>(null);

  const moodQuery = GROUPS.find((g) => g.key === group)?.moods.join(",") ?? "";

  const fetchFeed = useCallback(
    async (mode: "initial" | "refresh" | "more", before?: string | null) => {
      if (mode === "more") setLoadingMore(true);
      else if (mode === "refresh") setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const q = new URLSearchParams({ limit: String(LIMIT) });
        if (before) q.set("before", before);
        if (moodQuery) q.set("mood", moodQuery);
        const res = await fetch(`/api/vibesphere?${q}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace("/auth?mode=login&callbackUrl=%2Fvibesphere");
          return;
        }
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          setError(data?.error || "Impossible de charger les vibes.");
          return;
        }
        const incoming: VibePost[] = data.posts ?? [];
        setPosts((prev) => {
          if (mode !== "more") return incoming;
          const seen = new Set(prev.map((p) => p._id));
          return [...prev, ...incoming.filter((p) => !seen.has(p._id))];
        });
        if (data.moodStats) setMoodStats(data.moodStats);
        setHasMore(Boolean(data.hasMore));
        setNextBefore(data.pagination?.nextBefore ?? null);
      } catch {
        setError("Connexion au serveur impossible.");
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [moodQuery, router]
  );

  useEffect(() => {
    fetchFeed("initial");
  }, [fetchFeed]);

  const publish = async () => {
    if (!mood) return setPostError("Choisissez d’abord une émotion.");
    const text = content.trim();
    if (!text) return setPostError("Écrivez quelques mots sur votre moment.");
    setPosting(true);
    setPostError("");
    try {
      const res = await fetch("/api/vibesphere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, mood, emoji: moodOf(mood).emoji }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setPostError(data?.error || "Publication impossible pour le moment.");
        return;
      }
      setContent("");
      setMood(null);
      if (data.post) setPosts((prev) => [data.post, ...prev.filter((p) => p._id !== data.post._id)]);
      else fetchFeed("refresh");
      setMoodStats((prev) => {
        const next = [...prev];
        const row = next.find((r) => r.mood === mood);
        if (row) row.count += 1;
        else next.push({ mood, count: 1 });
        return next.sort((a, b) => b.count - a.count);
      });
    } catch {
      setPostError("Connexion au serveur impossible.");
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (post: VibePost) => {
    const flip = (p: VibePost) => ({ ...p, likedByMe: !p.likedByMe, likesCount: Math.max(0, p.likesCount + (p.likedByMe ? -1 : 1)) });
    setPosts((prev) => prev.map((p) => (p._id === post._id ? flip(p) : p)));
    try {
      const res = await fetch(`/api/vibesphere/${post._id}`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setPosts((prev) => prev.map((p) => (p._id === post._id ? post : p)));
        return;
      }
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, likedByMe: Boolean(data.liked), likesCount: Number(data.likesCount ?? p.likesCount) } : p))
      );
    } catch {
      setPosts((prev) => prev.map((p) => (p._id === post._id ? post : p)));
    }
  };

  const remove = async (post: VibePost) => {
    const previous = posts;
    setPosts((prev) => prev.filter((p) => p._id !== post._id));
    try {
      const res = await fetch(`/api/vibesphere/${post._id}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setPosts(previous);
        setError(data?.error || "Suppression impossible.");
      }
    } catch {
      setPosts(previous);
      setError("Connexion au serveur impossible.");
    }
  };

  const totalMood = moodStats.reduce((s, m) => s + m.count, 0);

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/mon-compte" fallbackLabel="Retour au tableau de bord" />
        <PageTitle
          eyebrow={<Eyebrow icon={Sparkles}>Communauté émotionnelle</Eyebrow>}
          title={
            <>
              <span className="bg-gradient-to-r from-violet-200 via-fuchsia-300 to-pink-300 bg-clip-text text-transparent">VibeSphere</span>{" "}
              <span aria-hidden>💗</span>
            </>
          }
          subtitle="Exprimez votre humeur, découvrez les vibes de la communauté et gardez une trace de votre univers émotionnel."
        >
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/vibesphere/journal" className={cn(BTN_GHOST, "h-11")}>
              <BookOpen className="h-4 w-4" /> Mon journal
            </Link>
            <button type="button" onClick={() => fetchFeed("refresh")} disabled={refreshing} className={cn(BTN_GHOST, "h-11")}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} /> Actualiser
            </button>
          </div>
        </PageTitle>

        <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            {/* ── Publier ── */}
            <section className={cn(PANEL_FEATURED, "p-5")}>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-6 w-6 shrink-0 text-fuchsia-300" />
                <div>
                  <h2 className="text-lg font-semibold text-white">Partager une vibe</h2>
                  <p className="text-sm text-white/65">Choisissez une émotion, puis écrivez quelques mots sur votre moment…</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <button
                    key={m.mood}
                    type="button"
                    onClick={() => setMood(mood === m.mood ? null : m.mood)}
                    aria-pressed={mood === m.mood}
                    className={cn(
                      "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm transition",
                      mood === m.mood
                        ? "border-fuchsia-300/80 bg-fuchsia-500/25 text-white shadow-[0_0_20px_-6px_rgba(232,121,249,0.9)]"
                        : "border-violet-300/25 text-white/85 hover:border-fuchsia-300/50"
                    )}
                  >
                    <span aria-hidden>{m.emoji}</span> {m.label}
                  </button>
                ))}
              </div>
              <div className="relative mt-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, MAX))}
                  rows={3}
                  placeholder="Partagez la vibe du moment…"
                  className="w-full resize-none rounded-2xl border border-violet-300/25 bg-[#12081f]/70 px-4 py-3 pb-7 text-sm text-white placeholder-white/40 focus:border-fuchsia-300/60 focus:outline-none"
                />
                <span className="absolute bottom-2.5 right-4 text-xs text-white/45">
                  {content.length}/{MAX}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-white/55">Visible par les membres connectées de SferaLuna.</p>
                <button type="button" onClick={publish} disabled={posting} className={cn(BTN_PRIMARY, "h-11")}>
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Publier ma vibe
                </button>
              </div>
              {postError && <p className="mt-2 text-sm text-rose-300">{postError}</p>}
            </section>

            {error && <ErrorBanner message={error} onClose={() => setError("")} onRetry={() => fetchFeed("initial")} />}

            {/* ── Fil ── */}
            {loading ? (
              <LoadingBlock label="Chargement des vibes…" />
            ) : posts.length === 0 ? (
              <div className={cn(PANEL, "px-6 py-10 text-center")}>
                <p className="font-semibold text-white">{group === "all" ? "Aucune vibe pour l’instant" : "Aucune vibe dans cette humeur"}</p>
                <p className="mt-1 text-sm text-white/65">Partagez la première, la communauté vous lira avec bienveillance.</p>
              </div>
            ) : (
              <>
                {posts.map((post) => (
                  <VibeCard
                    key={post._id}
                    post={post}
                    mine={!!me && post.userId?._id === me}
                    onLike={() => toggleLike(post)}
                    onDelete={() => remove(post)}
                    onReport={() => setReportId(post._id)}
                  />
                ))}
                {hasMore && (
                  <button type="button" onClick={() => fetchFeed("more", nextBefore)} disabled={loadingMore} className={cn(BTN_GHOST, "h-11 w-full")}>
                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Voir plus de vibes
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Colonne droite ── */}
          <aside className="space-y-5">
            {totalMood > 0 && (
              <div className={cn(PANEL, "p-5")}>
                <p className="flex items-center gap-2 font-semibold text-white">
                  <BarChart3 className="h-5 w-5 text-fuchsia-300" /> Tendances émotionnelles
                </p>
                <p className="mt-0.5 text-xs text-white/55">Humeurs partagées ces 30 derniers jours</p>
                <ul className="mt-4 space-y-3">
                  {moodStats.slice(0, 5).map((s) => {
                    const m = MOODS.find((x) => x.mood === s.mood);
                    if (!m) return null;
                    const pct = Math.round((s.count / totalMood) * 100);
                    const width = Math.round((s.count / (moodStats[0]?.count || 1)) * 100);
                    return (
                      <li key={s.mood} className="grid grid-cols-[110px_1fr_36px] items-center gap-2 text-sm">
                        <span className="truncate text-white/85">
                          <span aria-hidden>{m.emoji}</span> {m.label}
                        </span>
                        <span className="h-2 overflow-hidden rounded-full bg-white/10">
                          <span className={cn("block h-full rounded-full bg-gradient-to-r", m.bar)} style={{ width: `${Math.max(4, width)}%` }} />
                        </span>
                        <span className="text-right text-xs text-white/70">{pct}%</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className={cn(PANEL, "p-5")}>
              <p className="flex items-center gap-2 font-semibold text-white">
                <SlidersHorizontal className="h-5 w-5 text-fuchsia-300" /> Filtres de mood
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {GROUPS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setGroup(g.key)}
                    aria-pressed={group === g.key}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm transition",
                      group === g.key ? "border-fuchsia-300/70 bg-gradient-to-r from-fuchsia-500/90 to-pink-500/90 text-white" : "border-violet-300/25 text-white/85 hover:border-fuchsia-300/50"
                    )}
                  >
                    <span aria-hidden>{g.emoji}</span> {g.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn(PANEL, "overflow-hidden")}>
              <div className="relative h-28">
                <SceneArt variant="night" seed={5} className="absolute inset-0" />
              </div>
              <div className="p-5">
                <p className="font-semibold text-white">Un espace bienveillant pour toutes vos émotions</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/65">
                  Ici, chaque vibe compte. Partagez, échangez et gardez une trace intime de vos humeurs dans votre journal privé.
                </p>
                <Link href="/vibesphere/journal" className={cn(BTN_PRIMARY, "mt-4 h-10 text-sm")}>
                  <BookOpen className="h-4 w-4" /> Ouvrir mon journal
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ReportModal isOpen={!!reportId} onClose={() => setReportId(null)} targetType="community_post" targetId={reportId ?? ""} />
    </ExplorerShell>
  );
}

function VibeCard({
  post,
  mine,
  onLike,
  onDelete,
  onReport,
}: {
  post: VibePost;
  mine: boolean;
  onLike: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const m = moodOf(post.mood);
  const name = post.userId?.pseudonyme ?? "Membre";
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenu(false);
        setConfirm(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn(PANEL, "p-4 sm:p-5")}>
      <div className="flex gap-3.5">
        <Avatar src={post.userId?.image} name={name} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-semibold text-white">
                {name}
                {post.userId?.age ? `, ${post.userId.age}` : ""}
              </p>
              <span className="text-xs text-white/55">{timeAgo(post.createdAt)}</span>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white", m.badge)}>
                <span aria-hidden>{m.emoji}</span> {m.label}
              </span>
            </div>
            <div ref={ref} className="relative">
              <button type="button" onClick={() => setMenu((v) => !v)} className="rounded-full p-1.5 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Options" aria-expanded={menu}>
                <MoreVertical className="h-5 w-5" />
              </button>
              <AnimatePresence>
                {menu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-9 z-20 w-52 rounded-2xl border border-violet-300/15 bg-[#1a0c38]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
                  >
                    {mine ? (
                      confirm ? (
                        <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-100">
                          Supprimer cette vibe ?
                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={onDelete} className="flex-1 rounded-lg bg-rose-500 px-2 py-1.5 font-semibold text-white">
                              Supprimer
                            </button>
                            <button type="button" onClick={() => setConfirm(false)} className="flex-1 rounded-lg border border-white/20 px-2 py-1.5">
                              Annuler
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setConfirm(true)} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-200 hover:bg-white/5">
                          <Trash2 className="h-4 w-4" /> Supprimer ma vibe
                        </button>
                      )
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMenu(false);
                          onReport();
                        }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/5"
                      >
                        <Flag className="h-4 w-4" /> Signaler
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-white/90">{post.content}</p>
          <button
            type="button"
            onClick={onLike}
            aria-pressed={post.likedByMe}
            className={cn(
              "mt-3 inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition",
              post.likedByMe ? "bg-pink-500/25 text-pink-100" : "bg-white/[0.06] text-white/80 hover:bg-white/10"
            )}
          >
            <Heart className={cn("h-4 w-4", post.likedByMe ? "fill-pink-400 text-pink-400" : "text-pink-300")} /> {post.likesCount}
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export default function VibeSpherePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <VibeSphereContent />
    </Suspense>
  );
}
