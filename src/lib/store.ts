import { useSyncExternalStore } from "react";
import { SITE_BY_ID } from "./sites";

export type Visit = { date: string; journal: string; updated: number };
export type Visits = Record<string, Visit>;

const KEY = "tirtha.visits.v1";
const THEME_KEY = "tirtha.theme";

function load(): Visits {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.visits) return parsed.visits as Visits;
    }
  } catch {
    /* unreadable storage starts empty */
  }
  return {};
}

let visits: Visits = load();
const listeners = new Set<() => void>();

function commit(next: Visits): boolean {
  visits = next;
  listeners.forEach((l) => l());
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, visits }));
    return true;
  } catch {
    return false;
  }
}

export function useVisits(): Visits {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => visits,
  );
}

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function lightLamp(ids: string[], date: string, journal: string): boolean {
  const next = { ...visits };
  for (const id of ids) next[id] = { date, journal: next[id]?.journal || journal, updated: Date.now() };
  // ask the browser not to evict the lamps when space runs low
  navigator.storage?.persist?.().catch(() => {});
  return commit(next);
}

export function updateVisit(id: string, patch: Partial<Pick<Visit, "date" | "journal">>): boolean {
  if (!visits[id]) return false;
  return commit({ ...visits, [id]: { ...visits[id], ...patch, updated: Date.now() } });
}

export function removeVisit(id: string): boolean {
  const next = { ...visits };
  delete next[id];
  return commit(next);
}

export function clearAll(): boolean {
  return commit({});
}

// ---------- Backup ----------
export function exportBackup(): Blob {
  const body = { app: "tirtha", version: 1, exported: new Date().toISOString(), visits };
  return new Blob([JSON.stringify(body, null, 2)], { type: "application/json" });
}

export type ImportResult = { added: number; updated: number; kept: number; skipped: number; saved: boolean };

export function importBackup(text: string): ImportResult {
  const parsed = JSON.parse(text);
  if (!parsed || parsed.app !== "tirtha" || typeof parsed.visits !== "object") {
    throw new Error("This file is not a Tirtha backup.");
  }
  const next = { ...visits };
  let added = 0;
  let updated = 0;
  let kept = 0;
  let skipped = 0;
  for (const [id, v] of Object.entries(parsed.visits as Record<string, Partial<Visit>>)) {
    if (!SITE_BY_ID[id] || !v || typeof v.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.date)) {
      skipped++;
      continue;
    }
    const stamp = typeof v.updated === "number" ? v.updated : 0;
    // where a temple is in both, the more recently edited visit wins
    if (next[id] && next[id].updated >= stamp) {
      kept++;
      continue;
    }
    if (next[id]) updated++;
    else added++;
    next[id] = { date: v.date, journal: typeof v.journal === "string" ? v.journal : "", updated: stamp || Date.now() };
  }
  return { added, updated, kept, skipped, saved: commit(next) };
}

// ---------- Theme ----------
export type ThemePref = "system" | "sandstone" | "sanctum";
const media = typeof matchMedia === "function" ? matchMedia("(prefers-color-scheme: dark)") : null;

function readPref(): ThemePref {
  try {
    const t = localStorage.getItem(THEME_KEY);
    if (t === "sandstone" || t === "sanctum") return t;
  } catch {
    /* default */
  }
  return "system";
}

let themePref: ThemePref = readPref();
const themeListeners = new Set<() => void>();

function applyTheme() {
  const resolved = themePref === "system" ? (media?.matches ? "sanctum" : "sandstone") : themePref;
  document.documentElement.dataset.theme = resolved;
  themeListeners.forEach((l) => l());
}
media?.addEventListener("change", () => themePref === "system" && applyTheme());

export function setTheme(pref: ThemePref) {
  themePref = pref;
  try {
    if (pref === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, pref);
  } catch {
    /* choice still applies for this session */
  }
  applyTheme();
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(
    (l) => {
      themeListeners.add(l);
      return () => themeListeners.delete(l);
    },
    () => themePref,
  );
}

export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
