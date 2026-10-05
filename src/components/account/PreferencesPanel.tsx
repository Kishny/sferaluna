// src/components/account/PreferencesPanel.tsx

"use client";

/**
 * Mon compte → Préférences : intentions, orientation, visibilité du profil
 * et Mode Fantôme.
 *
 * Intentions, orientation et visibilité forment un brouillon enregistré par
 * la barre du bas. Le Mode Fantôme s'active immédiatement (interrupteur).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Check,
  Compass,
  Crown,
  Eye,
  Ghost,
  Globe2,
  Heart,
  HeartHandshake,
  Lock,
  MessageCircle,
  SlidersHorizontal,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";

import { AccountHeader, CARD, CardHead, SaveBar, Toggle, useUnsavedWarning } from "@/components/account/kit";
import { cn } from "@/components/site/ui";
import { INTENTION_LABELS, ORIENTATION_LABELS } from "@/lib/compatibility";

export type Visibility = "public" | "matches" | "premium" | "invisible";

export type PreferencesDraft = {
  orientation?: string;
  intentions: string[];
  visibilite: Visibility;
  orientationChangedAt?: string | null;
};

const INTENTION_META: Record<string, { icon: LucideIcon; text: string }> = {
  "rencontre-serieuse": { icon: Heart, text: "Construire une relation durable" },
  amitie: { icon: Users, text: "Élargir mon cercle d’amies" },
  aventure: { icon: Compass, text: "Vivre de nouvelles expériences" },
  reseautage: { icon: Briefcase, text: "Rencontres professionnelles" },
  discussion: { icon: MessageCircle, text: "Échanger, sans pression" },
};

const VISIBILITY_OPTIONS: { value: Exclude<Visibility, "invisible">; icon: LucideIcon; title: string; text: string }[] = [
  { value: "public", icon: Globe2, title: "Profil public", text: "Toutes les membres peuvent découvrir votre profil." },
  { value: "matches", icon: HeartHandshake, title: "Seulement mes matchs", text: "Votre profil détaillé n’est visible que par vos matchs." },
  { value: "premium", icon: Crown, title: "Membres abonnées", text: "Visible par les membres avec une offre payante et par vos matchs." },
];

const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

export default function PreferencesPanel({
  user,
  savedUser,
  updateDraft,
  canGhost,
  onGhostChange,
  onSave,
  onCancel,
  onHome,
  isSaving,
  error,
}: {
  user: PreferencesDraft;
  savedUser: PreferencesDraft;
  updateDraft: (key: keyof PreferencesDraft, value: unknown) => void;
  canGhost: boolean;
  onGhostChange: (visibility: Visibility) => Promise<void>;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
  onHome: () => void;
  isSaving: boolean;
  error?: string;
}) {
  const [ghostLoading, setGhostLoading] = useState(false);

  const dirty = useMemo(
    () =>
      (user.orientation || "") !== (savedUser.orientation || "") ||
      JSON.stringify(user.intentions ?? []) !== JSON.stringify(savedUser.intentions ?? []) ||
      user.visibilite !== savedUser.visibilite,
    [user, savedUser]
  );
  useUnsavedWarning(dirty);

  const ghost = savedUser.visibilite === "invisible";

  const toggleGhost = async () => {
    if (!canGhost || ghostLoading) return;
    if (dirty) onCancel(); // le Mode Fantôme s'enregistre tout de suite : on repart d'un état propre
    setGhostLoading(true);
    try {
      await onGhostChange(ghost ? "public" : "invisible");
    } finally {
      setGhostLoading(false);
    }
  };

  // Orientation : modifiable une fois par an.
  const lastChange = user.orientationChangedAt ? new Date(user.orientationChangedAt).getTime() : NaN;
  const locked = !Number.isNaN(lastChange) && Date.now() - lastChange < ONE_YEAR;
  const nextChange = locked
    ? new Date(lastChange + ONE_YEAR).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const orientationChanged = (user.orientation || "") !== (savedUser.orientation || "");

  const toggleIntention = (value: string) => {
    const list = user.intentions ?? [];
    updateDraft("intentions", list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  return (
    <div className="pb-4">
      <AccountHeader
        icon={SlidersHorizontal}
        title="Préférences"
        subtitle="Vos intentions, votre orientation et la visibilité de votre profil."
        onHome={onHome}
      />

      <div className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* ── Colonne gauche ── */}
          <div className="min-w-0 space-y-4">
            <section className={CARD}>
              <CardHead
                icon={Sparkles}
                iconClass="text-amber-200"
                title="Ce que je recherche"
                subtitle="Plusieurs choix possibles. Elles servent à calculer vos affinités."
                aside={<span className="text-xs text-white/45">{(user.intentions ?? []).length} choisie{(user.intentions ?? []).length > 1 ? "s" : ""}</span>}
              />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {Object.entries(INTENTION_LABELS).map(([value, label]) => {
                  const meta = INTENTION_META[value] ?? { icon: Heart, text: "" };
                  const on = (user.intentions ?? []).includes(value);
                  return (
                    <OptionTile key={value} selected={on} onClick={() => toggleIntention(value)} icon={meta.icon} title={label} text={meta.text} multi />
                  );
                })}
              </div>
            </section>

            <section className={CARD}>
              <CardHead icon={Heart} iconClass="text-pink-400" title="Orientation" subtitle="Modifiable une fois par an." />
              {locked && (
                <p className="mb-3 flex items-start gap-2 rounded-xl border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
                  <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Vous avez déjà modifié votre orientation cette année. Prochain changement possible le {nextChange}.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {Object.entries(ORIENTATION_LABELS).map(([value, label]) => {
                  const on = user.orientation === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={locked}
                      onClick={() => updateDraft("orientation", value)}
                      aria-pressed={on}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition disabled:cursor-not-allowed",
                        on
                          ? "border-fuchsia-300/70 bg-gradient-to-r from-fuchsia-500/30 to-pink-500/25 text-white"
                          : "border-violet-300/25 bg-white/[0.03] text-white/75 hover:border-fuchsia-300/50 hover:text-white disabled:opacity-50 disabled:hover:border-violet-300/25"
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>
              {orientationChanged && !locked && (
                <p className="mt-3 text-xs text-amber-200/90">
                  Après l’enregistrement, vous ne pourrez plus modifier votre orientation pendant un an.
                </p>
              )}
            </section>
          </div>

          {/* ── Colonne droite ── */}
          <div className="min-w-0 space-y-4">
            <section className={cn(CARD, ghost && "opacity-60")}>
              <CardHead icon={Eye} title="Visibilité du profil" subtitle="Qui peut voir votre profil détaillé." />
              {ghost && (
                <p className="mb-3 rounded-xl border border-violet-300/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                  Le Mode Fantôme masque actuellement votre profil. Désactivez-le pour choisir une autre visibilité.
                </p>
              )}
              <div className="space-y-2.5">
                {VISIBILITY_OPTIONS.map((o) => (
                  <OptionTile
                    key={o.value}
                    selected={!ghost && user.visibilite === o.value}
                    disabled={ghost}
                    onClick={() => updateDraft("visibilite", o.value)}
                    icon={o.icon}
                    title={o.title}
                    text={o.text}
                  />
                ))}
              </div>
            </section>

            <section
              className={cn(
                "rounded-3xl border p-4 backdrop-blur-xl sm:p-5",
                ghost ? "border-violet-300/45 bg-gradient-to-br from-violet-600/25 to-fuchsia-600/15" : "border-violet-300/[0.14] bg-[#1b0d38]/75"
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", ghost ? "bg-violet-400/25" : "bg-white/[0.06]")}>
                  <Ghost className="h-5 w-5 text-violet-100" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">Mode Fantôme</p>
                    {ghost && <span className="rounded-full bg-violet-400/25 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-100">Actif</span>}
                    {!canGhost && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                        <Crown className="h-3 w-3" /> Premium ou Elite
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/60">
                    {ghost
                      ? "Votre profil n’apparaît plus dans les découvertes ni les recherches."
                      : "Naviguez discrètement : votre profil disparaît des découvertes et des recherches."}
                  </p>
                  {!canGhost && (
                    <Link href="/paiement" className="mt-2 inline-block text-xs font-semibold text-pink-300 hover:underline">
                      Voir les offres
                    </Link>
                  )}
                </div>
                <Toggle checked={ghost} onChange={toggleGhost} disabled={!canGhost} loading={ghostLoading} label="Activer ou désactiver le Mode Fantôme" />
              </div>
            </section>
          </div>
        </div>

        <SaveBar
          dirty={dirty}
          saving={isSaving}
          error={error}
          idleText="Ces préférences servent à vous proposer des profils compatibles."
          onSave={onSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
}

function OptionTile({
  selected,
  onClick,
  icon: Icon,
  title,
  text,
  disabled,
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  text: string;
  disabled?: boolean;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      role={multi ? "checkbox" : "radio"}
      aria-checked={selected}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed",
        selected
          ? "border-fuchsia-300/60 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/10 shadow-[0_10px_30px_-18px_rgba(236,72,153,0.9)]"
          : "border-violet-300/20 bg-white/[0.03] hover:border-fuchsia-300/45"
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-fuchsia-500/25" : "bg-white/[0.06]")}>
        <Icon className={cn("h-5 w-5", selected ? "text-fuchsia-100" : "text-violet-300")} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-white">{title}</span>
        {text && <span className="block text-xs text-white/55">{text}</span>}
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center border",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-transparent bg-gradient-to-r from-fuchsia-500 to-pink-500" : "border-white/25"
        )}
      >
        {selected && <Check className="h-3 w-3 text-white" />}
      </span>
    </button>
  );
}
