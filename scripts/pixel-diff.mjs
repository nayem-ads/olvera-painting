// Pixel + geometry diff of a built page against its Figma frame render.
// Usage: node scripts/pixel-diff.mjs <route> <frameId> [--base http://localhost:4321] [--hide ".sel,.sel2"] [--click ".sel"] [--prep "js"]
// Conventions: data-node = desktop Figma id, data-node-m = mobile Figma id; pass --mobile for 390 frames.
// Per-page prep scripts (node-id swaps for mobile frames, call-bar placement, form states) live in qa/ and are driven by qa/run-all.sh.
// Needs: qa/ref/<frame-id-with-dash>.png (Figma 1x render) and design/meta/*.xml (Figma metadata).
// Viewport width = Figma frame width (1280 or 390). DPR 1 to match 1x renders.
// Geometry: every element with data-node="<figma node id>" is compared to that node's box in the frame.
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const route = args[0], frameId = args[1];
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const base = opt('base', process.env.BASE_URL || 'http://localhost:4321');
const hide = opt('hide', '');
const click = opt('click', '');
const prep = opt('prep', '');
const mobile = args.includes('--mobile'); // 390 frames: data-node-m -> data-node, drop desktop-only ids, pin call bar at Figma y
const callbarY = opt('callbar-y', '756');
// --approved: Jay-approved deviations from the Figma frames (Sep 2026) are excluded from the score, not hidden:
//   desktop sticky navy header (masked: ref pixels copied into its box), navy mobile call bar (masked),
//   footer without the "We represent the insured only." line (footer section reported but excluded from the
//   overall %, and its height change is removed from heightDelta; heightDeltaRaw keeps the raw number),
//   Header/Footer/call-bar instance boxes are excluded from geometry.
const approved = args.includes('--approved');
const key = frameId.replace(':', '-');
const refPath = `qa/ref/${key}.png`;
const outDir = `qa/out/${key}`;
fs.mkdirSync(outDir, { recursive: true });

// ---- parse Figma metadata: absolute boxes relative to the frame ----
function loadBoxes() {
  for (const f of fs.readdirSync('design/meta')) {
    const xml = fs.readFileSync(path.join('design/meta', f), 'utf8');
    if (!xml.includes(`id="${frameId}"`)) continue;
    const boxes = {}; const stack = []; let frameDepth = -1; let sections = [];
    for (const line of xml.split('\n')) {
      const m = line.match(/^(\s*)<(\/?)([\w-]+)([^>]*?)(\/?)>/);
      if (!m) continue;
      const depth = m[1].length / 2;
      if (m[2]) { stack.length = depth; continue; }
      const a = {}; for (const mm of m[4].matchAll(/(\w+)="([^"]*)"/g)) a[mm[1]] = mm[2];
      stack.length = depth;
      const parent = stack[depth - 1];
      const x = +a.x, y = +a.y;
      let abs;
      if (a.id === frameId) { abs = { x: 0, y: 0 }; frameDepth = depth; }
      else if (parent && parent.inFrame) abs = { x: parent.abs.x + x, y: parent.abs.y + y };
      const node = { id: a.id, name: a.name, abs, inFrame: !!abs, w: +a.width, h: +a.height, hidden: a.hidden === 'true' };
      stack[depth] = node;
      if (abs) boxes[a.id] = { x: abs.x, y: abs.y, w: node.w, h: node.h, name: a.name, hidden: node.hidden };
      if (abs && depth === frameDepth + 1) sections.push({ id: a.id, name: a.name, y: abs.y, h: node.h });
      if (!m[5] && false) {}
    }
    return { boxes, sections, frame: boxes[frameId] };
  }
  throw new Error('frame not in design/meta: ' + frameId);
}
const { boxes, sections, frame } = loadBoxes();
const W = Math.round(frame.w);

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
// No HMR client (dev-server reloads from other edits would abort the run).
await page.route('**/@vite/client', (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
await page.goto(base + route, { waitUntil: 'networkidle' });
await page.evaluate(() => document.querySelectorAll('astro-dev-toolbar,vite-error-overlay').forEach((e) => e.remove()));
await page.addStyleTag({ content: `*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important} html{scroll-behavior:auto!important}` + (hide ? `${hide}{visibility:hidden!important}` : '') });
if (click) for (const s of click.split('|')) { await page.click(s); await page.waitForTimeout(150); }
if (mobile) await page.evaluate((y) => {
  document.querySelectorAll('[data-node],[data-node-m]').forEach((e) => { if (e.dataset.nodeM) e.dataset.node = e.dataset.nodeM; else delete e.dataset.node; });
  const cb = document.querySelector('.op-callbar'); if (cb) cb.style.cssText += `;position:absolute;top:${y}px;bottom:auto`;
}, callbarY);
if (prep) await page.evaluate(prep);
// Load every image (lazy ones inside display:none blocks never fire otherwise), then decode before the shot.
await page.evaluate(async () => {
  await document.fonts.ready;
  const imgs = [...document.images];
  for (const i of imgs) { i.loading = 'eager'; i.decoding = 'sync'; }
  await Promise.all(imgs.map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; setTimeout(r, 8000); })));
  await Promise.all(imgs.map((i) => i.decode().catch(() => 0)));
});
await page.waitForTimeout(300);

