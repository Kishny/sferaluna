// src/components/profile/VideosSection.tsx

"use client";

/**
 * Mon profil — courtes vidéos (≤ 15 s, max 2).
 *
 * 1. Contrôle local de la durée et du poids.
 * 2. Selfie de vérification exigé (useSelfieGate).
 * 3. Upload direct vers Cloudinary avec une signature fournie par
 *    /api/upload/video, barre de progression.
 * 4. Contrôle serveur (durée, poids, visage) puis enregistrement.
 */

import { useRef, useState } from "react";
import { AlertCircle, Loader2, Play, Video, X } from "lucide-react";

import { cn } from "@/components/site/ui";

import { useSelfieGate } from "@/components/photo-verification/SelfieGate";
import { ALLOWED_VIDEO_TYPES, MAX_PROFILE_VIDEOS, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS } from "@/lib/media-limits";

export type ProfileVideo = { url: string; publicId: string; posterUrl?: string; duration?: number };

function readDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    video.src = url;
  });
}

function uploadToCloudinary(file: File, sign: Record<string, string | number>, onProgress: (p: number) => void) {
  return new Promise<{ public_id: string }>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", String(sign.apiKey));
    form.append("timestamp", String(sign.timestamp));
    form.append("signature", String(sign.signature));
    form.append("folder", String(sign.folder));
    form.append("public_id", String(sign.public_id));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${sign.cloudName}/video/upload`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && data.public_id) resolve(data);
        else reject(new Error(data?.error?.message || "Envoi refusé."));
      } catch {
        reject(new Error("Réponse inattendue."));
      }
    };
    xhr.onerror = () => reject(new Error("Connexion interrompue pendant l’envoi."));
    xhr.send(form);
  });
}

const CARD =
  "rounded-3xl border border-violet-300/[0.14] bg-[#1b0d38]/75 p-4 shadow-[0_18px_50px_-24px_rgba(8,0,24,0.9)] backdrop-blur-xl sm:p-5";

export default function VideosSection({
  videos,
  onSaved,
  className = "",
}: {
  videos: ProfileVideo[];
  onSaved: () => void;
  className?: string;
}) {
  const gate = useSelfieGate("photo");
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [step, setStep] = useState<"" | "upload" | "check">("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const busy = step !== "";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);

    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) return setError("Format non pris en charge. Utilisez une vidéo MP4, MOV ou WebM.");
    if (file.size > MAX_VIDEO_BYTES) return setError("Vidéo trop lourde (50 Mo maximum).");
    try {
      const duration = await readDuration(file);
      if (duration > MAX_VIDEO_SECONDS + 0.5) return setError(`Votre vidéo dure ${Math.round(duration)} s : ${MAX_VIDEO_SECONDS} secondes maximum.`);
    } catch {
      /* durée illisible localement : le serveur vérifiera */
    }

    try {
      setStep("upload");
      setProgress(0);
      const signRes = await fetch("/api/upload/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign" }),
      });
      const sign = await signRes.json().catch(() => null);
      if (!signRes.ok || !sign?.success) throw new Error(sign?.error || "Envoi impossible pour le moment.");

      const uploaded = await uploadToCloudinary(file, sign, setProgress);

      setStep("check");
      const saveRes = await fetch("/api/upload/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", publicId: uploaded.public_id }),
      });
      const saved = await saveRes.json().catch(() => null);
      if (!saveRes.ok || !saved?.success) throw new Error(saved?.error || "La vidéo n’a pas pu être ajoutée.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "La vidéo n’a pas pu être ajoutée.");
    } finally {
      setStep("");
      setProgress(null);
    }
  };

  const remove = async (publicId: string) => {
    setDeleting(publicId);
    try {
      const res = await fetch(`/api/upload/video?publicId=${encodeURIComponent(publicId)}`, { method: "DELETE" });
      if (res.ok) onSaved();
      else setError("Impossible de retirer cette vidéo.");
    } finally {
      setDeleting(null);
    }
  };

  const slots = Array.from({ length: MAX_PROFILE_VIDEOS }, (_, i) => i);
  const nextFree = videos.length;

  return (
    <section className={cn(CARD, className)}>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <Video className="h-5 w-5 text-fuchsia-300" /> Mes vidéos
        </h3>
        <span className="text-xs text-white/45">
          {MAX_PROFILE_VIDEOS} max · {MAX_VIDEO_SECONDS} s · avec vous dedans
        </span>
        <span className="ml-auto text-xs text-white/50">
          {videos.length}/{MAX_PROFILE_VIDEOS}
        </span>
      </div>

      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Fermer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-[repeat(2,minmax(0,128px))] gap-3">
        {slots.map((i) => {
          const video = videos[i];
          if (video) {
            const isPlaying = playing === video.publicId;
            return (
              <div key={video.publicId} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-black">
                {isPlaying ? (
                  // eslint-disable-next-line jsx-a11y/media-has-caption
                  <video src={video.url} poster={video.posterUrl} controls autoPlay playsInline className="h-full w-full object-cover" onEnded={() => setPlaying(null)} />
                ) : (
                  <button type="button" onClick={() => setPlaying(video.publicId)} className="group relative h-full w-full" aria-label="Lire la vidéo">
                    {video.posterUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={video.posterUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-white/5">
                        <Video className="h-6 w-6 text-white/40" />
                      </span>
                    )}
                    <span className="absolute inset-0 m-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition group-hover:scale-105">
                      <Play className="h-4 w-4 fill-white" />
                    </span>
                    {!!video.duration && (
                      <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[11px] text-white">{Math.round(video.duration)} s</span>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => remove(video.publicId)}
                  disabled={deleting === video.publicId}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 backdrop-blur-sm transition hover:bg-red-500/70"
                  aria-label="Supprimer la vidéo"
                >
                  {deleting === video.publicId ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                </button>
              </div>
            );
          }

          const isActive = busy && i === nextFree;
          return (
            <button
              key={`empty-${i}`}
              type="button"
              disabled={busy || i !== nextFree}
              onClick={() => gate.guard(() => inputRef.current?.click())}
              className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-violet-300/30 bg-white/[0.03] text-white/60 transition hover:border-fuchsia-300/60 hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              aria-label="Ajouter une vidéo"
            >
              {isActive ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-fuchsia-200" />
                  <span className="px-2 text-center text-[11px] text-white/70">
                    {step === "upload" ? `Envoi… ${progress ?? 0} %` : "Vérification…"}
                  </span>
                  {step === "upload" && (
                    <span className="h-1 w-3/4 overflow-hidden rounded-full bg-white/10">
                      <span className="block h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500" style={{ width: `${progress ?? 0}%` }} />
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" />
                  <span className="text-[11px]">Ajouter</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={onFile} className="sr-only" />
      {gate.modal}
    </section>
  );
}
