import { CIRCUITS, SITES, SITE_BY_ID, TOTAL } from "../lib/sites";
import { useVisits } from "../lib/store";
import { href } from "../lib/router";
import { Count, Emblem } from "../components/Emblems";
import { Divider, GopuramHeader, KolamFrame, LotusMark } from "../components/ornament";
import { Slab } from "../components/ui";
import { SiteRow } from "../components/SiteRow";

export function Home() {
  const visits = useVisits();
  const lit = new Set(Object.keys(visits));
  const recent = Object.entries(visits)
    .sort((a, b) => b[1].date.localeCompare(a[1].date) || b[1].updated - a[1].updated)
    .slice(0, 5);

  return (
    <div className="page">
      <GopuramHeader title="Tirtha" local="तीर्थ" subtitle="A lamp for every temple you reach.">
        <p className="mt-2 text-[17px] text-[var(--ink-soft)]">
          <span className="display text-[22px] text-[var(--accent)]">{lit.size}</span> of {TOTAL} lamps lit
        </p>
      </GopuramHeader>

      <ul className="m-0 mt-6 grid list-none gap-5 p-0 md:grid-cols-2">
        {CIRCUITS.map((c) => {
          const sites = SITES[c.id];
          const n = sites.filter((s) => lit.has(s.id)).length;
          return (
            <Slab key={c.id} as="li" inner="relative p-0">
              <a href={href.circuit(c.id)} className="relative flex items-center gap-5 p-6 text-[var(--ink)] no-underline">
                <KolamFrame>
                  <Emblem circuit={c.id} sites={sites} lit={lit} size={116} />
                  <span className="min-w-0">
                    <Count lit={n} total={c.total} />
                    <span className="display mt-2 block text-[24px] leading-tight">{c.name}</span>
                    <span lang={c.script === "tamil" ? "ta" : "hi"} className={`${c.script} block text-[18px] text-[var(--accent)]`}>
                      {c.local}
                    </span>
                  </span>
                </KolamFrame>
              </a>
            </Slab>
          );
        })}
      </ul>

      <Divider className="my-8" />

      <section aria-labelledby="recent">
        <h2 id="recent" className="mb-4 text-[26px]">Recently lit</h2>
        {recent.length ? (
          <Slab inner="py-2">
            <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">
              {recent.map(([id, v]) => (
                <li key={id}><SiteRow site={SITE_BY_ID[id]} visit={v} showCircuit /></li>
              ))}
            </ul>
          </Slab>
        ) : (
          <Slab inner="px-6 py-8 text-center">
            <LotusMark />
            <p className="mx-auto mt-4 max-w-md">No lamps lit yet. Open a circuit and light the lamp at each temple your family has visited.</p>
          </Slab>
        )}
      </section>
    </div>
  );
}
