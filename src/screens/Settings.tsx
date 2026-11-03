import { useRef, useState } from "react";
import { clearAll, exportBackup, importBackup, setTheme, today, useThemePref, useVisits, type ThemePref } from "../lib/store";
import { Button, Card, Confirm, useToast } from "../components/ui";

const THEMES: { id: ThemePref; label: string; hint: string }[] = [
  { id: "system", label: "Follow device", hint: "Day or night with your phone" },
  { id: "sandstone", label: "Light", hint: "Always light" },
  { id: "sanctum", label: "Dark", hint: "Always dark" },
];

export function Settings() {
  const pref = useThemePref();
  const visits = useVisits();
  const toast = useToast();
  const file = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const count = Object.keys(visits).length;

  const doExport = () => {
    const url = URL.createObjectURL(exportBackup());
    const a = document.createElement("a");
    a.href = url;
    a.download = `tirtha-backup-${today()}.json`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast(`Backup of ${count} ${count === 1 ? "visit" : "visits"} saved as ${a.download}.`);
  };

  const doImport = async (f: File) => {
    try {
      const r = importBackup(await f.text());
      if (!r.saved) return toast("Could not save on this device. Check that storage is allowed for this app.");
      const parts = [`${r.added} new`, `${r.updated} updated`];
      if (r.kept) parts.push(`${r.kept} kept as they are here`);
      if (r.skipped) parts.push(`${r.skipped} not recognised`);
      toast(`Backup restored: ${parts.join(", ")}.`);
    } catch (e) {
      toast(e instanceof SyntaxError ? "That file could not be read. Choose a Tirtha backup file." : (e as Error).message);
    }
  };

  return (
    <div className="page">
      <h1 className="pt-8 text-[clamp(34px,8vw,48px)]">Settings</h1>

      <Card className="mt-6 p-6">
        <h2 className="text-[22px]">Appearance</h2>
        <div role="radiogroup" aria-label="Theme" className="mt-4 grid gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <Button key={t.id} role="radio" aria-checked={pref === t.id} onClick={() => { setTheme(t.id); toast(`Theme set to ${t.label}.`); }} className="w-full">
              <span className="flex flex-col items-center py-2 leading-snug">
                {t.label}
                <span className="text-[13px] font-normal opacity-75">{t.hint}</span>
              </span>
            </Button>
          ))}
        </div>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[22px]">Backup</h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          Your lamps and journal live only on this device. Save a backup file now and then, and restore it on a new phone.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button tone="primary" onClick={doExport}>Save backup file</Button>
          <Button onClick={() => file.current?.click()}>Restore from backup</Button>
          <input ref={file} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) doImport(f); }} />
        </div>
        <p className="mt-3 text-[15px] text-[var(--ink-soft)]">Restoring adds the visits in the file. Where a temple is in both, the more recently edited visit is kept.</p>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[22px]">Start afresh</h2>
        <p className="mt-2 text-[var(--ink-soft)]">Delete every visit and journal entry on this device.</p>
        <Button tone="danger" className="mt-4" disabled={!count} onClick={() => setConfirmClear(true)}>Delete all visits</Button>
      </Card>

      <Card className="mt-5 p-6">
        <h2 className="text-[22px]">Sources</h2>
        <ul className="mt-3 grid gap-2 pl-5 text-[16px]">
          <li>
            Temple lists, names and locations: Wikipedia articles <a href="https://en.wikipedia.org/wiki/Jyotirlinga" target="_blank" rel="noopener">Jyotirlinga</a>,{" "}
            <a href="https://en.wikipedia.org/wiki/Shakti_Peetha" target="_blank" rel="noopener">Shakti Peetha</a>,{" "}
            <a href="https://en.wikipedia.org/wiki/Char_Dham" target="_blank" rel="noopener">Char Dham</a> and{" "}
            <a href="https://en.wikipedia.org/wiki/Divya_Desam" target="_blank" rel="noopener">Divya Desam</a>, and each temple's own article for its coordinates.
          </li>
          <li>
            The 51 Shakti Peethas and their Devanagari names follow the Tantra Chudamani list on{" "}
            <a href="https://hi.wikipedia.org/wiki/%E0%A4%B6%E0%A4%95%E0%A5%8D%E0%A4%A4%E0%A4%BF_%E0%A4%AA%E0%A5%80%E0%A4%A0" target="_blank" rel="noopener">Hindi Wikipedia</a>.
            Divya Desam names in Tamil are the titles of their Tamil Wikipedia articles.
          </li>
          <li>Temple photos: Wikimedia Commons, under the licence shown with each photo. Photos showing deity images were left out on purpose.</li>
          <li>Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors.</li>
        </ul>
      </Card>

      <Confirm
        open={confirmClear}
        title="Delete all visits?"
        body={<p>All {count} visits and their journals will be removed from this device. Save a backup first if you may want them back.</p>}
        confirmLabel="Delete all"
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false);
          toast(clearAll() ? `${count} ${count === 1 ? "visit" : "visits"} deleted. Every lamp is unlit.` : "Could not save on this device.");
        }}
      />
    </div>
  );
}
