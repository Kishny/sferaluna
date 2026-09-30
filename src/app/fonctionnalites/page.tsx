'use client';

/**
 * /fonctionnalites — l'expérience SferaLuna en séquences visuelles
 * (et non plus en catalogue) : chaque fonctionnalité a son nom propriétaire
 * et un aperçu du produit.
 */

import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  Flower2,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageSquareText,
  NotebookPen,
  Palette,
  Search,
  SendHorizontal,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Trees,
  UserRound,
  Users,
  UsersRound,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';

import { SceneArt } from '@/components/site/art';
import { ExplorePreview } from '@/components/site/ProductMockup';
import { Container, FinalCta, SiteShell, StepsRow, reveal } from '@/components/site/sections';
import {
  AvatarStack,
  GLASS,
  GLASS_INNER,
  Glow,
  IconBadge,
  IllustratedAvatar,
  PrimaryButton,
  ScriptNote,
  SectionHeading,
  cn,
} from '@/components/site/ui';

// ─────────────────────────────────────────────
// Bloc fonctionnalité
// ─────────────────────────────────────────────

function FeatureBlock({
  id,
  num,
  icon: Icon,
  title,
  subtitle,
  text,
  cta,
  href,
  children,
  className = '',
  split = 'md:grid-cols-[1fr_1.15fr]',
}: {
  id: string;
  num: string;
  icon: ElementType;
  title: string;
  subtitle: string;
  text: string;
  cta: string;
  href: string;
  children?: ReactNode;
  className?: string;
  split?: string;
}) {
  return (
    <motion.article
      id={id}
      {...reveal}
      className={cn(GLASS, 'relative scroll-mt-28 overflow-hidden p-5 sm:p-6', className)}
    >
      <div className={cn('grid items-center gap-6', children ? split : '')}>
        <div>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-300/30 text-[11px] font-semibold text-white/70">
              {num}
            </span>
            <Icon className="mt-1 h-8 w-8 shrink-0 text-fuchsia-300" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h2>
              <p className="mt-1 text-base font-medium leading-snug text-white/90">{subtitle}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/65">{text}</p>
          <PrimaryButton href={href} size="sm" icon={null} className="mt-5">
            {cta}
          </PrimaryButton>
        </div>
        {children && <div className="min-w-0">{children}</div>}
      </div>
    </motion.article>
  );
}

