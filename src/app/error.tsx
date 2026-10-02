// src/app/error.tsx

"use client";

/**
 * Page d'erreur : affichée quand une page plante pendant son affichage.
 * Propose de réessayer sans quitter le site.
 */

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#140a2e] px-4 text-center text-white">
      <div className="w-full max-w-lg rounded-3xl border border-violet-200/25 bg-[#1a0f3a]/80 p-8">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-fuchsia-300">Une erreur est survenue</p>
        <h1 className="mt-3 text-3xl font-bold">Cette page n’a pas pu s’afficher.</h1>
        <p className="mt-3 text-white/75">Le problème vient de notre côté. Réessayez dans un instant ; si cela continue, écrivez-nous depuis la page Contact.</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-400 px-7 font-semibold text-[#2a1158] transition hover:brightness-105"
          >
            <RotateCcw className="h-4 w-4" /> Réessayer
          </button>
          <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/45 px-7 font-medium transition hover:border-fuchsia-300">
            <Home className="h-4 w-4" /> Retour à l’accueil
          </Link>
        </div>
        {error.digest && <p className="mt-5 text-xs text-white/40">Référence : {error.digest}</p>}
      </div>
    </main>
  );
}
