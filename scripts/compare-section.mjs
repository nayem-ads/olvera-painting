// Side-by-side crop for visual review: Figma | Build | Diff.
// Usage: node scripts/compare-section.mjs <frameId> <y> <height> [maxWidthPx]
// Run pixel-diff.mjs first (it writes qa/out/<frame>/actual.png and diff.png).
import { PNG } from 'pngjs';
import sharp from 'sharp';
import fs from 'node:fs';
const [frameId, y0, hh, maxW] = process.argv.slice(2);
const key = frameId.replace(':', '-');
const y = Math.max(0, +y0), h = +hh;
const parts = [`qa/ref/${key}.png`, `qa/out/${key}/actual.png`, `qa/out/${key}/diff.png`];
const bufs = [];
for (const p of parts) {
  const m = await sharp(p).metadata();
  const hc = Math.max(1, Math.min(h, m.height - y));
  bufs.push(await sharp(p).extract({ left: 0, top: Math.min(y, m.height - 1), width: m.width, height: hc }).extend({ bottom: h - hc, background: '#ff00ff' }).png().toBuffer());
}
const w = (await sharp(bufs[0]).metadata()).width;
const gap = 12;
let img = sharp({ create: { width: w * 3 + gap * 2, height: h, channels: 3, background: '#ff00ff' } })
  .composite(bufs.map((b, i) => ({ input: b, left: i * (w + gap), top: 0 })));
const out = `qa/out/${key}/cmp-${y}.png`;
let buf = await img.png().toBuffer();
if (maxW) buf = await sharp(buf).resize({ width: +maxW }).png().toBuffer();
fs.writeFileSync(out, buf);
console.log(out);
