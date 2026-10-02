// src/app/not-found.tsx

/**
 * Page 404 : affichée pour toute adresse inconnue.
 * Illustration : public/images/404-bg.webp.
 */

import Link from "next/link";
import { Playfair_Display } from "next/font/google";
import { ArrowRight, ChevronRight, CircleHelp, Compass, Home, UserRound, type LucideIcon } from "lucide-react";

import Header from "@/components/Header";
import Footer from "@/components/Footer";

const serif = Playfair_Display({ subsets: ["latin"], weight: ["400", "500"], display: "swap" });

export const metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

const SHORTCUTS: { icon: LucideIcon; title: string; text: string; href: string }[] = [
  { icon: Home, title: "Accueil", text: "Retrouvez le point de départ de votre voyage.", href: "/" },
  { icon: CircleHelp, title: "FAQ", text: "Des réponses aux questions les plus fréquentes.", href: "/faq" },
  { icon: UserRound, title: "Mon compte", text: "Accédez à votre espace personnel en toute sécurité.", href: "/mon-compte" },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="relative isolate overflow-hidden bg-[#140a2e] text-white">
        {/* Illustration */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute inset-0 bg-cover bg-[position:72%_center] lg:bg-center" style={{ backgroundImage: "url(/images/404-bg.webp)" }} />
          <div className="absolute inset-0 bg-[#140a2e]/60 lg:bg-transparent lg:bg-gradient-to-r lg:from-[#140a2e]/80 lg:via-[#140a2e]/35 lg:to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#140a2e] to-transparent" />
        </div>

        <div className="mx-auto flex min-h-[100svh] w-full max-w-[1380px] flex-col px-4 pb-8 pt-28 sm:px-6 lg:pt-32">
          <div className="flex flex-1 items-center">
            <div className="w-full max-w-[640px] text-center lg:ml-[6%]">
              <p className={`${serif.className} relative mx-auto w-fit text-[120px] font-medium leading-none tracking-tight sm:text-[190px]`}>
                <span className="sr-only">Erreur 404</span>
                <span aria-hidden className="bg-gradient-to-b from-pink-200 via-fuchsia-300 to-violet-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(240,171,252,0.45)]">
                  404
                </span>
                {/* Orbite */}
                <svg aria-hidden viewBox="0 0 400 200" className="pointer-events-none absolute -inset-x-[14%] -inset-y-[6%] h-[112%] w-[128%]" fill="none">
                  <ellipse cx="200" cy="100" rx="190" ry="70" stroke="#e9c6ff" strokeOpacity="0.45" strokeWidth="1" transform="rotate(-10 200 100)" />
                  <path d="M352 22 l3 9 9 3 -9 3 -3 9 -3 -9 -9 -3 9 -3z" fill="#fff" />
                  <path d="M28 128 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff" />
                </svg>
              </p>

              <h1 className={`${serif.className} mt-2 text-3xl leading-tight text-pink-100 sm:text-[44px]`}>
                Oups… cette page s’est perdue
                <br className="hidden sm:block" /> dans la nuit.
              </h1>
              <p className="mx-auto mt-4 max-w-[540px] text-base leading-relaxed text-white/90 drop-shadow-[0_1px_8px_rgba(20,10,46,1)] sm:text-lg">
                Il semble que cette page n’existe pas ou qu’elle ait été déplacée vers une autre constellation.
              </p>

              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-5">
                <Link
                  href="/"
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-fuchsia-300 via-fuchsia-400 to-violet-400 px-9 text-base font-semibold text-[#2a1158] shadow-[0_0_40px_-6px_rgba(232,121,249,0.9)] ring-1 ring-white/50 transition hover:brightness-105 sm:w-auto"
                >
                  <Home className="h-5 w-5" /> Retour à l’accueil
                </Link>
                <Link
                  href="/fonctionnalites"
                  className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/55 bg-[#140a2e]/40 px-9 text-base font-medium text-white backdrop-blur transition hover:border-fuchsia-300 hover:bg-fuchsia-500/10 sm:w-auto"
                >
                  <Compass className="h-5 w-5" /> Explorer SferaLuna
                </Link>
              </div>

              <Link href="/contact" className="mt-6 inline-flex items-center gap-3 text-base text-white/85 underline decoration-white/40 underline-offset-4 hover:text-white">
                Contacter le support <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Raccourcis */}
          <nav aria-label="Raccourcis" className="mt-10 grid gap-3 md:grid-cols-3 md:gap-5">
            {SHORTCUTS.map(({ icon: Icon, title, text, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex items-center gap-5 rounded-3xl border border-violet-200/25 bg-[#1a0f3a]/75 p-5 backdrop-blur-xl transition hover:border-fuchsia-300/60 sm:p-6"
              >
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-fuchsia-200/40 bg-gradient-to-b from-fuchsia-400/30 to-violet-600/20 shadow-[0_0_24px_-6px_rgba(232,121,249,0.8)] sm:h-20 sm:w-20">
                  <Icon className="h-6 w-6 text-pink-100 sm:h-8 sm:w-8" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`${serif.className} block text-xl text-pink-100`}>{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-white/75">{text}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-white/80 transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}
