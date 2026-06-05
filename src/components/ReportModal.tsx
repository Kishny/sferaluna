// src/components/ReportModal.tsx

"use client";

/**
 * Modale de signalement réutilisable.
 *
 * Utilisée pour signaler :
 * - un profil utilisateur ;
 * - un message ;
 * - un post communautaire.
 *
 * Elle envoie les données vers :
 * POST /api/reports
 *
 * Props attendues :
 * - isOpen : contrôle l'affichage de la modale ;
 * - onClose : ferme la modale ;
 * - targetType : type de contenu signalé ;
 * - targetId : identifiant de la cible signalée.
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "user" | "message" | "community_post";
  targetId: string;
}

/**
 * Liste des raisons de signalement.
 *
 * Les values doivent rester cohérentes avec ce que ton backend attend.
 */
const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harcèlement", label: "Harcèlement" },
  { value: "contenu_inapproprié", label: "Contenu inapproprié" },
  { value: "faux_profil", label: "Faux profil" },
  { value: "autre", label: "Autre" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
}: ReportModalProps) {
  const [reason, setReason] = useState<Reason | "">("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  /**
   * Label affiché dans le titre selon le type de cible.
   */
  const targetLabel =
    targetType === "user"
      ? "ce profil"
      : targetType === "message"
        ? "ce message"
        : "ce post";

  /**
   * Réinitialise l'état interne de la modale.
   *
   * Séparé dans une fonction pour éviter de répéter le même code.
   */
  const resetModalState = () => {
    setReason("");
    setDetails("");
    setError("");
    setSuccess(false);
    setIsSubmitting(false);
  };

  /**
   * Fermeture propre.
   *
   * On ferme immédiatement la modale, puis on reset après un petit délai
   * pour laisser l'animation de sortie se faire proprement.
   */
  const handleClose = () => {
    if (isSubmitting) return;

    onClose();

    window.setTimeout(() => {
      resetModalState();
    }, 250);
  };

  /**
   * Fermer avec la touche Échap.
   *
   * Pratique sur desktop et n'impacte pas le mobile.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };

    // On évite d'ajouter handleClose en dépendance pour ne pas réattacher
    // l'écouteur à chaque render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSubmitting]);

  /**
   * Bloque le scroll du body quand la modale est ouverte.
   *
   * Cela évite que la page derrière bouge pendant l'utilisation de la modale.
   */
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  /**
   * Envoi du signalement.
   */
  const handleSubmit = async () => {
    if (!reason) {
      setError("Veuillez sélectionner une raison.");
      return;
    }

    if (!targetId) {
      setError("Impossible d'identifier l'élément à signaler.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error ?? "Une erreur est survenue.");
        return;
      }

      setSuccess(true);

      window.setTimeout(() => {
        handleClose();
      }, 1800);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="report-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-4"
        >
          {/* Fond sombre */}
          <button
            type="button"
            aria-label="Fermer la modale"
            className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Carte */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a0b2e] to-[#2d1b69] shadow-2xl"
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-6">
              <div className="flex min-w-0 items-center gap-2">
                <Flag className="h-5 w-5 shrink-0 text-red-400" />

                <h2
                  id="report-modal-title"
                  className="truncate text-base font-bold text-white sm:text-lg"
                >
                  Signaler {targetLabel}
                </h2>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu scrollable sur petit écran */}
            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-400" />

                  <p className="font-semibold text-white">Signalement envoyé</p>

                  <p className="max-w-xs text-sm text-gray-400">
                    Notre équipe examinera ce signalement. Merci de contribuer à
                    la sécurité de la communauté.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-5">
                  {/* Raison */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">
                      Raison du signalement
                    </p>

                    <div className="space-y-2">
                      {REASONS.map((item) => {
                        const selected = reason === item.value;

                        return (
                          <label
                            key={item.value}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition sm:px-4 sm:py-3 ${
                              selected
                                ? "border-red-400/60 bg-red-500/10 text-white"
                                : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            <input
                              type="radio"
                              name="report-reason"
                              value={item.value}
                              checked={selected}
                              onChange={() => {
                                setReason(item.value);
                                setError("");
                              }}
                              className="sr-only"
                            />

                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                                selected
                                  ? "border-red-400 bg-red-400"
                                  : "border-gray-500"
                              }`}
                            >
                              {selected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </span>

                            <span className="text-sm">{item.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Détails optionnels */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="report-details"
                      className="text-sm font-medium text-gray-300"
                    >
                      Précisions{" "}
                      <span className="font-normal text-gray-500">
                        (optionnel)
                      </span>
                    </label>

                    <textarea
                      id="report-details"
                      value={details}
                      onChange={(event) =>
                        setDetails(event.target.value.slice(0, 500))
                      }
                      placeholder="Décrivez la situation en quelques mots..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition focus:border-red-400/40"
                    />

                    <p className="text-right text-xs text-gray-600">
                      {details.length}/500
                    </p>
                  </div>

                  {/* Erreur */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Actions */}
                  <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 disabled:opacity-40"
                    >
                      Annuler
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!reason || isSubmitting}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/80 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Flag className="h-4 w-4" />
                      )}

                      {isSubmitting ? "Envoi..." : "Confirmer"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}