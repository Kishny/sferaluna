"use client";

import { useMemo, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

import TestimonialCard, { PublicTestimonial } from "./TestimonialCard";

type SortKey = "recent" | "rating";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Plus récents" },
  { key: "rating", label: "Mieux notés" },
];

/**
 * Explorateur de témoignages (page /temoignages).
 *
 * - Tri : plus récents / mieux notés.
 * - Pagination progressive via « Charger plus » (par paquets de `pageSize`).
 *
 * Reçoit la liste complète (rendue côté serveur pour le SEO) et gère
 * l'affichage côté client.
 */
export default function TestimonialsExplorer({ testimonials, pageSize = 12 }: { testimonials: PublicTestimonial[]; pageSize?: number }) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [visible, setVisible] = useState(pageSize);

  const sorted = useMemo(() => {
    const byRecent = (a: PublicTestimonial, b: PublicTestimonial) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

    const byRating = (a: PublicTestimonial, b: PublicTestimonial) => {
      const diff = (b.rating || 0) - (a.rating || 0);
      return diff !== 0 ? diff : byRecent(a, b);
    };

    const compare = sort === "rating" ? byRating : byRecent;

    // Les témoignages "À la une" restent toujours en tête, puis on applique
    // le tri choisi à l'intérieur de chaque groupe.
    return [...testimonials].sort((a, b) => {
      const fa = a.featured ? 1 : 0;
      const fb = b.featured ? 1 : 0;
      if (fa !== fb) return fb - fa;
      return compare(a, b);
    });
  }, [testimonials, sort]);

  const shown = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <Heart className="mt-0.5 h-6 w-6 shrink-0 fill-fuchsia-400 text-fuchsia-400" />
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Témoignages des membres</h2>
            <p className="mt-0.5 text-sm text-white/65">Des expériences authentiques partagées par les femmes de SferaLuna.</p>
          </div>
        </div>

        {sorted.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Trier par</span>
            {SORTS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setSort(option.key);
                  setVisible(pageSize);
                }}
                className={`h-10 rounded-full px-4 text-sm font-medium transition ${
                  sort === option.key
                    ? "bg-gradient-to-r from-fuchsia-500 to-violet-600 text-white shadow-lg ring-1 ring-fuchsia-300/40"
                    : "border border-violet-300/30 text-white/85 hover:border-fuchsia-300/60"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {shown.map((testimonial) => (
          <TestimonialCard key={testimonial._id} testimonial={testimonial} />
        ))}

        {/* Tant que la page est peu remplie : invitation, jamais de faux avis. */}
        {(sorted.length === 0 || sorted.length === 1 || sorted.length === 3) && (
          <div className={`flex min-h-[200px] flex-col items-center justify-center rounded-3xl border border-dashed border-violet-300/25 p-6 text-center ${sorted.length === 0 ? "lg:col-span-2" : ""}`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20">
              <MessageCircle className="h-6 w-6 text-fuchsia-200" />
            </span>
            <p className="mt-4 text-lg font-semibold text-white">{sorted.length === 0 ? "Les premiers témoignages arrivent bientôt 💜" : "Bientôt plus de témoignages 💜"}</p>
            <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/60">
              {sorted.length === 0 ? "Sois parmi les premières à partager ton expérience." : "D’autres membres partagent bientôt leur expérience. Reviens découvrir leurs témoignages."}
            </p>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + pageSize)}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-violet-300/30 px-6 text-sm font-semibold text-white transition hover:border-fuchsia-300/60 hover:bg-fuchsia-500/10"
          >
            Charger plus
            <span className="text-xs opacity-70">
              ({sorted.length - visible} restant{sorted.length - visible > 1 ? "s" : ""})
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
