// src/components/photo-verification/SelfieGate.tsx

"use client";

/**
 * « Selfie d'abord » : avant d'ajouter une photo (photo principale ou
 * galerie), la membre qui n'a pas encore fait son selfie de vérification
 * est invitée à le faire. Ses photos seront ensuite comparées à ce selfie.
 *
 * Usage :
 *   const gate = useSelfieGate("avatar");
 *   <button onClick={() => gate.guard(() => inputRef.current?.click())}>
 *   {gate.modal}
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Lock, ScanFace, ShieldCheck, X } from "lucide-react";

type GateStatus = { configured: boolean; hasReference: boolean } | null;

export function useSelfieGate(kind: "avatar" | "photo") {
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/photo-verification", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) setStatus({ configured: !!data.configured, hasReference: !!data.hasReference });
    } catch {
      /* en cas d'erreur réseau, on laisse passer : le serveur vérifie aussi */
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Exécute l'action seulement si la membre a déjà fait son selfie (ou si la vérification n'est pas disponible). */
  const guard = (action: () => void) => {
    if (status && status.configured && !status.hasReference) {
      setOpen(true);
      return;
    }
    action();
  };

  const goVerify = () => {
    const next = `/mon-compte?tab=profil&photo=${kind}`;
    router.push(`/verification-photo?next=${encodeURIComponent(next)}`);
  };

  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Vérification par selfie"
            className="w-full max-w-md rounded-t-3xl border border-fuchsia-300/30 bg-[#1b0d38] p-6 text-white shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15">
                <ScanFace className="h-6 w-6 text-fuchsia-200" />
              </span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-full p-2 text-white/60 hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>
            <h2 className="mt-4 text-xl font-bold">Un selfie avant votre {kind === "avatar" ? "photo de profil" : "première photo"}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              Sur SferaLuna, chaque photo de profil est comparée à un selfie pris en direct. Cela garantit qu’aucune membre ne peut utiliser les photos d’une autre personne.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/80">
              <li className="flex gap-2">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" /> Moins d’une minute, avec la caméra de votre appareil.
              </li>
              <li className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" /> Le badge « Photo vérifiée » rassure les autres membres.
              </li>
              <li className="flex gap-2">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" /> Votre selfie est chiffré et n’est jamais affiché.
              </li>
            </ul>
            <button
              type="button"
              onClick={goVerify}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 font-semibold text-white shadow-[0_12px_32px_-12px_rgba(236,72,153,0.9)] hover:brightness-110"
            >
              <ScanFace className="h-5 w-5" /> Faire mon selfie
            </button>
            <button type="button" onClick={() => setOpen(false)} className="mt-2 h-11 w-full rounded-2xl text-sm text-white/65 hover:bg-white/5">
              Plus tard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return { guard, modal, needsSelfie: !!(status?.configured && !status.hasReference), refresh };
}
