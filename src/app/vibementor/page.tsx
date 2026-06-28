// src/app/vibementor/page.tsx

"use client";

/**
 * Page VibeMentor SferaLuna.
 *
 * Cette page permet :
 * - de consulter les questions de coaching / conseils relationnels ;
 * - de filtrer les questions par catégorie ;
 * - de poser une nouvelle question ;
 * - de liker une question ;
 * - de lire les réponses ;
 * - de répondre à une question.
 *
 * Objectif de cette version :
 * - garder la logique backend existante ;
 * - rendre la page beaucoup plus compacte sur mobile ;
 * - utiliser des accordéons pour éviter les longues cards ;
 * - préparer une belle section “à venir” pour les futures fonctionnalités VibeMentor.
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CheckCircle,
  ChevronDown,
  Heart,
  Lightbulb,
  Lock,
  MessageCircle,
  PlusCircle,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type MentorCategory =
  | "premier-contact"
  | "profil"
  | "rencontre"
  | "relation"
  | "securite"
  | "autre";

const CATEGORIES: { value: MentorCategory | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Tous", emoji: "🌟" },
  { value: "premier-contact", label: "Premier contact", emoji: "💬" },
  { value: "profil", label: "Profil", emoji: "👤" },
  { value: "rencontre", label: "Rencontre", emoji: "💜" },
  { value: "relation", label: "Relation", emoji: "🌙" },
  { value: "securite", label: "Sécurité", emoji: "🛡️" },
  { value: "autre", label: "Autre", emoji: "✨" },
];

interface MentorAnswer {
  _id: string;
  userId: {
    _id: string;
    pseudonyme: string;
    image?: string;
  };
  content: string;
  likes: string[];
  createdAt: string;
}

interface MentorPost {
  _id: string;
  userId: {
    _id: string;
    pseudonyme: string;
    image?: string;
  };
  question: string;
  category: MentorCategory;
  answers: MentorAnswer[];
  answersCount: number;
  likesCount: number;
  likedByMe: boolean;
  isSolved: boolean;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string) {
  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "récemment";

  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days <= 0) return "aujourd’hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function categoryLabel(cat: MentorCategory) {
  return CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
}

function categoryEmoji(cat: MentorCategory) {
  return CATEGORIES.find((c) => c.value === cat)?.emoji ?? "✨";
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
 * Thème couleur par catégorie de question.
 */
const categoryThemes: Record<MentorCategory, { avatarBg: string; badgeBg: string; badgeText: string; bar: string }> = {
  "premier-contact": {
    avatarBg: "from-[#FF6B6B] to-[#FF9A9A]",
    badgeBg: "bg-[#FF6B6B]/10",
    badgeText: "text-[#FF6B6B]",
    bar: "from-[#FF6B6B] to-[#FF9A9A]",
  },
  profil: {
    avatarBg: "from-[#4ECDC4] to-[#8FE9E0]",
    badgeBg: "bg-[#4ECDC4]/10",
    badgeText: "text-[#2E8C84]",
    bar: "from-[#4ECDC4] to-[#8FE9E0]",
  },
  rencontre: {
    avatarBg: "from-purple-400 to-pink-400",
    badgeBg: "bg-purple-50",
    badgeText: "text-[#8E7AB5]",
    bar: "from-purple-400 to-pink-400",
  },
  relation: {
    avatarBg: "from-[#9D4EDD] to-[#C77DFF]",
    badgeBg: "bg-[#9D4EDD]/10",
    badgeText: "text-[#7B2CBF]",
    bar: "from-[#9D4EDD] to-[#C77DFF]",
  },
  securite: {
    avatarBg: "from-[#667EEA] to-[#764BA2]",
    badgeBg: "bg-[#667EEA]/10",
    badgeText: "text-[#4F5FB8]",
    bar: "from-[#667EEA] to-[#764BA2]",
  },
  autre: {
    avatarBg: "from-[#FFD166] to-[#FF9A3C]",
    badgeBg: "bg-[#FFD166]/15",
    badgeText: "text-[#C97A12]",
    bar: "from-[#FFD166] to-[#FF9A3C]",
  },
};

