// src/components/explorer/shared.tsx

"use client";

/**
 * Briques communes aux 3 pages du parcours Explorer :
 *   /explorer               → Vos découvertes du jour
 *   /explorer/libre         → Explorer librement
 *   /explorer/profil/[id]   → Profil détaillé
 */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { getNavOrigin } from "@/components/NavTracker";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  BadgeCheck,
  Camera,
  Flag,
  Heart,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import ReportModal from "@/components/ReportModal";
import { NightBackdrop } from "@/components/site/art";
import { cn } from "@/components/site/ui";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ExplorerProfile {
  _id: string;
  pseudonyme: string;
  age?: number;
  localisation?: string;
  departement?: string;
  interets?: string[];
  intentions?: string[];
  orientation?: string;
  bio?: string;
  image?: string;
  photos?: string[];
  gallery?: string[];
  identityVerified?: boolean;
  photoVerified?: boolean;
  recentlyActive?: boolean;
  profession?: string;
  valeurs?: string[];
  modeDeVie?: string;
  langues?: string[];
}

// ─────────────────────────────────────────────
// Surfaces
// ─────────────────────────────────────────────

export const PANEL =
  "rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/75 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] backdrop-blur-xl";

export function Chip({
  children,
  tone = "violet",
  className = "",
}: {
  children: ReactNode;
  tone?: "violet" | "pink" | "shared";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium",
        tone === "pink" && "border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-50",
        tone === "shared" && "border-emerald-300/40 bg-emerald-500/10 text-emerald-50",
        tone === "violet" && "border-violet-300/30 bg-violet-500/10 text-violet-50",
        className
      )}
    >
      {children}
    </span>
  );
}

export function VerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-500/90 font-semibold text-white shadow-md shadow-emerald-900/40",
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <BadgeCheck className={small ? "h-3 w-3" : "h-3.5 w-3.5"} /> Vérifiée
    </span>
  );
}

/** Photos du profil comparées au selfie vivant de la membre. */
export function PhotoVerifiedBadge({ small = false }: { small?: boolean }) {
  return (
    <span
      title="Les photos de ce profil ont été comparées à un selfie pris en direct"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-sky-500/90 font-semibold text-white shadow-md shadow-sky-900/40",
        small ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      )}
    >
      <Camera className={small ? "h-3 w-3" : "h-3.5 w-3.5"} /> Photo vérifiée
    </span>
  );
}

// ─────────────────────────────────────────────
// Coquille de page
// ─────────────────────────────────────────────

export function ExplorerShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative isolate min-h-screen overflow-hidden bg-[#12081f] pb-20 pt-20 text-white lg:pt-24">
        <NightBackdrop />
        {children}
      </main>
    </>
  );
}

// ─────────────────────────────────────────────
// Navigation : retour exact à la page précédente
// ─────────────────────────────────────────────

/** Libellé du bouton Retour selon la page d'où l'on vient. */
function labelFor(path: string | null, fallbackLabel: string) {
  if (!path) return fallbackLabel;
  if (path.startsWith("/explorer/libre")) return "Retour à Explorer librement";
  if (path.startsWith("/explorer/profil")) return "Retour au profil";
  if (path === "/explorer") return "Retour aux découvertes";
  if (path.startsWith("/mon-compte")) return "Retour au compte";
  if (path.startsWith("/matches") || path.startsWith("/messages")) return "Retour à mes matchs";
  if (path.startsWith("/circle")) return "Retour à Circle of Six";
  if (path === "/") return "Retour à l’accueil";
  return "Retour";
}

/**
 * Bouton Retour : revient EXACTEMENT à la page précédente via l'historique
 * du navigateur (URL, filtres et position dans la liste compris).
 * L'origine est enregistrée par <NavTracker /> (ClientProvider). Si l'on
 * arrive directement sur la page (lien partagé, nouvel onglet), on utilise
 * le lien de secours.
 */