function MiniTile({ icon, title, text }: { icon: ElementType; title: string; text: string }) {
  return (
    <div className={cn(GLASS_INNER, 'flex items-center gap-3 p-3.5')}>
      <IconBadge icon={icon} size="sm" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs leading-snug text-white/60">{text}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function FonctionnalitesPage() {
  return (
    <SiteShell>
      {/* Hero */}
      <section className="relative pb-10 pt-28 sm:pt-32 lg:pb-14 lg:pt-40">
        <Container className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl xl:text-[56px]">
              Tout ce qu’il vous faut
              {" "}<br className="hidden sm:block" />
              pour faire de <Glow>vraies rencontres.</Glow>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              SferaLuna combine découverte, affinités de confiance, échanges sincères, événements et
              accompagnement premium pour vous offrir une expérience complète et authentique.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { name: 'Explorer librement', id: 'explorer' },
                { name: 'Circle of Six', id: 'circle' },
                { name: 'Messages', id: 'messages' },
                { name: 'LunaGather', id: 'lunagather' },
                { name: 'VibePlanner', id: 'vibeplanner' },
                { name: 'VibeMentor', id: 'vibementor' },
                { name: 'VibeSphere', id: 'vibesphere' },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-full border border-violet-300/25 bg-white/[0.04] px-3.5 py-2.5 text-xs font-medium text-white/80 transition hover:border-fuchsia-300/60 hover:text-white"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative [perspective:1600px]"
          >
            <ScriptNote className="absolute -top-14 right-2 hidden rotate-[-5deg] lg:block">
              Des rencontres qui
              <br />
              font du bien, vraiment. ♡
            </ScriptNote>
            <ExplorePreview className="lg:[transform:rotateY(-9deg)_rotateX(3deg)]" />
          </motion.div>
        </Container>
      </section>

      <Container className="space-y-5 pb-6">
        {/* 01 — Explorer librement */}
        <FeatureBlock
          id="explorer"
          num="01"
          icon={Search}
          title="Explorer librement"
          subtitle="Découvrez des profils inspirants, près de chez vous et ailleurs."
          text="Parcourez des profils authentiques, filtrez selon vos envies et vos affinités, et laissez-vous surprendre par des rencontres inattendues."
          cta="Découvrir des profils"
          href="/explorer"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <MiniTile icon={UserRound} title="Des profils authentiques" text="Chaque membre a vérifié son identité" />
            <MiniTile icon={SlidersHorizontal} title="Filtres intelligents" text="Âge, intentions, ville, affinités" />
            <MiniTile icon={MapPin} title="Découverte locale" text="Dans votre département ou partout en France" />
            <MiniTile icon={Sparkles} title="Une expérience fluide" text="Un like, une affinité, une conversation" />
          </div>
        </FeatureBlock>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* 02 — Circle of Six */}
          <FeatureBlock
            id="circle"
            num="02"
            icon={Users}
            title="Circle of Six"
            subtitle="Des profils sélectionnés selon vos affinités."
            text="Chaque semaine, une sélection personnalisée de 6 profils, choisis pour leur réelle compatibilité avec vous."
            cta="Comment ça marche ?"
            href="/circle"
            split="xl:grid-cols-[1fr_1.05fr]"
          >
            <div className="relative">
              <div className={cn(GLASS_INNER, 'p-4')}>
                <AvatarStack count={4} size={46} extra="+2" />
                <p className="mt-3 text-lg font-semibold text-white">Circle of Six</p>
                <ul className="mt-2 space-y-1.5">
                  {['Des profils triés par affinités', 'Une sélection chaque semaine', 'Moins de choix, plus de sens', 'Des rencontres plus justes'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[13px] text-white/80">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/90">
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <ScriptNote className="mt-3 rotate-[-4deg] text-center text-[22px]">
                Moins de scroll, plus de belles rencontres. ♡
              </ScriptNote>
            </div>
          </FeatureBlock>

          {/* 03 — Messages */}
          <FeatureBlock
            id="messages"
            num="03"
            icon={MessageSquareText}
            title="Messages"
            subtitle="Des conversations sincères et de nouvelles rencontres."
            text="Échangez en temps réel avec vos affinités. Un filtre anti-harcèlement veille sur chaque conversation."
            cta="Commencer à échanger"
            href="/matches"
            split="xl:grid-cols-[1fr_1.15fr]"
          >
            <div className={cn(GLASS_INNER, 'space-y-2.5 p-3.5')}>
              <div className="flex items-end gap-2">
                <IllustratedAvatar seed={3} size={30} />
                <p className="max-w-[80%] rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-[12px] text-white/90">
                  J’adore aussi cet endroit ! Tu connais ce rooftop ? 🌙
                </p>
              </div>
              <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-r from-fuchsia-500 to-violet-600 px-3 py-2 text-[12px] text-white">
                Pas encore ! On pourrait y aller ensemble un de ces jours ?
              </p>
              <div className="flex items-end gap-2">
                <IllustratedAvatar seed={3} size={30} />
                <p className="rounded-2xl rounded-bl-md bg-white/10 px-3 py-2 text-[12px] text-white/90">Avec plaisir ! 😊</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-violet-300/15 bg-white/[0.04] py-1.5 pl-3 pr-1.5 text-[11px] text-white/40">
                <Smile className="h-3.5 w-3.5" /> Écrire un message…
                <ImageIcon className="ml-auto h-3.5 w-3.5" />
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600">
                  <SendHorizontal className="h-3 w-3 text-white" />
                </span>
              </div>
            </div>
          </FeatureBlock>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* 04 — LunaGather */}
          <FeatureBlock
            id="lunagather"
            num="04"
            icon={CalendarDays}
            title="LunaGather"
            subtitle="Des sorties et événements près de chez vous."
            text="Ateliers, dîners, balades, apéros : des moments pour se rencontrer naturellement, en vrai ou en ligne. Inscription en un clic."
            cta="Voir les événements"
            href="/evenements"
            split=""
          >
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { scene: 'rooftop' as const, icon: UtensilsCrossed, label: 'Dîners & apéros' },
                { scene: 'night' as const, icon: Palette, label: 'Ateliers & culture' },
                { scene: 'hills' as const, icon: Trees, label: 'Balades & nature' },
              ].map((tile, i) => (
                <div key={tile.label} className="relative h-36 overflow-hidden rounded-2xl border border-violet-300/15">
                  <SceneArt variant={tile.scene} seed={i + 12} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#150629] via-[#150629]/40 to-transparent" />
                  <tile.icon className="absolute left-2.5 top-2.5 h-5 w-5 text-amber-100" />
                  <p className="absolute inset-x-2.5 bottom-2.5 text-[12px] font-semibold leading-tight text-white">{tile.label}</p>
                </div>
              ))}
            </div>
          </FeatureBlock>

          {/* 05 — VibePlanner */}
          <FeatureBlock
            id="vibeplanner"
            num="05"
            icon={Compass}
            title="VibePlanner"
            subtitle="Des idées de sorties qui vous ressemblent."
            text="Proposez une idée de rendez-vous à votre match — dîner, culture, nature, art, bien-être — et choisissez ensemble. Elle accepte, vous y allez."
            cta="Explorer VibePlanner"
            href="/vibeplanner"
            split=""
          >
            <div className="relative h-40 overflow-hidden rounded-2xl border border-violet-300/15">
              <SceneArt variant="map" seed={3} className="absolute inset-0" />
              <div className="absolute left-3 right-3 top-3 flex flex-wrap gap-1.5">
                {[
                  { icon: UtensilsCrossed, label: 'Dîner' },
                  { icon: Palette, label: 'Culture' },
                  { icon: Trees, label: 'Nature' },
                  { icon: Sparkles, label: 'Art' },
                  { icon: Flower2, label: 'Bien-être' },
                ].map((chip) => (
                  <span key={chip.label} className="inline-flex items-center gap-1 rounded-full border border-violet-300/25 bg-[#1b0d38]/85 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur">
                    <chip.icon className="h-3 w-3 text-fuchsia-200" /> {chip.label}
                  </span>
                ))}
              </div>
              <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl border border-fuchsia-300/50 bg-[#1b0d38]/90 p-2 pr-3 shadow-lg shadow-fuchsia-900/40 backdrop-blur">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-fuchsia-500/20">
                  <Wine className="h-4 w-4 text-fuchsia-200" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold text-white">Apéro au coucher du soleil</p>
                  <p className="text-[10px] text-emerald-300">Idée acceptée ✓</p>
                </div>
              </div>
            </div>
          </FeatureBlock>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* 06 — VibeMentor */}
          <FeatureBlock
            id="vibementor"
            num="06"
            icon={Flower2}
            title="VibeMentor"
            subtitle="Un accompagnement bienveillant pour des rencontres plus alignées."
            text="Posez vos questions à la communauté, partagez vos expériences et, avec Elite, profitez d’un coaching mensuel."
            cta="Découvrir VibeMentor"
            href="/vibementor"
            split=""
          >
            <div className="grid gap-2.5 sm:grid-cols-2">
              <MiniTile icon={BookOpen} title="Conseils" text="Relations et bien-être" />
              <MiniTile icon={UsersRound} title="Entraide" text="Questions & réponses entre membres" />
              <MiniTile icon={Heart} title="Sans jugement" text="Une approche bienveillante" />
              <MiniTile icon={BadgeCheck} title="Coaching Elite" text="Un rendez-vous chaque mois" />
            </div>
          </FeatureBlock>

          {/* 07 — VibeSphere */}
          <FeatureBlock
            id="vibesphere"
            num="07"
            icon={Sparkles}
            title="VibeSphere"
            subtitle="Votre univers, en toute liberté."
            text="Un mood board partagé pour exprimer vos envies du moment, et un journal émotionnel privé pour prendre soin de vous."
            cta="Entrer dans la VibeSphere"
            href="/vibesphere"
            split=""
          >
            <div className="grid grid-cols-3 gap-2.5">
              {(['dusk', 'river', 'hills'] as const).map((scene, i) => (
                <div key={scene} className="relative h-28 overflow-hidden rounded-2xl border border-violet-300/15">
                  <SceneArt variant={scene} seed={i + 30} className="absolute inset-0" />
                  <Heart className="absolute bottom-2 right-2 h-4 w-4 fill-pink-400/80 text-pink-300" />
                </div>
              ))}
              <div className={cn(GLASS_INNER, 'col-span-3 flex items-center gap-3 p-3')}>
                <NotebookPen className="h-5 w-5 text-violet-200" />
                <p className="text-xs text-white/70">Journal émotionnel : humeur du jour, rituels, playlist.</p>
              </div>
            </div>
          </FeatureBlock>
        </div>
      </Container>

      {/* Parcours */}
      <section className="relative py-12 lg:py-16">
        <Container>
          <SectionHeading
            icon="moon"
            title={
              <>
                Une expérience <Glow>fluide</Glow>, du premier regard au premier rendez-vous
              </>
            }
            subtitle="De la découverte à la rencontre, chaque étape est pensée pour être simple, naturelle et agréable."
          />
          <div className="mt-7">
            <StepsRow
              steps={[
                { icon: Search, title: 'Découvrir', text: 'Explorez des profils authentiques et des événements près de chez vous.' },
                { icon: Heart, title: 'Matcher', text: 'Un like réciproque et l’affinité est créée.' },
                { icon: MessageSquareText, title: 'Échanger', text: 'Apprenez à vous connaître à travers des conversations sincères.' },
                { icon: Users, title: 'Se rencontrer', text: 'Un événement LunaGather ou une idée VibePlanner, et c’est parti.' },
              ]}
            />
          </div>
        </Container>
      </section>

      <FinalCta
        title="Prête à vivre des rencontres plus vraies ?"
        text="Rejoignez SferaLuna et découvrez toutes ses fonctionnalités."
        aside={
          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {['Gratuit pour commencer', 'Profils vérifiés', 'Une communauté bienveillante'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-white/75">
                <Check className="h-4 w-4 text-emerald-300" /> {item}
              </li>
            ))}
          </ul>
        }
      />

    </SiteShell>
  );
}
