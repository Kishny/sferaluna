"use client";

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
 * Villes rapides proposées à l'utilisateur.
 * L'utilisateur peut aussi saisir librement une autre ville.
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
];

export default function Step3() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  /**
   * Valeurs actuelles du formulaire.
   * watch permet de mettre à jour le style visuel en direct.
   */
  const selectedLocalisation = watch("localisation") || "";
  const selectedRayon = watch("rayon") || "";

  /**
   * Quand l'utilisateur clique sur une ville rapide,
   * on met à jour React Hook Form avec setValue.
   */
  const handleLocalisationClick = (ville: string) => {
    setValue("localisation", ville, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  return (
    <div className="space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-2xl font-bold text-purple-300">Localisation</h2>
        <p className="mt-2 text-sm text-gray-300">
          Indiquez votre zone de recherche pour recevoir des suggestions proches
          de vous.
        </p>
      </div>

      {/* Champ localisation */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Où êtes-vous situé(e) ? <span className="text-pink-400">*</span>
        </label>

        <input
          {...register("localisation")}
          type="text"
          placeholder="Saisissez votre ville ou code postal"
          className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
        />

        <div>
          <p className="text-sm text-gray-300 mb-3">Villes principales :</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {villesPrincipales.map((ville) => {
              const isSelected = selectedLocalisation === ville;

              return (
                <button
                  key={ville}
                  type="button"
                  onClick={() => handleLocalisationClick(ville)}
                  className={`px-3 py-3 rounded-xl border text-sm font-medium transition-all ${
                    isSelected
                      ? "border-pink-400 bg-pink-500/20 text-white shadow-lg shadow-pink-500/10"
                      : "border-white/25 bg-white/5 text-gray-100 hover:bg-white/10 hover:border-purple-300"
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
      </div>

      {/* Rayon de recherche */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-gray-100">
          Rayon de recherche <span className="text-pink-400">*</span>
        </label>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {rayons.map((rayon) => {
            const isSelected = selectedRayon === rayon.value;

            return (
              <label
                key={rayon.value}
                className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:bg-white/10 hover:border-purple-300"
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
      </div>
    </div>
  );
}