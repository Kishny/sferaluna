// src/components/CookieConsent.tsx
//
// Bandeau de consentement cookies RGPD.
// Apparaît à la première visite, en bas de page.
// L'utilisatrice peut :
//   - Tout accepter
//   - Tout refuser
//   - Personnaliser ses préférences par catégorie

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Cookie,
  Settings,
  ShieldCheck,
  BarChart2,
  Megaphone,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCookieConsent, type CookiePreferences } from "@/hooks/useCookieConsent";

// ─── Types internes ───────────────────────────────────────────────────────────

interface CategoryConfig {
  key: keyof Omit<CookiePreferences, "essential">;
  icon: React.ElementType;
  label: string;
  description: string;
  required?: boolean;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "analytics",
    icon: BarChart2,
    label: "Analytics",
    description:
      "Mesure d'audience anonymisée pour améliorer l'expérience (pages vues, parcours, erreurs).",
  },
  {
    key: "marketing",
    icon: Megaphone,
    label: "Marketing",
    description:
      "Contenus personnalisés selon tes centres d'intérêt et communication ciblée.",
  },
  {
    key: "personalization",
    icon: Sparkles,
    label: "Personnalisation",
    description:
      "Mémorisation de tes préférences d'affichage, humeur, thème et suggestions adaptées.",
  },
];

// ─── Toggle switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
        disabled
          ? "cursor-not-allowed bg-purple-400 opacity-60"
          : checked
          ? "bg-purple-500"
          : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 translate-x-1 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : ""
        }`}
      />
    </button>
  );
}

// ─── Modale préférences ───────────────────────────────────────────────────────

function PreferencesModal({
  initial,
  onSave,
  onClose,
}: {
  initial: Omit<CookiePreferences, "essential">;
  onSave: (prefs: Omit<CookiePreferences, "essential">) => void;
  onClose: () => void;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: keyof typeof prefs) =>
    setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1001] flex items-end justify-center p-4 sm:items-center"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a0b2e] to-[#2d1b69] p-6 shadow-2xl"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white sm:text-lg">
              Gérer mes préférences
            </h2>
            <p className="mt-1 text-xs text-white/50">
              Les cookies essentiels sont toujours actifs — ils garantissent le bon
              fonctionnement de SferaLuna.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Essentiels (toujours actifs) */}
        <div className="mb-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-purple-300" />
              <span className="text-sm font-medium text-white">Essentiels</span>
            </div>
            <Toggle checked disabled onChange={() => {}} />
          </div>
          <p className="mt-1.5 text-xs text-white/40">
            Authentification, session, sécurité — toujours requis.
          </p>
        </div>

        {/* Catégories optionnelles */}
        <div className="space-y-2">
          {CATEGORIES.map(({ key, icon: Icon, label, description }) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-white/5"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <Icon className="h-4 w-4 shrink-0 text-purple-300" />
                <span className="flex-1 text-sm font-medium text-white">{label}</span>
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === key ? null : key)}
                  className="rounded p-0.5 text-white/40 transition hover:text-white"
                  aria-label={`Détails ${label}`}
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${expanded === key ? "rotate-180" : ""}`}
                  />
                </button>
                <Toggle
                  checked={prefs[key]}
                  onChange={() => toggle(key)}
                />
              </div>
              <AnimatePresence>
                {expanded === key && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-3 text-xs text-white/40">{description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={() => onSave(prefs)}
            className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Enregistrer mes choix
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
          >
            Annuler
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Bandeau principal ────────────────────────────────────────────────────────

export default function CookieConsent() {
  const {
    mounted,
    hasConsented,
    preferences,
    acceptAll,
    rejectAll,
    savePreferences,
  } = useCookieConsent();

  const [showModal, setShowModal] = useState(false);

  // Ne rien afficher côté serveur ou si déjà consenti
  if (!mounted || hasConsented) return null;

  return (
    <>
      <AnimatePresence>
        {!showModal && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.4 }}
            className="fixed bottom-0 left-0 right-0 z-[1000] p-3 sm:p-4"
            role="region"
            aria-label="Consentement cookies"
          >
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-gradient-to-r from-[#1a0b2e]/95 to-[#2d1b69]/95 p-4 shadow-2xl backdrop-blur-md sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                {/* Texte */}
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-purple-300" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      SferaLuna utilise des cookies 🍪
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-white/50">
                      Nous utilisons des cookies essentiels au fonctionnement du site et, avec
                      ton accord, des cookies optionnels pour améliorer ton expérience.{" "}
                      <Link
                        href="/cookies"
                        className="underline hover:text-white/80"
                        target="_blank"
                      >
                        En savoir plus
                      </Link>
                    </p>
                  </div>
                </div>

                {/* Boutons */}
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/15 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Personnaliser
                  </button>

                  <button
                    type="button"
                    onClick={rejectAll}
                    className="rounded-xl border border-white/15 px-3 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    Refuser
                  </button>

                  <button
                    type="button"
                    onClick={acceptAll}
                    className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                  >
                    Tout accepter
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <PreferencesModal
            initial={{
              analytics: preferences.analytics,
              marketing: preferences.marketing,
              personalization: preferences.personalization,
            }}
            onSave={(prefs) => {
              savePreferences(prefs);
              setShowModal(false);
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
