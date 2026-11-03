/* Single lotus for calm empty states */
export function LotusMark({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.7} viewBox="0 0 120 84" aria-hidden="true" focusable="false" className="mx-auto">
      <g fill="none" stroke="var(--gold)" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M60 70 C50 56 50 30 60 10 C70 30 70 56 60 70 Z" fill="color-mix(in srgb, var(--gold) 16%, transparent)" />
        <path d="M60 70 C44 64 34 46 36 28 C50 36 58 52 60 70 Z" />
        <path d="M60 70 C76 64 86 46 84 28 C70 36 62 52 60 70 Z" />
        <path d="M60 70 C40 72 22 62 14 46 C32 46 50 56 60 70 Z" />
        <path d="M60 70 C80 72 98 62 106 46 C88 46 70 56 60 70 Z" />
      </g>
      <line x1="30" y1="80" x2="90" y2="80" stroke="var(--line)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
