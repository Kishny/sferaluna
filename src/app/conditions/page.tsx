// src/app/conditions/page.tsx

"use client";

/**
 * Conditions générales d'utilisation.
 *
 * Le contenu décrit le fonctionnement réel du site (accès réservé aux femmes
 * de 28 ans et plus, vérification d'identité, offres et prix repris de
 * PUBLIC_PLANS, modération, suppression de compte). Texte juridique : à faire
 * relire avant toute modification de fond.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronUp,
  Copyright,
  Crown,
  FileText,
  Flag,
  Heart,
  Headphones,
  Lightbulb,
  List as ListIcon,
  Lock,
  Mail,
  Scale,
  Send,
  ShieldCheck,
  Target,
  UserCheck,
  UserX,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { Container, SiteShell } from "@/components/site/sections";
import { PUBLIC_PLANS } from "@/components/site/plans";
import { ScriptNote, cn } from "@/components/site/ui";

const UPDATED = "2 octobre 2026";
const CONTACT = "contact@sferaluna.com";
const PANEL = "rounded-3xl border border-violet-300/[0.16] bg-[#1b0d38]/80 backdrop-blur-xl";

const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="text-pink-300 hover:underline">
    {children}
  </Link>
);

const Ul = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc space-y-1.5 pl-5 marker:text-fuchsia-300">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);

const paid = PUBLIC_PLANS.filter((p) => p.id !== "free");

type Section = { short: string; title: string; icon: LucideIcon; summary: string; details: ReactNode };

const SECTIONS: Section[] = [
  {
    short: "Objet",
    title: "Objet des conditions",
    icon: Target,
    summary: "Ces CGU définissent les règles d’utilisation de SferaLuna, les services proposés et les droits et obligations de chaque membre.",
    details: (
      <>
        <p>
          Les présentes conditions générales d’utilisation (CGU) s’appliquent au site sferaluna.com et à ses services. L’éditeur du site est indiqué dans les{" "}
          <A href="/mentions-legales">mentions légales</A>.
        </p>
        <p>En créant un compte, tu acceptes ces conditions. Si elles évoluent de façon importante, tu en seras informée avant leur entrée en vigueur.</p>
      </>
    ),
  },
  {
    short: "Accès au service",
    title: "Accès au service",
    icon: UserCheck,
    summary: "SferaLuna est réservé aux femmes de 28 ans et plus. Tu t’engages à fournir des informations exactes et à maintenir un compte à jour.",
    details: (
      <Ul
        items={[
          "L’inscription est réservée aux femmes âgées de 28 ans et plus.",
          "Une vérification d’identité (pièce d’identité et selfie, réalisée par Stripe Identity) est demandée pour accéder à ton compte.",
          "Tu peux aussi faire vérifier tes photos par un selfie pris en direct : c’est facultatif et soumis à ton consentement.",
          "Un seul compte par personne. Tes identifiants sont personnels : ne les partage pas.",
          "Les informations de ton profil doivent être exactes. Un compte contenant de fausses informations peut être suspendu.",
        ]}
      />
    ),
  },
  {
    short: "Comportement",
    title: "Comportement attendu",
    icon: Heart,
    summary: "Nous encourageons le respect, la bienveillance et l’authenticité. Tout comportement inapproprié, harcèlement ou contenu illicite est strictement interdit.",
    details: (
      <>
        <p>En utilisant SferaLuna, tu t’engages à :</p>
        <Ul
          items={[
            "respecter les autres membres en toutes circonstances ;",
            "ne publier que des photos et vidéos de toi, et aucun contenu offensant, illégal ou trompeur ;",
            "ne pas harceler, menacer ou intimider ;",
            "ne pas utiliser la plateforme à des fins commerciales ou de démarchage ;",
            "signaler tout comportement inapproprié avec les outils prévus.",
          ]}
        />
        <p>
          Un filtre bloque automatiquement les messages clairement abusifs, et chaque signalement est examiné par l’équipe de modération. Tu peux aussi bloquer une membre à tout moment.
          Le détail est sur la page <A href="/securite#moderation">Sécurité</A>.
        </p>
      </>
    ),
  },
  {
    short: "Abonnements",
    title: "Abonnements et paiements",
    icon: Crown,
    summary: "SferaLuna propose une offre gratuite et des offres Essentiel, Premium et Elite. Les paiements sont sécurisés par Stripe, avec un renouvellement mensuel, annulable à tout moment.",
    details: (
      <>
        <p>L’offre gratuite permet d’utiliser le site avec des limites. Les offres payantes sont :</p>
        <Ul items={paid.map((p) => <><strong className="text-white">{p.name}</strong> : {p.price} par mois, TVA incluse.</>)} />
        <p>
          Le contenu de chaque offre est détaillé sur la page <A href="/tarifs">Tarifs</A>. Le paiement est réalisé par Stripe : SferaLuna ne reçoit ni ne conserve tes coordonnées bancaires.
        </p>
        <Ul
          items={[
            "L’abonnement est sans engagement et se renouvelle automatiquement chaque mois.",
            "Tu peux l’annuler ou le mettre en pause à tout moment depuis Mon compte → Premium. Après une annulation, tu gardes tes avantages jusqu’à la fin de la période déjà payée.",
            "Droit de rétractation : au moment du paiement, tu demandes l’accès immédiat à ton abonnement et tu renonces expressément à ton droit de rétractation de 14 jours, en cochant la case prévue à cet effet.",
            "Une période entamée n’est pas remboursée, sauf obligation légale.",
          ]}
        />
      </>
    ),
  },
  {
    short: "Propriété intellectuelle",
    title: "Propriété intellectuelle",
    icon: Copyright,
    summary: "Tous les contenus de la plateforme (design, textes, images, logo, fonctionnalités) sont la propriété de SferaLuna et protégés par les lois en vigueur.",
    details: (
      <>
        <p>Toute reproduction ou réutilisation du site, de son logo, de ses textes ou de son code sans autorisation écrite est interdite.</p>
        <p>
          Les photos, vidéos et textes que tu publies restent les tiens. Tu autorises SferaLuna à les afficher aux autres membres, uniquement pour faire fonctionner le service et selon la visibilité que tu as choisie.
          Cette autorisation prend fin quand tu retires le contenu ou supprimes ton compte.
        </p>
      </>
    ),
  },
  {
    short: "Résiliation",
    title: "Résiliation de compte",
    icon: UserX,
    summary: "Tu peux supprimer ton compte à tout moment depuis ton espace. SferaLuna peut suspendre ou résilier un compte en cas d’abus ou de non-respect des CGU.",
    details: (
      <Ul
        items={[
          "Tu peux supprimer ton compte depuis Mon compte → Sécurité. Ton profil, tes photos et vidéos, tes matchs et tes messages envoyés sont alors effacés, et un abonnement en cours n’est pas renouvelé.",
          "En cas de non-respect de ces conditions, SferaLuna peut suspendre ou fermer un compte. La décision est motivée ; elle est immédiate en cas de manquement grave (harcèlement, usurpation d’identité, contenu illicite).",
          <>Tu peux contester une décision en écrivant à <a href={`mailto:${CONTACT}`} className="text-pink-300 hover:underline">{CONTACT}</a>.</>,
        ]}
      />
    ),
  },
  {
    short: "Responsabilité",
    title: "Limitation de responsabilité",
    icon: ShieldCheck,
    summary: "SferaLuna met en œuvre des moyens pour garantir un service sûr, mais ne peut être tenue responsable des interactions entre membres.",
    details: (
      <>
        <p>
          Vérifications, modération et outils de signalement réduisent les risques sans pouvoir garantir l’absence totale de comportements malveillants. Chaque membre reste responsable de ses propos, de ses contenus et de ses rencontres.
        </p>
        <p>Pour une première rencontre, privilégie un lieu public et préviens une proche. Le service peut être interrompu ponctuellement pour maintenance.</p>
      </>
    ),
  },
  {
    short: "Droit applicable",
    title: "Droit applicable",
    icon: Scale,
    summary: "Les présentes conditions sont régies par le droit français. En cas de litige, les tribunaux français seront compétents.",
    details: (
      <p>
        En cas de désaccord, écris-nous d’abord : nous chercherons une solution amiable. À défaut, le litige relève des tribunaux français compétents ; en tant que consommatrice, tu peux saisir le tribunal de ton domicile.
      </p>
    ),
  },
  {
    short: "Contact",
    title: "Contact",
    icon: Mail,
    summary: "Pour toute question concernant ces conditions, notre équipe est à ta disposition.",
    details: (
      <p>
        Tu peux aussi utiliser le <A href="/contact">formulaire de contact</A>. Le traitement de tes données est décrit dans la <A href="/confidentialite">politique de confidentialité</A>.
      </p>
    ),
  },
];

const KEY_POINTS: { icon?: LucideIcon; badge?: string; text: string }[] = [
  { badge: "28+", text: "Réservé aux femmes de 28 ans et plus" },
  { icon: ShieldCheck, text: "Respect et bienveillance obligatoires" },
  { icon: Crown, text: "Abonnements clairs et sans engagement" },
  { icon: UsersRound, text: "Une communauté vérifiée et modérée" },
];

const COMMITMENTS: { icon: LucideIcon; text: string }[] = [
  { icon: UserCheck, text: "Identité vérifiée à l’inscription" },
  { icon: Flag, text: "Signalement facile des contenus inappropriés" },
  { icon: Lock, text: "Protection de tes données" },
  { icon: Headphones, text: "Une équipe à ton écoute" },
];

export default function ConditionsPage() {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const goTo = (i: number) => {
    setOpen((prev) => new Set(prev).add(i));
    document.getElementById(`section-${i + 1}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Lien direct vers une section (ex. /conditions#section-4 depuis le paiement).
  useEffect(() => {
    const match = window.location.hash.match(/^#section-(\d)$/);
    if (match) setTimeout(() => goTo(Number(match[1]) - 1), 300);
  }, []);

  return (
    <SiteShell back>
      <section className="relative pb-16">
        <Container>
          {/* En-tête */}
          <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-[#1b0d38]/70 px-4 py-1.5 text-sm text-white/90">
                <FileText className="h-4 w-4 text-fuchsia-300" /> Conditions d’utilisation
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                CGU — <span className="bg-gradient-to-r from-fuchsia-300 to-pink-300 bg-clip-text text-transparent">SferaLuna</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                Ces conditions encadrent l’utilisation de SferaLuna, les règles de comportement, les abonnements, la sécurité et les responsabilités de chaque membre.
              </p>
              <p className="mt-3 text-sm text-white/60">Dernière mise à jour : {UPDATED}</p>
            </div>
            <ScriptNote className="hidden rotate-[-5deg] lg:mb-4 lg:mr-10 lg:block">
              Des règles claires
              <br />
              pour une expérience
              <br />
              sereine ♡
            </ScriptNote>
          </header>

          {/* À retenir */}
          <div className={cn(PANEL, "mt-8 flex flex-col gap-5 p-5 xl:flex-row xl:items-center")}>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15">
                <Lightbulb className="h-6 w-6 text-amber-300" />
              </span>
              <div>
                <h2 className="font-bold text-white">À retenir</h2>
                <p className="mt-0.5 text-sm text-white/70">
                  Les CGU garantissent un espace sûr, respectueux et bienveillant pour toutes les membres. En utilisant SferaLuna, tu acceptes ces conditions.
                </p>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-4 xl:flex xl:shrink-0 xl:gap-6">
              {KEY_POINTS.map(({ icon: Icon, badge, text }) => (
                <li key={text} className="flex items-center gap-2.5 xl:max-w-[190px]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/40 bg-fuchsia-500/15 text-xs font-bold text-fuchsia-100">
                    {Icon ? <Icon className="h-5 w-5 text-fuchsia-200" /> : badge}
                  </span>
                  <span className="text-sm leading-snug text-white/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sommaire */}
          <nav aria-label="Sommaire" className={cn(PANEL, "mt-3 flex flex-col gap-4 p-4 lg:flex-row lg:items-center")}>
            <div className="flex shrink-0 items-center gap-3">
              <ListIcon className="h-5 w-5 text-fuchsia-300" />
              <div>
                <h2 className="font-bold text-white">Sommaire</h2>
                <p className="text-xs text-white/60">Accède directement à la section qui t’intéresse.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((s, i) => (
                <button
                  key={s.short}
                  type="button"
                  onClick={() => goTo(i)}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-white/[0.03] py-1.5 pl-1.5 pr-3.5 text-xs text-white/85 transition hover:border-fuchsia-300/60"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 text-[11px] font-bold text-white">{i + 1}</span>
                  {s.short}
                </button>
              ))}
            </div>
          </nav>

          {/* Sections */}
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
            {SECTIONS.map((s, i) => {
              const isOpen = open.has(i);
              const Icon = s.icon;
              return (
                <article key={s.title} id={`section-${i + 1}`} className={cn(PANEL, "scroll-mt-28 p-5 transition", isOpen && "border-fuchsia-300/45")}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500 text-lg font-bold text-white shadow-lg">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold text-white">{s.title}</h2>
                      <p className="mt-1.5 text-sm leading-relaxed text-white/70">{s.summary}</p>
                    </div>
                    <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 sm:flex">
                      <Icon className="h-6 w-6 text-fuchsia-200" />
                    </span>
                  </div>

                  {i === 8 && (
                    <a
                      href={`mailto:${CONTACT}`}
                      className="ml-14 mt-3 inline-flex items-center gap-2.5 rounded-full border border-fuchsia-300/40 px-4 py-2 text-sm text-white hover:bg-fuchsia-500/10"
                    >
                      <Mail className="h-4 w-4 text-fuchsia-300" /> {CONTACT} <ArrowRight className="h-4 w-4" />
                    </a>
                  )}

                  {isOpen && <div className="mt-4 space-y-3 border-t border-white/10 pt-4 text-sm leading-relaxed text-white/75">{s.details}</div>}

                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    aria-expanded={isOpen}
                    className="ml-14 mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-pink-300 hover:underline"
                  >
                    {isOpen ? "Masquer les détails" : "Voir les détails"}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </article>
              );
            })}
          </div>

          {/* Engagement */}
          <div className={cn(PANEL, "mt-3 flex flex-col gap-5 p-5 xl:flex-row xl:items-center")}>
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/25">
                <ShieldCheck className="h-6 w-6 text-violet-100" />
              </span>
              <div>
                <h2 className="font-bold text-white">Notre engagement pour ta sécurité</h2>
                <p className="mt-0.5 text-sm text-white/70">Des règles claires, une modération active et des outils pour garantir un espace de confiance.</p>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-4 xl:flex xl:shrink-0 xl:gap-6">
              {COMMITMENTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 xl:max-w-[180px]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-500/15">
                    <Icon className="h-5 w-5 text-fuchsia-200" />
                  </span>
                  <span className="text-sm leading-snug text-white/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Question */}
          <div className="mt-3 flex flex-col gap-4 rounded-3xl border border-fuchsia-300/35 bg-gradient-to-r from-[#3a1470]/85 via-[#2a1158]/85 to-[#3a1470]/85 p-5 backdrop-blur-xl md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500">
                <Send className="h-5 w-5 text-white" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Une question sur les CGU ?</h2>
                <p className="text-sm text-white/70">Notre équipe est là pour t’accompagner.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <Mail className="h-5 w-5" /> Nous contacter <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/" className="inline-flex h-12 items-center justify-center rounded-2xl border border-violet-200/30 px-6 font-medium text-white hover:border-fuchsia-300/60">
                Retour à l’accueil
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </SiteShell>
  );
}
