// Repair Commons thumb URLs whose hash directories drifted (or were wrong at
// seeding): for every upload.wikimedia.org URL in the spot data, ask the
// Commons API for the file's REAL 1280px thumb URL and rewrite mismatches
// in place. Run: node scripts/fix-media-hashes.mjs   (then verify-media-urls)
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const UA = 'VantagePhotoScout/1.0 (https://shootvantage.com)'
const API = 'https://commons.wikimedia.org/w/api.php'

const files = [
  ...readdirSync('src/data/spots').filter((f) => f.endsWith('.ts')).map((f) => `src/data/spots/${f}`),
  ...readdirSync('src/data/spot-media').filter((f) => f.endsWith('.ts')).map((f) => `src/data/spot-media/${f}`),
]

// title (File:Name.jpg) → every in-file URL that references it
const byTitle = new Map()
for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(/https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/thumb\/[^/]+\/[^/]+\/([^/"'\\\s]+)\/\d+px-[^"'\\\s]+/g)) {
    const title = 'File:' + decodeURIComponent(m[1]).replace(/_/g, ' ')
    if (!byTitle.has(title)) byTitle.set(title, new Set())
    byTitle.get(title).add(m[0])
  }
}

const titles = [...byTitle.keys()]
console.log(`${titles.length} unique Commons files referenced`)

// canonical 1280 thumb per title
const canonical = new Map()
const missing = []
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50)
  const url = `${API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url&iiurlwidth=1280&titles=${encodeURIComponent(batch.join('|'))}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  const json = await res.json()
  const denorm = new Map()
  for (const n of json.query?.normalized ?? []) denorm.set(n.to, n.from)
  for (const page of json.query?.pages ?? []) {
    const asked = denorm.get(page.title) ?? page.title
    if (page.missing) { missing.push(asked); continue }
    const thumb = page.imageinfo?.[0]?.thumburl
    if (thumb) canonical.set(asked, thumb)
  }
}

if (missing.length) console.log('MISSING on Commons (need replacement photos):', missing.join(' | '))

// rewrite: swap the hash-dir segment of any URL whose prefix disagrees
let fixes = 0
for (const f of files) {
  let src = readFileSync(f, 'utf8')
  let changed = false
  for (const [title, urls] of byTitle) {
    const canon = canonical.get(title)
    if (!canon) continue
    const canonPrefix = canon.replace(/\/\d+px-[^/]+$/, '') // .../thumb/H/HH/File.jpg
    for (const inFile of urls) {
      const filePrefix = inFile.replace(/\/\d+px-[^/]+$/, '')
      if (filePrefix !== canonPrefix && src.includes(filePrefix)) {
        src = src.split(filePrefix).join(canonPrefix)
        changed = true
        fixes++
        console.log('fixed', title)
      }
    }
  }
  if (changed) writeFileSync(f, src)
}
console.log(`rewrote ${fixes} URL prefixes`)
