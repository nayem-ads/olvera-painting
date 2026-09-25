#!/bin/bash
# Full QA: production build -> static server -> pixel + geometry diff for both homepage frames.
# Usage: bash qa/run-all.sh   (needs qa/ref/5-3.png and qa/ref/11-2.png: 1x Figma renders via get_screenshot maxDimension 65536; not committed)
# --prep sets html[data-qa] so the placeholder Google badges show (hidden in production, see SHOW_GOOGLE_BADGE).
set -u
cd "$(dirname "$0")/.."
PORT=4400; export BASE=http://127.0.0.1:$PORT
npm run build >/tmp/op-build.log 2>&1 || { tail -30 /tmp/op-build.log; exit 1; }
npx serve dist -l tcp://127.0.0.1:$PORT --no-clipboard >/tmp/op-serve.log 2>&1 & SP=$!
trap 'kill $SP 2>/dev/null' EXIT
sleep 2
PREP="document.documentElement.dataset.qa='1'"
node scripts/pixel-diff.mjs / 5:3 --base $BASE --prep "$PREP" >/dev/null 2>&1 || echo "FAILED 5:3"
node scripts/pixel-diff.mjs / 11:2 --base $BASE --mobile --callbar-y 9132 --prep "$PREP" >/dev/null 2>&1 || echo "FAILED 11:2"
node -e '
const fs=require("fs");const rows=[];
for (const f of ["5-3","11-2"]) {
  const r=JSON.parse(fs.readFileSync("qa/out/"+f+"/report.json"));
  const secs=r.sections.filter(s=>s.mismatchPct!=null);
  const worst=secs.reduce((a,s)=>s.mismatchPct>a.mismatchPct?s:a,{mismatchPct:-1});
  rows.push({frame:r.frameId,w:r.viewport,overall:r.mismatchPct,worst:worst.section+" "+worst.mismatchPct+"%",geo:r.geometry.within1px+"/"+r.geometry.checked,dH:r.heightDelta,over3:secs.filter(s=>s.mismatchPct>3).map(s=>s.section+" "+s.mismatchPct).join("; ")});
  console.log(f, "geometry failures:", JSON.stringify(r.geometry.failures.map(g=>[g.id,g.name,g.dx,g.dy,g.dw,g.dh])));
  console.log(f, "sections:", secs.map(s=>s.section+" "+s.mismatchPct).join(" | "));
}
console.table(rows);
'
