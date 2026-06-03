'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Star, Zap, Users, Shield, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function TarifsPage() {
    const [selectedPlan, setSelectedPlan] = useState<string | null>('premium-monthly');

    const plans = [
        {
            id: 'free',
            name: "Gratuit",
            description: "Découvre SferaLuna à ton rythme",
            price: 0,
            color: "from-[#8E7AB5] to-[#D9B8FF]",
            icon: <Star className="w-8 h-8 text-white" />,
            features: [
                "Profil complet",
                "5 likes par jour",
                "3 matchs maximum",
                "Messagerie limitée (10 messages/jour)",
                "VibeSphere basique",
                "Communauté Luna",
                "Support par formulaire",
            ],
            cta: "Commencer gratuitement",
            ctaLink: "/auth?mode=register",
            popular: false
        },
        {
            id: 'essential-monthly',
            name: "Essentiel",
            description: "Pour aller plus loin dans tes rencontres",
            price: 9.99,
            color: "from-[#FF6B6B] to-[#FF8E8E]",
            icon: <Zap className="w-8 h-8 text-white" />,
            features: [
                "Tout du plan Gratuit",
                "Circle of Six hebdomadaire",
                "VibePlanner (3/mois)",
                "Filtres avancés",
                "Événements exclusifs",
                "Badge Essentiel",
                "Support prioritaire 5j/7",
            ],
            cta: "Choisir Essentiel",
            ctaLink: "/auth?mode=register",
            popular: false
        },
        {
            id: 'premium-monthly',
            name: "Premium",
            description: "L'expérience SferaLuna complète",
            price: 19.99,
            color: "from-[#9D4EDD] to-[#7B2CBF]",
            icon: <Crown className="w-8 h-8 text-white" />,
            features: [
                "Tout du plan Essentiel",
                "Mode Fantôme",
                "VibePlanner illimité",
                "Voir les visiteurs de ton profil",
                "VibeSphere avancé",
                "Filtres premium (distance, actif…)",
                "Badge Premium",
                "Support prioritaire 7j/7",
            ],
            cta: "Choisir Premium",
            ctaLink: "/auth?mode=register",
            popular: true
        },
        {
            id: 'elite-monthly',
            name: "Elite",
            description: "Pour les plus engagées",
            price: 34.99,
            color: "from-[#FFD166] to-[#FF9A3C]",
            icon: <Sparkles className="w-8 h-8 text-white" />,
            features: [
                "Tout du plan Premium",
                "Coaching VibeMentor mensuel",
                "Cercle privé VIP",
                "Accès anticipé aux nouvelles fonctionnalités",
                "Rencontres organisées exclusives",
                "Badge Elite",
                "Support dédié 7j/7",
            ],
            cta: "Choisir Elite",
            ctaLink: "/auth?mode=register",
            popular: false
        }
    ];

    const faqs = [
        {
            question: "Puis-je annuler à tout moment ?",
            answer: "Oui, tu peux annuler ton abonnement à tout moment depuis ton espace Mon Compte. Tu conserves l'accès premium jusqu'à la fin de la période payée."
        },
        {
            question: "Y a-t-il un engagement minimum ?",
            answer: "Non, aucun engagement. Les abonnements sont mensuels et tu peux annuler quand tu veux."
        },
        {
            question: "Comment changer de forfait ?",
            answer: "Tu peux changer de forfait à tout moment depuis Mon Compte → onglet Premium. La différence sera ajustée au prorata."
        },
        {
            question: "Proposez-vous des tarifs étudiants ?",
            answer: "Oui, nous avons une réduction de 30% pour les étudiantes. Contacte notre support avec ta carte étudiante."
        },
        {
            question: "Que se passe-t-il si j'annule mon abonnement ?",
            answer: "Ton compte revient automatiquement en version gratuite à la fin de la période payée. Tu ne perdras pas tes matches ni tes messages."
        },
        {
            question: "Les paiements sont-ils sécurisés ?",
            answer: "Oui, tous les paiements sont gérés par Stripe, leader mondial du paiement en ligne. Nous ne stockons jamais tes données bancaires."
        }
    ];

    return (
        <>
            <Header />

            <main className="min-h-screen bg-gradient-to-b from-[#F5F3F7] to-[#FFFFFF] text-[#1C1C1C]">
                {/* Hero Section */}
                <section className="relative pt-20 pb-8 md:pt-28 md:pb-12 px-4 md:px-6 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

                    <div className="relative z-10 max-w-6xl mx-auto text-center text-white">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl sm:text-3xl sm:text-5xl md:text-7xl font-bold mb-6"
                        >
                            Choisis ton aventure
                        </motion.h1>

                        <p className="text-base md:text-xl max-w-3xl mx-auto mb-8 opacity-90">
                            Une tarification transparente pour une expérience authentique
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield size={16} />
                                <span>Paiement sécurisé Stripe</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Zap size={16} />
                                <span>Annulation à tout moment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>Aucun engagement</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Plans */}
                <section className="py-6 md:py-8 px-4 md:px-6 overflow-visible">
                    <div className="max-w-7xl mx-auto">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6 overflow-visible">
                            {plans.map((plan, index) => (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative flex flex-col"
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 px-4 py-1 rounded-full bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white text-sm font-semibold whitespace-nowrap shadow-lg">
                                            Le plus populaire
                                        </div>
                                    )}

                                    <div className={`relative h-full rounded-3xl border-2 cursor-pointer transition-all flex flex-col ${plan.popular ? 'p-4 md:p-6 pt-10' : 'p-4 md:p-6'} ${
                                        plan.popular
                                            ? 'border-[#9D4EDD] bg-white shadow-2xl ring-2 ring-[#9D4EDD]/20'
                                            : selectedPlan === plan.id
                                                ? 'border-[#9D4EDD] shadow-2xl'
                                                : 'border-[#E8E0FF] bg-gradient-to-b from-white to-[#F9F7FC] hover:border-[#8E7AB5]/50'
                                    }`}>
                                        <div className="text-center mb-8">
                                            <div className={`inline-block p-3 rounded-2xl bg-gradient-to-r ${plan.color} mb-4`}>
                                                {plan.icon}
                                            </div>
                                            <h3 className="text-2xl font-bold text-[#1C1C1C] mb-2">
                                                {plan.name}
                                            </h3>
                                            <p className="text-[#666] mb-4 text-sm">{plan.description}</p>

                                            <div className="mb-4">
                                                <div className="text-5xl font-bold text-[#1C1C1C]">
                                                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toFixed(2)}€`}
                                                </div>
                                                <div className="text-[#666] text-sm">
                                                    {plan.price === 0 ? 'Pour toujours' : 'par mois'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-8 flex-1">
                                            {plan.features.map((feature, i) => (
                                                <div key={i} className="flex items-start gap-3">
                                                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                                                        plan.id === 'elite-monthly' ? 'text-[#FFD166]' :
                                                        plan.id === 'premium-monthly' ? 'text-[#9D4EDD]' :
                                                        plan.id === 'essential-monthly' ? 'text-[#FF6B6B]' :
                                                        'text-[#8E7AB5]'
                                                    }`} />
                                                    <span className={`text-sm ${feature.startsWith('Tout') ? 'font-semibold text-[#1C1C1C]' : 'text-[#666]'}`}>
                                                        {feature}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        <Link
                                            href={plan.ctaLink}
                                            className={`mt-auto block text-center px-6 py-3 rounded-full font-semibold transition-all text-sm ${
                                                plan.popular
                                                    ? 'bg-gradient-to-r from-[#9D4EDD] to-[#7B2CBF] text-white hover:shadow-xl'
                                                    : 'bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white hover:shadow-lg'
                                            }`}
                                        >
                                            {plan.cta}
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="mt-12 text-center text-[#666] text-sm">
                            <p>Tous les prix sont en euros TTC. Abonnements mensuels sans engagement.</p>
                        </div>
                    </div>
                </section>

                {/* Comparaison détaillée */}
                <section className="py-6 md:py-8 px-4 md:px-6 bg-gradient-to-b from-white to-[#F9F7FC]">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="text-2xl sm:text-4xl font-bold text-center text-[#1C1C1C] mb-5 md:mb-8">
                            Comparaison <span className="text-[#8E7AB5]">détaillée</span>
                        </h2>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-[#E8E0FF]">
                                        <th className="text-left py-4 text-lg font-semibold text-[#1C1C1C]">
                                            Fonctionnalité
                                        </th>
                                        {plans.map(plan => (
                                            <th key={plan.id} className="text-center py-4">
                                                <div className="font-semibold text-[#1C1C1C]">{plan.name}</div>
                                                <div className="text-sm text-[#666]">
                                                    {plan.price === 0 ? 'Gratuit' : `${plan.price.toFixed(2)}€/mois`}
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feature: "Likes par jour", values: ["5/jour", "Illimité", "Illimité", "Illimité"] },
                                        { feature: "Matchs simultanés", values: ["3 max", "Illimité", "Illimité", "Illimité"] },
                                        { feature: "Messagerie", values: ["10 msg/jour", "Illimitée", "Illimitée", "Illimitée"] },
                                        { feature: "Circle of Six", values: ["❌", "1/semaine", "1/semaine", "1/semaine"] },
                                        { feature: "VibePlanner", values: ["❌", "3/mois", "Illimité", "Illimité +"] },
                                        { feature: "Mode Fantôme", values: ["❌", "❌", "✅", "✅"] },
                                        { feature: "Visiteurs du profil", values: ["❌", "❌", "✅", "✅"] },
                                        { feature: "Filtres premium", values: ["❌", "Basiques", "Avancés", "Complets"] },
                                        { feature: "Coaching VibeMentor", values: ["❌", "❌", "❌", "✅ Mensuel"] },
                                        { feature: "Événements", values: ["Gratuits", "Exclusifs", "Exclusifs", "VIP"] },
                                        { feature: "Support", values: ["Formulaire", "5j/7", "7j/7", "Dédié 7j/7"] },
                                        { feature: "Badge", values: ["❌", "Essentiel", "Premium", "Elite"] },
                                    ].map((row, index) => (
                                        <tr key={index} className="border-b border-[#E8E0FF]">
                                            <td className="py-4 text-[#666]">{row.feature}</td>
                                            {row.values.map((value, i) => (
                                                <td key={i} className="text-center py-4">
                                                    <span className={`font-medium text-sm ${
                                                        value.includes('✅') ? 'text-green-600' :
                                                        value.includes('❌') ? 'text-red-400' :
                                                        'text-[#1C1C1C]'
                                                    }`}>
                                                        {value}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <section className="py-6 md:py-8 px-4 md:px-6">
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl sm:text-4xl font-bold text-center text-[#1C1C1C] mb-5 md:mb-8">
                            Questions <span className="text-[#8E7AB5]">fréquentes</span>
                        </h2>

                        <div className="space-y-6">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-6 rounded-2xl bg-white border border-[#F0F0F0] hover:border-[#8E7AB5]/30 transition-all"
                                >
                                    <h3 className="text-lg font-semibold text-[#1C1C1C] mb-3">
                                        {faq.question}
                                    </h3>
                                    <p className="text-[#666]">{faq.answer}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Garantie */}
                <section className="py-6 md:py-8 px-4 md:px-6 bg-gradient-to-b from-white to-[#F9F7FC]">
                    <div className="max-w-4xl mx-auto">
                        <div className="p-4 md:p-6 rounded-3xl bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white">
                            <div className="flex items-center gap-4 mb-6">
                                <Shield className="w-12 h-12" />
                                <div>
                                    <h3 className="text-2xl font-bold">Paiement sécurisé et sans surprise</h3>
                                    <p className="opacity-90">Géré par Stripe, annulation à tout moment</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5" />
                                    <span>Annulation à tout moment</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5" />
                                    <span>Données bancaires protégées</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5" />
                                    <span>Support 7j/7 (plans Elite)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="md:py-8 px-4 md:px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

                    <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-6">
                            Prête à <span className="text-white">vibrer</span> avec nous ?
                        </h2>

                        <p className="text-xl opacity-90 max-w-2xl mx-auto mb-10">
                            Rejoins des milliers de femmes qui ont déjà choisi SferaLuna
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/auth?mode=register"
                                className="px-6 sm:px-5 md:px-8 py-4 rounded-full bg-white text-[#8E7AB5] font-semibold text-base sm:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
                            >
                                <span>Commencer gratuitement</span>
                                <Sparkles />
                            </Link>

                            <Link
                                href="/guide"
                                className="px-6 sm:px-5 md:px-8 py-4 rounded-full border-2 border-white text-white font-semibold text-base sm:text-lg hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto"
                            >
                                <span>Lire le guide</span>
                                <ChevronRight />
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </>
    );
}
