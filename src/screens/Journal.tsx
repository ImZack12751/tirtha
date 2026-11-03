import { CIRCUIT, SITE_BY_ID } from "../lib/sites";
import { formatDate, useVisits } from "../lib/store";
import { href } from "../lib/router";
import { hasPhoto, thumbUrl } from "../lib/photos";
import { Diya } from "../components/Diya";
import { LotusMark } from "../components/ornament";
import { ButtonLink, Card } from "../components/ui";
import { LocalName } from "../components/SiteRow";

export function Journal() {
  const visits = useVisits();
  const entries = Object.entries(visits)
    .filter(([id]) => SITE_BY_ID[id])
    .sort((a, b) => b[1].date.localeCompare(a[1].date) || b[1].updated - a[1].updated);

  return (
    <div className="page pt-8">
      <p lang="hi" className="deva text-[19px] text-[var(--accent)]">यात्रा वृत्तांत</p>
      <h1 className="text-[clamp(34px,8vw,48px)]">Journal</h1>
      <p className="mt-2 text-[var(--ink-soft)]">Every temple you have visited, newest first.</p>
      {entries.length ? (
        <ol className="m-0 mt-6 grid list-none gap-4 p-0">
          {entries.map(([id, v]) => {
            const s = SITE_BY_ID[id];
            return (
              <Card key={id} as="li" className="p-5">
                <a href={href.site(id)} className="flex items-center gap-4 text-[var(--ink)] no-underline">
                  {hasPhoto(id) ? (
                    <img className="thumb" src={thumbUrl(id)} alt="" loading="lazy" width={56} height={56} />
                  ) : (
                    <span className="thumb grid place-items-center"><Diya lit color={`var(--c-${s.circuit})`} size={32} /></span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-[var(--ink-soft)]">
                      {formatDate(v.date)} · {CIRCUIT[s.circuit].single}
                    </span>
                    <span className="serif block text-[22px] font-semibold leading-tight">{s.name}</span>
                    <LocalName site={s} className="block text-[16px] text-[var(--ink-soft)]" />
                  </span>
                </a>
                {v.journal ? (
                  <p className="serif mt-4 whitespace-pre-wrap border-l-2 border-[var(--accent)] pl-4 text-[18px] leading-relaxed">{v.journal}</p>
                ) : (
                  <p className="mt-4 text-[15px] text-[var(--ink-soft)]">
                    No journal written. <a href={href.site(id)}>Write one</a>
                  </p>
                )}
              </Card>
            );
          })}
        </ol>
      ) : (
        <Card className="mt-6 px-6 py-10 text-center">
          <LotusMark />
          <p className="mx-auto mt-4 max-w-md text-[var(--ink-soft)]">
            The journal is still blank. When you light the lamp at a temple, what you write about the visit is kept here.
          </p>
          <ButtonLink className="mt-6" href={href.home}>Choose a pilgrimage</ButtonLink>
        </Card>
      )}
    </div>
  );
}
