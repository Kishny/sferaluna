// src/components/site/art.tsx

/**
 * Illustrations vectorielles de l'univers SferaLuna :
 * ciel nocturne, lune, ville illuminée, petites scènes pour les cartes.
 *
 * 100 % SVG, déterministe (pas de Math.random au rendu → pas de souci
 * d'hydratation), aucune image externe (compatible CSP).
 */

import type { ReactElement } from "react";

import { cn } from "./ui";

// ─────────────────────────────────────────────
// Générateur pseudo-aléatoire déterministe
// ─────────────────────────────────────────────

function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

// ─────────────────────────────────────────────
// Silhouette de ville
// ─────────────────────────────────────────────

type SkylineProps = {
  seed?: number;
  width?: number;
  height?: number;
  fill: string;
  windowColor?: string;
  windowDensity?: number;
  landmarks?: boolean;
};

/** Retourne les éléments SVG d'une ligne de toits (à placer dans un <svg>). */
function SkylineShapes({
  seed = 7,
  width = 1600,
  height = 260,
  fill,
  windowColor = "#ffcf8a",
  windowDensity = 0.35,
  landmarks = true,
}: SkylineProps) {
  const rand = rng(seed);
  const shapes: ReactElement[] = [];
  const windows: ReactElement[] = [];
  let x = -20;
  let i = 0;

  while (x < width + 20) {
    const w = 26 + rand() * 60;
    const h = height * (0.22 + rand() * 0.45);
    const top = height - h;
    const kind = rand();

    shapes.push(<rect key={`b${i}`} x={x} y={top} width={w} height={h + 2} />);

    // Toits : dôme, flèche ou toit pentu, pour un air de vieille ville.
    if (landmarks && kind > 0.86) {
      const r = w / 2;
      shapes.push(
        <path key={`d${i}`} d={`M${x} ${top} A ${r} ${r * 1.1} 0 0 1 ${x + w} ${top} Z`} />
      );
      shapes.push(
        <rect key={`dl${i}`} x={x + r - 1.5} y={top - r * 1.1 - 16} width={3} height={18} />
      );
    } else if (landmarks && kind > 0.74) {
      const cx = x + w / 2;
      shapes.push(
        <path key={`s${i}`} d={`M${x + w * 0.2} ${top} L${cx} ${top - h * 0.7} L${x + w * 0.8} ${top} Z`} />
      );
    } else if (kind > 0.5) {
      shapes.push(
        <path key={`r${i}`} d={`M${x - 2} ${top} L${x + w / 2} ${top - 14 - rand() * 12} L${x + w + 2} ${top} Z`} />
      );
    }

    // Fenêtres allumées
    const cols = Math.max(1, Math.floor(w / 11));
    const rows = Math.max(1, Math.floor(h / 16));
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        if (rand() < windowDensity) {
          windows.push(
            <rect
              key={`w${i}-${c}-${r}`}
              x={x + 5 + c * 11}
              y={top + 8 + r * 16}
              width={4}
              height={6}
              rx={0.8}
              opacity={0.45 + rand() * 0.55}
            />
          );
        }
      }
    }

    x += w + rand() * 4;
    i++;
  }

  return (
    <>
      <g fill={fill}>{shapes}</g>
      <g fill={windowColor}>{windows}</g>
    </>
  );
}

// ─────────────────────────────────────────────
// Étoiles
// ─────────────────────────────────────────────

