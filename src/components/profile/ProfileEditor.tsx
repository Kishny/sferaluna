// src/components/profile/ProfileEditor.tsx

"use client";

/**
 * Mon compte → Mon profil.
 *
 * - Résumé (photo, identité, complétion, aperçu public).
 * - Colonne gauche : bio, intentions, centres d'intérêt, valeurs, langues
 *   (modifiables directement).
 * - Colonne droite : photos, vidéos, selfie, infos principales et sécurité
 *   (bouton « Modifier » par carte).
 * - Barre d'enregistrement collante en bas.
 *
 * Les photos et vidéos s'enregistrent immédiatement ; le reste est un
 * brouillon envoyé par « Enregistrer les modifications ».
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AtSign,
  BadgeCheck,
  Briefcase,
  Cake,
  Camera,
  Check,
  ChevronRight,
  Eye,
  FileText,
  Gem,
  Heart,
  Image as ImageIcon,
  KeyRound,
  Languages,
  Leaf,
  Loader2,
  Lock,
  Mail,
  Map as MapIcon,
  MapPin,
  Pencil,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
  type LucideIcon,
} from "lucide-react";

import { AccountHeader, BTN_GRADIENT, BTN_OUTLINE, CARD, CardHead, SaveBar, useUnsavedWarning } from "@/components/account/kit";
import ChipEditor from "@/components/profile/ChipEditor";
import VideosSection, { type ProfileVideo } from "@/components/profile/VideosSection";
import { useSelfieGate } from "@/components/photo-verification/SelfieGate";
import { cn } from "@/components/site/ui";
import {
  INTENTION_LABELS,
  INTEREST_LABELS,
  LANGUAGE_OPTIONS,
  LIFESTYLE_OPTIONS,
  VALUE_OPTIONS,
  intentionLabel,
  interestLabel,
} from "@/lib/compatibility";
import { DEPARTEMENTS, getDepartementNom } from "@/lib/locations";
import { MAX_PROFILE_PHOTOS } from "@/lib/media-limits";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ProfileDraft = {
  _id?: string;
  id?: string;
  email: string;
  pseudonyme: string;
  image?: string;
  photos?: string[];
  videos?: ProfileVideo[];
  bio?: string;
  age?: number;
  intentions: string[];
  localisation?: string;
  departement?: string;
  rayon?: string;
  profession?: string;
  valeurs?: string[];
  modeDeVie?: string;
  langues?: string[];
  interets: string[];
  question?: string;
  reponse?: string;
  hasReponse?: boolean;
  photoVerified?: boolean;
  photoVerificationStatus?: "none" | "verified" | "needs_review";
  pseudonymeChangedAt?: string | null;
};

type Update = (key: keyof ProfileDraft, value: unknown) => void;

/** Champs envoyés par « Enregistrer » (photos et vidéos s'enregistrent à part). */
const DRAFT_KEYS: (keyof ProfileDraft)[] = [
  "pseudonyme",
  "age",
  "bio",
  "intentions",
  "localisation",
  "departement",
  "rayon",
  "profession",
  "valeurs",
  "modeDeVie",
  "langues",
  "interets",
  "question",
];

const RAYON_LABELS: Record<string, string> = {
  departement: "Mon département",
  region: "Ma région",
  france: "Toute la France",
};

// ─────────────────────────────────────────────
// Composant principal
// ─────────────────────────────────────────────

