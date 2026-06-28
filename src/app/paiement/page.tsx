// src/app/paiement/page.tsx

"use client";

/**
 * Page de paiement SferaLuna.
 *
 * Cette page permet :
 * - de choisir une offre payante ;
 * - de lancer Stripe Checkout ;
 * - d'afficher un récapitulatif clair ;
 * - de rassurer l'utilisateur sur la sécurité du paiement.
 *
 * Important :
 * La vraie logique de paiement reste côté backend dans :
 * src/app/api/stripe/create-checkout-session/route.ts
 *
 * Cette page envoie uniquement le plan sélectionné :
 * {
 *   plan: "essential-monthly" | "premium-monthly" | "elite-monthly"
 * }
 */

import { useMemo, useState } from "react";
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
  User,
  Zap,
  AlertCircle,
} from "lucide-react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/**
 * Plans Stripe acceptés par ton API.
 *
 * Ces valeurs doivent être exactement identiques côté frontend et backend.
 */
type LunaPlan = "essential-monthly" | "premium-monthly" | "elite-monthly";

interface PlanConfig {
  id: LunaPlan;
  name: string;
  price: string;
  subtitle: string;
  badge?: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

// ─────────────────────────────────────────────
// Configuration des offres
// ─────────────────────────────────────────────

/**
 * Le prix affiché ici est uniquement visuel.
 *
 * Le vrai montant Stripe vient des Price IDs configurés côté serveur
 * dans .env.local et utilisés par ton endpoint Stripe.
 */
const plans: PlanConfig[] = [
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

// ─────────────────────────────────────────────
// Page principale
// ─────────────────────────────────────────────

export default function PaiementPage() {
  /**
   * Offre sélectionnée par défaut.
   *
   * On garde Premium par défaut, car c’est ton offre principale.
   */
  const [selectedPlan, setSelectedPlan] =
    useState<LunaPlan>("premium-monthly");

  /**
   * Loader Stripe.
   */
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Message d’erreur affiché dans la page.
   */
  const [error, setError] = useState("");

  /**
   * Récupère la configuration complète de l'offre sélectionnée.
   */
  const selectedOffer = useMemo(() => {
    return plans.find((plan) => plan.id === selectedPlan) || plans[1];
  }, [selectedPlan]);

  /**
   * Lance Stripe Checkout.
   *
   * Endpoint appelé :
   * POST /api/stripe/create-checkout-session
   *
   * Le backend doit ensuite :
   * - vérifier la session utilisateur ;
   * - vérifier le plan ;
   * - récupérer le bon STRIPE_PRICE_ID ;
   * - créer la session checkout ;
   * - renvoyer { success: true, url }.
   */
  const handleStripePayment = async () => {
    if (isLoading) return;

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

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data?.url) {
        console.error("Erreur Stripe Checkout :", data);

        setError(
          data?.error ||
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
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#1a0b2e] via-[#2d1b69] to-[#3a2a82] text-white">
      {/* Décor lumineux */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl sm:h-80 sm:w-80" />
        <div className="absolute bottom-0 right-1/4 h-80 w-80 rounded-full bg-pink-500/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute right-1/3 top-1/3 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl sm:h-72 sm:w-72" />
      </div>

      {/* Étoiles globales depuis globals.css */}
      <div className="stars" />

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-6 sm:px-4 sm:py-10">
        {/* Retour */}
        <div className="mb-6 flex flex-wrap gap-2 sm:mb-10">
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            Retour à l’inscription
          </Link>

          <Link
            href="/mon-compte"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Mon compte
          </Link>
        </div>

        {/* Header */}
        <section className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-yellow-300 sm:mb-5">
            <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="text-xs font-semibold sm:text-sm">
              Activation Premium
            </span>
          </div>

          <h1 className="bg-gradient-to-r from-purple-200 via-pink-200 to-yellow-100 bg-clip-text text-3xl font-bold leading-tight text-transparent sm:text-4xl md:text-5xl">
            Choisissez votre offre SferaLuna
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 sm:mt-5 sm:text-lg">
            Sélectionnez l’offre qui correspond le mieux à votre expérience. Le
            paiement est sécurisé via Stripe.
          </p>
        </section>

        {/* Message d’erreur */}
        {error && (
          <div className="mx-auto mb-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 sm:mb-8 sm:px-5 sm:py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <p>{error}</p>
          </div>
        )}

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* Liste des offres */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;

                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      setError("");
                    }}
                    className={`relative rounded-3xl border p-5 text-left transition-all sm:p-6 ${
                      isSelected
                        ? "border-pink-400 bg-pink-500/20 shadow-2xl shadow-pink-500/10"
                        : "border-white/10 bg-white/10 hover:border-purple-300/50 hover:bg-white/15"
                    }`}
                  >
                    {/* Badge : Plus populaire / VIP */}
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg sm:-top-4 sm:px-4 sm:text-sm">
                        {plan.badge}
                      </div>
                    )}

                    <div className="mb-4 flex items-center justify-between sm:mb-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 sm:h-12 sm:w-12">
                        {plan.id === "essential-monthly" && (
                          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}

                        {plan.id === "premium-monthly" && (
                          <Crown className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}

                        {plan.id === "elite-monthly" && (
                          <Star className="h-5 w-5 sm:h-6 sm:w-6" />
                        )}
                      </div>

                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                          isSelected
                            ? "border-pink-400 bg-pink-500"
                            : "border-white/30"
                        }`}
                      >
                        {isSelected && <Check className="h-4 w-4 text-white" />}
                      </div>
                    </div>

                    <h2 className="text-xl font-bold sm:text-2xl">
                      {plan.name}
                    </h2>

                    <p className="mt-2 min-h-0 text-sm text-gray-300 md:min-h-[44px]">
                      {plan.description}
                    </p>

                    <div className="mt-5 flex items-end gap-1 sm:mt-6">
                      <span className="text-3xl font-bold sm:text-4xl">
                        {plan.price}
                      </span>

                      <span className="mb-1 text-sm text-gray-300 sm:text-base">
                        {plan.subtitle}
                      </span>
                    </div>

                    <ul className="mt-5 space-y-2.5 sm:mt-6 sm:space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/20">
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
            <div className="mt-6 flex gap-4 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-5 sm:mt-8 sm:p-6">
              <ShieldCheck className="h-6 w-6 shrink-0 text-blue-300" />

              <div>
                <h3 className="font-bold text-blue-100">
                  Paiement sécurisé Stripe
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-blue-100/80">
                  Vous serez redirigé vers Stripe Checkout pour finaliser votre
                  abonnement. Aucune donnée bancaire n’est stockée sur
                  SferaLuna.
                </p>
              </div>
            </div>
          </div>

          {/* Récapitulatif */}
          <aside className="h-fit rounded-3xl border border-purple-400/20 bg-gradient-to-br from-purple-900/40 to-pink-900/30 p-5 shadow-2xl backdrop-blur-xl sm:p-6 md:p-8 lg:sticky lg:top-6">
            <div className="mb-5 flex items-center gap-3 sm:mb-6">
              <Sparkles className="h-5 w-5 text-pink-300 sm:h-6 sm:w-6" />

              <h2 className="text-xl font-bold sm:text-2xl">Votre offre</h2>
            </div>

            <div className="mb-5 rounded-2xl border border-white/10 bg-white/10 p-4 sm:mb-6 sm:p-5">
              <p className="text-sm text-gray-300">Formule sélectionnée</p>

              <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                SferaLuna {selectedOffer.name}
              </h3>

              <p className="mt-4 text-3xl font-bold sm:text-4xl">
                {selectedOffer.price}
                <span className="text-base font-normal text-gray-300">
                  {" "}
                  {selectedOffer.subtitle}
                </span>
              </p>
            </div>

            <ul className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
              {selectedOffer.features.slice(0, 5).map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20">
                    <Check className="h-4 w-4 text-green-300" />
                  </div>

                  <span className="text-sm text-gray-100 sm:text-base">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-white/10 pt-5">
              <div className="flex justify-between text-sm text-gray-300 sm:text-base">
                <span>Sous-total</span>
                <span>{selectedOffer.price}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-300 sm:text-base">
                <span>TVA</span>
                <span>Incluse</span>
              </div>

              <div className="flex justify-between border-t border-white/10 pt-3 text-lg font-bold text-white sm:text-xl">
                <span>Total</span>
                <span>{selectedOffer.price}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStripePayment}
              disabled={isLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:py-4 sm:text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Redirection...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Payer avec Stripe
                </>
              )}
            </button>

            <div className="mt-5 space-y-3 sm:mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Lock className="h-4 w-4" />
                Paiement sécurisé SSL
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-300">
                <BadgeCheck className="h-4 w-4" />
                Annulation possible à tout moment
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