function Stars({ seed = 3, count = 90, width = 1600, height = 600 }: { seed?: number; count?: number; width?: number; height?: number }) {
  const rand = rng(seed);
  return (
    <g fill="#f6ecff">
      {Array.from({ length: count }).map((_, i) => (
        <circle
          key={i}
          cx={rand() * width}
          cy={rand() * height}
          r={0.5 + rand() * 1.3}
          opacity={0.25 + rand() * 0.75}
        />
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────
// Décor de page : ciel + lune + ville
// ─────────────────────────────────────────────

/**
 * Grand décor nocturne placé en haut des pages publiques.
 * S'estompe vers le fond de page (#12081f).
 */
export function NightBackdrop({ className = "", moon = true }: { className?: string; moon?: boolean }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] overflow-hidden", className)} aria-hidden>
      {/* Ciel */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_20%,#4c1d95_0%,#2a1052_35%,#150a2e_70%,#12081f_100%)]" />

      <svg viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMin slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="nb-moon" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#fff5ff" />
            <stop offset="45%" stopColor="#f0c6ff" />
            <stop offset="100%" stopColor="#b86cf0" />
          </radialGradient>
          <radialGradient id="nb-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e9b6ff" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#c084fc" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="nb-haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="nb-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#12081f" stopOpacity="0" />
            <stop offset="100%" stopColor="#12081f" stopOpacity="1" />
          </linearGradient>
          <radialGradient id="nb-lantern" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffb86b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nb-bloom" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#be185d" stopOpacity="0.2" />
          </radialGradient>
        </defs>

        <Stars count={140} height={620} />

        {moon && (
          <g>
            <circle cx="1400" cy="150" r="170" fill="url(#nb-halo)" />
            <circle cx="1400" cy="150" r="52" fill="url(#nb-moon)" />
            <g fill="#b56be8" opacity="0.25">
              <circle cx="1385" cy="135" r="9" />
              <circle cx="1418" cy="165" r="12" />
              <circle cx="1392" cy="178" r="5" />
            </g>
          </g>
        )}

        {/* Ville lointaine */}
        <g transform="translate(0 700)" opacity="0.5">
          <SkylineShapes seed={11} height={200} fill="#3b1a6b" windowColor="#ffd9a6" windowDensity={0.12} />
        </g>
        {/* Brume dorée des lumières */}
        <rect x="0" y="700" width="1600" height="240" fill="url(#nb-haze)" />
        {/* Ville proche */}
        <g transform="translate(0 790)" opacity="0.85">
          <SkylineShapes seed={29} height={170} fill="#1d0b3a" windowColor="#ffbf73" windowDensity={0.2} />
        </g>

        {/* Lanternes & fleurs dans les coins */}
        <circle cx="70" cy="760" r="120" fill="url(#nb-lantern)" />
        <circle cx="1540" cy="820" r="140" fill="url(#nb-lantern)" />
        {[
          [40, 90], [80, 140], [30, 210], [120, 60], [150, 190], [1560, 250], [1520, 320], [1575, 400],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={7 + (i % 3) * 3} fill="url(#nb-bloom)" opacity={0.55} />
        ))}

        <rect x="0" y="760" width="1600" height="340" fill="url(#nb-fade)" />
      </svg>
    </div>
  );
}

/** Lueur de ville en bas de page (derrière le CTA final). */
export function CityGlow({ className = "" }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[420px] overflow-hidden", className)} aria-hidden>
      <svg viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="cg-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#12081f" stopOpacity="1" />
            <stop offset="45%" stopColor="#12081f" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="cg-glow" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#a21caf" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#a21caf" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="420" fill="url(#cg-glow)" />
        <g transform="translate(0 220)" opacity="0.9">
          <SkylineShapes seed={53} height={200} fill="#1a0a33" windowColor="#ffc47d" windowDensity={0.28} />
        </g>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────
// Petites scènes pour les cartes
// ─────────────────────────────────────────────

export type SceneVariant = "night" | "dusk" | "rooftop" | "hills" | "river" | "map";

const SKIES: Record<SceneVariant, [string, string, string]> = {
  night: ["#1e0b44", "#5b21b6", "#c026d3"],
  dusk: ["#3b0764", "#be185d", "#fb923c"],
  rooftop: ["#2e1065", "#9d174d", "#f97316"],
  hills: ["#4c1d95", "#db2777", "#fdba74"],
  river: ["#170a3a", "#6d28d9", "#e879f9"],
  map: ["#140829", "#1e1045", "#2a1458"],
};

/**
 * Vignette illustrée (remplace les photos des maquettes).
 * Remplit son conteneur : donner une hauteur au parent.
 */
export function SceneArt({
  variant = "night",
  seed = 1,
  className = "",
}: {
  variant?: SceneVariant;
  seed?: number;
  className?: string;
}) {
  const [top, mid, bottom] = SKIES[variant];
  const gid = `sc-${variant}-${seed}`;

  if (variant === "map") {
    const rand = rng(seed + 100);
    return (
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden>
        <rect width="400" height="240" fill={top} />
        <g stroke="#6d28d9" strokeOpacity="0.35" fill="none">
          {Array.from({ length: 9 }).map((_, i) => (
            <path key={i} d={`M${-20 + i * 50} 0 Q ${40 + i * 45} 120 ${-10 + i * 52} 240`} strokeWidth={i % 3 === 0 ? 3 : 1} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <path key={`h${i}`} d={`M0 ${20 + i * 42} Q 200 ${rand() * 60 + i * 38} 400 ${30 + i * 40}`} strokeWidth={i % 2 ? 1 : 2} />
          ))}
        </g>
        <path d="M0 170 Q 120 140 220 175 T 400 150 L400 200 Q 300 215 200 200 T 0 215 Z" fill="#7c3aed" opacity="0.25" />
        {[[90, 70], [250, 60], [320, 150], [150, 170]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <circle r="16" fill="#e879f9" opacity="0.18" />
            <path d="M0 -12 C 7 -12 10 -6 10 -2 C 10 5 0 12 0 12 C 0 12 -10 5 -10 -2 C -10 -6 -7 -12 0 -12 Z" fill="#e879f9" />
            <circle cy="-3" r="3.5" fill="#fff" />
          </g>
        ))}
      </svg>
    );
  }

  const sun = variant === "dusk" || variant === "hills" || variant === "rooftop";

  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMax slice" className={cn("h-full w-full", className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="60%" stopColor={mid} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
        <radialGradient id={`${gid}-l`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={sun ? "#fed7aa" : "#fae8ff"} />
          <stop offset="100%" stopColor={sun ? "#fb923c" : "#d8b4fe"} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="240" fill={`url(#${gid})`} />
      <Stars seed={seed + 20} count={variant === "night" || variant === "river" ? 40 : 12} width={400} height={120} />
      <circle cx={sun ? 200 : 300} cy={sun ? 150 : 55} r={sun ? 70 : 38} fill={`url(#${gid}-l)`} />
      <circle cx={sun ? 200 : 300} cy={sun ? 150 : 55} r={sun ? 26 : 15} fill={sun ? "#fff1dc" : "#fdf4ff"} opacity={0.95} />

      {variant === "hills" ? (
        <>
          <path d="M0 175 Q 90 120 180 160 T 400 140 L400 240 L0 240 Z" fill="#581c87" opacity="0.85" />
          <path d="M0 205 Q 120 165 240 195 T 400 185 L400 240 L0 240 Z" fill="#2e1065" />
        </>
      ) : (
        <g transform="translate(0 110) scale(0.25 0.5)">
          <SkylineShapes seed={seed * 7 + 3} height={260} fill={variant === "river" ? "#1a0836" : "#24093f"} windowColor="#ffc47d" windowDensity={0.35} />
        </g>
      )}

      {variant === "river" && (
        <>
          <rect x="0" y="205" width="400" height="35" fill="#2e1065" />
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={i} x={20 + i * 27} y={212 + (i % 3) * 7} width={14} height={1.6} fill="#ffc47d" opacity={0.5} />
          ))}
        </>
      )}

      {variant === "rooftop" && (
        <g>
          <path d="M0 40 Q 100 75 200 45 T 400 50" fill="none" stroke="#fde68a" strokeOpacity="0.4" />
          {Array.from({ length: 16 }).map((_, i) => (
            <circle key={i} cx={i * 26 + 6} cy={40 + Math.sin(i / 2) * 14 + (i % 2) * 4} r={2.4} fill="#fde68a" />
          ))}
          <rect x="0" y="222" width="400" height="18" fill="#1a0826" />
        </g>
      )}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Grand horizon lunaire (pages d'authentification)
// ─────────────────────────────────────────────

/**
 * Scène plein écran : grande lune rose-lavande qui se lève derrière des
 * collines, lumières de ville au loin, lanternes et fleurs au premier plan.
 */
export function MoonHorizon({ className = "", fixed = false }: { className?: string; fixed?: boolean }) {
  const rand = rng(77);
  const blooms = Array.from({ length: 70 }).map(() => ({
    x: rand() * 1600,
    y: 880 + rand() * 120,
    r: 2 + rand() * 4,
    o: 0.35 + rand() * 0.5,
  }));

  return (
    <div className={cn("pointer-events-none inset-0 -z-10 overflow-hidden", fixed ? "fixed" : "absolute", className)} aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_52%_62%,#6d28d9_0%,#3b1275_30%,#1c0a3d_62%,#12081f_100%)]" />
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="mh-moon" cx="42%" cy="38%" r="68%">
            <stop offset="0%" stopColor="#ffe4f6" />
            <stop offset="40%" stopColor="#f5b3e6" />
            <stop offset="75%" stopColor="#c77dea" />
            <stop offset="100%" stopColor="#8b46d6" />
          </radialGradient>
          <radialGradient id="mh-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f0abfc" stopOpacity="0.5" />
            <stop offset="45%" stopColor="#c026d3" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mh-hill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b2a9a" />
            <stop offset="100%" stopColor="#2a1158" />
          </linearGradient>
          <linearGradient id="mh-hill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2c0f57" />
            <stop offset="100%" stopColor="#170733" />
          </linearGradient>
          <radialGradient id="mh-lantern" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffbf73" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ff8a3d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mh-shoot" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <Stars seed={91} count={170} height={620} />
        {/* Étoile filante */}
        <path d="M760 90 L860 150" stroke="url(#mh-shoot)" strokeWidth="2" strokeLinecap="round" />
        <circle cx="860" cy="150" r="3" fill="#fff" />

        {/* Lune */}
        <circle cx="820" cy="560" r="400" fill="url(#mh-halo)" />
        <circle cx="820" cy="560" r="190" fill="url(#mh-moon)" />
        <g fill="#b25ad6" opacity="0.22">
          <circle cx="770" cy="490" r="30" />
          <circle cx="880" cy="530" r="40" />
          <circle cx="815" cy="615" r="21" />
          <circle cx="920" cy="450" r="16" />
          <circle cx="720" cy="585" r="18" />
        </g>

        {/* Collines lointaines + lumières */}
        <path d="M0 640 C 180 560 320 600 470 590 C 640 575 760 640 900 650 C 1080 660 1220 580 1380 600 C 1480 612 1560 590 1600 600 L1600 1000 L0 1000 Z" fill="url(#mh-hill1)" opacity="0.9" />
        <g transform="translate(250 650) scale(0.7 0.35)" opacity="0.9">
          <SkylineShapes seed={5} height={180} fill="#3a1670" windowColor="#ffcf8a" windowDensity={0.35} />
        </g>
        <path d="M0 712 C 220 690 380 725 560 708 C 760 690 900 740 1080 730 C 1260 720 1420 690 1600 705 L1600 1000 L0 1000 Z" fill="url(#mh-hill2)" />

        {/* Fleurs du premier plan */}
        {blooms.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={i % 3 ? "#f472b6" : "#e879f9"} opacity={b.o} />
        ))}

        {/* Lanternes */}
        {[[70, 900], [150, 820], [1520, 880], [1440, 800]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={70} fill="url(#mh-lantern)" />
            <rect x={x - 9} y={y - 14} width={18} height={26} rx={4} fill="#ffcf8a" opacity={0.9} />
          </g>
        ))}
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#12081f] to-transparent" />
    </div>
  );
}
