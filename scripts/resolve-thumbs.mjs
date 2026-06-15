// Re-resolve valid thumbnail URLs (1200px src + 480px thumb) from the Commons API
// by title, update candidates.json, and download the 480px thumbs locally for montage.
// Throttled + retries on 429. Run: node scripts/resolve-thumbs.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const UA = 'VantagePhotoScout/0.1 (https://github.com/jonoo407/photo-scout)'
const cands = JSON.parse(readFileSync('scripts/candidates.json', 'utf8'))
mkdirSync('scripts/.cand', { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const titles = [...new Set(Object.values(cands).flat().map((c) => c.title))]

async function getJson(url, tries = 4) {
  for (let t = 0; t < tries; t++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (r.ok) return r.json()
    if (r.status === 429) { await sleep(1500 * (t + 1)); continue }
    return null
  }
  return null
}

async function resolveWidth(width) {
  const map = {}
  for (let i = 0; i < titles.length; i += 40) {
    const batch = titles.slice(i, i + 40)
    const u = 'https://commons.wikimedia.org/w/api.php?action=query&format=json' +
      '&titles=' + encodeURIComponent(batch.join('|')) +
      '&prop=imageinfo&iiprop=url&iiurlwidth=' + width
    const j = await getJson(u)
    for (const p of Object.values(j?.query?.pages || {})) {
      const ii = p.imageinfo?.[0]
      if (ii?.thumburl) map[p.title] = ii.thumburl
    }
    await sleep(700)
  }
  return map
}

console.log(`resolving ${titles.length} titles...`)
const src1200 = await resolveWidth(1200)
const thumb480 = await resolveWidth(480)

for (const list of Object.values(cands)) {
  for (const c of list) {
    if (src1200[c.title]) c.src = src1200[c.title]
    if (thumb480[c.title]) c.thumb = thumb480[c.title]
  }
}
writeFileSync('scripts/candidates.json', JSON.stringify(cands, null, 2))

// download the 480 thumbs for montage
let ok = 0, fail = 0
const failures = []
for (const [id, list] of Object.entries(cands)) {
  for (let i = 0; i < list.length; i++) {
    const url = list[i].thumb
    let done = false
    for (let t = 0; t < 4 && !done; t++) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': UA } })
        if (r.ok && (r.headers.get('content-type') || '').startsWith('image/')) {
          writeFileSync(`scripts/.cand/${id}_${i}.jpg`, Buffer.from(await r.arrayBuffer()))
          ok++; done = true
        } else if (r.status === 429) { await sleep(1500 * (t + 1)) }
        else { failures.push(`${id}#${i}(${r.status})`); break }
      } catch (e) { failures.push(`${id}#${i}(${String(e).slice(0, 30)})`); break }
    }
    if (!done && !failures.some((f) => f.startsWith(`${id}#${i}`))) failures.push(`${id}#${i}(retry-exhausted)`)
    await sleep(350)
  }
}
console.log(`thumbs downloaded ok=${ok} fail=${fail + failures.length}`)
if (failures.length) console.log('failures:', failures.join(', '))
