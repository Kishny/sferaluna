'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import {
    Heart,
    Shield,
    Users,
    Sparkles,
    Lock,
    Globe,
    Zap,
    Moon,
    ChevronRight,
    ChevronLeft,
    Star,
    MessageSquarePlus,
    CheckCircle,
    Clock,
} from 'lucide-react';

interface SiteStats { membres: number; matchs: number; messages: number; evenements: number; }
interface Testimonial { _id: string; authorName: string; age?: number; content: string; createdAt: string; }

function formatStat(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
    if (n === 0) return '—';
    return n.toString();
}

export default function ValeursPage() {
    const { data: session } = useSession();
    const sessionUser = session?.user as any;

    const [hoveredValue, setHoveredValue] = useState<number | null>(null);
    const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [testimonialIdx, setTestimonialIdx] = useState(0);

    // Formulaire témoignage
    const [showForm, setShowForm] = useState(false);
    const [formContent, setFormContent] = useState('');
    const [formAge, setFormAge] = useState('');
    const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        fetch('/api/stats').then(r => r.json()).then(d => { if (d.success) setSiteStats(d.stats); }).catch(() => {});
        fetch('/api/testimonials').then(r => r.json()).then(d => { if (d.success) setTestimonials(d.testimonials); }).catch(() => {});
    }, []);

    const handleTestimonialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormStatus('loading');
        setFormError('');
        try {
            const res = await fetch('/api/testimonials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: formContent,
                    age: formAge ? parseInt(formAge) : undefined,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setFormStatus('success');
                setFormContent('');
                setFormAge('');
            } else {
                setFormError(data.error || 'Une erreur est survenue.');
                setFormStatus('error');
            }
        } catch {
            setFormError('Une erreur est survenue. Réessaie.');
            setFormStatus('error');
        }
    };
    const { scrollYProgress } = useScroll();

    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    const values = [
        {
            icon: <Sparkles className="w-8 h-8" />,
            title: "✨ Authenticité Radicale",
            description: "Être soi, sans masque. Des profils vrais, des intentions claires.",
            details: "Nous encourageons chaque membre à montrer sa véritable nature, sans filtres ni artifices. C'est l'essence même de nos connexions.",
            gradient: "from-[#FFD166] to-[#FF9A3C]",
            color: "text-[#FF9A3C]",
            features: ["Profils vérifiés", "Intentions transparentes", "Communication honnête"]
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "🔒 Sécurité Totale",
            description: "Contrôle total de ta visibilité, de ton rythme et de ton intimité.",
            details: "Ton espace, tes règles. Modération 24/7, données cryptées et outils de discrétion avancés.",
            gradient: "from-[#8E7AB5] to-[#6B5F8E]",
            color: "text-[#8E7AB5]",
            features: ["Mode Fantôme", "Photos floutées", "Pseudonymes protégés"]
        },
        {
            icon: <Globe className="w-8 h-8" />,
            title: "🌈 Inclusivité Absolue",
            description: "Toutes les femmes, toutes les relations, toutes les histoires.",
            details: "Un espace où chaque identité est respectée. Lesbienne, bi, pan, trans, queer... toutes sont les bienvenues.",
            gradient: "from-[#FF6B6B] to-[#FF8E8E]",
            color: "text-[#FF6B6B]",
            features: ["Communauté LGBTQ+", "Espaces sûrs", "Ressources éducatives"]
        },
        {
            icon: <Heart className="w-8 h-8" />,
            title: "💜 Bienveillance Active",
            description: "Une communauté qui prend soin les unes des autres.",
            details: "Modération proactive, signalement simplifié et culture du consentement avant tout.",
            gradient: "from-[#D9B8FF] to-[#B5A3D9]",
            color: "text-[#D9B8FF]",
            features: ["Modération 24/7", "Culture du consentement", "Support communautaire"]
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "⚡ Évolution Personnelle",
            description: "Grandir ensemble à travers des expériences enrichissantes.",
            details: "Ateliers, événements et ressources pour ton développement personnel et relationnel.",
            gradient: "from-[#4ECDC4] to-[#44A08D]",
            color: "text-[#4ECDC4]",
            features: ["Ateliers mensuels", "Ressources éducatives", "Événements exclusifs"]
        },
        {
            icon: <Moon className="w-8 h-8" />,
            title: "🌙 Spiritualité Connectée",
            description: "Renouer avec soi-même et les autres de manière profonde.",
            details: "Cercle de parole, méditations guidées et rituels pour une connexion authentique.",
            gradient: "from-[#9D4EDD] to-[#7B2CBF]",
            color: "text-[#9D4EDD]",
            features: ["Cercles de parole", "Méditations", "Rituels communautaires"]
        }
    ];

    const principles = [
        "Zéro tolérance pour le harcèlement",
        "Respect des limites personnelles",
        "Confidentialité garantie",
        "Écoute active et empathie",
        "Célébration de la diversité",
        "Apprentissage continu"
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
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
            y: -15,
            scale: 1.03,
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
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#FDF7FA]/80 via-[#F5F0FF]/60 to-[#E8DFFF]/40" />

                        {/* Orbes décoratives */}
                        <motion.div
                            animate={{
                                x: [0, 100, 0],
                                y: [0, 50, 0],
                                rotate: [0, 180, 360]
                            }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 rounded-full blur-3xl"
                        />
                        <motion.div
                            animate={{
                                x: [0, -100, 0],
                                y: [0, -50, 0],
                                rotate: [360, 180, 0]
                            }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-[#FDF7FA]/20 to-[#8E7AB5]/10 rounded-full blur-3xl"
                        />
                    </motion.div>

                    <div className="relative z-10 max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center"
                        >
                            {/* Badge */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 border border-[#8E7AB5]/20 mb-8"
                            >
                                <div className="w-2 h-2 rounded-full bg-[#8E7AB5] animate-pulse" />
                                <span className="text-sm font-medium text-[#5B4B8A]">
                                    L'ADN de SferaLuna
                                </span>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6"
                            >
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF]">
                                    Nos valeurs
                                </span>
                                <br />
                                <span className="text-2xl sm:text-4xl md:text-6xl text-[#1C1C1C] font-light">
                                    fondamentales
                                </span>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="text-base md:text-xl text-[#4B4B4B] max-w-3xl mx-auto mb-8 leading-relaxed"
                            >
                                SferaLuna est née d'un besoin simple : créer un espace{' '}
                                <span className="font-semibold text-[#8E7AB5]">sûr, doux et libre</span>,
                                où chaque femme peut explorer ses désirs et ses connexions sans pression.
                            </motion.p>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.8 }}
                                className="text-lg text-[#666] max-w-2xl mx-auto"
                            >
                                Notre mission est de redéfinir la manière dont les femmes qui aiment les femmes se rencontrent, grandissent et s'épanouissent ensemble.
                            </motion.p>
                        </motion.div>
                    </div>
                </section>

                {/* Nos Principes */}
                <section className="py-6 md:py-8 px-4 md:px-6 bg-white">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-center mb-5 md:mb-8"
                        >
                            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-4">
                                Nos <span className="text-[#8E7AB5]">principes</span> directeurs
                            </h2>
                            <p className="text-[#666] max-w-2xl mx-auto">
                                Les règles d'or qui guident chaque interaction sur notre plateforme
                            </p>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        >
                            {principles.map((principle, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    whileHover={{ scale: 1.05 }}
                                    className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-[#F9F7FC] to-white border border-[#F0F0F0] hover:border-[#8E7AB5]/30 transition-all"
                                >
                                    <div className="w-2 h-2 rounded-full bg-[#8E7AB5]" />
                                    <span className="text-[#1C1C1C]">{principle}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Valeurs détaillées */}
                <section className="md:py-8 px-4 md:px-6 bg-gradient-to-b from-white to-[#F9F7FC]">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="text-center mb-8 md:mb-5 md:mb-8"
                        >
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6">
                                Les piliers de notre <span className="text-[#8E7AB5]">communauté</span>
                            </h2>
                            <p className="text-xl text-[#666] max-w-3xl mx-auto">
                                Six valeurs fondamentales qui définissent l'expérience SferaLuna
                            </p>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {values.map((value, index) => (
                                <motion.div
                                    key={index}
                                    custom={index}
                                    variants={cardVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    whileHover="hover"
                                    viewport={{ once: true }}
                                    onMouseEnter={() => setHoveredValue(index)}
                                    onMouseLeave={() => setHoveredValue(null)}
                                    className="relative group"
                                >
                                    <div className="relative h-full p-4 md:p-6 rounded-3xl bg-white border border-[#F0F0F0] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                                        {/* Fond gradient animé */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                                        {/* Icone avec effet */}
                                        <motion.div
                                            className={`mb-6 ${value.color}`}
                                            animate={{
                                                scale: hoveredValue === index ? [1, 1.2, 1] : 1,
                                                rotate: hoveredValue === index ? [0, 10, -10, 0] : 0
                                            }}
                                            transition={{ duration: 0.5 }}
                                        >
                                            {value.icon}
                                        </motion.div>

                                        <h3 className="text-2xl font-semibold text-[#1C1C1C] mb-4">
                                            {value.title}
                                        </h3>

                                        <p className="text-lg font-medium text-[#4B4B4B] mb-4">
                                            {value.description}
                                        </p>

                                        <p className="text-[#666] mb-6">
                                            {value.details}
                                        </p>

                                        {/* Liste de caractéristiques */}
                                        <div className="space-y-2">
                                            {value.features.map((feature, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <motion.div
                                                        animate={{
                                                            x: hoveredValue === index ? [0, 5, 0] : 0,
                                                            opacity: hoveredValue === index ? 1 : 0.7
                                                        }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]"
                                                    />
                                                    <span className="text-sm text-[#666]">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Chiffres clés */}
                <section className="py-4 md:py-14 px-4 md:px-6 bg-white">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-8 md:mb-5 md:mb-8"
                        >
                            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-4">
                                Notre impact en <span className="text-[#8E7AB5]">chiffres</span>
                            </h2>
                            <p className="text-[#666] max-w-2xl mx-auto">
                                Des résultats concrets qui témoignent de notre engagement
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: siteStats ? formatStat(siteStats.membres) : '…', label: "Membres inscrites", icon: "👩‍❤️‍👩" },
                                { value: siteStats ? formatStat(siteStats.matchs) : '…', label: "Matchs créés", icon: "💜" },
                                { value: "24/7", label: "Modération active", icon: "🛡️" },
                                { value: siteStats ? formatStat(siteStats.messages) : '…', label: "Messages échangés", icon: "💞" },
                            ].map((stat, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="text-center"
                                >
                                    <div className="text-4xl mb-2">{stat.icon}</div>
                                    <div className="text-4xl font-bold text-[#5B4B8A] mb-2">{stat.value}</div>
                                    <div className="text-[#666]">{stat.label}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Témoignages */}
                <section className="md:py-8 px-4 md:px-6 bg-gradient-to-br from-[#F9F7FC] to-[#F0ECFF]">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-10"
                        >
                            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-3">
                                Elles parlent de <span className="text-[#8E7AB5]">SferaLuna</span>
                            </h2>
                            <p className="text-[#666]">Des vrais mots, de vraies femmes</p>
                        </motion.div>

                        {testimonials.length > 0 ? (
                            <div className="relative">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={testimonialIdx}
                                        initial={{ opacity: 0, x: 40 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -40 }}
                                        transition={{ duration: 0.35 }}
                                        className="relative p-4 md:p-6 md:p-5 md:p-4 md:p-6 rounded-3xl bg-white border border-[#E8E0FF] shadow-xl"
                                    >
                                        <div className="absolute top-6 left-6 text-6xl text-[#8E7AB5]/15 select-none">"</div>
                                        <div className="absolute bottom-6 right-6 text-6xl text-[#8E7AB5]/15 select-none">"</div>

                                        <p className="relative z-10 text-base md:text-xl text-[#1C1C1C] mb-8 leading-relaxed font-light">
                                            « {testimonials[testimonialIdx].content} »
                                        </p>

                                        <div className="relative z-10 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] flex items-center justify-center text-white font-bold text-lg shrink-0">
                                                {testimonials[testimonialIdx].authorName[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-[#1C1C1C]">
                                                    {testimonials[testimonialIdx].authorName}
                                                    {testimonials[testimonialIdx].age ? `, ${testimonials[testimonialIdx].age} ans` : ''}
                                                </div>
                                                <div className="text-sm text-[#666]">Membre SferaLuna</div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {testimonials.length > 1 && (
                                    <div className="flex items-center justify-center gap-4 mt-6">
                                        <button
                                            onClick={() => setTestimonialIdx(i => (i - 1 + testimonials.length) % testimonials.length)}
                                            className="p-2 rounded-full bg-white border border-[#E8E0FF] hover:border-[#8E7AB5] text-[#8E7AB5] transition-colors"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <div className="flex gap-2">
                                            {testimonials.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setTestimonialIdx(i)}
                                                    className={`w-2 h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-[#8E7AB5] w-6' : 'bg-[#D9B8FF]'}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setTestimonialIdx(i => (i + 1) % testimonials.length)}
                                            className="p-2 rounded-full bg-white border border-[#E8E0FF] hover:border-[#8E7AB5] text-[#8E7AB5] transition-colors"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-center py-5 md:py-8 px-4 md:px-6 rounded-3xl bg-white border border-[#E8E0FF] border-dashed"
                            >
                                <div className="text-5xl mb-4">💜</div>
                                <p className="text-lg font-medium text-[#5B4B8A] mb-2">Les premiers témoignages arrivent bientôt</p>
                                <p className="text-[#666] text-sm">Sois parmi les premières à partager ton expérience.</p>
                            </motion.div>
                        )}

                        {/* Formulaire de soumission */}
                        {sessionUser?.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="mt-8"
                            >
                                {!showForm && formStatus !== 'success' && (
                                    <div className="text-center">
                                        <button
                                            onClick={() => setShowForm(true)}
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-[#E8E0FF] hover:border-[#8E7AB5] text-[#5B4B8A] font-medium transition-all hover:shadow-md"
                                        >
                                            <MessageSquarePlus size={16} />
                                            Partager mon expérience
                                        </button>
                                    </div>
                                )}

                                {formStatus === 'success' && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700"
                                    >
                                        <CheckCircle size={18} />
                                        <span className="font-medium">Merci ! Ton témoignage sera visible après validation. 💜</span>
                                    </motion.div>
                                )}

                                {showForm && formStatus !== 'success' && (
                                    <motion.form
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onSubmit={handleTestimonialSubmit}
                                        className="bg-white rounded-3xl border border-[#E8E0FF] p-6 shadow-lg"
                                    >
                                        <h3 className="font-semibold text-[#5B4B8A] mb-4 flex items-center gap-2">
                                            <MessageSquarePlus size={18} />
                                            Partage ton expérience
                                        </h3>
                                        <textarea
                                            value={formContent}
                                            onChange={e => setFormContent(e.target.value)}
                                            placeholder="Raconte-nous comment SferaLuna a changé quelque chose pour toi… (20 à 500 caractères)"
                                            rows={4}
                                            maxLength={500}
                                            className="w-full px-4 py-3 rounded-xl border border-[#E8E0FF] focus:border-[#8E7AB5] focus:outline-none focus:ring-2 focus:ring-[#8E7AB5]/20 text-[#1C1C1C] placeholder-[#999] resize-none text-sm mb-1"
                                        />
                                        <p className="text-xs text-[#999] mb-4 text-right">{formContent.length}/500</p>
                                        <div className="flex items-center gap-3 mb-4">
                                            <input
                                                type="number"
                                                value={formAge}
                                                onChange={e => setFormAge(e.target.value)}
                                                placeholder="Ton âge (optionnel)"
                                                min={18} max={99}
                                                className="w-44 px-4 py-2 rounded-xl border border-[#E8E0FF] focus:border-[#8E7AB5] focus:outline-none text-sm text-[#1C1C1C] placeholder-[#999]"
                                            />
                                            <div className="flex items-center gap-1 text-xs text-[#999]">
                                                <Clock size={12} />
                                                Visible après validation par l'équipe
                                            </div>
                                        </div>
                                        {formStatus === 'error' && (
                                            <p className="text-sm text-red-500 mb-3">{formError}</p>
                                        )}
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={formStatus === 'loading' || formContent.trim().length < 20}
                                                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50"
                                            >
                                                {formStatus === 'loading' ? 'Envoi…' : 'Envoyer'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setShowForm(false); setFormError(''); setFormStatus('idle'); }}
                                                className="px-6 py-2.5 rounded-full border border-[#E8E0FF] text-[#666] text-sm hover:border-[#8E7AB5] transition-all"
                                            >
                                                Annuler
                                            </button>
                                        </div>
                                    </motion.form>
                                )}
                            </motion.div>
                        )}

                        {!sessionUser?.id && (
                            <p className="text-center mt-6 text-sm text-[#999]">
                                <Link href="/auth?mode=login" className="text-[#8E7AB5] underline underline-offset-2 hover:text-[#5B4B8A]">Connecte-toi</Link> pour partager ton expérience.
                            </p>
                        )}
                    </div>
                </section>

                {/* Call to Action */}
                <section className="md:py-8 px-4 md:px-6 relative overflow-hidden">
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
                            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6">
                                Prête à rejoindre une communauté qui te <span className="text-white">ressemble</span> ?
                            </h2>

                            <p className="text-xl opacity-90 max-w-2xl mx-auto">
                                Rejoins des milliers de femmes qui ont déjà trouvé leur place dans un espace authentique et bienveillant.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                        >
                            <Link href="/fonctionnalites" className="group">
                                <button className="px-5 md:px-8 py-4 rounded-full bg-white text-[#8E7AB5] font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-3">
                                    <span>Découvrir les fonctionnalités</span>
                                    <span className="group-hover:translate-x-1 transition-transform">🚀</span>
                                </button>
                            </Link>

                            <Link href="/auth?mode=register">
                                <button className="px-5 md:px-8 py-4 rounded-full border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300 group">
                                    <span className="flex items-center gap-3">
                                        Créer mon compte gratuit
                                        <span className="group-hover:rotate-180 transition-transform duration-500">✨</span>
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
                            <span className="font-semibold">Sans engagement</span> · 30 jours gratuits · Aucune carte requise
                        </motion.p>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}