// Montage of each spot's chosen HERO image + caption, for final human verification.
// Run: node scripts/build-hero-montage.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const picks = JSON.parse(readFileSync('scripts/picks.json', 'utf8'))
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const cells = picks.filter((r) => r.picks.length).map((r) => {
  const hero = [...r.picks].sort((a, b) => (b.hero ? 1 : 0) - (a.hero ? 1 : 0))[0]
  const local = `.cand/${r.spotId}_${hero.i}.jpg`
  const has = existsSync(`scripts/${local}`)
  const img = has ? `<img src="${local}">` : '<span class="miss">no thumb</span>'
  const extra = r.picks.length > 1 ? ` <span class="cnt">+${r.picks.length - 1}</span>` : ''
  return `<figure>
    <div class="imgwrap">${img}</div>
    <figcaption><b>${esc(r.spotId)}</b>${extra}<br><span class="cap">${esc(hero.caption)}</span></figcaption>
  </figure>`
}).join('')

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#2e2014;color:#faf1e2;font-family:system-ui,sans-serif;padding:16px}
  h1{font-size:15px;color:#f2b43c;margin:0 0 12px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
  figure{margin:0}
  .imgwrap{width:100%;height:140px;background:#241910;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center}
  img{width:100%;height:100%;object-fit:cover}
  figcaption{font-size:11px;margin-top:5px;line-height:1.3}
  .cap{color:#c2a98c;font-size:10px}
  .cnt{color:#e0922f;font-size:9px}
  .miss{color:#97361c;font-size:11px}
</style></head><body>
  <h1>Hero images (${picks.filter((r) => r.picks.length).length} spots) — verify each matches its spot + caption</h1>
  <div class="grid">${cells}</div>
</body></html>`
writeFileSync('scripts/hero-montage.html', html)
console.log('wrote scripts/hero-montage.html')
