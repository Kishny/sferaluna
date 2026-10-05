'use client';

/**
 * Accueil SferaLuna.
 *
 * Architecture (alignée sur l'espace connecté) :
 * Hero + aperçu produit → Que souhaitez-vous découvrir ? → Comment ça marche
 * → Confiance → Formules → Preuve sociale (données réelles uniquement) → CTA.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Gem,
  Heart,
  MessageSquareText,
  Moon,
  Play,
  Quote,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
} from 'lucide-react';

import { AppPreview } from '@/components/site/ProductMockup';
import { PUBLIC_PLANS } from '@/components/site/plans';
import {
  Container,
  DiscoverGrid,
  FinalCta,
  SiteShell,
  StepsRow,
  TrustBar,
  formatCount,
  reveal,
  useIsLoggedIn,
  useSiteStats,
} from '@/components/site/sections';
import {
  GLASS,
  GhostButton,
  Glow,
  IconBadge,
  PrimaryButton,
  ScriptNote,
  SectionHeading,
  cn,
} from '@/components/site/ui';

type Testimonial = {
  _id: string;
  authorName: string;
  age?: number;
  city?: string;
  content: string;
  rating: number;
};

const PLAN_ICONS = { moon: Moon, star: Star, heart: Heart, diamond: Gem };

export default function Home() {
  const loggedIn = useIsLoggedIn();
  const stats = useSiteStats();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => data?.success && setTestimonials((data.testimonials ?? []).slice(0, 3)))
      .catch(() => {});
  }, []);

  const statItems = stats
    ? [
        { value: stats.membres, label: 'membres inscrites', icon: UsersRound },
        { value: stats.matchs, label: 'affinités créées', icon: Heart },
        { value: stats.evenements, label: 'événements LunaGather', icon: Sparkles },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <SiteShell>
      {/* ───────────── Hero ───────────── */}
      <section className="relative pb-14 pt-28 sm:pt-32 lg:pb-20 lg:pt-40">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="relative">
              <h1 className="text-[42px] font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[72px]">
                Rencontrer au <Glow>féminin,</Glow>
                <br />
                librement.
              </h1>
              <ScriptNote className="mt-4 -rotate-3 lg:absolute lg:-right-4 lg:bottom-1 lg:mt-0 xl:right-6">
                ✦ Des rencontres qui
                <br />
                <span className="ml-8">font du bien, vraiment. ♡</span>
              </ScriptNote>
            </div>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              SferaLuna est la plateforme de rencontres pensée par et pour les femmes qui aiment les
              femmes. Des connexions authentiques, sûres et profondes, dans un espace bienveillant et
              inclusif.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {loggedIn ? (
                <PrimaryButton href="/explorer" size="lg">
                  Explorer librement
                </PrimaryButton>
              ) : (
                <PrimaryButton href="/auth?mode=register" size="lg">
                  Créer mon profil
                </PrimaryButton>
              )}
              <GhostButton href="#decouvrir" size="lg" icon={Play}>
                Explorer SferaLuna
              </GhostButton>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Heart, title: 'Bienveillance', text: 'au cœur de notre communauté' },
                { icon: Sparkles, title: 'Rencontres', text: 'sérieuses ou spontanées' },
                { icon: BadgeCheck, title: 'Profils vérifiés', text: 'identité confirmée à l’inscription' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <IconBadge icon={item.icon} tone="pink" size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/60">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, rotateY: -8 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative [perspective:1600px]"
          >
            <AppPreview className="lg:[transform:rotateY(-10deg)_rotateX(3deg)]" />
          </motion.div>
        </Container>
      </section>

      {/* ───────────── Que souhaitez-vous découvrir ? ───────────── */}
      <section id="decouvrir" className="relative scroll-mt-24 py-12 lg:py-16">
        <Container>
          <SectionHeading
            title="Que souhaitez-vous découvrir ?"
            subtitle="Découvrez, échangez, rencontrez… Tout commence ici."
            action={
              <ScriptNote className="hidden rotate-[-4deg] text-right text-[24px] lg:block">
                Plus qu’une application,
                <br />
                une communauté. ♡
              </ScriptNote>
            }
          />
          <div className="mt-8">
            <DiscoverGrid />
          </div>
        </Container>
      </section>

      {/* ───────────── Comment ça marche ───────────── */}
      <section className="relative py-12 lg:py-14">
        <Container>
          <SectionHeading
            icon="moon"
            title="Comment ça marche ?"
            subtitle="En quelques étapes simples, vous êtes prête à vivre de belles rencontres."
          />
          <div className="mt-7">
            <StepsRow
              steps={[
                { icon: UserRound, title: 'Créez votre profil', text: 'En quelques minutes, partagez qui vous êtes et ce que vous recherchez.' },
                { icon: Heart, title: 'Découvrez vos affinités', text: 'Explorez des profils inspirants et recevez votre Circle of Six.' },
                { icon: MessageSquareText, title: 'Échangez en confiance', text: 'Faites connaissance dans un espace sûr et bienveillant.' },
              ]}
            />
          </div>
          <div className="mt-6">
            <TrustBar />
          </div>
        </Container>
      </section>

      {/* ───────────── Formules (bande plus sombre = respiration) ───────────── */}
      <section className="relative mt-8 border-y border-violet-300/[0.08] bg-[#0d0619]/80 py-14 lg:py-16">
        <Container>
          <SectionHeading
            title="Commencez librement, évoluez à votre rythme"
            subtitle="Un profil gratuit pour découvrir, des formules pour aller plus loin."
            action={
              <Link href="/tarifs" className="inline-flex items-center gap-1.5 py-2 text-sm font-medium text-fuchsia-200 hover:text-white">
                Comparer les formules <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-5 sm:gap-4 lg:grid-cols-4">
            {PUBLIC_PLANS.map((plan, i) => {
              const Icon = PLAN_ICONS[plan.tone];
              return (
                <motion.div key={plan.id} {...reveal} transition={{ ...reveal.transition, delay: i * 0.06 }}>
                  <Link
                    href="/tarifs"
                    className={cn(
                      'group relative flex h-full flex-col rounded-3xl p-4 transition hover:-translate-y-1 sm:p-5',
                      plan.recommended
                        ? 'border border-fuchsia-300/60 bg-gradient-to-b from-fuchsia-600/25 to-[#1b0d38]/80 shadow-[0_20px_60px_-20px_rgba(217,70,239,0.7)]'
                        : GLASS
                    )}
                  >
                    {plan.recommended && (
                      <span className="absolute -top-3 left-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-fuchsia-300/50 bg-[#2a0f4f] px-2 py-1 text-[11px] font-semibold text-fuchsia-100 sm:left-5 sm:px-3">
                        <Crown className="h-3 w-3 text-amber-200" /> Notre recommandation
                      </span>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Icon className={cn('h-6 w-6 shrink-0 sm:h-7 sm:w-7', plan.tone === 'heart' ? 'fill-pink-400 text-pink-400' : plan.tone === 'star' ? 'fill-amber-300 text-amber-300' : plan.tone === 'diamond' ? 'text-violet-300' : 'fill-violet-200/40 text-violet-200')} />
                      <div>
                        <p className="text-lg font-semibold text-white">{plan.name}</p>
                        <p className="hidden text-xs text-white/60 sm:block">{plan.tagline}</p>
                      </div>
                    </div>
                    <p className="mt-3 whitespace-nowrap text-2xl font-bold text-white sm:mt-4 sm:text-3xl">
                      {plan.price}
                      <span className="ml-1 text-xs font-normal text-white/55 sm:text-sm">/ mois</span>
                    </p>
                    <p className="mt-2 text-[13px] leading-snug text-white/70 sm:mt-3 sm:text-sm">{plan.highlight}</p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ───────────── Preuve sociale (uniquement des données réelles) ───────────── */}
      {(statItems.length > 0 || testimonials.length > 0) && (
        <section className="relative py-14 lg:py-16">
          <Container>
            <SectionHeading
              title="Elles vivent SferaLuna"
              subtitle="Des chiffres et des mots de notre communauté, en toute transparence."
            />

            {statItems.length > 0 && (
              <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-4">
                {statItems.map((item) => (
                  <motion.div key={item.label} {...reveal} className={cn(GLASS, 'flex items-center gap-4 p-3 sm:p-5')}>
                    <span className="hidden sm:block">
                      <IconBadge icon={item.icon} tone="pink" size="lg" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold text-white sm:text-3xl">{formatCount(item.value)}</p>
                      <p className="text-xs leading-snug text-white/65 sm:text-sm">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {testimonials.length > 0 && (
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {testimonials.map((t) => (
                  <motion.figure key={t._id} {...reveal} className={cn(GLASS, 'flex flex-col p-6')}>
                    <Quote className="h-6 w-6 text-fuchsia-300" />
                    <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-white/85">“{t.content}”</blockquote>
                    <figcaption className="mt-4 flex items-center justify-between text-xs text-white/60">
                      <span className="font-semibold text-white/85">
                        {t.authorName}
                        {t.age ? `, ${t.age} ans` : ''}
                        {t.city ? ` · ${t.city}` : ''}
                      </span>
                      <span className="text-amber-300">{'★'.repeat(Math.max(1, Math.min(5, t.rating || 5)))}</span>
                    </figcaption>
                  </motion.figure>
                ))}
              </div>
            )}
          </Container>
        </section>
      )}

      <FinalCta
        title="Prête à écrire votre propre histoire ?"
        text="Rejoignez SferaLuna et vivez des rencontres qui ont du sens."
      />
    </SiteShell>
  );
}
