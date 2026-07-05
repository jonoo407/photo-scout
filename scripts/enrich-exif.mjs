// Enrich src/data/spot-media.ts with photo specs (camera / focal / f-number /
// shutter / ISO) pulled from each photo's EXIF via the Wikimedia Commons API.
// Idempotent: re-running refreshes specs in place; photos without EXIF are left
// untouched. Run: node scripts/enrich-exif.mjs
import { readFileSync, writeFileSync } from 'node:fs'

const PATH = 'src/data/spot-media.ts'
const API = 'https://commons.wikimedia.org/w/api.php'
const UA = 'VantagePhotoScout/1.0 (https://shootvantage.com; spot-media EXIF enrichment)'

const raw = readFileSync(PATH, 'utf8')
const eq = raw.indexOf('=\n')
if (eq === -1) throw new Error('unexpected spot-media.ts format')
const header = raw.slice(0, eq + 2)
const data = JSON.parse(raw.slice(eq + 2))

const titleOf = (m) => {
  if (!m.sourceUrl) return null
  try {
    const t = decodeURIComponent(new URL(m.sourceUrl).pathname.replace('/wiki/', ''))
    return t.startsWith('File:') ? t : null
  } catch {
    return null
  }
}

// "500/100" → 5, "f/8" → 8, "24 mm" → 24
const num = (v) => {
  if (v == null) return null
  const s = String(v).replace(/^f\//i, '').trim()
  const frac = s.match(/^(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)/)
  const n = frac ? Number(frac[1]) / Number(frac[2]) : parseFloat(s)
  return Number.isFinite(n) ? n : null
}

const shutterOf = (v) => {
  if (v == null) return null
  const s = String(v).trim()
  if (/^\d+(\.\d+)?\/\d+(\.\d+)?$/.test(s)) {
    // already a fraction — reduce weird denominators like 10/1250 to 1/125
    const [a, b] = s.split('/').map(Number)
    if (!a || !b) return null
    return a / b >= 1 ? round1(a / b) : `1/${Math.round(b / a)}`
  }
  const n = num(s)
  if (n == null || n <= 0) return null
  return n >= 1 ? round1(n) : `1/${Math.round(1 / n)}`
}
const round1 = (n) => String(Math.round(n * 10) / 10)

// "KODAK C875 ZOOM DIGITAL CAMERA" → "Kodak C875"; "E885" + Make "NIKON" →
// "Nikon E885". Raw EXIF strings shout and pad — captions shouldn't.
const cameraName = (make, model) => {
  const clean = (s) => String(s ?? '').replace(/\0/g, '').trim()
  let m = clean(model)
  if (!m || /unknown/i.test(m)) return null
  m = m.replace(/\b(ZOOM\s+)?DIGITAL\s+CAMERA\b/gi, '').replace(/\s{2,}/g, ' ').trim()
  const mk = clean(make).split(/\s+/)[0] ?? ''
  // Prefix the maker when the model string doesn't already carry it.
  if (mk && !m.toLowerCase().includes(mk.toLowerCase())) m = `${mk} ${m}`
  // De-shout: title-case fully-uppercase words of 3+ letters (keep D90, EOS, DSC-…).
  m = m.split(' ').map((w) =>
    /^[A-Z]{3,}$/.test(w) ? w[0] + w.slice(1).toLowerCase() : w,
  ).join(' ')
  return m || null
}

// unique titles → media entries that use them
const byTitle = new Map()
for (const list of Object.values(data)) {
  for (const m of list) {
    const t = titleOf(m)
    if (!t) continue
    if (!byTitle.has(t)) byTitle.set(t, [])
    byTitle.get(t).push(m)
  }
}

const titles = [...byTitle.keys()]
console.log(`querying EXIF for ${titles.length} Commons files…`)

let enriched = 0
for (let i = 0; i < titles.length; i += 50) {
  const batch = titles.slice(i, i + 50)
  const url = `${API}?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=commonmetadata&titles=${encodeURIComponent(batch.join('|'))}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Commons API ${res.status}`)
  const json = await res.json()

  // map normalized titles back to what we asked for
  const denorm = new Map()
  for (const n of json.query?.normalized ?? []) denorm.set(n.to, n.from)

  for (const page of json.query?.pages ?? []) {
    const asked = denorm.get(page.title) ?? page.title
    const targets = byTitle.get(asked)
    const meta = page.imageinfo?.[0]?.commonmetadata
    if (!targets || !Array.isArray(meta)) continue
    const exif = Object.fromEntries(meta.map((e) => [e.name, e.value]))

    const specs = {}
    const camera = cameraName(exif.Make, exif.Model)
    if (camera) specs.camera = camera
    const focal = num(exif.FocalLength)
    if (focal && focal > 0 && focal < 2000) specs.focalLengthMm = focal >= 10 ? Math.round(focal) : Math.round(focal * 10) / 10
    const f = num(exif.FNumber)
    if (f && f >= 0.7 && f <= 64) specs.fNumber = Math.round(f * 10) / 10
    const sh = shutterOf(exif.ExposureTime)
    if (sh) specs.shutter = sh
    const iso = num(exif.ISOSpeedRatings)
    if (iso && Number.isInteger(iso) && iso >= 25 && iso <= 409600) specs.iso = iso

    if (Object.keys(specs).length === 0) continue
    for (const m of targets) Object.assign(m, specs)
    enriched += targets.length
  }
}

writeFileSync(PATH, header + JSON.stringify(data, null, 2) + '\n')
const total = Object.values(data).flat().length
console.log(`enriched ${enriched}/${total} photos with EXIF specs`)
