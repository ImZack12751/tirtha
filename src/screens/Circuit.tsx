import { useState } from "react";
import { CIRCUIT, SITES, type CircuitId } from "../lib/sites";
import { useVisits } from "../lib/store";
import { href } from "../lib/router";
import { COVER } from "../lib/photos";
import { Count, Emblem } from "../components/Emblems";
import { Button, ButtonLink, Card, Hero, PhotoCredit } from "../components/ui";
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
      <Hero photo={COVER[c.id]} alt="" back={{ href: href.home, label: "Home" }}>
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p lang={c.script === "tamil" ? "ta" : "hi"} className={`${c.script} soft text-[20px]`}>{c.local}</p>
            <h1 className="text-[clamp(34px,8vw,52px)]">{c.name}</h1>
            <div className="mt-2"><Count lit={n} total={c.total} large /></div>
          </div>
          <span className="shrink-0 rounded-full bg-black/40 p-2"><Emblem circuit={c.id} sites={sites} lit={lit} size={112} /></span>
        </div>
      </Hero>
      <PhotoCredit id={COVER[c.id]} className="mt-2" />

      <p className="serif mt-6 max-w-prose text-[19px] leading-relaxed">{c.intro}</p>

      <Card as="section" className="mt-6 p-6">
        <h2 className="text-[21px]">For the journey</h2>
        <ul className="mt-3 grid gap-2.5 pl-5 text-[16px] text-[var(--ink-soft)]">
          {c.tips.map((t) => (
            <li key={t} className="marker:text-[var(--accent)]">{t}</li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="sites" className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 id="sites" className="text-[26px]">The {c.total} {c.id === "dham" ? "dhams" : "temples"}</h2>
          <ButtonLink small href={`${href.map()}?circuit=${c.id}`}>Show on map</ButtonLink>
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div role="radiogroup" aria-label="Show" className="flex gap-2">
            {(["all", "lit", "unlit"] as Filter[]).map((f) => (
              <Button key={f} small role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {f === "all" ? "All" : f === "lit" ? "Visited" : "Not yet"}
              </Button>
            ))}
          </div>
          {sites.length > 12 && (
            <label className="min-w-[220px] flex-1">
              <span className="sr-only">Find a temple</span>
              <input className="input" type="search" placeholder="Find a temple or place" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
          )}
        </div>
        <Card className="overflow-hidden">
          {shown.length ? (
            <ol className="m-0 list-none divide-y divide-[var(--line)] p-0">
              {shown.map((s) => (
                <li key={s.id}><SiteRow site={s} visit={visits[s.id]} /></li>
              ))}
            </ol>
          ) : (
            <p className="px-6 py-8 text-center text-[var(--ink-soft)]">
              {filter === "lit" && !needle ? "No temples visited in this pilgrimage yet." : filter === "unlit" && !needle ? "Every temple here has been visited." : "Nothing matches that search."}
            </p>
          )}
        </Card>
        <p className="mt-4 text-[14px] text-[var(--ink-soft)]">
          Temple list and locations from Wikipedia's articles on the {c.source}
          {c.id === "shakti" ? " and the Tantra Chudamani list on Hindi Wikipedia" : ""}. Photos from Wikimedia Commons, credited on each temple's page.
        </p>
      </section>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="page pt-10">
      <Card className="p-8 text-center">
        <h1 className="text-[26px]">This page could not be found</h1>
        <p className="mt-3 text-[var(--ink-soft)]">The link may be from an older version of the app.</p>
        <ButtonLink className="mt-6" href={href.home}>Back to home</ButtonLink>
      </Card>
    </div>
  );
}
