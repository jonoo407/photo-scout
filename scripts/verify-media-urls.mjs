// Verify every seeded media URL (per-city media files AND inline pic()
// entries) resolves to an image. Catches Commons renames and bad hash paths.
// Run: node scripts/verify-media-urls.mjs
import { readFileSync, readdirSync } from 'node:fs'

const UA = 'VantagePhotoScout/1.0 (https://shootvantage.com)'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const files = [
  ...readdirSync('src/data/spots').filter((f) => f.endsWith('.ts')).map((f) => `src/data/spots/${f}`),
  ...readdirSync('src/data/spot-media').filter((f) => f.endsWith('.ts')).map((f) => `src/data/spot-media/${f}`),
]

const urls = new Set()
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/https:\/\/(?:upload\.wikimedia\.org|live\.staticflickr\.com)[^"'\\\s]+/g)) {
    urls.add(m[0])
  }
}

console.log(`checking ${urls.size} unique media URLs…`)
let ok = 0
const bad = []
for (const url of urls) {
  let done = false
  for (let t = 0; t < 3 && !done; t++) {
    try {
      const r = await fetch(url, { method: 'GET', headers: { 'User-Agent': UA, Range: 'bytes=0-2048' } })
      const ct = r.headers.get('content-type') || ''
      if ((r.status === 200 || r.status === 206) && ct.startsWith('image/')) { ok++; done = true }
      else if (r.status === 429) { await sleep(2000 * (t + 1)) }
      else { bad.push([r.status, url]); done = true }
    } catch {
      await sleep(1000 * (t + 1))
      if (t === 2) bad.push(['ERR', url])
    }
  }
  if (!done && !bad.some(([, u]) => u === url)) bad.push(['RATE-LIMITED', url]) // never silently skip
  await sleep(250)
}

console.log(`ok: ${ok}/${urls.size}`)
if (bad.length) {
  for (const [status, url] of bad) console.log('BAD', status, url)
  process.exit(1)
}
console.log('ALL media URLs resolve to images ✓')
