# Scaling review — what breaks on the way to "the rest of the US"

*2026-07-05. Backlog item #2. Evidence-based: numbers below are measured from
the real build (`npm run build`, commit b82ff98), not estimated.*

**TL;DR: the front-end architecture is already shaped right (per-city lazy
chunks, constant initial bundle, keyless client-side compute). The first
things to break are (1) `useAllSpots` loading every city to render Saved,
(2) the Worker cron bundling all city data statically, and (3) the editorial
pipeline — curating 12,000 spots is the real bottleneck, not the bundler.
Keep curated spot data static/versioned; use Supabase only for the dynamic
layer (UGC, user photos, notes).**

## Measured baseline (2 cities, 75 spots, 70 photos)

| Asset | raw | gzip | grows with cities? |
|---|---|---|---|
| main bundle (`index-*.js`) | 417 KB | 129 KB | **no** (zero spot data in it — verified by grep) |
| per-city chunk (tampa-bay) | 82 KB | 19 KB | n/a (each city ships its own) |
| per-city chunk (philadelphia) | 84 KB | 23 KB | n/a |
| MapScreen (lazy) | 153 KB | 45 KB | no |
| Worker script (incl. BOTH cities' data) | 226 KB | 53 KB | **yes — linear** |
| SW precache (app shell) | 737 KB | — | no |

City chunks load on demand (`src/data/spots.ts` dynamic imports) and each
contains only its own media metadata today — but see finding 4: that
isolation is bundler behavior, not file structure.

## What already scales (leave alone)

- **Initial bundle is constant** in city count; adding a city = one lazy chunk.
- **Region model is data-driven** (`REGIONS` record; `nearestRegion` linear
  scan is microseconds at thousands of entries). Settings already swaps chips
  for a search box past 8 cities.
- **All light/astro/weather compute is client-side, per visible spot, keyless**
  — no server cost scales with catalog size.
- **Data-quality tests iterate every spot** (`spots-data.test.ts`) — linear
  and millisecond-scale; fine past 10k spots.
- **Photo runtime cache** is LRU-capped at 300 entries — constant.

## Breakpoints, in the order they'll hit

### 1. `useAllSpots` loads EVERY city to render Saved — hits at ~10–20 cities
`src/state/useRegion.ts:28` fetches and parses every region chunk so Saved
can resolve a handful of saved ids; `useSpotById` (deep links) lazy-loads
regions **sequentially** scanning for one id. At 50 cities that's 50 fetches
/ ~1 MB+ of JS to show a 5-item list.
**Fix (cheap, do before city #3):** build-time `spot-index` (id → region;
~20 bytes/spot, one tiny generated module) → load only the regions that
saved/linked spots actually live in.

### 2. The Worker cron bundles all city data statically — hits ~100 cities
`worker/index.ts` imports every region module; Workers scripts cap at a few
MB gzipped and each city adds ~20 KB gzip. Cron CPU itself is
subscription-driven (watched spots only), so runtime is fine.
**Fix:** the deploy already uploads city data as assets — have the cron fetch
per-city JSON via its own `ASSETS` binding instead of bundling. Zero new
infrastructure.

### 3. Editorial throughput — the real "rest of the US" constraint
75 spots took multiple curation sessions under the two-source rule
(`docs/ADDING_SPOTS.md`). 300 metros × 40 spots = 12,000 spots. No bundler
fixes this. **Plan:** rank metros by photographer demand and add deliberately;
scale intake with user submissions (backlog #9) feeding periodic curation
sessions; keep the quality bar — curation IS the product's moat.

### 4. Per-city media isolation is optimizer behavior, not structure
All cities' photo metadata lives in ONE `src/data/spot-media.ts` imported by
every city module. Today Rollup splits it cleanly (verified: Tampa photo URLs
appear only in the Tampa chunk, Philly's only in Philly's) — but a bundler
regression at 300 cities would silently ship megabytes of other cities' media
to every user, and nothing would fail loudly.
**Fix (cheap):** emit `spot-media/<region>.ts` per city from the pipeline
(`scripts/write-media.mjs` + `enrich-exif.mjs`), making isolation structural.
Add a build-size test (chunk must not contain other cities' URLs).

### 5. Search is region-scoped
Browse searches the active city only ("Search 30 Tampa Bay spots…"). National
discovery needs a build-time global index — `{id, name, city, region,
category, bestFor}` ≈ 150 B/spot ≈ ~300 KB gzip at 12k spots — lazy-loaded
only when the user searches beyond their city. Fine to ~300 cities; split by
state after that.

### 6. Map has no clustering
`circleMarker` per spot is fine at ≤ ~200 pins and the map is per-region
today. Add clustering (or zoom-gated rendering) only if a national map view
or much denser regions appear.

### 7. Loader/region registries are hand-maintained
`src/data/spots.ts` (dynamic-import map) and `src/data/regions.ts` both need
an entry per city. At hundreds of cities, generate both from one manifest at
build time so a city is added in exactly one place.

## Supabase for spot data? Recommendation: no (for the curated core)

Keep curated spots as static, versioned, code-reviewed data shipped with the
app:

- **Offline** keeps working (PWA in the field, spotty signal at sunrise).
- **Zero latency, zero new failure modes, zero cost** — a DB read path adds
  all three and buys nothing until ~10k+ spots or live editing.
- **The test suite runs against the data** — quality gates on every commit.
- **Deploys are atomic versions** — data and code can't drift.

Move to Supabase only the inherently **dynamic** layer, where it already
lives naturally: user submissions (#9), user photos (#8, Supabase Storage),
personal notes (#11), sync state, shortlists. If the catalog someday needs
live editing by non-engineers, revisit with a build-from-DB pipeline
(DB → generated static chunks at deploy time) rather than runtime reads.

## Phased plan

| When | Do |
|---|---|
| ~~**Before city #3**~~ | DONE 2026-07-05: generated spot-index (id→region + per-region counts; `scripts/build-spot-index.mjs`, freshness-tested) — `useAllSpots` is gone, Saved/client lists load only needed cities (`useSpotsByIds`), deep links load exactly one chunk, progress needs zero chunks; per-city media structure enforced by `media-structure.test.ts`; loader registry derived from the filesystem glob, paired with REGIONS by `region-registry.test.ts` |
| **~10 cities** | global search index (lazy); Browse "search everywhere"; Worker cron reads city JSON from ASSETS |
| **~50–100 cities** | map clustering if density demands; consider CDN-JSON data format (fetched + pipeline-validated) over TS modules |
| **Only if live editing / UGC at volume** | DB-backed *pipeline* (not runtime reads) for the curated core; dynamic layer is already in Supabase |
