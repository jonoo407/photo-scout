// Build contact-sheet HTML montages of the Commons candidates so they can be
// visually reviewed and the correct images picked per spot.
// Run: node --experimental-strip-types scripts/build-montages.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { SPOTS } from '../src/data/spots.ts'

const cands = JSON.parse(readFileSync('scripts/candidates.json', 'utf8'))
const byId = Object.fromEntries(SPOTS.map((s) => [s.id, s]))
const ids = Object.keys(cands).filter((id) => cands[id].length > 0)

const CHUNK = 5
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

for (let g = 0; g < ids.length; g += CHUNK) {
  const group = ids.slice(g, g + CHUNK)
  const rows = group.map((id) => {
    const s = byId[id]
    const cells = cands[id].map((c, i) => {
      const local = `.cand/${id}_${i}.jpg`
      const has = existsSync(`scripts/${local}`)
      const inner = has ? `<img src="${local}" loading="eager">` : '<span class="miss">no dl</span>'
      return `
      <figure>
        <div class="imgwrap">${inner}</div>
        <figcaption><b>#${i}</b> · ${esc(c.license)}<br><span class="ttl">${esc(c.title.replace(/^File:/, '').slice(0, 38))}</span></figcaption>
      </figure>`
    }).join('')
    return `
      <div class="row">
        <div class="label">
          <div class="sid">${esc(id)}</div>
          <div class="nm">${esc(s.name)}</div>
          <div class="hint">${esc(s.craft.whatToShoot.slice(0, 2).join(' · '))}</div>
        </div>
        <div class="cells">${cells}</div>
      </div>`
  }).join('')

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#2e2014;color:#faf1e2;font-family:system-ui,sans-serif;padding:16px}
    h1{font-size:15px;margin:0 0 12px;color:#f2b43c}
    .row{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid #4a3826}
    .label{width:150px;flex:none}
    .sid{font-size:10px;color:#a8947e}
    .nm{font-size:13px;font-weight:600;margin:2px 0}
    .hint{font-size:10px;color:#c2a98c;line-height:1.3}
    .cells{display:flex;gap:8px;flex-wrap:wrap}
    figure{margin:0;width:150px}
    .imgwrap{width:150px;height:110px;background:#241910;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center}
    img{max-width:100%;max-height:100%;object-fit:cover}
    figcaption{font-size:9px;color:#a8947e;margin-top:3px;line-height:1.25}
    .ttl{color:#8a7560}
  </style></head><body>
    <h1>Candidates ${g + 1}–${Math.min(g + CHUNK, ids.length)} of ${ids.length}</h1>
    ${rows}
  </body></html>`
  const n = g / CHUNK + 1
  writeFileSync(`scripts/montage-${n}.html`, html)
  console.log(`montage-${n}.html: ${group.join(', ')}`)
}
