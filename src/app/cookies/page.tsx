// src/app/cookies/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Cookie,
  Mail,
  Moon,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

/**
 * Metadata de la page.
 *
 * Important :
 * Comme cette page utilise "use client", Next.js ne permet pas d'exporter
 * directement metadata depuis ce fichier client.
 *
 * Solution recommandée :
 * - soit tu gardes cette page en client component et tu mets la metadata
 *   dans un fichier layout.tsx parent ;
 * - soit tu sépares le contenu interactif dans un composant client.
 *
 * Pour éviter une erreur Next.js, je ne laisse PAS :
 * export const metadata = ...
 *
 * Tu peux créer :
 * src/app/cookies/layout.tsx
 *
 * avec :
 * export const metadata = { title: "Politique des cookies — SferaLuna" };
 * export default function Layout({ children }: { children: React.ReactNode }) {
 *   return <>{children}</>;
 * }
 */

/**
 * Données des cookies utilisés par SferaLuna.
 */
const cookiesList = [
  {
    emoji: "🔐",
    name: "Cookies d'authentification",
    desc: "Gèrent votre session de connexion avec NextAuth. Ils sont indispensables au fonctionnement sécurisé du site.",
    type: "Essentiels",
    duree: "Session",
  },
  {
    emoji: "⚙️",
    name: "Cookies de préférences",
    desc: "Mémorisent vos paramètres comme la langue, les préférences d'affichage ou certains choix d'interface.",
    type: "Fonctionnels",
    duree: "1 an",
  },
  {
    emoji: "📊",
    name: "Cookies analytiques",
    desc: "Nous aident à comprendre comment SferaLuna est utilisé : pages visitées, temps passé, navigation globale. Ces données sont anonymisées.",
    type: "Analytiques",
    duree: "6 mois",
  },
];

/**
 * Sections principales de la politique cookies.
 * Sur mobile, elles s'affichent en accordéons.
 */
const policySections = [
  {
    id: "definition",
    icon: <Cookie className="h-4 w-4" />,
    title: "Qu'est-ce qu'un cookie ?",
    content:
      "Un cookie est un petit fichier texte stocké sur votre appareil lors de votre visite sur SferaLuna. Il permet de mémoriser certaines informations pour améliorer votre expérience, sécuriser votre session et simplifier votre navigation.",
  },
  {
    id: "gestion",
    icon: <Settings className="h-4 w-4" />,
    title: "Gestion des cookies",
    content:
      "Vous pouvez configurer votre navigateur pour refuser les cookies ou être alerté de leur dépôt. Cependant, certaines fonctionnalités de SferaLuna, notamment la connexion, nécessitent des cookies essentiels pour fonctionner correctement.",
  },
  {
    id: "navigateurs",
    icon: <SlidersHorizontal className="h-4 w-4" />,
    title: "Réglages navigateur",
    content:
      "Chrome : Paramètres → Confidentialité et sécurité → Cookies. Firefox : Options → Vie privée et sécurité. Safari : Préférences → Confidentialité.",
  },
  {
    id: "contact",
    icon: <Mail className="h-4 w-4" />,
    title: "Contact",
    content:
      "Pour toute question liée aux cookies ou à la confidentialité, vous pouvez nous contacter à l'adresse contact@sferaluna.com.",
  },
];

