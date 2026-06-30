"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import TestimonialCard, { PublicTestimonial } from "./TestimonialCard";

/**
 * Bloc de témoignages réutilisable (thème clair).
 *
 * - Desktop : grille de cartes (jusqu'à `limit`).
 * - Mobile : carrousel d'une carte avec navigation.
 *
 * Si `initialTestimonials` n'est pas fourni, le composant va les chercher
 * lui-même via GET /api/testimonials.
 */
export default function TestimonialsCarousel({
  initialTestimonials,
  limit = 3,
  ctaHref = "/temoignages",
  ctaLabel = "Voir tous les témoignages",
}: {
  initialTestimonials?: PublicTestimonial[];
  limit?: number;
  ctaHref?: string | null;
  ctaLabel?: string;
}) {
  const [testimonials, setTestimonials] = useState<PublicTestimonial[]>(
    initialTestimonials ?? []
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (initialTestimonials && initialTestimonials.length > 0) return;

    fetch("/api/testimonials")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setTestimonials(data.testimonials ?? []);
      })
      .catch(() => {});
  }, [initialTestimonials]);

  if (testimonials.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-[#E8E0FF] bg-white px-4 py-8 text-center">
        <div className="mb-3 text-4xl">💜</div>
        <p className="text-base font-semibold text-[#5B4B8A]">
          Les premiers témoignages arrivent bientôt
        </p>
        <p className="mt-1 text-sm text-[#666]">
          Sois parmi les premières à partager ton expérience.
        </p>
      </div>
    );
  }

  const gridItems = testimonials.slice(0, limit);
  const current = testimonials[idx % testimonials.length];

  return (
    <div>
      {/* Desktop : grille */}
      <div className="hidden gap-5 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {gridItems.map((testimonial) => (
          <TestimonialCard key={testimonial._id} testimonial={testimonial} />
        ))}
      </div>

      {/* Mobile : carrousel */}
      <div className="sm:hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current._id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <TestimonialCard testimonial={current} />
          </motion.div>
        </AnimatePresence>

        {testimonials.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                setIdx(
                  (i) => (i - 1 + testimonials.length) % testimonials.length
                )
              }
              className="rounded-full border border-[#E8E0FF] bg-white p-2 text-[#8E7AB5] transition-colors hover:border-[#8E7AB5]"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex gap-1.5">
              {testimonials.map((t, i) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === idx % testimonials.length
                      ? "w-5 bg-[#8E7AB5]"
                      : "w-2 bg-[#D9B8FF]"
                  }`}
                  aria-label={`Voir le témoignage ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIdx((i) => (i + 1) % testimonials.length)}
              className="rounded-full border border-[#E8E0FF] bg-white p-2 text-[#8E7AB5] transition-colors hover:border-[#8E7AB5]"
              aria-label="Témoignage suivant"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {ctaHref && (
        <div className="mt-6 text-center sm:mt-8">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full border border-[#8E7AB5] px-5 py-2.5 text-sm font-semibold text-[#8E7AB5] transition-all hover:bg-[#8E7AB5] hover:text-white"
          >
            {ctaLabel}
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
