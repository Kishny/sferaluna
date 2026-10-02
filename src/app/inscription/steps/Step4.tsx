// src/app/inscription/steps/Step4.tsx

"use client";

/**
 * Étape 4 : question de sécurité + 3 à 5 centres d'intérêt.
 * Les centres d'intérêt sont gérés ici et uniquement ici.
 * Les `value` sont celles enregistrées en base : ne pas les renommer.
 */

import { useFormContext } from "react-hook-form";
import {
  BookOpen,
  Camera,
  ChevronDown,
  Clapperboard,
  Dumbbell,
  Gamepad2,
  Laptop,
  Leaf,
  MessageSquareText,
  Music,
  Palette,
  Plane,
  Shield,
  Shirt,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { CheckBox, ErrorText, Helper, INPUT, IconField, Label, StepTitle, TILE, TILE_ON, cx } from "./ui";

const questionsSecurite = [
  { value: "nom-animal", label: "Quel était le nom de votre premier animal de compagnie ?" },
  { value: "ville-naissance", label: "Dans quelle ville êtes-vous née ?" },
  { value: "film-prefere", label: "Quel est votre film préféré ?" },
  { value: "prof-reve", label: "Quel était le métier de vos rêves quand vous étiez enfant ?" },
  { value: "livre-prefere", label: "Quel est votre livre préféré ?" },
];

const interetsDisponibles: { value: string; label: string; icon: LucideIcon }[] = [
  { value: "voyage", label: "Voyage", icon: Plane },
  { value: "cuisine", label: "Cuisine", icon: UtensilsCrossed },
  { value: "sport", label: "Sport", icon: Dumbbell },
  { value: "musique", label: "Musique", icon: Music },
  { value: "cinema", label: "Cinéma", icon: Clapperboard },
  { value: "lecture", label: "Lecture", icon: BookOpen },
  { value: "art", label: "Art", icon: Palette },
  { value: "technologie", label: "Technologie", icon: Laptop },
  { value: "nature", label: "Nature", icon: Leaf },
  { value: "mode", label: "Mode", icon: Shirt },
  { value: "gaming", label: "Jeux vidéo", icon: Gamepad2 },
  { value: "photographie", label: "Photographie", icon: Camera },
];

export default function Step4() {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const question = watch("question") || "";
  const reponse = watch("reponse") || "";
  const selectedInterets: string[] = watch("interets") || [];

  /** Ajoute ou retire un centre d'intérêt (5 au maximum). */
  const toggleInteret = (value: string) => {
    const selected = selectedInterets.includes(value);
    if (!selected && selectedInterets.length >= 5) return;
    const next = selected ? selectedInterets.filter((item) => item !== value) : [...selectedInterets, value];
    setValue("interets", next, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };

  return (
    <div className="space-y-6">
      <StepTitle plain="Sécurité" accent="et centres d’intérêt">
        Ajoutez une question de sécurité et choisissez quelques centres d’intérêt pour améliorer vos suggestions SferaLuna.
      </StepTitle>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Question de sécurité</h3>
          <Helper>Cette question pourra être utilisée si vous oubliez votre mot de passe.</Helper>
        </div>

        <IconField
          id="question"
          label="Sélectionnez une question"
          required
          icon={Shield}
          error={errors.question?.message as string | undefined}
          right={<ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />}
        >
          <select id="question" {...register("question")} className={cx(INPUT, "appearance-none !bg-none pr-12", !question && "text-white/50")}>
            <option value="" className="bg-[#1a0b2e] text-white">
              Choisissez une question
            </option>
            {questionsSecurite.map((q) => (
              <option key={q.value} value={q.value} className="bg-[#1a0b2e] text-white">
                {q.label}
              </option>
            ))}
          </select>
        </IconField>

        <div>
          <IconField id="reponse" label="Votre réponse" required icon={MessageSquareText}>
            <input id="reponse" {...register("reponse")} type="text" placeholder="Votre réponse, maximum 200 caractères" maxLength={200} className={INPUT} />
          </IconField>
          <div className="mt-2 flex items-center justify-between gap-3 text-[13px] text-white/60">
            <span>Cette réponse doit rester personnelle et facile à retenir.</span>
            <span className={cx("shrink-0", reponse.length > 180 && "text-pink-300")}>{reponse.length}/200</span>
          </div>
          <ErrorText>{errors.reponse?.message as string | undefined}</ErrorText>
        </div>
      </section>

      <section className="border-t border-white/10 pt-5">
        <Label as="h3" required>
          <span className="text-lg">Centres d’intérêt</span>
        </Label>
        <Helper>Sélectionnez entre 3 et 5 centres d’intérêt pour personnaliser votre expérience.</Helper>

        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {interetsDisponibles.map(({ value, label, icon: Icon }) => {
            const on = selectedInterets.includes(value);
            const disabled = selectedInterets.length >= 5 && !on;
            return (
              <button
                key={value}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggleInteret(value)}
                disabled={disabled}
                className={cx("flex h-11 items-center gap-3 px-3.5 text-left", on ? TILE_ON : TILE, disabled && "cursor-not-allowed opacity-40")}
              >
                <CheckBox on={on} />
                <Icon className="h-5 w-5 shrink-0 text-fuchsia-300" />
                <span className="truncate text-sm font-medium text-white">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className={selectedInterets.length < 3 ? "text-pink-300" : "text-white/70"}>{selectedInterets.length}/5 sélectionnés — minimum 3</span>
          {selectedInterets.length >= 5 && <span className="text-pink-300">Maximum atteint</span>}
        </div>
        <ErrorText>{errors.interets?.message as string | undefined}</ErrorText>
      </section>
    </div>
  );
}
