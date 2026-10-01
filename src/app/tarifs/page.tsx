'use client';

/**
 * /tarifs — quatre formules, une seule mise en avant (Premium),
 * comparaison condensée, FAQ courte.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Check,
  ChevronDown,
  Crown,
  Eye,
  Gem,
  Ghost,
  Heart,
  Moon,
  SlidersHorizontal,
  Star,
} from 'lucide-react';

import { SceneArt } from '@/components/site/art';
import { COMPARISON, PRICING_FAQ, PUBLIC_PLANS, type PublicPlan } from '@/components/site/plans';
import { Container, FinalCta, SiteShell, reveal, useIsLoggedIn } from '@/components/site/sections';
import {
  GLASS,
  GhostButton,
  Glow,
  PrimaryButton,
  ScriptNote,
  SectionHeading,
  cn,
} from '@/components/site/ui';

const PLAN_ICONS = { moon: Moon, star: Star, heart: Heart, diamond: Gem };
const PLAN_ICON_CLASS = {
  moon: 'fill-violet-200/40 text-violet-200',
  star: 'fill-amber-300 text-amber-300',
  heart: 'fill-pink-400 text-pink-400',
  diamond: 'text-violet-300',
};

function planHref(plan: PublicPlan, loggedIn: boolean) {
  if (!loggedIn) return '/auth?mode=register';
  return plan.id === 'free' ? '/explorer' : '/paiement';
}

function PlanCard({ plan, loggedIn, index }: { plan: PublicPlan; loggedIn: boolean; index: number }) {
  const Icon = PLAN_ICONS[plan.tone];
  const featured = Boolean(plan.recommended);
  const label = loggedIn && plan.id === 'free' ? 'Explorer librement' : plan.cta;

  return (
    <motion.div {...reveal} transition={{ ...reveal.transition, delay: index * 0.07 }} className="relative">
      {featured && (
        <span className="absolute -top-3.5 left-1/2 z-10 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-fuchsia-300/60 bg-[#2a0f4f] px-4 py-1 text-xs font-semibold text-fuchsia-100 shadow-lg shadow-fuchsia-900/40">
          <Crown className="h-3.5 w-3.5 text-amber-200" /> Notre recommandation
        </span>
      )}
      <div
        className={cn(
          'flex h-full flex-col rounded-3xl p-6',
          featured
            ? 'border-2 border-fuchsia-400/80 bg-gradient-to-b from-fuchsia-600/25 via-[#1f0d42]/90 to-[#1b0d38]/90 shadow-[0_24px_70px_-20px_rgba(217,70,239,0.75)] lg:-my-3 lg:py-9'
            : GLASS
        )}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn('mt-0.5 h-8 w-8 shrink-0', PLAN_ICON_CLASS[plan.tone])} />
          <div>
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <p className="text-sm text-white/65">{plan.tagline}</p>
          </div>
        </div>

        <p className="mt-5 text-4xl font-extrabold tracking-tight text-white">
          {plan.price}
          <span className="ml-1.5 text-sm font-normal text-white/55">/ mois</span>
        </p>

        <ul className="mt-5 flex-1 space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-white/85">
              <span
                className={cn(
                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                  featured ? 'bg-fuchsia-500' : 'border border-violet-300/50'
                )}
              >
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        {featured ? (
          <PrimaryButton href={planHref(plan, loggedIn)} icon={null} className="mt-6 w-full">
            {label}
          </PrimaryButton>
        ) : (
          <GhostButton href={planHref(plan, loggedIn)} className="mt-6 w-full">
            {label} →
          </GhostButton>
        )}
      </div>
    </motion.div>
  );
}

function ComparisonTable() {
  const columns = PUBLIC_PLANS.map((plan) => ({ plan, Icon: PLAN_ICONS[plan.tone] }));

  return (
    <motion.div {...reveal} className={cn(GLASS, 'overflow-hidden p-0')}>
      <p className="border-b border-violet-300/10 px-5 py-2.5 text-xs text-white/50 md:hidden">
        Faites glisser le tableau pour voir toutes les formules →
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 text-left">
                <span className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-violet-300" />
                  <span>
                    <span className="block text-base font-semibold text-white">Comparez les formules</span>
                    <span className="block text-xs font-normal text-white/55">L’essentiel pour vous aider à choisir</span>
                  </span>
                </span>
              </th>
              {columns.map(({ plan, Icon }) => (
                <th
                  key={plan.id}
                  className={cn(
                    'px-4 py-4 text-center font-semibold text-white',
                    plan.recommended && 'rounded-t-2xl border-x border-t border-fuchsia-400/50 bg-fuchsia-500/15'
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className={cn('h-4 w-4', PLAN_ICON_CLASS[plan.tone])} /> {plan.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row, r) => (
              <tr key={row.feature} className="[&>td]:border-t [&>td]:border-t-violet-300/10">
                <td className="px-5 py-3 text-white/80">{row.feature}</td>
                {row.values.map((value, c) => {
                  const recommended = PUBLIC_PLANS[c].recommended;
                  const last = r === COMPARISON.length - 1;
                  return (
                    <td
                      key={c}
                      className={cn(
                        'px-4 py-3 text-center',
                        value === '—' ? 'text-white/30' : 'text-white/85',
                        value === '✓' && 'text-base text-emerald-300',
                        recommended && 'border-x border-fuchsia-400/50 bg-fuchsia-500/15 font-medium text-white',
                        recommended && last && 'border-b'
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function Faq() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {PRICING_FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.question} className={cn(GLASS, 'rounded-2xl')}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium text-white"
              aria-expanded={isOpen}
            >
              {item.question}
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-fuchsia-200 transition-transform', isOpen && 'rotate-180')} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.p
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden px-4 text-sm leading-relaxed text-white/70"
                >
                  <span className="block pb-4">{item.answer}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default function TarifsPage() {
  const loggedIn = useIsLoggedIn();

  return (
    <SiteShell back>
      {/* Hero */}
      <section className="relative pb-10 pt-28 sm:pt-32 lg:pt-40">
        <Container className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[60px]">
              Choisissez la <Glow>formule</Glow>
              {" "}<br className="hidden sm:block" />
              qui vous ressemble.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Commencez librement et débloquez plus de possibilités au fil de vos envies. Sans
              engagement, résiliable à tout moment.
            </p>
          </motion.div>
          <ScriptNote className="rotate-[-5deg] lg:mb-6 lg:mr-10">
            Des rencontres
            <br />
            qui font du bien,
            <br />
            vraiment. ♡
          </ScriptNote>
        </Container>
      </section>

      {/* Formules */}
      <section className="relative pb-12">
        <Container className="grid gap-5 pt-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {PUBLIC_PLANS.map((plan, i) => (
            <PlanCard key={plan.id} plan={plan} loggedIn={loggedIn} index={i} />
          ))}
        </Container>
      </section>

      {/* Comparatif */}
      <section className="relative pb-12">
        <Container>
          <ComparisonTable />
        </Container>
      </section>

      {/* Pourquoi Premium */}
      <section className="relative border-y border-violet-300/[0.08] bg-[#0d0619]/80 py-12 lg:py-14">
        <Container>
          <SectionHeading
            icon="none"
            title={
              <span className="flex items-center gap-3">
                <Heart className="h-7 w-7 text-pink-300" /> Pourquoi passer Premium ?
              </span>
            }
            subtitle="Une expérience plus riche, plus libre et plus discrète."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: Eye, title: 'Voir qui s’intéresse à vous', text: 'Découvrez les membres qui ont visité votre profil.', scene: 'dusk' as const },
              { icon: Ghost, title: 'Naviguer en toute discrétion', text: 'Le Mode Fantôme rend votre profil et vos visites invisibles.', scene: 'night' as const },
              { icon: SlidersHorizontal, title: 'Des filtres plus fins', text: 'Orientation, membres actives récemment, VibePlanner illimité.', scene: 'river' as const },
            ].map((item, i) => (
              <motion.div key={item.title} {...reveal} transition={{ ...reveal.transition, delay: i * 0.07 }} className={cn(GLASS, 'relative flex min-h-[150px] overflow-hidden p-5')}>
                <div className="absolute inset-y-0 right-0 w-2/5">
                  <SceneArt variant={item.scene} seed={i + 40} className="absolute inset-0" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1b0d38] via-[#1b0d38]/40 to-transparent" />
                </div>
                <div className="relative max-w-[62%]">
                  <item.icon className="h-8 w-8 text-fuchsia-300" />
                  <h3 className="mt-3 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-snug text-white/70">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="relative py-12">
        <Container>
          <SectionHeading icon="moon" title="Questions fréquentes" subtitle="Tout ce que vous devez savoir sur nos formules." />
          <div className="mt-7">
            <Faq />
          </div>
        </Container>
      </section>

      <FinalCta
        title="Prête à vivre de belles rencontres ?"
        text="Rejoignez SferaLuna et choisissez la formule qui vous correspond."
      />
    </SiteShell>
  );
}