export default function CookiesPage() {
  /**
   * Accordéon mobile des sections principales.
   * Par défaut, on ouvre la première section.
   */
  const [openSection, setOpenSection] = useState<string | null>("definition");

  /**
   * Accordéon mobile des cookies utilisés.
   * null = aucun cookie ouvert.
   */
  const [openCookie, setOpenCookie] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] px-3 pb-8 pt-20 text-[#1C1C1C] sm:px-4 sm:pb-16 sm:pt-24">
      <div className="mx-auto max-w-3xl">
        {/* Hero compact */}
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-4 rounded-3xl border border-[#8E7AB5]/15 bg-white/75 p-4 text-center shadow-sm backdrop-blur sm:mb-8 sm:p-0 sm:border-0 sm:bg-transparent sm:shadow-none"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-1.5 text-xs font-medium text-[#8E7AB5] sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <Cookie className="h-3.5 w-3.5" />
            Politique des cookies
          </div>

          <h1 className="text-2xl font-bold text-[#1C1C1C] sm:text-3xl">
            Utilisation des cookies 🍪
          </h1>

          <p className="mt-1 text-xs text-[#666] sm:mt-3 sm:text-sm">
            Dernière mise à jour : juin 2025
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2 sm:mx-auto sm:mt-6 sm:max-w-md">
            <div className="rounded-2xl bg-[#F9F7FC] px-2 py-2">
              <p className="text-sm font-bold text-[#5B4B8A] sm:text-base">
                3
              </p>
              <p className="text-[10px] text-[#8E7AB5] sm:text-xs">
                catégories
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9F7FC] px-2 py-2">
              <p className="text-sm font-bold text-[#5B4B8A] sm:text-base">
                RGPD
              </p>
              <p className="text-[10px] text-[#8E7AB5] sm:text-xs">
                conforme
              </p>
            </div>

            <div className="rounded-2xl bg-[#F9F7FC] px-2 py-2">
              <p className="text-sm font-bold text-[#5B4B8A] sm:text-base">
                Safe
              </p>
              <p className="text-[10px] text-[#8E7AB5] sm:text-xs">
                sécurisé
              </p>
            </div>
          </div>
        </motion.header>

        {/* Contenu principal */}
        <section className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-4 text-[#444] shadow-lg sm:p-8 md:p-12">
          {/* Résumé rapide mobile */}
          <div className="mb-4 rounded-2xl border border-[#E8E0FF] bg-[#FDFCFF] p-3 sm:hidden">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-[#8E7AB5]">
                <ShieldCheck className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#5B4B8A]">
                  À retenir
                </p>

                <p className="mt-1 text-xs leading-relaxed text-[#666]">
                  Les cookies essentiels permettent la connexion. Les autres
                  servent à améliorer ton expérience et comprendre l’usage du
                  site.
                </p>
              </div>
            </div>
          </div>

          {/* Desktop : sections classiques */}
          <div className="hidden space-y-8 leading-relaxed sm:block">
            <section>
              <h2 className="mb-3 text-xl font-bold text-[#5B4B8A]">
                Qu&apos;est-ce qu&apos;un cookie ?
              </h2>

              <p>
                Un cookie est un petit fichier texte stocké sur votre appareil
                lors de votre visite sur SferaLuna. Il nous permet de mémoriser
                certaines informations vous concernant pour améliorer votre
                expérience.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-[#5B4B8A]">
                Cookies utilisés
              </h2>

              <div className="space-y-4">
                {cookiesList.map((cookie) => (
                  <div
                    key={cookie.name}
                    className="rounded-xl border border-[#E8E0FF] bg-[#FDFCFF] p-4"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span>{cookie.emoji}</span>

                      <span className="font-semibold text-[#5B4B8A]">
                        {cookie.name}
                      </span>

                      <span className="ml-auto rounded-full bg-[#8E7AB5]/10 px-2 py-0.5 text-xs text-[#8E7AB5]">
                        {cookie.type}
                      </span>
                    </div>

                    <p className="text-sm text-[#666]">{cookie.desc}</p>

                    <p className="mt-1 text-xs text-[#999]">
                      Durée : {cookie.duree}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-[#5B4B8A]">
                Gestion des cookies
              </h2>

              <p>
                Vous pouvez configurer votre navigateur pour refuser les cookies
                ou être alerté de leur dépôt. Cependant, certaines
                fonctionnalités de SferaLuna, notamment la connexion,
                nécessitent des cookies essentiels pour fonctionner
                correctement.
              </p>

              <p className="mt-3">
                Instructions pour les principaux navigateurs :
              </p>

              <ul className="mt-2 list-disc space-y-1 pl-6 text-sm">
                <li>
                  Chrome : Paramètres → Confidentialité et sécurité → Cookies
                </li>
                <li>Firefox : Options → Vie privée et sécurité</li>
                <li>Safari : Préférences → Confidentialité</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-[#5B4B8A]">
                Contact
              </h2>

              <p>
                Pour toute question :{" "}
                <a
                  href="mailto:contact@sferaluna.com"
                  className="text-[#8E7AB5] hover:underline"
                >
                  contact@sferaluna.com
                </a>
              </p>
            </section>
          </div>

          {/* Mobile : cookies utilisés en accordéons */}
          <div className="sm:hidden">
            <h2 className="mb-3 text-base font-bold text-[#5B4B8A]">
              Cookies utilisés
            </h2>

            <div className="space-y-2">
              {cookiesList.map((cookie) => {
                const isOpen = openCookie === cookie.name;

                return (
                  <div
                    key={cookie.name}
                    className="overflow-hidden rounded-2xl border border-[#E8E0FF] bg-[#FDFCFF]"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenCookie(isOpen ? null : cookie.name)
                      }
                      className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-lg">
                        {cookie.emoji}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-[#5B4B8A]">
                          {cookie.name}
                        </h3>

                        <p className="text-[11px] text-[#999]">
                          {cookie.type} · {cookie.duree}
                        </p>
                      </div>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#E8E0FF] px-3 pb-3 pt-2">
                            <p className="text-xs leading-relaxed text-[#666]">
                              {cookie.desc}
                            </p>

                            <p className="mt-2 text-[11px] text-[#999]">
                              Durée : {cookie.duree}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Mobile : sections générales en accordéons */}
            <div className="mt-5 space-y-2">
              {policySections.map((section) => {
                const isOpen = openSection === section.id;

                return (
                  <div
                    key={section.id}
                    className="overflow-hidden rounded-2xl border border-[#E8E0FF] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSection(isOpen ? null : section.id)
                      }
                      className="flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-[#8E7AB5]">
                        {section.icon}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#5B4B8A]">
                        {section.title}
                      </span>

                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-[#E8E0FF] px-3 pb-3 pt-2">
                            {section.id === "contact" ? (
                              <p className="text-xs leading-relaxed text-[#666]">
                                Pour toute question liée aux cookies ou à la
                                confidentialité :{" "}
                                <a
                                  href="mailto:contact@sferaluna.com"
                                  className="font-medium text-[#8E7AB5] underline underline-offset-2"
                                >
                                  contact@sferaluna.com
                                </a>
                              </p>
                            ) : (
                              <p className="text-xs leading-relaxed text-[#666]">
                                {section.content}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Liens bas de page */}
        <nav className="mt-5 rounded-2xl border border-[#E8E0FF] bg-white/70 px-3 py-3 text-center text-xs text-[#999] shadow-sm sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:text-sm sm:shadow-none">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6">
            <Link
              href="/confidentialite"
              className="transition hover:text-[#8E7AB5]"
            >
              Confidentialité
            </Link>

            <span className="text-[#D9B8FF]">·</span>

            <Link
              href="/conditions"
              className="transition hover:text-[#8E7AB5]"
            >
              CGU
            </Link>

            <span className="text-[#D9B8FF]">·</span>

            <Link
              href="/"
              className="inline-flex items-center gap-1 transition hover:text-[#8E7AB5]"
            >
              <Moon size={13} />
              Accueil
            </Link>
          </div>
        </nav>
      </div>
    </main>
  );
}