const masks = approved ? await page.evaluate((W) => {
  const out = []; const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };
  const h = document.querySelector('header.op-header'); if (h && W >= 1024) out.push(box(h));
  const cb = document.querySelector('.op-callbar'); if (cb && W < 1024 && cb.getBoundingClientRect().height) out.push(box(cb));
  return out; }, W) : [];
const footerH = await page.evaluate(() => { const f = document.querySelector('footer'); return f ? f.getBoundingClientRect().height : null; });
const geo = await page.evaluate(() => [...document.querySelectorAll('[data-node]')].map((el) => { const r = el.getBoundingClientRect(); return { id: el.dataset.node, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }));
const shot = await page.screenshot({ fullPage: true });
await browser.close();
fs.writeFileSync(`${outDir}/actual.png`, shot);

const ref = PNG.sync.read(fs.readFileSync(refPath));
const act = PNG.sync.read(shot);
const w = Math.min(ref.width, act.width), h = Math.min(ref.height, act.height);
const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
const R = crop(ref), A = crop(act), D = new PNG({ width: w, height: h });
for (const m of masks) { const x0 = Math.max(0, Math.floor(m.x)), y0 = Math.max(0, Math.floor(m.y)), x1 = Math.min(w, Math.ceil(m.x + m.w)), y1 = Math.min(h, Math.ceil(m.y + m.h));
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const i = (y * w + x) * 4; for (let k = 0; k < 4; k++) A.data[i + k] = R.data[i + k]; } }
let total = pixelmatch(R.data, A.data, D.data, w, h, { threshold: 0.1, includeAA: false, alpha: 0.2 });
fs.writeFileSync(`${outDir}/diff.png`, PNG.sync.write(D));

// per-section mismatch
const secReport = sections.map((s) => {
  const y0 = Math.max(0, Math.round(s.y)), y1 = Math.min(h, Math.round(s.y + s.h));
  if (y1 <= y0) return { section: s.name, id: s.id, mismatchPct: null, note: 'outside compared height' };
  let bad = 0;
  for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (D.data[i] === 255 && D.data[i + 1] === 0 && D.data[i + 2] === 0) bad++; }
  return { section: s.name, id: s.id, y: y0, h: y1 - y0, mismatchPct: +(100 * bad / ((y1 - y0) * w)).toFixed(2), ...(approved && /^(Footer|Header|Mobile call bar)/.test(s.name) ? { approvedExcluded: true } : {}) };
});

// geometry
const isApprovedNode = (b) => approved && /^(Header|Footer|Mobile call bar)/.test(b.name || '');
const geoRep = geo.map((g) => { const b = boxes[g.id]; if (!b) return { id: g.id, error: 'node id not in frame' };
  if (isApprovedNode(b)) return { id: g.id, name: b.name, approved: true, ok: true };
  const d = { dx: +(g.x - b.x).toFixed(1), dy: +(g.y - b.y).toFixed(1), dw: +(g.w - b.w).toFixed(1), dh: +(g.h - b.h).toFixed(1) };
  return { id: g.id, name: b.name, ...d, ok: Math.max(Math.abs(d.dx), Math.abs(d.dy), Math.abs(d.dw), Math.abs(d.dh)) <= 1 }; });
const footSec = approved ? sections.find((s) => /^Footer/.test(s.name)) : null;
if (footSec) { const fy = Math.min(h, Math.round(footSec.y)); let bad = 0;
  for (let y = fy; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4; if (D.data[i] === 255 && D.data[i + 1] === 0 && D.data[i + 2] === 0) bad++; }
  total -= bad; }
const cmpH = footSec ? Math.min(h, Math.round(footSec.y)) : h;
const rawDelta = act.height - ref.height;
const report = {
  route, frameId, viewport: W, refHeight: ref.height, actualHeight: act.height,
  heightDelta: footSec && footerH != null ? +(rawDelta - (footerH - footSec.h)).toFixed(1) : rawDelta, heightDeltaRaw: rawDelta, approved,
  mismatchPct: +(100 * total / (w * cmpH)).toFixed(2),
  geometry: { checked: geoRep.length, within1px: geoRep.filter((g) => g.ok).length, failures: geoRep.filter((g) => !g.ok) },
  sections: secReport,
};
fs.writeFileSync(`${outDir}/report.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, geometry: { ...report.geometry, failures: report.geometry.failures.slice(0, 25) } }, null, 1));
