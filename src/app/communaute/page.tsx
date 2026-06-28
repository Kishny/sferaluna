// src/app/communaute/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Pin,
  PlusCircle,
  Send,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type CommunityCategory =
  | "rencontres"
  | "conseils"
  | "sorties"
  | "bien-etre"
  | "humour"
  | "general";

const CATEGORIES: {
  value: CommunityCategory | "all";
  label: string;
  emoji: string;
}[] = [
  { value: "all", label: "Toutes", emoji: "💬" },
  { value: "rencontres", label: "Rencontres", emoji: "💕" },
  { value: "conseils", label: "Conseils", emoji: "💡" },
  { value: "sorties", label: "Sorties", emoji: "🎉" },
  { value: "bien-etre", label: "Bien-être", emoji: "🌿" },
  { value: "humour", label: "Humour", emoji: "😄" },
  { value: "general", label: "Général", emoji: "💬" },
];

const EMOJI_PICKER = [
  "💕",
  "🌟",
  "😄",
  "🔥",
  "💡",
  "🎉",
  "🌿",
  "✨",
  "🌸",
  "💜",
  "🌈",
  "🦋",
  "🌺",
  "💫",
  "🎶",
  "🌙",
  "🦄",
  "🍀",
  "❤️",
  "🌻",
];

interface Comment {
  _id: string;
  userId: { _id: string; pseudonyme: string; image?: string };
  content: string;
  createdAt: string;
}

interface CommunityPost {
  _id: string;
  userId: { _id: string; pseudonyme: string; image?: string };
  title: string;
  content: string;
  category: CommunityCategory;
  emoji: string;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  isPinned: boolean;
  comments?: Comment[];
  createdAt: string;
}

/**
 * Motif orbite décoratif (cercles concentriques + points d'accent),
 * écho visuel du nom "Sfera".
 */
function OrbitGlow({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={`pointer-events-none absolute opacity-[0.14] ${className}`}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="90" fill="none" stroke="#8E7AB5" strokeWidth="1" />
      <circle
        cx="100"
        cy="100"
        r="62"
        fill="none"
        stroke="#8E7AB5"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
      <circle cx="100" cy="100" r="34" fill="none" stroke="#8E7AB5" strokeWidth="1" />
      <circle cx="100" cy="10" r="3" fill="#5B4B8A" />
      <circle cx="190" cy="100" r="3" fill="#5B4B8A" />
      <circle cx="100" cy="190" r="3" fill="#5B4B8A" />
      <circle cx="10" cy="100" r="3" fill="#5B4B8A" />
    </svg>
  );
}

/**
 * Identité couleur par catégorie de post — chaque catégorie
 * a son propre accent pour rendre le feed plus lisible visuellement.
 */
const categoryThemes: Record<
  CommunityCategory,
  {
    avatarBg: string;
    badgeBg: string;
    badgeText: string;
    bar: string;
  }
> = {
  rencontres: {
    avatarBg: "from-[#FF6B6B] to-[#FF9A9A]",
    badgeBg: "bg-[#FF6B6B]/10",
    badgeText: "text-[#E0504F]",
    bar: "from-[#FF6B6B] to-[#FF9A9A]",
  },
  conseils: {
    avatarBg: "from-[#FFD166] to-[#FF9A3C]",
    badgeBg: "bg-[#FF9A3C]/10",
    badgeText: "text-[#C9762A]",
    bar: "from-[#FFD166] to-[#FF9A3C]",
  },
  sorties: {
    avatarBg: "from-[#FF9A3C] to-[#FF6B6B]",
    badgeBg: "bg-[#FF9A3C]/10",
    badgeText: "text-[#D9682E]",
    bar: "from-[#FF9A3C] to-[#FF6B6B]",
  },
  "bien-etre": {
    avatarBg: "from-[#4ECDC4] to-[#8FE9E0]",
    badgeBg: "bg-[#4ECDC4]/10",
    badgeText: "text-[#2F9D94]",
    bar: "from-[#4ECDC4] to-[#8FE9E0]",
  },
  humour: {
    avatarBg: "from-[#9D4EDD] to-[#C77DFF]",
    badgeBg: "bg-[#9D4EDD]/10",
    badgeText: "text-[#7E3BBE]",
    bar: "from-[#9D4EDD] to-[#C77DFF]",
  },
  general: {
    avatarBg: "from-purple-400 to-pink-400",
    badgeBg: "bg-purple-50",
    badgeText: "text-[#5B4B8A]",
    bar: "from-purple-400 to-pink-400",
  },
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) return "à l'instant";
    return `il y a ${hours}h`;
  }

  if (days === 1) return "hier";
  return `il y a ${days}j`;
}

