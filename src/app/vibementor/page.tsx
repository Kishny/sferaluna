// src/app/vibementor/page.tsx

"use client";

/**
 * VibeMentor — questions et conseils bienveillants entre membres.
 *
 * Données : GET /api/vibementor (questions + réponses, chiffres réels et
 * sujets tendance sur la première page, recherche ?q=, catégorie).
 * Actions : POST /api/vibementor (poser une question),
 *           POST /api/vibementor/[id] { action: "answer" | "like" }.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Flame,
  Heart,
  Loader2,
  MessageCircle,
  MessagesSquare,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";

import { ExplorerShell } from "@/components/explorer/shared";
import {
  Avatar,
  BTN_PRIMARY,
  ErrorBanner,
  Eyebrow,
  FilterPill,
  LoadingBlock,
  PANEL,
  PANEL_FEATURED,
  PillRow,
  SearchField,
  SelectPill,
  timeAgo,
} from "@/components/app/kit";
import { SceneArt } from "@/components/site/art";
import { ScriptNote, cn } from "@/components/site/ui";

type MentorCategory = "premier-contact" | "profil" | "rencontre" | "relation" | "securite" | "autre";

const CATEGORIES: { value: MentorCategory; label: string; emoji: string }[] = [
  { value: "premier-contact", label: "Premier contact", emoji: "💬" },
  { value: "profil", label: "Profil", emoji: "👤" },
  { value: "rencontre", label: "Rencontre", emoji: "💜" },
  { value: "relation", label: "Relation", emoji: "🌙" },
  { value: "securite", label: "Sécurité", emoji: "🛡️" },
  { value: "autre", label: "Autres", emoji: "✨" },
];

const CAT_TONE: Record<MentorCategory, string> = {
  "premier-contact": "bg-pink-500/85",
  profil: "bg-indigo-500/85",
  rencontre: "bg-fuchsia-600/85",
  relation: "bg-amber-500/80",
  securite: "bg-sky-600/85",
  autre: "bg-violet-600/85",
};

const catMeta = (c: MentorCategory) => CATEGORIES.find((x) => x.value === c) ?? CATEGORIES[5];

interface Person {
  _id: string;
  pseudonyme: string;
  image?: string;
}

interface MentorAnswer {
  _id: string;
  userId: Person | null;
  content: string;
  createdAt: string;
}

interface MentorPost {
  _id: string;
  userId: Person | null;
  question: string;
  category: MentorCategory;
  answers: MentorAnswer[];
  answersCount: number;
  likesCount: number;
  likedByMe: boolean;
  isSolved: boolean;
  createdAt: string;
}

interface Trending {
  _id: string;
  question: string;
  category: MentorCategory;
  answersCount: number;
}

type Sort = "recent" | "answers" | "unanswered";

/** Guides écrits par l'équipe (conseils génériques, pas de données membres). */
const GUIDES: { icon: LucideIcon; title: string; text: string; tips: string[]; scene: "night" | "dusk" | "river" }[] = [
  {
    icon: Heart,
    title: "Réussir son premier rendez-vous",
    text: "Nos repères pour une rencontre sereine et authentique.",
    scene: "dusk",
    tips: [
      "Choisissez un lieu public, animé et facile d’accès.",
      "Prévenez une personne de confiance : où, quand, avec qui.",
      "Gardez votre propre moyen de transport pour rentrer.",
      "Restez vous-même : la curiosité vaut mieux que la performance.",
    ],
  },
  {
    icon: UserRound,
    title: "Créer un profil qui vous ressemble",
    text: "Photos, bio, astuces : mettez toutes les chances de votre côté.",
    scene: "night",
    tips: [
      "Une photo nette et lumineuse, où l’on voit bien votre visage.",
      "Une bio courte qui raconte une passion ou une anecdote.",
      "Des centres d’intérêt sincères : ils nourrissent l’affinité.",
      "Précisez vos intentions pour attirer les bonnes personnes.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Rester en sécurité sur SferaLuna",
    text: "Les bons réflexes pour profiter des rencontres en confiance.",
    scene: "river",
    tips: [
      "Ne partagez jamais vos coordonnées bancaires ni vos mots de passe.",
      "Méfiez-vous des demandes d’argent, même pour une urgence.",
      "Gardez la conversation sur SferaLuna tant que la confiance n’est pas là.",
      "Signalez ou bloquez un profil au moindre doute : c’est anonyme.",
    ],
  },
];

function MentorContent() {
  const router = useRouter();
  const [posts, setPosts] = useState<MentorPost[]>([]);
  const [stats, setStats] = useState<{ questions: number; answers: number } | null>(null);
  const [trending, setTrending] = useState<Trending[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState<MentorCategory | "all">("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ limit: "30" });
      if (category !== "all") q.set("category", category);
      if (debounced) q.set("q", debounced);
      const res = await fetch(`/api/vibementor?${q}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/auth?mode=login&callbackUrl=%2Fvibementor");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger les discussions.");
        return;
      }
      setPosts(data.posts ?? []);
      if (data.stats) setStats(data.stats);
      if (data.trending) setTrending(data.trending);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [category, debounced, router]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const list = sort === "unanswered" ? posts.filter((p) => p.answersCount === 0) : [...posts];
    if (sort === "answers") list.sort((a, b) => b.answersCount - a.answersCount);
    return list;
  }, [posts, sort]);

  const updatePost = (id: string, patch: (p: MentorPost) => MentorPost) => setPosts((prev) => prev.map((p) => (p._id === id ? patch(p) : p)));

  const like = async (post: MentorPost) => {
    const toggle = (p: MentorPost) => ({ ...p, likedByMe: !p.likedByMe, likesCount: Math.max(0, p.likesCount + (p.likedByMe ? -1 : 1)) });
    updatePost(post._id, toggle);
    try {
      const res = await fetch(`/api/vibementor/${post._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like" }),
      });
      if (!res.ok) updatePost(post._id, toggle);
    } catch {
      updatePost(post._id, toggle);
    }
  };

  const answer = async (post: MentorPost, content: string) => {
    const res = await fetch(`/api/vibementor/${post._id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "answer", content }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) throw new Error(data?.error || "Réponse impossible pour le moment.");
    updatePost(post._id, (p) => ({ ...p, answers: data.post.answers ?? p.answers, answersCount: data.post.answers?.length ?? p.answersCount + 1 }));
    setStats((s) => (s ? { ...s, answers: s.answers + 1 } : s));
  };

  const openTrending = (t: Trending) => {
    setCategory("all");
    setSearch("");
    setSort("recent");
    setExpandedId(t._id);
    setTimeout(() => document.getElementById(`q-${t._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 400);
  };

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/mon-compte" fallbackLabel="Retour au tableau de bord" />
        {/* ── Bandeau ── */}
        <section className={cn(PANEL_FEATURED, "relative mt-2 overflow-hidden")}>
          <div className="absolute inset-y-0 right-0 hidden w-[45%] lg:block">
            <SceneArt variant="river" seed={7} className="absolute inset-0" />
            <span className="absolute inset-0 bg-gradient-to-r from-[#1f0d40] via-[#1f0d40]/40 to-transparent" />
          </div>
          <div className="relative p-6 sm:p-8 lg:max-w-[60%]">
            <Eyebrow icon={Sparkles}>Coaching communautaire</Eyebrow>
            <h1 className="mt-4 text-[40px] font-extrabold leading-none tracking-tight sm:text-6xl">
              <span className="text-white">Vibe</span>
              <span className="bg-gradient-to-r from-fuchsia-300 to-pink-400 bg-clip-text text-transparent">Mentor</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Posez vos questions, recevez des conseils bienveillants et partagez votre expérience avec la communauté SferaLuna.
            </p>
            {stats && stats.questions > 0 && (
              <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-violet-300/15 bg-white/[0.04] px-4 py-3">
                  <MessageCircle className="h-6 w-6 text-violet-300" />
                  <div>
                    <p className="text-xl font-bold text-white">{stats.questions}</p>
                    <p className="text-xs text-white/65">question{stats.questions > 1 ? "s" : ""} posée{stats.questions > 1 ? "s" : ""}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-violet-300/15 bg-white/[0.04] px-4 py-3">
                  <Users className="h-6 w-6 text-fuchsia-300" />
                  <div>
                    <p className="text-xl font-bold text-white">{stats.answers}</p>
                    <p className="text-xs text-white/65">réponse{stats.answers > 1 ? "s" : ""} de la communauté</p>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button type="button" onClick={() => setAskOpen(true)} className={cn(BTN_PRIMARY, "h-[52px] px-7 text-base")}>
                <PlusCircle className="h-5 w-5" /> Poser une question
              </button>
              <ScriptNote className="text-2xl">Une question ? La communauté est là pour vous 💜</ScriptNote>
            </div>
          </div>
        </section>

        {/* ── Filtres ── */}
        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
          <PillRow className="lg:flex-1">
            <FilterPill active={category === "all"} onClick={() => setCategory("all")} icon={<span aria-hidden>🌟</span>}>
              Tous
            </FilterPill>
            {CATEGORIES.map((c) => (
              <FilterPill key={c.value} active={category === c.value} onClick={() => setCategory(c.value)} icon={<span aria-hidden>{c.emoji}</span>}>
                {c.label}
              </FilterPill>
            ))}
          </PillRow>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchField value={search} onChange={setSearch} placeholder="Rechercher une question…" className="flex-1 lg:w-72" />
            <SelectPill<Sort>
              value={sort}
              onChange={setSort}
              icon={ArrowDownUp}
              label="Trier"
              options={[
                { value: "recent", label: "Plus récentes" },
                { value: "answers", label: "Plus de réponses" },
                { value: "unanswered", label: "Sans réponse" },
              ]}
            />
          </div>
        </div>

        {error && (
          <div className="mt-5">
            <ErrorBanner message={error} onRetry={load} onClose={() => setError("")} />
          </div>
        )}

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── Discussions ── */}
          <section className="min-w-0">
            <div className="flex items-start gap-3">
              <MessagesSquare className="mt-1 h-6 w-6 shrink-0 text-violet-300" />
              <div>
                <h2 className="text-xl font-bold text-white">Discussions récentes</h2>
                <p className="text-sm text-white/65">Des questions réelles, des conseils sincères, une communauté qui se soutient.</p>
              </div>
            </div>

            {loading ? (
              <LoadingBlock label="Chargement des discussions…" />
            ) : visible.length === 0 ? (
              <div className={cn(PANEL, "mt-4 px-6 py-10 text-center")}>
                <p className="font-semibold text-white">{debounced || category !== "all" || sort === "unanswered" ? "Aucune question ne correspond." : "Aucune question pour l’instant."}</p>
                <p className="mt-1 text-sm text-white/65">Soyez la première à lancer la discussion !</p>
                <button type="button" onClick={() => setAskOpen(true)} className={cn(BTN_PRIMARY, "mt-5 h-11")}>
                  <PlusCircle className="h-4 w-4" /> Poser une question
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {visible.map((post) => (
                  <QuestionCard
                    key={post._id}
                    post={post}
                    open={expandedId === post._id}
                    onToggle={() => setExpandedId(expandedId === post._id ? null : post._id)}
                    onLike={() => like(post)}
                    onAnswer={(c) => answer(post, c)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Colonne droite ── */}
          <aside className="space-y-5">
            <div className={cn(PANEL_FEATURED, "p-5")}>
              <p className="flex items-center gap-2 text-lg font-semibold text-white">
                <BookOpen className="h-5 w-5 text-fuchsia-300" /> Guides pratiques
              </p>
              <ul className="mt-4 space-y-3">
                {GUIDES.map((g, i) => (
                  <li key={g.title} className="overflow-hidden rounded-2xl border border-violet-300/15 bg-white/[0.03]">
                    <button type="button" onClick={() => setGuideOpen(guideOpen === i ? null : i)} className="flex w-full items-center gap-3 p-2.5 text-left" aria-expanded={guideOpen === i}>
                      <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl">
                        <SceneArt variant={g.scene} seed={i + 21} className="absolute inset-0" />
                        <g.icon className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">{g.title}</span>
                        <span className="block text-xs leading-snug text-white/60">{g.text}</span>
                      </span>
                      <ChevronRight className={cn("h-4 w-4 shrink-0 text-white/60 transition", guideOpen === i && "rotate-90")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {guideOpen === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <ul className="space-y-2 px-4 pb-4 pt-1">
                            {g.tips.map((tip) => (
                              <li key={tip} className="flex gap-2 text-sm text-white/80">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> {tip}
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                ))}
              </ul>
            </div>

            {trending.length > 0 && (
              <div className={cn(PANEL_FEATURED, "p-5")}>
                <p className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Flame className="h-5 w-5 text-orange-400" /> Sujets tendance
                </p>
                <ol className="mt-3 divide-y divide-white/[0.06]">
                  {trending.map((t, i) => (
                    <li key={t._id}>
                      <button type="button" onClick={() => openTrending(t)} className="flex w-full items-center gap-3 py-2.5 text-left hover:text-fuchsia-100">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/25 text-xs font-bold text-white">{i + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-white/85">{t.question}</span>
                        <span className="shrink-0 text-xs text-white/55">
                          {t.answersCount} rép.
                        </span>
                        <ArrowUpRight className="h-4 w-4 shrink-0 text-emerald-300" />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </div>
      </div>

      <AskModal
        open={askOpen}
        onClose={() => setAskOpen(false)}
        onCreated={(post) => {
          setPosts((prev) => [{ ...post, answers: post.answers ?? [], answersCount: 0, likesCount: 0, likedByMe: false }, ...prev]);
          setStats((s) => (s ? { ...s, questions: s.questions + 1 } : s));
          setAskOpen(false);
        }}
      />
    </ExplorerShell>
  );
}

function QuestionCard({
  post,
  open,
  onToggle,
  onLike,
  onAnswer,
}: {
  post: MentorPost;
  open: boolean;
  onToggle: () => void;
  onLike: () => void;
  onAnswer: (content: string) => Promise<void>;
}) {
  const meta = catMeta(post.category);
  const author = post.userId?.pseudonyme ?? "Membre";
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const send = async () => {
    const content = reply.trim();
    if (!content) return;
    setSending(true);
    setErr("");
    try {
      await onAnswer(content);
      setReply("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Réponse impossible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <article id={`q-${post._id}`} className={cn(open ? PANEL_FEATURED : PANEL, "p-4 sm:p-5")}>
      <div className="flex gap-4">
        <Avatar src={post.userId?.image} name={author} size={56} className="hidden sm:inline-block" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
              <h3 className={cn("text-base font-semibold leading-snug text-white sm:text-lg", !open && "line-clamp-2")}>{post.question}</h3>
            </button>
            <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white", CAT_TONE[post.category])}>
              <span aria-hidden>{meta.emoji}</span> {meta.label}
            </span>
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-white/60">
            Par {author} · {timeAgo(post.createdAt)}
            {post.isSolved && (
              <span className="inline-flex items-center gap-1 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Résolue
              </span>
            )}
          </p>

          {!open && post.answers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.answers.slice(0, 3).map((a) => (
                <span key={a._id} className="inline-flex max-w-[240px] items-center gap-2 rounded-full border border-violet-300/15 bg-white/[0.04] py-1 pl-1 pr-3 text-xs text-white/80">
                  <Avatar src={a.userId?.image} name={a.userId?.pseudonyme ?? "M"} size={22} />
                  <span className="truncate">{a.content}</span>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm">
            <button type="button" onClick={onToggle} className="inline-flex items-center gap-1.5 text-white/80 hover:text-white" aria-expanded={open}>
              <MessageCircle className="h-4 w-4 text-violet-300" />
              {post.answersCount} réponse{post.answersCount > 1 ? "s" : ""}
              <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={onLike}
              aria-pressed={post.likedByMe}
              className={cn("inline-flex items-center gap-1.5", post.likedByMe ? "text-pink-300" : "text-white/70 hover:text-white")}
            >
              <Heart className={cn("h-4 w-4", post.likedByMe && "fill-pink-400")} /> {post.likesCount}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {post.answers.length === 0 && <p className="text-sm text-white/60">Pas encore de réponse. Partagez votre expérience !</p>}
                  {post.answers.map((a) => (
                    <div key={a._id} className="flex gap-3">
                      <Avatar src={a.userId?.image} name={a.userId?.pseudonyme ?? "M"} size={34} />
                      <div className="min-w-0 flex-1 rounded-2xl border border-violet-300/12 bg-white/[0.04] px-3.5 py-2.5">
                        <p className="text-xs text-white/55">
                          <span className="font-semibold text-white/85">{a.userId?.pseudonyme ?? "Membre"}</span> · {timeAgo(a.createdAt)}
                        </p>
                        <p className="mt-0.5 whitespace-pre-line text-sm text-white/85">{a.content}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      maxLength={1000}
                      rows={2}
                      placeholder="Votre conseil, avec bienveillance…"
                      className="min-h-[48px] flex-1 resize-none rounded-2xl border border-violet-300/25 bg-[#12081f]/70 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-fuchsia-300/60 focus:outline-none"
                    />
                    <button type="button" onClick={send} disabled={sending || !reply.trim()} className={cn(BTN_PRIMARY, "h-12 w-12 shrink-0 self-end px-0")} aria-label="Envoyer la réponse">
                      {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </button>
                  </div>
                  {err && <p className="text-sm text-rose-300">{err}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </article>
  );
}

function AskModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (post: MentorPost) => void }) {
  const [category, setCategory] = useState<MentorCategory>("premier-contact");
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    const q = question.trim();
    if (q.length < 5) return setErr("Votre question est un peu courte.");
    setSending(true);
    setErr("");
    try {
      const res = await fetch("/api/vibementor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, category }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setErr(data?.error || "Publication impossible pour le moment.");
        return;
      }
      setQuestion("");
      onCreated(data.post);
    } catch {
      setErr("Connexion au serveur impossible.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Poser une question"
            className={cn(PANEL, "w-full max-w-lg rounded-b-none p-5 sm:rounded-3xl sm:p-6")}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Poser une question</h2>
              <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-2 text-white/70 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-white/65">Votre question est visible par les membres connectées. Évitez d’y mettre des informations personnelles.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm transition",
                    category === c.value ? "border-fuchsia-300/70 bg-fuchsia-500/25 text-white" : "border-violet-300/25 text-white/80 hover:border-fuchsia-300/50"
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Comment savoir si l’intérêt est réciproque ?"
              className="mt-4 w-full resize-none rounded-2xl border border-violet-300/25 bg-[#12081f]/70 px-4 py-3 text-sm text-white placeholder-white/40 focus:border-fuchsia-300/60 focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-white/45">{question.length}/500</p>
            {err && <p className="mt-2 text-sm text-rose-300">{err}</p>}
            <button type="button" onClick={submit} disabled={sending} className={cn(BTN_PRIMARY, "mt-4 h-12 w-full")}>
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Publier ma question
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function VibeMentorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <MentorContent />
    </Suspense>
  );
}
