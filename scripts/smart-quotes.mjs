// Astro integration: after the static build, make quotes typographically consistent across every page.
// The Figma copy mixes straight (') and curly (’) apostrophes/quotes between frames; the site renders all of them curly.
// Only visible text between tags is touched (never <script>, <style>, attributes, URLs or JSON-LD).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function curl(text) {
  return text
    .replace(/(\w)'(\w)/g, '$1’$2')              // don't, carrier's
    .replace(/(\w)'(?=[\s.,;:!?)]|$)/g, '$1’')     // carriers'
    .replace(/(^|[\s(\[—–-])'(?=\w)/g, '$1‘') // 'quoted
    .replace(/'/g, '’')
    .replace(/(^|[\s(\[—–-])"(?=\S)/g, '$1“') // "open
    .replace(/"/g, '”');                          // close"
}

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); if (fs.statSync(p).isDirectory()) walk(p, out); else if (p.endsWith('.html')) out.push(p); }
  return out;
}

export default function smartQuotes() {
  return {
    name: 'smart-quotes',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const root = fileURLToPath(dir); let n = 0;
        for (const file of walk(root)) {
          const html = fs.readFileSync(file, 'utf8');
          const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<textarea[\s\S]*?<\/textarea>|<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>)/); // tags: quoted attribute values may contain '>'
          const outHtml = parts.map((s, i) => (i % 2 === 1 ? s : curl(s.replace(/&#39;/g, "'").replace(/&quot;/g, '"')))).join('');
          if (outHtml !== html) { fs.writeFileSync(file, outHtml); n++; }
        }
        console.log(`smart-quotes: ${n} pages`);
      },
    },
  };
}
