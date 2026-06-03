// src/app/paiement/page.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

/**
 * Plans Stripe acceptés par ton API :
 * src/app/api/stripe/create-checkout-session/route.ts
 *
 * Très important :
 * Ces valeurs doivent être exactement les mêmes côté frontend et backend.
 */
type LunaPlan = "essential-monthly" | "premium-monthly" | "elite-monthly";

/**
 * Configuration des 3 offres SferaLuna.
 *
 * Le prix affiché ici est uniquement visuel.
 * Le vrai prix utilisé par Stripe vient des Price ID dans .env.local.
 */
const plans: {
  id: LunaPlan;
  name: string;
  price: string;
  subtitle: string;
  badge?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: "essential-monthly",
    name: "Essentiel",
    price: "9,99€",
    subtitle: "/ mois",
    description: "Pour découvrir SferaLuna en douceur.",
    features: [
      "Profil visible",
      "Suggestions compatibles",
      "Messages avec vos matchs",
      "Accès au journal émotionnel",
      "Sécurité standard",
    ],
  },
  {
    id: "premium-monthly",
    name: "Premium",
    price: "19,99€",
    subtitle: "/ mois",
    badge: "Plus populaire",
    highlighted: true,
    description: "L’offre idéale pour profiter pleinement de SferaLuna.",
    features: [
      "Likes illimités",
      "Messages prioritaires",
      "Filtres avancés",
      "Mode invisible",
      "Vue des visiteurs",
      "Badge Premium",
    ],
  },
  {
    id: "elite-monthly",
    name: "Elite",
    price: "34,99€",
    subtitle: "/ mois",
    badge: "VIP",
    description: "L’expérience haut de gamme pour maximiser vos rencontres.",
    features: [
      "Tout Premium inclus",
      "Boost de visibilité",
      "Profil mis en avant",
      "Coaching personnalisé",
      "Accès événements privés",
      "Support VIP",
    ],
  },
];

