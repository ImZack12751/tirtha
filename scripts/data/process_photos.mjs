import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const require = createRequire("C:/Users/Hp/tirtha/package.json");
const sharp = require("sharp");

const [dir, app] = process.argv.slice(2);
const meta = JSON.parse(readFileSync(`${dir}/photos_meta.json`, "utf8"));
// idols or deity paintings as the subject, wrong subject, or too weak to use
const DROP = new Set(["sp-01", "sp-03", "sp-12", "sp-19", "sp-23", "sp-24", "sp-25", "sp-35", "dd-037", "dd-046", "dd-048", "dd-097", "dd-103"]);

mkdirSync(`${app}/public/photos/t`, { recursive: true });
const credits = {};
for (const [id, m] of Object.entries(meta)) {
  if (DROP.has(id)) continue;
  const img = sharp(m.raw).rotate();
  await img.clone().resize({ width: 1080, withoutEnlargement: true }).webp({ quality: 55, effort: 6 }).toFile(`${app}/public/photos/${id}.webp`);
  await img.clone().resize(160, 160, { fit: "cover" }).webp({ quality: 62 }).toFile(`${app}/public/photos/t/${id}.webp`);
  const artist = m.artist.replace(/\s*\(talk\)\s*/i, "").replace(/^User:/, "").trim() || "Unknown author";
  credits[id] = { artist, license: m.license || "See file page", page: m.page };
}
writeFileSync(`${app}/src/data/photos.json`, JSON.stringify(credits, null, 1));
console.log("processed", Object.keys(credits).length);
