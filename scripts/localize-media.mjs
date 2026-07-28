/*
 * Pull every hotlinked spot photo local, so we serve them from our own origin.
 *
 * Why: hotlinking Wikimedia cost us upstream rate limits, zero control over
 * cache headers, files renamed out from under us (see fix-media-hashes.mjs),
 * and — under capacitor://localhost — opaque responses the service worker
 * cached as if valid, blanking thumbnails on TestFlight build 3. Local files
 * also ride into the IPA via `cap sync`, so the phone has them with no network.
 *
 * The CC BY / CC BY-SA licences permit this redistribution. Attribution lives
 * in the data (credit/license/sourceUrl) and is untouched here — resizing and
 * re-encoding are format changes, not adaptations, so ShareAlike is not
 * triggered.
 *
 * Run: node scripts/localize-media.mjs [--dry]
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const OUT_DIR = path.join(ROOT, 'public', 'spot-photos')
const TAMPA = path.join(ROOT, 'src/data/spot-media/tampa-bay.ts')
const PHILLY = path.join(ROOT, 'src/data/spots/philadelphia.ts')
const DRY = process.argv.includes('--dry')

// Wikimedia's UA policy wants a descriptive agent with contact info; generic
// agents get blocked outright.
const UA = 'VantagePhotoScout/0.1 (https://shootvantage.com) node'

const HERO_WIDTH = 1200
const THUMB_WIDTH = 480

/** The underlying Commons file a URL refers to, ignoring size variant. */
function identity(url) {
  const thumb = url.match(/\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/([^/]+)\//)
  if (thumb) return decodeURIComponent(thumb[1])
  const orig = url.match(/\/commons\/[0-9a-f]\/[0-9a-f]{2}\/([^/?]+)$/)
  if (orig) return decodeURIComponent(orig[1])
  return decodeURIComponent(url.split('/').pop().split('?')[0])
}

function slugFor(id) {
  const base = id.replace(/\.[a-z0-9]+$/i, '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 52)
  // Short digest keeps distinct Commons files from colliding after slugging.
  const h = crypto.createHash('sha1').update(id).digest('hex').slice(0, 6)
  return `${base || 'photo'}-${h}`
}

/** Largest variant we can ask Commons for, so downscaling is never upscaling. */
function bestSourceUrl(url) {
  return url.replace(/\/\d+px-/, `/${Math.max(HERO_WIDTH, 1280)}px-`)
}

async function fetchBuffer(url, attempt = 1) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 4) throw new Error(`${res.status} after ${attempt} tries: ${url}`)
    const wait = 1500 * attempt
    process.stdout.write(` (${res.status}, retry in ${wait}ms)`)
    await new Promise((r) => setTimeout(r, wait))
    return fetchBuffer(url, attempt + 1)
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

const collect = (text, re) => [...text.matchAll(re)].map((m) => m[1])

async function main() {
  const tampaSrc = await fs.readFile(TAMPA, 'utf8')
  const phillySrc = await fs.readFile(PHILLY, 'utf8')

  const urls = new Set([
    ...collect(tampaSrc, /"(?:src|thumb)":\s*"(https:\/\/[^"]+)"/g),
    ...collect(phillySrc, /pic\('(https:\/\/[^']+)'/g),
  ])
  console.log(`${urls.size} remote URLs referenced`)

  // One download per underlying Commons file, not per size variant.
  const byIdentity = new Map()
  for (const u of urls) {
    const id = identity(u)
    if (!byIdentity.has(id)) byIdentity.set(id, u)
  }
  console.log(`${byIdentity.size} distinct images to fetch`)
  if (DRY) return

  await fs.mkdir(OUT_DIR, { recursive: true })

  const slugs = new Map()
  let done = 0
  let bytes = 0
  for (const [id, sampleUrl] of byIdentity) {
    const slug = slugFor(id)
    slugs.set(id, slug)
    const heroPath = path.join(OUT_DIR, `${slug}.webp`)
    const thumbPath = path.join(OUT_DIR, `${slug}-thumb.webp`)
    done++

    try {
      await fs.access(heroPath)
      await fs.access(thumbPath)
      process.stdout.write(`\r[${done}/${byIdentity.size}] cached ${slug}`.padEnd(100))
      continue
    } catch { /* not fetched yet */ }

    process.stdout.write(`\r[${done}/${byIdentity.size}] ${slug}`.padEnd(100))
    const buf = await fetchBuffer(bestSourceUrl(sampleUrl))
    const base = sharp(buf, { failOn: 'none' }).rotate()
    await base.clone().resize({ width: HERO_WIDTH, withoutEnlargement: true })
      .webp({ quality: 76 }).toFile(heroPath)
    await base.clone().resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 72 }).toFile(thumbPath)
    bytes += (await fs.stat(heroPath)).size + (await fs.stat(thumbPath)).size

    // Stay a polite client; Commons throttles bursts.
    await new Promise((r) => setTimeout(r, 250))
  }
  console.log(`\ndownloaded ${(bytes / 1e6).toFixed(1)} MB of new WebP`)

  const localFor = (url, wantThumb) =>
    `./spot-photos/${slugs.get(identity(url))}${wantThumb ? '-thumb' : ''}.webp`

  // Rewrite by FIELD, not by blind URL substitution: some entries used an
  // original-size URL as their thumb, which would otherwise collapse thumb
  // and src onto the same file.
  const tampaOut = tampaSrc
    .replace(/("src":\s*")(https:\/\/[^"]+)(")/g, (_, a, u, c) => a + localFor(u, false) + c)
    .replace(/("thumb":\s*")(https:\/\/[^"]+)(")/g, (_, a, u, c) => a + localFor(u, true) + c)

  // philadelphia.ts passes one URL to pic(), which derives the thumb itself.
  const phillyOut = phillySrc
    .replace(/(pic\(')(https:\/\/[^']+)(')/g, (_, a, u, c) => a + localFor(u, false) + c)
    .replace(
      "src, thumb: src.replace('/1280px-', '/500px-'),",
      "src, thumb: src.replace(/\\.webp$/, '-thumb.webp'),",
    )

  await fs.writeFile(TAMPA, tampaOut)
  await fs.writeFile(PHILLY, phillyOut)
  console.log('rewrote spot-media/tampa-bay.ts and spots/philadelphia.ts')
}

main().catch((e) => { console.error('\n', e); process.exit(1) })
