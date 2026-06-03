'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Sparkles, Users, MessageCircle, Heart, Shield, Star, Zap, Moon } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function GuidePage() {
    const [openSections, setOpenSections] = useState<number[]>([0]);

    const toggleSection = (index: number) => {
        setOpenSections(prev =>
            prev.includes(index)
                ? prev.filter(i => i !== index)
                : [...prev, index]
        );
    };

    const steps = [
        {
            title: "1. Création de ton profil Luna",
            icon: <Sparkles className="w-6 h-6" />,
            content: "Commence par partager ce qui te définit vraiment. Ton profil Luna est plus qu'une photo : c'est l'expression de ta vibe intérieure.",
            details: [
                "Ajoute des photos qui te représentent authentiquement",
                "Partage tes intérêts, passions et valeurs",
                "Définis ce que tu recherches sur SferaLuna",
                "Configure tes préférences de confidentialité"
            ],
            color: "from-[#8E7AB5] to-[#D9B8FF]",
            duration: "5-10 minutes"
        },
        {
            title: "2. Découverte du Circle of Six",
            icon: <Users className="w-6 h-6" />,
            content: "Chaque semaine, notre algorithme te présente 6 femmes qui partagent tes valeurs et intérêts.",
            details: [
                "Reçois 6 suggestions personnalisées chaque dimanche",
                "Chaque profil est pré-sélectionné selon tes critères",
                "Prends ton temps pour découvrir chaque personne",
                "Pas de pression : tu décides du rythme"
            ],
            color: "from-[#FF6B6B] to-[#FF8E8E]",
            duration: "À ton rythme"
        },
        {
            title: "3. Personnalisation de ton VibeSphere",
            icon: <Moon className="w-6 h-6" />,
            content: "Crée ton espace émotionnel unique pour exprimer ton humeur du jour.",
            details: [
                "Choisis ta playlist Luna personnalisée",
                "Sélectionne tes couleurs et ambiance préférées",
                "Partage tes humeurs avec des avatars expressifs",
                "Utilise le journal émotionnel pour suivre ton évolution"
            ],
            color: "from-[#4ECDC4] to-[#44A08D]",
            duration: "Continuel"
        },
        {
            title: "4. Premières interactions",
            icon: <MessageCircle className="w-6 h-6" />,
            content: "Engage la conversation de manière authentique et bienveillante.",
            details: [
                "Utilise nos prompts de conversation pour briser la glace",
                "Partage tes intérêts communs pour créer un lien",
                "Propose un rendez-vous VibePlanner créatif",
                "Respecte toujours les limites et le consentement"
            ],
            color: "from-[#FFD166] to-[#FF9A3C]",
            duration: "Quand tu te sens prête"
        },
        {
            title: "5. Participation aux événements Luna",
            icon: <Star className="w-6 h-6" />,
            content: "Rejoins notre communauté lors d'événements exclusifs et enrichissants.",
            details: [
                "Participe aux LunaGather en ligne ou en présentiel",
                "Rejoins des ateliers thématiques (écriture, art, méditation)",
                "Assiste à des conférences sur des sujets LGBTQ+",
                "Rencontre d'autres membres lors de soirées détente"
            ],
            color: "from-[#9D4EDD] to-[#7B2CBF]",
            duration: "Selon tes envies"
        }
    ];

    const faqs = [
        {
            question: "Combien de temps faut-il pour commencer à rencontrer des personnes ?",
            answer: "La plupart de nos membres font leur première connexion significative dans les 48h après avoir complété leur profil. Le Circle of Six te présente des suggestions chaque semaine, donc tu as toujours de nouvelles opportunités."
        },
        {
            question: "Dois-je révéler mon identité réelle ?",
            answer: "Non. Tu as le contrôle total sur ton anonymat. Le Mode Fantôme te permet d'utiliser un pseudonyme, de flouter tes photos et de ne révéler ton identité que quand tu le décides."
        },
        {
            question: "Comment fonctionne la modération sur SferaLuna ?",
            answer: "Notre équipe de modération travaille 24h/24 pour garantir la sécurité de tous. Nous vérifions manuellement chaque profil, surveillons les interactions et agissons immédiatement en cas de signalement."
        },
        {
            question: "Puis-je utiliser SferaLuna si je suis en couple ?",
            answer: "Absolument. SferaLuna accueille toutes les femmes, quelle que soit leur situation amoureuse. Que tu cherches des amitiés, des relations polyamoureuses ou simplement à élargir ton cercle social, tu es la bienvenue."
        },
        {
            question: "Comment gérer les rencontres qui ne correspondent pas à mes attentes ?",
            answer: "Tu peux à tout moment utiliser la fonctionnalité 'Pause' pour prendre du recul, ajuster tes préférences ou simplement faire une pause. Notre algorithme apprend de tes retours pour améliorer tes suggestions."
        }
    ];

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gradient-to-b from-[#F5F3F7] to-[#FFFFFF] text-[#1C1C1C] overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-8 md:pt-28 md:pb-12 px-4 md:px-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

                    <div className="relative z-10 max-w-6xl mx-auto text-center text-white">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl sm:text-5xl md:text-7xl font-bold mb-6"
                        >
                            Guide du débutant
                        </motion.h1>

                        <p className="text-base md:text-xl max-w-3xl mx-auto mb-8 opacity-90">
                            Ton parcours étape par étape pour créer des connexions authentiques sur SferaLuna
                        </p>

                        <div className="flex items-center justify-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                <span>Temps estimé : 30 min de lecture</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-white/50" />
                            <div className="flex items-center gap-2">
                                <Sparkles size={14} />
                                <span>Niveau : Débutant</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Introduction */}
                <section className="py-6 md:py-8 px-4 md:px-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="p-4 md:p-6 rounded-3xl bg-gradient-to-r from-[#F9F7FC] to-white border border-[#E8E0FF]">
                            <h2 className="text-3xl font-bold text-[#5B4B8A] mb-4">
                                ✨ Bienvenue dans l'univers Luna
                            </h2>
                            <p className="text-lg text-[#666] mb-6">
                                Ce guide est conçu pour t'accompagner dans tes premiers pas sur SferaLuna.
                                Nous croyons que les meilleures connexions naissent d'une expérience sereine
                                et bien accompagnée.
                            </p>
                            <div className="flex items-center gap-2 text-[#8E7AB5]">
                                <Shield size={18} />
                                <span className="font-medium">Conseil pro : Prends ton temps et fais les choses à ton rythme.</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Étapes détaillées */}
                <section className="py-6 md:py-8 px-4 md:px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-5 md:mb-8">
                            Ton parcours en <span className="text-[#8E7AB5]">5 étapes</span>
                        </h2>

                        <div className="space-y-4 md:space-y-6">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative"
                                >
                                    <div className="flex flex-col lg:flex-row gap-8 p-4 md:p-6 rounded-3xl bg-white border border-[#F0F0F0] shadow-lg hover:shadow-xl transition-shadow">
                                        {/* Numéro et icône */}
                                        <div className="lg:w-1/4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center text-white font-bold text-xl`}>
                                                    {index + 1}
                                                </div>
                                                <div className="lg:hidden">
                                                    <h3 className="text-xl font-semibold text-[#1C1C1C]">{step.title}</h3>
                                                    <div className="flex items-center gap-2 mt-2 text-sm text-[#666]">
                                                        <Zap size={14} />
                                                        <span>{step.duration}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-[#8E7AB5]">
                                                {step.icon}
                                            </div>
                                        </div>

                                        {/* Contenu */}
                                        <div className="lg:w-3/4">
                                            <div className="hidden lg:block">
                                                <h3 className="text-2xl font-semibold text-[#1C1C1C] mb-2">{step.title}</h3>
                                                <div className="flex items-center gap-2 mb-4 text-[#666]">
                                                    <Zap size={14} />
                                                    <span>{step.duration}</span>
                                                </div>
                                            </div>

                                            <p className="text-lg text-[#4B4B4B] mb-6">{step.content}</p>

                                            <div className="space-y-3">
                                                {step.details.map((detail, i) => (
                                                    <div key={i} className="flex items-start gap-3">
                                                        <ChevronRight size={18} className="text-[#8E7AB5] mt-1 flex-shrink-0" />
                                                        <span className="text-[#666]">{detail}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {index === 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 1 }}
                                                    className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#8E7AB5]/10 to-[#D9B8FF]/10 border border-[#8E7AB5]/20"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Heart size={18} className="text-[#8E7AB5]" />
                                                        <span className="text-[#5B4B8A] font-medium">
                                                            Astuce : Sois toi-même ! Les profils authentiques reçoivent 3x plus de réponses.
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ligne de connexion entre les étapes */}
                                    {index < steps.length - 1 && (
                                        <div className="hidden lg:block absolute left-1/4 top-full w-0.5 h-8 bg-gradient-to-b from-[#8E7AB5] to-transparent ml-6" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ Interactive */}
                <section className="py-6 md:py-8 px-4 md:px-6 bg-gradient-to-b from-white to-[#F9F7FC]">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-5 md:mb-8">
                            Questions <span className="text-[#8E7AB5]">fréquentes</span>
                        </h2>

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <button
                                        onClick={() => toggleSection(index)}
                                        className="w-full text-left p-6 rounded-2xl bg-white border border-[#F0F0F0] hover:border-[#8E7AB5]/30 transition-all flex justify-between items-center"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] flex items-center justify-center text-white font-bold">
                                                ?
                                            </div>
                                            <h3 className="text-lg font-semibold text-[#1C1C1C]">
                                                {faq.question}
                                            </h3>
                                        </div>
                                        <ChevronDown className={`transition-transform ${openSections.includes(index) ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {openSections.includes(index) && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="p-6 pt-4 bg-white/50 rounded-b-2xl border border-t-0 border-[#F0F0F0]">
                                                    <p className="text-[#666]">{faq.answer}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Conseils de la communauté */}
                <section className="py-6 md:py-8 px-4 md:px-6">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-4xl font-bold text-center text-[#1C1C1C] mb-5 md:mb-8">
                            Conseils de la <span className="text-[#8E7AB5]">communauté</span>
                        </h2>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    tip: "Prends le temps de remplir ton profil à 100%",
                                    details: "Un profil complet avec tes vraies passions attire des connexions bien plus alignées avec toi.",
                                    author: "Conseil de la communauté"
                                },
                                {
                                    tip: "Utilise le Mode Fantôme pour commencer en douceur",
                                    details: "Cela permet de s'habituer à la plateforme sans pression et de révéler ton identité quand tu te sens prête.",
                                    author: "Conseil de la communauté"
                                },
                                {
                                    tip: "Participe aux événements pour rencontrer plusieurs personnes à la fois",
                                    details: "C'est souvent moins intimidant que les échanges en tête-à-tête, et l'ambiance est toujours bienveillante.",
                                    author: "Conseil de la communauté"
                                }
                            ].map((tip, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.2 }}
                                    className="p-4 md:p-6 rounded-3xl bg-gradient-to-b from-white to-[#F9F7FC] border border-[#E8E0FF]"
                                >
                                    <div className="text-4xl mb-4">💡</div>
                                    <h3 className="text-xl font-semibold text-[#1C1C1C] mb-3">
                                        {tip.tip}
                                    </h3>
                                    <p className="text-[#666] mb-6">{tip.details}</p>
                                    <div className="text-sm text-[#8E7AB5] font-medium">
                                        — {tip.author}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="md:py-8 px-4 md:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

                    <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6">
                            Prête à commencer ton <span className="text-white">voyage</span> ?
                        </h2>

                        <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
                            Rejoins des milliers de femmes qui ont déjà trouvé des connexions authentiques grâce à ce guide.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a
                                href="/auth?mode=register"
                                className="px-5 md:px-8 py-4 rounded-full bg-white text-[#8E7AB5] font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                <span>Commencer maintenant</span>
                                <Sparkles />
                            </a>

                            <a
                                href="/faq"
                                className="px-5 md:px-8 py-4 rounded-full border-2 border-white text-white font-semibold text-lg hover:bg-white/10 transition-all duration-300"
                            >
                                Voir toutes les FAQs
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}