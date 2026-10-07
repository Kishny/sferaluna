// src/components/BackButton.tsx

"use client";

/**
 * Bouton « Retour » commun à toutes les pages.
 *
 * Revient à la page précédente du site (historique du navigateur) quand on
 * vient d'une autre page SferaLuna ; sinon (lien partagé, nouvel onglet), va
 * vers `fallbackHref`. Le libellé indique la destination quand on la connaît.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getNavOrigin } from "@/components/NavTracker";
import { cn } from "@/components/site/ui";

const LABELS: [RegExp, string][] = [
  [/^\/$/, "Retour à l’accueil"],
  [/^\/mon-compte\/?$/, "Retour au tableau de bord"],
  [/^\/mon-compte\?tab=profil/, "Retour à mon profil"],
  [/^\/mon-compte\?tab=connexions/, "Retour à mes interactions"],
  [/^\/mon-compte\?tab=premium/, "Retour à Premium"],
  [/^\/mon-compte/, "Retour au compte"],
  [/^\/explorer\/libre/, "Retour à Explorer librement"],
  [/^\/explorer\/profil|^\/profil\//, "Retour au profil"],
  [/^\/explorer/, "Retour aux découvertes"],
  [/^\/messages/, "Retour aux messages"],
  [/^\/matches/, "Retour à mes matchs"],
  [/^\/circle/, "Retour aux Affinités de la semaine"],
  [/^\/evenements/, "Retour aux événements"],
  [/^\/vibesphere/, "Retour à VibeSphere"],
  [/^\/vibeplanner/, "Retour à VibePlanner"],
  [/^\/vibementor/, "Retour à VibeMentor"],
  [/^\/tarifs/, "Retour aux tarifs"],
  [/^\/securite/, "Retour à Sécurité"],
  [/^\/fonctionnalites/, "Retour aux fonctionnalités"],
  [/^\/faq/, "Retour à la FAQ"],
];

function labelFor(path: string | null, fallback: string) {
  if (!path) return fallback;
  return LABELS.find(([re]) => re.test(path))?.[1] ?? "Retour";
}

export default function BackButton({
  fallbackHref = "/",
  fallbackLabel = "Retour",
  tone = "dark",
  className = "",
}: {
  fallbackHref?: string;
  fallbackLabel?: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [origin, setOrigin] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(getNavOrigin(pathname));
  }, [pathname]);

  const goBack = () => {
    const from = getNavOrigin(pathname) ?? origin;
    if (from && window.history.length > 1) router.back();
    else router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium backdrop-blur-xl transition",
        tone === "dark"
          ? "border-violet-300/30 bg-[#1b0d38]/70 text-white/90 hover:border-fuchsia-300/60 hover:bg-fuchsia-500/10 hover:text-white"
          : "border-[#8E7AB5]/25 bg-white/80 text-[#5B4B8A] hover:border-[#8E7AB5]/50 hover:bg-white",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
      {labelFor(origin, fallbackLabel)}
    </button>
  );
}
