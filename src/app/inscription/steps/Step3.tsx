// src/app/inscription/steps/Step3.tsx

"use client";

/**
 * Étape 3 : département (métropole ou outre-mer), ville, portée de recherche.
 */

import { useFormContext } from "react-hook-form";
import { Building2, ChevronDown, MapPin } from "lucide-react";

import { DEPARTEMENTS, getVillesPourDepartement, isOutreMer } from "@/lib/locations";

import { ErrorText, Helper, INPUT, IconField, Label, RadioDot, StepTitle, TILE, TILE_ON, cx } from "./ui";

/**
 * Portée de recherche. Un rayon en km n'a pas de sens entre territoires
 * éloignés (métropole ↔ outre-mer) : on raisonne par bassin géographique.
 */
const portees = [
  { value: "departement", label: "Mon département" },
  { value: "region", label: "Ma région" },
  { value: "france", label: "Toute la France" },
];

export default function Step3() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedLocalisation = watch("localisation") || "";
  const selectedDepartement = watch("departement") || "";
  const selectedRayon = watch("rayon") || "";

  const villesSuggerees = getVillesPourDepartement(selectedDepartement);

  return (
    <div className="space-y-6">
      <StepTitle plain="Local" accent="isation" joined>
        Indiquez votre département et votre ville pour recevoir des suggestions cohérentes — métropole comme outre-mer.
      </StepTitle>

      <IconField
        id="departement"
        label="Votre département"
        required
        icon={MapPin}
        helper={selectedDepartement && isOutreMer(selectedDepartement) ? "🌴 Territoire d’outre-mer — vos suggestions resteront dans votre bassin local." : undefined}
        right={<ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />}
      >
        <select id="departement" {...register("departement")} className={cx(INPUT, "appearance-none !bg-none pr-12", !selectedDepartement && "text-white/50")}>
          <option value="" className="bg-[#1a0b2e] text-gray-300">
            Sélectionnez votre département…
          </option>
          <optgroup label="France métropolitaine" className="bg-[#1a0b2e]">
            {DEPARTEMENTS.filter((d) => !d.outreMer).map((d) => (
              <option key={d.code} value={d.code} className="bg-[#1a0b2e] text-white">
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>
          <optgroup label="Outre-mer" className="bg-[#1a0b2e]">
            {DEPARTEMENTS.filter((d) => d.outreMer).map((d) => (
              <option key={d.code} value={d.code} className="bg-[#1a0b2e] text-white">
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>
        </select>
      </IconField>

      <div>
        <IconField id="localisation" label="Votre ville" required icon={Building2} error={errors.localisation?.message as string | undefined}>
          <input id="localisation" {...register("localisation")} type="text" autoComplete="address-level2" placeholder="Saisissez votre ville" className={INPUT} />
        </IconField>

        {villesSuggerees.length > 0 && (
          <>
            <p className="mb-3 mt-5 text-[15px] text-white/80">Villes principales :</p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {villesSuggerees.map((ville) => {
                const on = selectedLocalisation === ville;
                return (
                  <button
                    key={ville}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setValue("localisation", ville, { shouldValidate: true, shouldDirty: true, shouldTouch: true })}
                    className={cx("h-9 px-3 text-sm font-medium text-white", on ? TILE_ON : TILE)}
                  >
                    {ville}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <section role="radiogroup" aria-label="Portée de recherche">
        <Label as="p" required>
          Portée de recherche
        </Label>
        <div className="mt-3 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
          {portees.map((portee) => {
            const on = selectedRayon === portee.value;
            return (
              <label key={portee.value} className={cx("flex h-[50px] cursor-pointer items-center gap-3 px-4 focus-within:ring-2 focus-within:ring-fuchsia-400/60", on ? TILE_ON : TILE)}>
                <input type="radio" {...register("rayon")} value={portee.value} className="sr-only" />
                <RadioDot on={on} />
                <span className="text-sm font-medium text-white">{portee.label}</span>
              </label>
            );
          })}
        </div>
        <Helper>Cette portée définit l’étendue de vos suggestions de profils.</Helper>
        <ErrorText>{errors.rayon?.message as string | undefined}</ErrorText>
      </section>
    </div>
  );
}
