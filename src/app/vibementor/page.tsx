"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown, ChevronUp, MessageCircle, CheckCircle, PlusCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type MentorCategory = "premier-contact" | "profil" | "rencontre" | "relation" | "securite" | "autre";

const CATEGORIES: { value: MentorCategory | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "premier-contact", label: "Premier contact" },
  { value: "profil", label: "Profil" },
  { value: "rencontre", label: "Rencontre" },
  { value: "relation", label: "Relation" },
  { value: "securite", label: "Sécurité" },
  { value: "autre", label: "Autre" },
];

interface MentorAnswer {
  _id: string;
  userId: { _id: string; pseudonyme: string; image?: string };
  content: string;
  likes: string[];
  createdAt: string;
}

interface MentorPost {
  _id: string;
  userId: { _id: string; pseudonyme: string; image?: string };
  question: string;
  category: MentorCategory;
  answers: MentorAnswer[];
  answersCount: number;
  likesCount: number;
  likedByMe: boolean;
  isSolved: boolean;
  createdAt: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "hier";
  return `il y a ${days}j`;
}

const categoryLabel = (cat: MentorCategory) =>
  CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

export default function VibeMentorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<MentorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<MentorCategory | "all">("all");

  // Formulaire poser question
  const [showAskForm, setShowAskForm] = useState(false);
  const [askCategory, setAskCategory] = useState<MentorCategory>("premier-contact");
  const [askQuestion, setAskQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  // Question expandée
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Répondre
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  const fetchPosts = useCallback(async (category: MentorCategory | "all" = "all") => {
    setLoading(true);
    try {
      const url = category === "all" ? "/api/vibementor" : `/api/vibementor?category=${category}`;
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

  const handleAsk = async () => {
    if (!askQuestion.trim()) return;
    setAsking(true);
    setAskError("");
    try {
      const res = await fetch("/api/vibementor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: askQuestion.trim(), category: askCategory }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [{ ...data.post, answersCount: 0, likesCount: 0, likedByMe: false }, ...prev]);
        setAskQuestion("");
        setShowAskForm(false);
      } else {
        setAskError(data.error ?? "Erreur.");
      }
    } catch {
      setAskError("Erreur réseau.");
    } finally {
      setAsking(false);
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
      await fetch(`/api/vibementor/${postId}`, {
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
    }
  };

  const handleReply = async (postId: string) => {
    const content = replyContent[postId];
    if (!content?.trim()) return;
    setReplying(postId);
    try {
      const res = await fetch(`/api/vibementor/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", content }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => p._id === postId ? { ...data.post, likesCount: p.likesCount, likedByMe: p.likedByMe, answersCount: data.post.answers?.length ?? p.answersCount } : p));
        setReplyContent((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch {
      // silencieux
    } finally {
      setReplying(null);
    }
  };

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
      <main className="pt-24 pb-16 px-4 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2d1b69]">VibeMentor 🌟</h1>
            <p className="text-[#8E7AB5] mt-1 text-sm">Posez vos questions, partagez votre expérience</p>
          </div>
          <button
            onClick={() => setShowAskForm((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
          >
            <PlusCircle size={15} />
            Poser une question
          </button>
        </motion.div>

        {/* Formulaire question */}
        <AnimatePresence>
          {showAskForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white rounded-2xl p-5 border border-[#e8e0f5] shadow-sm">
                <h3 className="font-semibold text-[#2d1b69] mb-3">Poser une question</h3>
                <select
                  value={askCategory}
                  onChange={(e) => setAskCategory(e.target.value as MentorCategory)}
                  className="w-full border border-[#e8e0f5] rounded-xl px-3 py-2.5 text-[#2d1b69] focus:outline-none focus:border-purple-400 mb-3 text-sm"
                >
                  {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <textarea
                  value={askQuestion}
                  onChange={(e) => setAskQuestion(e.target.value.slice(0, 500))}
                  placeholder="Décrivez votre situation ou question…"
                  rows={3}
                  className="w-full border border-[#e8e0f5] rounded-xl px-3 py-2.5 text-[#2d1b69] placeholder-[#8E7AB5]/60 resize-none focus:outline-none focus:border-purple-400 text-sm mb-2"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8E7AB5]">{askQuestion.length}/500</span>
                  {askError && <span className="text-red-500 text-xs">{askError}</span>}
                  <div className="flex gap-2">
                    <button onClick={() => setShowAskForm(false)} className="px-4 py-2 text-sm text-[#8E7AB5] hover:bg-gray-50 rounded-xl transition-colors">Annuler</button>
                    <button onClick={handleAsk} disabled={!askQuestion.trim() || asking} className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl disabled:opacity-40 hover:from-purple-500 hover:to-pink-500 transition-all">
                      {asking ? "Envoi…" : "Publier"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtres catégories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat.value
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
                  : "border-[#e8e0f5] text-[#5B4B8A] bg-white hover:bg-purple-50"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Liste des questions */}
        {loading ? (
          <p className="text-center text-[#8E7AB5] py-12">Chargement des questions…</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-6 md:py-12 text-[#8E7AB5]">
            <p className="text-4xl mb-3">🌟</p>
            <p>Aucune question dans cette catégorie.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, i) => {
              const isExpanded = expandedId === post._id;
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
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0">
                        {post.userId?.image ? (
                          <img src={post.userId.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(post.userId?.pseudonyme ?? "?")
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-[#2d1b69] text-sm">{post.userId?.pseudonyme}</span>
                          <span className="text-xs px-2 py-0.5 bg-purple-50 text-[#8E7AB5] rounded-full border border-[#e8e0f5]">
                            {categoryLabel(post.category)}
                          </span>
                          {post.isSolved && (
                            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                              <CheckCircle size={10} /> Résolu
                            </span>
                          )}
                          <span className="text-xs text-[#8E7AB5] ml-auto">{timeAgo(post.createdAt)}</span>
                        </div>
                        <p className="text-[#2d1b69] text-sm leading-relaxed">{post.question}</p>

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
                            <span>{post.answers?.length ?? post.answersCount} réponse{(post.answers?.length ?? post.answersCount) !== 1 ? "s" : ""}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section réponses expandée */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-[#f0ecff]"
                      >
                        <div className="px-5 py-4 bg-[#faf9ff]">
                          {/* Réponses existantes */}
                          {post.answers && post.answers.length > 0 ? (
                            <div className="space-y-3 mb-4">
                              {post.answers.map((answer) => (
                                <div key={answer._id} className="flex gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-300 to-pink-300 flex items-center justify-center text-xs font-bold text-white overflow-hidden flex-shrink-0 mt-0.5">
                                    {answer.userId?.image ? (
                                      <img src={answer.userId.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      getInitials(answer.userId?.pseudonyme ?? "?")
                                    )}
                                  </div>
                                  <div className="flex-1 bg-white rounded-xl p-3 border border-[#e8e0f5]">
                                    <span className="font-semibold text-[#5B4B8A] text-xs">{answer.userId?.pseudonyme}</span>
                                    <p className="text-[#2d1b69] text-sm mt-0.5 leading-relaxed">{answer.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[#8E7AB5] text-sm mb-4">Soyez la première à répondre !</p>
                          )}

                          {/* Formulaire réponse */}
                          <div className="flex gap-2">
                            <textarea
                              value={replyContent[post._id] ?? ""}
                              onChange={(e) => setReplyContent((prev) => ({ ...prev, [post._id]: e.target.value.slice(0, 1000) }))}
                              placeholder="Votre réponse…"
                              rows={2}
                              className="flex-1 border border-[#e8e0f5] rounded-xl px-3 py-2 text-[#2d1b69] placeholder-[#8E7AB5]/60 resize-none focus:outline-none focus:border-purple-400 text-sm"
                            />
                            <button
                              onClick={() => handleReply(post._id)}
                              disabled={!replyContent[post._id]?.trim() || replying === post._id}
                              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-sm font-medium disabled:opacity-40 hover:from-purple-500 hover:to-pink-500 transition-all self-end"
                            >
                              {replying === post._id ? "…" : "Répondre"}
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
      </main>
      <Footer />
    </div>
  );
}
