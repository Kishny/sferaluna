// src/app/vibesphere/page.tsx

"use client";

/**
 * Page VibeSphere SferaLuna.
 *
 * Cette page gère :
 * - l'affichage du feed communautaire des vibes ;
 * - la création d'un post avec mood ;
 * - le like / unlike optimiste ;
 * - la suppression de ses propres posts ;
 * - le chargement paginé avec cursor pagination ;
 * - le signalement d'un post communautaire ;
 * - l'accès au journal émotionnel.
 *
 * Version mobile-first :
 * - hero très compact sur mobile ;
 * - compose box en accordéon sur mobile ;
 * - moods en scroll horizontal ;
 * - cards du feed plus compactes ;
 * - actions réduites ;
 * - footer masqué sur mobile pour garder la page légère.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Flag,
  Heart,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import ReportModal from "@/components/ReportModal";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type VibeMood =
  | "joyeuse"
  | "sereine"
  | "mélancolique"
  | "amoureuse"
  | "curieuse"
  | "fière"
  | "mystérieuse";

interface VibeUser {
  _id: string;
  pseudonyme: string;
  image?: string;
  age?: number;
  identityVerified?: boolean;
}

interface VibePost {
  _id: string;
  userId: VibeUser | null;
  content: string;
  mood: VibeMood;
  emoji: string;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface MoodConfig {
  mood: VibeMood;
  emoji: string;
  label: string;
  color: string;
}

interface VibePagination {
  limit?: number;
  before?: string | null;
  nextBefore?: string | null;
}

// ─────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 300;
const FEED_LIMIT = 10;

const MOODS: MoodConfig[] = [
  {
    mood: "joyeuse",
    emoji: "🌟",
    label: "Joyeuse",
    color: "from-yellow-400 to-orange-400",
  },
  {
    mood: "sereine",
    emoji: "🌊",
    label: "Sereine",
    color: "from-blue-400 to-cyan-400",
  },
  {
    mood: "mélancolique",
    emoji: "🌧️",
    label: "Mélancolique",
    color: "from-slate-400 to-blue-500",
  },
  {
    mood: "amoureuse",
    emoji: "💕",
    label: "Amoureuse",
    color: "from-pink-400 to-rose-500",
  },
  {
    mood: "curieuse",
    emoji: "🔮",
    label: "Curieuse",
    color: "from-purple-400 to-violet-500",
  },
  {
    mood: "fière",
    emoji: "✨",
    label: "Fière",
    color: "from-amber-400 to-yellow-500",
  },
  {
    mood: "mystérieuse",
    emoji: "🌙",
    label: "Mystérieuse",
    color: "from-indigo-500 to-purple-700",
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getInitials(name?: string) {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "date inconnue";

  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;

  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function getMoodData(mood: VibeMood) {
  return MOODS.find((item) => item.mood === mood);
}

/**
 * Motif orbite décoratif (cercles concentriques + points d'accent),
 * écho visuel du nom "Sfera". Variante blanche pour fond sombre.
 */
function OrbitGlow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute opacity-[0.14] ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke="#FFFFFF" strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="34" fill="none" stroke="#FFFFFF" strokeWidth="1" />
      <circle cx="100" cy="10" r="3" fill="#FFFFFF" />
      <circle cx="190" cy="100" r="3" fill="#FFFFFF" />
      <circle cx="100" cy="190" r="3" fill="#FFFFFF" />
      <circle cx="10" cy="100" r="3" fill="#FFFFFF" />
    </svg>
  );
}

/**
 * Fusionne les posts sans doublons.
 * Indispensable pour éviter les répétitions pendant le chargement paginé.
 */
