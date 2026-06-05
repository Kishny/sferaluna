// src/app/conditions/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  CreditCard,
  FileText,
  Gavel,
  Mail,
  Moon,
  Scale,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

/**
 * Conditions d'utilisation SferaLuna.
 *
 * Version mobile-first :
 * - hero compact sur mobile ;
 * - sections en accordéon sur mobile ;
 * - document complet sur tablette / desktop ;
 * - liens footer plus lisibles sur petit écran.
 */

export default function ConditionsPage() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  const sections = [
    {
      icon: <FileText className="h-4 w-4" />,
      title: "1. Objet",
      summary: "Cadre général d’utilisation de SferaLuna.",
      content: (
        <p>
          Les présentes Conditions Générales d&apos;Utilisation, appelées CGU,
          régissent l&apos;utilisation de la plateforme SferaLuna, accessible à
          l&apos;adresse sferaluna.com. En créant un compte, vous acceptez
          pleinement et sans réserve les présentes CGU.
        </p>
      ),
    },
    {
      icon: <UserCheck className="h-4 w-4" />,
      title: "2. Accès au service",
      summary: "Plateforme réservée aux personnes majeures.",
      content: (
        <p>
          SferaLuna est une plateforme de rencontre destinée aux femmes âgées de
          18 ans et plus. L&apos;inscription est réservée aux personnes majeures.
          Toute inscription implique de fournir des informations exactes et à
          jour. SferaLuna se réserve le droit de suspendre ou supprimer tout
          compte contenant de fausses informations.
        </p>
      ),
    },
    {
      icon: <ShieldAlert className="h-4 w-4" />,
      title: "3. Comportement attendu",
      summary: "Respect, sécurité et bienveillance obligatoires.",
      content: (
        <>
          <p>Les utilisateurs s&apos;engagent à :</p>

          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Respecter les autres membres en toutes circonstances</li>
            <li>Ne pas publier de contenu offensant, illégal ou trompeur</li>
            <li>Ne pas harceler ou intimider d&apos;autres utilisateurs</li>
            <li>
              Ne pas utiliser la plateforme à des fins commerciales sans accord
            </li>
            <li>
              Signaler tout comportement inapproprié via les outils prévus
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: <CreditCard className="h-4 w-4" />,
      title: "4. Abonnements et paiements",
      summary: "Paiements Stripe, renouvellement et annulation.",
      content: (
        <p>
          SferaLuna propose des abonnements payants : Essentiel, Premium et
          Elite. Les paiements sont gérés via Stripe. Les abonnements sont
          renouvelés automatiquement chaque mois. Vous pouvez annuler à tout
          moment depuis votre espace « Mon compte ». Aucun remboursement
          n&apos;est effectué pour les périodes entamées, sauf obligation
          légale.
        </p>
      ),
    },
    {
      icon: <Gavel className="h-4 w-4" />,
      title: "5. Propriété intellectuelle",
      summary: "Logo, design, textes et code protégés.",
      content: (
        <p>
          L&apos;ensemble des contenus de SferaLuna, notamment le logo, le
          design, les textes et le code, est protégé par le droit de la propriété
          intellectuelle. Toute reproduction sans autorisation est interdite.
        </p>
      ),
    },
    {
      icon: <AlertTriangle className="h-4 w-4" />,
      title: "6. Résiliation",
      summary: "Suppression de compte ou suspension en cas d’abus.",
      content: (
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis votre espace
          personnel. SferaLuna peut également résilier un compte en cas de
          non-respect des présentes CGU, sans préavis.
        </p>
      ),
    },
    {
      icon: <Scale className="h-4 w-4" />,
      title: "7. Limitation de responsabilité",
      summary: "La plateforme encadre, mais ne contrôle pas tout.",
      content: (
        <p>
          SferaLuna ne peut être tenue responsable des interactions entre
          utilisateurs. La plateforme met en œuvre des moyens raisonnables pour
          assurer la sécurité des échanges, mais ne peut garantir
          l&apos;absence totale de comportements malveillants.
        </p>
      ),
    },
    {
      icon: <Gavel className="h-4 w-4" />,
      title: "8. Droit applicable",
      summary: "CGU soumises au droit français.",
      content: (
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige,
          les parties s&apos;engagent à rechercher une solution amiable avant
          tout recours judiciaire. À défaut, le tribunal compétent sera celui du
          ressort du siège social de SferaLuna.
        </p>
      ),
    },
    {
      icon: <Mail className="h-4 w-4" />,
      title: "9. Contact",
      summary: "Adresse dédiée aux questions juridiques.",
      content: (
        <p>
          Pour toute question relative aux présentes CGU :{" "}
          <a
            href="mailto:legal@sferaluna.com"
            className="font-medium text-[#8E7AB5] underline-offset-2 hover:underline"
          >
            legal@sferaluna.com
          </a>
        </p>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] px-3 pb-8 pt-20 sm:px-4 sm:pb-16 sm:pt-24">
      <div className="mx-auto max-w-3xl">
        {/* Hero compact */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-3xl border border-[#8E7AB5]/15 bg-white/75 p-4 text-center shadow-sm backdrop-blur sm:mb-10 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-1.5 text-xs font-medium text-[#8E7AB5] sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <FileText size={14} />
            Conditions d&apos;utilisation
          </div>

          <h1 className="text-2xl font-bold leading-tight text-[#1C1C1C] sm:text-3xl">
            CGU — SferaLuna 📋
          </h1>

          <p className="mt-2 text-xs text-[#666] sm:text-base">
            Dernière mise à jour : juin 2025
          </p>
        </motion.header>

        {/* Note courte */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mb-4 rounded-2xl border border-[#8E7AB5]/15 bg-white p-3 shadow-sm sm:mb-6 sm:p-4"
        >
          <p className="text-xs leading-relaxed text-[#666] sm:text-sm">
            Ces conditions encadrent l&apos;utilisation de SferaLuna, les règles
            de comportement, les abonnements, la sécurité et les responsabilités
            de chaque membre.
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

        {/* Desktop document */}
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

        {/* Liens bas */}
        <footer className="mt-5 rounded-2xl border border-[#8E7AB5]/10 bg-white/70 p-3 text-center shadow-sm sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
          <div className="flex flex-col items-center justify-center gap-2 text-xs text-[#999] sm:flex-row sm:gap-6 sm:text-sm">
            <Link
              href="/confidentialite"
              className="transition hover:text-[#8E7AB5]"
            >
              Confidentialité
            </Link>

            <span className="hidden sm:inline">·</span>

            <Link href="/cookies" className="transition hover:text-[#8E7AB5]">
              Cookies
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