export function BackButton({ fallbackHref, fallbackLabel }: { fallbackHref: string; fallbackLabel: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(getNavOrigin(pathname));
  }, [pathname]);

  const goBack = () => {
    const from = getNavOrigin(pathname) ?? origin;
    if (from && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex h-11 items-center gap-2 rounded-full border border-violet-300/30 bg-[#1b0d38]/70 px-4 text-sm font-medium text-white/90 backdrop-blur-xl transition hover:border-fuchsia-300/60 hover:bg-fuchsia-500/10 hover:text-white sm:px-5"
    >
      <ArrowLeft className="h-4 w-4" />
      {labelFor(origin, fallbackLabel)}
    </button>
  );
}

// ─────────────────────────────────────────────
// Liste de navigation (profil précédent / suivant)
// ─────────────────────────────────────────────

const LIST_KEY = "sl-explorer-list";

export function rememberList(source: "decouvertes" | "libre", ids: string[]) {
  try {
    sessionStorage.setItem(LIST_KEY, JSON.stringify({ source, ids }));
  } catch {
    /* ignore */
  }
}

export function readList(): { source: string; ids: string[] } | null {
  try {
    return JSON.parse(sessionStorage.getItem(LIST_KEY) || "null");
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Photo de profil (ou illustration si aucune photo)
// ─────────────────────────────────────────────

const FALLBACK_TONES = [
  "from-fuchsia-500 via-purple-600 to-indigo-700",
  "from-pink-500 via-fuchsia-600 to-violet-700",
  "from-violet-500 via-purple-600 to-pink-600",
];

export function ProfilePhoto({
  src,
  name,
  className = "",
  blur = false,
}: {
  src?: string | null;
  name: string;
  className?: string;
  blur?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const tone = FALLBACK_TONES[(name || "").length % FALLBACK_TONES.length];

  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br", tone, blur && "blur-md", className)}>
        <span className="text-6xl font-bold text-white/85 drop-shadow-lg">{(name || "?").charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={blur ? "" : `Photo de ${name}`}
      onError={() => setFailed(true)}
      className={cn("object-cover", blur && "blur-md", className)}
      draggable={false}
    />
  );
}

// ─────────────────────────────────────────────
// Like + match
// ─────────────────────────────────────────────

export function useLike() {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const like = async (profileId: string): Promise<{ ok: boolean; matchId?: string }> => {
    if (pendingId) return { ok: false };
    setPendingId(profileId);
    setError(null);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profileId }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible d’envoyer le like pour le moment.");
        return { ok: false };
      }
      return { ok: true, matchId: data.matched ? data.matchId : undefined };
    } catch {
      setError("Connexion impossible.");
      return { ok: false };
    } finally {
      setPendingId(null);
    }
  };

  return { like, pendingId, error, clearError: () => setError(null) };
}

export function MatchModal({
  profile,
  matchId,
  onClose,
}: {
  profile: ExplorerProfile | null;
  matchId: string | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {profile && matchId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(PANEL, "w-full max-w-sm p-6 text-center")}
            role="dialog"
            aria-label="Nouveau match"
          >
            <div className="mx-auto h-28 w-28 overflow-hidden rounded-full ring-4 ring-fuchsia-400/70">
              <ProfilePhoto src={profile.gallery?.[0] || profile.image} name={profile.pseudonyme} className="h-full w-full" />
            </div>
            <p className="mt-5 text-2xl font-bold text-white">C’est un match ! 💞</p>
            <p className="mt-1 text-sm text-white/70">Vous vous plaisez mutuellement avec {profile.pseudonyme}.</p>
            <div className="mt-6 grid gap-2.5">
              <Link
                href={`/messages/${matchId}`}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-600 to-pink-500 text-sm font-semibold text-white"
              >
                <MessageSquareText className="h-4 w-4" /> Écrire un message
              </Link>
              <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-violet-300/25 text-sm text-white/80 hover:bg-white/5">
                Continuer à explorer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────
// Menu « … » : signaler / bloquer
// ─────────────────────────────────────────────

export function ProfileMenu({
  profileId,
  profileName,
  onBlocked,
  className = "",
}: {
  profileId: string;
  profileName: string;
  onBlocked?: () => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmBlock(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const block = async () => {
    setBlocking(true);
    try {
      const res = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: profileId }),
      });
      if (res.ok) {
        setOpen(false);
        onBlocked?.();
      }
    } finally {
      setBlocking(false);
    }
  };

  return (
    <div ref={ref} className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur transition hover:bg-black/55"
        aria-label={`Options pour ${profileName}`}
        aria-expanded={open}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute right-0 top-11 z-20 w-56 rounded-2xl border border-violet-300/15 bg-[#1a0c38]/95 p-1.5 shadow-2xl backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={() => {
                setReportOpen(true);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-white/85 hover:bg-white/5"
            >
              <Flag className="h-4 w-4" /> Signaler ce profil
            </button>
            {confirmBlock ? (
              <div className="rounded-xl bg-rose-500/10 p-3 text-xs text-rose-100">
                Bloquer {profileName} ? Son profil disparaîtra de votre expérience.
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={block} disabled={blocking} className="flex-1 rounded-lg bg-rose-500 px-2 py-1.5 font-semibold text-white">
                    {blocking ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Bloquer"}
                  </button>
                  <button type="button" onClick={() => setConfirmBlock(false)} className="flex-1 rounded-lg border border-white/20 px-2 py-1.5">
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmBlock(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-rose-200 hover:bg-white/5"
              >
                <Ban className="h-4 w-4" /> Bloquer cette membre
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetType="user" targetId={profileId} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Boutons d'action
// ─────────────────────────────────────────────

export function ActionButton({
  variant,
  onClick,
  href,
  disabled,
  children,
  className = "",
}: {
  variant: "pass" | "info" | "like" | "liked";
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    pass: "border border-violet-300/30 bg-[#1b0d38]/80 text-white hover:border-violet-300/60 hover:bg-white/5",
    info: "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_12px_32px_-12px_rgba(124,58,237,0.9)] hover:brightness-110",
    like: "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-[0_12px_36px_-10px_rgba(236,72,153,0.9)] hover:brightness-110",
    liked: "border border-emerald-300/40 bg-emerald-500/15 text-emerald-100",
  }[variant];

  const cls = cn(
    "inline-flex h-14 items-center justify-center gap-2.5 rounded-2xl px-5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
    styles,
    className
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

export { Heart, X };
