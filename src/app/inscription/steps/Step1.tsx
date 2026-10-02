// src/app/inscription/steps/Step1.tsx

"use client";

/**
 * Étape 1 : informations de base (pseudonyme, email, mot de passe, âge).
 *
 * Le mot de passe est optionnel dans le schéma principal : une membre
 * connectée avec Google ou Apple n'a pas à en définir un ici.
 */

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { CalendarDays, Eye, EyeOff, Lock, Mail, User } from "lucide-react";

import { INPUT, IconField, StepTitle, cx } from "./ui";

export default function Step1() {
  const {
    register,
    formState: { errors },
  } = useFormContext();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <StepTitle plain="Informations" accent="de base">
        Commençons par créer votre identité SferaLuna. Ces informations seront utilisées pour configurer votre profil.
      </StepTitle>

      <div className="space-y-4">
        <IconField id="pseudonyme" label="Pseudonyme" required icon={User} error={errors.pseudonyme?.message as string | undefined}>
          <input id="pseudonyme" {...register("pseudonyme")} type="text" autoComplete="nickname" className={INPUT} placeholder="Choisissez un pseudonyme unique" />
        </IconField>

        <IconField id="email" label="Adresse email" required icon={Mail} error={errors.email?.message as string | undefined}>
          <input id="email" type="email" {...register("email")} autoComplete="email" className={INPUT} placeholder="votre@email.com" />
        </IconField>

        <IconField
          id="password"
          label="Mot de passe"
          icon={Lock}
          helper="Optionnel si vous vous êtes connectée avec Google ou Apple."
          error={errors.password?.message as string | undefined}
          right={
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
            </button>
          }
        >
          <input id="password" type={showPassword ? "text" : "password"} {...register("password")} autoComplete="new-password" className={cx(INPUT, "pr-12")} placeholder="Optionnel" />
        </IconField>

        <IconField id="age" label="Âge" required icon={CalendarDays} helper="Vous devez avoir au moins 28 ans." error={errors.age?.message as string | undefined}>
          <input id="age" type="number" inputMode="numeric" {...register("age", { valueAsNumber: true })} min={28} max={120} className={INPUT} placeholder="28" />
        </IconField>
      </div>
    </div>
  );
}
