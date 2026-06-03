"use client";

import { useFormContext } from "react-hook-form";

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

  /**
   * Orientation actuellement sélectionnée.
   * Sert uniquement à appliquer un style visuel actif.
   */
  const selectedOrientation = watch("orientation");

  /**
   * Intentions actuellement sélectionnées.
   * Si rien n'est sélectionné, on force un tableau vide.
   */
  const selectedIntentions: string[] = watch("intentions") || [];

  /**
   * Ajoute ou retire une intention du tableau.
   *
   * shouldValidate: true permet de relancer la validation Zod.
   * shouldDirty: true indique que le champ a été modifié.
   */
  const toggleIntention = (value: string) => {
    const newIntentions = selectedIntentions.includes(value)
      ? selectedIntentions.filter((item: string) => item !== value)
      : [...selectedIntentions, value];

    setValue("intentions", newIntentions, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-2xl font-bold text-purple-300">
          Orientation et intentions
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Ces informations nous aident à proposer des rencontres plus
          compatibles avec vos attentes.
        </p>
      </div>

      {/* Bloc orientation */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Orientation <span className="text-pink-400">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {orientations.map((orientation) => {
            const isSelected = selectedOrientation === orientation.value;

            return (
              <label
                key={orientation.value}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:bg-white/10 hover:border-purple-300"
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
          <p className="mt-1 text-sm text-red-300">
            {errors.orientation.message as string}
          </p>
        )}
      </div>

      {/* Bloc intentions */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-100">
            Quelles sont vos intentions ?{" "}
            <span className="text-pink-400">*</span>
          </label>

          <p className="text-sm text-gray-300 mt-2">
            Sélectionnez une ou plusieurs options.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {intentions.map((intention) => {
            const isSelected = selectedIntentions.includes(intention.value);

            return (
              <button
                key={intention.value}
                type="button"
                onClick={() => toggleIntention(intention.value)}
                className={`p-4 border rounded-xl text-left transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:bg-white/10 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`h-5 w-5 border rounded-md mr-3 flex items-center justify-center ${
                      isSelected
                        ? "bg-pink-500 border-pink-500"
                        : "border-gray-300 bg-white/5"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
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

        {/* 
          Champ caché supprimé volontairement.
          Ici, on gère intentions via setValue("intentions", newIntentions).
          Ajouter un input hidden avec register("intentions") peut créer
          des comportements bizarres avec un tableau.
        */}

        {errors.intentions && (
          <p className="mt-1 text-sm text-red-300">
            {errors.intentions.message as string}
          </p>
        )}
      </div>
    </div>
  );
}