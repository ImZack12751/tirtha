import { useId } from "react";

type Props = {
  lit: boolean;
  color?: string;
  size?: number;
  lighting?: boolean;
  live?: boolean;
  className?: string;
};

const STAND = "M18 44 H30 L28.5 39.5 H19.5 Z";
const BOWL = "M5 27.5 H34 L43 23.5 Q42 29 37 31 Q31 39.5 21 39.5 Q10.5 39.5 5 27.5 Z";
const FLAME = "M40.6 6 C45.5 12.5 46 18 40.8 22.4 C35.8 18.2 36.6 12.6 40.6 6 Z";
const CORE = "M40.7 12 C43 15.5 43 18.6 40.8 20.8 C38.6 18.6 38.6 15.6 40.7 12 Z";

/* Plain markup for Leaflet pins, which are HTML strings rather than React trees */
export function diyaMarkup(lit: boolean, color: string, size: number) {
  const ink = lit ? "var(--ink)" : "var(--stone-unlit)";
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" overflow="visible" aria-hidden="true">${
    lit ? `<circle cx="37" cy="17" r="15" fill="var(--lamp)" opacity=".28"/>` : ""
  }<path d="${STAND}" fill="${lit ? color : "var(--slab)"}" stroke="${ink}" stroke-width="1.6"/><path d="${BOWL}" fill="${
    lit ? color : "var(--stone-unlit-fill)"
  }" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>${
    lit ? `<path d="${FLAME}" fill="var(--lamp)" stroke="var(--ink)" stroke-width=".6"/><path d="${CORE}" fill="var(--flame-core)"/>` : ""
  }</svg>`;
}

/* A clay lamp. Unlit: cold stone outline. Lit: coloured bowl, flame and a soft warm glow. */
export function Diya({ lit, color = "var(--accent)", size = 40, lighting = false, live = false, className = "" }: Props) {
  const gid = useId();
  const cls = ["diya", lit && "diya--lit", lighting && "diya--lighting", live && "diya--live", className].filter(Boolean).join(" ");
  return (
    <svg className={cls} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" overflow="visible">
      <defs>
        <radialGradient id={gid}>
          <stop offset="0" stopColor="var(--lamp)" stopOpacity=".75" />
          <stop offset=".45" stopColor="var(--lamp)" stopOpacity=".25" />
          <stop offset="1" stopColor="var(--lamp)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {lit && <circle className="glow" cx="37" cy="17" r="17" fill={`url(#${gid})`} />}
      {/* stand */}
      <path d={STAND} fill={lit ? color : "none"} stroke={lit ? "var(--ink)" : "var(--stone-unlit)"} strokeWidth="1.2" strokeLinejoin="round" opacity={lit ? 0.9 : 1} />
      {/* bowl with spout */}
      <path d={BOWL}
        fill={lit ? color : "var(--stone-unlit-fill)"} stroke={lit ? "var(--ink)" : "var(--stone-unlit)"} strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 30.5 Q20 34 33 30.5" fill="none" stroke={lit ? "var(--gold)" : "var(--stone-unlit)"} strokeWidth="1" opacity=".8" />
      {/* wick */}
      <line x1="39.5" y1="24.2" x2="40.6" y2="21.6" stroke={lit ? "var(--ink)" : "var(--stone-unlit)"} strokeWidth="1.3" strokeLinecap="round" />
      {lit && (
        <g className="flame">
          <path d={FLAME} fill="var(--lamp)" />
          <path d={CORE} fill="var(--flame-core)" />
        </g>
      )}
    </svg>
  );
}
