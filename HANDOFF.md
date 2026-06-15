# Photo-Scout — handoff & status

**Working name:** Vantage. **What it is:** a place-and-craft-first photographer location-scouting
app for Tampa Bay. iPhone-form-factor web app now → native iOS later (Capacitor). It answers
"where should I shoot, what should I make there, and when is the light/access right?"

> Full design spec, data model, and roadmap live in the plan file:
> `C:\Users\flahe\.claude\plans\e-downloads-compass-artifact-wf-d9dd59e-goofy-spark.md`

---

## Status: MVP built, tested, and verified live (2026-06-14)

- **83 unit tests green**, every logic module written test-first (red→green).
- **Brand kit done** (2026-06-15): location-pin + golden-hour-sun icon (`public/icon.svg` + maskable/apple-touch PNGs, registry in `src/brand/icons.ts`), Fraunces wordmark. See `brand/README.md`.
- **Real photos seeded** (2026-06-15): 24 spots, 65 license-clean Wikimedia Commons photos in `src/data/spot-media.ts` (sourced via `scripts/*.mjs`), with the carousel wired into the Spot hero (`src/ui/SpotDetail/SpotHero.tsx`).
- **Typecheck clean**, **production build passes**, **PWA** service worker + manifest generated.
- Every screen verified working in the live iPhone-sized preview (not just tests).
- **No git commits yet** (by request — commit only when asked). `git init` done; tree is staged/dirty.

## Run it
```
cd E:\app_design\photo-scout
npm install         # if node_modules is missing
npm run dev         # vite dev server (use --port 5273 to match the launch config)
npm test            # vitest run — 75 tests
npm run build       # tsc --noEmit + vite build + PWA
```
Windows tip: vitest can wedge the shell — redirect output to a file and read it
(`npx vitest run > out.txt 2>&1`), don't kill node. Preview launch config: `.claude/launch.json` (name `photo-scout`, port 5273).

## Stack & conventions
- React 19 + Vite + TS + Vitest. Zustand + persist (localStorage) for state. React Router v7 **hash** history. Leaflet + OSM for the map. Open-Meteo (keyless) for weather. suncalc for astronomy. **No runtime API keys.** No Google Calendar.
- **Golden-hour-warm theme**: all tokens in `src/styles/theme.css` (+ a warm-dark variant); shared component classes in `src/styles/app.css`. Fonts: Fraunces (serif headings) + DM Sans (body).
- **TDD is mandatory** (see global rules): write the failing test first, see it fail, then implement.

## Directory map
```
src/astro/      sun-times (PhotoPills angles), sun-position, phase, sun-direction, moon  [pure, tested]
src/spots/      hours (open/closed resolver), distance, next-up (recommender), live (UI helpers), types
src/weather/    open-meteo (fetch client), verdict, sunset-score
src/state/      store.ts (zustand: wishlist/visited/checklist/filters/home/units/mapsApp)
src/data/       spots.ts (30 Tampa spots), home.config.ts
src/ui/         Layout + TabBar, Today/, Browse/, SpotDetail/, Map/, Plan/ (+ DayScreen), Settings/, SpotCard, icons
tests/unit/     mirrors the logic modules (12 files)
public/icon.svg placeholder app icon (Canva brand kit pending)
```

## Domain gotchas (don't regress these)
- **suncalc ≠ PhotoPills** golden/blue: re-derived via `addTime(-4)`/`addTime(-6)` so golden = elev [−4,+6], blue = [−6,−4]. See `src/astro/sun-times.ts`.
- **Azimuth** normalized app-wide to **degrees-from-north compass** (suncalc gives radians-from-south).
- **Sun-direction `facing`** = the bearing the photographer shoots TOWARD. Sun ≈ facing → backlit/silhouette; sun ≈ facing±180 → front-lit. (Off-by-180 trap; locked by `tests/unit/sun-direction.test.ts`.)
- **Hours** support overnight spill via 24h+ clock (e.g. `"27:00"` = 3am). Resolver checks previous-day intervals.

## What's done (screens)
Today (Next Up + live weather/moon + alert), Browse (filters/sort/open-now + empty state), Spot detail (live light windows + sun-direction badges + craft + checklist + logistics/parking-maps-link + directions + want/been), Map (real Leaflet/OSM + category pins), Plan (full light times + buckets), Day Router (sequenced itinerary), Settings (maps app/units/use-current-location).

## Next steps (prioritized)
1. ~~**Canva brand kit**~~ — DONE. Pin+sunset icon, maskable/apple-touch PNGs, Fraunces wordmark; tokens reconciled to `theme.css`. (Canva-account mirror of the asset deferred until deploy gives a public URL for `upload-asset-from-url`.)
2. ~~**Seed real photos**~~ — DONE for 24 spots (65 photos, Wikimedia Commons, attributed in `src/data/spot-media.ts`); carousel wired into the Spot hero. Remaining: 6 spots have no Commons coverage (the rooftop bars M.Bird/Azure/EDGE, Beacon, St. Paul AME, the two mural clusters) — fall back to the user's own shots; Unsplash still optional (needs a key, currently keyless).
3. **Deploy** — build-ready; pick a host (Cloudflare Pages / GitHub Pages). `base: './'` already set for static hosting. Note: spot photos hotlink `upload.wikimedia.org` (online-only; SW doesn't cache them).
4. **v2 features**: Best Days This Month (per-spot 30-day calendar), Conditions Alert (rare push, needs notifications), Tampa Magic Layers (eBird free key + Launch Library 2 + NOAA tides), golden-hour reminders, multi-city selector.
5. **True Golden Hour** shadow/sightline engine (OSM building heights ray-march) — signature, deferred to v1.1.
6. **v3**: Craft Cards + Trusted-Circle community (needs accounts/sync/moderation backend).
7. **Tests**: add Playwright e2e + axe a11y at iPhone viewport (only unit tests exist now).
8. **Persistence**: upgrade store from localStorage → IndexedDB (idb) when the photo shot-log lands.

## Adding a spot
Append a `Spot` object to `src/data/spots.ts` (DRY hours helpers at the top). The data-integrity test (`tests/unit/spots-data.test.ts`) enforces the contract — run it after.
