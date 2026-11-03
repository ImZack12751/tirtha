import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import geo from "../data/map.json";
import { ALL_SITES, CIRCUIT, CIRCUITS, SITE_BY_ID, type CircuitId, type Site } from "../lib/sites";
import { useVisits } from "../lib/store";
import { href } from "../lib/router";
import { hasPhoto, thumbUrl } from "../lib/photos";
import { Diya } from "../components/Diya";
import { LocalName } from "../components/SiteRow";
import { Button, ButtonLink, Card } from "../components/ui";

/* Tirtha's own map: Natural Earth outlines (India's official boundary) projected once at build time
   into map.json. The view is a plain transform, screen = world * k + (x, y). */

type View = { k: number; x: number; y: number };
type Label = { name: string; x: number; y: number; kind: string; minZoom?: number };
const POS = geo.sites as unknown as Record<string, [number, number]>;
const LABELS = geo.labels as Label[];
// the opening view fits India and every mapped temple, including those beyond its borders
const ALL_POS = Object.values(POS);
const HX1 = Math.min(geo.home[0], ...ALL_POS.map((p) => p[0])) - 6;
const HY1 = Math.min(geo.home[1], ...ALL_POS.map((p) => p[1])) - 6;
const HX2 = Math.max(geo.home[2], ...ALL_POS.map((p) => p[0])) + 6;
const HY2 = Math.max(geo.home[3], ...ALL_POS.map((p) => p[1])) + 6;
const MAX_ZOOM = 70;
const CLUSTER_PX = 30;
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

type Group = { x: number; y: number; members: Site[] };

