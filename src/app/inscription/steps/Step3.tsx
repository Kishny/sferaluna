// src/app/inscription/steps/Step3.tsx

"use client";

/**
 * Étape 3 du formulaire d'inscription SferaLuna.
 *
 * Objectif :
 * - choisir son département (métropole ou outre-mer) ;
 * - préciser sa ville ;
 * - définir la portée de recherche ;
 * - garder une UX fluide sur mobile.
 */

import { useFormContext } from "react-hook-form";
import {
  DEPARTEMENTS,
  getVillesPourDepartement,
  isOutreMer,
} from "@/lib/locations";

/**
 * Portée de recherche proposée.
 * Le « rayon » historique en km n'avait pas de sens entre territoires
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

  const handleLocalisationClick = (ville: string) => {
    setValue("localisation", ville, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-xl font-bold text-purple-300 sm:text-2xl">
          Localisation
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Indiquez votre département et votre ville pour recevoir des
          suggestions cohérentes — métropole comme outre-mer.
        </p>
      </div>

      {/* Département */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Votre département <span className="text-pink-400">*</span>
        </label>

        <select
          {...register("departement")}
          className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
        >
          <option value="" className="bg-[#1a0b2e] text-gray-300">
            Sélectionnez votre département…
          </option>

          <optgroup label="France métropolitaine" className="bg-[#1a0b2e]">
            {DEPARTEMENTS.filter((d) => !d.outreMer).map((d) => (
              <option
                key={d.code}
                value={d.code}
                className="bg-[#1a0b2e] text-white"
              >
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>

          <optgroup label="Outre-mer" className="bg-[#1a0b2e]">
            {DEPARTEMENTS.filter((d) => d.outreMer).map((d) => (
              <option
                key={d.code}
                value={d.code}
                className="bg-[#1a0b2e] text-white"
              >
                {d.code} — {d.nom}
              </option>
            ))}
          </optgroup>
        </select>

        {selectedDepartement && isOutreMer(selectedDepartement) && (
          <p className="text-xs text-purple-200">
            🌴 Territoire d&apos;outre-mer — tes suggestions resteront dans ton
            bassin local.
          </p>
        )}
      </section>

      {/* Ville */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Votre ville <span className="text-pink-400">*</span>
        </label>

        <input
          {...register("localisation")}
          type="text"
          placeholder="Saisissez votre ville"
          className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
        />

        <div>
          <p className="mb-3 text-sm text-gray-300">Villes principales :</p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {villesSuggerees.map((ville) => {
              const isSelected = selectedLocalisation === ville;

              return (
                <button
                  key={ville}
                  type="button"
                  onClick={() => handleLocalisationClick(ville)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                    isSelected
                      ? "border-pink-400 bg-pink-500/20 text-white shadow-lg shadow-pink-500/10"
                      : "border-white/25 bg-white/5 text-gray-100 hover:border-purple-300 hover:bg-white/10"
                  }`}
                >
                  {ville}
                </button>
              );
            })}
          </div>
        </div>

        {errors.localisation && (
          <p className="text-sm text-red-300">
            {errors.localisation.message as string}
          </p>
        )}
      </section>

      {/* Portée de recherche */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Portée de recherche <span className="text-pink-400">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          {portees.map((portee) => {
            const isSelected = selectedRayon === portee.value;

            return (
              <label
                key={portee.value}
                className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all sm:p-4 ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  {...register("rayon")}
                  value={portee.value}
                  className="h-4 w-4 accent-pink-500"
                />

                <span
                  className={`ml-3 text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-100"
                  }`}
                >
                  {portee.label}
                </span>
              </label>
            );
          })}
        </div>

        <p className="text-sm text-gray-300">
          Cette portée définit l&apos;étendue de tes suggestions de profils.
        </p>

        {errors.rayon && (
          <p className="text-sm text-red-300">
            {errors.rayon.message as string}
          </p>
        )}
      </section>
    </div>
  );
}
