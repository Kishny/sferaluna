// src/app/equipe/page.tsx

/**
 * L'équipe : elle n'est pas encore présentée nominativement. La page décrit
 * les pôles de travail (aucun nom, aucune photo de personne inventée).
 * Quand l'équipe sera dévoilée, remplacer les vignettes illustrées par les
 * portraits et `role` par le nom de la personne.
 */

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Code2,
  Heart,
  Lightbulb,
  Mail,
  PenTool,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { SiteShell } from "@/components/site/sections";
import { SceneArt, type SceneVariant } from "@/components/site/art";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PANEL, PageBody, PageHero, Pink, SectionTitle } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

const GUIDES: { icon: LucideIcon; tone: string; title: string; text: string }[] = [
  { icon: Heart, tone: "text-pink-300 ring-pink-400/50", title: "Authenticité", text: "Des échanges vrais et respectueux, sans faux profils, dans un cadre bienveillant." },
  { icon: ShieldCheck, tone: "text-violet-200 ring-violet-400/50", title: "Sécurité", text: "La protection de nos membres est au cœur de tout ce que nous construisons." },
  { icon: Lightbulb, tone: "text-amber-300 ring-amber-400/50", title: "Innovation", text: "Nous réinventons les rencontres avec des outils modernes et une approche centrée sur l’humain." },
];

const POLES: { icon: LucideIcon; scene: SceneVariant; title: string; role: string; text: string }[] = [
  { icon: PenTool, scene: "dusk", title: "Direction créative", role: "Vision produit", text: "Nous imaginons l’expérience, la tonalité, les parcours et les fonctionnalités pour créer un espace unique et inspirant." },
  { icon: ShieldCheck, scene: "river", title: "Modération", role: "Sécurité & confiance", text: "Nous veillons à la protection de la communauté grâce à la modération, au signalement, à la vérification et aux règles communautaires." },
  { icon: Code2, scene: "night", title: "Tech & plateforme", role: "Développement", text: "Nous construisons une plateforme fiable et performante : interface, API, authentification, matchs, messagerie et services premium." },
  { icon: UsersRound, scene: "hills", title: "Expérience membre", role: "Communauté", text: "Nous écoutons vos retours, améliorons les parcours et veillons à une atmosphère douce, claire et inclusive." },
];

const PROMISES: { icon: LucideIcon; text: string }[] = [
  { icon: Heart, text: "Un produit pensé pour les femmes" },
  { icon: ShieldCheck, text: "Une modération active et bienveillante" },
  { icon: UsersRound, text: "Une écoute constante de la communauté" },
];

/** Silhouette vue de dos, posée sur la vignette d'un pôle. */
function Silhouette({ variant }: { variant: number }) {
  return (
    <svg viewBox="0 0 120 120" className="absolute bottom-0 left-1/2 h-[88%] -translate-x-1/2" aria-hidden>
      <g fill="#150829">
        <path d="M14 120 Q14 76 60 70 Q106 76 106 120 Z" />
        <circle cx="60" cy="48" r="20" />
        {variant % 2 === 0 ? (
          <path d="M38 50 Q32 16 60 16 Q88 16 82 50 Q92 78 80 98 Q68 84 60 70 Q52 84 40 98 Q28 78 38 50 Z" />
        ) : (
          <>
            <path d="M39 46 Q38 24 60 24 Q82 24 81 46 Q70 36 60 36 Q50 36 39 46 Z" />
            <circle cx="60" cy="20" r="12" />
          </>
        )}
      </g>
    </svg>
  );
}

export default function EquipePage() {
  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PageHero
          id="eq"
          pill="Notre équipe"
          pillIcon={ShieldCheck}
          title={
            <>
              L’équipe <Pink>SferaLuna</Pink>
              <br />
              se dévoilera <Pink>bientôt</Pink>
            </>
          }
          text="Nous construisons un réseau social plus sûr, plus humain et plus élégant pour les femmes."
          note={
            <>
              Des personnes vraies,
              <br />
              derrière une vision forte ♡
            </>
          }
        />

        {/* Ce qui guide l'équipe */}
        <SectionTitle className="!mt-10" icon={Sparkles} tone="gold" title="Ce qui guide notre équipe" subtitle="Des valeurs fortes qui inspirent chacune de nos décisions." />
        <div className="grid gap-3 lg:grid-cols-3">
          {GUIDES.map(({ icon: Icon, tone, title, text }) => (
            <div key={title} className={cn(PANEL, "flex items-center gap-5 bg-gradient-to-br from-[#2a1158]/80 to-[#1b0d38]/80 p-5")}>
              <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#150a2c] ring-2", tone)}>
                <Icon className="h-6 w-6 fill-current" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/70">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Pôles */}
        <SectionTitle className="!mt-8" icon={UsersRound} title="Les pôles SferaLuna" subtitle="Une équipe complémentaire, engagée pour offrir la meilleure expérience possible." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {POLES.map(({ icon: Icon, scene, title, role, text }, i) => (
            <article key={title} className={cn(PANEL, "overflow-hidden")}>
              <div className="relative h-36">
                <SceneArt variant={scene} seed={i + 5} className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b0d38] via-transparent to-transparent" />
                <Silhouette variant={i} />
                <span className="absolute bottom-3 right-3 rounded-full border border-violet-300/35 bg-[#1b0d38]/85 px-3 py-1 text-xs text-white/90 backdrop-blur">Bientôt dévoilé</span>
              </div>
              <div className="p-5 pt-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg">
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-xs text-white/60">{role}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{text}</p>
              </div>
            </article>
          ))}
        </div>

        {/* Promesses */}
        <div className={cn(PANEL, "!mt-6 flex flex-col gap-5 p-5 xl:flex-row xl:items-center")}>
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/25">
              <BarChart3 className="h-6 w-6 text-fuchsia-300" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Une équipe pensée pour une communauté plus sûre</h2>
              <p className="mt-0.5 text-sm text-white/70">Nous travaillons pour offrir un espace d’échange de qualité, avec des outils modernes et une approche profondément humaine.</p>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-3 xl:flex xl:shrink-0 xl:gap-6">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 xl:max-w-[180px] xl:border-l xl:border-violet-300/15 xl:pl-6">
                <Icon className="h-7 w-7 shrink-0 text-fuchsia-300" />
                <span className="text-sm leading-snug text-white/85">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <CtaBand icon={Send} title="Envie de nous rejoindre ?" text="Tu partages nos valeurs et tu souhaites contribuer à un projet qui a du sens ? Écris-nous.">
          <Link href="/contact" className={BAND_PRIMARY}>
            <Mail className="h-5 w-5" /> Nous contacter <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/valeurs" className={BAND_GHOST}>
            Découvrir nos valeurs
          </Link>
        </CtaBand>
      </PageBody>
    </SiteShell>
  );
}
