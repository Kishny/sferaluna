// src/app/histoire/page.tsx

"use client";

/**
 * Notre histoire : pourquoi SferaLuna existe, les étapes du projet,
 * ce qui nous guide. Les chiffres « Notre impact » viennent de /api/stats
 * (aucune valeur inventée : « — » tant qu'un compteur est à zéro).
 */

import Link from "next/link";
import {
  CalendarDays,
  Heart,
  Leaf,
  MessageCircle,
  Quote,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  User,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { SiteShell, useIsLoggedIn, useSiteStats } from "@/components/site/sections";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PANEL, PageBody, PageHero, Pink, StatTile, TILE, statValue } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

const WHY: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Sécurité des femmes avant tout", text: "Des outils et une modération pensés pour un espace plus sûr." },
  { icon: Heart, title: "Connexions par valeurs", text: "Des rencontres plus sincères, basées sur ce qui compte vraiment." },
  { icon: UsersRound, title: "Espace bienveillant", text: "Une communauté respectueuse et inclusive." },
  { icon: TrendingUp, title: "Communauté évolutive", text: "Une plateforme qui grandit avec ses membres et leurs besoins." },
];

const TIMELINE: { icon: LucideIcon; period: string; title: string; text: string }[] = [
  { icon: Leaf, period: "Printemps 2024", title: "Le déclic", text: "Une prise de conscience : il est temps d’imaginer un espace différent pour les femmes." },
  { icon: Settings, period: "Été 2024", title: "La construction", text: "Structuration du projet, développement de la plateforme et définition de nos valeurs." },
  { icon: Users, period: "Automne 2024", title: "Les premières vagues", text: "Les premières membres nous rejoignent et donnent vie à la communauté." },
  { icon: Star, period: "Hiver 2024 – 2025", title: "La communauté s’éveille", text: "VibeMentor, les événements LunaGather et la Communauté ouvrent de nouveaux espaces d’échange." },
  { icon: Rocket, period: "Aujourd’hui", title: "Le voyage continue", text: "SferaLuna évolue, s’enrichit et ouvre de nouveaux horizons pour sa communauté." },
];

const GUIDES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "La sécurité d’abord", text: "Protéger et respecter chaque membre à chaque étape." },
  { icon: Heart, title: "L’authenticité toujours", text: "Des échanges vrais, loin des faux profils et des intentions superficielles." },
  { icon: UsersRound, title: "Une communauté réelle", text: "Des membres engagées qui partagent des valeurs communes." },
  { icon: Sparkles, title: "L’expérience féminine", text: "Une plateforme pensée par et pour les femmes, à leur rythme, selon leurs termes." },
];

