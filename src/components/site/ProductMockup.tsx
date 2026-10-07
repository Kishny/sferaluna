// src/components/site/ProductMockup.tsx

/**
 * Aperçus du produit utilisés sur le site public.
 * Ils reprennent le vocabulaire visuel de l'espace connecté (/mon-compte)
 * pour que la visiteuse comprenne en 3 secondes comment fonctionne SferaLuna.
 */

import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CalendarDays,
  Compass,
  Heart,
  Home,
  MapPin,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SceneArt } from "./art";
import { IllustratedAvatar, cn } from "./ui";

const SIDEBAR = [
  { icon: Home, label: "Explorer", active: true },
  { icon: ShieldCheck, label: "Affinités" },
  { icon: MessageSquareText, label: "Messages", badge: 3 },
  { icon: CalendarDays, label: "LunaGather" },
  { icon: Sparkles, label: "VibePlanner" },
];

function MiniSidebar() {
  return (
    <div className="hidden w-[132px] shrink-0 flex-col gap-1 border-r border-violet-300/10 p-2.5 sm:flex">
      <div className="mb-3 flex items-center gap-1.5 px-1.5 pt-1">
        <span className="text-sm">🌙</span>
        <span className="text-[13px] font-semibold text-white">SferaLuna</span>
      </div>
      {SIDEBAR.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[10px]",
            item.active ? "bg-violet-500/25 text-white ring-1 ring-violet-300/25" : "text-white/65"
          )}
        >
          <item.icon className="h-3.5 w-3.5 shrink-0 text-violet-200" />
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge && (
            <span className="flex h-3.5 min-w-[0.875rem] items-center justify-center rounded-full bg-pink-500 px-1 text-[8px] font-bold text-white">
              {item.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MiniTopbar() {
  return (
    <div className="flex items-center gap-2 border-b border-violet-300/10 px-3 py-2.5">
      <div className="flex h-7 flex-1 items-center gap-1.5 rounded-lg border border-violet-300/15 bg-white/[0.04] px-2 text-[9px] text-white/45">
        <Search className="h-3 w-3" /> Rechercher des profils, intérêts, lieux…
        <span className="ml-auto rounded border border-white/15 px-1 text-[8px]">⌘K</span>
      </div>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-violet-300/15">
        <Bell className="h-3 w-3 text-white/70" />
        <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-pink-500" />
      </span>
      <IllustratedAvatar seed={2} size={26} ring={false} className="ring-1 ring-fuchsia-300/60" />
    </div>
  );
}

/**
 * Aperçu du Tableau de bord : Explorer librement en vedette,
 * Affinités et Messages à côté. Utilisé dans le hero de l'accueil.
 */
export function AppPreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-[26px] border border-violet-300/20 bg-[#150a2e]/90 p-1.5 shadow-[0_40px_120px_-30px_rgba(168,85,247,0.55)] ring-1 ring-white/5 backdrop-blur-xl",
        className
      )}
    >
      <div className="flex overflow-hidden rounded-[20px] border border-violet-300/10 bg-[#12081f]">
        <MiniSidebar />

        <div className="min-w-0 flex-1">
          <MiniTopbar />

          <div className="grid grid-cols-[1.35fr_1fr] gap-2.5 p-3">
            {/* Explorer librement — la carte vedette */}
            <div className="relative row-span-2 min-h-[230px] overflow-hidden rounded-2xl ring-2 ring-fuchsia-400/80 shadow-[0_0_30px_-4px_rgba(217,70,239,0.7)]">
              <SceneArt variant="river" seed={4} className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0633] via-[#1a0633]/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-white">Explorer librement</p>
                  <p className="mt-0.5 text-[9.5px] leading-snug text-white/75">
                    Découvrez des profils inspirants près de chez vous et ailleurs.
                  </p>
                </div>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/10">
                  <ArrowRight className="h-3.5 w-3.5 text-white" />
                </span>
              </div>
            </div>

            {/* Affinités de la semaine */}
            <div className="rounded-2xl border border-violet-300/15 bg-[#1b0d38] p-2.5">
              <div className="flex -space-x-2">
                {[0, 1, 2].map((i) => (
                  <IllustratedAvatar key={i} seed={i + 3} size={26} />
                ))}
                <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-violet-300/40 bg-[#1b0d38] text-[8px] font-semibold text-white/80">
                  +3
                </span>
              </div>
              <p className="mt-2 text-[12px] font-semibold text-white">Affinités de la semaine</p>
              <p className="text-[8.5px] leading-snug text-white/60">Des profils sélectionnés selon vos affinités.</p>
            </div>

            {/* Messages */}
            <div className="relative rounded-2xl border border-violet-300/15 bg-[#1b0d38] p-2.5">
              <span className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-[8px] font-bold text-white">
                3
              </span>
              <div className="flex items-center gap-1.5">
                <IllustratedAvatar seed={5} size={22} />
                <span className="h-3 w-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              </div>
              <p className="mt-2 text-[12px] font-semibold text-white">Messages</p>
              <p className="text-[8.5px] leading-snug text-white/60">Des conversations qui comptent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Aperçu "Explorer" (page Fonctionnalités)
// ─────────────────────────────────────────────

const PROFILES = [
  { name: "Camille", age: 32, city: "Paris", km: 2, tags: ["Art", "Voyages", "Cuisine"], seed: 0 },
  { name: "Inès", age: 35, city: "Lyon", km: 4, tags: ["Yoga", "Cinéma"], seed: 2 },
  { name: "Léa", age: 30, city: "Nantes", km: 6, tags: ["Randonnée", "Lecture"], seed: 5 },
];

/** Portrait stylisé plein cadre (pas de photo réelle). */
function PortraitArt({ seed, variant }: { seed: number; variant: "dusk" | "night" | "river" | "rooftop" }) {
  return (
    <div className="absolute inset-0">
      <SceneArt variant={variant} seed={seed + 8} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 flex justify-center">
        <IllustratedAvatar seed={seed} size={170} ring={false} className="translate-y-6 rounded-none opacity-90 [clip-path:ellipse(48%_50%_at_50%_55%)]" />
      </div>
    </div>
  );
}

export function ExplorePreview({ className = "" }: { className?: string }) {
  const [main, ...others] = PROFILES;

  return (
    <div
      className={cn(
        "relative rounded-[26px] border border-violet-300/20 bg-[#150a2e]/90 p-1.5 shadow-[0_40px_120px_-30px_rgba(168,85,247,0.55)] backdrop-blur-xl",
        className
      )}
    >
      <div className="flex overflow-hidden rounded-[20px] border border-violet-300/10 bg-[#12081f]">
        <MiniSidebar />
        <div className="min-w-0 flex-1">
          <MiniTopbar />
          <div className="grid grid-cols-[1.4fr_1fr] gap-2.5 p-3">
            <div className="relative min-h-[250px] overflow-hidden rounded-2xl ring-2 ring-fuchsia-400/70">
              <PortraitArt seed={main.seed} variant="dusk" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0633] via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="flex items-center gap-1.5 text-[15px] font-semibold text-white">
                  {main.name}, {main.age}
                  <BadgeCheck className="h-3.5 w-3.5 text-sky-300" />
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {main.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/10 px-2 py-0.5 text-[8.5px] text-white/85 ring-1 ring-white/15">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[9px] text-white/70">
                    <MapPin className="h-3 w-3" /> {main.city}, {main.km} km
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600">
                    <Heart className="h-3.5 w-3.5 fill-white text-white" />
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-rows-2 gap-2.5">
              {others.map((profile, i) => (
                <div key={profile.name} className="relative overflow-hidden rounded-2xl border border-violet-300/15">
                  <PortraitArt seed={profile.seed} variant={i ? "rooftop" : "night"} />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0633]/95 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-2">
                    <div>
                      <p className="text-[11px] font-semibold text-white">
                        {profile.name}, {profile.age}
                      </p>
                      <p className="text-[8px] text-white/65">
                        {profile.city}, {profile.km} km
                      </p>
                    </div>
                    <Heart className="h-4 w-4 text-pink-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <span className="absolute -left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-lg shadow-fuchsia-900/50 lg:flex">
        <Compass className="h-5 w-5 text-white" />
      </span>
    </div>
  );
}
