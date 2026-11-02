import { useId, type ReactNode } from "react";

/* Every ornament draws in currentColor so a parent decides gold, line or ink. */

export function LotusBand({ className = "", height = 14 }: { className?: string; height?: number }) {
  const id = useId();
  return (
    <svg className={className} width="100%" height={height} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="20" height="14" patternUnits="userSpaceOnUse">
          <path d="M10 13 C6 10 6 5 10 1 C14 5 14 10 10 13 Z" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M10 13 C5 12 1 9 0 6 C4 6 8 9 10 13 Z M10 13 C15 12 19 9 20 6 C16 6 12 9 10 13 Z" fill="currentColor" opacity=".55" />
          <line x1="0" y1="13.5" x2="20" y2="13.5" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}

export function MeanderBand({ className = "", height = 12 }: { className?: string; height?: number }) {
  const id = useId();
  return (
    <svg className={className} width="100%" height={height} aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width="16" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 11 H12 V1 H4 V7 H8 V4" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" />
          <line x1="12" y1="11" x2="16" y2="11" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}

/* Kolam corner: a 3x3 dot grid with a single line looping around the dots */
export function KolamCorner({ className = "", rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg className={className} width="30" height="30" viewBox="0 0 30 30" aria-hidden="true" focusable="false"
      style={{ transform: `rotate(${rotate}deg)` }}>
      {[5, 15, 25].flatMap((x) => [5, 15, 25].map((y) => (x + y <= 30 ? <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="currentColor" /> : null)))}
      <path d="M2 10 Q2 2 10 2 Q15 2 15 7 Q15 10 20 10 Q28 10 28 2 M2 10 Q7 10 7 15 Q7 20 2 20 Q10 20 10 28 M10 10 Q10 15 15 15"
        fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

export function KolamFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <KolamCorner className="absolute left-2 top-2 text-[var(--gold)] opacity-80" />
      <KolamCorner className="absolute right-2 top-2 text-[var(--gold)] opacity-80" rotate={90} />
      <KolamCorner className="absolute right-2 bottom-2 text-[var(--gold)] opacity-80" rotate={180} />
      <KolamCorner className="absolute left-2 bottom-2 text-[var(--gold)] opacity-80" rotate={270} />
      {children}
    </>
  );
}

function Kalasha({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -14 L1.6 -8 H-1.6 Z" fill="currentColor" />
      <ellipse cx="0" cy="-6" rx="4.5" ry="2" fill="currentColor" />
      <path d="M-5 -4 Q-7 1 -3 3 H3 Q7 1 5 -4 Z" fill="currentColor" />
      <rect x="-4" y="3" width="8" height="2" fill="currentColor" />
    </g>
  );
}

/* Gopuram: stepped tiers narrowing upward, niches on each tier, kalashas on the crown */
export function Gopuram({ tiers = 5, className = "" }: { tiers?: number; className?: string }) {
  const W = 320;
  const tierH = 15;
  const crownH = 12;
  const baseW = 300;
  const topW = 96;
  const H = tiers * tierH + crownH + 18;
  const rows = Array.from({ length: tiers }, (_, i) => {
    const w = baseW - ((baseW - topW) * i) / Math.max(1, tiers - 1);
    return { w, x: (W - w) / 2, y: H - (i + 1) * tierH };
  });
  const top = rows[rows.length - 1];
  const crownY = top.y - crownH;
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} width="100%" aria-hidden="true" focusable="false"
      preserveAspectRatio="xMidYMax meet">
      <g className="text-[var(--line-strong)]">
        {rows.map((r, i) => (
          <g key={i}>
            <rect x={r.x} y={r.y} width={r.w} height={tierH} fill="var(--slab-2)" stroke="currentColor" strokeWidth="1" />
            <line x1={r.x - 3} x2={r.x + r.w + 3} y1={r.y + 0.5} y2={r.y + 0.5} stroke="currentColor" strokeWidth="2" />
            {Array.from({ length: Math.floor((r.w - 12) / 14) }, (_, k) => {
              const n = Math.floor((r.w - 12) / 14);
              const nx = r.x + (r.w - n * 14) / 2 + k * 14 + 4;
              return k % 2 === 0 ? (
                <rect key={k} x={nx} y={r.y + 4} width="6" height={tierH - 6} fill="none" stroke="currentColor" strokeWidth="0.9" />
              ) : (
                <path key={k} d={`M${nx} ${r.y + tierH - 2} V${r.y + 7} Q${nx + 3} ${r.y + 3} ${nx + 6} ${r.y + 7} V${r.y + tierH - 2}`}
                  fill="none" stroke="currentColor" strokeWidth="0.9" />
              );
            })}
          </g>
        ))}
        {/* barrel-vault crown */}
        <path d={`M${top.x + 6} ${top.y} V${crownY + 6} Q${top.x + 6} ${crownY} ${top.x + 14} ${crownY} H${top.x + top.w - 14} Q${top.x + top.w - 6} ${crownY} ${top.x + top.w - 6} ${crownY + 6} V${top.y}`}
          fill="var(--slab-2)" stroke="currentColor" strokeWidth="1" />
      </g>
      <g className="text-[var(--gold)]">
        {[-2, -1, 0, 1, 2].map((k) => (
          <Kalasha key={k} x={W / 2 + k * ((top.w - 30) / 4)} y={crownY - 1} s={k === 0 ? 1.15 : 0.9} />
        ))}
      </g>
    </svg>
  );
}

