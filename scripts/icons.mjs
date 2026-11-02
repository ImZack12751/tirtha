// Renders the PWA icons from public/icon.svg. Run with: npm run icons
import sharp from "sharp";
import { readFile } from "node:fs/promises";

const svg = await readFile(new URL("../public/icon.svg", import.meta.url));
const out = (name) => new URL(`../public/${name}`, import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

await sharp(svg, { density: 300 }).resize(192, 192).png().toFile(out("icon-192.png"));
await sharp(svg, { density: 300 }).resize(512, 512).png().toFile(out("icon-512.png"));
await sharp(svg, { density: 300 }).resize(180, 180).png().toFile(out("apple-touch-icon.png"));
// maskable: keep the lamp inside the 80% safe zone
const inner = await sharp(svg, { density: 300 }).resize(400, 400).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#1A1210" } })
  .composite([{ input: inner, left: 56, top: 56 }])
  .png()
  .toFile(out("icon-maskable-512.png"));
console.log("icons written");
