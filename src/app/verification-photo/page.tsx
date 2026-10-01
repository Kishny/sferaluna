// src/app/verification-photo/page.tsx

"use client";

/**
 * Vérification des photos par selfie vivant.
 *
 * 1. Explications + consentement explicite (donnée biométrique).
 * 2. Selfie vivant (AWS Rekognition Face Liveness).
 * 3. Comparaison de toutes les photos du profil avec ce selfie.
 * 4. Résultat : badge « Photo vérifiée » ou liste des photos à retirer.
 */

import { Suspense, useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ImageOff,
  Loader2,
  Lock,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";

import { BackButton, ExplorerShell, PhotoVerifiedBadge, ProfilePhoto } from "@/components/explorer/shared";
import { BTN_GHOST, BTN_PRIMARY, ErrorBanner, Eyebrow, GradientText, LoadingBlock, PANEL, PANEL_FEATURED, longDate } from "@/components/app/kit";
import { cn } from "@/components/site/ui";
import type { LivenessCredentials } from "@/components/photo-verification/LivenessCheck";

const LivenessCheck = dynamic(() => import("@/components/photo-verification/LivenessCheck"), {
  ssr: false,
  loading: () => <LoadingBlock label="Préparation de la caméra…" />,
});

type Status = {
  configured: boolean;
  enforced: boolean;
  hasReference: boolean;
  photoVerified: boolean;
  status: "none" | "verified" | "needs_review";
  verifiedAt: string | null;
  hasMainPhoto: boolean;
  mismatches: string[];
};

type Evaluation = {
  photoVerified: boolean;
  mainPhoto: "match" | "mismatch" | "no_face" | "missing" | "error";
  mismatches: { url: string; reason: string }[];
};

type Step = "intro" | "selfie" | "analysing" | "result";

function VerificationContent() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("intro");
  const [consent, setConsent] = useState(false);
  const [starting, setStarting] = useState(false);
  const [session, setSession] = useState<{ sessionId: string; region: string; credentials: LivenessCredentials } | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/photo-verification", { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/auth?mode=login&callbackUrl=%2Fverification-photo");
        return;
      }
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de charger votre vérification.");
        return;
      }
      setStatus(data);
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      const res = await fetch("/api/photo-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", consent: true }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Impossible de lancer la vérification.");
        return;
      }
      setSession({ sessionId: data.sessionId, region: data.region, credentials: data.credentials });
      setStep("selfie");
    } catch {
      setError("Connexion au serveur impossible.");
    } finally {
      setStarting(false);
    }
  };

  const complete = async () => {
    if (!session) return;
    setStep("analysing");
    try {
      const res = await fetch("/api/photo-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", sessionId: session.sessionId }),
      });
      const data = await res.json().catch(() => null);
      setSession(null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "La vérification n’a pas abouti.");
        setStep("intro");
        return;
      }
      setEvaluation(data);
      setStep("result");
      load();
    } catch {
      setError("Connexion au serveur impossible.");
      setStep("intro");
    }
  };

  const recheck = async () => {
    setBusy("recheck");
    setError("");
    try {
      const res = await fetch("/api/photo-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "recheck" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Nouvelle vérification impossible.");
        return;
      }
      setEvaluation(data);
      setStep("result");
      load();
    } finally {
      setBusy(null);
    }
  };

  const removePhoto = async (url: string) => {
    setBusy(url);
    try {
      const res = await fetch(`/api/upload/photo?url=${encodeURIComponent(url)}`, { method: "DELETE" });
      if (res.ok) {
        setEvaluation((ev) => (ev ? { ...ev, mismatches: ev.mismatches.filter((m) => m.url !== url) } : ev));
        load();
      } else {
        setError("Impossible de retirer cette photo.");
      }
    } finally {
      setBusy(null);
    }
  };

  const withdraw = async () => {
    setBusy("withdraw");
    try {
      await fetch("/api/photo-verification", { method: "DELETE" });
      setEvaluation(null);
      setStep("intro");
      setConsent(false);
      load();
    } finally {
      setBusy(null);
    }
  };

  const mismatches: { url: string; reason: string }[] =
    evaluation?.mismatches ??
    (status?.mismatches ?? []).map((url) => ({ url, reason: "Le visage sur cette photo ne correspond pas à votre selfie." }));
  const mainMismatch = evaluation ? evaluation.mainPhoto === "mismatch" || evaluation.mainPhoto === "no_face" : false;

  return (
    <ExplorerShell>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="pt-4">
          <BackButton fallbackHref="/mon-compte?tab=profil" fallbackLabel="Retour à mon profil" />
        </div>

        <div className="mt-6 text-center">
          <Eyebrow icon={ShieldCheck}>Confiance & sécurité</Eyebrow>
          <h1 className="mt-4 text-[32px] font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Vérification <GradientText>des photos</GradientText>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-white/75">
            Un selfie en direct nous permet de confirmer que les photos de votre profil sont bien les vôtres. Personne ne peut utiliser les photos d’une autre.
          </p>
        </div>

        {error && (
          <div className="mt-6">
            <ErrorBanner message={error} onClose={() => setError("")} />
          </div>
        )}

        {loading ? (
          <LoadingBlock />
        ) : !status ? null : !status.configured ? (
          <div className={cn(PANEL, "mt-8 p-6 text-center")}>
            <Sparkles className="mx-auto h-8 w-8 text-fuchsia-300" />
            <p className="mt-3 font-semibold text-white">Bientôt disponible</p>
            <p className="mt-1 text-sm text-white/65">La vérification des photos arrive très prochainement sur SferaLuna.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* ── Selfie ── */}
            {step === "selfie" && session && (
              <motion.div key="selfie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-8">
                <LivenessCheck
                  sessionId={session.sessionId}
                  region={session.region}
                  credentials={session.credentials}
                  onComplete={complete}
                  onCancel={() => {
                    setSession(null);
                    setStep("intro");
                  }}
                  onError={(message) => {
                    setSession(null);
                    setError(message);
                    setStep("intro");
                  }}
                />
              </motion.div>
            )}

            {step === "analysing" && (
              <motion.div key="analysing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <LoadingBlock label="Comparaison de vos photos avec votre selfie…" />
              </motion.div>
            )}

            {/* ── Résultat ── */}
            {(step === "result" || (step === "intro" && status.hasReference)) && (
              <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-5">
                {status.photoVerified ? (
                  <div className={cn(PANEL_FEATURED, "p-6 text-center")}>
                    <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />
                    <p className="mt-3 text-xl font-bold text-white">Vos photos sont vérifiées</p>
                    <div className="mt-3 flex justify-center">
                      <PhotoVerifiedBadge />
                    </div>
                    <p className="mt-3 text-sm text-white/70">
                      Le badge apparaît sur votre profil
                      {status.verifiedAt ? ` depuis le ${longDate(status.verifiedAt)}` : ""}. Chaque nouvelle photo sera comparée automatiquement à votre selfie.
                    </p>
                  </div>
                ) : (
                  <div className={cn(PANEL, "p-6")}>
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" />
                      <div>
                        <p className="text-lg font-semibold text-white">
                          {!status.hasMainPhoto ? "Ajoutez une photo principale" : "Quelques photos sont à revoir"}
                        </p>
                        <p className="mt-1 text-sm text-white/70">
                          {!status.hasMainPhoto
                            ? "Votre selfie est enregistré. Ajoutez maintenant une photo principale de vous : elle sera vérifiée automatiquement et le badge apparaîtra."
                            : mainMismatch
                              ? "Votre photo principale ne correspond pas à votre selfie. Remplacez-la par une photo récente et nette de vous."
                              : mismatches.length > 0
                                ? "Le visage de certaines photos ne correspond pas à votre selfie. Retirez-les pour obtenir le badge."
                                : "Nous n’avons pas pu vérifier toutes vos photos. Relancez la vérification."}
                        </p>
                      </div>
                    </div>

                    {mismatches.length > 0 && (
                      <ul className="mt-5 space-y-3">
                        {mismatches.map((m) => (
                          <li key={m.url} className="flex items-center gap-3 rounded-2xl border border-violet-300/15 bg-white/[0.03] p-3">
                            <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                              <ProfilePhoto src={m.url} name="Photo" className="h-full w-full" />
                            </span>
                            <p className="min-w-0 flex-1 text-sm text-white/75">{m.reason}</p>
                            {/* La photo principale se remplace depuis Mon profil ; les autres se retirent ici. */}
                            {m.url.includes("/avatars/") ? (
                              <Link href="/mon-compte?tab=profil" className={cn(BTN_GHOST, "h-10 shrink-0 px-3 text-sm")}>
                                <UserRound className="h-4 w-4" /> Changer
                              </Link>
                            ) : (
                              <button type="button" onClick={() => removePhoto(m.url)} disabled={busy === m.url} className={cn(BTN_GHOST, "h-10 shrink-0 px-3 text-sm")}>
                                {busy === m.url ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageOff className="h-4 w-4" />} Retirer
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={recheck} disabled={busy === "recheck"} className={cn(BTN_PRIMARY, "h-11")}>
                        {busy === "recheck" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Revérifier mes photos
                      </button>
                      <Link href="/mon-compte?tab=profil" className={cn(BTN_GHOST, "h-11")}>
                        <UserRound className="h-4 w-4" /> Gérer mes photos
                      </Link>
                    </div>
                  </div>
                )}

                <div className={cn(PANEL, "flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-white/70")}>
                  <p className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-fuchsia-300" /> Votre selfie est chiffré et n’est jamais affiché.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEvaluation(null);
                        setConsent(false);
                        setStep("intro");
                        setStatus({ ...status, hasReference: false });
                      }}
                      className={cn(BTN_GHOST, "h-10 px-3 text-sm")}
                    >
                      <Camera className="h-4 w-4" /> Refaire mon selfie
                    </button>
                    <button type="button" onClick={withdraw} disabled={busy === "withdraw"} className={cn(BTN_GHOST, "h-10 px-3 text-sm text-rose-200")}>
                      {busy === "withdraw" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Supprimer ma vérification
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Explications + consentement ── */}
            {step === "intro" && !status.hasReference && (
              <motion.div key="intro" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-8 space-y-5">
                <div className={cn(PANEL, "grid gap-5 p-6 sm:grid-cols-3")}>
                  {[
                    { icon: ScanFace, title: "1. Selfie en direct", text: "Placez votre visage dans l’ovale, quelques secondes suffisent." },
                    { icon: Camera, title: "2. Comparaison", text: "Chaque photo de votre profil est comparée à votre selfie." },
                    { icon: ShieldCheck, title: "3. Badge", text: "« Photo vérifiée » s’affiche sur votre profil." },
                  ].map((s) => (
                    <div key={s.title} className="text-center">
                      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-fuchsia-300/30 bg-fuchsia-500/15">
                        <s.icon className="h-5 w-5 text-fuchsia-200" />
                      </span>
                      <p className="mt-3 font-semibold text-white">{s.title}</p>
                      <p className="mt-1 text-sm text-white/65">{s.text}</p>
                    </div>
                  ))}
                </div>

                <div className={cn(PANEL_FEATURED, "p-6")}>
                  <p className="flex items-center gap-2 font-semibold text-white">
                    <Lock className="h-5 w-5 text-fuchsia-300" /> Vos données, en toute transparence
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-relaxed text-white/75">
                    <li>• Votre selfie et vos photos sont analysés par Amazon Web Services (Rekognition), dans un centre de données en Irlande (Union européenne).</li>
                    <li>• Le selfie sert uniquement à vérifier que les photos de votre profil sont bien les vôtres. Il n’est jamais montré aux autres membres.</li>
                    <li>• Il est conservé chiffré tant que votre vérification est active, pour contrôler vos futures photos, puis supprimé si vous retirez votre accord ou supprimez votre compte.</li>
                    <li>• Vous pouvez retirer votre accord à tout moment depuis cette page.</li>
                  </ul>
                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-violet-300/20 bg-white/[0.03] p-4">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 rounded border-violet-300/40 bg-transparent accent-fuchsia-500"
                    />
                    <span className="text-sm text-white/85">
                      J’accepte que SferaLuna analyse mon selfie et mes photos de profil (données biométriques) pour vérifier qu’elles me correspondent, dans les conditions décrites ci-dessus.
                    </span>
                  </label>
                  <button type="button" onClick={start} disabled={!consent || starting} className={cn(BTN_PRIMARY, "mt-5 h-12 w-full")}>
                    {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanFace className="h-5 w-5" />} Commencer la vérification
                  </button>
                  <p className="mt-3 text-center text-xs text-white/50">
                    Prévoyez un endroit bien éclairé. La vérification affiche de courts flashs de couleur.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </ExplorerShell>
  );
}

export default function VerificationPhotoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#12081f]" />}>
      <VerificationContent />
    </Suspense>
  );
}
