"use client";

// src/components/insights/DailyInsight.tsx

/**
 * La connaissance du jour, côté membre.
 *
 * - useDailyInsight : lit /api/insights/today.
 * - DailyInsightBlock : la carte du tableau de bord, et la fenêtre qui présente
 *   la connaissance à la première visite de la journée (une seule fois par
 *   jour et par navigateur).
 * - InsightCard : l'affichage d'une connaissance, réutilisé sur la page dédiée.
 *
 * Tant que l'équipe n'a rien publié, rien ne s'affiche.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Feather, Globe2, Heart, Lightbulb, Sparkles, X, type LucideIcon } from "lucide-react";

import { cn } from "@/components/site/ui";

export type InsightCategory = "mot" | "sentiment" | "femme" | "monde" | "amour";

export interface Insight {
  id: string;
  category: InsightCategory;
  title: string;
  text: string;
}

export interface InsightOfDay {
  day: string;
  insight: Insight;
}

export const CATEGORY_META: Record<InsightCategory, { label: string; icon: LucideIcon; tone: string }> = {
  mot: { label: "Mot rare", icon: BookOpen, tone: "text-violet-200 ring-violet-300/40 bg-violet-500/15" },
  sentiment: { label: "Sentiment", icon: Feather, tone: "text-sky-200 ring-sky-300/40 bg-sky-500/15" },
  femme: { label: "Femme pionnière", icon: Sparkles, tone: "text-amber-200 ring-amber-300/40 bg-amber-500/15" },
  monde: { label: "Le monde", icon: Globe2, tone: "text-emerald-200 ring-emerald-300/40 bg-emerald-500/15" },
  amour: { label: "L’amour", icon: Heart, tone: "text-pink-200 ring-pink-300/40 bg-pink-500/15" },
};

export function useDailyInsight() {
  const [today, setToday] = useState<InsightOfDay | null>(null);
  const [previous, setPrevious] = useState<InsightOfDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/insights/today", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error("load");
      setToday(data.today ?? null);
      setPrevious(Array.isArray(data.previous) ? data.previous : []);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { today, previous, isLoading, error, reload: load };
}

export function CategoryBadge({ category }: { category: InsightCategory }) {
  const meta = CATEGORY_META[category] ?? CATEGORY_META.monde;
  const Icon = meta.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1", meta.tone)}>
      <Icon className="h-3.5 w-3.5" aria-hidden /> {meta.label}
    </span>
  );
}

/** Une connaissance : catégorie, titre, texte. `large` pour celle du jour. */
export function InsightCard({ insight, large = false, dateLabel }: { insight: Insight; large?: boolean; dateLabel?: string }) {
  return (
    <article>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryBadge category={insight.category} />
        {dateLabel && <span className="text-xs text-white/50">{dateLabel}</span>}
      </div>
      <h3 className={cn("mt-3 font-extrabold leading-tight tracking-tight text-white", large ? "text-3xl sm:text-4xl" : "text-xl")}>
        {insight.title}
      </h3>
      <p className={cn("mt-2 leading-relaxed text-white/80", large ? "text-base sm:text-lg" : "text-sm")}>{insight.text}</p>
    </article>
  );
}

const SEEN_KEY = "sfl-connaissance-vue";

/** A-t-elle déjà vu la fenêtre aujourd'hui ? Sans stockage disponible, on ne la montre pas. */
function alreadySeen(day: string): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === day;
  } catch {
    return true;
  }
}

function markSeen(day: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, day);
  } catch {
    /* stockage indisponible : sans conséquence */
  }
}

/** Carte du tableau de bord + fenêtre de la première visite du jour. */
export function DailyInsightBlock({ className }: { className?: string }) {
  const { today } = useDailyInsight();
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (today && !alreadySeen(today.day)) setOpen(true);
  }, [today]);

  const close = useCallback(() => {
    if (today) markSeen(today.day);
    setOpen(false);
  }, [today]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!today) return null;

  return (
    <>
      <section
        aria-label="La connaissance du jour"
        className={cn(
          "relative overflow-hidden rounded-3xl border border-fuchsia-300/25 bg-gradient-to-br from-[#241046]/90 via-[#1b0d38]/90 to-[#2a0f3d]/90 p-5 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] sm:p-6",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
            <Lightbulb className="h-4 w-4" aria-hidden /> La connaissance du jour
          </p>
          <Link
            href="/connaissance"
            className="inline-flex min-h-[44px] shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full px-3 text-sm font-medium text-white/80 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
          >
            Les précédentes <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-2">
          <InsightCard insight={today.insight} />
        </div>
      </section>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="relative w-full max-w-md rounded-3xl border border-fuchsia-300/30 bg-[#1a0d2e] p-6 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:p-7"
            >
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
              <p id={titleId} className="flex items-center gap-2 pr-10 text-xs font-semibold uppercase tracking-[0.14em] text-fuchsia-200/90">
                <Lightbulb className="h-4 w-4" aria-hidden /> La connaissance du jour
              </p>
              <div className="mt-4">
                <InsightCard insight={today.insight} large />
              </div>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Link
                  href="/connaissance"
                  onClick={close}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/85 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
                >
                  Voir les précédentes
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 px-6 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Merci, à demain
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
