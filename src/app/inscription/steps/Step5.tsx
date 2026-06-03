"use client";

import { useFormContext } from "react-hook-form";

/**
 * Centres d'intérêt disponibles.
 * L'utilisateur doit en sélectionner entre 3 et 5.
 */
const interets = [
  { value: "voyage", label: "Voyage" },
  { value: "cuisine", label: "Cuisine" },
  { value: "sport", label: "Sport" },
  { value: "musique", label: "Musique" },
  { value: "cinema", label: "Cinéma" },
  { value: "lecture", label: "Lecture" },
  { value: "art", label: "Art" },
  { value: "technologie", label: "Technologie" },
  { value: "nature", label: "Nature" },
  { value: "mode", label: "Mode" },
  { value: "gaming", label: "Jeux vidéo" },
  { value: "photographie", label: "Photographie" },
];

/**
 * Options de visibilité du profil.
 */
const optionsVisibilite = [
  {
    value: "public",
    label: "Profil public",
    description: "Votre profil peut être visible par les membres compatibles.",
  },
  {
    value: "matches",
    label: "Seulement mes matches",
    description: "Votre profil est visible uniquement par vos correspondances.",
  },
  {
    value: "premium",
    label: "Membres premium",
    description: "Votre profil est priorisé auprès des membres premium.",
  },
  {
    value: "invisible",
    label: "Mode discret",
    description: "Votre profil reste plus confidentiel.",
  },
];

export default function Step5() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  /**
   * Valeurs actuelles du formulaire.
   */
  const selectedInterets: string[] = watch("interets") || [];
  const selectedVisibilite = watch("visibilite") || "matches";
  const consentement = watch("consentement") || false;

  /**
   * Ajoute ou retire un centre d'intérêt.
   * On bloque la sélection à 5 maximum.
   */
  const toggleInteret = (value: string) => {
    const alreadySelected = selectedInterets.includes(value);

    if (!alreadySelected && selectedInterets.length >= 5) {
      return;
    }

    const newInterets = alreadySelected
      ? selectedInterets.filter((item: string) => item !== value)
      : [...selectedInterets, value];

    setValue("interets", newInterets, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  /**
   * Met à jour la visibilité choisie.
   */
  const handleVisibiliteChange = (value: string) => {
    setValue("visibilite", value, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  /**
   * Met à jour le consentement.
   */
  const handleConsentementChange = () => {
    setValue("consentement", !consentement, {
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
          Centres d’intérêt et visibilité
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          Ces informations rendent votre profil plus authentique et plus
          compatible avec les bonnes personnes.
        </p>
      </div>

      {/* Centres d'intérêt */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Centres d’intérêt <span className="text-pink-400">*</span>
          </h3>

          <p className="mt-2 text-sm text-gray-300">
            Sélectionnez entre 3 et 5 centres d’intérêt qui vous représentent.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {interets.map((interet) => {
            const isSelected = selectedInterets.includes(interet.value);
            const isDisabled = selectedInterets.length >= 5 && !isSelected;

            return (
              <button
                key={interet.value}
                type="button"
                onClick={() => toggleInteret(interet.value)}
                disabled={isDisabled}
                className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 text-white shadow-lg shadow-pink-500/10"
                    : isDisabled
                    ? "border-white/10 bg-white/5 text-gray-500 cursor-not-allowed"
                    : "border-white/25 bg-white/5 text-gray-100 hover:bg-white/10 hover:border-purple-300"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <div
                    className={`h-5 w-5 border rounded-md flex items-center justify-center ${
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

                  <span>{interet.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <p
          className={`text-sm ${
            selectedInterets.length < 3 ? "text-pink-300" : "text-gray-300"
          }`}
        >
          {selectedInterets.length}/5 sélectionnés — minimum 3.
        </p>

        {errors.interets && (
          <p className="text-sm text-red-300">
            {errors.interets.message as string}
          </p>
        )}
      </div>

      {/* Visibilité */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Visibilité du profil <span className="text-pink-400">*</span>
          </h3>

          <p className="mt-2 text-sm text-gray-300">
            Choisissez comment votre profil apparaît dans SferaLuna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {optionsVisibilite.map((option) => {
            const isSelected = selectedVisibilite === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleVisibiliteChange(option.value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:bg-white/10 hover:border-purple-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-1 h-4 w-4 rounded-full border flex-shrink-0 ${
                      isSelected
                        ? "border-pink-400 bg-pink-500"
                        : "border-gray-300 bg-white/5"
                    }`}
                  />

                  <div>
                    <p className="font-semibold text-white">{option.label}</p>
                    <p className="mt-1 text-sm text-gray-300">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Champ caché pour garder visibilite enregistré dans React Hook Form */}
        <input type="hidden" {...register("visibilite")} />

        {errors.visibilite && (
          <p className="text-sm text-red-300">
            {errors.visibilite.message as string}
          </p>
        )}
      </div>

      {/* Consentement */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={handleConsentementChange}
          className={`w-full text-left p-4 rounded-xl border transition-all ${
            consentement
              ? "border-green-400 bg-green-500/15"
              : "border-white/25 bg-white/5 hover:bg-white/10 hover:border-purple-300"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                consentement
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 bg-white/5"
              }`}
            >
              {consentement && (
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

            <div>
              <p className="font-semibold text-white">
                J’accepte les règles de confidentialité SferaLuna{" "}
                <span className="text-pink-400">*</span>
              </p>

              <p className="mt-1 text-sm text-gray-300">
                J’accepte que mes informations soient utilisées pour créer mon
                profil, améliorer mes suggestions et sécuriser mon expérience.
              </p>
            </div>
          </div>
        </button>

        {/* Champ caché pour enregistrer le booléen consentement */}
        <input type="hidden" {...register("consentement")} />

        {errors.consentement && (
          <p className="text-sm text-red-300">
            {errors.consentement.message as string}
          </p>
        )}
      </div>
    </div>
  );
}