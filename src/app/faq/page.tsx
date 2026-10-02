// src/app/faq/page.tsx

"use client";

/**
 * FAQ : recherche, filtres par thème, questions populaires et liste complète.
 * Les réponses décrivent le fonctionnement réel du site (offres, chemins
 * dans Mon compte) : les tenir à jour quand une fonctionnalité change.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Clock,
  Crown,
  Headphones,
  Heart,
  HelpCircle,
  Mail,
  MessagesSquare,
  Search,
  ShieldCheck,
  Star,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { SiteShell } from "@/components/site/sections";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PANEL, PageBody, PageHero, Pink, SectionTitle, TILE } from "@/components/site/pagekit";
import { BADGE, FAQS, type CategoryId } from "@/components/site/faq";
import { cn } from "@/components/site/ui";

const CATEGORIES: { id: CategoryId | "all"; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "Tout", icon: MessagesSquare },
  { id: "security", label: "Sécurité", icon: ShieldCheck },
  { id: "account", label: "Compte", icon: User },
  { id: "matching", label: "Rencontres", icon: Heart },
  { id: "premium", label: "Premium", icon: Crown },
];

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export default function FAQPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [open, setOpen] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const results = useMemo(() => {
    const q = normalize(query.trim());
    return FAQS.filter((f) => (category === "all" || f.category === category) && (!q || normalize(f.question).includes(q) || normalize(f.answer).includes(q)));
  }, [query, category]);

  const showPopular = !query.trim() && category === "all";

  /** Ouvre une question dans la liste et y fait défiler la page. */
  const reveal = (id: string) => {
    setOpen((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => document.getElementById(`faq-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PageHero
          id="faq"
          pill="Centre d’aide"
          pillIcon={HelpCircle}
          title={
            <>
              FAQ <Pink>SferaLuna</Pink>
            </>
          }
          text="Trouve rapidement les réponses à tes questions."
          note={
            <>
              Des réponses
              <br />
              pour avancer sereinement ♡
            </>
          }
        >
          {/* Recherche */}
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById("faq-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="mt-6 flex h-14 items-center gap-2 rounded-2xl border border-fuchsia-300/40 bg-[#1b0d38]/85 pl-4 pr-1.5 backdrop-blur-xl focus-within:border-fuchsia-300/80"
          >
            <Search className="h-5 w-5 shrink-0 text-white/70" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une question…"
              aria-label="Rechercher une question"
              className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-white shadow-none outline-none ring-0 placeholder:text-white/45 focus:border-0 focus:outline-none focus:ring-0"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Effacer la recherche" className="flex h-9 w-9 items-center justify-center rounded-full text-white/60 hover:bg-white/10 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
            <button type="submit" className="h-11 shrink-0 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 text-sm font-semibold text-white transition hover:brightness-110">
              Rechercher
            </button>
          </form>

          {/* Thèmes */}
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCategory(id)}
                aria-pressed={category === id}
                className={cn(
                  "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-medium transition",
                  category === id
                    ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-[0_8px_24px_-8px_rgba(217,70,239,0.8)]"
                    : "border border-violet-300/25 bg-[#1b0d38]/70 text-white/85 backdrop-blur hover:border-fuchsia-300/60"
                )}
              >
                <Icon className={cn("h-4 w-4", id === "premium" && category !== id && "text-amber-300")} /> {label}
              </button>
            ))}
          </div>
        </PageHero>

        {/* Questions populaires */}
        {showPopular && (
          <>
            <SectionTitle className="!mt-10" icon={Star} tone="gold" title="Questions populaires" subtitle="Les réponses aux questions les plus fréquentes de notre communauté." />
            <div className="grid gap-3 lg:grid-cols-3">
              {FAQS.filter((f) => f.popular).map(({ id, icon: Icon, question, answer, category: cat }, i) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => reveal(id)}
                  className={cn(
                    PANEL,
                    "group flex items-start gap-4 bg-gradient-to-br from-[#2a1158]/80 to-[#1b0d38]/80 p-5 text-left transition hover:border-fuchsia-300/50",
                    i === 0 && "border-fuchsia-400/50"
                  )}
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/25 ring-1 ring-fuchsia-300/40">
                    <Icon className="h-6 w-6 text-fuchsia-200" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1", BADGE[cat].className)}>{BADGE[cat].label}</span>
                    <span className="mt-1.5 block font-semibold text-white">{question}</span>
                    <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/65">{answer}</span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-200/40 text-white transition group-hover:border-fuchsia-300/70 group-hover:bg-fuchsia-500/20">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Toutes les questions */}
        <div id="faq-list" className="!mt-10 grid scroll-mt-28 grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <div>
            <SectionTitle
              icon={MessagesSquare}
              title={showPopular ? "Toutes les questions" : `${results.length} résultat${results.length > 1 ? "s" : ""}`}
              subtitle={showPopular ? "Parcours nos réponses classées par thème." : "Questions correspondant à ta recherche."}
            />

            {results.length === 0 ? (
              <div className={cn(PANEL, "mt-4 p-8 text-center")}>
                <p className="font-semibold text-white">Aucune question ne correspond.</p>
                <p className="mt-1 text-sm text-white/65">Essaie un autre mot, ou écris-nous directement.</p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                  className="mt-4 text-sm font-semibold text-pink-300 hover:underline"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)] items-start gap-2.5 md:grid-cols-2">
                {[results.filter((_, i) => i % 2 === 0), results.filter((_, i) => i % 2 === 1)].map((column, c) => (
                  <div key={c} className="space-y-2.5">
                {column.map(({ id, icon: Icon, question, answer, category: cat }) => {
                  const isOpen = open.has(id);
                  return (
                    <div key={id} id={`faq-${id}`} className={cn(TILE, "scroll-mt-28 transition", isOpen && "border-fuchsia-300/45")}>
                      <button type="button" onClick={() => toggle(id)} aria-expanded={isOpen} aria-controls={`faq-${id}-answer`} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                        <Icon className="h-5 w-5 shrink-0 text-fuchsia-300" />
                        <span className="min-w-0 flex-1 text-sm font-medium text-white">{question}</span>
                        <span className={cn("hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 sm:inline-block", BADGE[cat].className)}>{BADGE[cat].label}</span>
                        <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/70 transition-transform", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <p id={`faq-${id}-answer`} className="border-t border-white/10 px-4 py-3.5 text-sm leading-relaxed text-white/75">
                          {answer}
                        </p>
                      )}
                    </div>
                  );
                })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Besoin d'aide */}
          <aside className={cn(PANEL, "p-5")}>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/25">
                <Headphones className="h-6 w-6 text-fuchsia-200" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Besoin d’aide ?</h2>
                <p className="text-sm text-white/65">Notre équipe est là pour t’accompagner.</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3.5 text-sm text-white/85">
              <li className="flex items-center gap-3">
                <Clock className="h-5 w-5 shrink-0 text-fuchsia-300" /> Réponse sous 24 à 48 h
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-fuchsia-300" />
                <a href="mailto:contact@sferaluna.com" className="font-semibold hover:underline">
                  contact@sferaluna.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 text-fuchsia-300" />
                <Link href="/securite" className="hover:underline">
                  Sécurité et signalement
                </Link>
              </li>
            </ul>
            <Link href="/contact" className={cn(BAND_PRIMARY, "mt-5 w-full")}>
              Nous contacter <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/guide" className={cn(BAND_GHOST, "mt-2.5 w-full")}>
              <BookOpen className="h-5 w-5" /> Consulter le guide
            </Link>
          </aside>
        </div>

        <CtaBand className="!mt-8" title="Tu n’as pas trouvé ta réponse ?" text="Notre équipe est à ton écoute pour toute question ou demande spécifique.">
          <Link href="/contact" className={BAND_PRIMARY}>
            <Mail className="h-5 w-5" /> Contacter le support <ArrowRight className="h-4 w-4" />
          </Link>
        </CtaBand>
      </PageBody>
    </SiteShell>
  );
}
