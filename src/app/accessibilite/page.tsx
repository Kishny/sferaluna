// src/app/accessibilite/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  ChevronDown,
  Heart,
  Keyboard,
  Mail,
  Moon,
  ShieldCheck,
  Volume2,
} from "lucide-react";

/**
 * Page accessibilité SferaLuna.
 *
 * Version mobile-first :
 * - sections compactes ;
 * - accordéon mobile ;
 * - bloc complet sur desktop ;
 * - liens rapides adaptés aux petits écrans.
 */

export default function AccessibilitePage() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const sections = [
    {
      icon: <Heart className="h-4 w-4" />,
      title: "Notre engagement",
      summary: "Une plateforme accessible au plus grand nombre.",
      content: (
        <p>
          SferaLuna s&apos;engage à rendre son service numérique accessible
          conformément à la loi française n° 2005-102 pour l&apos;égalité des
          droits et des chances. Nous visons la conformité avec les Règles pour
          l&apos;Accessibilité des Contenus Web, WCAG 2.1, niveau AA.
        </p>
      ),
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      title: "Mesures prises",
      summary: "Contrastes, clavier, textes alternatifs et lecteurs d’écran.",
      content: (
        <ul className="list-disc space-y-2 pl-5">
          <li>Contrastes de couleurs conformes aux recommandations WCAG 2.1</li>
          <li>Navigation au clavier sur l&apos;ensemble des interfaces</li>
          <li>Textes alternatifs sur toutes les images significatives</li>
          <li>Structure de pages sémantique avec titres et landmarks ARIA</li>
          <li>Formulaires labellisés et messages d&apos;erreur explicites</li>
          <li>Compatibilité avec les lecteurs d&apos;écran VoiceOver et NVDA</li>
        </ul>
      ),
    },
    {
      icon: <Keyboard className="h-4 w-4" />,
      title: "Limitations connues",
      summary: "Certaines fonctionnalités sont encore en amélioration.",
      content: (
        <p>
          Certaines fonctionnalités en cours de développement peuvent présenter
          des limitations d&apos;accessibilité. Nous travaillons à les améliorer
          en continu. Si vous rencontrez une difficulté, signalez-la nous.
        </p>
      ),
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "Signaler un problème",
      summary: "Contact dédié et formulaire de contact.",
      content: (
        <>
          <p>
            Si vous rencontrez un obstacle d&apos;accessibilité sur SferaLuna,
            veuillez nous contacter :
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Email :{" "}
              <a
                href="mailto:accessibilite@sferaluna.com"
                className="font-medium text-[#8E7AB5] underline-offset-2 hover:underline"
              >
                accessibilite@sferaluna.com
              </a>
            </li>
            <li>
              Via notre{" "}
              <Link
                href="/contact"
                className="font-medium text-[#8E7AB5] underline-offset-2 hover:underline"
              >
                formulaire de contact
              </Link>
            </li>
          </ul>

          <p className="mt-3">
            Nous nous engageons à vous répondre dans un délai de 5 jours
            ouvrables.
          </p>
        </>
      ),
    },
    {
      icon: <Volume2 className="h-4 w-4" />,
      title: "Voies de recours",
      summary: "Que faire si la réponse n’est pas satisfaisante.",
      content: (
        <p>
          Si vous n&apos;obtenez pas de réponse satisfaisante, vous pouvez
          contacter le Défenseur des droits via defenseurdesdroits.fr.
        </p>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] px-3 pb-8 pt-20 sm:px-4 sm:pb-16 sm:pt-24">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-3xl border border-[#8E7AB5]/15 bg-white/75 p-4 text-center shadow-sm backdrop-blur sm:mb-10 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-1.5 text-xs font-medium text-[#8E7AB5] sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <Accessibility size={14} />
            Accessibilité
          </div>

          <h1 className="text-2xl font-bold leading-tight text-[#1C1C1C] sm:text-3xl">
            Engagement accessibilité ♿
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-[#666] sm:text-base">
            SferaLuna s&apos;engage à rendre sa plateforme accessible à toutes.
          </p>
        </motion.header>

        {/* Résumé */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4 rounded-2xl border border-[#8E7AB5]/15 bg-white p-3 shadow-sm sm:mb-6 sm:p-4"
        >
          <p className="text-xs leading-relaxed text-[#666] sm:text-sm">
            Notre objectif : permettre une navigation claire, lisible et
            utilisable, y compris avec clavier, lecteurs d&apos;écran et besoins
            d&apos;accessibilité spécifiques.
          </p>
        </motion.section>

        {/* Mobile accordéon */}
        <section className="space-y-2 sm:hidden">
          {sections.map((section, index) => {
            const isOpen = openSection === index;

            return (
              <motion.article
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="overflow-hidden rounded-2xl border border-[#E8E0FF] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : index)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-[#8E7AB5]">
                    {section.icon}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold text-[#5B4B8A]">
                      {section.title}
                    </h2>

                    <p className="truncate text-[11px] text-[#666]">
                      {section.summary}
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
                      transition={{ duration: 0.22 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2 text-xs leading-relaxed text-[#444]">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </section>

        {/* Desktop */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="hidden rounded-3xl border border-[#8E7AB5]/15 bg-white p-8 leading-relaxed text-[#444] shadow-lg sm:block md:p-12"
        >
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-[#8E7AB5]">
                    {section.icon}
                  </span>

                  <h2 className="text-xl font-bold text-[#5B4B8A]">
                    {section.title}
                  </h2>
                </div>

                <div>{section.content}</div>
              </section>
            ))}
          </div>
        </motion.section>

        {/* Liens */}
        <footer className="mt-5 rounded-2xl border border-[#8E7AB5]/10 bg-white/70 p-3 text-center shadow-sm sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col items-center justify-center gap-2 text-xs text-[#999] sm:flex-row sm:gap-6 sm:text-sm">
            <Link
              href="/confidentialite"
              className="transition hover:text-[#8E7AB5]"
            >
              Confidentialité
            </Link>

            <span className="hidden sm:inline">·</span>

            <Link
              href="/conditions"
              className="transition hover:text-[#8E7AB5]"
            >
              CGU
            </Link>

            <span className="hidden sm:inline">·</span>

            <Link href="/contact" className="transition hover:text-[#8E7AB5]">
              Contact
            </Link>

            <span className="hidden sm:inline">·</span>

            <Link
              href="/"
              className="flex items-center gap-1 transition hover:text-[#8E7AB5]"
            >
              <Moon size={13} />
              Accueil
            </Link>
          </div>
        </footer>
      </div>
    </main>
  );
}
