"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Trash2, Send } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type VibeMood = "joyeuse" | "sereine" | "mélancolique" | "amoureuse" | "curieuse" | "fière" | "mystérieuse";

const MOODS: { mood: VibeMood; emoji: string; label: string; color: string }[] = [
  { mood: "joyeuse", emoji: "🌟", label: "Joyeuse", color: "from-yellow-400 to-orange-400" },
  { mood: "sereine", emoji: "🌊", label: "Sereine", color: "from-blue-400 to-cyan-400" },
  { mood: "mélancolique", emoji: "🌧️", label: "Mélancolique", color: "from-slate-400 to-blue-500" },
  { mood: "amoureuse", emoji: "💕", label: "Amoureuse", color: "from-pink-400 to-rose-500" },
  { mood: "curieuse", emoji: "🔮", label: "Curieuse", color: "from-purple-400 to-violet-500" },
  { mood: "fière", emoji: "✨", label: "Fière", color: "from-amber-400 to-yellow-500" },
  { mood: "mystérieuse", emoji: "🌙", label: "Mystérieuse", color: "from-indigo-500 to-purple-700" },
];

interface VibePost {
  _id: string;
  userId: { _id: string; pseudonyme: string; image?: string };
  content: string;
  mood: VibeMood;
  emoji: string;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
}

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
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function VibespherePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<VibePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [selectedMood, setSelectedMood] = useState<VibeMood | null>(null);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchPosts = useCallback(async (before?: string) => {
    try {
      const url = before ? `/api/vibesphere?before=${before}&limit=10` : `/api/vibesphere?limit=10`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (before) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setHasMore(data.hasMore);
      }
    } catch {
      // silencieux
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchPosts();
  }, [status, fetchPosts]);

  const handleLoadMore = () => {
    if (posts.length === 0) return;
    setLoadingMore(true);
    fetchPosts(posts[posts.length - 1].createdAt);
  };

  const handleSubmit = async () => {
    if (!selectedMood || !content.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const moodData = MOODS.find((m) => m.mood === selectedMood);
      const res = await fetch("/api/vibesphere", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), mood: selectedMood, emoji: moodData?.emoji ?? "✨" }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [{ ...data.post, likesCount: 0, likedByMe: false }, ...prev]);
        setContent("");
        setSelectedMood(null);
      } else {
        setSubmitError(data.error ?? "Erreur lors de la publication.");
      }
    } catch {
      setSubmitError("Erreur réseau.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      )
    );
    try {
      await fetch(`/api/vibesphere/${postId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "like" }) });
    } catch {
      // revert optimistic
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likedByMe ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        )
      );
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const res = await fetch(`/api/vibesphere/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.filter((p) => p._id !== postId));
      }
    } catch {
      // silencieux
    }
  };

  const currentUserId = (session?.user as any)?._id ?? (session?.user as any)?.id;

  if (status === "loading" || loading) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
          <Header />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-white/60 text-lg">Chargement des vibes...</div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
        <Header />
        <main className="pt-24 pb-16 px-4 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-white bg-clip-text text-transparent">
              VibeSphere 💜
            </h1>
            <p className="text-white/60 mt-2">Exprime ton mood du jour</p>
          </motion.div>

          {/* Compose box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mb-8 border border-white/20"
          >
            {/* Sélecteur de mood */}
            <div className="flex flex-wrap gap-2 mb-4">
              {MOODS.map((m) => (
                <button
                  key={m.mood}
                  onClick={() => setSelectedMood(m.mood === selectedMood ? null : m.mood)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedMood === m.mood
                      ? "border-purple-400 bg-purple-500/30 text-white"
                      : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <span>{m.emoji}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 300))}
                placeholder="Partage ta vibe du moment…"
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:border-purple-400 transition-colors"
              />
              <span className={`absolute bottom-3 right-3 text-xs ${content.length >= 280 ? "text-red-400" : "text-white/40"}`}>
                {content.length}/300
              </span>
            </div>

            {submitError && <p className="text-red-400 text-sm mt-2">{submitError}</p>}

            <div className="flex items-center justify-between mt-3">
              <p className="text-white/40 text-sm">
                {selectedMood ? `Mood : ${MOODS.find((m) => m.mood === selectedMood)?.emoji} ${MOODS.find((m) => m.mood === selectedMood)?.label}` : "Sélectionne un mood"}
              </p>
              <button
                onClick={handleSubmit}
                disabled={!selectedMood || !content.trim() || submitting}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:from-purple-500 hover:to-pink-500 transition-all"
              >
                <Send size={14} />
                {submitting ? "Publication…" : "Publier"}
              </button>
            </div>
          </motion.div>

          {/* Feed */}
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post, i) => {
                const moodData = MOODS.find((m) => m.mood === post.mood);
                const isOwn = post.userId._id === currentUserId;
                return (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 hover:border-white/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold overflow-hidden">
                        {post.userId.image ? (
                          <img src={post.userId.image} alt={post.userId.pseudonyme} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(post.userId.pseudonyme)
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-white">{post.userId.pseudonyme}</span>
                          {moodData && (
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${moodData.color} text-white font-medium`}>
                              {moodData.emoji} {moodData.label}
                            </span>
                          )}
                          <span className="text-white/40 text-xs ml-auto">{timeAgo(post.createdAt)}</span>
                        </div>
                        <p className="text-white/85 mt-2 leading-relaxed">{post.content}</p>

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-3">
                          <button
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${
                              post.likedByMe ? "text-pink-400" : "text-white/50 hover:text-pink-400"
                            }`}
                          >
                            <Heart size={15} fill={post.likedByMe ? "currentColor" : "none"} />
                            <span>{post.likesCount}</span>
                          </button>

                          {isOwn && (
                            <button
                              onClick={() => handleDelete(post._id)}
                              className="flex items-center gap-1.5 text-sm text-white/40 hover:text-red-400 transition-colors ml-auto"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {posts.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-6 md:py-12 text-white/50">
              <p className="text-4xl mb-4">💭</p>
              <p>Sois la première à partager une vibe !</p>
            </motion.div>
          )}

          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white/80 transition-colors border border-white/20 disabled:opacity-50"
              >
                {loadingMore ? "Chargement…" : "Voir plus de vibes"}
              </button>
            </div>
          )}
        </main>
      </div>
      <Footer />
    </>
  );
}
