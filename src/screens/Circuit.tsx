import { useState } from "react";
import { CIRCUIT, SITES, type CircuitId } from "../lib/sites";
import { useVisits } from "../lib/store";
import { href } from "../lib/router";
import { Count, Emblem } from "../components/Emblems";
import { Divider, GopuramHeader, MeanderBand } from "../components/ornament";
import { Plaque, PlaqueLink, Slab } from "../components/ui";
import { SiteRow } from "../components/SiteRow";

type Filter = "all" | "lit" | "unlit";

export function Circuit({ id }: { id: string }) {
  const c = CIRCUIT[id as CircuitId];
  const visits = useVisits();
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  if (!c) return <NotFound />;

  const sites = SITES[c.id];
  const lit = new Set(Object.keys(visits));
  const n = sites.filter((s) => lit.has(s.id)).length;
  const needle = q.trim().toLowerCase();
  const shown = sites.filter(
    (s) =>
      (filter === "all" || (filter === "lit") === lit.has(s.id)) &&
      (!needle || [s.name, s.place, s.state, s.local, s.deities].some((t) => t?.toLowerCase().includes(needle))),
  );

  return (
    <div className="page">
      <GopuramHeader title={c.name} local={c.local} script={c.script} tiers={3} />

      <Slab className="mt-6" inner="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-center">
        <div className="lamp-halo flex items-center gap-5">
          <Emblem circuit={c.id} sites={sites} lit={lit} size={176} />
          <Count lit={n} total={c.total} large />
        </div>
        <p className="max-w-prose text-[18px]">{c.intro}</p>
      </Slab>

      <section aria-labelledby="tips" className="mt-6">
        <Slab inner="p-6">
          <h2 id="tips" className="text-[24px]">For the journey</h2>
          <MeanderBand className="mt-2 block text-[var(--gold)]" />
          <ul className="mt-4 grid gap-3 pl-5">
            {c.tips.map((t) => (
              <li key={t} className="marker:text-[var(--gold-deep)]">{t}</li>
            ))}
          </ul>
        </Slab>
      </section>

      <Divider className="my-8" />

      <section aria-labelledby="sites">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="sites" className="text-[26px]">The {c.total} {c.id === "dham" ? "dhams" : "temples"}</h2>
          <PlaqueLink small href={`${href.map()}?circuit=${c.id}`}>Open the map</PlaqueLink>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Show" className="flex gap-2">
            {(["all", "lit", "unlit"] as Filter[]).map((f) => (
              <Plaque key={f} small role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "lit" ? "Lit" : "Not yet"}
              </Plaque>
            ))}
          </div>
          {sites.length > 12 && (
            <label className="min-w-[220px] flex-1">
              <span className="sr-only">Find a temple</span>
              <input className="input" type="search" placeholder="Find a temple or place" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          )}
        </div>
        <Slab inner="py-2">
          {shown.length ? (
            <ol className="m-0 list-none divide-y divide-[var(--line)] p-0">
              {shown.map((s) => (
                <li key={s.id}><SiteRow site={s} visit={visits[s.id]} /></li>
              ))}
            </ol>
          ) : (
            <p className="px-6 py-6 text-center text-[var(--ink-soft)]">
              {filter === "lit" && !needle ? "No lamps lit in this circuit yet." : filter === "unlit" && !needle ? "Every lamp in this circuit is lit." : "Nothing matches that search."}
            </p>
          )}
        </Slab>
        <p className="mt-4 text-[15px] text-[var(--ink-soft)]">
          Temple list and locations from Wikipedia's articles on the {c.source}
          {c.id === "shakti" ? " and the Tantra Chudamani list on Hindi Wikipedia" : ""}.
        </p>
      </section>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page pt-10">
      <Slab inner="p-8 text-center">
        <h1 className="text-[28px]">This page could not be found</h1>
        <p className="mt-3 text-[var(--ink-soft)]">The link may be from an older version of the app.</p>
        <PlaqueLink className="mt-6" href={href.home}>Back to Yatra</PlaqueLink>
      </Slab>
    </div>
  );
}