export function MapScreen({ site: focusId, circuit: onlyCircuit }: { site?: string; circuit?: string }) {
  const visits = useVisits();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState<View | null>(null);
  const [selected, setSelected] = useState<string | undefined>(focusId);
  const [stack, setStack] = useState<Site[] | null>(null);
  const [shown, setShown] = useState<Set<CircuitId>>(
    () => new Set(onlyCircuit && onlyCircuit in CIRCUIT ? [onlyCircuit as CircuitId] : CIRCUITS.map((c) => c.id)),
  );
  const anim = useRef(0);
  const viewRef = useRef<View | null>(null);
  viewRef.current = view;

  const fitK = useMemo(() => (size.w ? Math.min(size.w / (HX2 - HX1), size.h / (HY2 - HY1)) * 0.94 : 1), [size]);
  const homeView = useCallback(
    (): View => ({ k: fitK, x: size.w / 2 - ((HX1 + HX2) / 2) * fitK, y: size.h / 2 - ((HY1 + HY2) / 2) * fitK }),
    [fitK, size],
  );

  const clamp = useCallback(
    (v: View): View => {
      const k = Math.min(Math.max(v.k, fitK * 0.85), fitK * MAX_ZOOM);
      // keep the centre of the screen over the drawn canvas
      const cx = Math.min(Math.max((size.w / 2 - v.x) / k, 0), geo.width);
      const cy = Math.min(Math.max((size.h / 2 - v.y) / k, 0), geo.height);
      return { k, x: size.w / 2 - cx * k, y: size.h / 2 - cy * k };
    },
    [fitK, size],
  );

  const animateTo = useCallback(
    (target: View) => {
      cancelAnimationFrame(anim.current);
      const from = viewRef.current;
      const to = clamp(target);
      // no animation frames run in a hidden tab, so jump straight there
      if (!from || reduceMotion() || document.hidden) return setView(to);
      let t0 = -1;
      const step = (t: number) => {
        // time from the first frame: frame timestamps and performance.now() can disagree
        if (t0 < 0) t0 = t;
        const p = Math.min(1, Math.max(0, (t - t0) / 380));
        const e = 1 - Math.pow(1 - p, 3);
        // interpolate zoom geometrically so it feels even at every scale
        const k = from.k * Math.pow(to.k / from.k, e);
        const fcx = (size.w / 2 - from.x) / from.k, tcx = (size.w / 2 - to.x) / to.k;
        const fcy = (size.h / 2 - from.y) / from.k, tcy = (size.h / 2 - to.y) / to.k;
        const cx = fcx + (tcx - fcx) * e, cy = fcy + (tcy - fcy) * e;
        setView({ k, x: size.w / 2 - cx * k, y: size.h / 2 - cy * k });
        if (p < 1) anim.current = requestAnimationFrame(step);
      };
      anim.current = requestAnimationFrame(step);
    },
    [clamp, size],
  );

  const centreOn = useCallback(
    (wx: number, wy: number, k: number) => animateTo({ k, x: size.w / 2 - wx * k, y: size.h / 2 - wy * k }),
    [animateTo, size],
  );

  const zoomBy = useCallback(
    (f: number, sx = size.w / 2, sy = size.h / 2, animate = true) => {
      const v = viewRef.current;
      if (!v) return;
      const k = Math.min(Math.max(v.k * f, fitK * 0.85), fitK * MAX_ZOOM);
      const next = { k, x: sx - ((sx - v.x) / v.k) * k, y: sy - ((sy - v.y) / v.k) * k };
      if (animate) animateTo(next);
      else setView(clamp(next));
    },
    [animateTo, clamp, fitK, size],
  );

  // size the map to its box, and place the first view
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    // measure straight away; the observer then follows rotations and window resizes
    const r = el.getBoundingClientRect();
    setSize({ w: r.width, h: r.height });
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!size.w) return;
    if (!viewRef.current) {
      const f = focusId && POS[focusId];
      const k = fitK * 9;
      setView(f ? clamp({ k, x: size.w / 2 - f[0] * k, y: size.h / 2 - f[1] * k }) : homeView());
    } else setView((v) => (v ? clamp(v) : v));
  }, [size, fitK, focusId, homeView, clamp]);

  // ---------- gestures: drag, pinch, wheel ----------
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const moved = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    cancelAnimationFrame(anim.current);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const ps = pointers.current;
    const prev = ps.get(e.pointerId);
    const v = viewRef.current;
    if (!prev || !v) return;
    const rect = box.current!.getBoundingClientRect();
    if (ps.size === 1) {
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      if (!moved.current && Math.abs(dx) + Math.abs(dy) > 3) {
        // capture only once a drag starts, so taps still reach the pin underneath
        moved.current = true;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      }
      if (!moved.current) return;
      ps.set(e.pointerId, { x: e.clientX, y: e.clientY });
      setView(clamp({ ...v, x: v.x + dx, y: v.y + dy }));
    } else if (ps.size === 2) {
      const [a, b] = [...ps.entries()];
      const other = a[0] === e.pointerId ? b[1] : a[1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      ps.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved.current = true;
      if (before > 0) zoomBy(after / before, (e.clientX + other.x) / 2 - rect.left, (e.clientY + other.y) / 2 - rect.top, false);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => pointers.current.delete(e.pointerId);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomBy(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018)), e.clientX - r.left, e.clientY - r.top, false);
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, [zoomBy]);

  const onKey = (e: React.KeyboardEvent) => {
    const v = viewRef.current;
    if (!v) return;
    const pan = 80;
    const map: Record<string, () => void> = {
      "+": () => zoomBy(1.6), "=": () => zoomBy(1.6), "-": () => zoomBy(1 / 1.6),
      ArrowLeft: () => animateTo({ ...v, x: v.x + pan }), ArrowRight: () => animateTo({ ...v, x: v.x - pan }),
      ArrowUp: () => animateTo({ ...v, y: v.y + pan }), ArrowDown: () => animateTo({ ...v, y: v.y - pan }),
      "0": () => animateTo(homeView()), Escape: () => { setSelected(undefined); setStack(null); },
    };
    if (map[e.key]) {
      e.preventDefault();
      map[e.key]();
    }
  };

  // ---------- pins, grouped where they would overlap ----------
  const visible = useMemo(() => ALL_SITES.filter((s) => POS[s.id] && shown.has(s.circuit)), [shown]);
  const groups = useMemo<Group[]>(() => {
    if (!view) return [];
    const out: Group[] = [];
    // visited temples claim their spot first so lit lamps stay visible
    const order = [...visible].sort((a, b) => Number(!!visits[b.id]) - Number(!!visits[a.id]));
    for (const s of order) {
      const [wx, wy] = POS[s.id];
      const x = wx * view.k + view.x, y = wy * view.k + view.y;
      if (x < -40 || y < -40 || x > size.w + 40 || y > size.h + 40) continue;
      const g = s.id === selected ? undefined : out.find((g) => g.members[0].id !== selected && Math.hypot(g.x - x, g.y - y) < CLUSTER_PX);
      if (g) g.members.push(s);
      else out.push({ x, y, members: [s] });
    }
    return out;
  }, [visible, view, size, visits, selected]);

  const zoomRatio = view ? view.k / fitK : 1;
  const sel = selected ? SITE_BY_ID[selected] : undefined;
  const unmapped = useMemo(() => ALL_SITES.filter((s) => !POS[s.id] && shown.has(s.circuit)).length, [shown]);
  const litShown = visible.filter((s) => visits[s.id]).length;

  // temple names beside single pins once zoomed in, skipping any that would collide
  const pinLabels = useMemo(() => {
    if (zoomRatio < 5) return [];
    const placed: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const out: { id: string; x: number; y: number; name: string }[] = [];
    for (const g of groups) {
      if (g.members.length !== 1) continue;
      const s = g.members[0];
      const w = s.name.length * 7.4 + 8;
      const r = { x1: g.x + 18, y1: g.y - 9, x2: g.x + 18 + w, y2: g.y + 9 };
      if (placed.some((p) => !(r.x2 < p.x1 || r.x1 > p.x2 || r.y2 < p.y1 || r.y1 > p.y2))) continue;
      if (groups.some((o) => o !== g && o.x > r.x1 - 14 && o.x < r.x2 + 14 && Math.abs(o.y - g.y) < 16)) continue;
      placed.push(r);
      out.push({ id: s.id, x: r.x1, y: g.y, name: s.name });
    }
    return out;
  }, [groups, zoomRatio]);

  const openGroup = (g: Group) => {
    if (moved.current) return;
    if (g.members.length === 1) {
      setStack(null);
      setSelected(g.members[0].id);
      return;
    }
    const xs = g.members.map((s) => POS[s.id][0]), ys = g.members.map((s) => POS[s.id][1]);
    const [x1, x2, y1, y2] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const span = Math.max(x2 - x1, y2 - y1);
    // temples sharing one spot never separate, however far you zoom: offer a list instead
    if (span * fitK * MAX_ZOOM < CLUSTER_PX || view!.k >= fitK * MAX_ZOOM * 0.95) {
      setSelected(undefined);
      setStack(g.members);
      return;
    }
    const k = Math.min(Math.max((Math.min(size.w, size.h) * 0.5) / span, view!.k * 2.5), fitK * MAX_ZOOM);
    centreOn((x1 + x2) / 2, (y1 + y2) / 2, k);
  };

  const toggle = (id: CircuitId) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="page flex h-[calc(100dvh-72px-env(safe-area-inset-bottom))] min-h-[520px] flex-col gap-3 pt-4 lg:h-[100dvh] lg:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[32px]">Map</h1>
          <p className="text-[14px] text-[var(--ink-soft)]">{litShown} of {visible.length} temples shown here visited</p>
        </div>
        <div role="group" aria-label="Pilgrimages on the map" className="flex flex-wrap gap-2">
          {CIRCUITS.map((c) => (
            <Button key={c.id} small aria-pressed={shown.has(c.id)} onClick={() => toggle(c.id)}>
              <span aria-hidden="true" className="h-3 w-3 rounded-full ring-2 ring-white/70" style={{ background: `var(--c-${c.id})` }} />
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      <div ref={box} tabIndex={0} onKeyDown={onKey} aria-label="Map of temples. Drag to move, use plus and minus to zoom."
        className="map relative min-h-0 flex-1 touch-none select-none overflow-hidden rounded-[18px] border border-[var(--line)] outline-offset-2">
        {view && size.w > 0 && (
          <svg className="absolute inset-0 block h-full w-full cursor-grab active:cursor-grabbing"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
            onDoubleClick={(e) => { const r = box.current!.getBoundingClientRect(); zoomBy(2.2, e.clientX - r.left, e.clientY - r.top); }}>
            <rect width="100%" height="100%" className="m-sea" />
            <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
              <path d={geo.neighbours} className="m-neigh" />
              <path d={geo.land} className="m-land" />
              <path d={geo.states} className="m-state" />
              <path d={geo.land} className="m-coast" />
            </g>

            <g className="m-labels" aria-hidden="true">
              {LABELS.filter((l) => l.kind !== "state" || zoomRatio >= (l.minZoom ?? 1)).map((l) => (
                <text key={l.kind + l.name} x={l.x * view.k + view.x} y={l.y * view.k + view.y} textAnchor="middle" dominantBaseline="middle"
                  className={`m-label m-label--${l.kind}`}>{l.kind === "country" ? l.name.toUpperCase() : l.name}</text>
              ))}
            </g>

            <g>
              {groups.map((g) => {
                const lit = g.members.filter((s) => visits[s.id]).length;
                if (g.members.length > 1) {
                  const r = g.members.length > 9 ? 17 : 15;
                  return (
                    <g key={g.members[0].id} transform={`translate(${g.x} ${g.y})`} className="m-pin" role="button" tabIndex={0}
                      aria-label={`${g.members.length} temples here, ${lit} visited. Zoom in.`}
                      onClick={() => openGroup(g)} onKeyDown={(e) => e.key === "Enter" && openGroup(g)}>
                      <circle r={r + 6} fill="transparent" />
                      <circle r={r} className="m-cluster" />
                      {lit > 0 && <circle r={r + 2.5} className="m-cluster-lit" strokeDasharray={`${(lit / g.members.length) * 2 * Math.PI * (r + 2.5)} 999`} transform="rotate(-90)" />}
                      <text textAnchor="middle" dominantBaseline="central" className="m-cluster-n">{g.members.length}</text>
                    </g>
                  );
                }
                const s = g.members[0];
                const on = s.id === selected;
                const isLit = !!visits[s.id];
                return (
                  <g key={s.id} transform={`translate(${g.x} ${g.y})`} className="m-pin" role="button" tabIndex={0}
                    aria-label={`${s.name}, ${CIRCUIT[s.circuit].single}${isLit ? ", visited" : ""}`}
                    onClick={() => openGroup(g)} onKeyDown={(e) => e.key === "Enter" && setSelected(s.id)}>
                    <circle r={22} fill="transparent" />
                    {isLit && <circle r={on ? 24 : 19} className="m-glow" />}
                    <circle r={on ? 18 : 14} className="m-pin-disc" style={{ stroke: `var(--c-${s.circuit})` }} strokeWidth={on ? 3.5 : 2.5} />
                    <g transform={on ? "translate(-12 -14)" : "translate(-9.5 -11)"}>
                      <Diya lit={isLit} color={`var(--c-${s.circuit})`} size={on ? 24 : 19} />
                    </g>
                  </g>
                );
              })}
            </g>

            <g aria-hidden="true">
              {pinLabels.map((l) => (
                <text key={l.id} x={l.x} y={l.y} dominantBaseline="middle" className="m-label m-label--pin">{l.name}</text>
              ))}
            </g>
          </svg>
        )}

        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]">
          <button type="button" className="m-ctl" aria-label="Zoom in" onClick={() => zoomBy(1.8)}>+</button>
          <button type="button" className="m-ctl border-y border-[var(--line)]" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.8)}>−</button>
          <button type="button" className="m-ctl text-[13px] font-semibold" aria-label="Show all of India" onClick={() => { setSelected(undefined); setStack(null); animateTo(homeView()); }}>All</button>
        </div>

        {stack && !sel && (
          <div className="absolute inset-x-3 bottom-3 z-10 sm:left-auto sm:right-3 sm:w-[380px]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 pb-1 pt-4">
                <h2 className="text-[19px]">{stack.length} temples at this spot</h2>
                <Button small onClick={() => setStack(null)}>Close</Button>
              </div>
              <ul className="m-0 max-h-[46vh] list-none divide-y divide-[var(--line)] overflow-auto p-0">
                {stack.map((s) => (
                  <li key={s.id}>
                    <button type="button" onClick={() => { setStack(null); setSelected(s.id); }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface-2)]">
                      <Diya lit={!!visits[s.id]} color={`var(--c-${s.circuit})`} size={28} />
                      <span className="min-w-0">
                        <span className="block text-[16px] font-semibold">{s.name}</span>
                        <span className="block truncate text-[13px] text-[var(--ink-soft)]">{CIRCUIT[s.circuit].single} · {s.place}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
        {sel && (
          <div className="absolute inset-x-3 bottom-3 z-10 sm:left-auto sm:right-3 sm:w-[380px]">
            <Card className="p-4">
              <div className="flex items-start gap-4">
                {hasPhoto(sel.id) ? <img className="thumb !h-16 !w-16" src={thumbUrl(sel.id)} alt="" /> : <span className="thumb grid !h-16 !w-16 place-items-center"><Diya lit={!!visits[sel.id]} color={`var(--c-${sel.circuit})`} size={40} /></span>}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">{CIRCUIT[sel.circuit].single}{visits[sel.id] ? " · Visited" : ""}</p>
                  <h2 className="text-[21px]">{sel.name}</h2>
                  <LocalName site={sel} className="block text-[16px] text-[var(--ink-soft)]" />
                  <p className="mt-0.5 text-[14px] leading-snug text-[var(--ink-soft)]">{sel.place}{sel.approx ? " (approximate)" : ""}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-3">
                <ButtonLink tone="primary" href={href.site(sel.id)} className="flex-1">Open</ButtonLink>
                <Button onClick={() => setSelected(undefined)}>Close</Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-[var(--ink-soft)]">
        <span className="inline-flex items-center gap-1.5"><Diya lit color="var(--accent)" size={18} /> Visited</span>
        <span className="inline-flex items-center gap-1.5"><Diya lit={false} size={18} /> Not yet</span>
        <span className="inline-flex items-center gap-1.5"><span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[var(--ink)] text-[10px] font-bold text-[var(--bg)]">3</span> Temples close together; tap to zoom</span>
        {unmapped > 0 && <span>{unmapped} without a place on the map (celestial, or location unknown)</span>}
      </div>
    </div>
  );
}
