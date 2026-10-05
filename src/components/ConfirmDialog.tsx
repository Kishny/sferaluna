// src/components/ConfirmDialog.tsx

"use client";

/**
 * Fenêtre de confirmation aux couleurs du site (remplace window.confirm).
 *
 *   const [confirm, confirmDialog] = useConfirm();
 *   if (!(await confirm({ title: "Supprimer cette entrée ?" }))) return;
 *   …
 *   return <>{…}{confirmDialog}</>;
 *
 * Échap ou un clic à côté annulent. Le bouton « Annuler » reçoit le focus à
 * l'ouverture : une touche Entrée distraite ne supprime rien.
 */

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export type ConfirmOptions = {
  title: string;
  text?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Bouton rouge pour les actions destructrices (par défaut). */
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };

export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, ReactNode] {
  const [pending, setPending] = useState<Pending | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const confirm = useCallback((options: ConfirmOptions) => {
    previousFocus.current = document.activeElement as HTMLElement | null;
    return new Promise<boolean>((resolve) => setPending({ ...options, resolve }));
  }, []);

  const close = useCallback(
    (ok: boolean) => {
      pending?.resolve(ok);
      setPending(null);
      previousFocus.current?.focus?.();
    },
    [pending]
  );

  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(false);
    };
    window.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [pending, close]);

  const danger = pending?.danger ?? true;

  const dialog = (
    <AnimatePresence>
      {pending && (
        <motion.div
          key="confirm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-[#0a0414]/75 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => close(false)}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/12 bg-[#1a0d2e] p-6 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            <div className="flex items-start gap-4">
              {danger && (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/15 text-rose-200">
                  <AlertTriangle className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold leading-snug">
                  {pending.title}
                </h2>
                {pending.text && <div className="mt-2 text-sm leading-relaxed text-white/70">{pending.text}</div>}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => close(false)}
                className="min-h-[44px] rounded-full border border-white/15 bg-white/5 px-5 text-sm font-medium text-white/85 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
              >
                {pending.cancelLabel ?? "Annuler"}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className={
                  "min-h-[44px] rounded-full px-5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white " +
                  (danger ? "bg-rose-600 hover:bg-rose-500" : "bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:brightness-110")
                }
              >
                {pending.confirmLabel ?? "Confirmer"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return [confirm, dialog];
}
