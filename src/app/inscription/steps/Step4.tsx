// src/app/inscription/steps/Step4.tsx

"use client";

import { useFormContext } from "react-hook-form";
import { Check } from "lucide-react";

/**
 * Questions de sécurité disponibles.
 * Elles pourront servir plus tard pour une récupération de compte.
 */
const questionsSecurite = [
  {
    value: "nom-animal",
    label: "Quel était le nom de votre premier animal de compagnie ?",
  },
  {
    value: "ville-naissance",
    label: "Dans quelle ville êtes-vous né(e) ?",
  },
  {
    value: "film-prefere",
    label: "Quel est votre film préféré ?",
  },
  {
    value: "prof-reve",
    label: "Quel était le métier de vos rêves quand vous étiez enfant ?",
  },
  {
    value: "livre-prefere",
    label: "Quel est votre livre préféré ?",
  },
];

/**
 * Centres d'intérêt proposés.
 * Le schema Zod demande 3 à 5 choix.
 */
const interetsDisponibles = [
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

export default function Step4() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  /**
   * Permet d'afficher le compteur de caractères en direct.
   */
  const reponse = watch("reponse") || "";

  /**
   * Liste des centres d'intérêt sélectionnés.
   */
  const selectedInterets: string[] = watch("interets") || [];

  /**
   * Ajoute ou retire un centre d'intérêt.
   * Maximum 5 choix.
   */
  const toggleInteret = (value: string) => {
    const alreadySelected = selectedInterets.includes(value);

    if (alreadySelected) {
      const nextInterets = selectedInterets.filter((item) => item !== value);

      setValue("interets", nextInterets, {
        shouldValidate: true,
        shouldDirty: true,
      });

      return;
    }

    if (selectedInterets.length >= 5) return;

    setValue("interets", [...selectedInterets, value], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="space-y-10">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-2xl font-bold text-purple-300">
          Sécurité et centres d’intérêt
        </h2>

        <p className="mt-2 text-sm text-gray-300">
          Ajoutez une question de sécurité et choisissez quelques centres
          d’intérêt pour améliorer vos suggestions SferaLuna.
        </p>
      </div>

      {/* Bloc question de sécurité */}
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Question de sécurité
          </h3>

          <p className="mt-2 text-sm text-gray-300">
            Cette question pourra être utilisée si vous oubliez votre mot de
            passe.
          </p>
        </div>

        {/* Question */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-100">
            Sélectionnez une question{" "}
            <span className="text-pink-400">*</span>
          </label>

          <select
            {...register("question")}
            className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
          >
            <option value="" className="bg-gray-900 text-white">
              Choisissez une question
            </option>

            {questionsSecurite.map((question) => (
              <option
                key={question.value}
                value={question.value}
                className="bg-gray-900 text-white"
              >
                {question.label}
              </option>
            ))}
          </select>

          {errors.question && (
            <p className="text-sm text-red-300">
              {errors.question.message as string}
            </p>
          )}
        </div>

        {/* Réponse */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-100">
            Votre réponse <span className="text-pink-400">*</span>
          </label>

          <input
            {...register("reponse")}
            type="text"
            placeholder="Votre réponse, maximum 200 caractères"
            maxLength={200}
            className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
          />

          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">
              Cette réponse doit rester personnelle et facile à retenir.
            </p>

            <p
              className={`text-xs ${
                reponse.length > 180 ? "text-pink-300" : "text-gray-400"
              }`}
            >
              {reponse.length}/200
            </p>
          </div>

          {errors.reponse && (
            <p className="text-sm text-red-300">
              {errors.reponse.message as string}
            </p>
          )}
        </div>
      </section>

      {/* Bloc centres d'intérêt */}
      <section className="space-y-5 pt-6 border-t border-white/10">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Centres d’intérêt <span className="text-pink-400">*</span>
          </h3>

          <p className="mt-2 text-sm text-gray-300">
            Sélectionnez entre 3 et 5 centres d’intérêt pour personnaliser votre
            expérience.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {interetsDisponibles.map((interet) => {
            const isSelected = selectedInterets.includes(interet.value);
            const isDisabled = selectedInterets.length >= 5 && !isSelected;

            return (
              <button
                key={interet.value}
                type="button"
                onClick={() => toggleInteret(interet.value)}
                disabled={isDisabled}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "border-pink-400 bg-pink-500/20 text-white"
                    : isDisabled
                    ? "border-white/10 bg-white/5 text-gray-500 cursor-not-allowed"
                    : "border-white/20 bg-white/10 text-gray-200 hover:bg-white/15 hover:border-purple-300/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-md border flex items-center justify-center ${
                      isSelected
                        ? "border-pink-400 bg-pink-500"
                        : "border-white/30"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  <span className="text-sm font-medium">{interet.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Champ caché pour enregistrer correctement le tableau dans react-hook-form */}
        <input type="hidden" {...register("interets")} />

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-300">
            {selectedInterets.length}/5 sélectionnés — minimum 3
          </p>

          {selectedInterets.length >= 5 && (
            <p className="text-sm text-pink-300">
              Maximum atteint
            </p>
          )}
        </div>

        {errors.interets && (
          <p className="text-sm text-red-300">
            {errors.interets.message as string}
          </p>
        )}
      </section>
    </div>
  );
}