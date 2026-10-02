// src/app/accessibilite/page.tsx

/**
 * Engagement accessibilité.
 *
 * Ce texte décrit des objectifs et des mesures, pas une conformité certifiée :
 * aucun audit complet n'a été réalisé à ce jour (voir « Limitations connues »).
 * À mettre à jour après un audit, avec le taux de conformité obtenu.
 */

import Link from "next/link";
import {
  Accessibility,
  ArrowRight,
  CircleAlert,
  Code2,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Keyboard,
  Mail,
  MessageSquareMore,
  Scale,
  Settings,
  Target,
  Volume2,
  type LucideIcon,
} from "lucide-react";

import { buildMeta } from "@/app/layout-meta";
import { SiteShell } from "@/components/site/sections";
import { BAND_PRIMARY, PANEL, PageBody, PageHero, PhotoBackdrop, Pink, TILE } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

export const metadata = buildMeta(
  "Accessibilité",
  "L’engagement de SferaLuna pour une plateforme accessible : mesures prises, limites connues, comment signaler une difficulté.",
  "/accessibilite"
);

const BG = "/images/guide-accessibilite-bg.webp";
const CONTACT = "contact@sferaluna.com";

const MEASURES: { icon: LucideIcon; tone: string; title: string; text: string }[] = [
  { icon: Eye, tone: "text-violet-300 ring-violet-400/50", title: "Contrastes", text: "Des couleurs et contrastes pensés pour une bonne lisibilité, y compris sur fond sombre." },
  { icon: Keyboard, tone: "text-pink-300 ring-pink-400/50", title: "Navigation clavier", text: "Les fonctionnalités principales sont conçues pour être utilisables au clavier." },
  { icon: ImageIcon, tone: "text-amber-300 ring-amber-400/50", title: "Textes alternatifs", text: "Les images porteuses de sens disposent de textes alternatifs pour les lecteurs d’écran." },
  { icon: Code2, tone: "text-fuchsia-300 ring-fuchsia-400/50", title: "Structure sémantique", text: "Une structure de page claire, avec des balises HTML appropriées et des attributs ARIA lorsque c’est nécessaire." },
  { icon: FileText, tone: "text-pink-300 ring-pink-400/50", title: "Formulaires accessibles", text: "Des champs correctement labellisés, des instructions claires et des messages d’erreur explicites." },
  { icon: Volume2, tone: "text-blue-300 ring-blue-400/50", title: "Lecteurs d’écran", text: "Des pages structurées pour être lues par les lecteurs d’écran comme VoiceOver et NVDA." },
];

