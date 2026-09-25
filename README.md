# Olvera Painting LLC website

The site is built from the Figma file `37c1imqO768Cd8AupLBiZZ` (Homepage: desktop 1440 `5:3`, mobile 390 `11:2`) with Astro 5 and Tailwind v4. The output is a static site served by `serve`.

## Pages
| Route | Source | Indexed |
|---|---|---|
| `/` | Figma 5:3 / 11:2, pixel-matched | yes |
| `/interior-painting/`, `/exterior-painting/`, `/cabinet-painting/` | copy doc pages 2–4, built with the homepage components | yes |
| `/our-work/` (filter: All / Interior / Exterior) | page 6 | yes |
| `/about/`, `/service-area/` | pages 5 and 7 | yes |
| `/free-estimate/` (form with photo upload) | page 8 | yes |
| `/free-estimate/thank-you/`, `404` | form redirect, not found | no |

The copy comes from the project doc `claude/website-copy-8-pages.md` (draft 2). The homepage uses Figma's text exactly.

## Develop
```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # outputs to dist/
npm start          # serves dist/ on $PORT (default 3000)
```

## Deploy on Railway
1. New Project → Deploy from GitHub repo → pick this repo.
2. Railway detects Node and runs `npm install`, `npm run build`, then `npm start`. `npm start` listens on Railway's `$PORT`.
3. Optional variable: `PUBLIC_SITE_URL=https://yourdomain.com`, used for canonical URLs and the sitemap (default `https://olverapaintingllc.com`).
4. Settings → Networking → Generate Domain, or add your custom domain.

## Lead forms (FormSubmit)
- Both forms (homepage hero and `/free-estimate/`) post to `https://formsubmit.co/olverapaintingllc@gmail.com` and CC `nayem.adsmanager@gmail.com`. Both addresses are set in `src/data/site.ts`.
- **The first submission sends an activation email to olverapaintingllc@gmail.com. Someone with access to that inbox must click Activate once, or no emails arrive after that.** Send one test from the live site right after deploy.
- Spam protection is a honeypot field (`_honey`). The FormSubmit captcha page is off. Photo upload uses FormSubmit's `attachment` field.
- After submitting, the visitor lands on `/free-estimate/thank-you/`.

## Placeholders to replace before launch
- **Google badge (5.0★):** hidden in production (`SHOW_GOOGLE_BADGE = false` in `src/data/site.ts`). Turn it on only when real Google reviews exist.
- **Testimonials:** all quotes and names are sample text. Replace them with real signed testimonials, with each client's permission.
- **To confirm with Efrain:** hours "Mon–Fri", "Hablamos español", the CCB #240826 lookup, and each process claim listed in the copy doc's notes.
- **Interior copy:** it mentions a "blue-green bedroom in our photos", and that photo was never received.

## Design fidelity QA
- `design/meta/*.xml`: Figma node geometry. `design/imagemap.json` + `scripts/build-images.mjs`: every image slot cropped as in Figma, at 2× WebP (`public/img`). The source photos (`design/source-img`, named by Figma image hash) are not committed.
- `src/data/photos.json`: the inner-page photo library. `olvera-*` and `orig-*` are Olvera jobs. `mood-*` are AI mood images and must never be labelled as Olvera work.
- `public/fonts/op-symbols.woff2`: the → ★ ≈ glyphs, which Barlow and Bebas lack, with advances matched to Figma (`scripts/build-symbol-font.py`).
- `bash qa/run-all.sh`: builds, then runs the pixel and geometry diff against the Figma 1x renders in `qa/ref/` (not committed; re-export with Figma MCP `get_screenshot` at `maxDimension 65536`).
- `node qa/functional.mjs` (with `dist` served on :4400) crawls every page and checks: status, one h1, links, tel numbers, form config, the placeholder badge staying hidden, horizontal overflow at 360–1600, menu open and Esc, empty-submit blocking, FAQ keyboard toggles, the Our work filter, the 404 page and the sitemap.
