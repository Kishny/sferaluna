// src/app/inscription/steps/Step5.tsx

"use client";

/**
 * Étape 5 du formulaire d'inscription SferaLuna.
 *
 * Objectif :
 * - choisir la visibilité du profil ;
 * - accepter les règles de confidentialité ;
 * - finaliser la partie profil avant l'écran final.
 *
 * Important :
 * Les centres d'intérêt ne sont plus ici.
 * Ils sont gérés dans Step4 pour correspondre à la validation définie
 * dans src/app/inscription/page.tsx :
 *
 * stepFields[3] = ["question", "reponse", "interets"]
 * stepFields[4] = ["visibilite", "consentement"]
 */

import { useFormContext } from "react-hook-form";
import { Check, Eye, Lock, Crown, Ghost } from "lucide-react";

/**
 * Options de visibilité du profil.
 */
const optionsVisibilite = [
  {
    value: "public",
    label: "Profil public",
    description: "Votre profil peut être visible par les membres compatibles.",
    icon: <Eye className="h-4 w-4" />,
  },
  {
    value: "matches",
    label: "Seulement mes matches",
    description: "Votre profil est visible uniquement par vos correspondances.",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    value: "premium",
    label: "Membres premium",
    description: "Votre profil est priorisé auprès des membres premium.",
    icon: <Crown className="h-4 w-4" />,
  },
  {
    value: "invisible",
    label: "Mode discret",
    description: "Votre profil reste plus confidentiel.",
    icon: <Ghost className="h-4 w-4" />,
  },
];

export default function Step5() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const selectedVisibilite = watch("visibilite") || "public";
  const consentement = watch("consentement") || false;

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
    <div className="space-y-6 sm:space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-xl font-bold text-purple-300 sm:text-2xl">
          Visibilité et confidentialité
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-gray-300">
          Choisissez comment votre profil apparaît sur SferaLuna et confirmez
          votre consentement avant de continuer.
        </p>
      </div>

      {/* Visibilité */}
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Visibilité du profil <span className="text-pink-400">*</span>
          </h3>

          <p className="mt-2 text-sm text-gray-300">
            Vous pourrez modifier ce choix plus tard depuis votre espace
            Mon Compte.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {optionsVisibilite.map((option) => {
            const isSelected = selectedVisibilite === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleVisibiliteChange(option.value)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 shadow-lg shadow-pink-500/10"
                    : "border-white/25 bg-white/5 hover:border-purple-300 hover:bg-white/10"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                      isSelected
                        ? "border-pink-400 bg-pink-500/20 text-pink-200"
                        : "border-white/20 bg-white/5 text-gray-300"
                    }`}
                  >
                    {option.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{option.label}</p>

                    <p className="mt-1 text-sm leading-relaxed text-gray-300">
                      {option.description}
                    </p>
                  </div>

                  <div
                    className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-pink-400 bg-pink-500"
                        : "border-gray-300 bg-white/5"
                    }`}
                  >
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {errors.visibilite && (
          <p className="text-sm text-red-300">
            {errors.visibilite.message as string}
          </p>
        )}
      </section>

      {/* Consentement */}
      <section className="space-y-3">
        <button
          type="button"
          onClick={handleConsentementChange}
          className={`w-full rounded-xl border p-4 text-left transition-all ${
            consentement
              ? "border-green-400 bg-green-500/15"
              : "border-white/25 bg-white/5 hover:border-purple-300 hover:bg-white/10"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                consentement
                  ? "border-green-500 bg-green-500"
                  : "border-gray-300 bg-white/5"
              }`}
            >
              {consentement && <Check className="h-3.5 w-3.5 text-white" />}
            </div>

            <div>
              <p className="font-semibold text-white">
                J’accepte les règles de confidentialité SferaLuna{" "}
                <span className="text-pink-400">*</span>
              </p>

              <p className="mt-1 text-sm leading-relaxed text-gray-300">
                J’accepte que mes informations soient utilisées pour créer mon
                profil, améliorer mes suggestions et sécuriser mon expérience.
              </p>
            </div>
          </div>
        </button>

        {errors.consentement && (
          <p className="text-sm text-red-300">
            {errors.consentement.message as string}
          </p>
        )}
      </section>
    </div>
  );
}