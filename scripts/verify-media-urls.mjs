// Verify every seeded media src/thumb URL resolves to an image (throttled).
// Run: node --experimental-strip-types scripts/verify-media-urls.mjs
import { SPOT_MEDIA } from '../src/data/spot-media.ts'

const UA = 'VantagePhotoScout/0.1 (https://github.com/jonoo407/photo-scout)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const urls = []
for (const [id, list] of Object.entries(SPOT_MEDIA)) {
  for (const m of list) { urls.push([id, 'src', m.src]); if (m.thumb) urls.push([id, 'thumb', m.thumb]) }
}

let ok = 0
const bad = []
for (const [id, kind, url] of urls) {
  let done = false
  for (let t = 0; t < 4 && !done; t++) {
    try {
      const r = await fetch(url, { method: 'GET', headers: { 'User-Agent': UA, Range: 'bytes=0-2048' } })
      const ct = r.headers.get('content-type') || ''
      if (r.ok && ct.startsWith('image/')) { ok++; done = true }
      else if (r.status === 429) { await sleep(1500 * (t + 1)) }
      else { bad.push(`${id} ${kind} ${r.status} ${ct} ${url}`); done = true }
    } catch (e) { bad.push(`${id} ${kind} ERR ${String(e).slice(0, 40)}`); done = true }
  }
  if (!done) bad.push(`${id} ${kind} retry-exhausted ${url}`)
  await sleep(220)
}
console.log(`media URLs: ok=${ok}/${urls.length}`)
if (bad.length) { console.log('BAD:'); for (const b of bad) console.log(' ', b) }
else console.log('ALL media URLs resolve to images ✓')
