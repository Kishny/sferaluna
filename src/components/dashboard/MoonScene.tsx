// src/components/dashboard/MoonScene.tsx

/**
 * Illustration du hero : pleine lune violette au-dessus de montagnes,
 * ciel étoilé. 100 % SVG (aucune image à charger, CSP-safe).
 */

const STARS: [number, number, number][] = [
  [40, 30, 1.1], [95, 62, 0.8], [150, 18, 1.3], [210, 48, 0.7], [262, 14, 1],
  [318, 40, 0.9], [372, 22, 1.2], [430, 58, 0.8], [488, 26, 1.1], [540, 44, 0.7],
  [596, 16, 1], [650, 52, 0.9], [120, 96, 0.6], [470, 100, 0.7], [610, 92, 0.6],
  [70, 120, 0.8], [690, 30, 1.2], [20, 70, 0.7],
];

export default function MoonScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 720 230"
      className={className}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dash-moon" cx="42%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#fbe7ff" />
          <stop offset="35%" stopColor="#e3a6ff" />
          <stop offset="70%" stopColor="#b064f5" />
          <stop offset="100%" stopColor="#7a2fd6" />
        </radialGradient>

        <radialGradient id="dash-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d58cff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#a855f7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="dash-mnt-back" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b2aa6" />
          <stop offset="100%" stopColor="#2a1160" />
        </linearGradient>

        <linearGradient id="dash-mnt-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#40197f" />
          <stop offset="100%" stopColor="#1f0c48" />
        </linearGradient>

        <linearGradient id="dash-mnt-front" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a0f5c" />
          <stop offset="100%" stopColor="#170836" />
        </linearGradient>

        <linearGradient id="dash-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="72%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="dash-fade-x" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="18%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="1" />
        </linearGradient>

        {/* Fondu bas + gauche : la scène se dissout dans le fond de page. */}
        <mask id="dash-mask" maskContentUnits="userSpaceOnUse">
          <rect x="0" y="0" width="720" height="230" fill="url(#dash-fade)" />
        </mask>
        <mask id="dash-mask-x" maskContentUnits="userSpaceOnUse">
          <rect x="0" y="0" width="720" height="230" fill="url(#dash-fade-x)" />
        </mask>
      </defs>

      <g mask="url(#dash-mask-x)">
      <g mask="url(#dash-mask)">

      {/* Étoiles */}
      {STARS.map(([x, y, r], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={r}
          fill="#f5e8ff"
          opacity={0.35 + (i % 4) * 0.15}
        />
      ))}

      {/* Halo + lune */}
      <circle cx="380" cy="120" r="150" fill="url(#dash-halo)" />
      <circle cx="380" cy="120" r="66" fill="url(#dash-moon)" />
      <g fill="#8b3fe0" opacity="0.28">
        <ellipse cx="356" cy="98" rx="13" ry="10" />
        <ellipse cx="404" cy="132" rx="17" ry="12" />
        <ellipse cx="372" cy="150" rx="8" ry="6" />
        <ellipse cx="410" cy="94" rx="6" ry="5" />
        <ellipse cx="340" cy="130" rx="7" ry="5" />
      </g>

      {/* Montagnes */}
      <path
        d="M0 196 L70 150 L120 172 L190 118 L240 150 L300 104 L350 148 L410 120 L470 158 L540 110 L600 146 L660 122 L720 150 L720 230 L0 230 Z"
        fill="url(#dash-mnt-back)"
        opacity="0.85"
      />
      <path
        d="M0 210 L60 176 L110 196 L170 150 L230 190 L290 160 L340 186 L400 150 L460 192 L520 158 L590 188 L650 162 L720 186 L720 230 L0 230 Z"
        fill="url(#dash-mnt-mid)"
      />
      <path
        d="M0 222 L80 198 L150 214 L220 190 L300 216 L380 196 L450 218 L530 194 L610 216 L680 200 L720 212 L720 230 L0 230 Z"
        fill="url(#dash-mnt-front)"
      />
      </g>
      </g>
    </svg>
  );
}
