'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Heart,
  Shield,
  Sparkles,
  Mail,
  Instagram,
  Twitter,
  Facebook,
  MessageCircle,
} from 'lucide-react';
import NewsletterSignup from '@/components/NewsletterSignup';

/**
 * Icône TikTok (non incluse dans lucide-react).
 */
function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6c0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3c-1.5 0-2.86-.62-3.84-1.48Z" />
    </svg>
  );
}

/**
 * Type pour les groupes de liens du footer.
 */
type FooterGroup = {
  title: string;
  icon: string;
  links: {
    label: string;
    href: string;
  }[];
};

/**
 * Footer SferaLuna.
 *
 * Objectifs :
 * - footer desktop élégant et complet ;
 * - footer mobile compact ;
 * - sections en accordéon mobile ;
 * - informations principales visibles sans prendre trop de place ;
 * - CTA discret vers inscription / contact.
 */
export default function Footer() {
  /**
   * Accordéon mobile.
   */
  const [openGroup, setOpenGroup] = useState<string | null>('SferaLuna');

  const footerGroups: FooterGroup[] = [
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
        { label: 'Explorer des profils', href: '/explorer' },
        { label: 'Circle of Six', href: '/circle' },
        { label: 'VibeSphere', href: '/vibesphere' },
        { label: 'VibePlanner', href: '/vibeplanner' },
      ],
    },
    {
      title: 'Communauté',
      icon: '💜',
      links: [
        { label: 'Événements', href: '/evenements' },
        { label: 'VibeMentor', href: '/vibementor' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Centre d’aide', href: '/aide' },
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
      ],
    },
  ];

  const toggleGroup = (title: string) => {
    setOpenGroup((current) => (current === title ? null : title));
  };

  return (
    <footer className="relative overflow-hidden border-t border-[#8E7AB5]/10 bg-[#12091f] text-white">
      {/* Décor léger */}
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#8E7AB5]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#D9B8FF]/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Haut du footer */}
        <div className="grid gap-5 lg:grid-cols-[1.2fr_2fr] lg:gap-10">
          {/* Branding compact */}
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm sm:p-5">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-sferaluna.png"
                alt="SferaLuna"
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
              />

              <div>
                <p className="text-lg font-black leading-none text-white">
                  SferaLuna
                </p>
                <p className="mt-1 text-xs text-white/55">
                  Rencontrer au féminin, librement.
                </p>
              </div>
            </Link>

            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Une plateforme pensée pour les femmes qui veulent des rencontres
              sincères, sûres et alignées avec leur vibe.
            </p>

            {/* Badges rassurance */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
                <Shield size={14} className="text-[#D9B8FF]" />
                Sécurité
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs text-white/70">
                <Heart size={14} className="text-pink-300" />
                Bienveillance
              </div>
            </div>

            {/* Réseaux sociaux */}
            <div className="mt-4 flex items-center gap-2">
              {[
                {
                  label: 'Instagram',
                  href: 'https://www.instagram.com/sferaluna.co/',
                  external: true,
                  icon: <Instagram size={16} />,
                },
                {
                  label: 'TikTok',
                  href: 'https://www.tiktok.com/@sfer_aluna',
                  external: true,
                  icon: <TikTokIcon />,
                },
                {
                  label: 'X (Twitter)',
                  href: 'https://x.com/sferaluna',
                  external: true,
                  icon: <Twitter size={16} />,
                },
                {
                  label: 'Facebook',
                  href: 'https://www.facebook.com/profile.php?id=61590343876021',
                  external: true,
                  icon: <Facebook size={16} />,
                },
                {
                  label: 'Contact',
                  href: '/contact',
                  external: false,
                  icon: <Mail size={16} />,
                },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  {...(item.external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/65 transition hover:border-[#D9B8FF]/40 hover:bg-[#8E7AB5]/20 hover:text-white"
                >
                  {item.icon}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile : accordéons */}
          <div className="space-y-2 lg:hidden">
            {footerGroups.map((group) => {
              const isOpen = openGroup === group.title;

              return (
                <div
                  key={group.title}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
                >
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg">
                      {group.icon}
                    </span>

                    <span className="flex-1 text-sm font-bold text-white">
                      {group.title}
                    </span>

                    <ChevronDown
                      size={17}
                      className={`text-[#D9B8FF] transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1 border-t border-white/10 px-4 pb-3 pt-2">
                          {group.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="flex items-center gap-2 rounded-xl px-2 py-2 text-xs font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#D9B8FF]" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Desktop : colonnes classiques */}
          <div className="hidden grid-cols-4 gap-6 lg:grid">
            {footerGroups.map((group) => (
              <div key={group.title}>
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-lg">{group.icon}</span>
                  <h3 className="text-sm font-bold text-white">
                    {group.title}
                  </h3>
                </div>

                <ul className="space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/55 transition hover:text-[#D9B8FF]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* CTA compact */}
        <div className="mt-5 rounded-[1.5rem] border border-[#D9B8FF]/20 bg-gradient-to-r from-[#8E7AB5]/25 to-[#D9B8FF]/15 p-4 sm:mt-8 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <Sparkles size={15} className="text-[#D9B8FF]" />
              Prête à rejoindre la vibe ?
            </p>

            <p className="mt-1 text-xs text-white/60">
              Crée ton profil et découvre une nouvelle façon de rencontrer.
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-0 sm:flex">
            <Link
              href="/auth?mode=register"
              className="flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-xs font-bold text-[#8E7AB5] transition hover:scale-[1.02]"
            >
              S’inscrire
            </Link>

            <Link
              href="/contact"
              className="flex items-center justify-center gap-1.5 rounded-full border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
            >
              <MessageCircle size={14} />
              Contact
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 sm:mt-6 sm:p-5">
          <div className="sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="mb-3 sm:mb-0">
              <p className="flex items-center gap-2 text-sm font-bold text-white">
                <Mail size={15} className="text-[#D9B8FF]" />
                La newsletter SferaLuna
              </p>
              <p className="mt-1 text-xs text-white/60">
                Conseils, événements et nouveautés en avant-première.
              </p>
            </div>

            <NewsletterSignup variant="dark" className="sm:w-[22rem]" />
          </div>
        </div>

        {/* Bas du footer */}
        <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4 text-center text-[11px] text-white/40 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>© {new Date().getFullYear()} SferaLuna. Tous droits réservés.</p>

          <p>
            Fait avec <span className="text-pink-300">♥</span> pour des
            connexions plus vraies.
          </p>
        </div>
      </div>
    </footer>
  );
}
