import { MapPin, Star } from "lucide-react";

import StarRating from "./StarRating";

/**
 * Témoignage public tel qu'exposé par GET /api/testimonials.
 * L'avatar n'est présent que si la membre a consenti à l'afficher.
 */
export interface PublicTestimonial {
  _id: string;
  authorName: string;
  age?: number;
  city?: string;
  content: string;
  rating: number;
  avatar?: string | null;
  featured?: boolean;
  createdAt?: string;
}

function formatDate(iso?: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}

/**
 * Carte de témoignage SferaLuna (thème nuit), utilisée sur /temoignages.
 * N'affiche que ce que la membre a écrit : aucune étiquette ajoutée.
 */
export default function TestimonialCard({ testimonial, className = "" }: { testimonial: PublicTestimonial; className?: string }) {
  const { authorName, age, city, content, rating, avatar, featured, createdAt } = testimonial;
  const initial = authorName?.[0]?.toUpperCase() ?? "L";
  const date = formatDate(createdAt);

  return (
    <figure
      className={`relative flex h-full flex-col rounded-3xl border bg-[#1b0d38]/80 p-5 backdrop-blur-xl sm:p-7 ${
        featured ? "border-fuchsia-400/70 shadow-[0_0_0_1px_rgba(232,121,249,0.3),0_20px_60px_-20px_rgba(192,38,211,0.6)]" : "border-violet-300/[0.16]"
      } ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-xl font-bold text-white">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={authorName} className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <figcaption className="min-w-0 flex-1">
          <p className="truncate text-lg text-white">
            <span className="font-semibold">{authorName}</span>
            {age ? `, ${age} ans` : ""}
          </p>
          {city && (
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/70">
              <MapPin className="h-3.5 w-3.5 text-fuchsia-300" /> {city}
            </p>
          )}
          <StarRating value={rating} readOnly size={18} className="mt-2" />
        </figcaption>

        {featured && (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-fuchsia-500/25 px-3 py-1 text-xs font-semibold text-white ring-1 ring-fuchsia-300/40">
            <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> À la une
          </span>
        )}
      </div>

      <blockquote className="mt-4 flex-1 text-base italic leading-relaxed text-white/90 sm:text-lg">« {content} »</blockquote>

      {date && <p className="mt-4 border-t border-white/10 pt-3 text-right text-sm text-white/55">{date}</p>}
    </figure>
  );
}