export default function HistoirePage() {
  const stats = useSiteStats();
  const loggedIn = useIsLoggedIn();

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PageHero
          id="hist"
          pill="Née en 2024 · Made in France"
          title={
            <>
              Notre <Pink>histoire</Pink>
            </>
          }
          text="Tout a commencé par une question : pourquoi les femmes mériteraient moins bien dans les rencontres en ligne ?"
          note={
            <>
              Un espace
              <br />
              pour être soi ♡
            </>
          }
        />

        {/* Pourquoi */}
        <div className={cn(PANEL, "!mt-10 grid gap-5 p-5 sm:p-6 xl:grid-cols-[1fr_1.7fr] xl:items-center")}>
          <div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">Pourquoi SferaLuna existe</h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Dans les applications de rencontres classiques, il y a trop de volume et pas assez de qualité. Les femmes font face à des interactions non désirées, un manque de sécurité et des
              algorithmes souvent centrés sur l’apparence.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              SferaLuna est née comme une réponse : une plateforme premium, <span className="font-semibold text-pink-300">sécurisée, authentique et pensée pour l’expérience féminine.</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {WHY.map(({ icon: Icon, title, text }) => (
              <div key={title} className={cn(TILE, "p-4")}>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500">
                  <Icon className="h-5 w-5 text-white" />
                </span>
                <h3 className="mt-3 text-sm font-semibold leading-snug text-white">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-white/60">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Parcours */}
        <div className={cn(PANEL, "p-5 sm:p-6")}>
          <h2 className="text-xl font-bold text-white">Le parcours — De l’idée à la plateforme</h2>
          <p className="mt-0.5 text-sm text-white/65">Une aventure guidée par une conviction forte.</p>

          <ol className="relative mt-6 grid gap-6 lg:grid-cols-5 lg:gap-4">
            {/* Ligne : verticale sur mobile, horizontale sur grand écran */}
            <span className="absolute bottom-4 left-[19px] top-4 w-px bg-gradient-to-b from-fuchsia-400/70 to-violet-400/40 lg:bottom-auto lg:left-[10%] lg:right-[10%] lg:top-[19px] lg:h-px lg:w-auto lg:bg-gradient-to-r" aria-hidden />
            {TIMELINE.map(({ icon: Icon, period, title, text }) => (
              <li key={period} className="relative flex gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/60 bg-[#2a0f52] shadow-[0_0_18px_-2px_rgba(217,70,239,0.7)]">
                  <Icon className="h-[18px] w-[18px] text-fuchsia-200" />
                </span>
                <div className="lg:mt-3">
                  <p className="text-sm font-medium text-pink-300">{period}</p>
                  <h3 className="mt-0.5 font-semibold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/65 lg:mx-auto lg:max-w-[220px]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Ce qui nous guide + citation */}
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className={cn(PANEL, "p-5 sm:p-6")}>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-xl font-bold text-white">Ce qui nous guide</h2>
              <p className="text-sm text-white/65">Des valeurs fortes pour faire de SferaLuna un espace unique.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {GUIDES.map(({ icon: Icon, title, text }) => (
                <div key={title} className={cn(TILE, "flex items-start gap-4 p-4")}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-violet-500">
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-sm leading-snug text-white/65">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <figure className="relative overflow-hidden rounded-3xl border border-violet-300/[0.16] bg-gradient-to-br from-[#2a1158]/90 to-[#1b0d38]/90 p-6 backdrop-blur-xl sm:p-8">
            <span className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-pink-200/80 to-violet-500/60 opacity-60 blur-[2px]" aria-hidden />
            <Quote className="h-9 w-9 fill-violet-400/70 text-violet-400/70" />
            <blockquote className="relative mt-3 text-lg italic leading-relaxed text-white/90">
              SferaLuna n’est pas juste une application. C’est la conviction que les femmes méritent un espace où elles peuvent rencontrer, vibrer et s’épanouir — à leur rythme, selon leurs
              termes.
            </blockquote>
            <figcaption className="relative mt-4 text-right text-sm text-white/65">— L’équipe SferaLuna</figcaption>
          </figure>
        </div>

        {/* Impact */}
        <div className={cn(PANEL, "p-5 sm:p-6")}>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-xl font-bold text-white">Notre impact</h2>
            <p className="text-sm text-white/65">Les chiffres de la communauté, mis à jour en continu.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile icon={Users} label="Membres" hint="Profils complétés" value={statValue(stats?.membres)} />
            <StatTile icon={Heart} label="Matchs" hint="Des connexions qui comptent" value={statValue(stats?.matchs)} />
            <StatTile icon={MessageCircle} label="Messages" hint="Des conversations authentiques" value={statValue(stats?.messages)} />
            <StatTile icon={CalendarDays} label="Événements" hint="Des rencontres dans la vraie vie" value={statValue(stats?.evenements)} />
          </div>
        </div>

        <CtaBand title="Écris ta propre histoire" text="SferaLuna n’est pas que notre histoire — c’est la tienne aussi.">
          <Link href={loggedIn ? "/explorer" : "/auth?mode=register"} className={BAND_PRIMARY}>
            <User className="h-5 w-5" /> {loggedIn ? "Explorer librement" : "Rejoindre SferaLuna"}
          </Link>
          <Link href="/valeurs" className={BAND_GHOST}>
            <Star className="h-5 w-5" /> Nos valeurs
          </Link>
        </CtaBand>
      </PageBody>
    </SiteShell>
  );
}
