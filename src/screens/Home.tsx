import { CIRCUITS, SITES, SITE_BY_ID, TOTAL } from "../lib/sites";
import { useVisits } from "../lib/store";
import { href } from "../lib/router";
import { COVER, photoUrl } from "../lib/photos";
import { Count, Emblem } from "../components/Emblems";
import { LotusMark } from "../components/ornament";
import { Card, Hero, PhotoCredit } from "../components/ui";
import { SiteRow } from "../components/SiteRow";

export function Home() {
  const visits = useVisits();
  const lit = new Set(Object.keys(visits));
  const recent = Object.entries(visits)
    .filter(([id]) => SITE_BY_ID[id])
    .sort((a, b) => b[1].date.localeCompare(a[1].date) || b[1].updated - a[1].updated)
    .slice(0, 5);

  return (
    <div className="page">
      <Hero photo={COVER.home} tall alt="Somnath temple">
        <p lang="hi" className="deva soft text-[22px]">तीर्थ</p>
        <h1 className="text-[clamp(44px,11vw,72px)] leading-none">Tirtha</h1>
        <p className="soft mt-3 max-w-md text-[18px]">A lamp for every temple your family reaches.</p>
        <p className="mt-5 inline-flex items-baseline gap-2 rounded-full bg-white/15 px-4 py-1.5 text-[16px] font-semibold">
          <span className="serif text-[22px]">{lit.size}</span> of {TOTAL} temples visited
        </p>
      </Hero>
      <PhotoCredit id={COVER.home} className="mt-2" />

      <h2 className="mt-8 text-[26px]">Pilgrimages</h2>
      <ul className="m-0 mt-4 grid list-none gap-4 p-0 md:grid-cols-2">
        {CIRCUITS.map((c) => {
          const sites = SITES[c.id];
          const n = sites.filter((s) => lit.has(s.id)).length;
          return (
            <li key={c.id}>
              <a href={href.circuit(c.id)} className="photo lift on-photo flex aspect-[4/3] flex-col justify-end rounded-[20px] no-underline sm:aspect-[16/11]">
                <img src={photoUrl(COVER[c.id])} alt="" loading="lazy" decoding="async" />
                <div className="flex items-end justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <p lang={c.script === "tamil" ? "ta" : "hi"} className={`${c.script} soft text-[17px]`}>{c.local}</p>
                    <h3 className="text-[28px] leading-tight">{c.name}</h3>
                    <div className="mt-1"><Count lit={n} total={c.total} /></div>
                  </div>
                  <span className="shrink-0 rounded-full bg-black/40 p-1.5"><Emblem circuit={c.id} sites={sites} lit={lit} size={80} /></span>
                </div>
              </a>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="recent" className="mt-10">
        <h2 id="recent" className="mb-4 text-[26px]">Recently visited</h2>
        {recent.length ? (
          <Card className="overflow-hidden">
            <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">
              {recent.map(([id, v]) => (
                <li key={id}><SiteRow site={SITE_BY_ID[id]} visit={v} showCircuit /></li>
              ))}
            </ul>
          </Card>
        ) : (
          <Card className="px-6 py-10 text-center">
            <LotusMark />
            <p className="mx-auto mt-4 max-w-md text-[var(--ink-soft)]">
              Nothing here yet. Open a pilgrimage above and light the lamp at each temple your family has visited.
            </p>
          </Card>
        )}
      </section>
    </div>
  );
}
