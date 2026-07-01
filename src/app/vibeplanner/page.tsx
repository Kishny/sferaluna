// src/app/vibeplanner/page.tsx

"use client";

/**
 * Page VibePlanner SferaLuna — version fonctionnelle.
 *
 * Branchée sur :
 * - GET  /api/matches       → liste des matchs actifs (pour choisir avec qui)
 * - GET  /api/vibeplanner   → toutes mes propositions (tous matchs confondus)
 * - POST /api/vibeplanner   → proposer une idée de rendez-vous
 * - PATCH /api/vibeplanner  → accepter / refuser (réservé à l'autre personne)
 *
 * Style premium sombre cohérent avec le reste du site, mobile-first.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  CalendarClock,
  Check,
  Clock,
  Heart,
  Loader2,
  Plus,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MatchUser {
  _id: string;
  pseudonyme: string;
  image?: string;
  age?: number;
  localisation?: string;
}

interface MatchItem {
  matchId: string;
  user: MatchUser | null;
}

interface PlanUser {
  _id: string;
  pseudonyme: string;
  image?: string;
}

type PlanStatus = "pending" | "accepted" | "rejected";

interface Plan {
  _id: string;
  matchId: string | { _id: string };
  proposedById: PlanUser;
  title: string;
  description: string;
  category: string;
  emoji: string;
  scheduledAt?: string | null;
  status: PlanStatus;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Catégories
// ─────────────────────────────────────────────

const CATEGORIES = [
  { key: "cafe", label: "Café", emoji: "☕" },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️" },
  { key: "balade", label: "Balade", emoji: "🌿" },
  { key: "culture", label: "Culture", emoji: "🎨" },
  { key: "appel-video", label: "Appel vidéo", emoji: "📹" },
  { key: "autre", label: "Autre", emoji: "✨" },
];

const categoryLabel = (key: string) =>
  CATEGORIES.find((c) => c.key === key)?.label || key;

const statusMeta: Record<
  PlanStatus,
  { label: string; style: string }
> = {
  pending: {
    label: "En attente",
    style: "border-amber-300/30 bg-amber-400/10 text-amber-200",
  },
  accepted: {
    label: "Accepté",
    style: "border-emerald-300/30 bg-emerald-400/10 text-emerald-200",
  },
  rejected: {
    label: "Refusé",
    style: "border-rose-300/30 bg-rose-400/10 text-rose-200",
  },
};

function matchIdOf(plan: Plan): string {
  return typeof plan.matchId === "string" ? plan.matchId : plan.matchId._id;
}

function formatSchedule(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return d.toLocaleString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function VibePlannerPage() {
  const { status } = useSession();
  const router = useRouter();

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Formulaire de proposition
  const [showForm, setShowForm] = useState(false);
  const [formMatchId, setFormMatchId] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIES[0].key);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth?mode=login");
  }, [status, router]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mRes, pRes] = await Promise.all([
        fetch("/api/matches", { cache: "no-store" }),
        fetch("/api/vibeplanner", { cache: "no-store" }),
      ]);
      const mData = await mRes.json();
      const pData = await pRes.json();

      if (mData.success) setMatches(mData.matches ?? []);
      if (pData.success) setPlans(pData.plans ?? []);
      if (!mData.success && !pData.success) {
        setError("Impossible de charger tes données.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status, load]);

  // Map matchId → autre personne (pour l'affichage et la logique de réponse).
  const otherByMatch = useMemo(() => {
    const map = new Map<string, MatchUser | null>();
    for (const m of matches) map.set(m.matchId, m.user);
    return map;
  }, [matches]);

  const openForm = () => {
    setFormMatchId(matches[0]?.matchId ?? "");
    setFormCategory(CATEGORIES[0].key);
    setFormTitle("");
    setFormDescription("");
    setFormDate("");
    setError("");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formMatchId) {
      setError("Choisis un match.");
      return;
    }
    if (formTitle.trim().length < 2 || formDescription.trim().length < 2) {
      setError("Titre et description sont requis.");
      return;
    }

    setSubmitting(true);
    setError("");

    const emoji =
      CATEGORIES.find((c) => c.key === formCategory)?.emoji || "✨";

    try {
      const res = await fetch("/api/vibeplanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: formMatchId,
          title: formTitle.trim(),
          description: formDescription.trim(),
          category: formCategory,
          emoji,
          scheduledAt: formDate ? new Date(formDate).toISOString() : null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        load();
      } else {
        setError(data.error || "Échec de l'envoi.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (planId: string, next: "accepted" | "rejected") => {
    setActionId(planId + next);
    try {
      const res = await fetch("/api/vibeplanner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, status: next }),
      });
      const data = await res.json();
      if (data.success) {
        setPlans((prev) =>
          prev.map((p) => (p._id === planId ? { ...p, status: next } : p))
        );
      } else {
        setError(data.error || "Action impossible.");
      }
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setActionId(null);
    }
  };

  // Loading / non connecté
  if (status === "loading" || status === "unauthenticated") {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-[#0d0a1e] via-[#1a0b2e] to-[#2d1b69] text-white">
          <Header />
          <main className="flex min-h-screen items-center justify-center px-4">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/10 backdrop-blur">
                <Loader2 className="h-8 w-8 animate-spin text-purple-200" />
              </div>
              <p className="text-sm text-white/60">Chargement…</p>
            </div>
          </main>
        </div>
        <div className="hidden sm:block">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0d0a1e] via-[#1a0b2e] to-[#2d1b69] text-white">
        <Header />

        <main className="relative z-10 mx-auto max-w-4xl px-4 pb-10 pt-20 sm:px-6 sm:pb-16 sm:pt-28">
          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:p-8"
          >
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-200">
                <Sparkles className="h-3.5 w-3.5" />
                VibePlanner
              </div>
              <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
                Planifie tes rendez-vous
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
                Propose une idée d&apos;activité à tes matchs. La personne reçoit
                ta proposition et peut l&apos;accepter ou la refuser.
              </p>
            </div>

            {matches.length > 0 && (
              <button
                onClick={openForm}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-pink-500"
              >
                <Plus className="h-4 w-4" />
                Proposer une idée
              </button>
            )}
          </motion.section>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError("")}>✕</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contenu */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-purple-200" />
            </div>
          ) : matches.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/6 p-10 text-center backdrop-blur">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
                💜
              </div>
              <h2 className="mb-2 text-lg font-bold">Aucun match pour l&apos;instant</h2>
              <p className="mx-auto mb-5 max-w-md text-sm text-white/55">
                Le VibePlanner s&apos;active dès que tu as un match. Va découvrir
                des profils pour commencer.
              </p>
              <Link
                href="/explorer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500"
              >
                Découvrir des profils
                <Users className="h-4 w-4" />
              </Link>
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/6 p-10 text-center backdrop-blur">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
                🗓️
              </div>
              <h2 className="mb-2 text-lg font-bold">Aucune proposition</h2>
              <p className="mx-auto mb-5 max-w-md text-sm text-white/55">
                Lance-toi : propose une première idée de rendez-vous à l&apos;un de
                tes matchs.
              </p>
              <button
                onClick={openForm}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500"
              >
                <Plus className="h-4 w-4" />
                Proposer une idée
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => {
                const other = otherByMatch.get(matchIdOf(plan)) ?? null;
                const proposedByOther =
                  !!other && plan.proposedById?._id === other._id;
                const partnerName = other?.pseudonyme ?? "Ton match";
                const schedule = formatSchedule(plan.scheduledAt);
                const meta = statusMeta[plan.status];

                return (
                  <motion.article
                    key={plan._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                        {plan.emoji}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-white">{plan.title}</h3>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.style}`}
                          >
                            {meta.label}
                          </span>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/50">
                            {categoryLabel(plan.category)}
                          </span>
                        </div>

                        <p className="mt-1 text-sm leading-relaxed text-white/60">
                          {plan.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/40">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="h-3 w-3 text-pink-400" />
                            {proposedByOther
                              ? `${partnerName} te propose`
                              : `Proposé à ${partnerName}`}
                          </span>
                          {schedule && (
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="h-3 w-3" />
                              {schedule}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {plan.status === "pending" && proposedByOther && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => handleRespond(plan._id, "accepted")}
                              disabled={actionId === plan._id + "accepted"}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-50"
                            >
                              {actionId === plan._id + "accepted" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Accepter
                            </button>
                            <button
                              onClick={() => handleRespond(plan._id, "rejected")}
                              disabled={actionId === plan._id + "rejected"}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:bg-white/10 disabled:opacity-50"
                            >
                              {actionId === plan._id + "rejected" ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <X className="h-3.5 w-3.5" />
                              )}
                              Refuser
                            </button>
                          </div>
                        )}

                        {plan.status === "pending" && !proposedByOther && (
                          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-white/35">
                            <Clock className="h-3 w-3" />
                            En attente de la réponse de {partnerName}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal de proposition */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => !submitting && setShowForm(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-[#160a2e] p-5 shadow-2xl sm:rounded-3xl sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Proposer une idée</h2>
                <button
                  onClick={() => !submitting && setShowForm(false)}
                  className="rounded-lg p-1 text-white/50 transition hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Match */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    Avec qui ?
                  </label>
                  <select
                    value={formMatchId}
                    onChange={(e) => setFormMatchId(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#241447] px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    {matches.map((m) => (
                      <option key={m.matchId} value={m.matchId}>
                        {m.user?.pseudonyme ?? "Match"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Catégorie */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    Type d&apos;activité
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setFormCategory(c.key)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                          formCategory === c.key
                            ? "border-purple-400/50 bg-purple-500/20 text-white"
                            : "border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
                        }`}
                      >
                        <span>{c.emoji}</span>
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Titre */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    Titre
                  </label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    maxLength={100}
                    placeholder="Un café près du canal ?"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    Description
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Ce que tu proposes, l'ambiance, le lieu…"
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-white/30 focus:border-purple-400/50 focus:outline-none"
                  />
                </div>

                {/* Date optionnelle */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/60">
                    Date proposée{" "}
                    <span className="text-white/30">(optionnel)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-purple-400/50 focus:outline-none [color-scheme:dark]"
                  />
                </div>

                {error && <p className="text-xs text-rose-300">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-purple-500 hover:to-pink-500 disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Envoyer la proposition
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden sm:block">
        <Footer />
      </div>
    </>
  );
}
