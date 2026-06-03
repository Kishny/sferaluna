// src/app/contact/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Moon, MessageCircle, Heart, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ nom: "", email: "", sujet: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulation d'envoi (à connecter à un vrai service email)
    await new Promise((r) => setTimeout(r, 1200));
    setSent(true);
    setSending(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5 md:mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#8E7AB5]/10 border border-[#8E7AB5]/20 text-[#8E7AB5] text-sm font-medium mb-6">
            <Mail size={15} />
            Contactez-nous
          </div>
          <h1 className="text-4xl font-bold text-[#1C1C1C] mb-4">
            On est là pour vous 💜
          </h1>
          <p className="text-[#666] text-lg">
            Une question, un problème ou juste envie de dire bonjour ? Écrivez-nous.
          </p>
        </motion.div>

        {/* Infos de contact */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10"
        >
          {[
            { emoji: "📧", title: "Email", value: "support@sferaluna.com" },
            { emoji: "💬", title: "Réponse", value: "Sous 24–48h" },
            { emoji: "🛡️", title: "Support premium", value: "Prioritaire" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#8E7AB5]/15 bg-white p-5 text-center shadow-sm"
            >
              <p className="text-2xl mb-2">{item.emoji}</p>
              <p className="text-xs text-[#999] mb-1">{item.title}</p>
              <p className="font-semibold text-[#5B4B8A] text-sm">{item.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-8 shadow-lg"
        >
          {sent ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#1C1C1C] mb-2">Message envoyé ! 🎉</h2>
              <p className="text-[#666] mb-6">Nous vous répondrons dans les 24–48h.</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white font-semibold hover:opacity-90 transition"
              >
                <Moon size={16} /> Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-xl font-bold text-[#1C1C1C] mb-6 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[#8E7AB5]" />
                Envoyez-nous un message
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-[#666] block mb-1.5">Votre nom</span>
                  <input
                    required
                    value={form.nom}
                    onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E0FF] focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 focus:outline-none text-[#1C1C1C] placeholder-[#999] text-sm"
                    placeholder="Luna Dupont"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-[#666] block mb-1.5">Votre email</span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E0FF] focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 focus:outline-none text-[#1C1C1C] placeholder-[#999] text-sm"
                    placeholder="vous@email.com"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-[#666] block mb-1.5">Sujet</span>
                <select
                  required
                  value={form.sujet}
                  onChange={(e) => setForm((p) => ({ ...p, sujet: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E0FF] focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 focus:outline-none text-[#1C1C1C] text-sm bg-white"
                >
                  <option value="">Choisir un sujet…</option>
                  <option value="technique">Problème technique</option>
                  <option value="abonnement">Abonnement / Paiement</option>
                  <option value="compte">Mon compte</option>
                  <option value="signalement">Signalement</option>
                  <option value="autre">Autre</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-[#666] block mb-1.5">Message</span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E0FF] focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 focus:outline-none text-[#1C1C1C] placeholder-[#999] text-sm resize-none"
                  placeholder="Décrivez votre demande en détail…"
                />
              </label>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
              >
                {sending ? (
                  <>Envoi en cours…</>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer le message
                  </>
                )}
              </button>

              <p className="text-xs text-center text-[#999] flex items-center justify-center gap-1">
                <Heart size={12} className="text-[#FF6B6B]" />
                Nous respectons votre vie privée. Aucun spam.
              </p>
            </form>
          )}
        </motion.div>

        {/* Retour */}
        <p className="text-center mt-8 text-sm text-[#999]">
          <Link href="/" className="text-[#8E7AB5] hover:underline">← Retour à l&apos;accueil</Link>
        </p>
      </div>
    </main>
  );
}
