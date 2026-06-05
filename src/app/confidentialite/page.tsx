// src/app/contact/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  Heart,
  Mail,
  MessageCircle,
  Moon,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

/**
 * Page Contact SferaLuna.
 *
 * Cette page gère :
 * - un formulaire de contact simple ;
 * - un état d'envoi simulé ;
 * - un état de confirmation après envoi ;
 * - des informations de contact rapides ;
 * - une logique mobile compacte avec accordéon.
 *
 * Important :
 * L'envoi est actuellement simulé avec un setTimeout.
 * Plus tard, tu pourras connecter handleSubmit à :
 * - une route API /api/contact ;
 * - Resend ;
 * - Nodemailer ;
 * - Brevo ;
 * - ou un service externe.
 */

interface ContactForm {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

export default function ContactPage() {
  /**
   * Données du formulaire.
   */
  const [form, setForm] = useState<ContactForm>({
    nom: "",
    email: "",
    sujet: "",
    message: "",
  });

  /**
   * true lorsque le message a été envoyé.
   */
  const [sent, setSent] = useState(false);

  /**
   * true pendant l'envoi du message.
   */
  const [sending, setSending] = useState(false);

  /**
   * Accordéon mobile pour les infos utiles.
   */
  const [openInfo, setOpenInfo] = useState<string | null>("response");

  /**
   * Données affichées dans les petites cards d'information.
   */
  const contactInfos = [
    {
      id: "email",
      emoji: "📧",
      title: "Email",
      value: "support@sferaluna.com",
      description:
        "Notre équipe reçoit votre demande directement par email.",
    },
    {
      id: "response",
      emoji: "💬",
      title: "Réponse",
      value: "Sous 24–48h",
      description:
        "Nous répondons généralement sous 24 à 48h selon le volume de demandes.",
    },
    {
      id: "premium",
      emoji: "🛡️",
      title: "Support premium",
      value: "Prioritaire",
      description:
        "Les membres premium bénéficient d'un traitement prioritaire.",
    },
  ];

  /**
   * Gestion de l'envoi du formulaire.
   *
   * Pour le moment :
   * - on empêche le rechargement de la page ;
   * - on simule un envoi ;
   * - on affiche l'écran de succès.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sending) return;

    setSending(true);

    /**
     * Simulation d'envoi.
     * À remplacer par un vrai fetch plus tard :
     *
     * await fetch("/api/contact", {
     *   method: "POST",
     *   headers: { "Content-Type": "application/json" },
     *   body: JSON.stringify(form),
     * });
     */
    await new Promise((resolve) => setTimeout(resolve, 1200));

    setSent(true);
    setSending(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf9ff] via-white to-[#f0ecff] px-3 pb-8 pt-20 text-[#1C1C1C] sm:px-4 sm:pb-16 sm:pt-24">
      <div className="mx-auto max-w-2xl">
        {/* Header / Hero compact */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-4 rounded-3xl border border-[#8E7AB5]/15 bg-white/75 p-4 text-center shadow-sm backdrop-blur sm:mb-8 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none"
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#8E7AB5]/20 bg-[#8E7AB5]/10 px-3 py-1.5 text-xs font-medium text-[#8E7AB5] sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <Mail size={14} />
            Contactez-nous
          </div>

          <h1 className="text-2xl font-bold leading-tight text-[#1C1C1C] sm:text-4xl">
            On est là pour vous 💜
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#666] sm:mt-4 sm:text-lg">
            Une question, un problème ou juste envie de dire bonjour ?
            Écrivez-nous.
          </p>
        </motion.header>

        {/* Infos contact desktop/tablette */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5 hidden grid-cols-3 gap-4 sm:mb-10 sm:grid"
        >
          {contactInfos.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-[#8E7AB5]/15 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <p className="mb-2 text-2xl">{item.emoji}</p>

              <p className="mb-1 text-xs text-[#999]">{item.title}</p>

              <p className="text-sm font-semibold text-[#5B4B8A]">
                {item.value}
              </p>
            </div>
          ))}
        </motion.section>

        {/* Infos contact mobile en accordéon compact */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 space-y-2 sm:hidden"
        >
          {contactInfos.map((item) => {
            const isOpen = openInfo === item.id;

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#E8E0FF] bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenInfo(isOpen ? null : item.id)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#8E7AB5]/10 text-lg">
                    {item.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-[#5B4B8A]">
                      {item.title}
                    </h2>

                    <p className="truncate text-xs text-[#666]">
                      {item.value}
                    </p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#8E7AB5] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[#F0ECFA] px-3 pb-3 pt-2">
                        <p className="text-xs leading-relaxed text-[#666]">
                          {item.description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.section>

        {/* Formulaire / succès */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-3xl border border-[#8E7AB5]/15 bg-white p-4 shadow-lg sm:p-8"
        >
          {sent ? (
            /**
             * Écran de succès après envoi.
             */
            <div className="py-6 text-center sm:py-8">
              <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-500 sm:h-16 sm:w-16" />

              <h2 className="mb-2 text-xl font-bold text-[#1C1C1C] sm:text-2xl">
                Message envoyé ! 🎉
              </h2>

              <p className="mx-auto mb-5 max-w-sm text-sm leading-relaxed text-[#666] sm:mb-6">
                Nous vous répondrons dans les 24–48h.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setSent(false);
                    setForm({
                      nom: "",
                      email: "",
                      sujet: "",
                      message: "",
                    });
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E0FF] px-5 py-3 text-sm font-semibold text-[#8E7AB5] transition hover:border-[#8E7AB5] hover:bg-[#8E7AB5]/5 sm:w-auto"
                >
                  <MessageCircle size={16} />
                  Nouveau message
                </button>

                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                >
                  <Moon size={16} />
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
          ) : (
            /**
             * Formulaire principal.
             */
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              <div className="mb-4 flex items-center justify-between gap-3 sm:mb-6">
                <h2 className="flex items-center gap-2 text-base font-bold text-[#1C1C1C] sm:text-xl">
                  <MessageCircle className="h-5 w-5 text-[#8E7AB5]" />
                  Envoyez-nous un message
                </h2>

                <span className="hidden rounded-full bg-[#8E7AB5]/10 px-3 py-1 text-xs font-medium text-[#8E7AB5] sm:inline-flex">
                  Support Luna
                </span>
              </div>

              {/* Nom + email */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#666] sm:text-sm">
                    Votre nom
                  </span>

                  <input
                    required
                    value={form.nom}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        nom: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#E8E0FF] px-3 py-2.5 text-sm text-[#1C1C1C] placeholder-[#999] outline-none transition focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 sm:px-4 sm:py-3"
                    placeholder="Luna Dupont"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#666] sm:text-sm">
                    Votre email
                  </span>

                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        email: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#E8E0FF] px-3 py-2.5 text-sm text-[#1C1C1C] placeholder-[#999] outline-none transition focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 sm:px-4 sm:py-3"
                    placeholder="vous@email.com"
                  />
                </label>
              </div>

              {/* Sujet */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#666] sm:text-sm">
                  Sujet
                </span>

                <select
                  required
                  value={form.sujet}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      sujet: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#E8E0FF] bg-white px-3 py-2.5 text-sm text-[#1C1C1C] outline-none transition focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 sm:px-4 sm:py-3"
                >
                  <option value="">Choisir un sujet…</option>
                  <option value="technique">Problème technique</option>
                  <option value="abonnement">Abonnement / Paiement</option>
                  <option value="compte">Mon compte</option>
                  <option value="signalement">Signalement</option>
                  <option value="autre">Autre</option>
                </select>
              </label>

              {/* Message */}
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#666] sm:text-sm">
                  Message
                </span>

                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) =>
                    setForm((previous) => ({
                      ...previous,
                      message: e.target.value,
                    }))
                  }
                  className="w-full resize-none rounded-xl border border-[#E8E0FF] px-3 py-2.5 text-sm text-[#1C1C1C] placeholder-[#999] outline-none transition focus:border-[#8E7AB5] focus:ring-2 focus:ring-[#8E7AB5]/20 sm:px-4 sm:py-3"
                  placeholder="Décrivez votre demande en détail…"
                />
              </label>

              {/* Résumé confiance */}
              <div className="rounded-2xl border border-[#E8E0FF] bg-[#FDFCFF] p-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#8E7AB5]" />

                  <p className="text-xs leading-relaxed text-[#666]">
                    Votre message reste confidentiel. Les demandes liées à la
                    sécurité, au signalement ou au compte sont traitées avec
                    attention.
                  </p>
                </div>
              </div>

              {/* Bouton envoyer */}
              <button
                type="submit"
                disabled={sending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8E7AB5] to-[#A68BC9] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:py-3.5"
              >
                {sending ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    Envoi en cours…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Envoyer le message
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-1 text-center text-[11px] text-[#999] sm:text-xs">
                <Heart size={12} className="text-[#FF6B6B]" />
                Nous respectons votre vie privée. Aucun spam.
              </p>
            </form>
          )}
        </motion.section>

        {/* Retour */}
        <p className="mt-5 text-center text-xs text-[#999] sm:mt-8 sm:text-sm">
          <Link
            href="/"
            className="font-medium text-[#8E7AB5] underline-offset-2 transition hover:underline"
          >
            ← Retour à l&apos;accueil
          </Link>
        </p>
      </div>
    </main>
  );
}
