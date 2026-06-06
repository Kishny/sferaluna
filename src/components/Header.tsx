'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  User,
  Moon,
  Sparkles,
  ChevronDown,
  LogOut,
  Crown,
  Shield,
  Bell,
  Home,
  Compass,
  Heart,
  MessageCircle,
  Settings,
} from 'lucide-react';
import { getPusherClient } from '@/lib/pusher-client';

/**
 * Type d'un sous-lien dans le header.
 */
type HeaderSubItem = {
  label: string;
  href: string;
};

/**
 * Type d'un lien principal du header.
 */
type HeaderLink = {
  href: string;
  label: string;
  icon: ReactNode;
  mobileIcon: string;
  badge?: string;
  subItems?: HeaderSubItem[];
};

/**
 * Header SferaLuna.
 *
 * Objectifs de cette version :
 * - header desktop conservé, mais plus propre ;
 * - header mobile beaucoup plus compact ;
 * - menu burger différent d'un menu classique ;
 * - menu mobile sous forme de panneau flottant "Luna Dock" ;
 * - sous-sections en accordéon mobile ;
 * - support utilisateur connecté / non connecté ;
 * - notifications temps réel via Pusher ;
 * - bouton retour en haut masqué tant qu'on n'a pas scrollé.
 */
export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [showAuthDropdown, setShowAuthDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  /**
   * Accordéon mobile :
   * on ouvre un seul groupe à la fois.
   */
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();

  const isLoggedIn = status === 'authenticated' && !!session?.user;

  /**
   * Liens principaux du header.
   */
  const links: HeaderLink[] = [
    {
      href: '/',
      label: 'Luna',
      icon: <Moon size={17} />,
      mobileIcon: '🌙',
      subItems: [
        { label: 'Accueil', href: '/' },
        { label: 'Notre histoire', href: '/histoire' },
        { label: 'Explorer librement', href: '/explorer' },
        { label: 'Équipe', href: '/equipe' },
      ],
    },
    {
      href: '/valeurs',
      label: 'Valeurs',
      icon: <Heart size={17} />,
      mobileIcon: '💫',
      badge: 'Essentiel',
    },
    {
      href: '/fonctionnalites',
      label: 'Fonctions',
      icon: <Sparkles size={17} />,
      mobileIcon: '🚀',
      subItems: [
        { label: 'Toutes les fonctionnalités', href: '/fonctionnalites' },
        { label: 'Circle of Six', href: '/circle' },
        { label: 'Mode Fantôme', href: '/mode-fantome' },
        { label: 'VibePlanner', href: '/vibeplanner' },
        { label: 'VibeSphere', href: '/vibesphere' },
      ],
    },
    {
      href: '/vibesphere',
      label: 'VibeSphere',
      icon: <Compass size={17} />,
      mobileIcon: '🌌',
      badge: 'Nouveau',
    },
    {
      href: '/commencer',
      label: 'Commencer',
      icon: <Sparkles size={17} />,
      mobileIcon: '🌟',
      subItems: [
        { label: 'Commencer', href: '/commencer' },
        { label: 'Guide débutant', href: '/guide' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Tarifs', href: '/tarifs' },
      ],
    },
  ];

  /**
   * Détection du scroll pour rendre le header plus compact et lisible.
   */
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 16);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Ferme le menu mobile à chaque changement de route.
   */
  useEffect(() => {
    setOpen(false);
    setOpenMobileGroup(null);
    setShowAuthDropdown(false);
    setShowUserDropdown(false);
  }, [pathname]);

  /**
   * Quand le menu mobile est ouvert, on bloque le scroll du body.
   * Ça évite les bugs de scroll derrière le menu.
   */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /**
   * Notifications : polling toutes les 30 secondes.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchNotifs = async () => {
      try {
        const res = await fetch('/api/notifications', {
          cache: 'no-store',
        });

        if (!res.ok) return;

        const data = await res.json();
        setNotifCount(data.total || 0);
      } catch {
        // On ignore volontairement l'erreur pour ne pas casser le header.
      }
    };

    fetchNotifs();

    const interval = setInterval(fetchNotifs, 30_000);

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  /**
   * Notifications temps réel via Pusher.
   * Exemple : nouveau match.
   */
  useEffect(() => {
    if (!isLoggedIn) return;

    const sessionUser = session?.user as { id?: string } | undefined;
    const userId = sessionUser?.id;

    if (!userId) return;

    const channelName = `private-user-${userId}`;
    const client = getPusherClient();
    const channel = client.subscribe(channelName);

    channel.bind('new-match', () => {
      setNotifCount((prev) => prev + 1);
    });

    return () => {
      channel.unbind_all();
      client.unsubscribe(channelName);
    };
  }, [isLoggedIn, session?.user]);

  /**
   * Redirection vers auth.
   */
  const handleAuthClick = (mode: 'login' | 'register') => {
    router.push(`/auth?mode=${mode}`);
    setOpen(false);
    setShowAuthDropdown(false);
  };

  /**
   * Déconnexion.
   */
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setShowUserDropdown(false);
    setOpen(false);
  };

  /**
   * Ouvre / ferme un groupe du menu mobile.
   */
  const toggleMobileGroup = (href: string) => {
    setOpenMobileGroup((current) => (current === href ? null : href));
  };

  /**
   * Variants du panneau mobile.
   */
  const mobilePanelVariants = {
    closed: {
      opacity: 0,
      y: -18,
      scale: 0.96,
      filter: 'blur(8px)',
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
    open: {
      opacity: 1,
      y: 0,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        duration: 0.28,
        ease: 'easeOut',
        staggerChildren: 0.04,
        delayChildren: 0.05,
      },
    },
  };

  const mobileItemVariants = {
    closed: { opacity: 0, y: 10 },
    open: { opacity: 1, y: 0 },
  };

  return (
    <>
      <motion.header
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/40 bg-white/90 shadow-[0_8px_30px_rgba(80,60,120,0.08)] backdrop-blur-xl'
            : 'bg-white/65 backdrop-blur-md'
        }`}
      >
        {/* Ligne lumineuse très fine */}
        <motion.div
          className="h-[2px] origin-left bg-gradient-to-r from-[#8E7AB5] via-[#D9B8FF] to-[#8E7AB5]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between sm:h-16 lg:h-20">
            {/* Logo compact mobile */}
            <motion.div
              className="flex shrink-0 items-center"
              whileHover={{ scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Link href="/" className="group relative flex items-center gap-2">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#8E7AB5]/20 to-[#D9B8FF]/20 opacity-0 blur transition-opacity duration-300 group-hover:opacity-100" />

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo-sferaluna.png"
                  alt="SferaLuna"
                  width={54}
                  height={54}
                  className="relative z-10 block h-11 w-11 shrink-0 object-contain drop-shadow-sm sm:h-14 sm:w-14 lg:h-[72px] lg:w-[72px]"
                  style={{ background: 'transparent' }}
                />

                <div className="hidden min-[380px]:block lg:hidden">
                  <p className="text-sm font-black leading-none text-[#5B4B8A]">
                    SferaLuna
                  </p>
                  <p className="text-[10px] leading-tight text-[#8E7AB5]/70">
                    rencontre au féminin
                  </p>
                </div>
              </Link>

              {/* Badge desktop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="ml-3 hidden items-center gap-1.5 rounded-full border border-[#8E7AB5]/25 bg-white/60 px-3 py-1 backdrop-blur-sm xl:flex"
              >
                <Shield size={11} className="text-[#8E7AB5]" />

                <span className="whitespace-nowrap text-[11px] font-medium tracking-wide text-[#5B4B8A]">
                  100% féminin · sécurisé
                </span>
              </motion.div>
            </motion.div>

            {/* Menu desktop */}
            <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 overflow-hidden lg:flex">
              {links.map((link) => {
                const isActive =
                  pathname === link.href ||
                  Boolean(
                    link.subItems?.some((subItem) => pathname === subItem.href)
                  );

                return (
                  <div key={link.href} className="group relative">
                    <Link
                      href={link.href}
                      onMouseEnter={() => setHoveredLink(link.href)}
                      onMouseLeave={() => setHoveredLink(null)}
                      className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-[#8E7AB5]/10 text-[#8E7AB5]'
                          : 'text-[#5E5E5E] hover:bg-[#8E7AB5]/8 hover:text-[#8E7AB5]'
                      }`}
                    >
                      <span className="text-[#8E7AB5]">{link.icon}</span>

                      {link.label}

                      {link.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] ${
                            link.badge === 'Nouveau'
                              ? 'border border-[#FF6B6B]/20 bg-[#FF6B6B]/10 text-[#FF6B6B]'
                              : 'border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 text-[#8E7AB5]'
                          }`}
                        >
                          {link.badge}
                        </span>
                      )}

                      {link.subItems && (
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-300 ${
                            hoveredLink === link.href ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </Link>

                    {/* Dropdown desktop */}
                    {link.subItems && (
                      <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100">
                        <div className="min-w-[220px] rounded-2xl border border-white/40 bg-white/95 p-2 shadow-2xl backdrop-blur-xl">
                          {link.subItems.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7] hover:text-[#8E7AB5]"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-[#8E7AB5]" />
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Actions desktop */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/explorer"
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-[13px] font-medium text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7] hover:text-[#8E7AB5]"
                  >
                    <Sparkles size={15} className="text-[#8E7AB5]" />
                    Explorer
                  </Link>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown((current) => !current);
                        setNotifCount(0);
                      }}
                      className="flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 px-3 py-2 text-[#5B4B8A] transition-all hover:from-[#8E7AB5]/20 hover:to-[#D9B8FF]/20"
                    >
                      <div className="relative">
                        {session?.user?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={session.user.image}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <User size={16} />
                        )}

                        {notifCount > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
                            {notifCount > 9 ? '9+' : notifCount}
                          </span>
                        )}
                      </div>

                      <span className="max-w-24 truncate text-sm font-medium">
                        {session?.user?.name || 'Mon compte'}
                      </span>

                      <ChevronDown
                        size={13}
                        className={`transition-transform ${
                          showUserDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {showUserDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-2xl border border-white/40 bg-white/95 p-2 shadow-2xl backdrop-blur-xl"
                        >
                          <div className="mb-1 border-b border-[#F0F0F0] px-3 py-2">
                            <p className="truncate text-xs font-semibold text-[#8E7AB5]">
                              {session?.user?.email}
                            </p>
                          </div>

                          <Link
                            href="/mon-compte"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7] hover:text-[#8E7AB5]"
                          >
                            <User size={15} />
                            Mon compte
                          </Link>

                          <Link
                            href="/mon-compte?tab=premium"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7] hover:text-[#8E7AB5]"
                          >
                            <Crown size={15} />
                            Premium
                          </Link>

                          <Link
                            href="/messages"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7] hover:text-[#8E7AB5]"
                          >
                            <MessageCircle size={15} />
                            Messages
                          </Link>

                          <div className="my-1 h-px bg-[#F0F0F0]" />

                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-[#999] transition-colors hover:bg-red-50 hover:text-red-500"
                          >
                            <LogOut size={15} />
                            Déconnexion
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="rounded-full p-2 transition-colors hover:bg-[#F5F3F7]"
                    aria-label="Mode nuit"
                  >
                    <Moon size={20} className="text-[#5E5E5E]" />
                  </button>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setShowAuthDropdown((current) => !current)
                      }
                      className="flex items-center gap-2 rounded-full px-4 py-2 text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7]"
                    >
                      <User size={18} />
                      <span>Connexion</span>

                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          showAuthDropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {showAuthDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.96 }}
                          className="absolute right-0 top-full z-50 mt-2 min-w-[190px] rounded-2xl border border-white/40 bg-white/95 p-2 shadow-2xl backdrop-blur-xl"
                        >
                          <button
                            type="button"
                            onClick={() => handleAuthClick('login')}
                            className="w-full rounded-xl px-4 py-3 text-left font-medium text-[#5E5E5E] transition-colors hover:bg-[#F5F3F7] hover:text-[#8E7AB5]"
                          >
                            Se connecter
                          </button>

                          <div className="my-1 h-px bg-gradient-to-r from-transparent via-[#8E7AB5]/20 to-transparent" />

                          <button
                            type="button"
                            onClick={() => handleAuthClick('register')}
                            className="w-full rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-4 py-3 text-left font-medium text-white transition-all duration-300 hover:shadow-lg"
                          >
                            S’inscrire gratuitement
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            {/* Actions mobile compactes */}
            <div className="flex items-center gap-1.5 lg:hidden">
              {/* Notifications ou accès compte */}
              <button
                type="button"
                onClick={() =>
                  router.push(isLoggedIn ? '/mon-compte' : '/auth?mode=login')
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#8E7AB5]/10 bg-white/70 text-[#5B4B8A] shadow-sm backdrop-blur transition-colors hover:bg-[#F5F3F7]"
                aria-label={isLoggedIn ? 'Mon compte' : 'Connexion'}
              >
                {isLoggedIn && session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <User size={18} />
                )}

                {isLoggedIn && notifCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {notifCount > 9 ? '9+' : notifCount}
                  </span>
                )}
              </button>

              {/* Burger original : pastille lunaire */}
              <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={`relative z-[60] flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border shadow-sm transition-all ${
                  open
                    ? 'border-[#8E7AB5]/30 bg-[#1a0b2e] text-white'
                    : 'border-[#8E7AB5]/15 bg-white/80 text-[#8E7AB5] backdrop-blur'
                }`}
                aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                <span className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5]/10 to-[#D9B8FF]/20" />

                <AnimatePresence mode="wait">
                  {open ? (
                    <motion.span
                      key="close"
                      initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                      className="relative z-10"
                    >
                      <X size={20} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      className="relative z-10"
                    >
                      <Menu size={20} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Menu mobile : Luna Dock */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-[#1a0b2e]/35 backdrop-blur-sm lg:hidden"
              aria-label="Fermer le menu"
            />

            {/* Panneau flottant compact, pas un tiroir classique */}
            <motion.div
              variants={mobilePanelVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed left-3 right-3 top-[4.15rem] z-50 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-[2rem] border border-white/40 bg-white/92 shadow-[0_24px_80px_rgba(53,35,92,0.28)] backdrop-blur-2xl lg:hidden"
            >
              {/* Décor intérieur */}
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#D9B8FF]/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-[#8E7AB5]/25 blur-3xl" />

              <div className="relative max-h-[calc(100dvh-5rem)] overflow-y-auto p-3">
                {/* Capsule utilisateur compacte */}
                <motion.div
                  variants={mobileItemVariants}
                  className="mb-3 rounded-[1.5rem] border border-[#8E7AB5]/15 bg-gradient-to-r from-[#F5F0FF] to-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8E7AB5] to-[#D9B8FF] text-white shadow-md">
                      {isLoggedIn && session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.user.image}
                          alt=""
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        <Moon size={21} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#1C1C1C]">
                        {isLoggedIn
                          ? session?.user?.name || 'Mon espace Luna'
                          : 'Bienvenue sur SferaLuna'}
                      </p>

                      <p className="truncate text-xs text-[#6E6385]">
                        {isLoggedIn
                          ? session?.user?.email
                          : 'Menu rapide, compact et sécurisé'}
                      </p>
                    </div>

                    {isLoggedIn && notifCount > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold text-white">
                        <Bell size={11} />
                        {notifCount > 9 ? '9+' : notifCount}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Dock rapide */}
                <motion.div
                  variants={mobileItemVariants}
                  className="mb-3 grid grid-cols-4 gap-2"
                >
                  {[
                    { label: 'Accueil', href: '/', icon: <Home size={17} /> },
                    {
                      label: 'Explorer',
                      href: '/explorer',
                      icon: <Compass size={17} />,
                    },
                    {
                      label: 'Matches',
                      href: '/matches',
                      icon: <Heart size={17} />,
                    },
                    {
                      label: 'Compte',
                      href: isLoggedIn ? '/mon-compte' : '/auth?mode=login',
                      icon: <User size={17} />,
                    },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-[#8E7AB5]/10 bg-white/75 px-2 py-2.5 text-[#5B4B8A] shadow-sm transition hover:bg-[#F5F0FF]"
                    >
                      {item.icon}
                      <span className="text-[10px] font-semibold">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </motion.div>

                {/* Navigation accordéon */}
                <div className="space-y-1.5">
                  {links.map((link) => {
                    const isOpen = openMobileGroup === link.href;
                    const isActive =
                      pathname === link.href ||
                      Boolean(
                        link.subItems?.some(
                          (subItem) => pathname === subItem.href
                        )
                      );

                    return (
                      <motion.div
                        key={link.href}
                        variants={mobileItemVariants}
                        className={`overflow-hidden rounded-2xl border transition-colors ${
                          isActive
                            ? 'border-[#8E7AB5]/25 bg-[#8E7AB5]/10'
                            : 'border-[#8E7AB5]/10 bg-white/60'
                        }`}
                      >
                        <div className="flex items-center">
                          <Link
                            href={link.href}
                            onClick={() => {
                              if (!link.subItems) setOpen(false);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-lg">
                              {link.mobileIcon}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="truncate text-sm font-bold text-[#5B4B8A]">
                                  {link.label}
                                </span>

                                {link.badge && (
                                  <span
                                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                      link.badge === 'Nouveau'
                                        ? 'bg-red-100 text-red-500'
                                        : 'bg-[#8E7AB5]/10 text-[#8E7AB5]'
                                    }`}
                                  >
                                    {link.badge}
                                  </span>
                                )}
                              </div>

                              {link.subItems && (
                                <p className="truncate text-[10px] text-[#7A718A]">
                                  {link.subItems.length} sous-sections
                                </p>
                              )}
                            </div>
                          </Link>

                          {link.subItems && (
                            <button
                              type="button"
                              onClick={() => toggleMobileGroup(link.href)}
                              className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#8E7AB5] transition hover:bg-[#8E7AB5]/10"
                              aria-label={`Ouvrir ${link.label}`}
                            >
                              <ChevronDown
                                size={17}
                                className={`transition-transform ${
                                  isOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        <AnimatePresence initial={false}>
                          {link.subItems && isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-1 border-t border-[#8E7AB5]/10 px-3 pb-3 pt-2">
                                {link.subItems.map((subItem) => (
                                  <Link
                                    key={subItem.href}
                                    href={subItem.href}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-[#6E6385] transition hover:bg-white hover:text-[#8E7AB5]"
                                  >
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#8E7AB5]" />
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Actions mobile */}
                <motion.div
                  variants={mobileItemVariants}
                  className="mt-3 border-t border-[#8E7AB5]/10 pt-3"
                >
                  {isLoggedIn ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          router.push('/mon-compte');
                          setOpen(false);
                        }}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-4 py-3 text-sm font-bold text-white shadow-lg"
                      >
                        <User size={16} />
                        Compte
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-500"
                      >
                        <LogOut size={16} />
                        Quitter
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 min-[390px]:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => handleAuthClick('login')}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-[#8E7AB5]/15 bg-white px-4 py-3 text-sm font-bold text-[#5B4B8A]"
                      >
                        <User size={16} />
                        Connexion
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAuthClick('register')}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-4 py-3 text-sm font-bold text-white shadow-lg"
                      >
                        <Sparkles size={16} />
                        Inscription
                      </button>
                    </div>
                  )}
                </motion.div>

                <motion.p
                  variants={mobileItemVariants}
                  className="mt-3 text-center text-[10px] text-[#8A819A]"
                >
                  SferaLuna · Une communauté bienveillante pour femmes 💜
                </motion.p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bouton retour haut compact */}
      <motion.div
        className="fixed bottom-5 right-4 z-40 lg:hidden"
        animate={{ y: scrolled ? 0 : 90, opacity: scrolled ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white shadow-lg"
          aria-label="Remonter en haut"
        >
          <ChevronDown size={20} className="rotate-180" />
        </button>
      </motion.div>
    </>
  );
}













