// src/app/inscription/steps/Step1.tsx

"use client";

import { useFormContext } from "react-hook-form";

/**
 * Étape 1 du formulaire d'inscription SferaLuna.
 *
 * Objectif :
 * - récupérer les informations de base du profil ;
 * - garder une interface lisible sur le fond sombre SferaLuna ;
 * - afficher les erreurs React Hook Form / Zod proprement.
 */
export default function Step1() {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <div className="space-y-8">
      {/* Titre de l'étape */}
      <div>
        <h2 className="text-2xl font-bold text-purple-300">
          Informations de base
        </h2>

        <p className="mt-2 text-sm text-gray-300">
          Commençons par créer votre identité SferaLuna. Ces informations seront
          utilisées pour configurer votre profil.
        </p>
      </div>

      <div className="space-y-5">
        {/* Pseudonyme */}
        <div>
          <label className="block text-sm font-semibold text-gray-100 mb-2">
            Pseudonyme <span className="text-pink-400">*</span>
          </label>

          <input
            {...register("pseudonyme")}
            type="text"
            autoComplete="nickname"
            className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
            placeholder="Choisissez un pseudonyme unique"
          />

          {errors.pseudonyme && (
            <p className="mt-2 text-sm text-red-300">
              {errors.pseudonyme.message as string}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold text-gray-100 mb-2">
            Adresse email <span className="text-pink-400">*</span>
          </label>

          <input
            type="email"
            {...register("email")}
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
            placeholder="votre@email.com"
          />

          {errors.email && (
            <p className="mt-2 text-sm text-red-300">
              {errors.email.message as string}
            </p>
          )}
        </div>

        {/* Mot de passe */}
        <div>
          <label className="block text-sm font-semibold text-gray-100 mb-2">
            Mot de passe <span className="text-pink-400">*</span>
          </label>

          <input
            type="password"
            {...register("password")}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
            placeholder="Minimum 6 caractères"
          />

          {errors.password && (
            <p className="mt-2 text-sm text-red-300">
              {errors.password.message as string}
            </p>
          )}
        </div>

        {/* Âge */}
        <div>
          <label className="block text-sm font-semibold text-gray-100 mb-2">
            Âge <span className="text-pink-400">*</span>
          </label>

          <input
            type="number"
            {...register("age", { valueAsNumber: true })}
            min={28}
            max={120}
            className="w-full px-4 py-3 rounded-xl border border-white/25 bg-white/10 text-white placeholder:text-gray-400 outline-none transition-all focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30"
            placeholder="28"
          />

          <p className="mt-2 text-sm text-gray-300">
            Vous devez avoir au moins 28 ans.
          </p>

          {errors.age && (
            <p className="mt-2 text-sm text-red-300">
              {errors.age.message as string}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
