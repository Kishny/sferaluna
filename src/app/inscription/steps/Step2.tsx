// src/app/inscription/steps/Step2.tsx

"use client";

/**
 * Étape 2 : orientation (choix unique) et intentions (choix multiples).
 * Les `value` sont celles enregistrées en base : ne pas les renommer.
 */

import { useFormContext } from "react-hook-form";

import { CheckBox, ErrorText, Helper, Label, RadioDot, StepTitle, TILE, TILE_ON, cx } from "./ui";

const orientations = [
  { value: "hetero", label: "Hétérosexuelle" },
  { value: "homo", label: "Lesbienne / Homosexuelle" },
  { value: "bi", label: "Bisexuelle" },
  { value: "pan", label: "Pansexuelle" },
  { value: "curieuse", label: "Curieuse — je souhaite découvrir" },
  { value: "other", label: "Autre" },
];

const intentions = [
  { value: "rencontre-serieuse", label: "Rencontre sérieuse" },
  { value: "amitie", label: "Amitié" },
  { value: "aventure", label: "Aventure" },
  { value: "reseautage", label: "Réseautage" },
  { value: "discussion", label: "Discussion" },
];

export default function Step2() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedOrientation = watch("orientation");
  const selectedIntentions: string[] = watch("intentions") || [];

  const toggleIntention = (value: string) => {
    const next = selectedIntentions.includes(value) ? selectedIntentions.filter((item) => item !== value) : [...selectedIntentions, value];
    setValue("intentions", next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  return (
    <div className="space-y-7">
      <StepTitle plain="Orientation" accent="et intentions">
        Ces informations nous aident à proposer des rencontres plus compatibles avec vos attentes.
      </StepTitle>

      <section role="radiogroup" aria-label="Orientation">
        <Label as="p" required>
          Orientation
        </Label>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {orientations.map((orientation) => {
            const on = selectedOrientation === orientation.value;
            return (
              <label key={orientation.value} className={cx("flex h-[54px] cursor-pointer items-center gap-4 px-5 focus-within:ring-2 focus-within:ring-fuchsia-400/60", on ? TILE_ON : TILE)}>
                <input type="radio" {...register("orientation")} value={orientation.value} className="sr-only" />
                <RadioDot on={on} />
                <span className="text-[15px] font-medium text-white">{orientation.label}</span>
              </label>
            );
          })}
        </div>
        <ErrorText>{errors.orientation?.message as string | undefined}</ErrorText>
      </section>

      <section>
        <Label as="p" required>
          Quelles sont vos intentions ?
        </Label>
        <Helper>Sélectionnez une ou plusieurs options.</Helper>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {intentions.map((intention) => {
            const on = selectedIntentions.includes(intention.value);
            return (
              <button
                key={intention.value}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleIntention(intention.value)}
                className={cx("flex h-[50px] items-center gap-4 px-5 text-left", on ? TILE_ON : TILE)}
              >
                <CheckBox on={on} />
                <span className="text-[15px] font-medium text-white">{intention.label}</span>
              </button>
            );
          })}
        </div>
        <ErrorText>{errors.intentions?.message as string | undefined}</ErrorText>
      </section>
    </div>
  );
}
