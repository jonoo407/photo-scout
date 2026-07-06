# Adding & quality-checking spots

The playbook behind all 75 shipped spots (30 Tampa Bay, 45 Philadelphia). Two layers:
**process** (this doc — research, verification, photos) and **enforcement**
(`tests/unit/spots-data.test.ts` + `spots-media.test.ts`, which mechanically reject
entries that break the contract).

## 1. Selection — what makes a spot worth adding

- A **photograph lives there**: a nameable signature shot, not just "a nice place."
- Cover the seven categories per city: skyline, rooftop, architecture, interiors, gardens, beach, nature.
- Prefer **public, legal, repeatable access**. A spot behind trespass or a one-off event doesn't ship.
- KEY-ness test: would a visiting photographer with one day be annoyed we omitted it?

## 2. Research & verification (the facts must be REAL)

Every factual field is verified against sources — never from memory/vibes:

| Field | Standard |
|---|---|
| `address` | Real street address (contains a comma); for trails use the trailhead/access point |
| `lat`/`lng` | **Two independent sources** (official site, Wikipedia coords, OSM/Nominatim). Must fall inside the region bounds in `src/data/regions.ts`. For trails/parks: the *photo vantage*, not a centroid — flag approximations in `caveats` |
| `hours` | Official site. Encode with the helpers (`days`, `open`, `iv`, `clk`, `sr`/`ss`, `H24`, `CLOSED`); seasonal/tour-only nuance goes in `caveats`/`feeNote` |
| `feeUSD`/`isFree` | Fee to reach the *photo vantage* (exterior free + ticketed interior ⇒ `feeUSD: 0` + `feeNote`). Test enforces `isFree === (feeUSD === 0)` |
| `facing` | Compass bearing the photographer aims TOWARD the subject (0–359), or `null` if omnidirectional/interior. Drives sun-direction ranking + best-days "henge" scoring — get it right or leave it null |
| `caveats` | Access rules, tripod/photo policy, crowds, safety (e.g. low-head dams), seasonal closures |

In practice: dispatch research agents in parallel (5–6 spots each, grouped by category),
requiring per-spot `sourceUrls` (2+) and explicit flags on anything uncertain. Spot-check
anything surprising.

**Do NOT set `driveMinutes`** — it's `@deprecated`; drive times compute live from the
user's home so "Use my location" works.

## 3. Photos (license-clean or nothing)

Rules enforced by `spots-media.test.ts`:
- Hosts: `upload.wikimedia.org` / `*.wikimedia.org` / `live.staticflickr.com` / own (`/...`)
- License must match `/^(CC BY|CC BY-SA|CC0|Public domain|No restrictions)/i` — **no NC, no ND**
- Every entry needs `caption`, `credit`, `license`; use the 1280px thumb as `src`, 500px as `thumb`

Process (scripts pattern in past commits / photo-seeding memory):
1. Query the Commons API (`list=search`, `srnamespace=6`) with 2–3 term variants per spot; filter by mime + license; resolve 1280/500 thumburls.
2. **Download and LOOK at every candidate.** Search results lie: we've caught a Michigan dam, a California Masonic temple, a UK pier, a Dublin cathedral, book scans, and closeups of the wrong subject. No photo ships uneyeballed.
3. Verify URLs mechanically — BOTH scripts, every photo batch:
   - `node scripts/fix-media-hashes.mjs` — repairs Commons hash-directory drift by asking the API for each file's real thumb URL (2026-07-06: found 20 dead URLs that shipped with fabricated hash paths; never hand-write the `/thumb/H/HH/` segment).
   - `node scripts/verify-media-urls.mjs` — sweeps every URL in `src/data/spots/*` + `src/data/spot-media/*` for HTTP 200 + `image/*` (Wikimedia rate-limits; the script throttles).
4. Copyright gotchas: modern sculpture/murals by living artists are copyrighted (photo = derivative; note limits in `caveats`; pick facades/street context). Robert Indiana's LOVE is fine (lost US copyright). No good free photo ⇒ ship with `media: []` — the UI shows the category glyph, and `SpotCard` also degrades to it on a 404 (`onError`).

## 4. Writing the entry

Append to `src/data/spots/<region>.ts` (per-region module, lazy-loaded chunk). Required
craft quality: `lightStrategy` that says *where to stand and when*, 3+ `whatToShoot`,
1–2 `signatureShots` (unique ids), concrete `compositionTips` and `gear`, `ifCloudy`
where it matters. Write like a scouting friend, not a brochure.

## 5. Quality gates (all must pass)

```
npx vitest run        # data-integrity + media contracts + everything else
npm run build         # tsc + vite
```
The data test enforces: valid region + in-bounds coords, unique kebab-case ids, complete
weekly hours, valid bestLight, complete craft guide, address shape, fee/isFree
consistency, per-city minimum counts. Raise the count floor when adding a batch so
regressions can't silently drop spots.

## 6. Verify live (RULE 3)

After push (auto-deploys to shootvantage.com): confirm the new region chunk contains the
new ids, open the city in the app (map pins, Today ranking, a new spot's detail page with
its hero photo). For a big batch, screenshot-check a sample at the iPhone viewport.

## 7. New city checklist

1. `src/data/regions.ts`: add region (label, IANA timeZone, center, bounds, **neutral public** defaultHome — never a personal address).
2. `src/data/spots/<id>.ts`: new module (copy the hours helpers), `export default SPOTS`. The loader registry picks it up automatically (filesystem glob — `region-registry.test.ts` enforces that both halves exist).
3. Photos live per city: inline `pic(...)` entries or a `src/data/spot-media/<id>.ts` file the module imports (`media-structure.test.ts` forbids sharing — see docs/SCALING.md finding 4). Pipeline: `node scripts/write-media.mjs <id>`, then `node scripts/enrich-exif.mjs <id>` for EXIF specs.
4. Regenerate the spot index: `node scripts/build-spot-index.mjs` (`spot-index.test.ts` fails if you forget).
5. `src/test/setup.ts`: prime the region cache; concat the region in `spots-data`/`spots-media` tests.
6. Seed 25–45 spots via this playbook, covering all seven categories.