export default function AccessibilitePage() {
  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PhotoBackdrop src={BG} />

        <PageHero
          scene={false}
          pill="Accessibilité"
          pillIcon={Accessibility}
          title={
            <>
              Engagement
              <br />
              <Pink>accessibilité</Pink>
            </>
          }
        >
          <p className="mt-4 max-w-md text-xl font-semibold leading-snug text-white">SferaLuna s’engage à rendre sa plateforme accessible à toutes.</p>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-white/85">
            Nous travaillons pour que chacune puisse profiter d’une expérience fluide, claire et agréable, quelles que soient ses capacités et ses besoins : navigation au clavier, lecteurs d’écran,
            respect des standards d’accessibilité.
          </p>
        </PageHero>

        {/* Engagement */}
        <div className={cn(PANEL, "!mt-10 flex items-center gap-5 border-fuchsia-300/35 bg-gradient-to-r from-[#2a1158]/90 to-[#1b0d38]/85 p-5 sm:p-6")}>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-fuchsia-300/60 bg-[#2a0f52] shadow-[0_0_24px_-4px_rgba(217,70,239,0.8)]">
            <Target className="h-8 w-8 text-fuchsia-200" />
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">Notre engagement</h2>
            <p className="mt-1.5 max-w-4xl text-[15px] leading-relaxed text-white/80">
              SferaLuna vise une expérience conforme aux recommandations <strong className="font-semibold text-white">WCAG 2.1 niveau AA</strong> et s’inscrit dans les principes de{" "}
              <strong className="font-semibold text-white">la loi française n° 2005-102</strong> pour l’égalité des droits et des chances, la participation et la citoyenneté des personnes en situation
              de handicap.
            </p>
          </div>
        </div>

        {/* Mesures */}
        <section className={cn(PANEL, "p-4 sm:p-5")}>
          <div className="flex items-start gap-4">
            <Settings className="mt-0.5 h-8 w-8 shrink-0 text-fuchsia-300" />
            <div>
              <h2 className="text-xl font-bold text-white">Mesures prises</h2>
              <p className="text-sm text-white/70">Voici les principales actions mises en place pour améliorer l’accessibilité de SferaLuna.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {MEASURES.map(({ icon: Icon, tone, title, text }) => (
              <div key={title} className={cn(TILE, "border-fuchsia-300/20 bg-gradient-to-b from-[#241046]/90 to-[#170a30]/90 p-4")}>
                <span className={cn("flex h-11 w-11 items-center justify-center rounded-full bg-[#150a2c] ring-1", tone)}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-[15px] font-semibold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Limites, signalement, recours */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
          <section className={cn(PANEL, "flex gap-4 p-5")}>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#150a2c] ring-1 ring-orange-400/60">
              <CircleAlert className="h-5 w-5 text-orange-300" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Limitations connues</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                Le site n’a pas encore fait l’objet d’un audit d’accessibilité complet : sa conformité n’est donc pas établie. Certaines fonctionnalités sont encore en cours d’amélioration, et nous
                corrigeons les obstacles au fur et à mesure qu’ils nous sont signalés.
              </p>
            </div>
          </section>

          <section className={cn(PANEL, "p-5")}>
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 ring-1 ring-violet-300/40">
                <Mail className="h-5 w-5 text-fuchsia-200" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Signaler un problème</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Si vous rencontrez une difficulté d’accessibilité sur SferaLuna, vous pouvez nous la signaler. Notre équipe s’engage à vous répondre dans un délai de 5 jours ouvrables.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              <a
                href={`mailto:${CONTACT}?subject=Accessibilit%C3%A9`}
                className="inline-flex h-11 min-w-0 items-center justify-center gap-2.5 rounded-full border border-violet-200/35 px-4 text-sm font-medium text-white transition hover:border-fuchsia-300/70"
              >
                <Mail className="h-4 w-4 shrink-0" /> <span className="truncate">{CONTACT}</span>
              </a>
              <Link href="/contact" className={cn(BAND_PRIMARY, "h-11 rounded-full px-5 text-sm")}>
                Accéder au formulaire <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          <section className={cn(PANEL, "p-5")}>
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/25 ring-1 ring-fuchsia-300/40">
                <Scale className="h-5 w-5 text-fuchsia-200" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-white">Voies de recours</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">
                  Si vous avez signalé un défaut d’accessibilité sans obtenir de réponse satisfaisante, vous pouvez contacter le Défenseur des droits.
                </p>
              </div>
            </div>
            <a
              href="https://www.defenseurdesdroits.fr/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-11 items-center gap-2.5 rounded-full border border-violet-200/35 px-5 text-sm font-semibold text-white transition hover:border-fuchsia-300/70"
            >
              Site du Défenseur des droits <ExternalLink className="h-4 w-4" />
              <span className="sr-only">(nouvelle fenêtre)</span>
            </a>
          </section>
        </div>

        {/* Centre d'aide */}
        <div className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-fuchsia-300/35 p-5 md:flex-row md:items-center">
          <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${BG})`, backgroundPosition: "center 52%" }} aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1b0d38]/75 via-[#1b0d38]/85 to-[#1b0d38]/75" aria-hidden />
          <div className="relative flex min-w-0 flex-1 items-center gap-4 md:pl-[22%]">
            <MessageSquareMore className="h-9 w-9 shrink-0 text-fuchsia-300 drop-shadow-[0_0_12px_rgba(217,70,239,0.8)]" />
            <div>
              <h2 className="text-xl font-bold text-white">Une question sur l’accessibilité ?</h2>
              <p className="mt-0.5 text-sm text-white/80">Notre centre d’aide contient de nombreuses réponses aux questions fréquentes.</p>
            </div>
          </div>
          <Link href="/faq" className={cn(BAND_PRIMARY, "relative rounded-full")}>
            Accéder au centre d’aide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </PageBody>
    </SiteShell>
  );
}