export default function CommunautePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState<CommunityCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [commentContent, setCommentContent] = useState<Record<string, string>>(
    {}
  );
  const [submittingComment, setSubmittingComment] = useState<string | null>(
    null
  );

  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] =
    useState<CommunityCategory>("general");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchPosts = useCallback(
    async (category: CommunityCategory | "all" = "all") => {
      setLoading(true);

      try {
        const url =
          category === "all"
            ? "/api/community"
            : `/api/community?category=${category}`;

        const res = await fetch(url);
        const data = await res.json();

        if (data.success) setPosts(data.posts);
      } catch {
        // Silence volontaire pour éviter de casser l'UI.
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "authenticated") fetchPosts(activeCategory);
  }, [status, activeCategory, fetchPosts]);

  const handleLike = async (postId: string) => {
    if (likingIds.has(postId)) return;

    setLikingIds((prev) => new Set(prev).add(postId));

    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1,
            }
          : p
      )
    );

    try {
      await fetch(`/api/community/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likesCount: p.likedByMe
                  ? p.likesCount - 1
                  : p.likesCount + 1,
              }
            : p
        )
      );
    } finally {
      setLikingIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentContent[postId];

    if (!content?.trim()) return;

    setSubmittingComment(postId);

    try {
      const res = await fetch(`/api/community/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment", content }),
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...p,
                  comments: data.post.comments,
                  commentsCount: data.post.comments?.length ?? p.commentsCount + 1,
                }
              : p
          )
        );

        setCommentContent((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch {
      // Silence volontaire.
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch {
      // Silence volontaire.
    }
  };

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;

    setPosting(true);
    setPostError("");

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          emoji: newEmoji,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) => [
          {
            ...data.post,
            likesCount: 0,
            commentsCount: 0,
            likedByMe: false,
          },
          ...prev,
        ]);

        setNewTitle("");
        setNewContent("");
        setNewCategory("general");
        setNewEmoji("💬");
        setShowModal(false);
      } else {
        setPostError(data.error ?? "Erreur.");
      }
    } catch {
      setPostError("Erreur réseau.");
    } finally {
      setPosting(false);
    }
  };

  const currentUserId =
    (session?.user as { _id?: string; id?: string } | undefined)?._id ??
    (session?.user as { _id?: string; id?: string } | undefined)?.id;

  const getCatInfo = (cat: CommunityCategory) =>
    CATEGORIES.find((c) => c.value === cat);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
        <Header />
        <div className="flex min-h-screen items-center justify-center text-sm text-[#8E7AB5]">
          Chargement…
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
      <OrbitGlow className="right-[-8%] top-20 h-72 w-72 sm:h-96 sm:w-96" />
      <OrbitGlow className="left-[-10%] top-[60%] h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />

      <Header />

      <main className="relative z-10 mx-auto max-w-5xl px-3 pb-8 pt-20 sm:px-4 sm:pb-16 sm:pt-24">
        {/* Header compact */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-3xl border border-[#E8E0FF] bg-white/80 p-4 shadow-sm backdrop-blur sm:mb-8 sm:flex sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-[#2d1b69] sm:text-3xl">
              Communauté 💜
            </h1>

            <p className="mt-1 text-xs text-[#8E7AB5] sm:text-sm">
              Échangez, partagez, inspirez-vous.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-500 hover:to-pink-500 sm:mt-0 sm:w-auto"
          >
            <PlusCircle size={15} />
            Nouveau post ✍️
          </button>
        </motion.div>

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* Sidebar desktop */}
          <aside className="hidden w-52 shrink-0 md:block">
            <div className="sticky top-28 rounded-2xl border border-[#e8e0f5] bg-white p-3 shadow-sm">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`mb-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                    activeCategory === cat.value
                      ? "border border-[#e8e0f5] bg-gradient-to-r from-purple-50 to-pink-50 font-semibold text-[#5B4B8A]"
                      : "text-[#8E7AB5] hover:bg-gray-50"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Tabs mobile compactes */}
          <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat.value
                    ? "border-transparent bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    : "border-[#e8e0f5] bg-white text-[#5B4B8A]"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          <section className="min-w-0 flex-1">
            {loading ? (
              <p className="py-12 text-center text-sm text-[#8E7AB5]">
                Chargement des posts…
              </p>
            ) : posts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#E8E0FF] bg-white/70 py-10 text-center text-[#8E7AB5]">
                <p className="mb-3 text-4xl">💬</p>
                <p className="font-medium">Aucun post dans cette catégorie.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {posts.map((post, i) => {
                  const catInfo = getCatInfo(post.category);
                  const isExpanded = expandedId === post._id;
                  const isOwn = post.userId?._id === currentUserId;
                  const theme = categoryThemes[post.category] ?? categoryThemes.general;

                  return (
                    <motion.article
                      key={post._id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.035 }}
                      className="relative overflow-hidden rounded-2xl border border-[#e8e0f5] bg-white shadow-sm"
                    >
                      <div className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.bar}`} />

                      <div className="p-3 sm:p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e8e0f5] bg-gradient-to-br ${theme.avatarBg} text-xl`}
                          >
                            {post.emoji}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  {post.isPinned && (
                                    <Pin size={12} className="text-[#8E7AB5]" />
                                  )}

                                  <h2 className="truncate text-sm font-bold text-[#2d1b69] sm:text-base">
                                    {post.title}
                                  </h2>
                                </div>

                                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                  <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-[10px] font-bold text-white">
                                    {post.userId?.image ? (
                                      <img
                                        src={post.userId.image}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      getInitials(post.userId?.pseudonyme ?? "?")
                                    )}
                                  </div>

                                  <span className="text-xs text-[#8E7AB5]">
                                    {post.userId?.pseudonyme}
                                  </span>

                                  {catInfo && (
                                    <span
                                      className={`rounded-full border border-[#e8e0f5] px-2 py-0.5 text-[11px] ${theme.badgeBg} ${theme.badgeText}`}
                                    >
                                      {catInfo.emoji} {catInfo.label}
                                    </span>
                                  )}

                                  <span className="text-[11px] text-[#8E7AB5]/70">
                                    {timeAgo(post.createdAt)}
                                  </span>
                                </div>
                              </div>

                              {isOwn && (
                                <button
                                  onClick={() => handleDelete(post._id)}
                                  className="shrink-0 rounded-lg p-1 text-[#8E7AB5] transition hover:bg-red-50 hover:text-red-400"
                                  aria-label="Supprimer ce post"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>

                            <p
                              className={`text-sm leading-relaxed text-[#5B4B8A] ${
                                !isExpanded ? "line-clamp-3" : ""
                              }`}
                            >
                              {post.content}
                            </p>

                            <div className="mt-3 flex items-center gap-4">
                              <button
                                onClick={() => handleLike(post._id)}
                                className={`flex items-center gap-1.5 text-sm transition-colors ${
                                  post.likedByMe
                                    ? "text-pink-500"
                                    : "text-[#8E7AB5] hover:text-pink-500"
                                }`}
                              >
                                <Heart
                                  size={14}
                                  fill={
                                    post.likedByMe ? "currentColor" : "none"
                                  }
                                />
                                <span>{post.likesCount}</span>
                              </button>

                              <button
                                onClick={() =>
                                  setExpandedId(isExpanded ? null : post._id)
                                }
                                className="flex items-center gap-1.5 text-sm text-[#8E7AB5] transition-colors hover:text-[#5B4B8A]"
                              >
                                <MessageCircle size={14} />
                                <span>{post.commentsCount}</span>
                                {isExpanded ? (
                                  <ChevronUp size={12} />
                                ) : (
                                  <ChevronDown size={12} />
                                )}
                              </button>

                              {!isExpanded && post.content.length > 150 && (
                                <button
                                  onClick={() => setExpandedId(post._id)}
                                  className="ml-auto text-xs text-purple-500 transition-colors hover:text-purple-700"
                                >
                                  Voir tout
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-[#f0ecff]"
                          >
                            <div className="bg-[#faf9ff] px-3 py-3 sm:px-5 sm:py-4">
                              {post.comments && post.comments.length > 0 && (
                                <div className="mb-4 space-y-2.5">
                                  {post.comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-2.5">
                                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-300 to-pink-300 text-[10px] font-bold text-white">
                                        {comment.userId?.image ? (
                                          <img
                                            src={comment.userId.image}
                                            alt=""
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          getInitials(
                                            comment.userId?.pseudonyme ?? "?"
                                          )
                                        )}
                                      </div>

                                      <div className="flex-1 rounded-xl border border-[#e8e0f5] bg-white p-3">
                                        <span className="text-xs font-semibold text-[#5B4B8A]">
                                          {comment.userId?.pseudonyme}
                                        </span>

                                        <p className="mt-0.5 text-sm leading-relaxed text-[#2d1b69]">
                                          {comment.content}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={commentContent[post._id] ?? ""}
                                  onChange={(e) =>
                                    setCommentContent((prev) => ({
                                      ...prev,
                                      [post._id]: e.target.value.slice(0, 500),
                                    }))
                                  }
                                  placeholder="Ajouter un commentaire…"
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && handleComment(post._id)
                                  }
                                  className="min-w-0 flex-1 rounded-xl border border-[#e8e0f5] px-3 py-2 text-sm text-[#2d1b69] placeholder-[#8E7AB5]/60 focus:border-purple-400 focus:outline-none"
                                />

                                <button
                                  onClick={() => handleComment(post._id)}
                                  disabled={
                                    !commentContent[post._id]?.trim() ||
                                    submittingComment === post._id
                                  }
                                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all hover:from-purple-500 hover:to-pink-500 disabled:opacity-40"
                                >
                                  {submittingComment === post._id ? (
                                    "…"
                                  ) : (
                                    <Send size={15} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      {/* Modal nouveau post mobile-friendly */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
          >
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.98 }}
              className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-4 shadow-xl sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#2d1b69]">
                  Nouveau post ✍️
                </h3>

                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-lg p-1 text-[#8E7AB5] transition hover:bg-purple-50 hover:text-[#5B4B8A]"
                >
                  <X size={18} />
                </button>
              </div>

              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value.slice(0, 150))}
                placeholder="Titre de votre post…"
                className="mb-3 w-full rounded-xl border border-[#e8e0f5] px-3 py-2.5 text-sm text-[#2d1b69] placeholder-[#8E7AB5]/60 focus:border-purple-400 focus:outline-none"
              />

              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as CommunityCategory)
                }
                className="mb-3 w-full rounded-xl border border-[#e8e0f5] px-3 py-2.5 text-sm text-[#2d1b69] focus:border-purple-400 focus:outline-none"
              >
                {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.emoji} {c.label}
                  </option>
                ))}
              </select>

              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-[#5B4B8A]">
                  Emoji du post :
                </p>

                <div className="grid grid-cols-10 gap-1.5">
                  {EMOJI_PICKER.map((em) => (
                    <button
                      key={em}
                      onClick={() => setNewEmoji(em)}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all ${
                        newEmoji === em
                          ? "border-2 border-purple-400 bg-purple-100"
                          : "border border-transparent bg-gray-50 hover:bg-purple-50"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value.slice(0, 2000))}
                placeholder="Partagez vos pensées, expériences, conseils…"
                rows={5}
                className="mb-2 w-full resize-none rounded-xl border border-[#e8e0f5] px-3 py-2.5 text-sm text-[#2d1b69] placeholder-[#8E7AB5]/60 focus:border-purple-400 focus:outline-none"
              />

              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs text-[#8E7AB5]">
                  {newContent.length}/2000
                </span>

                {postError && (
                  <span className="text-xs text-red-500">{postError}</span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-[#e8e0f5] py-2.5 text-sm font-medium text-[#8E7AB5] transition-colors hover:bg-gray-50"
                >
                  Annuler
                </button>

                <button
                  onClick={handlePost}
                  disabled={!newTitle.trim() || !newContent.trim() || posting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2.5 text-sm font-medium text-white transition-all hover:from-purple-500 hover:to-pink-500 disabled:opacity-40"
                >
                  {posting ? "Publication…" : "Publier"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}