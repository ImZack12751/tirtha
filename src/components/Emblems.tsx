import type { CircuitId, Site } from "../lib/sites";

type EmblemProps = { sites: Site[]; lit: Set<string>; size?: number };

const C = 100;
const polar = (r: number, deg: number) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)] as const;
};
const f = (n: number) => n.toFixed(2);

function arcSeg(r1: number, r2: number, a1: number, a2: number) {
  const [x1, y1] = polar(r2, a1);
  const [x2, y2] = polar(r2, a2);
  const [x3, y3] = polar(r1, a2);
  const [x4, y4] = polar(r1, a1);
  return `M${f(x1)} ${f(y1)} A${r2} ${r2} 0 0 1 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${r1} ${r1} 0 0 0 ${f(x4)} ${f(y4)} Z`;
}

/* Jyotirlingas: a twelve-petal lotus, one petal per shrine */
function Lotus12({ sites, lit }: EmblemProps) {
  return (
    <>
      <circle className="orn" cx={C} cy={C} r="96" />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={`b${i}`} className="orn" transform={`rotate(${i * 30 + 15} ${C} ${C})`} d="M100 70 C107 60 108 46 100 34 C92 46 93 60 100 70 Z" />
      ))}
      {sites.map((s, i) => {
        const on = lit.has(s.id);
        return (
          <path key={s.id} className={`seg ${on ? "on on-glow" : ""}`} transform={`rotate(${i * 30} ${C} ${C})`}
            d="M100 66 C113 52 114 28 100 8 C86 28 87 52 100 66 Z" />
        );
      })}
      <circle className="orn" cx={C} cy={C} r="22" />
      <circle className="dot" cx={C} cy={C} r="6" />
    </>
  );
}

/* Shakti Peethas: a ring of 51 segments */
function Ring51({ sites, lit }: EmblemProps) {
  const step = 360 / 51;
  return (
    <>
      <circle className="orn" cx={C} cy={C} r="96" />
      <circle className="orn" cx={C} cy={C} r="58" />
      {sites.map((s, i) => (
        <path key={s.id} className={`seg ${lit.has(s.id) ? "on on-glow" : ""}`} d={arcSeg(64, 92, i * step + 0.8, (i + 1) * step - 0.8)} />
      ))}
      {Array.from({ length: 17 }, (_, i) => {
        const [x, y] = polar(48, i * (360 / 17));
        return <circle key={i} className="pip" cx={x} cy={y} r="2" />;
      })}
      <path className="orn" d="M100 70 L130 100 L100 130 L70 100 Z" />
      <path className="orn" d="M79 79 H121 V121 H79 Z" />
      <circle className="dot" cx={C} cy={C} r="6" />
    </>
  );
}

/* Char Dham: a square mandala with four gates, one per direction */
const GATE: Record<string, string> = {
  North: "M76 36 V24 H86 V12 H114 V24 H124 V36 Z",
  South: "M76 164 V176 H86 V188 H114 V176 H124 V164 Z",
  West: "M36 76 H24 V86 H12 V114 H24 V124 H36 Z",
  East: "M164 76 H176 V86 H188 V114 H176 V124 H164 Z",
};
function Square4({ sites, lit }: EmblemProps) {
  return (
    <>
      <path className="orn" d="M36 36 H164 V164 H36 Z" strokeWidth="1.5" />
      <path className="orn" d="M44 44 H156 V156 H44 Z" />
      <path className="orn" d="M52 52 H148 V148 H52 Z" />
      <circle className="orn" cx={C} cy={C} r="40" />
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} className="orn" transform={`rotate(${i * 45} ${C} ${C})`} d="M100 98 C106 88 106 74 100 64 C94 74 94 88 100 98 Z" />
      ))}
      {sites.map((s) => (
        <path key={s.id} className={`seg ${lit.has(s.id) ? "on on-glow" : ""}`} d={GATE[s.dir ?? "North"]} />
      ))}
      <circle className="dot" cx={C} cy={C} r="6" />
    </>
  );
}

/* Divya Desams: a 108-bead mala with a meru bead at the base */
function Mala108({ sites, lit }: EmblemProps) {
  const gap = 14;
  const step = (360 - gap) / 108;
  return (
    <>
      <circle className="orn" cx={C} cy={C} r="86" strokeDasharray="1 3" />
      {sites.map((s, i) => {
        const [x, y] = polar(86, 180 + gap / 2 + i * step + step / 2);
        return <circle key={s.id} className={`seg ${lit.has(s.id) ? "on on-glow" : ""}`} cx={x} cy={y} r="3.4" />;
      })}
      <circle className="dot" cx={C} cy={C + 86} r="6" />
      <path className="orn" d="M96 193 L94 200 M100 193 V200 M104 193 L106 200" />
      <circle className="orn" cx={C} cy={C} r="60" />
      {Array.from({ length: 16 }, (_, i) => (
        <path key={i} className="orn" transform={`rotate(${i * 22.5} ${C} ${C})`} d="M100 96 C104 86 104 72 100 62 C96 72 96 86 100 96 Z" />
      ))}
      <circle className="dot" cx={C} cy={C} r="6" />
    </>
  );
}

const SHAPES: Record<CircuitId, (p: EmblemProps) => React.JSX.Element> = {
  jyotirlinga: Lotus12,
  shakti: Ring51,
  dham: Square4,
  divya: Mala108,
};

export function Emblem({ circuit, sites, lit, size = 120 }: EmblemProps & { circuit: CircuitId }) {
  const Shape = SHAPES[circuit];
  return (
    <svg className="emblem shrink-0" width={size} height={size} viewBox="0 0 200 204" aria-hidden="true" focusable="false">
      <Shape sites={sites} lit={lit} />
    </svg>
  );
}

export function Count({ lit, total, large = false }: { lit: number; total: number; large?: boolean }) {
  return (
    <p className={`serif font-semibold leading-none tabular-nums ${large ? "text-[44px]" : "text-[30px]"}`}>
      <span>{lit}</span>
      <span className="soft opacity-70">/{total}</span>
      <span className="sr-only"> lamps lit</span>
    </p>
  );
}
