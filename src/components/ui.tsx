import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { href, type Route } from "../lib/router";
import { creditFor, hasPhoto, photoUrl } from "../lib/photos";

/* ---------- Card ---------- */
export function Card({ children, className = "", as: Tag = "div" }: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={`card ${className}`}>{children}</Tag>;
}

/* ---------- Buttons ---------- */
type Tone = "default" | "primary" | "danger" | "glass";
const cls = (tone: Tone, small?: boolean) =>
  `btn ${tone !== "default" ? `btn--${tone}` : ""} ${small ? "btn--small" : ""}`;

export function Button({ children, tone = "default", small, className = "", ...rest }: {
  children: ReactNode;
  tone?: Tone;
  small?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={`${cls(tone, small)} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, tone = "default", small, className = "", ...rest }: {
  children: ReactNode;
  tone?: Tone;
  small?: boolean;
  className?: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={`${cls(tone, small)} ${className}`} {...rest}>
      {children}
    </a>
  );
}

/* ---------- Photo hero: full-bleed on phones, rounded on wide screens ---------- */
export function Hero({ photo, children, tall = false, alt = "", back }: {
  photo?: string;
  children: ReactNode;
  tall?: boolean;
  alt?: string;
  back?: { href: string; label: string };
}) {
  const has = photo && hasPhoto(photo);
  return (
    <div className={`photo ${has ? "" : "photo--plain"} on-photo -mx-4 sm:-mx-6 lg:mx-0 lg:mt-6 lg:rounded-[22px] ${tall ? "min-h-[min(68vh,560px)]" : "min-h-[min(46vh,380px)]"} flex flex-col justify-end`}>
      {has && <img src={photoUrl(photo!)} alt={alt} fetchPriority="high" decoding="async" />}
      {back && (
        <a href={back.href} className="absolute left-4 top-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-black/45 px-4 text-[15px] font-semibold text-white no-underline sm:left-6 sm:top-6">
          <span aria-hidden="true">‹</span> {back.label}
        </a>
      )}
      <div className="px-5 pb-6 pt-24 sm:px-8 sm:pb-8">{children}</div>
    </div>
  );
}

export function PhotoCredit({ id, className = "" }: { id: string; className?: string }) {
  const c = creditFor(id);
  if (!c) return null;
  return (
    <p className={`text-[13px] leading-snug text-[var(--ink-soft)] ${className}`}>
      Photo: {c.artist}, {c.license}, via{" "}
      <a href={c.page} target="_blank" rel="noopener">Wikimedia Commons</a>
    </p>
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
    <dialog ref={ref} className="sheet" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <Card className="p-6">
        <h2 className="text-[24px]">{title}</h2>
        <div className="mt-3 text-[var(--ink-soft)]">{body}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button onClick={onClose} autoFocus>Keep it</Button>
          <Button tone="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
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
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[1000] flex justify-center px-4 lg:bottom-8 lg:pl-[232px]">
        {msg && (
          <div key={msg.key} className="toast pointer-events-auto flex max-w-md items-center gap-4 rounded-2xl bg-[var(--ink)] px-5 py-3 text-[var(--bg)] shadow-lg">
            <p className="text-[16px]">{msg.text}</p>
            <button type="button" onClick={() => setMsg(null)} className="shrink-0 text-[15px] font-semibold underline underline-offset-4">
              Dismiss
            </button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------- Navigation ---------- */
const NAV = [
  { key: "home", label: "Home", href: href.home, icon: "M4 21h16M6 21v-6h12v6M8 15v-4h8v4M10 11V7h4v4M12 7V4M10 21v-3a2 2 0 0 1 4 0v3" },
  { key: "map", label: "Map", href: href.map(), icon: "M12 2.5c2.6 3.4 2.6 5.6 0 7.8c-2.6-2.2-2.6-4.4 0-7.8zM3 14h15l3-2c0 3-2 4-3.5 4.5C16 19 13.5 20.5 10.5 20.5S5 19 3 14z" },
  { key: "journal", label: "Journal", href: href.journal, icon: "M6 3h11a2 2 0 0 1 2 2v16l-4-2.5L11 21l-4-2.5L5 19V4a1 1 0 0 1 1-1zM9 8h6M9 12h6" },
  { key: "settings", label: "Settings", href: href.settings, icon: "M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M10 16v4" },
] as const;

const activeKey = (r: Route) => (r.name === "circuit" || r.name === "site" ? "home" : r.name);

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export function TabBar({ route }: { route: Route }) {
  const active = activeKey(route);
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-[900] border-t border-[var(--line)] bg-[var(--surface)] lg:hidden">
      <ul className="m-0 flex list-none p-0 pb-[env(safe-area-inset-bottom)]">
        {NAV.map((n) => {
          const on = n.key === active;
          return (
            <li key={n.key} className="flex-1">
              <a href={n.href} aria-current={on ? "page" : undefined}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-[13px] font-semibold no-underline ${on ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"}`}>
                <span className={`grid h-8 w-14 place-items-center rounded-full ${on ? "bg-[var(--accent-soft)]" : ""}`}><NavIcon d={n.icon} /></span>
                {n.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav({ route }: { route: Route }) {
  const active = activeKey(route);
  return (
    <nav aria-label="Main" className="fixed inset-y-0 left-0 z-[900] hidden w-[232px] flex-col border-r border-[var(--line)] bg-[var(--surface)] px-4 pt-8 lg:flex">
      <a href={href.home} className="mb-6 block px-3 text-[var(--ink)] no-underline">
        <span className="serif block text-[28px] font-semibold leading-none">Tirtha</span>
        <span lang="hi" className="deva mt-1 block text-[18px] text-[var(--accent)]">तीर्थ</span>
      </a>
      <ul className="m-0 grid list-none gap-1 p-0">
        {NAV.map((n) => {
          const on = n.key === active;
          return (
            <li key={n.key}>
              <a href={n.href} aria-current={on ? "page" : undefined}
                className={`flex min-h-[48px] items-center gap-3 rounded-xl px-3 text-[16px] font-semibold no-underline ${on ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--ink-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"}`}>
                <NavIcon d={n.icon} />
                {n.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
