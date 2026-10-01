// src/app/vibeplanner/page.tsx

"use client";

/**
 * VibePlanner — proposer une idée de rendez-vous à un match.
 *
 * Données : GET /api/matches + GET /api/vibeplanner.
 * Actions : POST /api/vibeplanner (proposer), PATCH (accepter / refuser).
 * /vibeplanner?match=<matchId> ouvre directement le formulaire pour ce match.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownUp,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Hourglass,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { ExplorerShell, ProfilePhoto } from "@/components/explorer/shared";
import {
  ActiveBadge,
  BTN_GHOST,
  BTN_PRIMARY,
  EmptyState,
  ErrorBanner,
  Eyebrow,
  GradientText,
  LoadingBlock,
  PANEL,
  SelectPill,
  capitalize,
  longDate,
} from "@/components/app/kit";
import { SceneArt, type SceneVariant } from "@/components/site/art";
import { cn } from "@/components/site/ui";

interface MatchUser {
  _id: string;
  pseudonyme: string;
  image?: string;
  age?: number;
  localisation?: string;
  recentlyActive?: boolean;
}

interface MatchItem {
  matchId: string;
  user: MatchUser | null;
}

type PlanStatus = "pending" | "accepted" | "rejected";

interface Plan {
  _id: string;
  matchId: string | { _id: string };
  proposedById: { _id: string; pseudonyme: string; image?: string };
  title: string;
  description: string;
  category: string;
  emoji: string;
  scheduledAt?: string | null;
  location?: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt?: string;
}

const CATEGORIES = [
  { key: "cafe", label: "Café", emoji: "☕" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { key: "balade", label: "Balade", emoji: "🌿" },
  { key: "culture", label: "Culture", emoji: "🎨" },
  { key: "appel-video", label: "Appel vidéo", emoji: "📹" },
  { key: "autre", label: "Autre", emoji: "✨" },
];

const IDEAS: { title: string; description: string; category: string; tag: string; scene: SceneVariant }[] = [
  { title: "Café & discussion", description: "Un café dans un endroit calme pour apprendre à mieux se connaître.", category: "cafe", tag: "Détente", scene: "rooftop" },
  { title: "Balade au coucher du soleil", description: "Une petite marche tranquille pour profiter de la lumière du soir.", category: "balade", tag: "Nature", scene: "hills" },
  { title: "Soirée cinéma", description: "Un bon film, puis on en parle autour d’un verre.", category: "culture", tag: "Culture", scene: "night" },
  { title: "Apéro avec vue", description: "Un verre en terrasse avec une jolie vue sur la ville.", category: "restaurant", tag: "Sortie", scene: "dusk" },
  { title: "Visite de musée", description: "Une expo à découvrir ensemble, et plein de choses à se raconter.", category: "culture", tag: "Culture", scene: "river" },
];

const STATUS: Record<PlanStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "En attente", cls: "border-amber-300/35 bg-amber-400/10 text-amber-200", icon: Clock },
  accepted: { label: "Acceptée", cls: "border-emerald-300/35 bg-emerald-400/10 text-emerald-200", icon: Check },
  rejected: { label: "Déclinée", cls: "border-rose-300/35 bg-rose-400/10 text-rose-200", icon: X },
};

const matchIdOf = (plan: Plan) => (typeof plan.matchId === "string" ? plan.matchId : plan.matchId?._id);

function when(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return {
    day: capitalize(d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" })),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h"),
  };
}

type FormState = {
  matchId: string;
  category: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
};

const EMPTY_FORM: FormState = { matchId: "", category: "cafe", title: "", description: "", date: "", time: "", location: "" };

function PlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<"recent" | "date">("recent");
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/matches", { cache: "no-store" }),
        fetch("/api/vibeplanner", { cache: "no-store" }),
      ]);
      if (mRes.status === 401 || pRes.status === 401) {
        router.replace("/auth?mode=login&callbackUrl=%2Fvibeplanner");
        return;
      }
      const mData = await mRes.json().catch(() => null);
      const pData = await pRes.json().catch(() => null);
      if (mData?.success) setMatches((mData.matches ?? []).filter((m: MatchItem) => m.user));
      if (pData?.success) setPlans(pData.plans ?? []);
      if (!mData?.success && !pData?.success) setError("Impossible de charger vos rendez-vous.");
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // /vibeplanner?match=<id> : ouvre directement le formulaire pour ce match.
  const preselect = searchParams.get("match");
  useEffect(() => {
    if (!loading && preselect && matches.some((m) => m.matchId === preselect)) {
      setForm({ ...EMPTY_FORM, matchId: preselect });
    }
  }, [loading, preselect, matches]);

  const otherByMatch = useMemo(() => new Map(matches.map((m) => [m.matchId, m.user])), [matches]);

  const { received, sent } = useMemo(() => {
    const withOther = plans
      .map((plan) => {
        const other = otherByMatch.get(matchIdOf(plan)) ?? null;
        return { plan, other, fromOther: !!other && plan.proposedById?._id === other._id };
      })
      .filter((x) => x.other);
    const order = (a: { plan: Plan }, b: { plan: Plan }) => {
      if (sort === "date") {
        const da = a.plan.scheduledAt ? new Date(a.plan.scheduledAt).getTime() : Infinity;
        const db = b.plan.scheduledAt ? new Date(b.plan.scheduledAt).getTime() : Infinity;
        return da - db;
      }
      return new Date(b.plan.createdAt).getTime() - new Date(a.plan.createdAt).getTime();
    };
    const rec = withOther.filter((x) => x.fromOther).sort(order);
    // Les propositions à confirmer passent en premier.
    rec.sort((a, b) => Number(b.plan.status === "pending") - Number(a.plan.status === "pending"));
    return { received: rec, sent: withOther.filter((x) => !x.fromOther).sort(order) };
  }, [plans, otherByMatch, sort]);

  const openForm = (preset?: Partial<FormState>) => {
    setFormError("");
    setForm({ ...EMPTY_FORM, matchId: matches[0]?.matchId ?? "", ...preset });
  };

  const submit = async () => {
    if (!form) return;
    if (!form.matchId) return setFormError("Choisissez le match à qui proposer ce rendez-vous.");
    if (form.title.trim().length < 2 || form.description.trim().length < 2) return setFormError("Ajoutez un titre et quelques mots de description.");
    let scheduledAt: string | null = null;
    if (form.date) {
      const d = new Date(`${form.date}T${form.time || "19:00"}`);
      if (Number.isNaN(d.getTime())) return setFormError("Date invalide.");
      scheduledAt = d.toISOString();
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await fetch("/api/vibeplanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: form.matchId,
          title: form.title.trim(),
          description: form.description.trim(),
          category: form.category,
          emoji: CATEGORIES.find((c) => c.key === form.category)?.emoji || "✨",
          scheduledAt,
          location: form.location.trim(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setFormError(data?.error || "Envoi impossible pour le moment.");
        return;
      }
      setForm(null);
      if (preselect) router.replace("/vibeplanner", { scroll: false });
      load();
    } catch {
      setFormError("Connexion au serveur impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  const respond = async (planId: string, status: "accepted" | "rejected") => {
    setActionId(planId + status);
    try {
      const res = await fetch("/api/vibeplanner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Action impossible.");
        return;
      }
      setPlans((prev) => prev.map((p) => (p._id === planId ? { ...p, status } : p)));
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setActionId(null);
    }
  };

  const pendingReceived = received.filter((x) => x.plan.status === "pending").length;

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <BackButton fallbackHref="/mon-compte" fallbackLabel="Retour au tableau de bord" />
        {/* ── En-tête ── */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 pt-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-center">
          <div>
            <Eyebrow icon={Sparkles}>VibePlanner</Eyebrow>
            <h1 className="mt-4 text-[34px] font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Planifiez vos <GradientText>rendez-vous</GradientText>
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75">
              Proposez une idée d’activité à vos matchs. La personne reçoit votre proposition et peut l’accepter ou la décliner. Les belles rencontres commencent par une belle idée 💜
            </p>
            <button type="button" onClick={() => openForm()} disabled={loading || matches.length === 0} className={cn(BTN_PRIMARY, "mt-6 h-[52px] px-7 text-base")}>
              <Plus className="h-5 w-5" /> Proposer une idée
            </button>
          </div>
          <div className={cn(PANEL, "space-y-4 p-5")}>
            {[
              { icon: CalendarDays, title: "Des idées pour tous les styles", text: "Nature, culture, sorties, visio…" },
              { icon: Heart, title: "Proposez en toute simplicité", text: "Votre match peut accepter ou décliner." },
              { icon: Sparkles, title: "Des moments qui comptent", text: "Passez du chat à la vraie vie." },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/25 bg-fuchsia-500/10">
                  <f.icon className="h-5 w-5 text-fuchsia-200" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-sm text-white/65">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorBanner message={error} onClose={() => setError("")} onRetry={load} />
          </div>
        )}

        {loading ? (
          <LoadingBlock label="Chargement de vos rendez-vous…" />
        ) : matches.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              icon={Heart}
              title="Il vous faut d’abord un match"
              text="VibePlanner permet de proposer un rendez-vous à une personne avec qui vous avez matché."
              action={
                <Link href="/explorer" className={cn(BTN_PRIMARY, "h-12")}>
                  <Sparkles className="h-4 w-4" /> Voir mes découvertes
                </Link>
              }
            />
          </div>
        ) : (
          <>
            {received.length > 0 && (
              <Section
                icon={<Hourglass className="h-6 w-6 text-amber-300" />}
                title="Propositions reçues"
                count={received.length}
                subtitle={pendingReceived > 0 ? `${pendingReceived} proposition${pendingReceived > 1 ? "s" : ""} attend${pendingReceived > 1 ? "ent" : ""} votre réponse.` : "Les idées que vos matchs vous ont proposées."}
                right={<SortSelect sort={sort} setSort={setSort} />}
              >
                {received.map(({ plan, other }) => (
                  <PlanRow key={plan._id} plan={plan} other={other!} received>
                    {plan.status === "pending" ? (
                      <>
                        <button type="button" onClick={() => respond(plan._id, "accepted")} disabled={!!actionId} className={cn(BTN_PRIMARY, "h-11 px-4 text-sm")}>
                          {actionId === plan._id + "accepted" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accepter
                        </button>
                        <button type="button" onClick={() => respond(plan._id, "rejected")} disabled={!!actionId} className={cn(BTN_GHOST, "h-11 px-4 text-sm")}>
                          {actionId === plan._id + "rejected" ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Décliner
                        </button>
                      </>
                    ) : (
                      <Link href={`/messages/${matchIdOf(plan)}`} className={cn(BTN_GHOST, "h-11 px-4 text-sm")}>
                        <MessageCircle className="h-4 w-4" /> Écrire
                      </Link>
                    )}
                  </PlanRow>
                ))}
              </Section>
            )}

            <Section
              icon={<Send className="h-6 w-6 text-fuchsia-300" />}
              title="Propositions envoyées"
              count={sent.length}
              subtitle="Retrouvez ici les idées que vous avez proposées à vos matchs."
              right={received.length === 0 ? <SortSelect sort={sort} setSort={setSort} /> : undefined}
            >
              {sent.length === 0 ? (
                <p className={cn(PANEL, "px-6 py-8 text-center text-sm text-white/65")}>
                  Vous n’avez encore rien proposé. Inspirez-vous des idées ci-dessous !
                </p>
              ) : (
                sent.map(({ plan, other }) => (
                  <PlanRow key={plan._id} plan={plan} other={other!}>
                    {plan.status === "accepted" ? (
                      <Link href={`/messages/${matchIdOf(plan)}`} className={cn(BTN_PRIMARY, "h-11 px-4 text-sm")}>
                        <MessageCircle className="h-4 w-4" /> Écrire
                      </Link>
                    ) : (
                      <Link href={`/explorer/profil/${other!._id}?from=matches`} className={cn(BTN_GHOST, "h-11 px-4 text-sm")}>
                        <UserRound className="h-4 w-4" /> Voir le profil
                      </Link>
                    )}
                  </PlanRow>
                ))
              )}
            </Section>

            {/* ── Idées ── */}
            <section className="mt-10">
              <div className="flex items-start gap-3">
                <Lightbulb className="mt-1 h-6 w-6 shrink-0 text-amber-300" />
                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">Idées inspirantes</h2>
                  <p className="text-sm text-white/65">Besoin d’inspiration ? Choisissez une idée, elle pré-remplit votre proposition.</p>
                </div>
              </div>
              <div className="-mx-4 mt-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
                {IDEAS.map((idea, i) => (
                  <button
                    key={idea.title}
                    type="button"
                    onClick={() => openForm({ category: idea.category, title: idea.title, description: idea.description })}
                    className="group relative h-40 w-56 shrink-0 overflow-hidden rounded-2xl border border-violet-300/20 text-left sm:w-auto"
                  >
                    <SceneArt variant={idea.scene} seed={i + 11} className="absolute inset-0 transition duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#12081f] via-[#12081f]/70 to-transparent" />
                    <span className="absolute right-3 top-3 text-3xl" aria-hidden>
                      {CATEGORIES.find((c) => c.key === idea.category)?.emoji}
                    </span>
                    <span className="absolute bottom-3 left-3 right-3">
                      <span className="block text-sm font-semibold text-white">{idea.title}</span>
                      <span className="text-xs text-white/70">{idea.tag}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      <ProposalModal
        form={form}
        setForm={setForm}
        matches={matches}
        error={formError}
        submitting={submitting}
        onSubmit={submit}
        onClose={() => {
          setForm(null);
          if (preselect) router.replace("/vibeplanner", { scroll: false });
        }}
      />
    </ExplorerShell>
  );
}

function SortSelect({ sort, setSort }: { sort: "recent" | "date"; setSort: (s: "recent" | "date") => void }) {
  return (
    <SelectPill
      value={sort}
      onChange={setSort}
      icon={ArrowDownUp}
      label="Trier"
      options={[
        { value: "recent", label: "Les plus récentes" },
        { value: "date", label: "Date du rendez-vous" },
      ]}
    />
  );
}

function Section({
  icon,
  title,
  count,
  subtitle,
  right,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  subtitle: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-1 shrink-0">{icon}</span>
          <div>
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-white sm:text-2xl">
              {title}
              <span className="rounded-full border border-violet-300/30 px-2.5 py-0.5 text-sm font-medium text-white/80">{count}</span>
            </h2>
            <p className="text-sm text-white/65">{subtitle}</p>
          </div>
        </div>
        {right}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function PlanRow({ plan, other, received = false, children }: { plan: Plan; other: MatchUser; received?: boolean; children: React.ReactNode }) {
  const w = when(plan.scheduledAt);
  const st = STATUS[plan.status] ?? STATUS.pending;
  const StIcon = st.icon;
  const statusLabel = received && plan.status === "pending" ? "À confirmer" : st.label;

  return (
    <motion.article initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn(PANEL, "p-4")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex min-w-0 flex-1 gap-4">
          <Link href={`/explorer/profil/${other._id}?from=matches`} className="shrink-0">
            <span className="block h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-violet-300/25 sm:h-24 sm:w-24 [&_span]:!text-3xl">
              <ProfilePhoto src={other.image} name={other.pseudonyme} className="h-full w-full" />
            </span>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-bold text-white">
                {other.pseudonyme}
                {other.age ? `, ${other.age}` : ""}
              </p>
              <ActiveBadge active={other.recentlyActive} />
            </div>
            <p className="mt-0.5 font-semibold text-white">
              <span aria-hidden>{plan.emoji}</span> {plan.title}
            </p>
            <p className="line-clamp-2 text-sm text-white/70">{plan.description}</p>
            {(w || plan.location) && (
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/85">
                {w && (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 px-2.5 py-1">
                      <CalendarDays className="h-3.5 w-3.5 text-fuchsia-300" /> {w.day}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5 text-fuchsia-300" /> {w.time}
                    </span>
                  </>
                )}
                {plan.location && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/25 px-2.5 py-1">
                    <MapPin className="h-3.5 w-3.5 text-fuchsia-300" /> {plan.location}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 md:flex-nowrap">
          <div className="text-left md:text-center">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium", st.cls)}>
              <StIcon className="h-4 w-4" /> {statusLabel}
            </span>
            <p className="mt-1 text-xs text-white/55">
              {received ? "Reçue" : "Envoyée"} le {longDate(plan.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">{children}</div>
        </div>
      </div>
    </motion.article>
  );
}

function ProposalModal({
  form,
  setForm,
  matches,
  error,
  submitting,
  onSubmit,
  onClose,
}: {
  form: FormState | null;
  setForm: (f: FormState) => void;
  matches: MatchItem[];
  error: string;
  submitting: boolean;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const field =
    "h-12 w-full rounded-xl border border-violet-300/25 bg-[#12081f]/70 px-4 text-sm text-white placeholder-white/40 focus:border-fuchsia-300/60 focus:outline-none [color-scheme:dark]";

  return (
    <AnimatePresence>
      {form && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Proposer un rendez-vous"
            className={cn(PANEL, "max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-b-none p-5 sm:rounded-3xl sm:p-6")}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Proposer une idée</h2>
              <button type="button" onClick={onClose} aria-label="Fermer" className="rounded-full p-2 text-white/70 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-sm text-white/75">À qui ?</span>
                <select value={form.matchId} onChange={(e) => setForm({ ...form, matchId: e.target.value })} className={cn(field, "[&>option]:bg-[#1b0d38]")}>
                  {matches.map((m) => (
                    <option key={m.matchId} value={m.matchId}>
                      {m.user?.pseudonyme}
                      {m.user?.age ? `, ${m.user.age}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="mb-1.5 block text-sm text-white/75">Type d’activité</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setForm({ ...form, category: c.key })}
                      aria-pressed={form.category === c.key}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm transition",
                        form.category === c.key ? "border-fuchsia-300/70 bg-fuchsia-500/25 text-white" : "border-violet-300/25 text-white/80 hover:border-fuchsia-300/50"
                      )}
                    >
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm text-white/75">Titre</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} placeholder="Café & bonne discussion" className={field} />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm text-white/75">Quelques mots</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                  rows={3}
                  placeholder="Un café dans un endroit sympa pour apprendre à mieux se connaître ☕"
                  className={cn(field, "h-auto resize-none py-3")}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-sm text-white/75">Date (facultatif)</span>
                  <input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={field} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-white/75">Heure</span>
                  <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} disabled={!form.date} className={cn(field, "disabled:opacity-50")} />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm text-white/75">Lieu (facultatif)</span>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} maxLength={120} placeholder="Café de la Lune, Lyon" className={field} />
              </label>

              <p className="rounded-xl border border-violet-300/15 bg-white/[0.03] px-3 py-2 text-xs text-white/60">
                Pour un premier rendez-vous, privilégiez toujours un lieu public et prévenez une personne de confiance.
              </p>

              {error && <p className="text-sm text-rose-300">{error}</p>}

              <button type="button" onClick={onSubmit} disabled={submitting} className={cn(BTN_PRIMARY, "h-12 w-full")}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Envoyer la proposition
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function VibePlannerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <PlannerContent />
    </Suspense>
  );
}
