import { useEffect, useState } from "react";
import { CIRCUIT, SITE_BY_ID, TWINS, directionsUrl, wikiUrl, type Site as SiteT } from "../lib/sites";
import { formatDate, lightLamp, removeVisit, today, updateVisit, useVisits } from "../lib/store";
import { href } from "../lib/router";
import { Diya } from "../components/Diya";
import { Button, ButtonLink, Card, Confirm, Hero, PhotoCredit, useToast } from "../components/ui";
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
  const where = site.celestial ? "Celestial abode" : site.state && !site.place.includes(site.state) ? `${site.place}, ${site.state}` : site.place;

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
    <div className="page">
      <Hero photo={site.id} alt={site.name} back={{ href: href.circuit(site.circuit), label: c.name }}>
        <p className="soft text-[13px] font-semibold uppercase tracking-[0.12em]">
          {c.single} {site.circuit === "dham" ? `· ${site.dir}` : `· ${site.n} of ${c.total}`}
        </p>
        <h1 className="mt-1 text-[clamp(32px,8vw,50px)]">{site.name}</h1>
        <LocalName site={site} className="mt-1 block text-[22px] leading-snug" />
        <p className="soft mt-2 text-[17px]">{where}</p>
      </Hero>
      <PhotoCredit id={site.id} className="mt-2" />

      {/* The visit */}
      <Card className="mt-6 p-6">
        <div className="flex items-start gap-5">
          <div className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-2xl bg-[var(--surface-2)]">
            <Diya lit={!!visit} color={color} size={64} lighting={lighting} live={!!visit && !lighting} />
          </div>
          <div className="min-w-0 flex-1">
            {visit ? (
              <>
                <p className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">Visited</p>
                <p className="serif text-[24px] font-semibold">{formatDate(visit.date)}</p>
                {!editingDate && (
                  <button type="button" className="mt-1 text-[15px] font-semibold text-[var(--accent)] underline underline-offset-4"
                    onClick={() => { setDate(visit.date); setEditingDate(true); }}>
                    Change date
                  </button>
                )}
              </>
            ) : composing ? (
              <>
                <p className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">Light the lamp</p>
                <p className="serif text-[22px] font-semibold">When did you visit?</p>
              </>
            ) : (
              <>
                <p className="text-[14px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">Not yet visited</p>
                <p className="mt-1 text-[16px] text-[var(--ink-soft)]">Light the lamp once your family has been here.</p>
                <Button tone="primary" className="mt-4" onClick={() => { setDate(today()); setNote(""); setAlsoTwin(true); setComposing(true); }}>
                  Light the lamp
                </Button>
              </>
            )}
          </div>
        </div>

        {visit && editingDate && (
          <div className="mt-5 flex flex-wrap items-end gap-3">
            <label className="field">
              Date of visit
              <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </label>
            <Button tone="primary" disabled={!date} onClick={() => { setEditingDate(false); saved(updateVisit(id, { date }), `Visit date changed to ${formatDate(date)}.`); }}>Save date</Button>
            <Button onClick={() => setEditingDate(false)}>Cancel</Button>
          </div>
        )}

        {visit && (
          <div className="mt-6 grid gap-4">
            <label className="field">
              Journal
              <textarea value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Who came along, what the darshan was like, what to remember next time" />
            </label>
            <div className="flex flex-wrap justify-between gap-3">
              <Button tone="primary" disabled={journal === visit.journal} onClick={() => saved(updateVisit(id, { journal }), "Journal saved.")}>
                {journal === visit.journal ? "Journal saved" : "Save journal"}
              </Button>
              <Button tone="danger" small onClick={() => setConfirming(true)}>Remove this visit</Button>
            </div>
          </div>
        )}

        {!visit && composing && (
          <div className="mt-6 grid gap-5">
            <label className="field max-w-[260px]">
              Date of visit
              <input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field">
              Journal (optional)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Who came along, what the darshan was like, what to remember next time" />
            </label>
            {twin && !visits[twin.id] && (
              <label className="flex items-start gap-3 text-[16px]">
                <input type="checkbox" className="mt-1 h-5 w-5 accent-[var(--accent)]" checked={alsoTwin} onChange={(e) => setAlsoTwin(e.target.checked)} />
                <span>Also light the lamp for {twin.name} in {CIRCUIT[twin.circuit].name}. It is the same temple.</span>
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <Button tone="primary" disabled={!date} onClick={light}>Light the lamp</Button>
              <Button onClick={() => setComposing(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

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
    <div className="grid gap-1 py-3.5 sm:grid-cols-[170px_1fr] sm:gap-4">
      <dt className="text-[15px] font-semibold text-[var(--ink-soft)]">{label}</dt>
      <dd className="m-0">{children}</dd>
    </div>
  );
}

function Details({ site }: { site: SiteT }) {
  const hasPin = site.lat != null;
  return (
    <Card as="section" className="mt-5 p-6">
      <h2 className="text-[22px]">About this {site.circuit === "dham" ? "dham" : "temple"}</h2>
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
        {hasPin && <ButtonLink href={href.map(site.id)}>Show on map</ButtonLink>}
        {hasPin && <ButtonLink href={directionsUrl(site)} target="_blank" rel="noopener">Directions</ButtonLink>}
        {site.wiki && <ButtonLink href={wikiUrl(site.wiki)} target="_blank" rel="noopener">Read on Wikipedia</ButtonLink>}
      </div>
    </Card>
  );
}
