// src/app/communaute/page.tsx

"use client";

/**
 * Communauté : forum des membres.
 *
 * - Visiteuse : présentation de l'espace. Les discussions restent réservées
 *   aux membres (elles ne sont jamais exposées publiquement).
 * - Membre connectée : liste réelle des discussions (/api/community),
 *   recherche, filtres, j'aime, réponses, nouvelle discussion.
 *
 * Tous les chiffres affichés sont calculés à partir des données réelles.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Crown,
  Flame,
  GraduationCap,
  Heart,
  Lightbulb,
  Loader2,
  Lock,
  MessageCircle,
  MessagesSquare,
  Pin,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Sparkles,
  Star,
  Trash2,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";

import { SiteShell, useSiteStats } from "@/components/site/sections";
import { SceneArt, type SceneVariant } from "@/components/site/art";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PANEL, PageBody, PageHero, Pink, SectionTitle, TILE, statValue } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

type Category = "rencontres" | "conseils" | "sorties" | "bien-etre" | "humour" | "general";

const CATEGORIES: { value: Category; label: string; emoji: string; icon: LucideIcon; badge: string }[] = [
  { value: "rencontres", label: "Rencontres", emoji: "💕", icon: Heart, badge: "bg-fuchsia-500/20 text-fuchsia-200 ring-fuchsia-300/30" },
  { value: "conseils", label: "Conseils", emoji: "💡", icon: Lightbulb, badge: "bg-violet-500/25 text-violet-100 ring-violet-300/30" },
  { value: "sorties", label: "Sorties", emoji: "🎉", icon: CalendarDays, badge: "bg-amber-400/15 text-amber-200 ring-amber-300/30" },
  { value: "bien-etre", label: "Bien-être", emoji: "🌿", icon: Sparkles, badge: "bg-emerald-500/20 text-emerald-200 ring-emerald-300/30" },
  { value: "humour", label: "Humour", emoji: "😄", icon: Smile, badge: "bg-pink-500/20 text-pink-200 ring-pink-300/30" },
  { value: "general", label: "Général", emoji: "💬", icon: MessageCircle, badge: "bg-blue-500/20 text-blue-200 ring-blue-300/30" },
];

const categoryOf = (value: string) => CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[5];

type Author = { _id: string; pseudonyme?: string; image?: string } | null;

interface Comment {
  _id: string;
  userId: Author | string;
  content: string;
  createdAt: string;
}

interface Post {
  _id: string;
  userId: Author;
  title: string;
  content: string;
  category: Category;
  likesCount: number;
  commentsCount: number;
  likedByMe: boolean;
  isPinned: boolean;
  comments?: Comment[];
  createdAt: string;
}

const SPACES: { icon: LucideIcon; scene: SceneVariant; title: string; text: string; cta: string; href: string }[] = [
  { icon: MessageCircle, scene: "dusk", title: "Forum", text: "Échange librement sur tous les sujets : rencontres, conseils, expériences, quotidien…", cta: "Accéder au forum", href: "#discussions" },
  { icon: UsersRound, scene: "rooftop", title: "LunaGather", text: "Participe à des événements : sorties, ateliers et rencontres entre membres.", cta: "Découvrir LunaGather", href: "/evenements" },
  { icon: GraduationCap, scene: "river", title: "VibeMentor", text: "Des conseils et retours d’expérience de membres pour t’accompagner.", cta: "Explorer VibeMentor", href: "/vibementor" },
];

const CARE: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Sécurité", text: "Profils vérifiés et modération" },
  { icon: Heart, title: "Respect", text: "Une communauté bienveillante et inclusive" },
  { icon: Lock, title: "Confidentialité", text: "Discussions réservées aux membres" },
  { icon: MessageCircle, title: "Écoute", text: "Une équipe attentive aux signalements" },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

function Avatar({ author, size = 44 }: { author: Author | string | undefined; size?: number }) {
  const a = typeof author === "object" ? author : null;
  const name = a?.pseudonyme || "Membre";
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 font-semibold text-white ring-2 ring-[#1b0d38]"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {a?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={a.image} alt={name} className="h-full w-full object-cover" />
      ) : (
        name[0]?.toUpperCase()
      )}
    </span>
  );
}

const FIELD =
  "w-full rounded-2xl border border-violet-300/20 bg-white/[0.05] px-4 text-[15px] text-white placeholder:text-white/40 transition focus:border-fuchsia-300/60 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20";

export default function CommunautePage() {
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated";
  const myId = (session?.user as { id?: string; _id?: string } | undefined)?.id ?? (session?.user as { _id?: string } | undefined)?._id;
  const siteStats = useSiteStats();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<{ title: string; content: string; category: Category }>({ title: "", content: "", category: "general" });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/community");
      const data = await res.json();
      if (data?.success) setPosts(data.posts);
      else setLoadError(true);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (loggedIn) load();
  }, [loggedIn, load]);

  // ── Données dérivées (réelles) ───────────────────────────────
  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return posts.filter((p) => (category === "all" || p.category === category) && (!q || normalize(p.title).includes(q) || normalize(p.content).includes(q)));
  }, [posts, query, category]);

  const trending = useMemo(() => [...posts].filter((p) => p.commentsCount > 0).sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 5), [posts]);

  const activeAuthors = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const seen = new Map<string, NonNullable<Author>>();
    for (const p of posts) {
      if (p.userId && new Date(p.createdAt).getTime() >= weekAgo) seen.set(p.userId._id, p.userId);
      for (const c of p.comments ?? []) {
        if (typeof c.userId === "object" && c.userId && new Date(c.createdAt).getTime() >= weekAgo) seen.set(c.userId._id, c.userId);
      }
    }
    return [...seen.values()].slice(0, 8);
  }, [posts]);

  const totalComments = useMemo(() => posts.reduce((sum, p) => sum + p.commentsCount, 0), [posts]);

  // ── Actions ──────────────────────────────────────────────────
  const like = async (id: string) => {
    if (busy === `like-${id}`) return;
    setBusy(`like-${id}`);
    const flip = (p: Post) => (p._id === id ? { ...p, likedByMe: !p.likedByMe, likesCount: p.likesCount + (p.likedByMe ? -1 : 1) } : p);
    setPosts((prev) => prev.map(flip));
    try {
      const res = await fetch(`/api/community/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "like" }) });
      if (!res.ok) setPosts((prev) => prev.map(flip));
    } catch {
      setPosts((prev) => prev.map(flip));
    } finally {
      setBusy(null);
    }
  };

  const comment = async (id: string) => {
    const content = draft[id]?.trim();
    if (!content || busy) return;
    setBusy(`comment-${id}`);
    try {
      const res = await fetch(`/api/community/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "comment", content }) });
      const data = await res.json();
      if (data?.success) {
        setPosts((prev) => prev.map((p) => (p._id === id ? { ...p, comments: data.post.comments, commentsCount: data.post.comments?.length ?? p.commentsCount + 1 } : p)));
        setDraft((d) => ({ ...d, [id]: "" }));
      }
    } catch {
      // l'envoi a échoué : le texte reste dans le champ
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(`delete-${id}`);
    try {
      const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data?.success) setPosts((prev) => prev.filter((p) => p._id !== id));
    } catch {
      // rien : la discussion reste affichée
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  };

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (posting || !form.title.trim() || !form.content.trim()) return;
    setPosting(true);
    setPostError("");
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title.trim(), content: form.content.trim(), category: form.category, emoji: categoryOf(form.category).emoji }),
      });
      const data = await res.json();
      if (data?.success) {
        setPosts((prev) => [{ ...data.post, likesCount: 0, commentsCount: 0, likedByMe: false }, ...prev]);
        setForm({ title: "", content: "", category: "general" });
        setModal(false);
      } else {
        setPostError(data?.error ?? "La publication n’a pas abouti.");
      }
    } catch {
      setPostError("Erreur réseau. Réessaie dans un instant.");
    } finally {
      setPosting(false);
    }
  };

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PageHero
          id="com"
          pill="Communauté SferaLuna"
          pillIcon={UsersRound}
          title={
            <>
              Un espace pour <Pink>échanger,</Pink>
              <br />
              <Pink>partager</Pink> et se sentir <Pink>comprise</Pink> 💜
            </>
          }
          text="Une communauté bienveillante de femmes, pour discuter, poser tes questions, partager tes expériences et t’inspirer."
          note={
            <>
              Des échanges vrais,
              <br />
              entre personnes vraies ♡
            </>
          }
        />

        {/* Recherche + thèmes (membres) */}
        {loggedIn && (
          <div className={cn(PANEL, "!mt-8 flex flex-col gap-3 p-3 xl:flex-row xl:items-center")}>
            <label className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl border border-violet-300/20 bg-white/[0.04] px-4 focus-within:border-fuchsia-300/60">
              <Search className="h-5 w-5 shrink-0 text-white/65" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un sujet, une discussion…"
                aria-label="Rechercher une discussion"
                className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-white shadow-none outline-none ring-0 placeholder:text-white/45 focus:border-0 focus:outline-none focus:ring-0"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
              {[{ value: "all" as const, label: "Tout", icon: MessagesSquare }, ...CATEGORIES].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  aria-pressed={category === value}
                  className={cn(
                    "inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm transition",
                    category === value ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 font-semibold text-white" : "border border-violet-300/25 text-white/85 hover:border-fuchsia-300/60"
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Discussions + colonne latérale */}
        <div id="discussions" className={cn("grid scroll-mt-28 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start", !loggedIn && "!mt-8")}>
          <section className={cn(PANEL, "p-4 sm:p-5")}>
            <SectionTitle
              icon={Flame}
              title="Discussions"
              subtitle="Les sujets qui font parler la communauté."
              action={
                loggedIn ? (
                  <button type="button" onClick={() => setModal(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 text-sm font-semibold text-white transition hover:brightness-110">
                    <Plus className="h-4 w-4" /> Nouvelle discussion
                  </button>
                ) : null
              }
            />

            <div className="mt-4">
              {status === "loading" || (loggedIn && loading) ? (
                <div className="flex items-center justify-center gap-3 py-16 text-sm text-white/65">
                  <Loader2 className="h-5 w-5 animate-spin" /> Chargement des discussions…
                </div>
              ) : !loggedIn ? (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-fuchsia-300/30">
                    <Lock className="h-7 w-7 text-fuchsia-200" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">Les discussions sont réservées aux membres</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-white/70">
                    Pour que chacune puisse s’exprimer librement, ce qui se dit ici reste entre membres vérifiées. Crée ton profil pour lire les discussions et y participer.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link href="/auth?mode=register" className={BAND_PRIMARY}>
                      Créer mon profil gratuit <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link href="/auth?mode=login" className={BAND_GHOST}>
                      J’ai déjà un compte
                    </Link>
                  </div>
                </div>
              ) : loadError ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-white/75">Les discussions n’ont pas pu être chargées.</p>
                  <button type="button" onClick={load} className="mt-3 text-sm font-semibold text-pink-300 hover:underline">
                    Réessayer
                  </button>
                </div>
              ) : visible.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="font-semibold text-white">{posts.length === 0 ? "Aucune discussion pour l’instant" : "Aucune discussion ne correspond"}</p>
                  <p className="mt-1 text-sm text-white/65">{posts.length === 0 ? "Lance la première : pose une question, partage une expérience." : "Essaie un autre mot ou un autre thème."}</p>
                  {posts.length === 0 && (
                    <button type="button" onClick={() => setModal(true)} className={cn(BAND_PRIMARY, "mt-5")}>
                      <Plus className="h-5 w-5" /> Nouvelle discussion
                    </button>
                  )}
                </div>
              ) : (
                <ul className="space-y-2">
                  {visible.map((post) => {
                    const cat = categoryOf(post.category);
                    const isOpen = openId === post._id;
                    const mine = Boolean(myId && post.userId?._id === myId);
                    return (
                      <li key={post._id} id={`post-${post._id}`} className={cn(TILE, "scroll-mt-28 transition", isOpen && "border-fuchsia-300/45")}>
                        <div className="flex items-start gap-3 p-3.5 sm:items-center sm:gap-4">
                          <Avatar author={post.userId} />
                          <button type="button" onClick={() => setOpenId(isOpen ? null : post._id)} aria-expanded={isOpen} className="min-w-0 flex-1 text-left">
                            <span className="flex items-center gap-2 font-semibold text-white">
                              {post.isPinned && <Pin className="h-3.5 w-3.5 shrink-0 text-amber-300" />}
                              <span className={cn(!isOpen && "truncate")}>{post.title}</span>
                            </span>
                            {!isOpen && <span className="mt-0.5 line-clamp-2 text-sm leading-snug text-white/60">{post.content}</span>}
                            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-white/60">
                              <span className={cn("rounded-full px-2.5 py-0.5 font-medium ring-1", cat.badge)}>{cat.label}</span>
                              <span>{post.userId?.pseudonyme ?? "Membre"}</span>
                              <span>{formatDate(post.createdAt)}</span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3.5 w-3.5" /> {post.commentsCount}
                              </span>
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => like(post._id)}
                            aria-pressed={post.likedByMe}
                            aria-label={post.likedByMe ? "Retirer mon j’aime" : "J’aime"}
                            className={cn(
                              "flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition",
                              post.likedByMe ? "border-pink-400/60 bg-pink-500/15 text-pink-200" : "border-violet-300/25 text-white/75 hover:border-fuchsia-300/60"
                            )}
                          >
                            <Heart className={cn("h-4 w-4", post.likedByMe && "fill-pink-400 text-pink-400")} /> {post.likesCount}
                          </button>
                        </div>

                        {isOpen && (
                          <div className="border-t border-white/10 p-4">
                            <p className="whitespace-pre-line text-sm leading-relaxed text-white/85">{post.content}</p>

                            {mine &&
                              (confirmDelete === post._id ? (
                                <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
                                  Supprimer cette discussion et ses réponses ?
                                  <button type="button" onClick={() => remove(post._id)} disabled={busy === `delete-${post._id}`} className="font-semibold text-red-300 hover:underline">
                                    Oui, supprimer
                                  </button>
                                  <button type="button" onClick={() => setConfirmDelete(null)} className="text-white/60 hover:underline">
                                    Annuler
                                  </button>
                                </p>
                              ) : (
                                <button type="button" onClick={() => setConfirmDelete(post._id)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/55 hover:text-red-300">
                                  <Trash2 className="h-3.5 w-3.5" /> Supprimer ma discussion
                                </button>
                              ))}

                            {(post.comments?.length ?? 0) > 0 && (
                              <ul className="mt-4 space-y-3">
                                {post.comments!.map((c) => (
                                  <li key={c._id} className="flex gap-3">
                                    <Avatar author={c.userId} size={32} />
                                    <div className="min-w-0 flex-1 rounded-2xl bg-white/[0.05] px-3.5 py-2.5">
                                      <p className="text-xs text-white/55">
                                        <span className="font-semibold text-white/85">{(typeof c.userId === "object" && c.userId?.pseudonyme) || "Membre"}</span> · {formatDate(c.createdAt)}
                                      </p>
                                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white/85">{c.content}</p>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                comment(post._id);
                              }}
                              className="mt-4 flex gap-2"
                            >
                              <input
                                value={draft[post._id] ?? ""}
                                onChange={(e) => setDraft((d) => ({ ...d, [post._id]: e.target.value }))}
                                maxLength={500}
                                placeholder="Écrire une réponse bienveillante…"
                                aria-label="Ta réponse"
                                className={cn(FIELD, "h-11 min-w-0 flex-1")}
                              />
                              <button
                                type="submit"
                                disabled={!draft[post._id]?.trim() || busy === `comment-${post._id}`}
                                aria-label="Envoyer la réponse"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white transition hover:brightness-110 disabled:opacity-40"
                              >
                                {busy === `comment-${post._id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              </button>
                            </form>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Colonne latérale */}
          <aside className="space-y-4">
            {loggedIn && trending.length > 0 && (
              <div className={cn(PANEL, "p-4")}>
                <h2 className="flex items-center gap-2.5 font-bold text-white">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_2px_rgba(52,211,153,0.6)]" /> En ce moment dans la communauté
                </h2>
                <ol className="mt-3 space-y-1.5">
                  {trending.map((p, i) => (
                    <li key={p._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          setCategory("all");
                          setOpenId(p._id);
                          requestAnimationFrame(() => document.getElementById(`post-${p._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
                        }}
                        className={cn(TILE, "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:border-fuchsia-300/45")}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xs font-bold text-white">{i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{p.title}</span>
                          <span className="block text-xs text-white/55">
                            {p.commentsCount} réponse{p.commentsCount > 1 ? "s" : ""}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {!loggedIn && status !== "loading" && (
              <div className={cn(PANEL, "overflow-hidden")}>
                <div className="p-5">
                  <Crown className="h-8 w-8 text-amber-300" />
                  <h2 className="mt-3 text-lg font-bold text-white">Rejoins la communauté</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">Partage, échange et fais de nouvelles rencontres dans un espace bienveillant.</p>
                  <Link href="/auth?mode=register" className={cn(BAND_PRIMARY, "mt-4 w-full")}>
                    Créer mon profil gratuit <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="relative h-28">
                  <SceneArt variant="rooftop" seed={9} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-b from-[#1b0d38] to-transparent" />
                </div>
              </div>
            )}

            <div className={cn(PANEL, "p-4")}>
              {loggedIn && activeAuthors.length > 0 && (
                <>
                  <h2 className="font-bold text-white">Membres actives cette semaine</h2>
                  <div className="mt-3 flex -space-x-2">
                    {activeAuthors.map((a) => (
                      <Avatar key={a._id} author={a} size={42} />
                    ))}
                  </div>
                </>
              )}
              <dl className={cn("grid gap-2 text-center", loggedIn ? "grid-cols-3" : "grid-cols-1", loggedIn && activeAuthors.length > 0 && "mt-4")}>
                {[
                  { icon: UsersRound, value: statValue(siteStats?.membres), label: "membres", show: true },
                  { icon: MessageCircle, value: statValue(posts.length), label: `discussion${posts.length > 1 ? "s" : ""}`, show: loggedIn },
                  { icon: Heart, value: statValue(totalComments), label: `réponse${totalComments > 1 ? "s" : ""}`, show: loggedIn },
                ]
                  .filter((s) => s.show)
                  .map(({ icon: Icon, value, label }) => (
                    <div key={label} className={cn(TILE, "px-2 py-3")}>
                      <Icon className="mx-auto h-5 w-5 text-fuchsia-300" />
                      <dd className="mt-1.5 text-lg font-bold leading-none text-white">{value ?? "—"}</dd>
                      <dt className="mt-1 text-xs text-white/55">{label}</dt>
                    </div>
                  ))}
              </dl>
            </div>
          </aside>
        </div>

        {/* Espaces */}
        <SectionTitle className="!mt-8" icon={Star} tone="gold" title="Les espaces de la communauté" subtitle="Des espaces complémentaires pour échanger, apprendre et vivre des expériences uniques." />
        <div className="grid gap-3 lg:grid-cols-3">
          {SPACES.map(({ icon: Icon, scene, title, text, cta, href }, i) => (
            <article key={title} className="relative overflow-hidden rounded-3xl border border-violet-300/[0.16]">
              <SceneArt variant={scene} seed={i + 3} className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1b0d38] via-[#1b0d38]/85 to-[#1b0d38]/35" />
              <div className="relative flex gap-4 p-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg">
                  <Icon className="h-7 w-7 text-white" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">{text}</p>
                  <Link href={href} className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-violet-200/35 bg-[#1b0d38]/60 px-4 text-sm font-medium text-white backdrop-blur transition hover:border-fuchsia-300/70">
                    {cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Bienveillance */}
        <div className={cn(PANEL, "flex flex-col gap-5 p-5 xl:flex-row xl:items-center")}>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <ShieldCheck className="h-11 w-11 shrink-0 text-violet-300" />
            <div>
              <h2 className="text-lg font-bold text-white">Une communauté qui veille les unes sur les autres</h2>
              <p className="mt-0.5 text-sm text-white/70">Des règles claires et des outils pour garantir un espace sûr, respectueux et bienveillant.</p>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:flex xl:shrink-0 xl:gap-5">
            {CARE.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3 xl:max-w-[170px]">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15">
                  <Icon className="h-5 w-5 text-fuchsia-200" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{title}</span>
                  <span className="block text-xs leading-snug text-white/60">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {loggedIn ? (
          <CtaBand icon={Send} title="Une question, une expérience à partager ?" text="Lance une discussion : la communauté est là pour te répondre.">
            <button type="button" onClick={() => setModal(true)} className={BAND_PRIMARY}>
              <Plus className="h-5 w-5" /> Nouvelle discussion
            </button>
            <Link href="/evenements" className={BAND_GHOST}>
              Découvrir LunaGather
            </Link>
          </CtaBand>
        ) : (
          <CtaBand icon={Send} title="Rejoins la conversation aujourd’hui" text="Crée ton profil gratuitement et accède à toute la communauté SferaLuna.">
            <Link href="/auth?mode=register" className={BAND_PRIMARY}>
              Créer mon profil gratuit <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/fonctionnalites#lunagather" className={BAND_GHOST}>
              Découvrir LunaGather
            </Link>
          </CtaBand>
        )}
      </PageBody>

      {/* Nouvelle discussion */}
      {modal &&
        createPortal(
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => !posting && setModal(false)}>
          <form
            onSubmit={publish}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-post-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-violet-300/20 bg-[#1b0d38] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-center justify-between">
              <h2 id="new-post-title" className="text-xl font-bold text-white">
                Nouvelle discussion
              </h2>
              <button type="button" onClick={() => setModal(false)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-4 block text-sm font-medium text-white/85" htmlFor="post-title">
              Titre
            </label>
            <input
              id="post-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              maxLength={150}
              required
              placeholder="Ta question ou ton sujet"
              className={cn(FIELD, "mt-1.5 h-12")}
            />

            <p className="mt-4 text-sm font-medium text-white/85">Thème</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CATEGORIES.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: value }))}
                  aria-pressed={form.category === value}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm transition",
                    form.category === value ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 font-semibold text-white" : "border border-violet-300/25 text-white/80 hover:border-fuchsia-300/60"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium text-white/85" htmlFor="post-content">
              Message
            </label>
            <textarea
              id="post-content"
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              maxLength={2000}
              required
              rows={5}
              placeholder="Raconte, demande, partage…"
              className={cn(FIELD, "mt-1.5 resize-none py-3")}
            />
            <p className="mt-1 text-right text-xs text-white/45">{form.content.length}/2000</p>

            {postError && <p className="mt-2 rounded-xl border border-red-300/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">{postError}</p>}

            <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setModal(false)} className={BAND_GHOST}>
                Annuler
              </button>
              <button type="submit" disabled={posting || !form.title.trim() || !form.content.trim()} className={cn(BAND_PRIMARY, "disabled:opacity-50")}>
                {posting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Publier
              </button>
            </div>
          </form>
        </div>,
          document.body
        )}
    </SiteShell>
  );
}
