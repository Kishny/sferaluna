'use client';

import { motion } from 'framer-motion';
import { Heart, Sparkles, Users, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function EquipePage() {
    return (
        <div className="min-h-screen bg-[#faf9ff]">
            <Header />
            <main className="pt-24 pb-16">
                {/* Hero */}
                <section className="max-w-4xl mx-auto px-4 text-center py-6 md:py-8 ">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Sparkles className="h-4 w-4" />
                            Notre équipe
                        </div>
                        <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6 leading-tight">
                            L'équipe SferaLuna se{' '}
                            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                dévoilera bientôt
                            </span>
                        </h1>
                        <p className="text-lg text-[#666] max-w-2xl mx-auto mb-10 leading-relaxed">
                            Nous travaillons avec passion pour construire la meilleure expérience de rencontres authentiques.
                            Notre équipe sera présentée très prochainement.
                        </p>
                    </motion.div>

                    {/* Illustration */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex justify-center gap-6 mb-8 md:mb-5 md:mb-8"
                    >
                        {['💜', '🌙', '✨', '💫', '🌸'].map((emoji, i) => (
                            <motion.div
                                key={i}
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                                className="text-4xl"
                            >
                                {emoji}
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Valeurs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="grid md:grid-cols-3 gap-6 mb-8 md:mb-5 md:mb-8"
                    >
                        {[
                            { icon: <Heart className="h-6 w-6" />, title: "Authenticité", desc: "Chaque décision est guidée par le souci de créer des connexions vraies." },
                            { icon: <Users className="h-6 w-6" />, title: "Sécurité", desc: "Un environnement sûr et bienveillant pour toutes nos utilisatrices." },
                            { icon: <Sparkles className="h-6 w-6" />, title: "Innovation", desc: "Des fonctionnalités pensées pour faciliter les vraies rencontres." },
                        ].map((val, i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-purple-50 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-purple-600 mb-4">
                                    {val.icon}
                                </div>
                                <h3 className="font-semibold text-[#1C1C1C] mb-2">{val.title}</h3>
                                <p className="text-sm text-[#666] leading-relaxed">{val.desc}</p>
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 md:p-6 border border-purple-100"
                    >
                        <h2 className="text-xl font-bold text-[#1C1C1C] mb-3">Envie de nous rejoindre ?</h2>
                        <p className="text-[#666] mb-6">
                            SferaLuna est un projet porté par une équipe passionnée. Si tu partages notre vision, écris-nous.
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
                        >
                            <Mail className="h-4 w-4" />
                            Nous contacter
                        </Link>
                    </motion.div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
