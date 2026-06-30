"use client";

import { useState } from "react";
import { Star } from "lucide-react";

/**
 * Note en étoiles SferaLuna.
 *
 * - Mode lecture (readOnly) : affiche simplement la note.
 * - Mode édition : étoiles cliquables avec survol, pour le formulaire.
 */
export default function StarRating({
  value,
  onChange,
  size = 18,
  readOnly = false,
  className = "",
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  readOnly?: boolean;
  className?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  const stars = [1, 2, 3, 4, 5];
  const active = hover ?? value;

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      role={readOnly ? "img" : "radiogroup"}
      aria-label={`Note : ${value} sur 5`}
    >
      {stars.map((star) => {
        const filled = star <= active;

        if (readOnly) {
          return (
            <Star
              key={star}
              size={size}
              className={filled ? "text-amber-400" : "text-[#E0D8F0]"}
              fill={filled ? "currentColor" : "none"}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            className="rounded p-0.5 transition-transform hover:scale-110"
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star
              size={size}
              className={filled ? "text-amber-400" : "text-[#D8CEEC]"}
              fill={filled ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}
