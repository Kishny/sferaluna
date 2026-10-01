'use client';

/**
 * /securite — comment SferaLuna protège ses membres.
 *
 * Tout ce qui est affiché ici correspond à ce qui existe réellement dans
 * le produit : vérification Stripe Identity, niveaux de visibilité et
 * Mode Fantôme, filtre anti-harcèlement + signalements, blocage,
 * paiements Stripe. Aucun chiffre inventé.
 */

import Link from 'next/link';
import type { ElementType, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Ban,
  Check,
  CreditCard,
  Cookie,
  EyeOff,
  Flag,
  Ghost,
  KeyRound,
  Lock,
  MessageSquareWarning,
  Quote,
  Search,
  Shield,
  ShieldCheck,
  Settings2,
  Users,
  UsersRound,
} from 'lucide-react';

import { Container, FinalCta, SiteShell, StepsRow, reveal } from '@/components/site/sections';
import {
  ArrowCircle,
  GLASS,
  GLASS_INNER,
  GhostButton,
  Glow,
  IconBadge,
  IllustratedAvatar,
  PrimaryButton,
  SectionHeading,
  cn,
} from '@/components/site/ui';
import { useIsLoggedIn } from '@/components/site/sections';
import { ModerationSection, ReportBlockSection } from '@/components/site/SafetyGuide';

// ─────────────────────────────────────────────
// Visuel du hero : bouclier + cartes flottantes
// ─────────────────────────────────────────────

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span className={cn('relative inline-flex h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-gradient-to-r from-fuchsia-500 to-violet-500' : 'bg-white/15')}>
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </span>
  );
}

