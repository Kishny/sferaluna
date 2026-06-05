// src/app/inscription/steps/Step2.tsx

"use client";

/**
 * Étape 2 du formulaire d'inscription SferaLuna.
 *
 * Objectif :
 * - choisir une orientation ;
 * - choisir une ou plusieurs intentions relationnelles ;
 * - mettre à jour React Hook Form avec setValue pour les tableaux ;
 * - afficher clairement les erreurs de validation.
 */

import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

/**
 * Liste des orientations proposées.
 * Les values sont celles envoyées dans MongoDB.
 */
const orientations = [
  { value: "hetero", label: "Hétérosexuelle" },
  { value: "homo", label: "Lesbienne / Homosexuelle" },
  { value: "bi", label: "Bisexuelle" },
  { value: "pan", label: "Pansexuelle" },
  { value: "curieuse", label: "Curieuse — je souhaite découvrir" },
  { value: "other", label: "Autre" },
];

/**
 * Liste des intentions relationnelles.
 * L'utilisateur peut en sélectionner plusieurs.
 */
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

  /**
   * Ajoute ou retire une intention du tableau.
   */
  const toggleIntention = (value: string) => {
    const nextIntentions = selectedIntentions.includes(value)
      ? selectedIntentions.filter((item) => item !== value)
      : [...selectedIntentions, value];

    setValue("intentions", nextIntentions, {
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
          Orientation et intentions
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Ces informations nous aident à proposer des rencontres plus
          compatibles avec vos attentes.
        </p>
      </div>

      {/* Bloc orientation */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Orientation <span className="text-pink-400">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {orientations.map((orientation) => {
            const isSelected = selectedOrientation === orientation.value;

            return (
              <label
                key={orientation.value}
                className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all sm:p-4 ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  {...register("orientation")}
                  value={orientation.value}
                  className="h-4 w-4 accent-pink-500"
                />

                <span
                  className={`ml-3 text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-100"
                  }`}
                >
                  {orientation.label}
                </span>
              </label>
            );
          })}
        </div>

        {errors.orientation && (
          <p className="text-sm text-red-300">
            {errors.orientation.message as string}
          </p>
        )}
      </section>

      {/* Bloc intentions */}
      <section className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-100">
            Quelles sont vos intentions ?{" "}
            <span className="text-pink-400">*</span>
          </label>

          <p className="mt-2 text-sm text-gray-300">
            Sélectionnez une ou plusieurs options.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {intentions.map((intention) => {
            const isSelected = selectedIntentions.includes(intention.value);

            return (
              <button
                key={intention.value}
                type="button"
                onClick={() => toggleIntention(intention.value)}
                className={`rounded-xl border p-3 text-left transition-all sm:p-4 ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`mr-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      isSelected
                        ? "border-pink-500 bg-pink-500"
                        : "border-gray-300 bg-white/5"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>

                  <span
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-gray-100"
                    }`}
                  >
                    {intention.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {errors.intentions && (
          <p className="text-sm text-red-300">
            {errors.intentions.message as string}
          </p>
        )}
      </section>
    </div>
  );
}