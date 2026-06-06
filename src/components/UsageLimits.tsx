// src/components/UsageLimits.tsx
"use client";

import { Zap, Users, Calendar, MessageCircle, RefreshCw } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function UsageLimits() {
  const { subscription, loading, plan } = useSubscription();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!subscription) return null;

  const limits = subscription.limits ?? {};
  const isFree = plan === "free";

  const featureRows = [
    {
      key: "likes",
      icon: Zap,
      label: "Likes quotidiens",
      description: "Profils likés aujourd'hui",
      limit: isFree ? 5 : null,
      period: "daily",
    },
    {
      key: "messages",
      icon: MessageCircle,
      label: "Messages",
      description: isFree ? "Messages par jour" : "Illimités",
      limit: isFree ? 10 : null,
      period: "daily",
    },
    {
      key: "circleOfSix",
      icon: Users,
      label: "Circle of Six",
      description: "Affinités de la semaine",
      limit: null,
      period: null,
    },
    {
      key: "vibePlanner",
      icon: Calendar,
      label: "VibePlanner",
      description: "Idées rendez-vous ce mois-ci",
      limit:
        typeof limits.boosts === "number" && !isFree ? null : isFree ? 0 : null,
      period: "monthly",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-[#1C1C1C]">
        Vos limites d&apos;utilisation
      </h3>

      <div className="grid gap-4">
        {featureRows.map(({ key, icon: Icon, label, description, limit, period }) => {
          // Si illimité ou pas de limite définie : afficher badge
          if (limit === null) {
            return (
              <div
                key={key}
                className="p-4 rounded-xl border border-[#F0F0F0] bg-white flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-[#8E7AB5]/10">
                  <Icon className="w-5 h-5 text-[#8E7AB5]" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[#1C1C1C]">{label}</h4>
                  <p className="text-sm text-[#666]">{description}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  Illimité
                </span>
              </div>
            );
          }

          // Sinon afficher barre de progression
          const used = 0; // pas de compteur client-side en temps réel — indicatif
          const percentage = limit > 0 ? (used / limit) * 100 : 0;
          const isWarning = percentage > 80;
          const isDanger = percentage > 95;

          return (
            <div
              key={key}
              className="p-4 rounded-xl border border-[#F0F0F0] bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#8E7AB5]/10">
                    <Icon className="w-5 h-5 text-[#8E7AB5]" />
                  </div>
                  <div>
                    <h4 className="font-medium text-[#1C1C1C]">{label}</h4>
                    <p className="text-sm text-[#666]">{description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#1C1C1C]">
                    {limit === 0 ? "Non disponible" : `/ ${limit}`}
                  </div>
                  <div className="text-xs text-[#666]">
                    {period === "daily"
                      ? "Aujourd'hui"
                      : period === "weekly"
                      ? "Cette semaine"
                      : "Ce mois-ci"}
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDanger
                        ? "bg-red-500"
                        : isWarning
                        ? "bg-yellow-500"
                        : "bg-gradient-to-r from-[#8E7AB5] to-[#D9B8FF]"
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {isWarning && (
                  <p className="text-xs mt-2 text-yellow-600">
                    ⚠️ Vous approchez de votre limite
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFree && (
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
          <p className="text-sm text-[#5B4B8A] font-medium text-center">
            Passez à un plan payant pour des limites illimitées 🚀
          </p>
          <div className="flex justify-center mt-2">
            <a
              href="/tarifs"
              className="text-xs text-purple-600 underline hover:text-purple-800"
            >
              Voir les offres
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
