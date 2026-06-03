'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Music, Moon, Shield, Users, Mail, ChevronUp, Globe, Lock, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function Footer() {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [newsletterEmail, setNewsletterEmail] = useState('');
    const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [newsletterError, setNewsletterError] = useState('');

    useEffect(() => {
        const handleScroll = () => setShowScrollTop(window.scrollY > 500);
        window.addEventListener('scroll', handleScroll);
        setCurrentYear(new Date().getFullYear());
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const handleNewsletter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newsletterEmail) return;
        setNewsletterStatus('loading');
        setNewsletterError('');
        try {
            const res = await fetch('/api/newsletter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newsletterEmail }),
            });
            if (res.ok) { setNewsletterStatus('success'); setNewsletterEmail(''); }
            else {
                const data = await res.json();
                setNewsletterError(data.error || 'Une erreur est survenue.');
                setNewsletterStatus('error');
            }
        } catch {
            setNewsletterError('Une erreur est survenue. Réessaie.');
            setNewsletterStatus('error');
        }
    };

    const navigationLinks = [
        { href: '/valeurs', label: 'Nos valeurs', icon: <Sparkles size={13} /> },
        { href: '/fonctionnalites', label: 'Fonctionnalités', icon: <Sparkles size={13} /> },
        { href: '/guide', label: 'Guide débutant', icon: <Users size={13} /> },
        { href: '/contact', label: 'Contact', icon: <Mail size={13} /> },
        { href: '/faq', label: 'FAQ', icon: <Moon size={13} /> },
        { href: '/tarifs', label: 'Tarifs', icon: <Music size={13} /> },
    ];

    const accountLinks = [
        { href: '/auth?mode=login', label: 'Connexion', icon: <Lock size={13} /> },
        { href: '/auth?mode=register', label: 'Inscription', icon: <Sparkles size={13} /> },
        { href: '/mon-compte', label: 'Mon profil', icon: <Users size={13} /> },
        { href: '/mon-compte?tab=security', label: 'Paramètres', icon: <Shield size={13} /> },
    ];

    const legalLinks = [
        { href: '/confidentialite', label: 'Confidentialité' },
        { href: '/conditions', label: "CGU" },
        { href: '/cookies', label: 'Cookies' },
        { href: '/accessibilite', label: 'Accessibilité' },
    ];

    return (
        <>
            <AnimatePresence>
                {showScrollTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <ChevronUp size={18} />
                    </motion.button>
                )}
            </AnimatePresence>

            <footer className="relative bg-gradient-to-b from-[#F5F3F7] to-[#FFFFFF] text-[#1C1C1C] border-t border-[#E8E0FF]/40 overflow-hidden">

                {/* ── DESKTOP (md+) ── */}
                <div className="hidden md:block relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-10">
                    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">

                        {/* Logo */}
                        <div>
                            <div className="flex items-center gap-2.5 mb-3">
                                <img src="/logo-sferaluna.png" alt="SferaLuna" className="h-10 w-10 object-contain" style={{ background: 'transparent' }} />
                                <div>
                                    <h2 className="text-base font-bold bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] bg-clip-text text-transparent">SferaLuna</h2>
                                    <p className="text-xs text-[#8E7AB5]">Communauté WLW</p>
                                </div>
                            </div>
                            <p className="text-xs text-[#666] mb-3 leading-relaxed">Une oasis bienveillante pour les femmes qui aiment les femmes.</p>
                            <div className="flex items-center gap-1.5 text-xs text-[#999]">
                                <Heart size={11} className="text-[#FF6B6B]" />
                                <span>Construit avec amour</span>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div>
                            <h3 className="text-xs font-semibold text-[#5B4B8A] uppercase tracking-wide mb-3">Navigation</h3>
                            <ul className="space-y-1.5">
                                {navigationLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-sm text-[#666] hover:text-[#8E7AB5] transition-colors">{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Compte */}
                        <div>
                            <h3 className="text-xs font-semibold text-[#5B4B8A] uppercase tracking-wide mb-3">Ton compte</h3>
                            <ul className="space-y-1.5">
                                {accountLinks.map((link) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-sm text-[#666] hover:text-[#8E7AB5] transition-colors">{link.label}</Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Newsletter + App */}
                        <div>
                            <h3 className="text-xs font-semibold text-[#5B4B8A] uppercase tracking-wide mb-3">Restons connectées</h3>
                            <p className="text-xs text-[#666] mb-2">Conseils &amp; événements dans ta boîte mail.</p>
                            {newsletterStatus === 'success' ? (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                                    <CheckCircle size={12} />
                                    <span>Merci ! À très vite. 💜</span>
                                </div>
                            ) : (
                                <form onSubmit={handleNewsletter} className="relative mb-3">
                                    <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                                        placeholder="Ton adresse email" disabled={newsletterStatus === 'loading'}
                                        className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#E8E0FF] focus:border-[#8E7AB5] focus:outline-none text-[#1C1C1C] placeholder-[#bbb] disabled:opacity-60" />
                                    <button type="submit" disabled={newsletterStatus === 'loading' || !newsletterEmail}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white text-xs font-medium disabled:opacity-60">
                                        {newsletterStatus === 'loading' ? '…' : "S'abonner"}
                                    </button>
                                    {newsletterStatus === 'error' && <p className="mt-1 text-xs text-red-500">{newsletterError}</p>}
                                </form>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f0ecff] border border-[#E8E0FF] text-xs text-[#5B4B8A]">
                                    <Clock size={11} className="text-[#8E7AB5]" /> Réseaux — bientôt
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0ecff] border border-[#E8E0FF] text-xs text-[#5B4B8A]">
                                    🍎 <span>App Store</span>
                                </div>
                                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0ecff] border border-[#E8E0FF] text-xs text-[#5B4B8A]">
                                    🤖 <span>Google Play</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom bar desktop */}
                    <div className="flex flex-wrap justify-between items-center gap-3 mt-8 pt-6 border-t border-[#E8E0FF]/40">
                        <div className="flex flex-wrap gap-4 text-xs text-[#666]">
                            {legalLinks.map((l) => <Link key={l.href} href={l.href} className="hover:text-[#8E7AB5] transition-colors">{l.label}</Link>)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#666]">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20">
                                <Shield size={10} className="text-[#8E7AB5]" />
                                <span className="text-[#5B4B8A]">Plateforme sécurisée</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Globe size={11} />
                                <select className="bg-transparent border-none focus:outline-none cursor-pointer text-xs">
                                    <option>🇫🇷 Français</option>
                                    <option>🇬🇧 English</option>
                                </select>
                            </div>
                            <span>© {currentYear} SferaLuna</span>
                        </div>
                    </div>
                </div>

                {/* ── MOBILE (< md) ── */}
                <div className="md:hidden relative z-10 px-4 pt-6 pb-4">

                    {/* Logo row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <img src="/logo-sferaluna.png" alt="SferaLuna" className="h-9 w-9 object-contain" style={{ background: 'transparent' }} />
                            <div>
                                <p className="text-sm font-bold bg-gradient-to-r from-[#5B4B8A] to-[#8E7AB5] bg-clip-text text-transparent">SferaLuna</p>
                                <p className="text-xs text-[#8E7AB5]">Communauté WLW</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#999]">
                            <Heart size={10} className="text-[#FF6B6B]" />
                            <span>Fait avec amour</span>
                        </div>
                    </div>

                    {/* Liens en 2 colonnes */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-4">
                        <p className="col-span-2 text-xs font-semibold text-[#5B4B8A] uppercase tracking-wide mb-1">Liens rapides</p>
                        {[...navigationLinks, ...accountLinks].map((link) => (
                            <Link key={link.href} href={link.href} className="text-xs text-[#666] hover:text-[#8E7AB5] py-0.5 transition-colors truncate">
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Newsletter compact */}
                    <div className="mb-3">
                        {newsletterStatus === 'success' ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
                                <CheckCircle size={12} /> <span>Merci ! À très vite. 💜</span>
                            </div>
                        ) : (
                            <form onSubmit={handleNewsletter} className="relative">
                                <input type="email" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)}
                                    placeholder="Ta newsletter SferaLuna — email" disabled={newsletterStatus === 'loading'}
                                    className="w-full px-3 py-2 text-xs rounded-lg bg-white border border-[#E8E0FF] focus:border-[#8E7AB5] focus:outline-none text-[#1C1C1C] placeholder-[#bbb] pr-20" />
                                <button type="submit" disabled={newsletterStatus === 'loading' || !newsletterEmail}
                                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white text-xs font-medium disabled:opacity-60">
                                    {newsletterStatus === 'loading' ? '…' : "S'abonner"}
                                </button>
                                {newsletterStatus === 'error' && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle size={10} />{newsletterError}</p>}
                            </form>
                        )}
                    </div>

                    {/* App + réseaux inline */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f0ecff] border border-[#E8E0FF] text-xs text-[#5B4B8A]">
                            🍎 App Store — bientôt
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#f0ecff] border border-[#E8E0FF] text-xs text-[#5B4B8A]">
                            🤖 Google Play — bientôt
                        </div>
                    </div>

                    {/* Bottom bar mobile */}
                    <div className="border-t border-[#E8E0FF]/40 pt-3 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex flex-wrap gap-3 text-xs text-[#666]">
                            {legalLinks.map((l) => <Link key={l.href} href={l.href} className="hover:text-[#8E7AB5] transition-colors">{l.label}</Link>)}
                        </div>
                        <p className="text-xs text-[#999]">© {currentYear} SferaLuna</p>
                    </div>
                </div>

                <div className="h-0.5 bg-gradient-to-r from-transparent via-[#8E7AB5]/50 to-transparent" />
            </footer>

            <style jsx>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
      `}</style>
        </>
    );
}
