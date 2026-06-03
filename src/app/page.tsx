'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import HexagonSix from '@/components/icons/HexagonSix';

interface SiteStats {
  membres: number;
  matchs: number;
  messages: number;
  evenements: number;
}

function formatStat(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K+';
  if (n === 0) return '—';
  return n.toString();
}

export default function Home() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then((d) => { if (d.success) setSiteStats(d.stats); })
      .catch(() => {});
  }, []);

  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const parallaxY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  useEffect(() => {
    const updateScrollProgress = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.scrollY / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };

    window.addEventListener('scroll', updateScrollProgress);
    return () => window.removeEventListener('scroll', updateScrollProgress);
  }, []);

  const features = [
    {
      icon: <HexagonSix size={48} />,
      title: 'Circle of Six',
      description: 'Des liens choisis, pas des milliers de swipes.',
      gradient: 'from-[#8E7AB5] to-[#D9B8FF]',
      link: '/circle'
    },
    {
      icon: '👻',
      title: 'Mode Fantôme',
      description: 'Discrétion assurée, photos floutées, pseudonymes.',
      gradient: 'from-[#7A6AA4] to-[#9B87C5]',
      link: '/mode-fantome'
    },
    {
      icon: '🌌',
      title: 'VibeSphere immersif',
      description: 'Exprime ta vibe dans ton espace personnalisé.',
      gradient: 'from-[#5B4B8A] to-[#8E7AB5]',
      link: '/vibesphere'
    },
    {
      icon: '💡',
      title: 'VibePlanner',
      description: 'Des idées de rendez-vous qui vous rassemblent.',
      gradient: 'from-[#8E7AB5] to-[#B5A3D9]',
      link: '/vibeplanner'
    },
    {
      icon: '🎉',
      title: 'Événements LunaGather',
      description: 'Participe à des moments inoubliables.',
      gradient: 'from-[#D9B8FF] to-[#8E7AB5]',
      link: '/evenements'
    },
    {
      icon: '🧠',
      title: 'Coaching VibeMentor',
      description: 'Sois guidée avec bienveillance et expertise.',
      gradient: 'from-[#7A6AA4] to-[#5B4B8A]',
      link: '/vibementor'
    }
  ];

  const values = [
    {
      title: '✨ Authenticité',
      description: 'Des rencontres qui ont du sens.',
      details: 'Pas de filtres, pas de jeu. Juste des femmes qui cherchent du vrai.'
    },
    {
      title: '🔒 Sécurité',
      description: 'Un espace pensé pour ta tranquillité.',
      details: 'Modération stricte, vérification manuelle, données cryptées.'
    },
    {
      title: '🌈 Inclusivité',
      description: 'Toutes les femmes, toutes les histoires.',
      details: 'Que tu sois hétérosexuelle, lesbienne, bisexuelle, pansexuelle ou en questionnement.'
    },
    {
      title: '💜 Bienveillance',
      description: 'Une communauté qui prend soin.',
      details: 'Zéro tolérance pour le harcèlement ou les jugements.'
    }
  ];

  return (
    <>
      <Header />

      {/* Barre de progression */}
      <motion.div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] z-50"
        style={{ width: `${scrollProgress}%` }}
      />

      <main className="pt-20 bg-gradient-to-b from-[#F5F3F7] to-[#FFFFFF] text-[#1C1C1C] overflow-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[50vh] md:min-h-[70vh] flex items-center justify-center px-4 md:px-6 overflow-hidden">
          {/* Fond animé */}
          <motion.div
            className="absolute inset-0"
            style={{ y: parallaxY, opacity: heroOpacity }}
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

            {/* Motif de fond discret */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%238E7AB5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }} />
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 max-w-6xl mx-auto text-center"
            style={{ scale: heroScale }}
          >
            {/* Badge élégant */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-[#8E7AB5]/20 mb-8"
            >
              <div className="w-2 h-2 rounded-full bg-[#8E7AB5] animate-pulse" />
              <span className="text-sm font-medium text-[#5B4B8A]">
                ✨ Plateforme exclusive WLW
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#5B4B8A] via-[#8E7AB5] to-[#D9B8FF]">
                Rencontrer au féminin,
              </span>
              <br />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-[#1C1C1C]"
              >
                librement.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 text-xl md:text-2xl text-[#4B4B4B] max-w-3xl mx-auto leading-relaxed font-light"
            >
              SferaLuna est une <span className="font-semibold text-[#8E7AB5]">oasis pour les femmes qui aiment les femmes</span>. Que tu sois célibataire, en couple, mariée ou en questionnement, ici tu peux explorer en toute sécurité des relations sincères, sensuelles ou spirituelles.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-4 text-lg text-[#666] max-w-2xl mx-auto"
            >
              Sans jugements. Sans pression. Juste toi, et ta vibe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/auth?mode=register" className="group relative">
                <button className="relative px-6 sm:px-5 md:px-8 py-4 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden w-full sm:w-auto">
                  <span className="relative z-10 flex items-center gap-3">
                    Rejoindre SferaLuna
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="group-hover:scale-110 transition-transform"
                    >
                      ✨
                    </motion.span>
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </button>
              </Link>

              <Link href="/explorer">
                <button className="group px-6 sm:px-5 md:px-8 py-4 rounded-full border-2 border-[#8E7AB5] text-[#8E7AB5] font-semibold text-base sm:text-lg hover:bg-[#8E7AB5] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto">
                  Explorer librement
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </Link>
            </motion.div>

            {/* Statistiques dynamiques */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
              className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
            >
              {[
                { value: siteStats ? formatStat(siteStats.membres) : '…', label: 'Membres inscrites' },
                { value: siteStats ? formatStat(siteStats.matchs) : '…', label: 'Matchs créés' },
                { value: siteStats ? formatStat(siteStats.messages) : '…', label: 'Messages échangés' },
                { value: siteStats ? formatStat(siteStats.evenements) : '…', label: 'Événements Luna' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-[#5B4B8A]">{stat.value}</div>
                  <div className="text-sm text-[#666] mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Indicateur de scroll */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-6 h-10 border-2 border-[#8E7AB5]/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-[#8E7AB5] rounded-full mt-2" />
            </div>
          </motion.div>
        </section>

        {/* Valeurs */}
        <section className="md:py-8 px-4 md:px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#F9F7FC]/50 to-transparent" />

          <div className="relative z-10 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-8 md:mb-5 md:mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6">
                Notre <span className="text-[#8E7AB5]">ADN</span>
              </h2>
              <p className="text-xl text-[#666] max-w-2xl mx-auto">
                Les principes qui guident chaque interaction sur SferaLuna
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10, transition: { duration: 0.2 } }}
                  className="group relative h-full"
                >
                  <div className="relative p-4 md:p-6 rounded-2xl bg-white border border-[#F0F0F0] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden h-full flex flex-col">
                    {/* Effet de fond au hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white to-[#F9F7FC] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Icone */}
                    <div className="text-4xl mb-6 relative z-10">
                      {value.title.split(' ')[0]}
                    </div>

                    <h3 className="text-2xl font-semibold text-[#5B4B8A] mb-3 relative z-10">
                      {value.title.split(' ').slice(1).join(' ')}
                    </h3>
                    <p className="text-lg font-medium text-[#1C1C1C] mb-3 relative z-10">
                      {value.description}
                    </p>
                    <p className="text-[#666] relative z-10">
                      {value.details}
                    </p>

                    {/* Ligne décorative */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8E7AB5] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Fonctionnalités principales */}
        <section className="md:py-8 px-4 md:px-6 bg-gradient-to-b from-white to-[#F9F7FC]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="text-center mb-8 md:mb-5 md:mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-[#1C1C1C] mb-6">
                Une expérience <span className="text-[#8E7AB5]">unique</span>
              </h2>
              <p className="text-xl text-[#666] max-w-3xl mx-auto">
                Découvrez les fonctionnalités qui font de SferaLuna bien plus qu'une application de rencontres
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                >
                  <Link href={feature.link} className="block h-full">
                    <div className="group relative h-full p-4 md:p-6 rounded-2xl bg-white border border-[#F0F0F0] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      {/* Fond gradient animé */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                      {/* Icone avec effet */}
                      <motion.div
                        className="text-5xl mb-6 relative z-10"
                        animate={{
                          scale: [1, 1.1, 1],
                          rotate: [0, 5, -5, 0]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          delay: index * 0.5
                        }}
                      >
                        {feature.icon}
                      </motion.div>

                      <h3 className="text-2xl font-semibold text-[#5B4B8A] mb-4 relative z-10">
                        {feature.title}
                      </h3>
                      <p className="text-[#666] relative z-10">
                        {feature.description}
                      </p>

                      {/* Indicateur hover */}
                      <motion.div
                        className="absolute bottom-6 right-6 text-[#8E7AB5] opacity-0 group-hover:opacity-100 transition-opacity"
                        animate={{ x: [0, 5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        →
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Comparatif : Fini le swipe infini */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-10 md:mt-16"
            >
              <div className="text-center mb-5 md:mb-8">
                <span className="inline-block px-4 py-1 rounded-full bg-[#8E7AB5]/10 text-[#8E7AB5] text-sm font-medium mb-4">
                  Une nouvelle façon de rencontrer
                </span>
                <h3 className="text-4xl md:text-5xl font-bold text-[#1C1C1C]">
                  Fini le <span className="text-[#8E7AB5]">swipe infini</span>
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Les autres apps */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative p-4 md:p-6 rounded-3xl bg-gradient-to-br from-[#f5f5f5] to-[#ebebeb] border border-[#ddd] overflow-hidden"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-[#ddd] text-[#999] text-xs font-medium">
                    Les autres apps
                  </div>
                  <div className="space-y-3 mt-6">
                    {[1,2,3,4,5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0.3 + i * 0.1 }}
                        animate={{ opacity: [0.3 + i * 0.08, 0.6, 0.3 + i * 0.08] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.3 }}
                        className="flex items-center gap-3 p-3 rounded-2xl bg-white/60"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ddd] to-[#ccc] flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-2.5 rounded-full bg-[#ddd] w-3/4" />
                          <div className="h-2 rounded-full bg-[#e8e8e8] w-1/2" />
                        </div>
                        <div className="flex gap-1.5">
                          <div className="w-8 h-8 rounded-full bg-[#ffb3b3] flex items-center justify-center text-sm">✕</div>
                          <div className="w-8 h-8 rounded-full bg-[#b3ffb3] flex items-center justify-center text-sm">♥</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-2xl font-bold text-[#999]">247 profils.</p>
                    <p className="text-[#aaa] mt-1">Toujours seule.</p>
                  </div>
                </motion.div>

                {/* SferaLuna */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="relative p-4 md:p-6 rounded-3xl bg-gradient-to-br from-[#f0ecff] to-[#e8e0ff] border-2 border-[#8E7AB5]/30 overflow-hidden"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] text-white text-xs font-medium">
                    SferaLuna ✨
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                    {[
                      { mood: '🌟', name: 'Sofia', age: 29, compat: '94%' },
                      { mood: '🌙', name: 'Léa', age: 31, compat: '91%' },
                      { mood: '💕', name: 'Nour', age: 27, compat: '89%' },
                      { mood: '🦋', name: 'Emma', age: 33, compat: '87%' },
                      { mood: '⚡', name: 'Jade', age: 28, compat: '85%' },
                      { mood: '🌹', name: 'Iris', age: 30, compat: '83%' },
                    ].map((profile, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className="p-3 rounded-2xl bg-white shadow-sm border border-[#8E7AB5]/10 text-center cursor-default"
                      >
                        <div className="text-2xl mb-1">{profile.mood}</div>
                        <div className="text-xs font-semibold text-[#1C1C1C]">{profile.name}, {profile.age}</div>
                        <div className="text-xs text-[#8E7AB5] font-medium mt-1">{profile.compat}</div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <p className="text-2xl font-bold text-[#5B4B8A]">6 profils.</p>
                    <p className="text-[#8E7AB5] mt-1">Vraiment compatibles.</p>
                  </div>
                </motion.div>
              </div>

              <p className="text-center text-[#666] mt-8 text-lg">
                Notre algorithme sélectionne <span className="font-semibold text-[#8E7AB5]">6 profils alignés avec tes valeurs</span> chaque semaine.<br className="hidden md:block" />
                Pas de fatigue du swipe. Juste des connexions qui ont du sens.
              </p>
            </motion.div>
          </div>
        </section>


        {/* Call to Action final */}
        <section className="relative py-4 md:py-14 px-4 md:px-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#8E7AB5] via-[#A68BC9] to-[#D9B8FF]" />

          {/* Effets de fond */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -left-1/2 w-full h-full bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]"
          />

          <div className="relative z-10 max-w-4xl mx-auto text-center text-white">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4"
            >
              Prête à créer ton <span className="text-white">cercle Luna</span> ?
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-base md:text-xl mb-6 opacity-90"
            >
              Rejoins <span className="font-semibold">10,000+ femmes</span> qui ont déjà trouvé leur communauté
            </motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/auth?mode=register" className="group">
                <button className="px-6 sm:px-12 py-4 rounded-full bg-white text-[#8E7AB5] font-semibold text-base sm:text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto">
                  <span>Commencer maintenant</span>
                  <span className="group-hover:translate-x-1 transition-transform">🚀</span>
                </button>
              </Link>

              <Link href="/tarifs" className="w-full sm:w-auto">
                <button className="px-6 sm:px-12 py-4 rounded-full border-2 border-white text-white font-semibold text-base sm:text-lg hover:bg-white/10 transition-all duration-300 w-full">
                  Voir les options premium
                </button>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-5 text-sm text-white/80"
            >
              <span className="font-semibold">30 jours gratuits</span> · Aucune carte requise · Annulation à tout moment
            </motion.p>
          </div>
        </section>

        {/* Section application mobile */}
        <section className="py-6 md:py-8 px-4 bg-gradient-to-br from-[#faf9ff] to-[#f0ecff]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20 mb-6">
              <span className="text-sm text-[#8E7AB5] font-medium">✨ Très bientôt</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1C1C1C] mb-4">
              L&apos;application mobile <span className="bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF] bg-clip-text text-transparent">SferaLuna</span> arrive
            </h2>
            <p className="text-[#666] mb-8 max-w-xl mx-auto">
              Rencontres, messages et communauté directement depuis ton téléphone. iOS et Android, bientôt disponibles.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#1a0b2e] text-white shadow-lg cursor-default select-none w-full sm:w-auto justify-center">
                <span className="text-2xl">🍎</span>
                <div className="text-left">
                  <p className="text-xs text-white/60 leading-none">Bientôt sur</p>
                  <p className="text-base font-semibold">App Store</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-[#1a0b2e] text-white shadow-lg cursor-default select-none w-full sm:w-auto justify-center">
                <span className="text-2xl">🤖</span>
                <div className="text-left">
                  <p className="text-xs text-white/60 leading-none">Bientôt sur</p>
                  <p className="text-base font-semibold">Google Play</p>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm text-[#999]">Laisse-nous ton email pour être notifiée en première.</p>
          </motion.div>
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