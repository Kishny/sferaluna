// src/app/cookies/page.tsx

"use client";

/**
 * Politique des cookies + réglages.
 *
 * Les interrupteurs écrivent le même choix que le bandeau de consentement
 * (useCookieConsent). La catégorie « analytiques » est réellement appliquée
 * par <ConsentAnalytics /> dans le layout racine.
 *
 * Le contenu décrit ce que le site dépose vraiment : à tenir à jour si un
 * nouvel outil (mesure d'audience, publicité…) est ajouté.
 */

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Clock,
  Cookie,
  Database,
  Globe,
  Lightbulb,
  Lock,
  Mail,
  MegaphoneOff,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { useCookieConsent } from "@/hooks/useCookieConsent";
import { SiteShell } from "@/components/site/sections";
import { BAND_GHOST, BAND_PRIMARY, CtaBand, PageBody, PageHero, PANEL, PhotoBackdrop, Pink, TILE } from "@/components/site/pagekit";
import { cn } from "@/components/site/ui";

const UPDATED = "2 octobre 2026";
const CONTACT = "contact@sferaluna.com";

type Key = "personalization" | "analytics";

const KINDS: { icon: LucideIcon; title: string; badge: string; text: string; duration: string; key?: Key }[] = [
  {
    icon: ShieldCheck,
    title: "Cookies d’authentification",
    badge: "Essentiels",
    text: "Nécessaires à la connexion sécurisée et au bon fonctionnement du site : ils maintiennent ta session ouverte.",
    duration: "30 jours maximum",
  },
  {
    icon: Settings,
    title: "Préférences",
    badge: "Fonctionnels",
    text: "Mémorisent sur ton appareil tes choix d’interface et ton choix concernant les cookies.",
    duration: "jusqu’à effacement",
    key: "personalization",
  },
  {
    icon: BarChart3,
    title: "Mesure d’audience",
    badge: "Analytiques",
    text: "Nous aide à comprendre comment la plateforme est utilisée, de façon anonyme et sans déposer de cookie.",
    duration: "aucun cookie déposé",
    key: "analytics",
  },
];

const BROWSERS = [
  { name: "Google Chrome", href: "https://support.google.com/chrome/answer/95647?hl=fr" },
  { name: "Mozilla Firefox", href: "https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox" },
  { name: "Safari", href: "https://support.apple.com/fr-fr/guide/safari/sfri11471/mac" },
];

function Switch({ checked, onChange, disabled, label }: { checked: boolean; onChange?: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300",
        checked ? "bg-gradient-to-r from-fuchsia-500 to-violet-500" : "bg-white/15",
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <span className={cn("absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-6" : "left-1")} />
    </button>
  );
}

