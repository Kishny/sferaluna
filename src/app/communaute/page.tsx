"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Pin, X, ChevronDown, ChevronUp, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type CommunityCategory = "rencontres" | "conseils" | "sorties" | "bien-etre" | "humour" | "general";

const CATEGORIES: { value: CommunityCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Toutes", emoji: "💬" },
  { value: "rencontres", label: "Rencontres", emoji: "💕" },
  { value: "conseils", label: "Conseils", emoji: "💡" },
  { value: "sorties", label: "Sorties", emoji: "🎉" },
  { value: "bien-etre", label: "Bien-être", emoji: "🌿" },
  { value: "humour", label: "Humour", emoji: "😄" },
  { value: "general", label: "Général", emoji: "💬" },
];

const EMOJI_PICKER = ["💕", "🌟", "😄", "🔥", "💡", "🎉", "🌿", "✨", "🌸", "💜", "🌈", "🦋", "🌺", "💫", "🎶", "🌙", "🦄", "🍀", "❤️", "🌻"];

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

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
  const [activeCategory, setActiveCategory] = useState<CommunityCategory | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const [commentContent, setCommentContent] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  // Modal nouveau post
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<CommunityCategory>("general");
  const [newEmoji, setNewEmoji] = useState("💬");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchPosts = useCallback(async (category: CommunityCategory | "all" = "all") => {
    setLoading(true);
    try {
      const url = category === "all" ? "/api/community" : `/api/community?category=${category}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setPosts(data.posts);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchPosts(activeCategory);
  }, [status, activeCategory, fetchPosts]);

  const handleLike = async (postId: string) => {
    if (likingIds.has(postId)) return;
    setLikingIds((prev) => new Set(prev).add(postId));
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
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
      // revert
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        )
      );
    } finally {
      setLikingIds((prev) => { const s = new Set(prev); s.delete(postId); return s; });
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
        setPosts((prev) => prev.map((p) => p._id === postId ? {
          ...p,
          comments: data.post.comments,
          commentsCount: data.post.comments?.length ?? p.commentsCount + 1,
        } : p));
        setCommentContent((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch {
      // silencieux
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/community/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch {
      // silencieux
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
        body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim(), category: newCategory, emoji: newEmoji }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [{ ...data.post, likesCount: 0, commentsCount: 0, likedByMe: false }, ...prev]);
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

  const currentUserId = (session?.user as any)?._id ?? (session?.user as any)?.id;

  const getCatInfo = (cat: CommunityCategory) => CATEGORIES.find((c) => c.value === cat);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
        <Header />
        <div className="flex items-center justify-center min-h-screen text-[#8E7AB5]">Chargement…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
      <Header />
      <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2d1b69]">Communauté 💜</h1>
            <p className="text-[#8E7AB5] mt-1 text-sm">Échangez, partagez, inspirez-vous</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <PlusCircle size={15} />
            Nouveau post ✍️
          </button>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar catégories (desktop) */}
          <aside className="hidden md:block w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-[#e8e0f5] p-3 shadow-sm sticky top-28">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 text-left ${
                    activeCategory === cat.value
                      ? "bg-gradient-to-r from-purple-50 to-pink-50 text-[#5B4B8A] font-semibold border border-[#e8e0f5]"
                      : "text-[#8E7AB5] hover:bg-gray-50"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* Tabs mobile */}
          <div className="md:hidden flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  activeCategory === cat.value
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
                    : "border-[#e8e0f5] text-[#5B4B8A] bg-white"
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Feed */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <p className="text-center text-[#8E7AB5] py-12">Chargement des posts…</p>
            ) : posts.length === 0 ? (
              <div className="text-center py-6 md:py-12 text-[#8E7AB5]">
                <p className="text-4xl mb-3">💬</p>
                <p>Aucun post dans cette catégorie.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, i) => {
                  const catInfo = getCatInfo(post.category);
                  const isExpanded = expandedId === post._id;
                  const isOwn = post.userId?._id === currentUserId;

                  return (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="bg-white rounded-2xl border border-[#e8e0f5] shadow-sm overflow-hidden"
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          {/* Emoji avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-xl flex-shrink-0 border border-[#e8e0f5]">
                            {post.emoji}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  {post.isPinned && <Pin size={12} className="text-[#8E7AB5]" />}
                                  <span className="font-semibold text-[#2d1b69]">{post.title}</span>
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden">
                                    {post.userId?.image ? (
                                      <img src={post.userId.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      getInitials(post.userId?.pseudonyme ?? "?")
                                    )}
                                  </div>
                                  <span className="text-xs text-[#8E7AB5]">{post.userId?.pseudonyme}</span>
                                  {catInfo && (
                                    <span className="text-xs px-2 py-0.5 bg-purple-50 text-[#5B4B8A] rounded-full border border-[#e8e0f5]">
                                      {catInfo.emoji} {catInfo.label}
                                    </span>
                                  )}
                                  <span className="text-xs text-[#8E7AB5] ml-auto">{timeAgo(post.createdAt)}</span>
                                </div>
                              </div>
                              {isOwn && (
                                <button onClick={() => handleDelete(post._id)} className="text-[#8E7AB5] hover:text-red-400 transition-colors flex-shrink-0 p-1">
                                  <X size={14} />
                                </button>
                              )}
                            </div>

                            {/* Contenu (tronqué si non étendu) */}
                            <p className={`text-[#5B4B8A] text-sm leading-relaxed ${!isExpanded && "line-clamp-3"}`}>
                              {post.content}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-4 mt-3">
                              <button
                                onClick={() => handleLike(post._id)}
                                className={`flex items-center gap-1.5 text-sm transition-colors ${post.likedByMe ? "text-pink-500" : "text-[#8E7AB5] hover:text-pink-500"}`}
                              >
                                <Heart size={14} fill={post.likedByMe ? "currentColor" : "none"} />
                                <span>{post.likesCount}</span>
                              </button>
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : post._id)}
                                className="flex items-center gap-1.5 text-sm text-[#8E7AB5] hover:text-[#5B4B8A] transition-colors"
                              >
                                <MessageCircle size={14} />
                                <span>{post.commentsCount}</span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                              {!isExpanded && post.content.length > 150 && (
                                <button
                                  onClick={() => setExpandedId(post._id)}
                                  className="text-xs text-purple-500 hover:text-purple-700 transition-colors ml-auto"
                                >
                                  Voir tout
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section commentaires */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-[#f0ecff]"
                          >
                            <div className="px-5 py-4 bg-[#faf9ff]">
                              {/* Commentaires */}
                              {post.comments && post.comments.length > 0 && (
                                <div className="space-y-2.5 mb-4">
                                  {post.comments.map((comment) => (
                                    <div key={comment._id} className="flex gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden flex-shrink-0 mt-0.5">
                                        {comment.userId?.image ? (
                                          <img src={comment.userId.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          getInitials(comment.userId?.pseudonyme ?? "?")
                                        )}
                                      </div>
                                      <div className="flex-1 bg-white rounded-xl p-3 border border-[#e8e0f5]">
                                        <span className="font-semibold text-[#5B4B8A] text-xs">{comment.userId?.pseudonyme}</span>
                                        <p className="text-[#2d1b69] text-sm mt-0.5 leading-relaxed">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Formulaire commentaire */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={commentContent[post._id] ?? ""}
                                  onChange={(e) => setCommentContent((prev) => ({ ...prev, [post._id]: e.target.value.slice(0, 500) }))}
                                  placeholder="Ajouter un commentaire…"
                                  onKeyDown={(e) => e.key === "Enter" && handleComment(post._id)}
                                  className="flex-1 border border-[#e8e0f5] rounded-xl px-3 py-2 text-[#2d1b69] placeholder-[#8E7AB5]/60 focus:outline-none focus:border-purple-400 text-sm"
                                />
                                <button
                                  onClick={() => handleComment(post._id)}
                                  disabled={!commentContent[post._id]?.trim() || submittingComment === post._id}
                                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:from-purple-500 hover:to-pink-500 transition-all"
                                >
                                  {submittingComment === post._id ? "…" : "💬"}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal nouveau post */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#2d1b69] text-lg">Nouveau post ✍️</h3>
                <button onClick={() => setShowModal(false)} className="text-[#8E7AB5] hover:text-[#5B4B8A]">
                  <X size={18} />
                </button>
              </div>

              {/* Titre */}
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value.slice(0, 150))}
                placeholder="Titre de votre post…"
                className="w-full border border-[#e8e0f5] rounded-xl px-3 py-2.5 text-[#2d1b69] placeholder-[#8E7AB5]/60 focus:outline-none focus:border-purple-400 text-sm mb-3"
              />

              {/* Catégorie */}
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as CommunityCategory)}
                className="w-full border border-[#e8e0f5] rounded-xl px-3 py-2.5 text-[#2d1b69] focus:outline-none focus:border-purple-400 text-sm mb-3"
              >
                {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                  <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                ))}
              </select>

              {/* Emoji picker */}
              <div className="mb-3">
                <p className="text-xs font-medium text-[#5B4B8A] mb-2">Emoji du post :</p>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_PICKER.map((em) => (
                    <button
                      key={em}
                      onClick={() => setNewEmoji(em)}
                      className={`text-lg w-9 h-9 rounded-lg flex items-center justify-center transition-all ${newEmoji === em ? "bg-purple-100 border-2 border-purple-400" : "bg-gray-50 hover:bg-purple-50 border border-transparent"}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenu */}
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value.slice(0, 2000))}
                placeholder="Partagez vos pensées, expériences, conseils…"
                rows={5}
                className="w-full border border-[#e8e0f5] rounded-xl px-3 py-2.5 text-[#2d1b69] placeholder-[#8E7AB5]/60 resize-none focus:outline-none focus:border-purple-400 text-sm mb-2"
              />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-[#8E7AB5]">{newContent.length}/2000</span>
                {postError && <span className="text-red-500 text-xs">{postError}</span>}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-[#e8e0f5] text-[#8E7AB5] text-sm font-medium hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button
                  onClick={handlePost}
                  disabled={!newTitle.trim() || !newContent.trim() || posting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium disabled:opacity-40 hover:from-purple-500 hover:to-pink-500 transition-all"
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
