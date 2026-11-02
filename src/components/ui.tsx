import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Arch, MeanderBand, Pillar } from "./ornament";
import { href, type Route } from "../lib/router";

/* ---------- Carved slab ---------- */
export function Slab({ children, className = "", inner = "", gilt = false, as: Tag = "div" }: {
  children: ReactNode;
  className?: string;
  inner?: string;
  gilt?: boolean;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`slab chamfer ${gilt ? "slab--gilt" : ""} ${className}`}>
      <div className={`slab-in chamfer ${inner}`}>{children}</div>
    </Tag>
  );
}

/* ---------- Carved plaque button / link ---------- */
type Tone = "stone" | "gold" | "laterite";
const toneClass = (tone: Tone, small?: boolean) =>
  `plaque chamfer ${tone === "gold" ? "plaque--gold" : tone === "laterite" ? "plaque--laterite" : ""} ${small ? "plaque--small" : ""}`;

export function Plaque({ children, tone = "stone", small, className = "", ...rest }: {
  children: ReactNode;
  tone?: Tone;
  small?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${toneClass(tone, small)} ${className}`} {...rest}>
      <span className="chamfer">{children}</span>
    </button>
  );
}

export function PlaqueLink({ children, tone = "stone", small, className = "", ...rest }: {
  children: ReactNode;
  tone?: Tone;
  small?: boolean;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${toneClass(tone, small)} ${className}`} {...rest}>
      <span className="chamfer">{children}</span>
    </a>
  );
}

/* ---------- Confirm dialog: always dismissable ---------- */
export function Confirm({ open, title, body, confirmLabel, onConfirm, onClose }: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="carved" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <Slab inner="p-6">
        <h2 className="text-[26px]">{title}</h2>
        <div className="mt-3 text-[var(--ink-soft)]">{body}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Plaque onClick={onClose} autoFocus>Keep it</Plaque>
          <Plaque tone="laterite" onClick={onConfirm}>{confirmLabel}</Plaque>
        </div>
      </Slab>
    </dialog>
  );
}

/* ---------- Toast: every action says what it changed ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; key: number } | null>(null);
  const timer = useRef<number>(0);
  const show = useCallback((text: string) => {
    window.clearTimeout(timer.current);
    setMsg({ text, key: Date.now() });
    timer.current = window.setTimeout(() => setMsg(null), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[1000] flex justify-center px-4 lg:bottom-8 lg:pl-[240px]">
        {msg && (
          <div key={msg.key} className="toast pointer-events-auto max-w-md">
            <Slab gilt inner="flex items-center gap-4 px-5 py-3">
              <p className="text-[17px]">{msg.text}</p>
              <button type="button" onClick={() => setMsg(null)} className="shrink-0 text-[15px] font-semibold text-[var(--accent)] underline underline-offset-4">
                Dismiss
              </button>
            </Slab>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Navigation ---------- */
const NAV = [
  { key: "home", label: "Yatra", href: href.home, icon: "M4 21h16M6 21v-6h12v6M8 15v-4h8v4M10 11V7h4v4M12 7V4M10 21v-3a2 2 0 0 1 4 0v3" },
  { key: "map", label: "Map", href: href.map(), icon: "M12 2.5c2.6 3.4 2.6 5.6 0 7.8c-2.6-2.2-2.6-4.4 0-7.8zM3 14h15l3-2c0 3-2 4-3.5 4.5C16 19 13.5 20.5 10.5 20.5S5 19 3 14z" },
  { key: "journal", label: "Journal", href: href.journal, icon: "M2.5 8.5h19v7h-19zM6 8.5v7M18 8.5v7M8.5 11h7M8.5 13h5" },
  { key: "settings", label: "Settings", href: href.settings, icon: "M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M10 16v4" },
] as const;

const activeKey = (r: Route) => (r.name === "circuit" || r.name === "site" ? "home" : r.name);

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/* Mobile: a stone plinth along the bottom with arch-shaped active indicators */
export function PlinthNav({ route }: { route: Route }) {
  const active = activeKey(route);
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-[900] lg:hidden">
      <div className="h-[3px] bg-[var(--line-strong)]" />
      <div className="h-[4px] bg-[var(--slab)]" />
      <div className="h-px bg-[var(--gold-deep)]" />
      <ul className="m-0 flex list-none bg-[var(--slab-2)] p-0 pb-[env(safe-area-inset-bottom)]" style={{ backgroundImage: "var(--noise)" }}>
        {NAV.map((n) => {
          const on = n.key === active;
          return (
            <li key={n.key} className="flex-1">
              <a href={n.href} aria-current={on ? "page" : undefined}
                className={`relative flex min-h-[68px] flex-col items-center justify-end pb-2 text-[14px] font-semibold no-underline ${on ? "text-[var(--ink)]" : "text-[var(--ink-soft)]"}`}>
                {on && <Arch className="absolute top-1" />}
                <span className="relative"><NavIcon d={n.icon} /></span>
                <span className="relative">{n.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* Desktop: a side colonnade with a pillar along its edge */
export function ColonnadeNav({ route }: { route: Route }) {
  const active = activeKey(route);
  return (
    <nav aria-label="Main" className="fixed inset-y-0 left-0 z-[900] hidden w-[240px] lg:flex">
      <div className="flex flex-1 flex-col bg-[var(--slab-2)]" style={{ backgroundImage: "var(--noise)" }}>
        <a href={href.home} className="block px-6 pb-2 pt-8 no-underline">
          <span className="display block text-[34px] leading-none text-[var(--ink)]">Tirtha</span>
          <span lang="hi" className="deva mt-1 block text-[20px] text-[var(--accent)]">तीर्थ</span>
        </a>
        <div className="mx-6 mb-4 mt-2 text-[var(--gold)]"><MeanderBand className="block" /></div>
        <ul className="m-0 list-none p-0">
          {NAV.map((n, i) => {
            const on = n.key === active;
            return (
              <li key={n.key}>
                {i > 0 && <div className="mx-6 h-px bg-[var(--line)]" />}
                <a href={n.href} aria-current={on ? "page" : undefined}
                  className={`flex min-h-[64px] items-center gap-3 px-5 text-[18px] font-semibold no-underline ${on ? "text-[var(--ink)]" : "text-[var(--ink-soft)] hover:text-[var(--ink)]"}`}>
                  <span className="relative grid h-[44px] w-[56px] place-items-center">
                    {on && <Arch className="absolute inset-0" />}
                    <span className="relative mt-2"><NavIcon d={n.icon} /></span>
                  </span>
                  {n.label}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <Pillar className="h-full text-[var(--line-strong)]" />
    </nav>
  );
}
