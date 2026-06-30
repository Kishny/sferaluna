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
  createdAt?: string;
}

/**
 * Carte de témoignage SferaLuna (thème clair).
 *
 * Composant présentational réutilisé sur :
 * - la page d'accueil ;
 * - la page dédiée /temoignages ;
 * - la page /valeurs.
 */
export default function TestimonialCard({
  testimonial,
  className = "",
}: {
  testimonial: PublicTestimonial;
  className?: string;
}) {
  const { authorName, age, city, content, rating, avatar } = testimonial;
  const initial = authorName?.[0]?.toUpperCase() ?? "L";

  return (
    <figure
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#E8E0FF] bg-white p-5 shadow-[0_10px_30px_-12px_rgba(142,122,181,0.3)] sm:p-6 ${className}`}
    >
      {/* Guillemet décoratif */}
      <span className="pointer-events-none absolute right-4 top-2 select-none text-5xl text-[#8E7AB5]/10 sm:text-6xl">
        &quot;
      </span>

      <StarRating value={rating} readOnly size={16} className="relative z-10 mb-3" />

      <blockquote className="relative z-10 mb-5 flex-1 text-sm font-light leading-relaxed text-[#1C1C1C] sm:text-base">
        « {content} »
      </blockquote>

      <figcaption className="relative z-10 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-base font-bold text-white">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt={authorName}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[#1C1C1C]">
            {authorName}
            {age ? `, ${age} ans` : ""}
          </div>

          <div className="truncate text-xs text-[#8E7AB5]">
            {city ? `${city} · ` : ""}Membre SferaLuna
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