export default function CookiesPage() {
  const { mounted, hasConsented, preferences, savePreferences } = useCookieConsent();

  // La mesure d'audience (anonyme, sans cookie) est active tant qu'elle n'a
  // pas été refusée ; les préférences ne le sont qu'après accord.
  const current: Record<Key, boolean> = {
    analytics: hasConsented ? preferences.analytics : true,
    personalization: preferences.personalization,
  };

  const set = (key: Key, value: boolean) =>
    savePreferences({
      ...current,
      marketing: false, // aucun cookie publicitaire sur SferaLuna
      [key]: value,
    });

  const isOn = (key: Key) => mounted && current[key];

  return (
    <SiteShell back moon={false}>
      <PageBody>
        <PhotoBackdrop src="/images/guide-accessibilite-bg.webp" />

        <PageHero
          scene={false}
          id="ck"
          pill="Politique des cookies"
          pillIcon={Cookie}
          title={
            <>
              Utilisation des <Pink>cookies</Pink>
            </>
          }
          text="Les cookies nous aident à faire fonctionner SferaLuna et à comprendre comment la plateforme est utilisée. Tu gardes la main sur tout ce qui n’est pas indispensable."
          note={
            <>
              Une expérience plus claire,
              <br />
              pour une confiance durable ♡
            </>
          }
        >
          <p className="mt-3 text-sm text-white/60">Dernière mise à jour : {UPDATED}</p>
        </PageHero>

        {/* Repères */}
        <div className={cn(PANEL, "!mt-8 grid gap-4 p-4 sm:grid-cols-3 sm:divide-x sm:divide-violet-300/15 lg:ml-auto lg:max-w-3xl")}>
          {[
            { icon: Database, title: "3 catégories", text: "Essentiels, fonctionnels et analytiques" },
            { icon: MegaphoneOff, title: "Sans publicité", text: "Aucun cookie publicitaire ni revente de données" },
            { icon: Lock, title: "Ton choix", text: "Modifiable à tout moment sur cette page" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 sm:pl-4 sm:first:pl-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/20">
                <Icon className="h-5 w-5 text-fuchsia-300" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs leading-snug text-white/65">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* À retenir */}
        <div className={cn(PANEL, "flex items-start gap-4 bg-gradient-to-r from-[#2a1158]/85 to-[#1b0d38]/85 p-5")}>
          <Lightbulb className="mt-0.5 h-8 w-8 shrink-0 text-amber-300" />
          <div>
            <h2 className="text-lg font-bold text-white">À retenir</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/75">
              Les cookies essentiels permettent le bon fonctionnement de SferaLuna et te donnent accès à ton compte : ils ne peuvent pas être désactivés. Le reste est facultatif : tu peux
              l’activer ou le couper ci-dessous, sans conséquence sur ton compte.
            </p>
          </div>
        </div>

        {/* Catégories */}
        <div className="grid gap-3 lg:grid-cols-3">
          {KINDS.map(({ icon: Icon, title, badge, text, duration, key }) => (
            <article key={title} className={cn(PANEL, "flex flex-col p-5")}>
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-500/20 ring-1 ring-fuchsia-300/30">
                  <Icon className="h-6 w-6 text-fuchsia-300" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold text-white">{title}</h2>
                    <span className="rounded-full bg-fuchsia-500/25 px-3 py-0.5 text-xs font-medium text-fuchsia-100 ring-1 ring-fuchsia-300/30">{badge}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/70">{text}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-1 flex-wrap items-end justify-between gap-3 text-sm text-white/75">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/60" /> Durée : {duration}
                </span>
                {key ? (
                  <span className="flex items-center gap-2.5">
                    <Switch checked={isOn(key)} onChange={(v) => set(key, v)} label={title} />
                    {isOn(key) ? "Activé" : "Désactivé"}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-300">
                    <Check className="h-4 w-4" /> Toujours activés
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Explications + réglages */}
        <div className="grid gap-3 lg:grid-cols-3">
          <article className={cn(PANEL, "p-5")}>
            <h2 className="flex items-center gap-3 text-lg font-bold text-white">
              <Cookie className="h-6 w-6 text-amber-300" /> Qu’est-ce qu’un cookie ?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Un cookie est un petit fichier texte déposé sur ton appareil lors de ta visite sur SferaLuna. Il permet de mémoriser certaines informations, comme ta session ou tes préférences,
              afin de sécuriser ta connexion et de simplifier ta navigation.
            </p>
            <a
              href="https://www.cnil.fr/fr/cookies-et-autres-traceurs"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-violet-300/30 px-4 text-sm text-white transition hover:border-fuchsia-300/60"
            >
              En savoir plus (CNIL) <ArrowRight className="h-4 w-4" />
            </a>
          </article>

          <article id="gestion" className={cn(PANEL, "scroll-mt-28 p-5")}>
            <h2 className="flex items-center gap-3 text-lg font-bold text-white">
              <Settings className="h-6 w-6 text-fuchsia-300" /> Gestion des cookies
            </h2>
            <p className="mt-1.5 text-sm text-white/70">Ton choix est enregistré dès que tu modifies un réglage.</p>
            <ul className="mt-4 space-y-2">
              <li className={cn(TILE, "flex items-center gap-3 px-4 py-3")}>
                <ShieldCheck className="h-5 w-5 shrink-0 text-fuchsia-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">Cookies essentiels</span>
                  <span className="block text-xs text-white/55">Toujours actifs (nécessaires au fonctionnement)</span>
                </span>
                <Switch checked disabled label="Cookies essentiels" />
              </li>
              <li className={cn(TILE, "flex items-center gap-3 px-4 py-3")}>
                <SlidersHorizontal className="h-5 w-5 shrink-0 text-fuchsia-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">Préférences</span>
                  <span className="block text-xs text-white/55">Améliorent ton expérience</span>
                </span>
                <Switch checked={isOn("personalization")} onChange={(v) => set("personalization", v)} label="Préférences" />
              </li>
              <li className={cn(TILE, "flex items-center gap-3 px-4 py-3")}>
                <BarChart3 className="h-5 w-5 shrink-0 text-fuchsia-300" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">Mesure d’audience</span>
                  <span className="block text-xs text-white/55">Nous aide à améliorer la plateforme</span>
                </span>
                <Switch checked={isOn("analytics")} onChange={(v) => set("analytics", v)} label="Mesure d’audience" />
              </li>
            </ul>
          </article>

          <article className={cn(PANEL, "p-5")}>
            <h2 className="flex items-center gap-3 text-lg font-bold text-white">
              <Globe className="h-6 w-6 text-fuchsia-300" /> Réglages navigateur
            </h2>
            <p className="mt-1.5 text-sm text-white/70">Tu peux aussi gérer ou effacer les cookies directement depuis ton navigateur.</p>
            <ul className="mt-4 space-y-2">
              {BROWSERS.map(({ name, href }) => (
                <li key={name}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className={cn(TILE, "flex items-center gap-3 px-4 py-3 transition hover:border-fuchsia-300/45")}>
                    <Globe className="h-5 w-5 shrink-0 text-white/70" />
                    <span className="min-w-0 flex-1 text-sm font-medium text-white">{name}</span>
                    <span className="flex items-center gap-1.5 text-xs text-pink-300">
                      Accéder au guide <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <CtaBand title="Une question sur notre utilisation des cookies ?" text="Notre équipe est là pour t’aider et répondre à toutes tes questions.">
          <a href={`mailto:${CONTACT}`} className={BAND_GHOST}>
            <Mail className="h-5 w-5 text-fuchsia-300" /> {CONTACT}
          </a>
          <a href="#gestion" className={BAND_PRIMARY}>
            Gérer mes préférences <ArrowRight className="h-4 w-4" />
          </a>
          <Link href="/" className={BAND_GHOST}>
            Retour à l’accueil
          </Link>
        </CtaBand>
      </PageBody>
    </SiteShell>
  );
}
