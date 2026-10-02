// src/app/inscription/steps/Step5.tsx

"use client";

/**
 * Étape 5 : visibilité du profil + consentement.
 * Les `value` sont celles enregistrées en base : ne pas les renommer.
 */

import { useFormContext } from "react-hook-form";
import { Crown, Eye, Ghost, Lock, type LucideIcon } from "lucide-react";

import { CheckBox, ErrorText, Helper, Label, RadioDot, StepTitle, TILE, TILE_ON, cx } from "./ui";

const optionsVisibilite: { value: string; label: string; description: string; icon: LucideIcon }[] = [
  { value: "public", label: "Profil public", description: "Votre profil peut être visible par les membres compatibles.", icon: Eye },
  { value: "matches", label: "Seulement mes matches", description: "Votre profil est visible uniquement par vos correspondances.", icon: Lock },
  { value: "premium", label: "Membres premium", description: "Votre profil est priorisé auprès des membres premium.", icon: Crown },
  { value: "invisible", label: "Mode discret", description: "Votre profil reste plus confidentiel.", icon: Ghost },
];

export default function Step5() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedVisibilite = watch("visibilite") || "public";
  const consentement = watch("consentement") || false;
  const set = (name: string, value: unknown) => setValue(name, value, { shouldValidate: true, shouldDirty: true, shouldTouch: true });

  return (
    <div className="space-y-6">
      <StepTitle plain="Visibilité et" accent="confidentialité">
        Choisissez comment votre profil apparaît sur SferaLuna et confirmez votre consentement avant de continuer.
      </StepTitle>

      <section role="radiogroup" aria-label="Visibilité du profil">
        <Label as="h3" required>
          <span className="text-lg">Visibilité du profil</span>
        </Label>
        <Helper>Vous pourrez modifier ce choix plus tard depuis votre espace Mon Compte.</Helper>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {optionsVisibilite.map(({ value, label, description, icon: Icon }) => {
            const on = selectedVisibilite === value;
            return (
              <button key={value} type="button" role="radio" aria-checked={on} onClick={() => set("visibilite", value)} className={cx("flex items-start gap-4 p-4 text-left", on ? TILE_ON : TILE)}>
                <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", on ? "border-fuchsia-300/60 bg-fuchsia-500/25 text-fuchsia-100" : "border-white/20 bg-white/[0.06] text-white/85")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-white">{label}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-white/70">{description}</span>
                </span>
                <RadioDot on={on} />
              </button>
            );
          })}
        </div>
        <ErrorText>{errors.visibilite?.message as string | undefined}</ErrorText>
      </section>

      <section>
        <button
          type="button"
          role="checkbox"
          aria-checked={consentement}
          onClick={() => set("consentement", !consentement)}
          className={cx(
            "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition",
            consentement ? "border-cyan-300/80 bg-emerald-500/10 shadow-[0_0_24px_-8px_rgba(34,211,238,0.7)]" : "border-violet-200/25 bg-white/[0.06] hover:border-fuchsia-300/60"
          )}
        >
          <span className="mt-0.5">
            <CheckBox on={consentement} tone="green" />
          </span>
          <span>
            <span className="block font-semibold text-white">
              J’accepte les règles de confidentialité SferaLuna <span className="text-pink-400">*</span>
            </span>
            <span className="mt-1.5 block text-sm leading-relaxed text-white/75">
              J’accepte que mes informations soient utilisées pour créer mon profil, améliorer mes suggestions et sécuriser mon expérience.
            </span>
          </span>
        </button>
        <ErrorText>{errors.consentement?.message as string | undefined}</ErrorText>
      </section>
    </div>
  );
}
