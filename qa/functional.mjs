// Functional QA on the production build: crawl every page from the homepage, check status, h1, links, tel, forms,
// horizontal overflow 360-1600, mobile menu, empty-submit blocking, FAQ keyboard, Our work filter, 404.
// Usage: serve dist on :4400, then node qa/functional.mjs
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://127.0.0.1:4400';
const TEL = 'tel:+15038408056';
const FORM = { action: 'https://formsubmit.co/olverapaintingllc@gmail.com', cc: 'nayem.adsmanager@gmail.com', next: '/free-estimate/thank-you/' };
const EXTERNAL_OK = ['https://search.ccb.state.or.us/search/'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await (await browser.newContext()).newPage();
const START = ['/', '/free-estimate/thank-you/'];
const seen = new Set(START); const queue = [...START]; const issues = []; const pages = []; const status = {};
while (queue.length) {
  const path = queue.shift();
  const res = await page.goto(BASE + path, { waitUntil: 'load' });
  status[path] = res.status();
  const info = await page.evaluate(() => ({
    h1: document.querySelectorAll('h1').length, title: document.title,
    robots: document.querySelector('meta[name=robots]')?.content || 'index',
    desc: document.querySelector('meta[name=description]')?.content?.length || 0,
    hashLinks: [...document.querySelectorAll('a[href="#"], a:not([href])')].length,
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    tel: [...document.querySelectorAll('a[href^="tel:"]')].map((a) => a.getAttribute('href')),
    forms: [...document.querySelectorAll('form[data-lead-form]')].map((f) => ({ action: f.action, cc: f.querySelector('[name=_cc]')?.value, next: f.querySelector('[name=_next]')?.value, honey: !!f.querySelector('[name=_honey]') })),
    imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
    brokenImgs: [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map((i) => i.src),
    ids: (() => { const c = {}; document.querySelectorAll('[id]').forEach((e) => { c[e.id] = (c[e.id] || 0) + 1; }); return Object.entries(c).filter(([, n]) => n > 1).map(([k]) => k); })(),
    badgeVisible: [...document.querySelectorAll('.op-gbadge')].some((e) => e.getClientRects().length && getComputedStyle(e).display !== 'none'),
  }));
  pages.push({ path, ...info });
  if (info.h1 !== 1) issues.push(`${path}: ${info.h1} h1`);
  if (info.hashLinks) issues.push(`${path}: ${info.hashLinks} dead/# links`);
  if (info.imgsNoAlt) issues.push(`${path}: ${info.imgsNoAlt} img without alt`);
  if (info.brokenImgs.length) issues.push(`${path}: broken images ${info.brokenImgs.join(', ')}`);
  if (info.ids.length) issues.push(`${path}: duplicate ids ${info.ids.join(', ')}`);
  if (info.badgeVisible) issues.push(`${path}: placeholder Google badge visible in production`);
  if (info.title.length > 60) issues.push(`${path}: title ${info.title.length} chars`);
  for (const t of info.tel) if (t !== TEL) issues.push(`${path}: odd tel ${t}`);
  for (const f of info.forms) if (f.action !== FORM.action || f.cc !== FORM.cc || !f.next.endsWith(FORM.next) || !f.honey) issues.push(`${path}: form misconfigured ${JSON.stringify(f)}`);
  for (const l of info.links) {
    if (!l || l.startsWith('tel:') || l.startsWith('mailto:')) continue;
    if (l.startsWith('#')) { const ok = await page.evaluate((id) => !!document.getElementById(id), l.slice(1)); if (!ok) issues.push(`${path}: anchor ${l} has no target`); continue; }
    if (/^https?:/.test(l)) { if (!EXTERNAL_OK.includes(l)) issues.push(`${path}: external link ${l}`); continue; }
    const p = new URL(l, BASE + path).pathname;
    if (!seen.has(p)) { seen.add(p); queue.push(p); }
  }
}
for (const [p, s] of Object.entries(status)) if (s !== 200) issues.push(`${p}: HTTP ${s}`);
const ALL = Object.keys(status);
for (const w of [360, 390, 768, 1024, 1100, 1280, 1440, 1600]) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const p of ALL) {
    await page.goto(BASE + p, { waitUntil: 'load' });
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) issues.push(`${p} @${w}: horizontal overflow ${sw}px`);
  }
}
// mobile menu: open, Esc closes, focus returns
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(BASE + '/', { waitUntil: 'load' });
await page.click('.op-menu-btn');
const open = await page.evaluate(() => !document.getElementById('op-menu').hidden && document.querySelector('.op-menu-btn').getAttribute('aria-expanded'));
await page.keyboard.press('Escape');
const closed = await page.evaluate(() => document.getElementById('op-menu').hidden && document.activeElement === document.querySelector('.op-menu-btn'));
if (open !== 'true' || !closed) issues.push(`menu: open=${open} closedAfterEsc+focus=${closed}`);
// empty submit must block and show error state (homepage hero form + estimate page)
for (const [p, w] of [['/', 1440], ['/', 390], ['/free-estimate/', 1440]]) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(BASE + p, { waitUntil: 'load' });
  let posted = false; const h = (r) => { if (r.url().includes('formsubmit.co')) posted = true; }; page.on('request', h);
  await page.locator('form[data-lead-form] button[type=submit]:visible').first().click();
  await page.waitForTimeout(300);
  const errs = await page.evaluate(() => document.querySelectorAll('[data-field][data-state=error]').length);
  page.off('request', h);
  if (posted || errs < 1) issues.push(`${p}@${w} empty submit: posted=${posted} errorFields=${errs}`);
}
// FAQ keyboard (native details/summary)
await page.setViewportSize({ width: 1440, height: 900 });
for (const p of ['/interior-painting/', '/exterior-painting/', '/cabinet-painting/']) {
  await page.goto(BASE + p, { waitUntil: 'load' });
  const s = page.locator('details > summary').first();
  if (!(await s.count())) { issues.push(`${p}: no FAQ`); continue; }
  await s.focus(); await page.keyboard.press('Enter'); const a = await page.evaluate(() => document.querySelector('details').open);
  await page.keyboard.press(' '); const b = await page.evaluate(() => document.querySelector('details').open);
  if (!a || b) issues.push(`${p}: FAQ keyboard toggle ${a}->${b}`);
}
// Our work filter
await page.goto(BASE + '/our-work/', { waitUntil: 'load' });
const btn = page.locator('button[aria-pressed]', { hasText: 'Exterior' });
if (await btn.count()) {
  await btn.click(); await page.waitForTimeout(100);
  const vis = await page.evaluate(() => [...document.querySelectorAll('[data-cat]')].filter((e) => e.getClientRects().length).map((e) => e.dataset.cat));
  if (!vis.length || vis.some((c) => c !== 'exterior')) issues.push(`our-work filter: visible=${vis.join(',')}`);
} else issues.push('our-work: no filter buttons');
const r404 = await page.goto(BASE + '/does-not-exist/'); if (r404.status() !== 404) issues.push('404 page returns ' + r404.status());
const sm = await page.goto(BASE + '/sitemap.xml'); if (sm.status() !== 200) issues.push('sitemap ' + sm.status());
await browser.close();
console.log(JSON.stringify({ pagesCrawled: pages.length, pages: pages.map((p) => `${status[p.path]} ${p.robots === 'index' ? 'INDEX  ' : 'noindex'} h1=${p.h1} ${p.path} "${p.title}" (${p.title.length}) desc=${p.desc} forms=${p.forms.length}`), issues }, null, 1));
