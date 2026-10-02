// src/app/valeurs/page.tsx

"use client";

/**
 * Nos valeurs : principes, piliers de la communauté, chiffres réels
 * (/api/stats) et dernier témoignage publié (/api/testimonials).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Flower2,
  Heart,
  Leaf,
  Lock,
  MessageCircle,
  MessagesSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

import { SiteShell, useIsLoggedIn, useSiteStats } from "@/components/site/sections";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PANEL, PageBody, PageHero, Pink, SectionTitle, StatTile, TILE, statValue } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

const PRINCIPLES: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: ShieldCheck, title: "Zéro harcèlement", text: "Tolérance zéro pour tout comportement inapproprié." },
  { icon: Heart, title: "Respect des limites", text: "Chacune avance à son rythme." },
  { icon: Lock, title: "Confidentialité", text: "Tes données et échanges sont protégés." },
  { icon: MessageCircle, title: "Écoute active", text: "Une communauté bienveillante et attentive." },
  { icon: UsersRound, title: "Diversité célébrée", text: "Toutes les histoires, tous les parcours sont légitimes." },
  { icon: Sprout, title: "Apprentissage continu", text: "Nous évoluons grâce à vos retours." },
];

const PILLARS: { icon: LucideIcon; tone: string; title: string; text: string; tags: [string, string] }[] = [
  { icon: Flower2, tone: "text-pink-300", title: "Authenticité", text: "Être soi, sans masque. Nous valorisons la sincérité et les intentions claires.", tags: ["Profils vérifiés", "Intentions transparentes"] },
  { icon: ShieldCheck, tone: "text-violet-300", title: "Sécurité", text: "Un environnement sûr et modéré pour des échanges sereins.", tags: ["Modération active", "Mode fantôme"] },
  { icon: Users, tone: "text-fuchsia-300", title: "Inclusivité", text: "Toutes les identités, tous les parcours et toutes les orientations sont les bienvenus.", tags: ["Diversité", "Respect de chacune"] },
  { icon: Heart, tone: "text-pink-400", title: "Bienveillance", text: "Des échanges respectueux et une communauté qui se soutient.", tags: ["Respect", "Aide entre membres"] },
  { icon: Leaf, tone: "text-emerald-300", title: "Évolution", text: "Grandir, apprendre et se découvrir à travers des rencontres et des contenus inspirants.", tags: ["VibeMentor", "Événements"] },
  { icon: Moon, tone: "text-amber-200", title: "Connexion profonde", text: "Des liens authentiques et significatifs, au-delà du superficiel.", tags: ["VibeSphere", "Journal émotionnel"] },
];

type Testimonial = { _id: string; authorName: string; age?: number; city?: string; content: string; rating: number };

export default function ValeursPage() {
  const stats = useSiteStats();
  const loggedIn = useIsLoggedIn();
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    fetch("/api/testimonials")
      .then((r) => r.json())
      .then((d) => d?.success && d.testimonials?.[0] && setTestimonial(d.testimonials[0]))
      .catch(() => {});
  }, []);

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PageHero
          id="val"
          pill="L’ADN de SferaLuna"
          pillIcon={Sparkles}
          title={
            <>
              Nos valeurs <Pink>fondamentales</Pink>
            </>
          }
          text="Chez SferaLuna, nous croyons qu’il est possible de créer un espace sûr, doux et libre pour les femmes. Nous réinventons les rencontres en ligne avec plus de respect, de clarté et d’humanité."
        />

        {/* Principes */}
        <SectionTitle className="!mt-10" icon={Heart} title="Nos principes" subtitle="Les fondations qui guident chacune de nos actions et décisions." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title} className={cn(TILE, "flex items-center gap-3 p-4")}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-300/20">
                <Icon className="h-5 w-5 text-fuchsia-300" />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-0.5 text-xs leading-snug text-white/60">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Piliers */}
        <SectionTitle className="!mt-8" icon={Sparkles} tone="gold" title="Les piliers de notre communauté" subtitle="Des valeurs concrètes au service d’une expérience plus humaine et authentique." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {PILLARS.map(({ icon: Icon, tone, title, text, tags }) => (
            <article key={title} className={cn(PANEL, "flex flex-col items-center p-6 text-center transition hover:border-fuchsia-300/40 xl:px-3 xl:py-5")}>
              <Icon className={cn("h-10 w-10 drop-shadow-[0_0_14px_rgba(217,70,239,0.55)]", tone)} />
              <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">{text}</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-violet-300/25 bg-white/[0.04] px-3 py-1 text-xs text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Chiffres */}
        <SectionTitle className="!mt-8" icon={BarChart3} title="Notre impact en chiffres" subtitle="Les chiffres réels de la communauté, mis à jour en continu." />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile icon={Users} label="Membres" hint="Une communauté grandissante" value={statValue(stats?.membres)} />
          <StatTile icon={Heart} label="Matchs créés" hint="Des connexions authentiques" value={statValue(stats?.matchs)} />
          <StatTile icon={MessageCircle} label="Messages échangés" hint="Des conversations enrichissantes" value={statValue(stats?.messages)} />
          <StatTile icon={CalendarDays} label="Événements" hint="Des rencontres dans la vraie vie" value={statValue(stats?.evenements)} />
        </div>

        {/* Témoignages */}
        <div className="!mt-8 grid gap-4 lg:grid-cols-[minmax(0,300px)_1fr] lg:items-center">
          <SectionTitle icon={MessagesSquare} title="Témoignages de notre communauté" subtitle="Elles partagent leur expérience sur SferaLuna." />
          <Link href="/temoignages" className={cn(PANEL, "group flex items-center gap-4 border-fuchsia-300/25 bg-gradient-to-r from-[#2a1158]/85 to-[#1b0d38]/85 p-5 transition hover:border-fuchsia-300/50")}>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-500/25">
              {testimonial ? <Star className="h-6 w-6 fill-amber-300 text-amber-300" /> : <UsersRound className="h-6 w-6 text-fuchsia-200" />}
            </span>
            <div className="min-w-0 flex-1">
              {testimonial ? (
                <>
                  <p className="line-clamp-2 italic text-white/90">« {testimonial.content} »</p>
                  <p className="mt-1 text-sm text-white/60">
                    {testimonial.authorName}
                    {testimonial.age ? `, ${testimonial.age} ans` : ""}
                    {testimonial.city ? ` · ${testimonial.city}` : ""}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">Les premiers témoignages arrivent bientôt !</p>
                  <p className="mt-0.5 text-sm text-white/65">Sois parmi les premières à partager ton expérience.</p>
                </>
              )}
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-pink-300 transition group-hover:translate-x-0.5" />
          </Link>
        </div>

        <CtaBand
          className="!mt-8"
          title={
            <>
              Prête à rejoindre une communauté qui <Pink>te</Pink> ressemble ?
            </>
          }
          text="Des rencontres plus vraies, dans un espace bienveillant et sécurisé."
        >
          <Link href="/fonctionnalites" className={BAND_GHOST}>
            Découvrir les fonctionnalités
          </Link>
          <Link href={loggedIn ? "/explorer" : "/auth?mode=register"} className={BAND_PRIMARY}>
            {loggedIn ? "Explorer librement" : "Créer mon compte gratuit"} <ArrowRight className="h-4 w-4" />
          </Link>
        </CtaBand>
      </PageBody>
    </SiteShell>
  );
}
