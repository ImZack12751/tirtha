import { CIRCUIT, SITE_BY_ID } from "../lib/sites";
import { formatDate, useVisits } from "../lib/store";
import { href } from "../lib/router";
import { Diya } from "../components/Diya";
import { GopuramHeader, LotusMark } from "../components/ornament";
import { PlaqueLink, Slab } from "../components/ui";
import { LocalName } from "../components/SiteRow";

export function Journal() {
  const visits = useVisits();
  const entries = Object.entries(visits)
    .filter(([id]) => SITE_BY_ID[id])
    .sort((a, b) => b[1].date.localeCompare(a[1].date) || b[1].updated - a[1].updated);

  return (
    <div className="page">
      <GopuramHeader title="Journal" local="यात्रा वृत्तांत" tiers={3} subtitle="Every lamp you have lit, newest first." />
      {entries.length ? (
        <ol className="m-0 mt-6 grid list-none gap-5 p-0">
          {entries.map(([id, v]) => {
            const s = SITE_BY_ID[id];
            return (
              <Slab key={id} as="li" inner="p-6">
                <a href={href.site(id)} className="flex items-center gap-4 text-[var(--ink)] no-underline">
                  <Diya lit color={`var(--c-${s.circuit})`} size={48} />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-[var(--ink-soft)]">
                      {formatDate(v.date)} · {CIRCUIT[s.circuit].single}
                    </span>
                    <span className="display block text-[24px] leading-tight">{s.name}</span>
                    <LocalName site={s} className="block text-[18px] text-[var(--accent)]" />
                  </span>
                </a>
                {v.journal ? (
                  <p className="mt-4 whitespace-pre-wrap border-l-2 border-[var(--gold)] pl-4">{v.journal}</p>
                ) : (
                  <p className="mt-4 text-[16px] text-[var(--ink-soft)]">
                    No journal written. <a href={href.site(id)}>Write one</a>
                  </p>
                )}
              </Slab>
            );
          })}
        </ol>
      ) : (
        <Slab className="mt-6" inner="px-6 py-10 text-center">
          <LotusMark />
          <p className="mx-auto mt-4 max-w-md">
            The journal is still blank. When you light the lamp at a temple, what you write about the visit is kept here.
          </p>
          <PlaqueLink className="mt-6" href={href.home}>Choose a circuit</PlaqueLink>
        </Slab>
      )}
    </div>
  );
}
