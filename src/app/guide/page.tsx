// src/app/guide/page.tsx

"use client";

/**
 * Guide du débutant : les cinq étapes pour bien démarrer, quelques questions
 * fréquentes (réponses partagées avec /faq) et des conseils.
 *
 * Les puces de chaque étape décrivent des fonctionnalités réelles du site :
 * les tenir à jour quand une fonctionnalité change.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  Clock,
  Ghost,
  Heart,
  HelpCircle,
  Music,
  Send,
  Star,
  User,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { SiteShell, useIsLoggedIn } from "@/components/site/sections";
import { SceneArt, type SceneVariant } from "@/components/site/art";
import { FAQS } from "@/components/site/faq";
import MobileFold from "@/components/site/MobileFold";
import { BAND_GHOST, BAND_PRIMARY, PANEL, PageBody, PageHero, PhotoBackdrop, TILE } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

const BG = "/images/guide-accessibilite-bg.webp";

type Step = {
  short: string;
  duration: string;
  title: string;
  text: string;
  points: string[];
  icon: LucideIcon;
  scene: SceneVariant;
  cta: string;
  /** Lien pour une visiteuse / pour une membre connectée. */
  href: string;
  appHref: string;
};

const STEPS: Step[] = [
  {
    short: "Profil Luna",
    duration: "5 – 10 minutes",
    title: "Crée ton profil Luna",
    text: "Ajoute tes photos, quelques mots sur toi, tes centres d’intérêt et tes valeurs. Tu restes toujours en contrôle de ta visibilité.",
    points: ["Photos et présentation", "Intérêts et valeurs", "Préférences de rencontre", "Paramètres de confidentialité"],
    icon: User,
    scene: "dusk",
    cta: "Créer mon profil",
    href: "/auth?mode=register",
    appHref: "/mon-compte",
  },
  {
    short: "Affinités",
    duration: "À ton rythme",
    title: "Découvre tes Affinités de la semaine",
    text: "Chaque semaine, nous te proposons 6 profils soigneusement sélectionnés en fonction de tes affinités, de tes intentions et de ta vibe.",
    points: ["6 suggestions personnalisées", "Profils compatibles", "Renouvellement chaque semaine", "Aucun swipe, plus de sens"],
    icon: UsersRound,
    scene: "rooftop",
    cta: "En savoir plus",
    href: "/fonctionnalites#circle",
    appHref: "/circle",
  },
  {
    short: "VibeSphere",
    duration: "Continuel",
    title: "Personnalise ta VibeSphere",
    text: "Exprime ta personnalité à travers ton humeur et ton univers. La VibeSphere permet de mieux te connaître au-delà des photos.",
    points: ["Partage ton humeur du moment", "Remplis ton journal émotionnel", "Découvre les vibes des autres membres", "Montre ce qui t’anime vraiment"],
    icon: Music,
    scene: "river",
    cta: "Découvrir VibeSphere",
    href: "/fonctionnalites#vibesphere",
    appHref: "/vibesphere",
  },
  {
    short: "Interactions",
    duration: "Quand tu te sens prête",
    title: "Commence à interagir",
    text: "Échange facilement avec tes matchs grâce à nos outils pensés pour des discussions plus authentiques et respectueuses.",
    points: ["Brise-glace et idées de message", "Intérêts communs mis en avant", "Planifie une rencontre avec VibePlanner", "Des échanges dans un cadre sécurisé"],
    icon: Heart,
    scene: "night",
    cta: "Voir comment",
    href: "/fonctionnalites#messages",
    appHref: "/matches",
  },
  {
    short: "Événements Luna",
    duration: "Selon tes envies",
    title: "Participe aux événements Luna",
    text: "En ligne ou en présentiel, rejoins nos LunaGather pour vivre des expériences uniques et rencontrer des personnes inspirantes.",
    points: ["LunaGather en ligne et en ville", "Ateliers thématiques", "Sorties entre membres", "Une communauté bienveillante"],
    icon: CalendarDays,
    scene: "hills",
    cta: "Voir les événements",
    href: "/fonctionnalites#lunagather",
    appHref: "/evenements",
  },
];

