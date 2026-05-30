type Pin = { x: number; y: number };

const PINS: Pin[] = [
  { x: 48, y: 38 },
  { x: 22, y: 42 },
  { x: 68, y: 72 },
  { x: 72, y: 28 },
  { x: 55, y: 58 },
];

export default function UkraineMapBanner({ compact = false }: { compact?: boolean }) {
  return (
    <svg viewBox="0 0 200 140" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="uaFillHero" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ecfdf3" />
          <stop offset="100%" stopColor="#d1fae5" />
        </linearGradient>
      </defs>
      <path
        fill="url(#uaFillHero)"
        stroke="#008a4a"
        strokeWidth={compact ? 1 : 1.2}
        d="M18 52 L28 38 L42 32 L58 28 L78 24 L98 22 L118 26 L138 32 L152 42 L162 58 L168 72 L164 88 L152 98 L138 108 L118 114 L98 116 L78 112 L58 104 L42 92 L28 78 L20 64 Z"
      />
      {PINS.map((pin, i) => (
        <g key={i}>
          <circle cx={pin.x} cy={pin.y} r="5" fill="#008a4a" opacity="0.2" />
          <circle cx={pin.x} cy={pin.y} r="2.5" fill="#008a4a" />
        </g>
      ))}
    </svg>
  );
}
