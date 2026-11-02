import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ALL_SITES, CIRCUIT, CIRCUITS, SITE_BY_ID, type CircuitId } from "../lib/sites";
import { useVisits } from "../lib/store";
import { href } from "../lib/router";
import { Diya, diyaMarkup } from "../components/Diya";
import { LocalName } from "../components/SiteRow";
import { Plaque, PlaqueLink, Slab } from "../components/ui";

const pinHtml = (circuit: CircuitId, lit: boolean, selected: boolean, size: number) =>
  `<span style="display:block;transform-origin:50% 90%;${selected ? "transform:scale(1.35)" : ""}">${diyaMarkup(lit, `var(--c-${circuit})`, size)}</span>`;

// smaller lamps when the whole country is in view, so neighbouring temples stay apart
const pinSize = (zoom: number) => (zoom < 6 ? 22 : zoom < 9 ? 28 : 34);

export function MapScreen({ site: focusId, circuit: onlyCircuit }: { site?: string; circuit?: string }) {
  const visits = useVisits();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [selected, setSelected] = useState<string | undefined>(focusId);
  const [zoom, setZoom] = useState(5);
  const [shown, setShown] = useState<Set<CircuitId>>(
    () => new Set(onlyCircuit && onlyCircuit in CIRCUIT ? [onlyCircuit as CircuitId] : CIRCUITS.map((c) => c.id)),
  );

  useEffect(() => {
    if (!el.current || map.current) return;
    const focus = focusId ? SITE_BY_ID[focusId] : undefined;
    const m = L.map(el.current, { zoomSnap: 0.5, minZoom: 3, maxZoom: 18, worldCopyJump: true });
    if (focus?.lat != null) m.setView([focus.lat, focus.lon!], 11);
    else m.setView([22, 81], window.innerWidth < 640 ? 4 : 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    m.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    setZoom(m.getZoom());
    m.on("zoomend", () => setZoom(m.getZoom()));
    return () => {
      m.remove();
      map.current = null;
    };
  }, [focusId]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    for (const s of ALL_SITES) {
      if (s.lat == null || !shown.has(s.circuit)) continue;
      const lit = !!visits[s.id];
      const sel = s.id === selected;
      const px = pinSize(zoom);
      L.marker([s.lat, s.lon!], {
        icon: L.divIcon({ className: "pin", html: pinHtml(s.circuit, lit, sel, px), iconSize: [px, px], iconAnchor: [px / 2, px * 0.92] }),
        title: `${s.name}, ${CIRCUIT[s.circuit].single}${lit ? ", lamp lit" : ""}`,
        keyboard: true,
        zIndexOffset: sel ? 1000 : lit ? 100 : 0,
      })
        .on("click", () => setSelected(s.id))
        .addTo(g);
    }
  }, [visits, shown, selected, zoom]);

  const unmapped = useMemo(() => ALL_SITES.filter((s) => s.lat == null && shown.has(s.circuit)).length, [shown]);
  const sel = selected ? SITE_BY_ID[selected] : undefined;

  const toggle = (id: CircuitId) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(id) && next.size > 1) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="page flex h-[calc(100dvh-96px-env(safe-area-inset-bottom))] flex-col gap-3 pt-4 lg:h-[100dvh] lg:pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[30px]">Map</h1>
        <div role="group" aria-label="Circuits on the map" className="flex flex-wrap gap-2">
          {CIRCUITS.map((c) => (
            <Plaque key={c.id} small aria-pressed={shown.has(c.id)} onClick={() => toggle(c.id)}>
              <svg width="14" height="14" aria-hidden="true"><rect width="14" height="14" fill={`var(--c-${c.id})`} transform="rotate(45 7 7) scale(.75)" style={{ transformOrigin: "7px 7px" }} /></svg>
              {c.name}
            </Plaque>
          ))}
        </div>
      </div>

      <div className="slab chamfer map-wrap relative min-h-0 flex-1">
        <div className="slab-in chamfer h-full overflow-hidden">
          <div ref={el} className="h-full w-full" aria-label="Map of temples" />
        </div>

        {sel && (
          <div className="absolute inset-x-3 bottom-3 z-[600] sm:left-auto sm:right-4 sm:w-[380px]">
            <Slab gilt inner="p-5">
              <div className="flex items-start gap-4">
                <Diya lit={!!visits[sel.id]} color={`var(--c-${sel.circuit})`} size={52} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">{CIRCUIT[sel.circuit].single}</p>
                  <h2 className="text-[24px]">{sel.name}</h2>
                  <LocalName site={sel} className="block text-[19px] text-[var(--accent)]" />
                  <p className="mt-1 text-[16px] leading-snug text-[var(--ink-soft)]">{sel.place}{sel.approx ? " (approximate)" : ""}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <PlaqueLink tone="gold" href={href.site(sel.id)} className="flex-1">Open</PlaqueLink>
                <Plaque onClick={() => setSelected(undefined)}>Close</Plaque>
              </div>
            </Slab>
          </div>
        )}
      </div>
      {unmapped > 0 && (
        <p className="text-[15px] text-[var(--ink-soft)]">
          {unmapped} {unmapped === 1 ? "site has" : "sites have"} no place on the map: celestial abodes or pithas without a settled location.
        </p>
      )}
    </div>
  );
}
