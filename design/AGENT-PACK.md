# Olvera Painting LLC website — agent pack (read fully before touching code)

Repo (cloud workspace): `/home/claude/op` — Astro 5 + Tailwind v4, static output. `npm run build`, `npm start` serves `dist/` on `$PORT` (Railway).
Figma file `37c1imqO768Cd8AupLBiZZ`. Only the **Homepage** is designed: Desktop 1440 frame `5:3`, Mobile 390 frame `11:2`.
Jay (the client's marketer) approved that design. Replicate it exactly. The 7 inner pages have **no Figma frame**: they reuse the homepage components, tokens and text styles and are deliberately simpler ("about 50% less elaborate than the homepage"), built from the approved copy.

Brand rules (non-negotiable): the business name is **Olvera Painting LLC** (never "Oliveras"). The logo is the client's PNG artwork (`<Logo node=…>`), never redrawn, recoloured or restyled: `logo_transparent` on light backgrounds, `logo_light` on dark ones. Only brand colours from the tokens. Bebas Neue for headings, Barlow for body/UI, Barlow Condensed SemiBold for eyebrow labels, and Caveat only for testimonial signatures.

## Tools and files you have
- Tokens and text styles: `src/styles/global.css`. Colours: `forest #448C2C, forest-dark #35701F, forest-light #74B852, ink #2F4538, evergreen #16241C, evergreen-2 #1F3328, primer #F4F5F0, mist #E3E8E0, white, cedar #B5713F, muted #5B6B60, star #FBBC04, error`.
  Text utilities with responsive prefixes, e.g. `class="tm-h2 lg:t-display-m"`:
  - desktop: `t-hero(86/82) t-display-xl t-display-l(72/70) t-display-m(56/56) t-display-s(40/42) t-display-xs(28/30) t-body-l(20/30) t-body-m(17/27) t-body-s(15/23) t-button(Barlow 700 16/20) t-eyebrow(BC 14/18 ls2.4) t-tag(BC 12) t-swatch(BC 11 ls1.6) t-signature(Caveat 34/30)`
  - mobile: `tm-hero(48/47) tm-stat(52) tm-cta(46) tm-h2(40/40) tm-form-title(34/36) tm-phone(32/34) tm-h3(30/32) tm-rating(30/30) tm-step(22/24) tm-eyebrow(12) tm-eyebrow-s(11) tm-micro(10) tm-signature(Caveat 30)`
- Breakpoints: base classes = mobile (390 design). `lg:` (≥1024px) = desktop (1440 design, 96px side padding, 1248 content). Wrap content in `mx-auto max-w-[1440px] px-[20px] lg:px-[96px]` so 1024–1439 degrades gracefully. No horizontal scroll at any width from 360 to 1600.
- Figma design context is **already cached**. Don't call Figma for it:
  - `qa/dc/5-3.slim.txt` = full desktop frame (React+Tailwind reference, `data-node-id` on every node, var() fallbacks inlined).
  - `qa/dc/11-2.tiny.txt` = full mobile frame (abbreviations: `c=` className, `id=` data-node-id, `BN` Bebas Neue, `BR` Barlow Regular, `BB` Barlow Bold, `BC` Barlow Condensed SemiBold, `CV` Caveat Bold, `col` flex-col, `nowrap` whitespace-nowrap. `items-start` and `overflow-clip` were stripped).
  - Geometry for every node: `design/meta/desktop-5-3.xml`, `design/meta/mobile-11-2.xml` (x/y relative to parent).
  - Reference renders at 1x: `qa/ref/5-3.png` (1440×7331), `qa/ref/11-2.png` (390×9217).
  - Handoff notes from the designer are summarised under "Content rules" below.
- Images:
  - Homepage Figma slots: `<Img node="<figma image node id>" alt="…" class="w-full h-full object-cover" />`. Each slot is pre-cropped exactly as in Figma at 2x (`src/data/images.json`). Desktop and mobile slots have different node ids (e.g. hero `6:4` desktop and `11:15` mobile). Render both with `hidden lg:block` / `lg:hidden` when the crop differs.
  - Inner pages: `<Photo name="…" alt="…" class="…" />` from `src/data/photos.json` (full photos, max 1200w WebP):
    - Olvera jobs, AI-retouched: `olvera-01-hero-exterior` (cedar-shake 2-storey exterior with balcony, white trim), `olvera-02-kitchen` (white shaker kitchen, rattan pendants, walnut island), `olvera-03-clay-bedroom` (terracotta/clay walls, black trim), `olvera-04-plum-wall` (plum accent wall in a black-tile bath).
    - Olvera jobs, untouched phone photos (900×1600 portrait, in progress, some with masking): `orig-bathroom-vanity`, `orig-exterior-balcony`, `orig-exterior-porch-entry`, `orig-exterior-side-siding` (grey lap siding, ladder), `orig-exterior-stairs` (cedar shake + white stairs, construction debris), `orig-gray-room-doors`, `orig-green-room-doorway`, `orig-kitchen-pendants` (floor protection paper down = masking in progress), `orig-kitchen-white-l` (masking in progress), `orig-plum-wall`, `orig-stairwell`, `orig-terracotta-bedroom`, `orig-terracotta-black-doorway`, `orig-white-doors-landing`.
    - **AI mood images, NOT Olvera jobs**: `mood-10-fog-forest`, `mood-11-brush-cutin`, `mood-12-green-cabinets`, `mood-13-craftsman-exterior`. Never put these in a "work", "project" or "before/after" context, and never caption them as an Olvera job. They're fine as decorative or illustrative images (hero backdrops, service-page illustrations) with neutral alt text.
  - Brand vectors in `public/svg/`: `fir-skyline.svg`, `oregon-desktop.svg`, `oregon-mobile.svg`, `pin-*.svg`, `dot-*.svg`, `pager.svg`. Radius circles: `public/img/radius-desktop-140.webp`, `radius-mobile-81.webp`.
- Shared components (owned by the lead or the home-B agent; **import them, don't edit or fork them**):
  - `layouts/Base.astro` (`title`, `description`, `pageClass`, `noindex`, `schema`) renders the top bar, header with a working mobile menu, `<main>`, footer and the fixed mobile call bar.
  - `components/Button.astro` (`href`, `variant: solid | outline-light | outline-dark | white | outline-white | outline-forest`, `class` for padding/width). Figma paddings: large `px-[28px] py-[18px]` (solid) or `py-[17px]` (outline 1.5px); header/section `px-[26px] py-[16px]`; mobile full width `w-full py-[17px]`. Arrow copy is two spaces plus →: `Get my free estimate  →`.
  - `components/CtaBand.astro` (optional `title`, `text`, `eyebrow`, `bg`): the green business-card CTA. End every page with it.
  - `components/FormField.astro` (label, name, type text/tel/email/select/textarea/file, size d/m, `required`, `options`) + `components/FormSubmitFields.astro` (`source`) + `src/scripts/forms.ts` (validation and error state).
  - `components/Img.astro`, `components/Photo.astro`, `components/Logo.astro`.
  - Inner-page kit in `components/inner/`: `PageHero` (tag, title, lead, photo, photoAlt, photoPosition), `Section` (bg white|primer|evergreen, eyebrow, title, intro, id, narrow), `CheckList` (items, cols), `Steps` ([title,text][]), `Faq` ([q,a][], native details/summary = keyboard accessible), `TestimonialCard` (quote, name, place, tilt).
- Data: `src/data/site.ts` has `PHONE_DISPLAY`, `PHONE_TEL`, `EMAIL`, `CCB`, `CCB_LOOKUP`, `ROUTES`, `FORM_ACTION`, and `SHOW_GOOGLE_BADGE` (false: the Figma 5.0 Google badge is a placeholder and stays hidden until real reviews exist). `src/data/schema.ts` has `housePainter`, `service()`, `breadcrumbs()` and `faqPage()`.
- Copy: the approved copy for all 8 pages is the project doc `claude/website-copy-8-pages.md`. Read it with the **Projects** tool (`method: project_read`, `path: claude/website-copy-8-pages.md`). Use your page's section **exactly as written**, including title tag, meta description, slug, headings and body. Don't invent facts. Don't add prices, warranties, years or claims that aren't in the copy.

## Dev server and QA
- Each agent runs **its own** dev server on its assigned port: `cd /home/claude/op && (nohup npx astro dev --port <PORT> --host 127.0.0.1 > /tmp/dev<PORT>.log 2>&1 &)`. Don't touch other ports. The lead's server is on 4321.
- Homepage pixel QA (home agents only):
  - Desktop: `node scripts/pixel-diff.mjs / 5:3 --base http://127.0.0.1:<PORT> --prep "document.documentElement.dataset.qa='1'"`
  - Mobile: `node scripts/pixel-diff.mjs / 11:2 --base http://127.0.0.1:<PORT> --mobile --callbar-y 9132 --prep "document.documentElement.dataset.qa='1'"`
  - Output: `qa/out/<frame>/report.json` (per-section %, geometry failures). For a visual check: `node scripts/compare-section.mjs 5:3 <y> <h> 1600`, then Read the PNG. Look at crops **only for failing sections**.
  - The `data-qa` flag shows the placeholder Google badges during QA only (CSS `html[data-qa] .op-gbadge{display:flex!important}`, already set up by the lead), so the page matches Figma while production hides them.
  - **Pass bar per section:** ≤3% mismatch; every `data-node` box within 1px (x, y, w, h); page height delta 0 (±1 for Figma's fractional frame heights). Anything above 3% must be only text anti-aliasing, confirmed with a compare crop and written down.
  - Put `data-node="<desktop id>"` and `data-node-m="<mobile id>"` on section wrappers, headings, text blocks, images, buttons and cards (not every span). Only put ids on elements whose box should match that Figma node.
  - Chrome can set text 1px higher than Figma on mobile. If you measure that consistently, fix it with a page-scoped rule in your section's `<style>`: `@media (max-width:1023.98px){ :global(.op-home) :where(.tm-body-selector…){position:relative;top:1px} }`. Measure first; don't apply it blindly.
- Inner pages (no Figma): screenshot your page with Playwright at 390 and 1440 (a sample script is at the end of this file), Read the PNGs and judge them against the homepage style. Check there's no horizontal overflow at 360/390/768/1024/1280/1440. Fix what looks broken.
- Build check before you report: `npm run build` must pass (a shared build; if it fails because of another agent's file, say so and don't edit their file).

## Implementation rules
- Translate the design-context React to semantic Astro/HTML with flex/grid and real text flow. Use arbitrary px values (`pt-[88px] gap-[28px]`). Use absolute positioning only where Figma is layered (hero overlays, the map, tape strips, the form bar overlapping the hero edge).
- When mobile and desktop structure or copy differ, render both blocks with `lg:hidden` / `hidden lg:flex`. Keep that to the minimum.
- Homepage copy must match Figma character for character (it differs from the copy doc in places, e.g. mobile labels. **Figma wins on the homepage**; the copy doc wins on inner pages).
- Semantic and accessible: one `<h1>` per page, then h2/h3 in order, `<section aria-labelledby>`, alt text that describes the photo (decorative images `alt=""`), buttons are `<a>` or `<button>`, visible focus.
- **Everything clickable works:** phone → `PHONE_TEL`; every "free estimate" CTA → `ROUTES.freeEstimate`; service links → their routes; "See more of our work" → `ROUTES.ourWork`; "See our service area" → `ROUTES.serviceArea`; CCB mentions may link to `CCB_LOOKUP` (target _blank, rel noopener); email → mailto. No `href="#"`.
- Forms: `<form action={FORM_ACTION} method="POST" data-lead-form novalidate>` + `<FormSubmitFields source="<page/section>" />` + `FormField`s + `<button type="submit">`. Load the script once per page with a form: `<script>import '../../scripts/forms.ts'</script>` (adjust the path). Use human-readable field names: `Name`, `Phone`, `Email`, `Address or ZIP`, `What needs painting?`, `Anything we should know?`, `Project details`. Required: Name and Phone.
- Performance: no client JS except the menu (done), forms, the FAQ (native, no JS) and at most a tiny testimonial scroller. No external requests (fonts are self-hosted). Images lazy except the hero.
- Title ≤ 60 characters, meta description ≤ 155 (use the copy doc's). JSON-LD: service pages `service()` + `breadcrumbs()` (+ `faqPage()` when the page has an FAQ); About/Service area/Our work `breadcrumbs()`; Free estimate `housePainter` + `breadcrumbs()`. No review or rating schema.
- Don't edit files you don't own (ownership table below). If you need a change in a shared file, put it in your final report and the lead will make it.

## Content rules (designer handoff + copy notes)
- The Google badge (5.0★) is a placeholder, hidden in production (`SHOW_GOOGLE_BADGE`). Wrap every badge in an element with class `op-gbadge` and render it with `style="display:none"` unless `SHOW_GOOGLE_BADGE` is true (QA reveals it).
- All testimonials are SAMPLE text that will be replaced with real signed testimonials. Use them only where the copy doc places them.
- "Hablamos español" and "Mon–Fri" hours are unverified but approved for the design. Keep them as written.
- There are no real cabinet before/after photos. On Our work, show the "Cabinets" filter only if cabinet photos exist (they don't), so there's no Cabinets filter. Don't use `mood-12-green-cabinets` as a job photo.
- The copy doc lists image slots (blue-green bedroom, hallway, mudroom, masking) that were never received. Substitute the closest real photo from the list above and write an honest caption (what the photo shows). Masking in progress = `orig-kitchen-pendants` or `orig-kitchen-white-l`. Mark each substitution in your report.
- The cedar-shake exterior originals may show a "CAPPER Construction" sign. Prefer `olvera-01-hero-exterior` (sign removed).
- The About page has no photo of Efrain. Use a real job photo (e.g. `olvera-01-hero-exterior` or `orig-exterior-porch-entry`) or the business-card style panel. Never fake a portrait.
- Service area map: reuse the homepage Oregon outline + 50-mile radius assets (desktop `oregon-desktop.svg`, `radius-desktop-140.webp`, `pin-desktop.svg`). No Google Maps embed (no external requests).

## Ownership (8 agents, parallel)
| Agent | Port | Owns (only these files) | Scope |
|---|---|---|---|
| home-A | 4331 | `src/sections/home/{Hero,TrustStrip,Services,RecentWork}.astro` | Figma 5:3 sections 6:2, 7:2, 7:15, 8:2 and mobile 11:14, 11:19, 11:32, 11:59, 12:2, 12:45 (hero, estimate form, trust stats, services, recent work) |
| home-B | 4332 | `src/sections/home/{Process,WhyOlvera,Testimonials,ServiceArea}.astro` **and the shared chrome** `src/components/{Header,Footer,CallBar,CtaBand}.astro` | Figma 8:28, 8:65, 9:2, 9:38, 10:2, 10:17, 5:4, 5:11 and mobile 12:65, 13:2, 13:18, 13:44, 13:78, 13:89, 11:3, 11:5, 13:104. Other agents rely on the chrome: keep the props APIs stable |
| interior | 4333 | `src/pages/interior-painting/index.astro`, `src/sections/interior/*` | copy doc PAGE 2 |
| exterior | 4334 | `src/pages/exterior-painting/index.astro`, `src/sections/exterior/*` | PAGE 3 |
| cabinets | 4335 | `src/pages/cabinet-painting/index.astro`, `src/sections/cabinets/*` | PAGE 4 |
| about-area | 4336 | `src/pages/about/index.astro`, `src/pages/service-area/index.astro`, `src/sections/{about,service-area}/*` | PAGES 5 and 7 |
| our-work | 4337 | `src/pages/our-work/index.astro`, `src/sections/our-work/*` | PAGE 6 (filterable photo grid: All / Interior / Exterior, keyboard-accessible tabs or buttons with aria-pressed, plus testimonials) |
| estimate | 4338 | `src/pages/free-estimate/index.astro`, `src/pages/free-estimate/thank-you/index.astro` (noindex), `src/pages/404.astro`, `src/sections/estimate/*` | PAGE 8 (full form with photo upload), thank-you page, 404 |

The lead owns everything else (`global.css`, `site.ts`, `schema.ts`, `Base.astro`, `Button`, `FormField`, `FormSubmitFields`, `Img`, `Photo`, `Logo`, `components/inner/*`, `scripts/*`, `qa/*`, `index.astro`).
The service pages (interior, exterior, cabinets) must look like one family. Use this order: `PageHero` → intro/"What we paint" (`Section` + `CheckList`, with a photo beside it on desktop) → process (`Steps`) → an optional colour/sheen table (interior) or timing note (exterior) or care note (cabinets) → cost factors (`CheckList`, primer bg) → FAQ (`Faq`) → `CtaBand` (title from the copy doc's closing heading, text from its closing line).

## Final report (your last message, compact)
- Home agents: per frame, overall %, per-section %, geometry within1px/checked, height delta, plus the remaining failures and why.
- Page agents: the routes built, sections, photos used (and substitutions), and the 390/1440 screenshots you checked; overflow check result; build result.
- Shared-file change requests for the lead.
- No long prose.

## Playwright screenshot snippet (inner pages)
```js
// node shot.mjs <route> <port>  -> /tmp/shot-<w>.png
import { chromium } from 'playwright-core';
const [route, port] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const w of [390, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto(`http://127.0.0.1:${port}${route}`, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { for (const i of document.images) i.loading = 'eager'; await new Promise(r => setTimeout(r, 800)); });
  const ow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  console.log(w, 'overflow', ow);
  await p.screenshot({ path: `/tmp/shot-${route.replace(/\W/g,'') || 'home'}-${w}.png`, fullPage: true });
}
await b.close();
```
Full-page shots are tall. To look at one, crop it with sharp (`sharp(f).extract({left:0,top:y,width:w,height:1200})`) and Read the crop. Don't Read a 9000px image.
