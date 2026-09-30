'use client';

/**
 * Header public SferaLuna.
 *
 * Navigation volontairement minimale :
 *   Découvrir · Fonctionnalités · Sécurité · Tarifs
 * puis Connexion + « Créer mon profil » (ou, connectée : cloche,
 * « Explorer librement » et menu du compte).
 *
 * Même langage visuel que l'espace connecté (/mon-compte) : verre fumé
 * violet nuit, rose lumineux réservé à l'action principale.
 * Fond toujours sombre et translucide : lisible sur les pages claires
 * comme sur les pages sombres.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUp,
  Bell,
  ChevronDown,
  Compass,
  Crown,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquareText,
  Moon,
  X,
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Découvrir' },
  { href: '/fonctionnalites', label: 'Fonctionnalités' },
  { href: '/securite', label: 'Sécurité' },
  { href: '/tarifs', label: 'Tarifs' },
];

/** Liens secondaires, uniquement dans le menu mobile (le footer les reprend). */
const MORE = [
  { href: '/histoire', label: 'Notre histoire' },
  { href: '/valeurs', label: 'Nos valeurs' },
  { href: '/vibesphere', label: 'VibeSphere' },
  { href: '/vibementor', label: 'VibeMentor' },
  { href: '/communaute', label: 'Communauté' },
  { href: '/guide', label: 'Guide' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Scroll : header plus opaque + bouton "remonter".
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
      setShowTop(window.scrollY > 700);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Ferme les menus à chaque navigation.
  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Bloque le scroll derrière le menu mobile.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  // Ferme le menu du compte au clic extérieur.
  useEffect(() => {
    if (!userMenuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [userMenuOpen]);

  // Notifications : chargement + rafraîchissement toutes les 30 s.
  useEffect(() => {
    if (!isLoggedIn) return;

    const load = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setNotifCount(data.total || 0);
      } catch {
        // silencieux : le header ne doit jamais casser
      }
    };

    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Temps réel Pusher : nouveau match / nouveau message.
  useEffect(() => {
    if (!isLoggedIn) return;
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { getPusherClient } = await import('@/lib/pusher-client');
        if (cancelled) return;
        const client = getPusherClient();
        const channelName = `private-user-${userId}`;
        const channel = client.subscribe(channelName);
        const bump = () => setNotifCount((n) => n + 1);
        channel.bind('new-match', bump);
        channel.bind('new-message', bump);
        cleanup = () => {
          channel.unbind('new-match', bump);
          channel.unbind('new-message', bump);
          client.unsubscribe(channelName);
        };
      } catch {
        // Pusher non configuré
      }
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [isLoggedIn, session?.user]);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUserMenuOpen(false);
    setMenuOpen(false);
    router.push('/');
  };

  const userName = session?.user?.name || 'Mon compte';
  const userImage = session?.user?.image || '';

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-violet-300/10 bg-[#12081f]/85 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl'
            : 'bg-gradient-to-b from-[#12081f]/80 to-[#12081f]/40 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[84px] lg:px-8">
          {/* Marque */}
          <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="SferaLuna — accueil">
            <span className="relative flex h-10 w-10 items-center justify-center lg:h-12 lg:w-12">
              <span className="absolute inset-0 rounded-full bg-fuchsia-500/35 blur-lg transition group-hover:bg-fuchsia-400/50" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-sferaluna.png" alt="" className="relative h-9 w-9 rounded-full object-cover lg:h-11 lg:w-11" />
            </span>
            <span className="leading-none">
              <span className="block text-xl font-semibold tracking-tight text-white lg:text-2xl">SferaLuna</span>
              <span className="mt-1 hidden text-[11px] leading-tight text-white/60 xl:block">
                Plus que des rencontres,
                <br />
                un espace pour être soi.
              </span>
            </span>
          </Link>

          {/* Navigation desktop */}
          <nav
            className="mx-auto hidden items-center gap-1 rounded-full border border-violet-300/15 bg-[#1b0d38]/60 p-1.5 backdrop-blur-xl lg:flex"
            aria-label="Navigation principale"
          >
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative rounded-full px-4 py-2 text-sm font-medium transition xl:px-5 ${
                    active ? 'text-white' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full border border-fuchsia-300/40 bg-gradient-to-r from-fuchsia-500/25 to-violet-500/25 shadow-[0_0_20px_-6px_rgba(217,70,239,0.7)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3 lg:ml-0">
            {status === 'loading' ? (
              <span className="h-10 w-28 animate-pulse rounded-full bg-white/5" />
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/mon-compte?tab=connexions"
                  className="relative flex h-10 w-10 items-center justify-center rounded-full border border-violet-300/20 bg-white/[0.04] text-white/80 transition hover:border-violet-300/40 hover:text-white"
                  aria-label={`Notifications${notifCount ? ` (${notifCount})` : ''}`}
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {notifCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-bold text-white ring-2 ring-[#12081f]">
                      {notifCount > 9 ? '9+' : notifCount}
                    </span>
                  )}
                </Link>

                <Link
                  href="/explorer"
                  className="hidden h-11 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(217,70,239,0.8)] ring-1 ring-fuchsia-300/40 transition hover:brightness-110 xl:inline-flex"
                >
                  <Compass className="h-4 w-4" />
                  Explorer librement
                </Link>

                <div ref={userMenuRef} className="relative hidden md:block">
                  <button
                    type="button"
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex h-11 items-center gap-2 rounded-full border border-violet-300/20 bg-white/[0.04] py-1 pl-1 pr-3 transition hover:border-violet-300/40"
                    aria-expanded={userMenuOpen}
                    aria-label="Menu du compte"
                  >
                    {userImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userImage} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-fuchsia-400/50" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 text-sm font-semibold text-white">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <ChevronDown className={`h-4 w-4 text-white/60 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+10px)] w-60 rounded-2xl border border-violet-300/15 bg-[#1a0c38]/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-2xl"
                      >
                        <p className="truncate px-3 pb-2 pt-1.5 text-sm font-semibold text-white">{userName}</p>
                        {[
                          { href: '/mon-compte', label: 'Mon tableau de bord', icon: LayoutDashboard },
                          { href: '/matches', label: 'Mes messages', icon: MessageSquareText },
                          { href: '/mon-compte?tab=premium', label: 'Mon abonnement', icon: Crown },
                        ].map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <item.icon className="h-4 w-4 text-violet-200" />
                            {item.label}
                          </Link>
                        ))}
                        <div className="my-1 h-px bg-white/10" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-rose-200/90 transition hover:bg-white/[0.06]"
                        >
                          <LogOut className="h-4 w-4" />
                          Déconnexion
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth?mode=login"
                  className="hidden h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium text-white/90 transition hover:bg-white/5 lg:inline-flex xl:border xl:border-violet-300/35 xl:px-5 xl:hover:border-fuchsia-300/60"
                >
                  Connexion
                </Link>
                <Link
                  href="/auth?mode=register"
                  className="group hidden h-11 items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_8px_28px_-8px_rgba(217,70,239,0.8)] ring-1 ring-fuchsia-300/40 transition hover:brightness-110 sm:inline-flex"
                >
                  Créer mon profil
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}

            {/* Burger mobile */}
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-300/20 bg-white/[0.04] text-white lg:hidden"
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-3 top-[72px] z-50 max-h-[calc(100vh-88px)] overflow-y-auto rounded-3xl border border-violet-300/15 bg-[#160a2e]/97 p-4 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:hidden"
            >
              <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
                {NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-base font-medium transition ${
                        active
                          ? 'bg-gradient-to-r from-fuchsia-500/25 to-violet-500/20 text-white ring-1 ring-fuchsia-300/30'
                          : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {item.label}
                      <ArrowRight className="h-4 w-4 opacity-50" />
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-4 grid gap-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/explorer"
                      className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 text-sm font-semibold text-white"
                    >
                      <Compass className="h-4 w-4" /> Explorer librement
                    </Link>
                    <Link
                      href="/mon-compte"
                      className="flex h-12 items-center justify-center gap-2 rounded-full border border-violet-300/30 text-sm font-medium text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Mon tableau de bord
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex h-11 items-center justify-center gap-2 rounded-full text-sm text-rose-200/90"
                    >
                      <LogOut className="h-4 w-4" /> Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth?mode=register"
                      className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-600 to-violet-600 text-sm font-semibold text-white"
                    >
                      <Moon className="h-4 w-4" /> Créer mon profil
                    </Link>
                    <Link
                      href="/auth?mode=login"
                      className="flex h-12 items-center justify-center gap-2 rounded-full border border-violet-300/30 text-sm font-medium text-white"
                    >
                      <LogIn className="h-4 w-4" /> Connexion
                    </Link>
                  </>
                )}
              </div>

              <p className="mb-2 mt-5 px-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">
                Aussi sur SferaLuna
              </p>
              <div className="grid grid-cols-2 gap-1">
                {MORE.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-3 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Remonter en haut */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-violet-300/25 bg-[#1b0d38]/90 text-white shadow-lg shadow-black/40 backdrop-blur-xl transition hover:border-fuchsia-300/50"
            aria-label="Remonter en haut"
          >
            <ArrowUp className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