// ─────────────────────────────────────────────
// Futures fonctionnalités VibeMentor
// ─────────────────────────────────────────────

const futureMentorFeatures = [
  {
    icon: Brain,
    emoji: "🧠",
    title: "Analyse émotionnelle guidée",
    description:
      "Une aide douce pour comprendre ce que tu ressens avant d’envoyer un message ou de prendre une décision.",
  },
  {
    icon: Lightbulb,
    emoji: "💡",
    title: "Conseils personnalisés",
    description:
      "Des suggestions adaptées à ta situation, ton intention relationnelle et ton rythme.",
  },
  {
    icon: Shield,
    emoji: "🛡️",
    title: "Guides sécurité relationnelle",
    description:
      "Des repères simples pour reconnaître les signaux d’alerte et poser tes limites clairement.",
  },
];

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function VibeMentorPage() {
  const { status } = useSession();
  const router = useRouter();

  const [posts, setPosts] = useState<MentorPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState<MentorCategory | "all">("all");

  /**
   * Formulaire pour poser une question.
   */
  const [showAskForm, setShowAskForm] = useState(false);
  const [askCategory, setAskCategory] =
    useState<MentorCategory>("premier-contact");
  const [askQuestion, setAskQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askError, setAskError] = useState("");

  /**
   * Question ouverte.
   * null = aucune question ouverte.
   */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /**
   * Accordéon mobile des futures fonctionnalités.
   */
  const [openFutureIndex, setOpenFutureIndex] = useState<number | null>(0);

  /**
   * Réponses.
   */
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Auth guard
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
    }
  }, [status, router]);

  // ─────────────────────────────────────────────
  // Chargement des questions
  // ─────────────────────────────────────────────

  const fetchPosts = useCallback(
    async (category: MentorCategory | "all" = "all") => {
      setLoading(true);

      try {
        const url =
          category === "all"
            ? "/api/vibementor"
            : `/api/vibementor?category=${category}`;

        const res = await fetch(url, {
          cache: "no-store",
        });

        const data = await res.json();

        if (data.success) {
          setPosts(data.posts ?? []);
        }
      } catch {
        // On reste silencieux pour ne pas casser l'expérience.
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "authenticated") {
      fetchPosts(activeCategory);
    }
  }, [status, activeCategory, fetchPosts]);

  // ─────────────────────────────────────────────
  // Poser une question
  // ─────────────────────────────────────────────

  const handleAsk = async () => {
    const question = askQuestion.trim();

    if (!question) return;

    setAsking(true);
    setAskError("");

    try {
      const res = await fetch("/api/vibementor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          category: askCategory,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) => [
          {
            ...data.post,
            answers: data.post.answers ?? [],
            answersCount: 0,
            likesCount: 0,
            likedByMe: false,
          },
          ...prev,
        ]);

        setAskQuestion("");
        setShowAskForm(false);
      } else {
        setAskError(data.error ?? "Impossible de publier la question.");
      }
    } catch {
      setAskError("Erreur réseau. Réessaie dans quelques secondes.");
    } finally {
      setAsking(false);
    }
  };

  // ─────────────────────────────────────────────
  // Like optimiste
  // ─────────────────────────────────────────────

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likesCount: p.likedByMe
                ? Math.max(p.likesCount - 1, 0)
                : p.likesCount + 1,
            }
          : p
      )
    );

    try {
      await fetch(`/api/vibementor/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "like",
        }),
      });
    } catch {
      /**
       * Revert si l'appel API échoue.
       */
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likesCount: p.likedByMe
                  ? Math.max(p.likesCount - 1, 0)
                  : p.likesCount + 1,
              }
            : p
        )
      );
    }
  };

  // ─────────────────────────────────────────────
  // Répondre à une question
  // ─────────────────────────────────────────────

  const handleReply = async (postId: string) => {
    const content = replyContent[postId]?.trim();

    if (!content) return;

    setReplying(postId);

    try {
      const res = await fetch(`/api/vibementor/${postId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "answer",
          content,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPosts((prev) =>
          prev.map((p) =>
            p._id === postId
              ? {
                  ...data.post,
                  likesCount: p.likesCount,
                  likedByMe: p.likedByMe,
                  answersCount: data.post.answers?.length ?? p.answersCount,
                }
              : p
          )
        );

        setReplyContent((prev) => ({
          ...prev,
          [postId]: "",
        }));
      }
    } catch {
      // Silencieux pour éviter de casser la page.
    } finally {
      setReplying(null);
    }
  };

  // ─────────────────────────────────────────────
  // Loading auth
  // ─────────────────────────────────────────────

  if (status === "loading") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff]">
          <Header />

          <div className="flex min-h-screen items-center justify-center px-4 text-sm text-[#8E7AB5]">
            Chargement de VibeMentor…
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
      <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] text-[#1C1C1C]">
        <Header />

        <OrbitGlow className="right-[-10%] top-24 h-72 w-72 sm:h-96 sm:w-96" />
        <OrbitGlow className="left-[-10%] top-[60%] h-80 w-80 sm:h-[28rem] sm:w-[28rem]" />

        <main className="relative z-10 mx-auto max-w-3xl px-3 pb-8 pt-20 sm:px-4 sm:pb-16 sm:pt-28">
          {/* ─────────────────────────────
              Hero compact
          ───────────────────────────── */}
          <motion.section
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-3xl border border-[#E8E0FF] bg-white/80 p-4 shadow-sm backdrop-blur sm:mb-6 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 text-2xl text-white shadow-lg shadow-purple-200 sm:h-14 sm:w-14">
                🌟
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-[#8E7AB5]">
                  <Sparkles className="h-3 w-3" />
                  Coaching communautaire
                </div>

                <h1 className="text-2xl font-black text-[#2d1b69] sm:text-4xl">
                  VibeMentor
                </h1>

                <p className="mt-1 text-xs leading-relaxed text-[#8E7AB5] sm:text-sm">
                  Pose tes questions, reçois des conseils bienveillants et
                  partage ton expérience avec la communauté.
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { value: posts.length, label: "questions" },
                {
                  value: posts.reduce(
                    (acc, post) =>
                      acc + (post.answers?.length ?? post.answersCount ?? 0),
                    0
                  ),
                  label: "réponses",
                },
                {
                  value: posts.filter((post) => post.isSolved).length,
                  label: "résolues",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#F0ECFA] bg-[#faf9ff] px-2 py-2 text-center"
                >
                  <p className="text-base font-black text-[#5B4B8A] sm:text-xl">
                    {loading ? "…" : item.value}
                  </p>

                  <p className="text-[10px] text-[#8E7AB5]/70 sm:text-xs">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAskForm((v) => !v)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:from-purple-500 hover:to-pink-500 sm:w-auto"
            >
              {showAskForm ? <X size={15} /> : <PlusCircle size={15} />}
              {showAskForm ? "Fermer" : "Poser une question"}
            </button>
          </motion.section>

          {/* ─────────────────────────────
              Formulaire question compact
          ───────────────────────────── */}
          <AnimatePresence>
            {showAskForm && (
              <motion.section
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mb-4 overflow-hidden sm:mb-6"
              >
                <div className="rounded-3xl border border-[#e8e0f5] bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-[#2d1b69] sm:text-base">
                        Poser une question
                      </h2>

                      <p className="text-xs text-[#8E7AB5]/70">
                        Maximum 500 caractères.
                      </p>
                    </div>

                    <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-semibold text-[#8E7AB5]">
                      {askQuestion.length}/500
                    </span>
                  </div>

                  <select
                    value={askCategory}
                    onChange={(e) =>
                      setAskCategory(e.target.value as MentorCategory)
                    }
                    className="mb-2.5 w-full rounded-xl border border-[#e8e0f5] px-3 py-2.5 text-sm text-[#2d1b69] outline-none transition focus:border-purple-400"
                  >
                    {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.emoji} {c.label}
                      </option>
                    ))}
                  </select>

                  <textarea
                    value={askQuestion}
                    onChange={(e) =>
                      setAskQuestion(e.target.value.slice(0, 500))
                    }
                    placeholder="Décris ta situation ou ta question…"
                    rows={3}
                    className="mb-2 w-full resize-none rounded-xl border border-[#e8e0f5] px-3 py-2.5 text-sm text-[#2d1b69] outline-none transition placeholder:text-[#8E7AB5]/50 focus:border-purple-400"
                  />

                  {askError && (
                    <p className="mb-2 text-xs font-medium text-red-500">
                      {askError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAskForm(false);
                        setAskError("");
                      }}
                      className="flex-1 rounded-xl border border-[#e8e0f5] px-4 py-2 text-sm font-medium text-[#8E7AB5] transition hover:bg-purple-50"
                    >
                      Annuler
                    </button>

                    <button
                      onClick={handleAsk}
                      disabled={!askQuestion.trim() || asking}
                      className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-40"
                    >
                      {asking ? "Envoi…" : "Publier"}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ─────────────────────────────
              Filtres catégories scrollables mobile
          ───────────────────────────── */}
          <div className="-mx-3 mb-4 overflow-x-auto px-3 scrollbar-none sm:mx-0 sm:mb-6 sm:px-0">
            <div className="flex min-w-max gap-2 sm:flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setActiveCategory(cat.value)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all sm:text-sm ${
                    activeCategory === cat.value
                      ? "border-transparent bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-100"
                      : "border-[#e8e0f5] bg-white text-[#5B4B8A] hover:bg-purple-50"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* ─────────────────────────────
              Futures cards mobile accordéon + desktop cards
          ───────────────────────────── */}
          <section className="mb-4 sm:mb-6">
            <div className="mb-2 flex items-center gap-2 px-1">
              <Brain className="h-4 w-4 text-[#8E7AB5]" />

              <h2 className="text-sm font-bold text-[#2d1b69]">
                Ce qui arrive bientôt
              </h2>
            </div>

            {/* Mobile accordéon */}
            <div className="space-y-2 sm:hidden">
              {futureMentorFeatures.map((item, index) => {
                const isOpen = openFutureIndex === index;
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="overflow-hidden rounded-2xl border border-[#e8e0f5] bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFutureIndex(isOpen ? null : index)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-lg">
                        {item.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-[#2d1b69]">
                          {item.title}
                        </h3>

                        <p className="truncate text-[11px] text-[#8E7AB5]">
                          {item.description}
                        </p>
                      </div>

                      <Icon className="h-4 w-4 shrink-0 text-[#8E7AB5]/70" />

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2">
                            <p className="text-xs leading-relaxed text-[#5B4B8A]">
                              {item.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Desktop cards */}
            <div className="hidden grid-cols-3 gap-3 sm:grid">
              {futureMentorFeatures.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-[#e8e0f5] bg-white p-4 shadow-sm"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-[#8E7AB5]">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="mb-1 text-sm font-bold text-[#2d1b69]">
                      {item.title}
                    </h3>

                    <p className="text-xs leading-relaxed text-[#8E7AB5]">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ─────────────────────────────
              Liste des questions
          ───────────────────────────── */}
          {loading ? (
            <div className="rounded-3xl border border-[#e8e0f5] bg-white p-8 text-center text-sm text-[#8E7AB5] shadow-sm">
              Chargement des questions…
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#e8e0f5] bg-white/70 px-4 py-10 text-center text-[#8E7AB5]">
              <p className="mb-2 text-4xl">🌟</p>
              <p className="text-sm font-semibold">
                Aucune question dans cette catégorie.
              </p>
              <p className="mt-1 text-xs text-[#8E7AB5]/70">
                Tu peux lancer la première discussion.
              </p>
            </div>
          ) : (
            <section className="space-y-3">
              {posts.map((post, i) => {
                const isExpanded = expandedId === post._id;
                const answersLength = post.answers?.length ?? post.answersCount;
                const theme = categoryThemes[post.category] ?? categoryThemes.autre;

                return (
                  <motion.article
                    key={post._id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.035 }}
                    className="relative overflow-hidden rounded-3xl border border-[#e8e0f5] bg-white shadow-sm"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${theme.bar}`}
                    />

                    {/* Header question compact */}
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : post._id)}
                      className="w-full px-3 py-3 text-left sm:px-5 sm:py-5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${theme.avatarBg} text-xs font-bold text-white sm:h-10 sm:w-10`}
                        >
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

                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span className="truncate text-sm font-bold text-[#2d1b69]">
                              {post.userId?.pseudonyme ?? "Membre Luna"}
                            </span>

                            <span
                              className={`shrink-0 rounded-full ${theme.badgeBg} px-2 py-0.5 text-[10px] font-semibold ${theme.badgeText}`}
                            >
                              {categoryEmoji(post.category)}{" "}
                              {categoryLabel(post.category)}
                            </span>

                            {post.isSolved && (
                              <span className="hidden shrink-0 items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 sm:flex">
                                <CheckCircle size={10} />
                                Résolu
                              </span>
                            )}

                            <span className="ml-auto shrink-0 text-[10px] text-[#8E7AB5]/60">
                              {timeAgo(post.createdAt)}
                            </span>
                          </div>

                          <p className="line-clamp-2 text-sm leading-relaxed text-[#2d1b69]">
                            {post.question}
                          </p>

                          <div className="mt-2 flex items-center gap-3">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLike(post._id);
                              }}
                              className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${
                                post.likedByMe
                                  ? "text-pink-500"
                                  : "text-[#8E7AB5]"
                              }`}
                            >
                              <Heart
                                size={13}
                                fill={post.likedByMe ? "currentColor" : "none"}
                              />
                              {post.likesCount}
                            </span>

                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8E7AB5]">
                              <MessageCircle size={13} />
                              {answersLength} réponse
                              {answersLength !== 1 ? "s" : ""}
                            </span>

                            <ChevronDown
                              className={`ml-auto h-4 w-4 text-[#8E7AB5] transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    {/* Réponses expandées */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.24, ease: "easeOut" }}
                          className="overflow-hidden border-t border-[#f0ecff]"
                        >
                          <div className="bg-[#faf9ff] px-3 py-3 sm:px-5 sm:py-4">
                            {/* Réponses existantes */}
                            {post.answers && post.answers.length > 0 ? (
                              <div className="mb-3 space-y-2.5">
                                {post.answers.map((answer) => (
                                  <div key={answer._id} className="flex gap-2.5">
                                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-300 to-pink-300 text-[10px] font-bold text-white">
                                      {answer.userId?.image ? (
                                        <img
                                          src={answer.userId.image}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        getInitials(
                                          answer.userId?.pseudonyme ?? "?"
                                        )
                                      )}
                                    </div>

                                    <div className="flex-1 rounded-2xl border border-[#e8e0f5] bg-white px-3 py-2">
                                      <span className="text-xs font-bold text-[#5B4B8A]">
                                        {answer.userId?.pseudonyme ??
                                          "Membre Luna"}
                                      </span>

                                      <p className="mt-0.5 text-xs leading-relaxed text-[#2d1b69] sm:text-sm">
                                        {answer.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mb-3 rounded-2xl border border-dashed border-[#e8e0f5] bg-white px-3 py-3 text-center text-xs text-[#8E7AB5]">
                                Soyez la première à répondre 💜
                              </p>
                            )}

                            {/* Formulaire réponse compact */}
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <textarea
                                value={replyContent[post._id] ?? ""}
                                onChange={(e) =>
                                  setReplyContent((prev) => ({
                                    ...prev,
                                    [post._id]: e.target.value.slice(0, 1000),
                                  }))
                                }
                                placeholder="Votre réponse…"
                                rows={2}
                                className="min-h-[72px] flex-1 resize-none rounded-xl border border-[#e8e0f5] px-3 py-2 text-sm text-[#2d1b69] outline-none placeholder:text-[#8E7AB5]/50 focus:border-purple-400"
                              />

                              <button
                                onClick={() => handleReply(post._id)}
                                disabled={
                                  !replyContent[post._id]?.trim() ||
                                  replying === post._id
                                }
                                className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 sm:self-end"
                              >
                                {replying === post._id ? "…" : "Répondre"}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </section>
          )}
        </main>
      </div>

      {/* Footer masqué sur mobile pour garder la page très compacte. */}
      <div className="hidden sm:block">
        <Footer />
      </div>

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