/** Questions du guide : l'intitulé est propre au guide, la réponse vient de la FAQ. */
const QUESTIONS: { question: string; faq: string }[] = [
  { question: "SferaLuna est-il gratuit ?", faq: "gratuit" },
  { question: "Comment fonctionnent les Affinités de la semaine ?", faq: "circle" },
  { question: "Mes données sont-elles sécurisées ?", faq: "donnees" },
  { question: "Puis-je utiliser SferaLuna de manière discrète ?", faq: "anonyme" },
  { question: "Comment participer aux événements ?", faq: "lunagather" },
];

const TIPS: { icon: LucideIcon; tone: string; title: string; text: string; featured?: boolean }[] = [
  { icon: Star, tone: "fill-amber-300 text-amber-300", title: "Complète ton profil à 100 %", text: "Plus ton profil est complet, plus tu recevras des suggestions pertinentes.", featured: true },
  { icon: Ghost, tone: "text-violet-300", title: "Utilise le Mode Fantôme si besoin", text: "Tu restes maître de ta visibilité. Prends le temps et avance à ton rythme." },
  { icon: Heart, tone: "text-pink-400", title: "Participe aux événements", text: "C’est l’occasion idéale de faire des rencontres dans un cadre bienveillant et de partager tes passions." },
];

export default function GuidePage() {
  const loggedIn = useIsLoggedIn();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PhotoBackdrop src={BG} />

        <PageHero
          scene={false}
          pill="Guide débutant"
          pillIcon={BookOpen}
          title={
            <>
              Guide du <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">débutant</span>
            </>
          }
          text="Ton parcours étape par étape pour créer des connexions authentiques sur SferaLuna."
        >
          <div className="mt-5 flex flex-wrap gap-2.5">
            {[
              { icon: Clock, label: "30 min" },
              { icon: BarChart3, label: "Débutant" },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex h-9 items-center gap-2 rounded-full border border-violet-300/35 bg-[#1b0d38]/70 px-4 text-sm font-medium text-white backdrop-blur">
                <Icon className="h-4 w-4 text-fuchsia-300" /> {label}
              </span>
            ))}
          </div>
          <h2 className="mt-6 text-xl font-bold text-white">Bienvenue dans l’univers Luna</h2>
          <p className="mt-1.5 max-w-xl text-[15px] leading-relaxed text-white/80">
            Que tu sois ici pour faire de nouvelles rencontres, élargir ton cercle ou vivre des expériences uniques, ce guide t’accompagne pas à pas.
          </p>
        </PageHero>

        {/* Fil des étapes */}
        <ol className="relative !mt-10 hidden grid-cols-5 gap-4 xl:grid">
          <span className="absolute left-[4%] right-[16%] top-[21px] h-px bg-gradient-to-r from-fuchsia-400/80 via-violet-400/70 to-fuchsia-400/80" aria-hidden />
          {STEPS.map(({ short, duration }, i) => (
            <li key={short} className="relative flex items-center gap-4 pl-[4%]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-fuchsia-300/80 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg font-bold text-white shadow-[0_0_22px_-2px_rgba(217,70,239,0.9)]">
                {i + 1}
              </span>
              <span>
                <span className="block font-semibold text-white">{short}</span>
                <span className="block text-sm text-white/65">{duration}</span>
              </span>
            </li>
          ))}
        </ol>

        {/* Étapes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:!mt-5 xl:grid-cols-5">
          {STEPS.map(({ title, text, points, icon: Icon, scene, cta, href, appHref, duration }, i) => (
            <article key={title} className={cn(PANEL, "flex flex-col overflow-hidden border-fuchsia-300/25")}>
              <div className="relative h-24">
                <SceneArt variant={scene} seed={i + 11} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b0d38] to-transparent" />
                <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border border-fuchsia-200/70 bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold text-white">{i + 1}</span>
                <span className="absolute bottom-2 right-3 flex h-11 w-11 items-center justify-center rounded-xl border border-fuchsia-300/50 bg-[#2a0f52]/85 backdrop-blur">
                  <Icon className="h-5 w-5 text-fuchsia-200" />
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 pt-2">
                <h3 className="text-[17px] font-semibold leading-snug text-white">{title}</h3>
                <p className="mt-1 text-xs text-pink-300 xl:hidden">{duration}</p>
                <MobileFold defaultOpen={i === 0} className="sm:!flex sm:flex-1 sm:flex-col" label="Voir cette étape" hideLabel="Replier" buttonClassName="!mt-1">
                <p className="mt-2 text-sm leading-relaxed text-white/70">{text}</p>
                <ul className="mt-3 flex-1 space-y-2">
                  {points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-white/80">
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-300" /> {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href={loggedIn ? appHref : href}
                  className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-violet-200/35 text-sm font-medium text-white transition hover:border-fuchsia-300/70 hover:bg-fuchsia-500/10"
                >
                  {i === 0 && loggedIn ? "Voir mon profil" : cta} <ArrowRight className="h-4 w-4" />
                </Link>
                </MobileFold>
              </div>
            </article>
          ))}
        </div>

        {/* Questions + conseils */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 xl:grid-cols-2 xl:items-start">
          <section className={cn(PANEL, "p-4 sm:p-5")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-3 text-lg font-bold text-white">
                <HelpCircle className="h-6 w-6 text-fuchsia-300" /> Questions fréquentes
              </h2>
              <Link href="/faq" className="inline-flex items-center gap-1.5 text-sm text-pink-300 hover:underline">
                Voir toutes les FAQs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-3 space-y-2">
              {QUESTIONS.map(({ question, faq }) => {
                const answer = FAQS.find((f) => f.id === faq)?.answer;
                if (!answer) return null;
                const isOpen = open === faq;
                return (
                  <div key={faq} className={cn(TILE, "transition", isOpen && "border-fuchsia-300/45")}>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : faq)}
                      aria-expanded={isOpen}
                      aria-controls={`guide-faq-${faq}`}
                      className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-white"
                    >
                      {question}
                      <ChevronDown className={cn("h-4 w-4 shrink-0 text-white/70 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {isOpen && (
                      <p id={`guide-faq-${faq}`} className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-white/75">
                        {answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className={cn(PANEL, "p-4 sm:p-5")}>
            <h2 className="flex items-center gap-3 text-lg font-bold text-white">
              <UsersRound className="h-6 w-6 text-fuchsia-300" /> Nos conseils pour bien démarrer
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {TIPS.map(({ icon: Icon, tone, title, text, featured }) => (
                <div key={title} className={cn(TILE, "flex gap-3 p-4", featured && "border-amber-300/40 bg-gradient-to-br from-[#3a2440]/80 to-[#2a1438]/80")}>
                  <Icon className={cn("mt-0.5 h-7 w-7 shrink-0", tone)} />
                  <div>
                    <h3 className="text-sm font-semibold leading-snug text-white">{title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Appel à l'action */}
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-fuchsia-300/35 p-5 md:flex-row md:items-center">
          <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${BG})`, backgroundPosition: "center 52%" }} aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b0d38]/75 via-[#1b0d38]/85 to-[#1b0d38]/75" aria-hidden />
          <div className="relative flex min-w-0 flex-1 items-center gap-4 md:pl-[22%]">
            <Send className="h-9 w-9 shrink-0 text-fuchsia-300 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]" />
            <div>
              <h2 className="text-xl font-bold text-white">
                Prête à commencer <span className="bg-gradient-to-r from-violet-300 to-fuchsia-400 bg-clip-text text-transparent">ton voyage</span> ?
              </h2>
              <p className="mt-0.5 text-sm text-white/80">Rejoins une communauté bienveillante et vis des rencontres authentiques.</p>
            </div>
          </div>
          <div className="relative flex flex-col gap-3 sm:flex-row">
            <Link href={loggedIn ? "/explorer" : "/auth?mode=register"} className={cn(BAND_PRIMARY, "rounded-full")}>
              {loggedIn ? "Explorer librement" : "Commencer maintenant"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/faq" className={cn(BAND_GHOST, "rounded-full bg-[#1b0d38]/60")}>
              Voir toutes les FAQs
            </Link>
          </div>
        </div>
      </PageBody>
    </SiteShell>
  );
}
