"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, MessageSquarePlus } from "lucide-react";
import StarRating from "./StarRating";

export interface TestimonialFormInitial {
  content?: string;
  age?: number;
  city?: string;
  rating?: number;
  showAvatar?: boolean;
}

/**
 * Formulaire de témoignage partagé SferaLuna.
 *
 * Réutilisé sur :
 * - /temoignages ;
 * - la bannière d'incitation dans Mon Compte (en modal).
 *
 * Gère : contenu, note en étoiles, ville, âge, consentement photo.
 */
export default function TestimonialForm({
  profileImage,
  initial,
  onSuccess,
  onCancel,
}: {
  /** Photo de profil de la membre, pour l'aperçu de l'opt-in. */
  profileImage?: string | null;
  /** Valeurs pré-remplies (modification d'un témoignage existant). */
  initial?: TestimonialFormInitial;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState(initial?.content ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [city, setCity] = useState(initial?.city ?? "");
  const [age, setAge] = useState(initial?.age ? String(initial.age) : "");
  const [showAvatar, setShowAvatar] = useState(initial?.showAvatar ?? false);

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          rating,
          city: city.trim() || undefined,
          age: age ? Number(age) : undefined,
          showAvatar,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Une erreur est survenue.");
        setStatus("error");
        return;
      }

      setStatus("success");
      onSuccess?.();
    } catch {
      setError("Erreur de connexion au serveur.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200"
      >
        <CheckCircle size={18} />
        Merci ! Ton témoignage sera visible après validation. 💜
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-violet-300/20 bg-[#1b0d38] p-4 text-left shadow-2xl sm:p-6"
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white sm:mb-4 sm:text-base">
        <MessageSquarePlus size={18} />
        Partage ton expérience
      </h3>

      {/* Note en étoiles */}
      <div className="mb-3 flex items-center gap-3">
        <span className="text-xs font-medium text-white/70">Ta note</span>
        <StarRating value={rating} onChange={setRating} size={24} />
      </div>

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Raconte-nous ton expérience… 20 à 500 caractères."
        rows={3}
        maxLength={500}
        className="mb-1 w-full resize-none rounded-xl border border-violet-300/20 bg-white/[0.05] px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-fuchsia-300/60 focus:ring-2 focus:ring-fuchsia-500/20 sm:px-4 sm:py-3"
      />

      <p className="mb-3 text-right text-xs text-white/50 sm:mb-4">
        {content.length}/500
      </p>

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:gap-3">
        <input
          type="text"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Ville (optionnel)"
          maxLength={60}
          className="h-11 w-full rounded-xl border border-violet-300/20 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-fuchsia-300/60 sm:px-4"
        />

        <input
          type="number"
          value={age}
          onChange={(event) => setAge(event.target.value)}
          placeholder="Âge (optionnel)"
          aria-label="Âge (optionnel)"
          min={28}
          max={99}
          className="h-11 w-full rounded-xl border border-violet-300/20 bg-white/[0.05] px-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-fuchsia-300/60 sm:w-52 sm:px-4"
        />
      </div>

      {/* Consentement photo */}
      <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-violet-300/15 bg-white/[0.03] px-3 py-2.5">
        <input
          type="checkbox"
          checked={showAvatar}
          onChange={(event) => setShowAvatar(event.target.checked)}
          className="h-4 w-4 shrink-0 accent-fuchsia-500"
        />

        {showAvatar && profileImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profileImage}
            alt="Aperçu"
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : null}

        <span className="text-xs leading-snug text-white/80">
          Afficher ma photo de profil avec mon témoignage
          {!profileImage && (
            <span className="block text-white/50">
              (ajoute d&apos;abord une photo de profil pour l&apos;activer)
            </span>
          )}
        </span>
      </label>

      {status === "error" && (
        <p className="mb-3 text-sm text-red-300">{error}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="submit"
          disabled={status === "loading" || content.trim().length < 20}
          className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50 sm:px-6"
        >
          {status === "loading" ? "Envoi…" : "Envoyer"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-violet-300/30 px-5 py-2.5 text-sm text-white/80 transition hover:border-fuchsia-300/60 sm:px-6"
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  );
}
