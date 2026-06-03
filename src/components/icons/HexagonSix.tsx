// src/components/icons/HexagonSix.tsx
// Icône custom Circle of Six — hexagone avec 6 points aux sommets

interface HexagonSixProps {
  size?: number;
  className?: string;
}

export default function HexagonSix({ size = 32, className = "" }: HexagonSixProps) {
  // Hexagone flat-top centré sur (50, 50), rayon 38
  // Les 6 sommets d'un hexagone flat-top : angles 0°, 60°, 120°, 180°, 240°, 300°
  const cx = 50;
  const cy = 50;
  const r = 36;
  const dotR = 5.5;

  const vertices = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy-top
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  });

  const hexPath = vertices
    .map((v, i) => `${i === 0 ? "M" : "L"} ${v.x.toFixed(2)} ${v.y.toFixed(2)}`)
    .join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Dégradé hexagone */}
      <defs>
        <linearGradient id="hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E7AB5" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#D9B8FF" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="hex-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E7AB5" />
          <stop offset="100%" stopColor="#D9B8FF" />
        </linearGradient>
        <linearGradient id="dot-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E7AB5" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        {/* Lignes de connexion dégradé */}
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8E7AB5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#D9B8FF" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Fond hexagone */}
      <path d={hexPath} fill="url(#hex-grad)" stroke="url(#hex-stroke)" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Lignes reliant les sommets opposés (3 diagonales) */}
      {[
        [vertices[0], vertices[3]],
        [vertices[1], vertices[4]],
        [vertices[2], vertices[5]],
      ].map(([a, b], i) => (
        <line
          key={i}
          x1={a.x.toFixed(2)} y1={a.y.toFixed(2)}
          x2={b.x.toFixed(2)} y2={b.y.toFixed(2)}
          stroke="url(#line-grad)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
        />
      ))}

      {/* Centre */}
      <circle cx={cx} cy={cy} r="3.5" fill="url(#dot-grad)" opacity="0.6" />

      {/* 6 points aux sommets — représentent les 6 profils */}
      {vertices.map((v, i) => (
        <circle
          key={i}
          cx={v.x.toFixed(2)}
          cy={v.y.toFixed(2)}
          r={dotR}
          fill="url(#dot-grad)"
        />
      ))}
    </svg>
  );
}