function ShieldArt() {
  return (
    <svg viewBox="0 0 240 280" className="h-full w-full drop-shadow-[0_0_40px_rgba(192,38,211,0.6)]" aria-hidden>
      <defs>
        <linearGradient id="sh-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="sh-stroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5d0fe" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <path d="M120 12 L214 48 V132 C214 196 172 244 120 268 C68 244 26 196 26 132 V48 Z" fill="url(#sh-fill)" stroke="url(#sh-stroke)" strokeWidth="4" />
      <path d="M120 40 L190 67 V133 C190 182 158 219 120 238 C82 219 50 182 50 133 V67 Z" fill="none" stroke="#f0abfc" strokeOpacity="0.4" strokeWidth="2" />
      <path d="M82 140 L110 168 L162 110" fill="none" stroke="#fdf4ff" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroVisual() {
  const side = [
    { icon: Ghost, title: 'Mode Fantôme', text: 'Votre visibilité, vos règles', toggle: true },
    { icon: Lock, title: 'Paiements protégés', text: 'Via Stripe, jamais stockés chez nous' },
    { icon: ShieldCheck, title: 'Modération active', text: 'Messages filtrés, signalements traités' },
    { icon: Ban, title: 'Signalement & blocage', text: 'En un geste, depuis chaque profil' },
  ];

  return (
    <div className="relative grid items-center gap-4 sm:grid-cols-[1fr_0.7fr_1.25fr]">
      <div className={cn(GLASS, 'hidden flex-col items-center p-5 text-center sm:flex')}>
        <div className="relative">
          <IllustratedAvatar seed={0} size={88} />
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 ring-4 ring-[#1b0d38]">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </span>
        </div>
        <p className="mt-3 text-lg font-semibold text-white">Profil vérifié</p>
        <p className="mt-1 text-xs text-white/65">Identité confirmée et authentique</p>
      </div>

      <div className="mx-auto h-40 w-36 sm:h-64 sm:w-full">
        <ShieldArt />
      </div>

      <div className="space-y-2.5">
        {side.map((item) => (
          <div key={item.title} className={cn(GLASS, 'flex items-center gap-3 rounded-2xl p-3')}>
            <IconBadge icon={item.icon} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="truncate text-xs text-white/60">{item.text}</p>
            </div>
            {item.toggle && <Toggle />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Cartes "Un environnement sûr"
// ─────────────────────────────────────────────

function SafetyCard({
  icon,
  title,
  text,
  href,
  children,
  index,
}: {
  icon: ElementType;
  title: string;
  text: string;
  href: string;
  children: ReactNode;
  index: number;
}) {
  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }}>
      <Link href={href} className={cn(GLASS, 'group flex h-full flex-col p-5 transition hover:-translate-y-1 hover:border-violet-300/30')}>
        <div className="flex items-center gap-3">
          <IconBadge icon={icon} tone="violet" />
          <h3 className="flex-1 text-lg font-semibold leading-tight text-white">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-white/70">{text}</p>
        <div className="mt-auto pt-4">{children}</div>
        <div className="mt-3 flex justify-end">
          <ArrowCircle className="h-8 w-8" />
        </div>
      </Link>
    </motion.div>
  );
}

function CheckRow({ icon: Icon = Check, children, tone = 'green' }: { icon?: ElementType; children: ReactNode; tone?: 'green' | 'violet' }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-[13px] text-white/85">
      <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', tone === 'green' ? 'bg-emerald-500/90' : 'bg-violet-500/30')}>
        <Icon className="h-3 w-3 text-white" strokeWidth={tone === 'green' ? 3 : 2} />
      </span>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

type Testimonial = { _id: string; authorName: string; age?: number; content: string; rating: number };

export default function SecuritePage() {
  const loggedIn = useIsLoggedIn();
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    fetch('/api/testimonials')
      .then((res) => res.json())
      .then((data) => data?.success && data.testimonials?.length && setTestimonial(data.testimonials[0]))
      .catch(() => {});
  }, []);

  return (
    <SiteShell back>
      {/* Hero */}
      <section className="relative pb-12 pt-28 sm:pt-32 lg:pb-16 lg:pt-40">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl xl:text-[54px]">
              Un espace <Glow>pensé pour</Glow>
              {" "}<br className="hidden sm:block" />
              des rencontres <Glow>sereines.</Glow>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Chez SferaLuna, votre sécurité est une priorité. Vérification d’identité, modération
              active et paramètres de confidentialité avancés : vous rencontrez en toute confiance, à
              votre rythme.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href={loggedIn ? '/explorer' : '/auth?mode=register'} size="lg">
                Découvrir SferaLuna
              </PrimaryButton>
              <GhostButton href="#protection" size="lg" icon={Shield}>
                Comment nous vous protégeons
              </GhostButton>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, title: 'Profils vérifiés', text: 'pour plus d’authenticité' },
                { icon: Lock, title: 'Données protégées', text: 'en toutes circonstances' },
                { icon: UsersRound, title: 'Bienveillance', text: 'une communauté respectueuse' },
                { icon: Settings2, title: 'Vous décidez', text: 'de votre visibilité' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <IconBadge icon={item.icon} tone="violet" size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs text-white/60">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            <HeroVisual />
          </motion.div>
        </Container>
      </section>

      {/* Un environnement sûr */}
      <section id="protection" className="relative scroll-mt-24 py-10 lg:py-14">
        <Container>
          <SectionHeading title="Un environnement sûr, à chaque étape." subtitle="Des outils concrets pour des rencontres plus vraies, plus sereines." />

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SafetyCard
              index={0}
              icon={BadgeCheck}
              title="Profils vérifiés"
              text="Avant d’accéder à son compte, chaque membre confirme son identité avec une pièce officielle et un selfie en direct. Un badge l’indique sur son profil."
              href="/auth?mode=register"
            >
              <div className={cn(GLASS_INNER, 'flex items-center gap-3 p-3')}>
                <div className="relative">
                  <IllustratedAvatar seed={2} size={44} />
                  <BadgeCheck className="absolute -right-1 -top-1 h-5 w-5 fill-sky-500 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Profil vérifié</p>
                  <p className="text-[11px] text-white/60">Identité confirmée</p>
                </div>
              </div>
            </SafetyCard>

            <SafetyCard
              index={1}
              icon={EyeOff}
              title="Mode Fantôme & visibilité"
              text="Choisissez qui voit votre profil : tout le monde, vos matchs, les membres premium… ou personne. En Mode Fantôme, vos visites ne laissent aucune trace."
              href="/mode-fantome"
            >
              <div className={cn(GLASS_INNER, 'p-3')}>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-white">
                    <Ghost className="h-4 w-4 text-violet-200" /> Mode Fantôme
                  </span>
                  <Toggle />
                </div>
                <CheckRow tone="violet">Visible uniquement par mes matchs</CheckRow>
                <CheckRow tone="violet">Visible par toutes</CheckRow>
              </div>
            </SafetyCard>

            <SafetyCard
              index={2}
              icon={Lock}
              title="Confidentialité des données"
              text="Mots de passe chiffrés, e-mail jamais affiché, paiements gérés par Stripe : SferaLuna ne voit jamais vos coordonnées bancaires."
              href="/confidentialite"
            >
              <div className={cn(GLASS_INNER, 'p-3')}>
                <CheckRow icon={KeyRound} tone="violet">Mots de passe chiffrés</CheckRow>
                <CheckRow icon={CreditCard} tone="violet">Paiements via Stripe</CheckRow>
                <CheckRow icon={Cookie} tone="violet">Cookies : vous choisissez</CheckRow>
              </div>
            </SafetyCard>

            <SafetyCard
              index={3}
              icon={Users}
              title="Modération active"
              text="Un filtre bloque automatiquement les messages abusifs et crée un signalement. Chaque signalement est examiné par notre équipe de modération."
              href="#moderation"
            >
              <div className={cn(GLASS_INNER, 'p-3')}>
                <CheckRow>Messages abusifs bloqués</CheckRow>
                <CheckRow>Signalements examinés</CheckRow>
                <CheckRow>Comptes suspendus si besoin</CheckRow>
              </div>
            </SafetyCard>

            <SafetyCard
              index={4}
              icon={Ban}
              title="Signalement & blocage"
              text="Vous gardez le contrôle : signalez un comportement inapproprié ou bloquez une membre en un geste. Son profil disparaît de votre expérience."
              href="#signalement"
            >
              <div className={cn(GLASS_INNER, 'p-3')}>
                <div className="mb-1 flex items-center gap-2.5 border-b border-white/10 pb-2">
                  <IllustratedAvatar seed={4} size={30} />
                  <span className="text-[13px] font-semibold text-white">Profil</span>
                </div>
                <CheckRow icon={Flag} tone="violet">Signaler ce profil</CheckRow>
                <CheckRow icon={Ban} tone="violet">Bloquer cette membre</CheckRow>
              </div>
            </SafetyCard>
          </div>
        </Container>
      </section>

      {/* Modération + Signaler / bloquer (cibles des cartes ci-dessus) */}
      <ModerationSection />
      <ReportBlockSection />

      {/* Comment nous protégeons */}
      <section className="relative py-10 lg:py-12">
        <Container>
          <SectionHeading
            icon="moon"
            title="Comment nous protégeons votre expérience ?"
            subtitle="Une approche complète pour des rencontres plus sûres et plus authentiques."
          />
          <div className="mt-7">
            <StepsRow
              steps={[
                { icon: Search, title: 'Vérification des profils', text: 'Pièce d’identité + selfie en direct avant l’accès au compte.' },
                { icon: MessageSquareWarning, title: 'Messages surveillés', text: 'Le filtre anti-harcèlement bloque les messages abusifs.' },
                { icon: Lock, title: 'Vos données protégées', text: 'Confidentialité et contrôle total de votre visibilité.' },
                { icon: UsersRound, title: 'Une communauté bienveillante', text: 'Des outils simples pour signaler ou bloquer.' },
              ]}
            />
          </div>
        </Container>
      </section>

      {/* Confiance : faits vérifiables + témoignage réel s'il existe */}
      <section className="relative border-y border-violet-300/[0.08] bg-[#0d0619]/80 py-12">
        <Container className={cn('grid gap-4', testimonial ? 'lg:grid-cols-[1fr_1fr_1fr_1.3fr]' : 'md:grid-cols-3')}>
          {[
            { value: 'Obligatoire', label: 'vérification d’identité à l’inscription', icon: ShieldCheck },
            { value: '4 niveaux', label: 'de visibilité, du public au Mode Fantôme', icon: EyeOff },
            { value: '0', label: 'donnée bancaire stockée par SferaLuna', icon: CreditCard },
          ].map((item) => (
            <motion.div key={item.label} {...reveal} className="flex items-center gap-4 px-2">
              <IconBadge icon={item.icon} tone="pink" size="lg" />
              <div>
                <p className="text-2xl font-bold text-white">{item.value}</p>
                <p className="text-sm text-white/65">{item.label}</p>
              </div>
            </motion.div>
          ))}

          {testimonial && (
            <motion.figure {...reveal} className={cn(GLASS, 'flex gap-4 p-5')}>
              <Quote className="h-6 w-6 shrink-0 text-fuchsia-300" />
              <div>
                <blockquote className="text-sm leading-relaxed text-white/85">“{testimonial.content}”</blockquote>
                <figcaption className="mt-2 text-xs text-white/60">
                  {testimonial.authorName}
                  {testimonial.age ? `, ${testimonial.age} ans` : ''}{' '}
                  <span className="text-amber-300">{'★'.repeat(Math.max(1, Math.min(5, testimonial.rating || 5)))}</span>
                </figcaption>
              </div>
            </motion.figure>
          )}
        </Container>
      </section>

      <FinalCta
        title="Prête à faire des rencontres en toute confiance ?"
        text="Rejoignez SferaLuna et découvrez un espace sûr, bienveillant et authentique."
        cta="Découvrir SferaLuna"
      />
    </SiteShell>
  );
}