export function GopuramHeader({
  title,
  local,
  script = "deva",
  subtitle,
  tiers = 5,
  children,
}: {
  title: string;
  local?: string;
  script?: "deva" | "tamil";
  subtitle?: string;
  tiers?: number;
  children?: ReactNode;
}) {
  return (
    <header className="relative pt-4 text-center">
      <div className="lamp-halo mx-auto" style={{ maxWidth: tiers > 3 ? 360 : 240 }}>
        <Gopuram tiers={tiers} />
      </div>
      <div className="-mt-px border-t-2 border-b border-[var(--line-strong)] bg-[var(--slab-2)] px-4 py-3">
        <h1 className="text-[clamp(30px,7vw,44px)] text-[var(--ink)]">{title}</h1>
        {local && (
          <p lang={script === "tamil" ? "ta" : "hi"} className={`${script} mt-1 text-[22px] leading-snug text-[var(--accent)]`}>
            {local}
          </p>
        )}
      </div>
      <LotusBand className="block text-[var(--gold)]" />
      {subtitle && <p className="mx-auto mt-3 max-w-xl px-4 text-[17px] text-[var(--ink-soft)]">{subtitle}</p>}
      {children}
    </header>
  );
}

/* Section divider: incised lines, lotus buds and a kalasha at the centre */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-[var(--gold)] ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-[var(--line-strong)]" />
      <svg width="132" height="22" viewBox="0 0 132 22">
        {[14, 36, 96, 118].map((x) => (
          <path key={x} d={`M${x} 18 C${x - 5} 14 ${x - 5} 8 ${x} 4 C${x + 5} 8 ${x + 5} 14 ${x} 18 Z`} fill="none" stroke="currentColor" />
        ))}
        <Kalasha x={66} y={17} s={1.1} />
      </svg>
      <span className="h-px flex-1 bg-[var(--line-strong)]" />
    </div>
  );
}

/* Slim pillar used as the colonnade edge: base, fluted shaft, capital */
export function Pillar({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="100%" preserveAspectRatio="none" viewBox="0 0 14 100" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="14" height="3" fill="currentColor" />
      <rect x="2" y="3" width="10" height="2" fill="currentColor" />
      <line x1="5" y1="5" x2="5" y2="95" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      <line x1="9" y1="5" x2="9" y2="95" stroke="currentColor" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
      <line x1="3" y1="5" x2="3" y2="95" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <line x1="11" y1="5" x2="11" y2="95" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      <rect x="2" y="95" width="10" height="2" fill="currentColor" />
      <rect x="0" y="97" width="14" height="3" fill="currentColor" />
    </svg>
  );
}

/* Arch used as the active-nav indicator */
export function Arch({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="56" height="44" viewBox="0 0 56 44" aria-hidden="true" focusable="false">
      <path d="M6 44 V20 Q6 4 28 2 Q50 4 50 20 V44" fill="color-mix(in srgb, var(--gold) 22%, transparent)" stroke="var(--gold)" strokeWidth="1.5" />
      <path d="M11 44 V21 Q11 9 28 7 Q45 9 45 21 V44" fill="none" stroke="var(--gold)" strokeWidth="0.8" opacity=".7" />
    </svg>
  );
}

/* Single lotus for calm empty states */
export function LotusMark({ size = 120 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 120 84" aria-hidden="true" focusable="false" className="mx-auto">
      <g fill="none" stroke="var(--gold)" strokeWidth="1.4">
        <path d="M60 70 C50 56 50 30 60 10 C70 30 70 56 60 70 Z" fill="color-mix(in srgb, var(--gold) 18%, transparent)" />
        <path d="M60 70 C44 64 34 46 36 28 C50 36 58 52 60 70 Z" />
        <path d="M60 70 C76 64 86 46 84 28 C70 36 62 52 60 70 Z" />
        <path d="M60 70 C40 72 22 62 14 46 C32 46 50 56 60 70 Z" />
        <path d="M60 70 C80 72 98 62 106 46 C88 46 70 56 60 70 Z" />
      </g>
      <g stroke="var(--line-strong)" strokeWidth="1">
        <line x1="18" y1="78" x2="102" y2="78" />
        <line x1="34" y1="82" x2="86" y2="82" />
      </g>
    </svg>
  );
}
