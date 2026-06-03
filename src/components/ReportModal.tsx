// src/components/ReportModal.tsx
// Modale de signalement réutilisable (profils, messages, posts)

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flag, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: "user" | "message" | "community_post";
  targetId: string;
}

const REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harcèlement", label: "Harcèlement" },
  { value: "contenu_inapproprié", label: "Contenu inapproprié" },
  { value: "faux_profil", label: "Faux profil" },
  { value: "autre", label: "Autre" },
] as const;

type Reason = (typeof REASONS)[number]["value"];

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

  const handleClose = () => {
    // Réinitialiser l'état avant fermeture
    setTimeout(() => {
      setReason("");
      setDetails("");
      setError("");
      setSuccess(false);
      setIsSubmitting(false);
    }, 300);
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason) {
      setError("Veuillez sélectionner une raison.");
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

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetLabel =
    targetType === "user"
      ? "ce profil"
      : targetType === "message"
      ? "ce message"
      : "ce post";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Fond */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Carte */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="relative z-10 w-full max-w-md rounded-2xl bg-gradient-to-br from-[#1a0b2e] to-[#2d1b69] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-400" />
                <h2 className="text-lg font-bold text-white">
                  Signaler {targetLabel}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {success ? (
                /* État succès */
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 py-6 text-center"
                >
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="font-semibold text-white">
                    Signalement envoyé
                  </p>
                  <p className="text-sm text-gray-400">
                    Notre équipe examinera ce signalement. Merci de contribuer
                    à la sécurité de la communauté.
                  </p>
                </motion.div>
              ) : (
                <>
                  {/* Raison */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-300">
                      Raison du signalement
                    </p>
                    <div className="space-y-2">
                      {REASONS.map((r) => (
                        <label
                          key={r.value}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition ${
                            reason === r.value
                              ? "border-red-400/60 bg-red-500/10 text-white"
                              : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          <input
                            type="radio"
                            name="report-reason"
                            value={r.value}
                            checked={reason === r.value}
                            onChange={() => setReason(r.value)}
                            className="sr-only"
                          />
                          <span
                            className={`h-4 w-4 rounded-full border-2 flex-shrink-0 ${
                              reason === r.value
                                ? "border-red-400 bg-red-400"
                                : "border-gray-500"
                            }`}
                          />
                          <span className="text-sm">{r.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Détails optionnels */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-300">
                      Précisions{" "}
                      <span className="text-gray-500 font-normal">
                        (optionnel)
                      </span>
                    </label>
                    <textarea
                      value={details}
                      onChange={(e) =>
                        setDetails(e.target.value.slice(0, 500))
                      }
                      placeholder="Décrivez la situation en quelques mots..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400/40 resize-none transition"
                    />
                    <p className="text-xs text-gray-600 text-right">
                      {details.length}/500
                    </p>
                  </div>

                  {/* Erreur */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-300 text-sm"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/10 transition text-sm font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!reason || isSubmitting}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium text-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Flag className="h-4 w-4" />
                      )}
                      Confirmer le signalement
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
