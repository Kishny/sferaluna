'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
    Sparkles,
    CheckCircle,
    Users,
    Lock,
    Heart,
    Star,
    ChevronRight,
    ArrowRight,
    Shield,
    Moon,
    Zap
} from 'lucide-react';

interface SiteStats { membres: number; matchs: number; messages: number; evenements: number; }

function formatStat(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
    if (n === 0) return '—';
    return n.toString();
}

export default function CommencerPage() {
    const [step, setStep] = useState(1);
    const [hoveredButton, setHoveredButton] = useState<string | null>(null);
    const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
    const { scrollYProgress } = useScroll();

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev % 4) + 1);
        }, 4000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetch('/api/stats').then(r => r.json()).then(d => { if (d.success) setSiteStats(d.stats); }).catch(() => {});
    }, []);

    const steps = [
        {
            number: 1,
            title: "Création du profil",
            description: "Partage ce qui te définit vraiment",
            icon: <Users className="w-6 h-6" />,
            details: "Ajoute tes intérêts, tes valeurs et ce que tu recherches",
            color: "from-[#8E7AB5] to-[#D9B8FF]"
        },
        {
            number: 2,
            title: "Découverte du Circle of Six",
            description: "Rencontre 6 femmes qui te correspondent",
            icon: <Heart className="w-6 h-6" />,
            details: "Notre algorithme te présente 6 profils alignés avec ta vibe",
            color: "from-[#FF6B6B] to-[#FF8E8E]"
        },
        {
            number: 3,
            title: "Personnalisation de ton VibeSphere",
            description: "Crée ton espace émotionnel unique",
            icon: <Moon className="w-6 h-6" />,
            details: "Choisis ta playlist, tes couleurs et ton ambiance",
            color: "from-[#4ECDC4] to-[#44A08D]"
        },
        {
            number: 4,
            title: "Première connexion",
            description: "Commence à vibrer avec ta communauté",
            icon: <Sparkles className="w-6 h-6" />,
            details: "Participe à un événement ou envoie ton premier message",
            color: "from-[#FFD166] to-[#FF9A3C]"
        }
    ];

    const benefits = [
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Sécurité maximale",
            description: "Modération 24/7 et données cryptées",
            color: "text-[#8E7AB5]"
        },
        {
            icon: <Lock className="w-6 h-6" />,
            title: "Contrôle total",
            description: "Gère ta visibilité comme tu le souhaites",
            color: "text-[#FF6B6B]"
        },
        {
            icon: <Zap className="w-6 h-6" />,
            title: "Matching intelligent",
            description: "Basé sur les valeurs et les vibes, pas juste les photos",
            color: "text-[#4ECDC4]"
        },
        {
            icon: <Star className="w-6 h-6" />,
            title: "Expérience premium",
            description: "Interface élégante et expérience fluide",
            color: "text-[#FFD166]"
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 30, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: "easeOut" }
        }
    };

    const cardVariants = {
        hidden: { scale: 0.9, opacity: 0 },
        visible: (i: number) => ({
            scale: 1,
            opacity: 1,
            transition: {
                delay: i * 0.1,
                duration: 0.5,
                ease: "easeOut"
            }
        }),
        hover: {
            y: -10,
            scale: 1.02,
            transition: { duration: 0.3 }
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gradient-to-b from-[#F5F3F7] to-[#FFFFFF] text-[#1C1C1C] overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-8 md:pt-28 md:pb-12 px-4 md:px-6 overflow-hidden">
                    {/* Fond animé */}
                    <motion.div
                        className="absolute inset-0"
                        style={{ opacity: heroOpacity, scale: heroScale }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

                        {/* Orbes décoratives */}
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                rotate: [0, 180, 360]
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-white/10 to-white/5 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1.2, 1, 1.2],
                                rotate: [360, 180, 0]
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-3xl"
                        />

                        {/* Motif de fond discret */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute inset-0" style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundSize: '60px 60px'
                            }} />
                        </div>
                    </motion.div>

                    <div className="relative z-10 max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center text-white"
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8"
                            >
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span className="text-sm font-medium">
                                    ✨ Commence ton voyage
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6"
                            >
                                <span>Prête à rejoindre</span>
                                <br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-[#F9F5FF]">
                                    SferaLuna ?
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-base md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed opacity-90"
                            >
                                Inscris-toi gratuitement et découvre une nouvelle manière de rencontrer,
                                plus douce, plus consciente, plus libre.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.6 }}
                                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                            >
                                <Link
                                    href="/auth?mode=register"
                                    onMouseEnter={() => setHoveredButton('register')}
                                    onMouseLeave={() => setHoveredButton(null)}
                                    className="group relative"
                                >
                                    <button className="relative px-5 md:px-8 py-4 rounded-full bg-white text-[#8E7AB5] font-semibold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden">
                                        <span className="relative z-10 flex items-center gap-3">
                                            Créer mon compte gratuit
                                            <motion.span
                                                animate={{ rotate: hoveredButton === 'register' ? 360 : 0 }}
                                                transition={{ duration: 0.5 }}
                                                className="group-hover:scale-110 transition-transform"
                                            >
                                                ✨
                                            </motion.span>
                                        </span>
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                    </button>
                                </Link>

                                <Link
                                    href="/"
                                    onMouseEnter={() => setHoveredButton('home')}
                                    onMouseLeave={() => setHoveredButton(null)}
                                >
                                    <button className="group px-5 md:px-8 py-4 rounded-full border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-2">
                                        Découvrir l'accueil
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </motion.div>

                            {/* Statistiques */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.9, duration: 0.8 }}
                                className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
                            >
                                {[
                                    { value: '48h', label: 'Pour ta 1ère connexion' },
                                    { value: siteStats ? formatStat(siteStats.membres) : '…', label: 'Membres inscrites' },
                                    { value: siteStats ? formatStat(siteStats.matchs) : '…', label: 'Matchs créés' },
                                    { value: siteStats ? formatStat(siteStats.evenements) : '…', label: 'Événements organisés' }
                                ].map((stat, index) => (
                                    <div key={index} className="text-center">
                                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                                        <div className="text-sm text-white/80 mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* Étapes du parcours */}
                <section className="md:py-8 px-4 md:px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-center mb-8 md:mb-5 md:mb-8"
                        >
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6">
                                Ton parcours en <span className="text-[#8E7AB5]">4 étapes</span>
                            </h2>
                            <p className="text-xl text-[#666] max-w-3xl mx-auto">
                                Un processus simple et fluide pour te connecter avec des femmes authentiques
                            </p>
                        </motion.div>

                        <div className="relative">
                            {/* Ligne de progression */}
                            <div className="absolute left-0 right-0 top-12 h-1 bg-gradient-to-r from-[#8E7AB5] via-[#A68BC9] to-[#8E7AB5] opacity-20" />
                            <motion.div
                                className="absolute left-0 top-12 h-1 bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]"
                                initial={{ width: 0 }}
                                whileInView={{ width: "100%" }}
                                viewport={{ once: true }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                                {steps.map((stepItem, index) => (
                                    <motion.div
                                        key={index}
                                        custom={index}
                                        variants={cardVariants}
                                        initial="hidden"
                                        whileInView="visible"
                                        whileHover="hover"
                                        viewport={{ once: true }}
                                        className="relative"
                                    >
                                        <div className="relative p-4 md:p-6 rounded-3xl bg-gradient-to-b from-white to-[#F9F7FC] border border-[#F0F0F0] shadow-lg hover:shadow-2xl transition-all duration-300">
                                            {/* Numéro de l'étape */}
                                            <div className="absolute -top-4 left-8 w-16 h-16 rounded-full bg-gradient-to-r from-white to-[#F9F7FC] border border-[#F0F0F0] flex items-center justify-center">
                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${stepItem.color} flex items-center justify-center text-white font-bold text-xl`}>
                                                    {stepItem.number}
                                                </div>
                                            </div>

                                            <div className="pt-8">
                                                <div className={`mb-6 ${stepItem.color.replace('from-', 'text-').split(' ')[0]}`}>
                                                    {stepItem.icon}
                                                </div>

                                                <h3 className="text-2xl font-semibold text-[#1C1C1C] mb-3">
                                                    {stepItem.title}
                                                </h3>

                                                <p className="text-lg font-medium text-[#4B4B4B] mb-4">
                                                    {stepItem.description}
                                                </p>

                                                <p className="text-[#666]">
                                                    {stepItem.details}
                                                </p>
                                            </div>

                                            {/* Indicateur d'étape active */}
                                            {step === stepItem.number && (
                                                <motion.div
                                                    layoutId="activeStep"
                                                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E]"
                                                    animate={{ scale: [1, 1.5, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Avantages */}
                <section className="md:py-8 px-4 md:px-6 bg-gradient-to-b from-[#F9F7FC] to-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-center mb-8 md:mb-5 md:mb-8"
                        >
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6">
                                Pourquoi choisir <span className="text-[#8E7AB5]">SferaLuna</span> ?
                            </h2>
                            <p className="text-xl text-[#666] max-w-3xl mx-auto">
                                Une expérience de rencontre repensée pour les femmes qui aiment les femmes
                            </p>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                        >
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    whileHover={{ y: -10, transition: { duration: 0.2 } }}
                                    className="group relative"
                                >
                                    <div className="relative p-4 md:p-6 rounded-2xl bg-white border border-[#F0F0F0] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                        {/* Fond gradient au hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F9F7FC] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className={`mb-6 ${benefit.color}`}>
                                            {benefit.icon}
                                        </div>

                                        <h3 className="text-xl font-semibold text-[#1C1C1C] mb-3">
                                            {benefit.title}
                                        </h3>

                                        <p className="text-[#666]">
                                            {benefit.description}
                                        </p>

                                        <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <CheckCircle className="text-[#8E7AB5]" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>


                {/* FAQ rapide */}
                <section className="md:py-8 px-4 md:px-6 bg-gradient-to-b from-white to-[#F9F7FC]">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-8 md:mb-5 md:mb-8"
                        >
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6">
                                Questions <span className="text-[#8E7AB5]">fréquentes</span>
                            </h2>
                            <p className="text-xl text-[#666] max-w-2xl mx-auto">
                                Tout ce que tu dois savoir avant de commencer
                            </p>
                        </motion.div>

                        <div className="space-y-6">
                            {[
                                {
                                    question: "L'inscription est-elle vraiment gratuite ?",
                                    answer: "Oui ! L'inscription est gratuite. Le compte gratuit est limité (5 likes/jour, 3 matchs, 10 messages/jour). Les plans payants à partir de 9,99€/mois lèvent toutes les limites."
                                },
                                {
                                    question: "Comment fonctionne le Circle of Six ?",
                                    answer: "Chaque semaine, notre algorithme te présente 6 profils qui correspondent à tes valeurs et intérêts. Tu peux interagir avec elles en toute sérénité."
                                },
                                {
                                    question: "Mes données sont-elles protégées ?",
                                    answer: "Absolument. Nous utilisons un chiffrement de bout en bout et te donnons un contrôle total sur ta visibilité et tes données."
                                },
                                {
                                    question: "Puis-je utiliser SferaLuna discrètement ?",
                                    answer: "Oui, le Mode Fantôme te permet de flouter tes photos et d'utiliser un pseudonyme. Tu contrôles qui te voit et quand."
                                }
                            ].map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-6 rounded-2xl bg-white border border-[#F0F0F0] hover:border-[#8E7AB5]/30 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-2 h-2 rounded-full bg-[#8E7AB5] mt-3" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-[#1C1C1C] mb-2">
                                                {faq.question}
                                            </h3>
                                            <p className="text-[#666]">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action final */}
                <section className="relative md:py-8 px-4 md:px-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

                    {/* Effets de fond */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
                    />

                    <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-10"
                        >
                            <h2 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-6">
                                Commence ton <span className="text-white">voyage</span> aujourd'hui
                            </h2>

                            <p className="text-xl opacity-90 max-w-2xl mx-auto">
                                Rejoins des milliers de femmes qui ont déjà trouvé leur communauté bienveillante.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link href="/auth?mode=register" className="group">
                                <button className="px-12 py-4 rounded-full bg-white text-[#8E7AB5] font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-3">
                                    <span>Créer mon compte gratuit</span>
                                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>

                            <Link href="/tarifs">
                                <button className="px-12 py-4 rounded-full border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300 group">
                                    <span className="flex items-center gap-3">
                                        Découvrir les options premium
                                        <Sparkles size={18} className="group-hover:animate-spin" />
                                    </span>
                                </button>
                            </Link>
                        </motion.div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 }}
                            className="mt-8 text-white/80"
                        >
                            <span className="font-semibold">Inscription gratuite</span> · Accès immédiat · Annulation à tout moment
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 }}
                            className="mt-12 flex flex-wrap justify-center gap-4 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} />
                                <span>Profils vérifiés manuellement</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} />
                                <span>Modération 24h/24</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle size={16} />
                                <span>Support dédié</span>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />

            <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
        </>
    );
}