import { Diya } from "./Diya";
import { CIRCUIT, type Site } from "../lib/sites";
import { formatDate, type Visit } from "../lib/store";
import { href } from "../lib/router";
import { hasPhoto, thumbUrl } from "../lib/photos";

export const LocalName = ({ site, className = "" }: { site: Site; className?: string }) =>
  site.local ? (
    <span lang={site.script === "tamil" ? "ta" : "hi"} className={`${site.script} ${className}`}>
      {site.local}
    </span>
  ) : null;

/* One temple in a list: its photo, names, where it is, and whether its lamp is lit */
export function SiteRow({ site, visit, showCircuit = false }: { site: Site; visit?: Visit; showCircuit?: boolean }) {
  const lit = !!visit;
  return (
    <a href={href.site(site.id)}
      className="flex items-center gap-4 px-4 py-3 text-[var(--ink)] no-underline transition-colors hover:bg-[var(--surface-2)]">
      {hasPhoto(site.id) ? (
        <img className="thumb" src={thumbUrl(site.id)} alt="" loading="lazy" decoding="async" width={56} height={56} />
      ) : (
        <span className="thumb grid place-items-center"><Diya lit={false} size={30} /></span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2.5">
          <span className="text-[17px] font-semibold">{site.name}</span>
          <LocalName site={site} className="text-[16px] text-[var(--ink-soft)]" />
        </span>
        <span className="block truncate text-[14px] leading-snug text-[var(--ink-soft)]">
          {showCircuit ? `${CIRCUIT[site.circuit].single} · ` : ""}
          {lit ? `Visited ${formatDate(visit!.date)}` : site.celestial ? "Celestial abode" : site.place}
        </span>
      </span>
      <Diya lit={lit} color={`var(--c-${site.circuit})`} size={34} />
      <span className="sr-only">{lit ? "Lamp lit" : "Not yet visited"}</span>
    </a>
  );
}
