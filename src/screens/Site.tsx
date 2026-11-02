import { useEffect, useState } from "react";
import { CIRCUIT, SITE_BY_ID, TWINS, directionsUrl, wikiUrl, type Site as SiteT } from "../lib/sites";
import { formatDate, lightLamp, removeVisit, today, updateVisit, useVisits } from "../lib/store";
import { href } from "../lib/router";
import { Diya } from "../components/Diya";
import { KolamFrame, LotusBand, MeanderBand } from "../components/ornament";
import { Confirm, Plaque, PlaqueLink, Slab, useToast } from "../components/ui";
import { LocalName } from "../components/SiteRow";
import { NotFound } from "./Circuit";

export function Site({ id }: { id: string }) {
  const site = SITE_BY_ID[id];
  const visits = useVisits();
  const toast = useToast();
  const visit = visits[id];
  const twin = TWINS[id] ? SITE_BY_ID[TWINS[id]] : undefined;

  const [lighting, setLighting] = useState(false);
  const [composing, setComposing] = useState(false);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [alsoTwin, setAlsoTwin] = useState(true);
  const [journal, setJournal] = useState(visit?.journal ?? "");
  const [editingDate, setEditingDate] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => setJournal(visits[id]?.journal ?? ""), [id, visits]);
  useEffect(() => {
    setComposing(false);
    setEditingDate(false);
    setLighting(false);
  }, [id]);

  if (!site) return <NotFound />;
  const c = CIRCUIT[site.circuit];
  const color = `var(--c-${site.circuit})`;

  const saved = (ok: boolean, msg: string) => toast(ok ? msg : "Could not save on this device. Check that storage is allowed for this app.");

  const light = () => {
    const ids = twin && alsoTwin && !visits[twin.id] ? [id, twin.id] : [id];
    const ok = lightLamp(ids, date, note.trim());
    setComposing(false);
    setLighting(true);
    window.setTimeout(() => setLighting(false), 1900);
    saved(ok, `Lamp lit at ${site.name}${ids.length > 1 ? ` and at its twin in ${CIRCUIT[twin!.circuit].name}` : ""}, ${formatDate(date)}.`);
  };

  return (
    <div className="page pt-4">
      <a href={href.circuit(site.circuit)} className="inline-flex min-h-[44px] items-center gap-2 text-[17px] font-semibold no-underline">
        <span aria-hidden="true">‹</span> {c.name}
      </a>

      {/* The plaque */}
      <Slab className="mt-2" inner="relative px-6 pb-8 pt-10 sm:px-10">
        <KolamFrame>
          <div className="absolute inset-x-10 top-3 text-[var(--gold)]"><LotusBand className="block" /></div>
          <div className="flex flex-col items-center text-center">
            <div className="lamp-halo grid h-[150px] w-[150px] place-items-center">
              <Diya lit={!!visit} color={color} size={120} lighting={lighting} live={!!visit && !lighting} />
            </div>
            <p className="mt-1 text-[15px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-soft)]">
              {c.single} {site.circuit === "dham" ? `· ${site.dir}` : `· ${site.n} of ${c.total}`}
            </p>
            <h1 className="mt-2 text-[clamp(32px,7vw,46px)]">{site.name}</h1>
            <LocalName site={site} className="mt-1 block text-[24px] leading-snug text-[var(--accent)]" />
            <p className="mt-2 text-[18px] text-[var(--ink-soft)]">
              {site.celestial ? "Celestial abode" : site.state && !site.place.includes(site.state) ? `${site.place}, ${site.state}` : site.place}
            </p>
          </div>
          <div className="absolute inset-x-10 bottom-3 text-[var(--gold)]"><MeanderBand className="block" /></div>
        </KolamFrame>
      </Slab>

      {/* Lighting and the visit */}
      <Slab className="mt-5" inner="p-6">
        {visit ? (
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[19px]">
                Lamp lit on <strong>{formatDate(visit.date)}</strong>
              </p>
              {!editingDate && <Plaque small onClick={() => { setDate(visit.date); setEditingDate(true); }}>Change date</Plaque>}
            </div>
            {editingDate && (
              <div className="flex flex-wrap items-end gap-3">
                <label className="field">
                  Date of visit
                  <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
                </label>
                <Plaque tone="gold" disabled={!date} onClick={() => { setEditingDate(false); saved(updateVisit(id, { date }), `Visit date changed to ${formatDate(date)}.`); }}>Save date</Plaque>
                <Plaque onClick={() => setEditingDate(false)}>Cancel</Plaque>
              </div>
            )}
            <label className="field">
              Journal
              <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Who came along, what the darshan was like, what to remember next time" />
            </label>
            <div className="flex flex-wrap justify-between gap-3">
              <Plaque tone="gold" disabled={journal === visit.journal} onClick={() => saved(updateVisit(id, { journal }), "Journal saved.")}>
                {journal === visit.journal ? "Journal saved" : "Save journal"}
              </Plaque>
              <Plaque tone="laterite" small onClick={() => setConfirming(true)}>Remove this visit</Plaque>
            </div>
          </div>
        ) : composing ? (
          <div className="grid gap-5">
            <h2 className="text-[24px]">Light the lamp</h2>
            <label className="field max-w-[260px]">
              Date of visit
              <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              Journal (optional)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Who came along, what the darshan was like, what to remember next time" />
            </label>
            {twin && !visits[twin.id] && (
              <label className="flex items-start gap-3 text-[17px]">
                <input type="checkbox" className="mt-1.5 h-5 w-5 accent-[var(--accent)]" checked={alsoTwin} onChange={(e) => setAlsoTwin(e.target.checked)} />
                <span>Also light the lamp for {twin.name} in {CIRCUIT[twin.circuit].name}. It is the same temple.</span>
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <Plaque tone="gold" disabled={!date} onClick={light}>Light the lamp</Plaque>
              <Plaque onClick={() => setComposing(false)}>Cancel</Plaque>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-[19px]">Not yet visited.</p>
            <Plaque tone="gold" onClick={() => { setDate(today()); setNote(""); setAlsoTwin(true); setComposing(true); }}>
              Light the lamp
            </Plaque>
          </div>
        )}
      </Slab>

      <Details site={site} />

      <Confirm
        open={confirming}
        title="Remove this visit?"
        body={<p>The date and journal for {site.name} will be deleted from this device. The lamp will go back to unlit.</p>}
        confirmLabel="Remove visit"
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          saved(removeVisit(id), `Visit to ${site.name} removed.`);
        }}
      />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-[16px] font-semibold text-[var(--ink-soft)]">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function Details({ site }: { site: SiteT }) {
  const hasPin = site.lat != null;
  return (
    <Slab className="mt-5" inner="p-6">
      <h2 className="text-[24px]">About this {site.circuit === "dham" ? "dham" : "temple"}</h2>
      <dl className="m-0 mt-2 divide-y divide-[var(--line)]">
        {site.circuit === "shakti" && (
          <>
            <Row label="Where it is">
              {site.place}
              {site.localPlace && <span lang="hi" className="deva mt-1 block text-[var(--ink-soft)]">{site.localPlace}</span>}
            </Row>
            {site.part && <Row label="What fell here">{site.part}{site.localPart && <span lang="hi" className="deva"> · {site.localPart}</span>}</Row>}
            <Row label="Shakti">
              {site.shakti ?? <span lang="hi" className="deva">{site.localShakti}</span>}
              {site.shakti && site.localShakti && <span lang="hi" className="deva text-[var(--ink-soft)]"> · {site.localShakti}</span>}
            </Row>
            <Row label="Bhairava">
              {site.bhairava ?? <span lang="hi" className="deva">{site.localBhairava}</span>}
              {site.bhairava && site.localBhairava && <span lang="hi" className="deva text-[var(--ink-soft)]"> · {site.localBhairava}</span>}
            </Row>
          </>
        )}
        {site.circuit === "divya" && site.deities && <Row label="Presiding deities">{site.deities}</Row>}
        {site.state && site.circuit !== "shakti" && <Row label="State">{site.state}</Row>}
        {site.note && <Row label="Note">{site.note}</Row>}
        {site.celestial ? (
          <Row label="Location">By tradition this abode is reached beyond this life, so it has no place on the map. It completes the 108.</Row>
        ) : hasPin ? (
          <Row label="Location">
            {site.approx ? "Approximate: the point marks the town, not the shrine itself." : `${site.lat!.toFixed(4)}, ${site.lon!.toFixed(4)}`}
          </Row>
        ) : (
          <Row label="Location">No settled location, so this pitha has no pin on the map.</Row>
        )}
      </dl>
      <div className="mt-5 flex flex-wrap gap-3">
        {hasPin && <PlaqueLink href={href.map(site.id)}>Show on map</PlaqueLink>}
        {hasPin && <PlaqueLink href={directionsUrl(site)} target="_blank" rel="noopener">Directions</PlaqueLink>}
        {site.wiki && <PlaqueLink href={wikiUrl(site.wiki)} target="_blank" rel="noopener">Read on Wikipedia</PlaqueLink>}
      </div>
    </Slab>
  );
}
