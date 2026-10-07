'use client';

/**
 * Pied de page SferaLuna.
 *
 * - Bandeau d'appel à l'action illustré (public/images/footer-bg.webp).
 * - Panneau : marque, réseaux, quatre colonnes de liens, newsletter.
 * - Sur téléphone : colonnes en accordéon (fermées par défaut) et
 *   présentation raccourcie, pour ne pas allonger chaque page.
 */

import { useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ArrowRight,
  ChevronDown,
  Compass,
  Facebook,
  Instagram,
  Lock,
  Mail,
  Shield,
  Twitter,
  UsersRound,
} from 'lucide-react';

import NewsletterSignup from '@/components/NewsletterSignup';
import { ScriptNote } from '@/components/site/ui';

/** Icône TikTok (non incluse dans lucide-react). */
function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3c-1.5 0-2.86-.62-3.84-1.48Z" />
    </svg>
  );
}

type FooterGroup = { title: string; icon: string; links: { label: string; href: string }[] };

const GROUPS: FooterGroup[] = [
  {
    title: 'SferaLuna',
    icon: '🌙',
    links: [
      { label: 'Accueil', href: '/' },
      { label: 'Notre histoire', href: '/histoire' },
      { label: 'Valeurs', href: '/valeurs' },
      { label: 'Témoignages', href: '/temoignages' },
      { label: 'Équipe', href: '/equipe' },
    ],
  },
  {
    title: 'Explorer',
    icon: '✨',
    links: [
      { label: 'Explorer librement', href: '/explorer' },
      { label: 'Circle of Six', href: '/circle' },
      { label: 'VibeSphere', href: '/vibesphere' },
      { label: 'VibePlanner', href: '/vibeplanner' },
    ],
  },
  {
    title: 'Communauté',
    icon: '💜',
    links: [
      { label: 'Forum', href: '/communaute' },
      { label: 'LunaGather', href: '/evenements' },
      { label: 'VibeMentor', href: '/vibementor' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Guide', href: '/guide' },
      { label: 'Sécurité', href: '/securite' },
      { label: 'Tarifs', href: '/tarifs' },
    ],
  },
  {
    title: 'Légal',
    icon: '🔒',
    links: [
      { label: 'Mentions légales', href: '/mentions-legales' },
      { label: 'Confidentialité', href: '/confidentialite' },
      { label: 'Conditions', href: '/conditions' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Accessibilité', href: '/accessibilite' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/sferaluna.co/', external: true, icon: <Instagram size={18} /> },
  { label: 'TikTok', href: 'https://www.tiktok.com/@sfer_aluna', external: true, icon: <TikTokIcon /> },
  { label: 'X (Twitter)', href: 'https://x.com/sferaluna', external: true, icon: <Twitter size={18} /> },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61590343876021', external: true, icon: <Facebook size={18} /> },
  { label: 'Contact', href: '/contact', external: false, icon: <Mail size={18} /> },
];

const TRUST = [
  { icon: Shield, label: 'Profils vérifiés' },
  { icon: UsersRound, label: 'Modération active' },
  { icon: Lock, label: 'Données protégées' },
];

const PANEL = 'rounded-[28px] border border-violet-300/20 bg-[#170c33]/85 backdrop-blur-xl';

export default function Footer() {
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  return (
    <footer className="relative overflow-hidden bg-[#0f0720] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/25 to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-[1640px] px-4 py-6 sm:px-6 sm:py-10">
        {/* Appel à l'action */}
        <section className="relative overflow-hidden rounded-[28px] border border-violet-300/25">
          <div className="absolute inset-0 bg-cover bg-[position:22%_58%] lg:bg-[position:left_58%]" style={{ backgroundImage: 'url(/images/footer-bg.webp)' }} aria-hidden />
          <div className="absolute inset-0 bg-[#140a2e]/70 lg:bg-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-[#140a2e]/80 lg:to-[#140a2e]/95" aria-hidden />

          <div className="relative px-5 py-6 sm:px-8 sm:py-10 lg:ml-[42%] lg:py-12 lg:pr-10">
            <p className="text-[11px] font-medium uppercase tracking-[0.45em] text-violet-200/80">Plus qu’une plateforme</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Prête à rejoindre <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-400 bg-clip-text text-transparent">la vibe ?</span>
            </h2>
            <p className="mt-3 text-base text-white/85 sm:text-xl">Crée ton profil et découvre une nouvelle façon de rencontrer.</p>

            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center">
              <Link
                href={loggedIn ? '/mon-compte' : '/auth?mode=register'}
                className="group inline-flex h-12 items-center justify-between gap-4 rounded-full bg-gradient-to-r from-white to-pink-100 pl-6 pr-1 text-base sm:h-14 sm:pl-8 sm:pr-1.5 sm:text-lg font-semibold text-[#2a1158] shadow-[0_10px_40px_-10px_rgba(240,171,252,0.9)] transition hover:brightness-105"
              >
                {loggedIn ? 'Mon espace' : 'Créer mon profil'}
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 sm:h-11 sm:w-11 text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Link>
              <Link
                href={loggedIn ? '/explorer' : '/fonctionnalites'}
                className="hidden h-14 items-center justify-between gap-4 rounded-full border border-white/50 sm:inline-flex bg-[#140a2e]/40 pl-7 pr-2 text-lg font-medium text-white backdrop-blur transition hover:border-fuchsia-300 hover:bg-fuchsia-500/10"
              >
                Explorer SferaLuna
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40">
                  <Compass className="h-5 w-5" />
                </span>
              </Link>
            </div>

            <ScriptNote className="absolute right-10 top-1/2 hidden -translate-y-1/2 rotate-[-10deg] text-[30px] text-violet-200/90 2xl:block">
              Des
              <br />
              connexions
              <br />
              plus vraies ♥
            </ScriptNote>
          </div>
        </section>

        {/* Panneau principal */}
        <div className={`${PANEL} mt-5 p-5 sm:mt-7 sm:p-8 lg:px-12 lg:py-9`}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.75fr)] lg:gap-12">
            {/* Marque */}
            <div>
              <Link href="/" className="flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-sferaluna.png" alt="" className="h-14 w-14 object-contain sm:h-[72px] sm:w-[72px]" />
                <span>
                  <span className="block text-2xl font-bold leading-none sm:text-3xl">SferaLuna</span>
                  <span className="mt-1.5 block text-sm text-white/75 sm:text-base">Rencontrer au féminin, librement.</span>
                </span>
              </Link>

              <p className="mt-6 hidden max-w-md text-base leading-relaxed text-white/75 sm:block">
                Un réseau social pensé pour les femmes qui veulent des liens sincères, sûrs et alignés avec leur vibe.
              </p>

              <ul className="mt-5 hidden w-fit flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-violet-300/20 bg-white/[0.04] px-5 py-3 sm:flex">
                {TRUST.map(({ icon: Icon, label }, i) => (
                  <li key={label} className="flex items-center gap-2 text-[13px] text-white/85">
                    {i > 0 && <span className="mr-2 h-1 w-1 rounded-full bg-fuchsia-300" aria-hidden />}
                    <Icon className="h-4 w-4 text-fuchsia-300" /> {label}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex items-center gap-3">
                {SOCIALS.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-300/25 bg-white/[0.05] text-violet-100 transition hover:border-fuchsia-300/70 hover:bg-fuchsia-500/20 hover:text-white sm:h-[52px] sm:w-[52px]"
                  >
                    {item.icon}
                  </Link>
                ))}
              </div>
            </div>

            {/* Liens — téléphone et tablette : accordéons */}
            <nav aria-label="Pied de page" className="space-y-2 lg:hidden">
              {GROUPS.map((group) => {
                const isOpen = openGroup === group.title;
                return (
                  <div key={group.title} className="overflow-hidden rounded-2xl border border-violet-300/15 bg-white/[0.04]">
                    <button
                      type="button"
                      onClick={() => setOpenGroup(isOpen ? null : group.title)}
                      aria-expanded={isOpen}
                      className="flex h-12 w-full items-center gap-3 px-4 text-left"
                    >
                      <span className="text-lg" aria-hidden>{group.icon}</span>
                      <span className="flex-1 text-sm font-bold">{group.title}</span>
                      <ChevronDown className={`h-4 w-4 text-violet-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <ul className="grid grid-cols-2 gap-x-3 border-t border-white/10 px-4 py-2">
                        {group.links.map((link) => (
                          <li key={link.href}>
                            <Link href={link.href} className="flex h-10 items-center text-sm text-white/75 hover:text-white">
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Liens — grand écran : colonnes */}
            <nav aria-label="Pied de page" className="hidden grid-cols-4 lg:grid">
              {GROUPS.map((group) => (
                <div key={group.title} className="border-l border-violet-300/15 pl-8 xl:pl-10">
                  <h3 className="flex items-center gap-3 text-[17px] font-semibold">
                    <span className="text-xl" aria-hidden>{group.icon}</span> {group.title}
                  </h3>
                  <ul className="mt-6 space-y-4">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="text-[17px] text-white/70 transition hover:text-fuchsia-200">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          {/* Newsletter */}
          <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-violet-300/15 bg-white/[0.03] p-4 sm:p-5 lg:mt-8 lg:flex-row lg:items-center lg:gap-8">
            <div className="flex items-center gap-4 lg:w-[38%]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-300/25 bg-violet-500/20 sm:h-14 sm:w-14">
                <Mail className="h-6 w-6 text-fuchsia-300" />
              </span>
              <div>
                <p className="text-base font-semibold sm:text-lg">Newsletter SferaLuna</p>
                <p className="text-sm text-white/70">Conseils, événements et nouveautés en avant-première.</p>
              </div>
            </div>

            <NewsletterSignup variant="night" className="min-w-0 flex-1" />

            <ScriptNote className="hidden shrink-0 rotate-[-6deg] border-l border-violet-300/20 pl-8 text-[21px] text-violet-200/90 2xl:block">
              Rejoins la communauté
              <br />
              et reste dans la vibe ! ♡
            </ScriptNote>
          </div>

          {/* Bas */}
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 text-center text-[13px] text-white/60 lg:flex-row lg:items-center lg:justify-between lg:text-left">
            <p>© {new Date().getFullYear()} SferaLuna. Tous droits réservés.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
              <p>
                Fait avec <span className="text-pink-400">♥</span> pour des connexions plus vraies.
              </p>
              {[
                { label: 'Confidentialité', href: '/confidentialite' },
                { label: 'Conditions', href: '/conditions' },
                { label: 'Cookies', href: '/cookies' },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="hidden border-l border-white/15 pl-5 hover:text-white lg:inline">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
