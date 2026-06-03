"use client";

import { motion } from "framer-motion";
import { Calendar, Sparkles, Heart } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function VibePlannerPage() {
  return (
    <div className="min-h-screen bg-[#1a0b2e] text-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          {/* Icône animée */}
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="text-7xl mb-6"
          >
            🗓️
          </motion.div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-sm font-medium mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Bientôt disponible
          </div>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent mb-4">
            VibePlanner
          </h1>

          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            Planifiez des idées de rendez-vous magiques avec vos matchs.
            Cette fonctionnalité arrive très bientôt sur SferaLuna.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { emoji: "🎨", label: "Idées créatives" },
              { emoji: "🌿", label: "Sorties nature" },
              { emoji: "🛋️", label: "Soirées cosy" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center"
              >
                <div className="text-2xl mb-2">{item.emoji}</div>
                <p className="text-xs text-white/50">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <Heart className="h-4 w-4 text-pink-400" />
            <span>Patience… ça va valoir le coup ✨</span>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