function mergePostsWithoutDuplicates(
  previousPosts: VibePost[],
  incomingPosts: VibePost[]
) {
  const postsMap = new Map<string, VibePost>();

  [...previousPosts, ...incomingPosts].forEach((post) => {
    postsMap.set(post._id, post);
  });

  return Array.from(postsMap.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function VibespherePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<VibePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [pagination, setPagination] = useState<VibePagination | null>(null);

  const [selectedMood, setSelectedMood] = useState<VibeMood | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [pageError, setPageError] = useState("");
  const [submitError, setSubmitError] = useState("");

  /**
   * Accordéon mobile pour la zone de publication.
   * Fermé par défaut sur mobile pour compacter la page.
   */
  const [composeOpen, setComposeOpen] = useState(false);

  /**
   * ID du post à signaler.
   */
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  /**
   * ID utilisateur connecté.
   * Selon ta config NextAuth, l'id peut être sur _id ou id.
   */
  const currentUserId = useMemo(() => {
    const user = session?.user as { _id?: string; id?: string } | undefined;
    return user?._id ?? user?.id ?? "";
  }, [session]);

  /**
   * Redirection si non connecté.
   */
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?mode=login");
    }
  }, [status, router]);

  /**
   * Chargement du feed.
   */
  const fetchPosts = useCallback(
    async ({
      before,
      refresh = false,
    }: {
      before?: string | null;
      refresh?: boolean;
    } = {}) => {
      if (before) {
        setLoadingMore(true);
      } else if (refresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      setPageError("");

      try {
        const url = before
          ? `/api/vibesphere?before=${encodeURIComponent(
              before
            )}&limit=${FEED_LIMIT}`
          : `/api/vibesphere?limit=${FEED_LIMIT}`;

        const response = await fetch(url, {
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok || !data?.success) {
          setPageError(data?.error ?? "Impossible de charger les vibes.");
          return;
        }

        const incomingPosts: VibePost[] = data.posts ?? [];

        if (before) {
          setPosts((previousPosts) =>
            mergePostsWithoutDuplicates(previousPosts, incomingPosts)
          );
        } else {
          setPosts(incomingPosts);
        }

        setHasMore(Boolean(data.hasMore));
        setPagination(data.pagination ?? null);
      } catch {
        setPageError("Erreur de connexion au serveur.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts();
    }
  }, [status, fetchPosts]);

  const handleLoadMore = () => {
    if (loadingMore || !pagination?.nextBefore) return;

    fetchPosts({
      before: pagination.nextBefore,
    });
  };

  /**
   * Publication d'une vibe.
   */
  const handleSubmit = async () => {
    const cleanedContent = content.trim();

    if (!selectedMood || !cleanedContent || submitting) return;

    if (cleanedContent.length > MAX_CONTENT_LENGTH) {
      setSubmitError(
        `Votre vibe ne doit pas dépasser ${MAX_CONTENT_LENGTH} caractères.`
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const moodData = getMoodData(selectedMood);

      const response = await fetch("/api/vibesphere", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: cleanedContent,
          mood: selectedMood,
          emoji: moodData?.emoji ?? "✨",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setSubmitError(data?.error ?? "Erreur lors de la publication.");
        return;
      }

      setPosts((previousPosts) => [data.post, ...previousPosts]);

      setContent("");
      setSelectedMood(null);
      setComposeOpen(false);
    } catch {
      setSubmitError("Erreur réseau. Réessayez dans quelques instants.");
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Like / unlike optimiste.
   */
  const handleLike = async (postId: string) => {
    const previousPosts = posts;

    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post._id !== postId) return post;

        const nextLiked = !post.likedByMe;

        return {
          ...post,
          likedByMe: nextLiked,
          likesCount: Math.max(
            0,
            nextLiked ? post.likesCount + 1 : post.likesCount - 1
          ),
        };
      })
    );

    try {
      const response = await fetch(`/api/vibesphere/${postId}`, {
        method: "POST",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setPosts(previousPosts);
        return;
      }

      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likedByMe: Boolean(data.liked),
                likesCount: Number(data.likesCount ?? post.likesCount),
              }
            : post
        )
      );
    } catch {
      setPosts(previousPosts);
    }
  };

  /**
   * Suppression d'un post personnel.
   */
  const handleDelete = async (postId: string) => {
    const confirmed = window.confirm("Supprimer cette vibe ?");

    if (!confirmed) return;

    const previousPosts = posts;

    setPosts((currentPosts) =>
      currentPosts.filter((post) => post._id !== postId)
    );

    try {
      const response = await fetch(`/api/vibesphere/${postId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        setPosts(previousPosts);
        setPageError(data?.error ?? "Impossible de supprimer cette vibe.");
      }
    } catch {
      setPosts(previousPosts);
      setPageError("Erreur réseau pendant la suppression.");
    }
  };

  const selectedMoodData = selectedMood ? getMoodData(selectedMood) : null;

  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
          <Header />

          <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
            <Loader2 className="h-9 w-9 animate-spin text-purple-300" />

            <p className="text-sm text-white/60">
              Chargement des vibes...
            </p>
          </div>
        </div>

        <div className="hidden sm:block">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <Header />

        <OrbitGlow className="right-[-10%] top-24 h-72 w-72 sm:h-96 sm:w-96" />
        <OrbitGlow className="left-[-10%] top-[60%] h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />

        <main className="relative z-10 mx-auto max-w-2xl px-3 pb-8 pt-20 sm:px-4 sm:pb-16 sm:pt-24">
          {/* Header page compact */}
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-3xl border border-white/10 bg-white/8 p-4 text-center backdrop-blur-xl sm:mb-8 sm:p-6"
          >
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-400/20 bg-white/5 px-3 py-1.5 text-[11px] text-purple-200 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Communauté émotionnelle
            </div>

            <h1 className="bg-gradient-to-r from-purple-300 via-pink-300 to-white bg-clip-text text-2xl font-black text-transparent sm:text-4xl">
              VibeSphere 💜
            </h1>

            <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-white/55 sm:mt-2 sm:text-base">
              Exprime ton mood, découvre les vibes de la communauté et garde une
              trace de ton univers émotionnel.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-center">
              <Link
                href="/vibesphere/journal"
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm"
              >
                <BookOpen className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Journal
              </Link>

              <button
                type="button"
                onClick={() => fetchPosts({ refresh: true })}
                disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-50 sm:px-4 sm:text-sm"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                Actualiser
              </button>
            </div>
          </motion.section>

          {/* Erreur globale */}
          <AnimatePresence>
            {pageError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-4 flex items-center gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs text-red-200 sm:text-sm"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />

                <span className="flex-1">{pageError}</span>

                <button
                  type="button"
                  onClick={() => setPageError("")}
                  className="text-red-300 transition hover:text-white"
                  aria-label="Fermer l'erreur"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compose accordion mobile */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mb-4 overflow-hidden rounded-3xl border border-white/15 bg-white/10 backdrop-blur-sm sm:mb-8"
          >
            <button
              type="button"
              onClick={() => setComposeOpen((current) => !current)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left sm:hidden"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-500/25 text-lg">
                ✍️
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">
                  Partager une vibe
                </p>

                <p className="truncate text-[11px] text-white/45">
                  Choisis un mood puis écris quelques mots.
                </p>
              </div>

              {selectedMoodData && (
                <span
                  className={`rounded-full bg-gradient-to-r ${selectedMoodData.color} px-2 py-0.5 text-[10px] font-semibold text-white`}
                >
                  {selectedMoodData.emoji}
                </span>
              )}

              <ChevronDown
                className={`h-4 w-4 text-white/50 transition-transform ${
                  composeOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Desktop : toujours ouvert / Mobile : accordéon */}
            <AnimatePresence initial={false}>
              {(composeOpen || typeof window === "undefined") && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.23, ease: "easeOut" }}
                  className="overflow-hidden sm:hidden"
                >
                  <ComposeBox
                    content={content}
                    selectedMood={selectedMood}
                    selectedMoodData={selectedMoodData}
                    submitError={submitError}
                    submitting={submitting}
                    setContent={setContent}
                    setSelectedMood={setSelectedMood}
                    handleSubmit={handleSubmit}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="hidden sm:block">
              <ComposeBox
                content={content}
                selectedMood={selectedMood}
                selectedMoodData={selectedMoodData}
                submitError={submitError}
                submitting={submitting}
                setContent={setContent}
                setSelectedMood={setSelectedMood}
                handleSubmit={handleSubmit}
              />
            </div>
          </motion.section>

          {/* Feed */}
          <section className="space-y-3 sm:space-y-4">
            <AnimatePresence>
              {posts.map((post, index) => {
                const moodData = getMoodData(post.mood);
                const author = post.userId;

                const isOwn = Boolean(
                  currentUserId && author?._id === currentUserId
                );

                return (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: Math.min(index * 0.025, 0.2) }}
                    className="relative overflow-hidden rounded-3xl border border-white/12 bg-white/10 p-3 backdrop-blur-sm transition-colors hover:border-white/25 sm:p-5"
                  >
                    {moodData && (
                      <div
                        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${moodData.color}`}
                      />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${
                          moodData?.color ?? "from-purple-500 to-pink-500"
                        } text-xs font-bold sm:h-10 sm:w-10 sm:text-sm`}
                      >
                        {author?.image ? (
                          <img
                            src={author.image}
                            alt={author.pseudonyme}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          getInitials(author?.pseudonyme)
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-white sm:text-base">
                            {author?.pseudonyme ?? "Membre SferaLuna"}
                          </span>

                          {author?.identityVerified && (
                            <span
                              className="shrink-0 text-green-300"
                              title="Profil vérifié"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </span>
                          )}

                          {moodData && (
                            <span
                              className={`shrink-0 rounded-full bg-gradient-to-r ${moodData.color} px-2 py-0.5 text-[10px] font-medium text-white sm:text-xs`}
                            >
                              {moodData.emoji}
                              <span className="hidden sm:inline">
                                {" "}
                                {moodData.label}
                              </span>
                            </span>
                          )}

                          <span className="ml-auto shrink-0 text-[10px] text-white/35 sm:text-xs">
                            {timeAgo(post.createdAt)}
                          </span>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/82 sm:text-base">
                          {post.content}
                        </p>

                        {/* Actions compactes */}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs transition-colors sm:text-sm ${
                              post.likedByMe
                                ? "bg-pink-500/10 text-pink-400"
                                : "text-white/50 hover:bg-white/5 hover:text-pink-400"
                            }`}
                            aria-label={
                              post.likedByMe
                                ? "Retirer le like"
                                : "Liker cette vibe"
                            }
                          >
                            <Heart
                              size={14}
                              fill={post.likedByMe ? "currentColor" : "none"}
                            />

                            <span>{post.likesCount}</span>
                          </button>

                          {!isOwn && (
                            <button
                              type="button"
                              onClick={() => setReportPostId(post._id)}
                              className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-white/35 transition hover:bg-white/5 hover:text-red-400 sm:text-sm"
                              title="Signaler cette vibe"
                            >
                              <Flag size={13} />
                              <span className="hidden sm:inline">
                                Signaler
                              </span>
                            </button>
                          )}

                          {isOwn && (
                            <button
                              type="button"
                              onClick={() => handleDelete(post._id)}
                              className="ml-auto flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-white/35 transition hover:bg-white/5 hover:text-red-400 sm:text-sm"
                              title="Supprimer cette vibe"
                            >
                              <Trash2 size={13} />
                              <span className="hidden sm:inline">
                                Supprimer
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </section>

          {/* État vide */}
          {posts.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-white/50 sm:py-14"
            >
              <p className="mb-3 text-4xl">💭</p>

              <p className="font-medium text-white/70">
                Sois la première à partager une vibe !
              </p>

              <p className="mt-1 text-sm text-white/40">
                Choisis ton mood et écris quelques mots.
              </p>
            </motion.div>
          )}

          {/* Voir plus */}
          {hasMore && (
            <div className="mt-6 text-center sm:mt-8">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || !pagination?.nextBefore}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-3"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? "Chargement…" : "Voir plus"}
              </button>
            </div>
          )}
        </main>
      </div>

      <div className="hidden sm:block">
        <Footer />
      </div>

      <ReportModal
        isOpen={!!reportPostId}
        onClose={() => setReportPostId(null)}
        targetType="community_post"
        targetId={reportPostId ?? ""}
      />

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────────
// Compose box réutilisable
// ─────────────────────────────────────────────

function ComposeBox({
  content,
  selectedMood,
  selectedMoodData,
  submitError,
  submitting,
  setContent,
  setSelectedMood,
  handleSubmit,
}: {
  content: string;
  selectedMood: VibeMood | null;
  selectedMoodData: MoodConfig | undefined | null;
  submitError: string;
  submitting: boolean;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  setSelectedMood: React.Dispatch<React.SetStateAction<VibeMood | null>>;
  handleSubmit: () => void;
}) {
  return (
    <div className="border-t border-white/10 p-3 sm:border-t-0 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white sm:text-base">
            Partager une vibe
          </h2>

          <p className="mt-0.5 text-[11px] text-white/45 sm:text-xs">
            Choisis une émotion puis écris quelques mots.
          </p>
        </div>

        {selectedMoodData && (
          <span
            className={`shrink-0 rounded-full bg-gradient-to-r ${selectedMoodData.color} px-2.5 py-1 text-[10px] font-semibold text-white sm:px-3 sm:text-xs`}
          >
            {selectedMoodData.emoji} {selectedMoodData.label}
          </span>
        )}
      </div>

      {/* Sélecteur de mood compact */}
      <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible">
        {MOODS.map((mood) => {
          const isSelected = selectedMood === mood.mood;

          return (
            <button
              key={mood.mood}
              type="button"
              onClick={() => setSelectedMood(isSelected ? null : mood.mood)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                isSelected
                  ? "border-purple-400 bg-purple-500/30 text-white"
                  : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              <span>{mood.emoji}</span>
              <span>{mood.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(event) =>
            setContent(event.target.value.slice(0, MAX_CONTENT_LENGTH))
          }
          placeholder="Partage ta vibe du moment…"
          rows={3}
          className="w-full resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 pr-14 text-sm text-white placeholder-white/40 transition-colors focus:border-purple-400 focus:outline-none sm:px-4 sm:py-3 sm:pr-16"
        />

        <span
          className={`absolute bottom-3 right-3 text-[10px] sm:text-xs ${
            content.length >= 280 ? "text-red-400" : "text-white/40"
          }`}
        >
          {content.length}/{MAX_CONTENT_LENGTH}
        </span>
      </div>

      {submitError && (
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 sm:text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {submitError}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/45 sm:text-sm">
          {selectedMoodData
            ? `Mood : ${selectedMoodData.emoji} ${selectedMoodData.label}`
            : "Sélectionne un mood"}
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedMood || !content.trim() || submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-medium transition-all hover:from-purple-500 hover:to-pink-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}

          {submitting ? "Publication…" : "Publier"}
        </button>
      </div>
    </div>
  );
}
