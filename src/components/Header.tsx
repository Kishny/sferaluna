'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, Moon, Sparkles, ChevronDown, Bell, LogOut, Crown, Shield } from 'lucide-react';
import { getPusherClient } from '@/lib/pusher-client';

export default function Header() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [hoveredLink, setHoveredLink] = useState<string | null>(null);
    const [showAuthDropdown, setShowAuthDropdown] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const isLoggedIn = status === 'authenticated' && !!session?.user;

    // Abonnement Pusher — notifications temps réel (nouveaux matches)
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

    const links = [
        {
            href: '/',
            label: 'Luna',
            icon: '🌙',
            subItems: [
                { label: 'Accueil', href: '/' },
                { label: 'Notre histoire', href: '/histoire' },
                { label: 'Explorer librement', href: '/explorer' },
                { label: 'Équipe', href: '/equipe' },
            ]
        },
        {
            href: '/valeurs',
            label: 'Valeurs',
            icon: '💫',
            badge: 'Essentiel'
        },
        {
            href: '/fonctionnalites',
            label: 'Fonctionnalités',
            icon: '🚀',
            subItems: [
                { label: 'Fonctionnalites', href: '/fonctionnalites' },
                { label: 'Circle of Six', href: '/circle' },
                { label: 'Mode Fantôme', href: '/mode-fantome' },
                { label: 'VibePlanner', href: '/vibeplanner' },
            ]
        },
        {
            href: '/vibesphere',
            label: 'VibeSphere',
            icon: '🌌',
            badge: 'Nouveau'
        },
        {
            href: '/commencer',
            label: 'Commencer',
            icon: '🌟',
            subItems: [
                { label: 'Commencer', href: '/commencer' },
                { label: 'Guide débutant', href: '/guide' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Tarifs', href: '/tarifs' },

            ]
        },
    ];

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleAuthClick = (mode: 'login' | 'register') => {
        router.push(`/auth?mode=${mode}`);
        setOpen(false);
        setShowAuthDropdown(false);
    };

    const handleLogout = async () => {
        await signOut({ redirect: false });
        router.push('/');
        setShowUserDropdown(false);
        setOpen(false);
    };

    const menuVariants = {
        closed: {
            opacity: 0,
            x: 100,
            transition: {
                duration: 0.3,
                ease: "easeInOut"
            }
        },
        open: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.4,
                ease: "easeOut",
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        closed: { opacity: 0, x: 20 },
        open: { opacity: 1, x: 0 }
    };

    return (
        <>
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-white/20'
                    : 'bg-transparent'
                    }`}
            >
                {/* Barre de progression */}
                <motion.div
                    className="h-0.5 bg-gradient-to-r from-[#8E7AB5] via-[#D9B8FF] to-[#8E7AB5]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    style={{ transformOrigin: 'left' }}
                />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 md:h-20">
                        {/* Logo avec animation */}
                        <motion.div
                            className="flex items-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 400 }}
                        >
                            <Link href="/" className="group relative flex items-center gap-2">
                                <div className="absolute -inset-2 bg-gradient-to-r from-[#8E7AB5]/20 to-[#D9B8FF]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/logo-sferaluna.png"
                                    alt="SferaLuna"
                                    width={77}
                                    height={77}
                                    className="block shrink-0 z-10 drop-shadow-lg"
                                    style={{ background: "transparent" }}
                                />
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                            </Link>

                            {/* Badge site féminin & sécurisé */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="hidden md:flex items-center gap-1.5 ml-4 px-3 py-1 rounded-full border border-[#8E7AB5]/30 bg-white/60 backdrop-blur-sm"
                            >
                                <Shield size={11} className="text-[#8E7AB5]" />
                                <span className="text-[11px] font-medium text-[#5B4B8A] whitespace-nowrap tracking-wide">100% féminin · sécurisé</span>
                            </motion.div>
                        </motion.div>

                        {/* Menu desktop */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            {links.map((link) => (
                                <div key={link.href} className="relative group">
                                    <Link
                                        href={link.href}
                                        onMouseEnter={() => setHoveredLink(link.href)}
                                        onMouseLeave={() => setHoveredLink(null)}
                                        className={`relative px-4 py-2 text-sm font-medium transition-all duration-300 flex items-center gap-2 ${pathname === link.href
                                            ? 'text-[#8E7AB5]'
                                            : 'text-[#5E5E5E] hover:text-[#8E7AB5]'
                                            }`}
                                    >
                                        <span className="text-lg">{link.icon}</span>
                                        {link.label}
                                        {link.badge && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full ${link.badge === 'Nouveau'
                                                ? 'bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20'
                                                : 'bg-[#8E7AB5]/10 text-[#8E7AB5] border border-[#8E7AB5]/20'
                                                }`}>
                                                {link.badge}
                                            </span>
                                        )}
                                        {link.subItems && (
                                            <ChevronDown size={14} className={`transition-transform duration-300 ${hoveredLink === link.href ? 'rotate-180' : ''
                                                }`} />
                                        )}
                                    </Link>

                                    {/* Animation soulignement */}
                                    <motion.div
                                        className={`absolute left-4 right-4 bottom-0 h-0.5 bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] ${pathname === link.href ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                            }`}
                                        initial={false}
                                        animate={{
                                            width: pathname === link.href || hoveredLink === link.href ? '100%' : '0%'
                                        }}
                                        transition={{ duration: 0.3 }}
                                    />

                                    {/* Dropdown pour sous-items */}
                                    {link.subItems && (
                                        <div className="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                                            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-3 min-w-[200px]">
                                                {link.subItems.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F5F3F7] text-[#5E5E5E] hover:text-[#8E7AB5] transition-colors"
                                                    >
                                                        <span className="text-[#8E7AB5]">•</span>
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Actions droite */}
                        <div className="hidden lg:flex items-center gap-3">
                            {isLoggedIn ? (
                                <>
                                    {/* Explorer */}
                                    <Link
                                        href="/explorer"
                                        className="px-3 py-2 rounded-lg text-sm font-medium text-[#5E5E5E] hover:text-[#8E7AB5] hover:bg-[#F5F3F7] transition-colors flex items-center gap-1.5"
                                    >
                                        <Sparkles size={15} className="text-[#8E7AB5]" />
                                        Explorer
                                    </Link>

                                    {/* Dropdown user connecté */}
                                    <div className="relative">
                                        <button
                                            onClick={() => { setShowUserDropdown(!showUserDropdown); setNotifCount(0); }}
                                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#8E7AB5]/20 bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 hover:from-[#8E7AB5]/20 hover:to-[#D9B8FF]/20 transition-all text-[#5B4B8A]"
                                        >
                                            <div className="relative">
                                                {session?.user?.image ? (
                                                    <img src={session.user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                                                ) : (
                                                    <User size={16} />
                                                )}
                                                {notifCount > 0 && (
                                                    <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                                                        {notifCount > 9 ? '9+' : notifCount}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium max-w-24 truncate">
                                                {session?.user?.name || 'Mon compte'}
                                            </span>
                                            <ChevronDown size={13} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showUserDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-2 bg-white/97 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-2 min-w-[200px] z-50"
                                                >
                                                    <div className="px-3 py-2 mb-1 border-b border-[#F0F0F0]">
                                                        <p className="text-xs font-semibold text-[#8E7AB5] truncate">{session?.user?.email}</p>
                                                    </div>
                                                    <Link
                                                        href="/mon-compte"
                                                        onClick={() => setShowUserDropdown(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#F5F3F7] text-[#5E5E5E] hover:text-[#8E7AB5] transition-colors text-sm"
                                                    >
                                                        <User size={15} /> Mon compte
                                                    </Link>
                                                    <Link
                                                        href="/mon-compte"
                                                        onClick={() => setShowUserDropdown(false)}
                                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-[#F5F3F7] text-[#5E5E5E] hover:text-[#8E7AB5] transition-colors text-sm"
                                                    >
                                                        <Crown size={15} /> Premium
                                                    </Link>
                                                    <div className="h-px bg-[#F0F0F0] my-1" />
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-red-50 text-[#999] hover:text-red-500 transition-colors text-sm"
                                                    >
                                                        <LogOut size={15} /> Déconnexion
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Mode nuit — cosmétique */}
                                    <button className="p-2 rounded-lg hover:bg-[#F5F3F7] transition-colors">
                                        <Moon size={20} className="text-[#5E5E5E]" />
                                    </button>

                                    {/* Connexion dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#F5F3F7] transition-colors text-[#5E5E5E]"
                                        >
                                            <User size={18} />
                                            <span>Connexion</span>
                                            <ChevronDown size={14} className={`transition-transform ${showAuthDropdown ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showAuthDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 p-3 min-w-[180px] z-50"
                                                >
                                                    <button
                                                        onClick={() => handleAuthClick('login')}
                                                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-[#F5F3F7] text-[#5E5E5E] hover:text-[#8E7AB5] transition-colors font-medium"
                                                    >
                                                        Se connecter
                                                    </button>
                                                    <div className="h-px bg-gradient-to-r from-transparent via-[#8E7AB5]/20 to-transparent my-2" />
                                                    <button
                                                        onClick={() => handleAuthClick('register')}
                                                        className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white hover:shadow-lg transition-all duration-300 font-medium"
                                                    >
                                                        S'inscrire gratuitement
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Bouton mobile */}
                        <div className="flex lg:hidden items-center gap-3">
                            <button
                                onClick={() => router.push(isLoggedIn ? '/mon-compte' : '/auth?mode=login')}
                                className="p-2 rounded-lg hover:bg-[#F5F3F7] transition-colors"
                            >
                                {isLoggedIn && session?.user?.image ? (
                                    <img src={session.user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
                                ) : (
                                    <User size={20} className="text-[#5E5E5E]" />
                                )}
                            </button>
                            <button
                                onClick={() => setOpen(!open)}
                                className="relative z-50 p-2 rounded-lg hover:bg-[#F5F3F7] transition-colors"
                            >
                                <AnimatePresence mode="wait">
                                    {open ? (
                                        <motion.div
                                            key="close"
                                            initial={{ rotate: -90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: 90, opacity: 0 }}
                                        >
                                            <X size={28} className="text-[#8E7AB5]" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="menu"
                                            initial={{ rotate: 90, opacity: 0 }}
                                            animate={{ rotate: 0, opacity: 1 }}
                                            exit={{ rotate: -90, opacity: 0 }}
                                        >
                                            <Menu size={28} className="text-[#8E7AB5]" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Menu mobile */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                        />

                        {/* Menu */}
                        <motion.div
                            variants={menuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white/95 backdrop-blur-md shadow-2xl border-l border-white/20 z-40 lg:hidden overflow-y-auto"
                        >
                            <div className="p-6 pt-20 space-y-2">
                                {/* En-tête mobile */}
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-[#F0F0F0]">
                                    <div className="p-3 rounded-xl bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10">
                                        <Moon size={24} className="text-[#8E7AB5]" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-[#1C1C1C]">Menu SferaLuna</h3>
                                        <p className="text-sm text-[#666]">Naviguer sur la plateforme</p>
                                    </div>
                                </div>

                                {links.map((link, index) => (
                                    <motion.div
                                        key={link.href}
                                        variants={itemVariants}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all duration-300 ${pathname === link.href
                                                ? 'bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 text-[#8E7AB5]'
                                                : 'hover:bg-[#F5F3F7] text-[#5E5E5E] hover:text-[#8E7AB5]'
                                                }`}
                                        >
                                            <span className="text-2xl">{link.icon}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{link.label}</span>
                                                    {link.badge && (
                                                        <span className={`px-2 py-0.5 text-xs rounded-full ${link.badge === 'Nouveau'
                                                            ? 'bg-[#FF6B6B]/10 text-[#FF6B6B]'
                                                            : 'bg-[#8E7AB5]/10 text-[#8E7AB5]'
                                                            }`}>
                                                            {link.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {link.subItems && (
                                                    <p className="text-xs text-[#666] mt-1">Voir les sous-sections</p>
                                                )}
                                            </div>
                                            <ChevronDown size={16} className="text-[#8E7AB5]/50" />
                                        </Link>

                                        {/* Sous-items mobile */}
                                        {link.subItems && (
                                            <div className="ml-12 mt-2 space-y-1">
                                                {link.subItems.map((subItem) => (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        onClick={() => setOpen(false)}
                                                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F5F3F7] text-[#666] hover:text-[#8E7AB5] text-sm"
                                                    >
                                                        <span className="w-1 h-1 rounded-full bg-[#8E7AB5]" />
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                ))}

                                {/* Actions mobile */}
                                <div className="pt-8 mt-8 border-t border-[#F0F0F0] space-y-4">
                                    {isLoggedIn ? (
                                        <>
                                            <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 border border-[#8E7AB5]/20">
                                                <p className="text-xs text-[#8E7AB5] font-medium">{session?.user?.name || 'Compte'}</p>
                                                <p className="text-xs text-[#999] truncate">{session?.user?.email}</p>
                                            </div>
                                            <motion.button
                                                variants={itemVariants}
                                                onClick={() => { router.push('/mon-compte'); setOpen(false); }}
                                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white hover:shadow-lg transition-all duration-300 font-medium flex items-center justify-center gap-2"
                                            >
                                                <User size={18} />
                                                Mon compte
                                            </motion.button>
                                            <motion.button
                                                variants={itemVariants}
                                                onClick={handleLogout}
                                                className="w-full px-4 py-3 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 transition-colors font-medium flex items-center justify-center gap-2"
                                            >
                                                <LogOut size={18} />
                                                Déconnexion
                                            </motion.button>
                                        </>
                                    ) : (
                                        <>
                                            <motion.button
                                                variants={itemVariants}
                                                onClick={() => handleAuthClick('login')}
                                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#F5F3F7] to-[#F0F0F0] text-[#5E5E5E] hover:text-[#8E7AB5] transition-colors font-medium flex items-center justify-center gap-2"
                                            >
                                                <User size={18} />
                                                Se connecter
                                            </motion.button>

                                            <motion.button
                                                variants={itemVariants}
                                                transition={{ delay: 0.1 }}
                                                onClick={() => handleAuthClick('register')}
                                                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white hover:shadow-lg transition-all duration-300 font-medium flex items-center justify-center gap-2"
                                            >
                                                <Sparkles size={18} />
                                                S'inscrire gratuitement
                                                <span className="ml-auto px-2 py-1 text-xs bg-white/20 rounded-full">✨</span>
                                            </motion.button>
                                        </>
                                    )}
                                </div>

                                {/* Footer mobile */}
                                <motion.div
                                    variants={itemVariants}
                                    transition={{ delay: 0.2 }}
                                    className="pt-8 text-center text-xs text-[#666]"
                                >
                                    <p>© 2024 SferaLuna. Tous droits réservés.</p>
                                    <p className="mt-1">Une communauté bienveillante pour femmes</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Indicateur de défilement */}
            <motion.div
                className="fixed right-6 bottom-6 z-40 lg:hidden"
                animate={{ y: scrolled ? 0 : 100 }}
                transition={{ type: "spring", stiffness: 200 }}
            >
                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="p-3 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                    <ChevronDown size={20} className="rotate-180" />
                </button>
            </motion.div>
        </>
    );
}













