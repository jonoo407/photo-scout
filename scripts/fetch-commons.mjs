// Fetch real, license-clean photo candidates from Wikimedia Commons for each spot.
// Output: scripts/candidates.json  (keyed by spotId). Real URLs only — no fabrication.
// Run: node scripts/fetch-commons.mjs
import { writeFileSync } from 'node:fs'

const UA = 'VantagePhotoScout/0.1 (https://github.com/jonoo407/photo-scout)'
const FREE = /^(CC BY|CC BY-SA|CC0|Public domain|No restrictions)/i
const BAD_TITLE = /HABS|sheet \d|\.svg|\.pdf|floor ?plan|\bmap\b|diagram|logo|seal|coat of arms|locator|panorama of the|chart/i
const OK_MIME = new Set(['image/jpeg', 'image/png'])

// Curated search terms per spot (specific enough to find the real subject).
const SPOTS = {
  'bayshore-boulevard': ['Bayshore Boulevard Tampa'],
  'ballast-point-park': ['Ballast Point Park Tampa', 'Ballast Point Tampa pier'],
  'davis-islands-beach': ['Davis Islands Tampa', 'Davis Islands yacht basin'],
  'curtis-hixon-waterfront-park': ['Curtis Hixon Waterfront Park'],
  'tampa-riverwalk': ['Tampa Riverwalk', 'Hillsborough River Tampa skyline'],
  'plant-park-ut-minarets': ['University of Tampa Plant Hall minaret', 'Tampa Bay Hotel minaret'],
  'henry-b-plant-museum': ['Henry B. Plant Museum', 'Plant Hall University of Tampa interior'],
  'sacred-heart-catholic-church': ['Sacred Heart Church Tampa', 'Sacred Heart Catholic Church Tampa Florida'],
  'tampa-theatre': ['Tampa Theatre'],
  'ybor-city': ['Ybor City Tampa', 'Ybor City Seventh Avenue'],
  'mbird-armature-works': ['Armature Works Tampa'],
  'beacon-jw-marriott': ['JW Marriott Tampa Water Street', 'Water Street Tampa skyline'],
  'azure-tampa-edition': ['Tampa EDITION hotel', 'Channelside Tampa'],
  'edge-epicurean': ['Epicurean Hotel Tampa', 'South Howard Avenue Tampa'],
  'lettuce-lake-park': ['Lettuce Lake Park'],
  'usf-botanical-gardens': ['USF Botanical Gardens', 'University of South Florida Botanical Gardens'],
  'sunken-gardens': ['Sunken Gardens St. Petersburg Florida'],
  'fort-de-soto-park': ['Fort De Soto Park'],
  'honeymoon-island-sp': ['Honeymoon Island State Park'],
  'sunshine-skyway-fishing-piers': ['Sunshine Skyway Bridge', 'Sunshine Skyway fishing pier'],
  'st-pete-pier': ['St. Pete Pier', 'St. Petersburg Pier Florida'],
  'vinoy-park': ['Vinoy Park St. Petersburg', 'Vinoy Renaissance St. Petersburg'],
  'dali-museum': ['Dali Museum St. Petersburg Florida'],
  'weedon-island-preserve': ['Weedon Island Preserve'],
  'cathedral-st-peter-episcopal': ['Cathedral Church of St. Peter St. Petersburg'],
  'cathedral-st-jude-apostle': ['Cathedral of St. Jude the Apostle St. Petersburg'],
  'st-paul-ame': ['St. Paul AME Church Tampa'],
  'tampa-murals': ['Mural Tampa Florida', 'Ybor City mural'],
  'stpete-shine-murals': ['Mural St. Petersburg Florida', 'SHINE mural St. Petersburg'],
  'fred-howard-park': ['Fred Howard Park Tarpon Springs'],
}

const strip = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(term) {
  const u =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    '&gsrsearch=' + encodeURIComponent(term) + '&gsrnamespace=6&gsrlimit=12' +
    '&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=1600'
  const r = await fetch(u, { headers: { 'User-Agent': UA } })
  if (!r.ok) return []
  const j = await r.json()
  return Object.values(j.query?.pages || {})
}

function toCandidate(p) {
  const ii = p.imageinfo?.[0]
  if (!ii || !OK_MIME.has(ii.mime)) return null
  if (BAD_TITLE.test(p.title)) return null
  const license = strip(ii.extmetadata?.LicenseShortName?.value)
  if (!FREE.test(license)) return null
  const src = ii.thumburl
  if (!src || !src.startsWith('https://upload.wikimedia.org/')) return null
  const thumb = src.replace(/\/(\d+)px-/, '/480px-')
  return {
    title: p.title,
    src,
    thumb,
    width: ii.thumbwidth,
    height: ii.thumbheight,
    license,
    licenseUrl: strip(ii.extmetadata?.LicenseUrl?.value),
    artist: strip(ii.extmetadata?.Artist?.value).slice(0, 80) || 'Wikimedia Commons',
    descr: strip(ii.extmetadata?.ImageDescription?.value).slice(0, 160),
    sourceUrl: 'https://commons.wikimedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')),
  }
}

const out = {}
for (const [spotId, terms] of Object.entries(SPOTS)) {
  const seen = new Set()
  const cands = []
  for (const term of terms) {
    const pages = await search(term)
    for (const p of pages) {
      const c = toCandidate(p)
      if (c && !seen.has(c.title)) { seen.add(c.title); cands.push(c) }
    }
    await sleep(180)
    if (cands.length >= 8) break
  }
  out[spotId] = cands.slice(0, 8)
  console.log(`${spotId}: ${out[spotId].length} candidates`)
}
writeFileSync('scripts/candidates.json', JSON.stringify(out, null, 2))
console.log('\nWrote scripts/candidates.json')