export default function ProfileEditor({
  user,
  savedUser,
  updateDraft,
  onMediaChange,
  onSave,
  onCancel,
  onHome,
  isSaving,
  error,
  completion,
}: {
  user: ProfileDraft;
  savedUser: ProfileDraft;
  updateDraft: Update;
  onMediaChange: () => void;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
  onHome: () => void;
  isSaving: boolean;
  error?: string;
  completion: number;
}) {
  const [editInfos, setEditInfos] = useState(false);
  const [editSecurity, setEditSecurity] = useState(false);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const dirty = useMemo(
    () =>
      DRAFT_KEYS.some((k) => JSON.stringify(user[k] ?? null) !== JSON.stringify(savedUser[k] ?? null)) ||
      Boolean(user.reponse?.trim()),
    [user, savedUser]
  );

  useUnsavedWarning(dirty);

  const userId = user._id || user.id;
  const previewHref = userId ? `/profil/${userId}?preview=1` : null;

  const onAvatarUploaded = (url: string) => {
    updateDraft("image", url);
    onMediaChange();
  };

  const startEditing = () => {
    setEditInfos(true);
    setEditSecurity(true);
    bioRef.current?.focus({ preventScroll: true });
    bioRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const save = async () => {
    const ok = await onSave();
    if (ok) {
      setEditInfos(false);
      setEditSecurity(false);
    }
  };

  const cancel = () => {
    onCancel();
    setEditInfos(false);
    setEditSecurity(false);
  };

  return (
    <div className="pb-4">
      <AccountHeader icon={Sparkles} title="Mon profil" subtitle="Photos, bio et informations visibles par les autres membres." onHome={onHome} />

      <div className="space-y-4">
        <SummaryCard user={user} completion={completion} previewHref={previewHref} onEdit={startEditing} onAvatarUploaded={onAvatarUploaded} />

        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          {/* ── Colonne gauche ── */}
          <div className="min-w-0 space-y-4">
            <section className={CARD}>
              <CardHead icon={FileText} title="Ma bio" aside={<span className="text-xs text-white/45">{(user.bio || "").length}/500</span>} />
              <textarea
                ref={bioRef}
                value={user.bio || ""}
                onChange={(e) => updateDraft("bio", e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Décrivez-vous en quelques mots… vos passions, ce que vous recherchez…"
                className="input-luna min-h-[110px] resize-y"
              />
            </section>

            <section className={CARD}>
              <CardHead icon={Search} title="Ma recherche / intentions" />
              <ChipEditor
                values={user.intentions || []}
                onChange={(next) => updateDraft("intentions", next)}
                options={Object.entries(INTENTION_LABELS).map(([value, label]) => ({ value, label }))}
                labelFor={intentionLabel}
                emptyText="Dites ce que vous recherchez sur SferaLuna."
              />
            </section>

            <section className={CARD}>
              <CardHead icon={Heart} iconClass="text-pink-400 fill-pink-400/80" title="Centres d’intérêt" aside={<Counter n={(user.interets || []).length} max={10} />} />
              <ChipEditor
                values={user.interets || []}
                onChange={(next) => updateDraft("interets", next)}
                options={Object.entries(INTEREST_LABELS).map(([value, label]) => ({ value, label }))}
                labelFor={interestLabel}
                allowCustom
                max={10}
                placeholder="Autre centre d’intérêt…"
                emptyText="Ajoutez ce qui vous passionne."
              />
            </section>

            <section className={CARD}>
              <CardHead icon={Gem} iconClass="text-fuchsia-300" title="Valeurs importantes (5 max)" aside={<Counter n={(user.valeurs || []).length} max={5} />} />
              <ChipEditor
                values={user.valeurs || []}
                onChange={(next) => updateDraft("valeurs", next)}
                options={VALUE_OPTIONS.map((v) => ({ value: v, label: v }))}
                max={5}
                emptyText="Choisissez jusqu’à 5 valeurs."
              />
            </section>

            <section className={CARD}>
              <CardHead icon={Languages} title="Langues parlées" aside={<Counter n={(user.langues || []).length} max={6} />} />
              <ChipEditor
                values={user.langues || []}
                onChange={(next) => updateDraft("langues", next)}
                options={LANGUAGE_OPTIONS.map((v) => ({ value: v, label: v }))}
                allowCustom
                max={6}
                placeholder="Autre langue…"
                emptyText="Quelles langues parlez-vous ?"
              />
            </section>
          </div>

          {/* ── Colonne droite ── */}
          <div className="min-w-0 space-y-4">
            <PhotosCard user={user} onAvatarUploaded={onAvatarUploaded} onMediaChange={onMediaChange} />

            <VideosSection videos={user.videos ?? []} onSaved={onMediaChange} />

            <SelfieCard user={user} />

            <InfosCard user={user} updateDraft={updateDraft} editing={editInfos} setEditing={setEditInfos} />

            <SecurityCard user={user} updateDraft={updateDraft} editing={editSecurity} setEditing={setEditSecurity} />
          </div>
        </div>

        <SaveBar
          dirty={dirty}
          saving={isSaving}
          error={error}
          idleText="Ces informations apparaissent sur votre profil détaillé."
          onSave={save}
          onCancel={cancel}
          extra={
            previewHref ? (
              <Link href={previewHref} target="_blank" className={cn(BTN_OUTLINE, "h-11 px-3.5 text-sm sm:px-4")} aria-label="Voir mon profil comme les autres membres">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Voir mon profil public</span>
              </Link>
            ) : null
          }
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Résumé
// ─────────────────────────────────────────────

function SummaryCard({
  user,
  completion,
  previewHref,
  onEdit,
  onAvatarUploaded,
}: {
  user: ProfileDraft;
  completion: number;
  previewHref: string | null;
  onEdit: () => void;
  onAvatarUploaded: (url: string) => void;
}) {
  const city = user.localisation || getDepartementNom(user.departement) || "";
  const meta = [user.age ? `${user.age} ans` : "", city, user.rayon ? RAYON_LABELS[user.rayon] || "" : ""].filter(Boolean);

  return (
    <section className={cn(CARD, "flex flex-col gap-5 sm:p-6 xl:flex-row xl:items-center xl:gap-6")}>
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        <AvatarButton image={user.image} name={user.pseudonyme} size="lg" onUploaded={onAvatarUploaded} />
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <span className="truncate">{user.pseudonyme || "Mon profil"}</span>
            {user.photoVerified && <BadgeCheck className="h-5 w-5 shrink-0 text-sky-300" aria-label="Photos vérifiées" />}
          </h2>
          {meta.length > 0 && <p className="mt-1 text-sm text-white/65">{meta.join(" • ")}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <SummaryChip icon={Briefcase} muted={!user.profession}>
              {user.profession || "Profession non renseignée"}
            </SummaryChip>
            <SummaryChip icon={Leaf} muted={!user.modeDeVie}>
              {user.modeDeVie || "Mode de vie non renseigné"}
            </SummaryChip>
          </div>
        </div>
      </div>

      <div className="min-w-0 border-white/10 xl:w-[320px] xl:shrink-0 xl:border-l xl:pl-6">
        <p className="text-sm font-semibold">Profil complété</p>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-pink-400 to-violet-400 transition-all" style={{ width: `${completion}%` }} />
          </div>
          <span className="text-sm font-semibold text-white/85">{completion}%</span>
        </div>
        <p className="mt-2 text-xs text-white/55">
          {completion >= 100 ? "Votre profil est complet. Bravo ✨" : "Plus votre profil est complet, plus vous avez de chances de faire de belles rencontres. ✨"}
        </p>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row xl:w-[240px] xl:shrink-0 xl:flex-col">
        {previewHref && (
          <Link href={previewHref} target="_blank" className={cn(BTN_OUTLINE, "h-11 px-5 text-sm sm:flex-1 xl:flex-none")}>
            <Eye className="h-4 w-4" /> Aperçu du profil public
          </Link>
        )}
        <button type="button" onClick={onEdit} className={cn(BTN_GRADIENT, "h-11 px-5 text-sm sm:flex-1 xl:flex-none")}>
          <Pencil className="h-4 w-4" /> Modifier le profil
        </button>
      </div>
    </section>
  );
}

function SummaryChip({ icon: Icon, muted, children }: { icon: LucideIcon; muted?: boolean; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-xl border border-violet-300/20 bg-white/[0.04] px-3 py-1.5 text-xs", muted ? "text-white/50" : "text-white/85")}>
      <Icon className="h-3.5 w-3.5 text-violet-300" />
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// Photo principale (avatar) : partagée entre le résumé et la carte Photos
// ─────────────────────────────────────────────

function AvatarButton({
  image,
  name,
  size,
  onUploaded,
}: {
  image?: string;
  name: string;
  size: "lg" | "tile";
  onUploaded: (url: string) => void;
}) {
  const { open, uploading, preview, message, modal, input } = useAvatarPicker(onUploaded);
  const src = preview || image;

  if (size === "tile") {
    return (
      <div className="relative">
        <div className="relative aspect-[1/1] overflow-hidden rounded-xl border border-fuchsia-300/40 bg-white/5">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Photo principale" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-white/60">{name.charAt(0).toUpperCase()}</span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/55">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
          <button
            type="button"
            onClick={open}
            disabled={uploading}
            className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur hover:bg-fuchsia-500/80"
            aria-label="Changer la photo principale"
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
        <span className="mt-1 block truncate text-center text-[10px] font-medium text-fuchsia-100/80">Photo principale</span>
        {message && <span className={cn("mt-1 block text-center text-[10px]", message.ok ? "text-emerald-300" : "text-red-300")}>{message.text}</span>}
        {input}
        {modal}
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <div className="h-24 w-24 overflow-hidden rounded-full border-2 border-fuchsia-300/50 bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-[0_0_30px_-8px_rgba(232,121,249,0.8)] sm:h-28 sm:w-28">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl font-bold">{name.charAt(0).toUpperCase()}</span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55">
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={open}
        disabled={uploading}
        className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-[#1b0d38] text-white shadow-lg transition hover:bg-fuchsia-500"
        aria-label="Changer la photo de profil"
      >
        <Camera className="h-4 w-4" />
      </button>
      {message && !message.ok && <span className="absolute -bottom-6 left-0 w-48 text-xs text-red-300">{message.text}</span>}
      {input}
      {modal}
    </div>
  );
}

/**
 * Envoi de la photo principale (/api/upload/avatar).
 * La route enregistre directement la photo ; on prévient ensuite la page
 * pour qu'elle recharge le profil (photo + statut de vérification).
 */
function useAvatarPicker(onUploaded: (url: string) => void) {
  const gate = useSelfieGate("avatar");
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setMessage(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", headers: { "X-SferaLuna-Client": "web" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setMessage({ ok: false, text: data?.error ?? "Erreur lors de l’envoi." });
        setPreview(null);
        return;
      }
      setMessage({ ok: true, text: "Photo mise à jour" });
      onUploaded(data.imageUrl);
    } catch {
      setMessage({ ok: false, text: "Erreur de connexion au serveur." });
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return {
    open: () => gate.guard(() => inputRef.current?.click()),
    uploading,
    preview,
    message,
    modal: gate.modal,
    input: <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />,
  };
}

// ─────────────────────────────────────────────
// Photos
// ─────────────────────────────────────────────

function PhotosCard({
  user,
  onAvatarUploaded,
  onMediaChange,
}: {
  user: ProfileDraft;
  onAvatarUploaded: (url: string) => void;
  onMediaChange: () => void;
}) {
  const photos = user.photos ?? [];
  const gate = useSelfieGate("photo");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null); // "upload" | url en suppression
  const [error, setError] = useState<string | null>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy("upload");
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/photo", { method: "POST", headers: { "X-SferaLuna-Client": "web" }, body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return setError(data?.error ?? "Erreur lors de l’envoi.");
      onMediaChange();
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (url: string) => {
    setBusy(url);
    setError(null);
    try {
      const res = await fetch(`/api/upload/photo?url=${encodeURIComponent(url)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) return setError(data?.error ?? "Erreur lors de la suppression.");
      onMediaChange();
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setBusy(null);
    }
  };

  const slots = Array.from({ length: MAX_PROFILE_PHOTOS }, (_, i) => i);

  return (
    <section className={CARD}>
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <ImageIcon className="h-5 w-5 text-fuchsia-300" /> Mes photos
        </h3>
        <span className="text-xs text-white/45">{MAX_PROFILE_PHOTOS} max · JPG, PNG, WebP · 5 Mo</span>
        <span className="ml-auto text-xs text-white/50">
          {photos.length}/{MAX_PROFILE_PHOTOS}
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

      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        <AvatarButton image={user.image} name={user.pseudonyme} size="tile" onUploaded={onAvatarUploaded} />

        {slots.map((i) => {
          const url = photos[i];
          if (url) {
            return (
              <div key={url} className="group relative aspect-[1/1] overflow-hidden rounded-xl border border-white/10 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                {busy === url ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/55">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => remove(url)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/85 backdrop-blur transition hover:bg-red-500/80 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Supprimer la photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          }

          const isNext = i === photos.length;
          return (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => gate.guard(() => inputRef.current?.click())}
              disabled={!!busy || !isNext}
              className={cn(
                "flex aspect-[1/1] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-violet-300/30 bg-white/[0.03] text-white/60 transition hover:border-fuchsia-300/60 hover:text-white",
                !isNext && "opacity-50",
                "disabled:cursor-default"
              )}
              aria-label="Ajouter une photo"
            >
              {busy === "upload" && isNext ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">Ajouter</span>
                </>
              )}
            </button>
          );
        })}
      </div>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />
      {gate.modal}
    </section>
  );
}

// ─────────────────────────────────────────────
// Selfie
// ─────────────────────────────────────────────

function SelfieCard({ user }: { user: ProfileDraft }) {
  const verified = user.photoVerified;
  const review = user.photoVerificationStatus === "needs_review";
  return (
    <section
      className={cn(
        "flex items-center gap-3 rounded-3xl border p-4 backdrop-blur-xl",
        verified ? "border-sky-300/35 bg-[#16205a]/60" : "border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/15 to-violet-500/10"
      )}
    >
      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", verified ? "bg-emerald-500/20" : "bg-fuchsia-500/20")}>
        {verified ? <Check className="h-5 w-5 text-emerald-300" /> : <ShieldCheck className="h-5 w-5 text-fuchsia-200" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{verified ? "Photos vérifiées par selfie" : review ? "Certaines photos sont à revoir" : "Vérifiez vos photos"}</p>
        <p className="text-xs text-white/60">
          {verified
            ? "Le badge « Photo vérifiée » est visible sur votre profil."
            : "Un selfie en direct prouve que vos photos sont bien les vôtres."}
        </p>
      </div>
      <Link href="/verification-photo" className={cn(BTN_OUTLINE, "h-10 shrink-0 rounded-xl px-4 text-sm")}>
        {verified ? "Gérer" : "Commencer"} <ChevronRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────
// Infos principales
// ─────────────────────────────────────────────

function InfosCard({
  user,
  updateDraft,
  editing,
  setEditing,
}: {
  user: ProfileDraft;
  updateDraft: Update;
  editing: boolean;
  setEditing: (v: boolean) => void;
}) {
  const cooldown = cooldownDate(user.pseudonymeChangedAt);

  const left: Row[] = [
    {
      icon: Sparkles,
      label: "Pseudonyme",
      value: user.pseudonyme,
      input: (
        <>
          <input value={user.pseudonyme || ""} onChange={(e) => updateDraft("pseudonyme", e.target.value)} disabled={!!cooldown} maxLength={40} className="input-luna py-2 text-sm" />
          {cooldown && <p className="mt-1 text-[11px] text-amber-300/80">Modifiable le {cooldown}</p>}
        </>
      ),
    },
    {
      icon: Cake,
      label: "Âge",
      value: user.age ? `${user.age} ans` : "",
      input: <input type="number" min={28} max={99} value={user.age || ""} onChange={(e) => updateDraft("age", Number(e.target.value) || undefined)} className="input-luna py-2 text-sm" />,
    },
    {
      icon: MapPin,
      label: "Ville",
      value: user.localisation,
      input: <input value={user.localisation || ""} onChange={(e) => updateDraft("localisation", e.target.value)} maxLength={120} placeholder="Tours, Fort-de-France…" className="input-luna py-2 text-sm" />,
    },
    {
      icon: Leaf,
      label: "Mode de vie",
      value: user.modeDeVie,
      input: (
        <select value={user.modeDeVie || ""} onChange={(e) => updateDraft("modeDeVie", e.target.value)} className="input-luna h-10 py-0 text-sm">
          <option value="">Non renseigné</option>
          {LIFESTYLE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ),
    },
  ];

  const right: Row[] = [
    { icon: Mail, label: "Email", value: user.email, input: <span className="block truncate py-1.5 text-sm text-white/60" title="L’adresse e-mail se change depuis Sécurité">{user.email}</span> },
    {
      icon: MapIcon,
      label: "Département",
      value: user.departement ? getDepartementNom(user.departement) || user.departement : "",
      input: (
        <select value={user.departement || ""} onChange={(e) => updateDraft("departement", e.target.value)} className="input-luna h-10 py-0 text-sm">
          <option value="">Non renseigné</option>
          <optgroup label="France métropolitaine">
            {DEPARTEMENTS.filter((d) => !d.outreMer).map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>
          <optgroup label="Outre-mer">
            {DEPARTEMENTS.filter((d) => d.outreMer).map((d) => (
              <option key={d.code} value={d.code}>
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>
        </select>
      ),
    },
    {
      icon: Radar,
      label: "Zone de recherche",
      value: user.rayon ? RAYON_LABELS[user.rayon] || user.rayon : "",
      input: (
        <select value={user.rayon || "departement"} onChange={(e) => updateDraft("rayon", e.target.value)} className="input-luna h-10 py-0 text-sm">
          <option value="departement">Mon département</option>
          <option value="region">Ma région</option>
          <option value="france">Toute la France</option>
        </select>
      ),
    },
    {
      icon: Briefcase,
      label: "Profession",
      value: user.profession,
      input: <input value={user.profession || ""} onChange={(e) => updateDraft("profession", e.target.value)} maxLength={80} placeholder="Architecte, infirmière…" className="input-luna py-2 text-sm" />,
    },
  ];

  return (
    <section className={CARD}>
      <CardHead icon={User} title="Infos principales" aside={<EditToggle editing={editing} onToggle={() => setEditing(!editing)} />} />
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-0">
        <RowList rows={left} editing={editing} className="md:pr-5" />
        <RowList rows={right} editing={editing} className="border-white/10 md:border-l md:pl-5" />
      </div>
    </section>
  );
}

type Row = { icon: LucideIcon; label: string; value?: string; input: ReactNode };

function RowList({ rows, editing, className = "" }: { rows: Row[]; editing: boolean; className?: string }) {
  return (
    <dl className={cn("space-y-3", className)}>
      {rows.map(({ icon: Icon, label, value, input }) => (
        <div key={label} className={cn("grid items-center gap-x-3 text-sm", editing ? "grid-cols-[18px_minmax(0,1fr)]" : "grid-cols-[18px_132px_minmax(0,1fr)]")}>
          <Icon className="h-4 w-4 text-violet-300" />
          <dt className="truncate text-[13px] text-white/60" title={label}>{label}</dt>
          {editing ? (
            <dd className="col-start-2 min-w-0">{input}</dd>
          ) : (
            <dd className={cn("min-w-0 truncate", value ? "text-white/90" : "text-white/40")} title={value || undefined}>
              {value || "Non renseigné"}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}

// ─────────────────────────────────────────────
// Sécurité
// ─────────────────────────────────────────────

function SecurityCard({
  user,
  updateDraft,
  editing,
  setEditing,
}: {
  user: ProfileDraft;
  updateDraft: Update;
  editing: boolean;
  setEditing: (v: boolean) => void;
}) {
  return (
    <section className={CARD}>
      <CardHead icon={Lock} title="Sécurité du compte" aside={<EditToggle editing={editing} onToggle={() => setEditing(!editing)} />} />
      {editing ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 text-white/60">
              <KeyRound className="h-4 w-4 text-violet-300" /> Question de sécurité
            </span>
            <input value={user.question || ""} onChange={(e) => updateDraft("question", e.target.value)} maxLength={300} placeholder="Votre question secrète" className="input-luna py-2 text-sm" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 text-white/60">
              <AtSign className="h-4 w-4 text-violet-300" /> Réponse secrète
            </span>
            <input
              value={user.reponse || ""}
              onChange={(e) => updateDraft("reponse", e.target.value)}
              placeholder={user.hasReponse ? "Laisser vide pour la conserver" : "Votre réponse secrète"}
              className="input-luna py-2 text-sm"
              autoComplete="off"
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm">
            <KeyRound className="h-4 w-4 shrink-0 text-violet-300" />
            <span className="shrink-0 text-white/60">Question</span>
            <span className={cn("ml-auto min-w-0 truncate", user.question ? "text-white/85" : "text-white/40")} title={user.question || undefined}>
              {user.question || "Non renseignée"}
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm">
            <AtSign className="h-4 w-4 shrink-0 text-violet-300" />
            <span className="shrink-0 text-white/60">Réponse</span>
            {user.hasReponse ? (
              <>
                <span className="tracking-widest text-white/70">••••••</span>
                <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-300">
                  <Check className="h-3.5 w-3.5" /> Renseignée
                </span>
              </>
            ) : (
              <span className="ml-auto text-white/40">Non renseignée</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────
// Petites briques
// ─────────────────────────────────────────────

function Counter({ n, max }: { n: number; max: number }) {
  return <span className={cn("text-xs", n >= max ? "text-amber-200" : "text-white/45")}>{n}/{max}</span>;
}

function EditToggle({ editing, onToggle }: { editing: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-violet-200/25 bg-white/[0.04] px-3 text-xs font-medium text-white/90 transition hover:border-fuchsia-300/60"
    >
      {editing ? <Check className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
      {editing ? "Terminé" : "Modifier"}
    </button>
  );
}

function cooldownDate(changedAt?: string | null) {
  if (!changedAt) return null;
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
  const last = new Date(changedAt).getTime();
  if (Number.isNaN(last) || Date.now() - last >= ONE_YEAR) return null;
  return new Date(last + ONE_YEAR).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