export default function PaiementPage() {
  /**
   * Plan sélectionné par défaut.
   * Ici on met Premium, car c’est souvent l’offre principale.
   */
  const [selectedPlan, setSelectedPlan] =
    useState<LunaPlan>("premium-monthly");

  /**
   * Loader du bouton Stripe.
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Message d’erreur visible côté utilisateur.
   */
  const [error, setError] = useState("");

  const selectedOffer =
    plans.find((plan) => plan.id === selectedPlan) || plans[1];

  /**
   * Lance Stripe Checkout.
   *
   * Cette fonction appelle :
   * POST /api/stripe/create-checkout-session
   *
   * Le serveur récupère ensuite le bon priceId Stripe selon le plan choisi.
   */
  const handleStripePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        console.error("Erreur Stripe Checkout :", data);

        setError(
          data.error ||
            "Impossible de démarrer le paiement. Vérifiez votre configuration Stripe."
        );

        return;
      }

      /**
       * Redirection vers Stripe Checkout.
       */
      window.location.href = data.url;
    } catch (error) {
      console.error("Erreur paiement Stripe :", error);
      setError("Erreur lors du démarrage du paiement Stripe.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white relative overflow-hidden">
      {/* Décor lumineux */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Étoiles globales depuis globals.css */}
      <div className="stars" />

      <div className="relative z-10 container mx-auto px-4 py-10">
        {/* Retour */}
        <Link
          href="/inscription"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors mb-10"
        >
          <ArrowLeft className="h-5 w-5" />
          Retour à l’inscription
        </Link>

        {/* Header */}
        <section className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-300 mb-5">
            <Crown className="h-5 w-5" />
            <span className="text-sm font-semibold">
              Activation Premium
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-100 bg-clip-text text-transparent">
            Choisissez votre offre SferaLuna
          </h1>

          <p className="mt-5 text-gray-300 text-lg">
            Sélectionnez l’offre qui correspond le mieux à votre expérience.
            Le paiement est sécurisé via Stripe.
          </p>
        </section>

        {/* Message d’erreur */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8 rounded-2xl border border-red-400/30 bg-red-500/10 px-5 py-4 text-red-100">
            {error}
          </div>
        )}

        <section className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des offres */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`relative text-left rounded-3xl border p-6 transition-all ${
                      isSelected
                        ? "border-pink-400 bg-pink-500/20 shadow-2xl shadow-pink-500/10"
                        : "border-white/10 bg-white/10 hover:bg-white/15 hover:border-purple-300/50"
                    }`}
                  >
                    {/* Badge : Plus populaire / VIP */}
                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm font-bold whitespace-nowrap">
                        {plan.badge}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-5">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        {plan.id === "essential-monthly" && (
                          <Sparkles className="h-6 w-6" />
                        )}

                        {plan.id === "premium-monthly" && (
                          <Crown className="h-6 w-6" />
                        )}

                        {plan.id === "elite-monthly" && (
                          <Star className="h-6 w-6" />
                        )}
                      </div>

                      <div
                        className={`h-6 w-6 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? "border-pink-400 bg-pink-500"
                            : "border-white/30"
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold">{plan.name}</h2>

                    <p className="mt-2 text-gray-300 text-sm min-h-[44px]">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-end gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-gray-300 mb-1">
                        {plan.subtitle}
                      </span>
                    </div>

                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="mt-0.5 h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                            <Check className="h-3 w-3 text-green-300" />
                          </div>

                          <span className="text-sm text-gray-100">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Bloc rassurance Stripe */}
            <div className="mt-8 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-6 flex gap-4">
              <ShieldCheck className="h-6 w-6 text-blue-300 flex-shrink-0" />

              <div>
                <h3 className="font-bold text-blue-100">
                  Paiement sécurisé Stripe
                </h3>

                <p className="text-sm text-blue-100/80 mt-1">
                  Vous serez redirigé vers Stripe Checkout pour finaliser votre
                  abonnement. Aucune donnée bancaire n’est stockée sur SferaLuna.
                </p>
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <aside className="rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-900/40 to-pink-900/30 backdrop-blur-xl p-6 md:p-8 shadow-2xl h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="h-6 w-6 text-pink-300" />

              <h2 className="text-2xl font-bold">Votre offre</h2>
            </div>

            <div className="rounded-2xl bg-white/10 border border-white/10 p-5 mb-6">
              <p className="text-gray-300 text-sm">Formule sélectionnée</p>

              <h3 className="text-2xl font-bold mt-1">
                SferaLuna {selectedOffer.name}
              </h3>

              <p className="text-4xl font-bold mt-4">
                {selectedOffer.price}
                <span className="text-base font-normal text-gray-300">
                  {" "}
                  {selectedOffer.subtitle}
                </span>
              </p>
            </div>

            <ul className="space-y-4 mb-8">
              {selectedOffer.features.slice(0, 5).map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-300" />
                  </div>

                  <span className="text-gray-100">{item}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-white/10 pt-5 space-y-3">
              <div className="flex justify-between text-gray-300">
                <span>Sous-total</span>
                <span>{selectedOffer.price}</span>
              </div>

              <div className="flex justify-between text-gray-300">
                <span>TVA</span>
                <span>Incluse</span>
              </div>

              <div className="flex justify-between text-white text-xl font-bold pt-3 border-t border-white/10">
                <span>Total</span>
                <span>{selectedOffer.price}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStripePayment}
              disabled={isLoading}
              className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirection vers Stripe...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Payer avec Stripe
                </>
              )}
            </button>

            <div className="mt-6 flex items-center gap-2 text-sm text-gray-300">
              <Lock className="h-4 w-4" />
              Paiement sécurisé SSL
            </div>

            <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
              <BadgeCheck className="h-4 w-4" />
              Annulation possible à tout moment
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
