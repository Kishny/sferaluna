// src/app/inscription/steps/Step3.tsx

"use client";

/**
 * Étape 3 du formulaire d'inscription SferaLuna.
 *
 * Objectif :
 * - définir une localisation ;
 * - choisir un rayon de recherche ;
 * - proposer des villes rapides ;
 * - garder une UX fluide sur mobile.
 */

import { useFormContext } from "react-hook-form";

/**
 * Rayons de recherche proposés.
 * Ces valeurs sont envoyées dans MongoDB via le champ "rayon".
 */
const rayons = [
  { value: "5 km", label: "5 km" },
  { value: "10 km", label: "10 km" },
  { value: "25 km", label: "25 km" },
  { value: "50 km", label: "50 km" },
  { value: "100 km", label: "100 km" },
  { value: "region", label: "Toute la région" },
  { value: "france", label: "Toute la France" },
];

/**
 * Villes rapides proposées.
 */
const villesPrincipales = [
  "Paris",
  "Lyon",
  "Marseille",
  "Toulouse",
  "Bordeaux",
  "Lille",
  "Nantes",
  "Strasbourg",
  "Rennes",
  "Reims",
  "Le Mans",
  "Toulon",
  "Aix-en-Provence",
  "Clermont-Ferrand",
  "Limoges",
  "Tours",
  "Versailles",
  "Amiens",
  "Orléans",
  "Mulhouse",
  "Rouen",
  "Nancy",
  "Besançon",
  "Troyes",
  "Dijon",
  "Grenoble",
  "Saint-Etienne",
  "Brest",
  "Ajaccio",
  "Nice",
  "Saint-Denis",
  "Saint-Pierre",
  "Saint-Paul",
  "Saint-Benoit",
  "Saint-Louis",
  "Saint-Louis",
];

export default function Step3() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedLocalisation = watch("localisation") || "";
  const selectedRayon = watch("rayon") || "";

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
          Indiquez votre zone de recherche pour recevoir des suggestions proches
          de vous.
        </p>
      </div>

      {/* Champ localisation */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Où êtes-vous situé(e) ? <span className="text-pink-400">*</span>
        </label>

        <input
          {...register("localisation")}
          type="text"
          placeholder="Saisissez votre ville ou code postal"
          className="w-full rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
        />

        <div>
          <p className="mb-3 text-sm text-gray-300">Villes principales :</p>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {villesPrincipales.map((ville) => {
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

      {/* Rayon de recherche */}
      <section className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Rayon de recherche <span className="text-pink-400">*</span>
        </label>

        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3">
          {rayons.map((rayon) => {
            const isSelected = selectedRayon === rayon.value;

            return (
              <label
                key={rayon.value}
                className={`flex cursor-pointer items-center rounded-xl border p-3 transition-all sm:p-4 ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  {...register("rayon")}
                  value={rayon.value}
                  className="h-4 w-4 accent-pink-500"
                />

                <span
                  className={`ml-3 text-sm font-medium ${
                    isSelected ? "text-white" : "text-gray-100"
                  }`}
                >
                  {rayon.label}
                </span>
              </label>
            );
          })}
        </div>

        <p className="text-sm text-gray-300">
          Ce rayon définit la distance maximale pour vos suggestions de profils.
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