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
3. ~~**Deploy**~~ — DONE. **Live at https://shootvantage.com** via Cloudflare Pages (project connected to the GitHub repo; build `npm run build`, output `dist`, Node pinned via `.node-version`=22; auto-deploys on push to `main`). Auth env vars are set as **Build** variables in the Pages project (Vite bakes them in at build time). The old GitHub Pages deploy (`.github/workflows/deploy.yml` → jonoo407.github.io/photo-scout) still runs in parallel — retire it once Cloudflare is confirmed stable. Note: spot photos hotlink `upload.wikimedia.org` (online-only; SW doesn't cache them).
3b. **Accounts + sync** — DONE (2026-07-02): Supabase project created by the user; schema applied; env vars set in Cloudflare. Passwordless magic-link sign-in (Supabase, PKCE `?code=` flow — compatible with the hash router) + cross-device sync of wishlist/visited/checklist/home/region/prefs into `vantage_state` (RLS own-row; `supabase/schema.sql`). Fully env-gated: until `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set (Cloudflare Pages → Settings → Environment variables; `.env.local` for dev) the Account section is hidden and supabase-js isn't even in the bundle (dead-code eliminated; configured builds emit it as a lazy ~55KB-gzip chunk). Merge on sign-in: lists union, account scalars win (`src/auth/sync-merge.ts`). Setup: create project at database.new → Connect panel for URL + publishable key → run schema.sql in SQL Editor → set Site URL (Authentication → URL Configuration) to the app origin.
4. **v2 features**: Best Days This Month (per-spot 30-day calendar), Conditions Alert (rare push, needs notifications), Tampa Magic Layers (eBird free key + Launch Library 2 + NOAA tides), golden-hour reminders, multi-city selector.
5. **True Golden Hour** shadow/sightline engine (OSM building heights ray-march) — signature, deferred to v1.1.
6. **v3**: Craft Cards + Trusted-Circle community (needs accounts/sync/moderation backend).
7. **Tests**: add Playwright e2e + axe a11y at iPhone viewport (only unit tests exist now).
8. **Persistence**: upgrade store from localStorage → IndexedDB (idb) when the photo shot-log lands.

## Backlog — competitive research (2026-07-03)
Landscape: PhotoPills/TPE/PlanIt own sun-moon *calculation*; Locationscout owns community breadth (274k UGC spots); Explorest is the closest philosophical competitor (100% curated + photo specs); Cascable's "Photo Scout" charges $25–40/**yr** solely for condition-watch notifications. Nobody combines curation + craft + light-aware planning like Vantage. Ranked adds:

1. **Conditions alerts (push)** 🔥 — watch a saved spot, web-push when Best-Days conditions align (sunset score, henge dates). Engine already computes it; needs PWA push + a Cloudflare Worker cron. Converts "app you check" → "app that calls you". (Competitors charge a yearly sub for exactly this; the Settings "Conditions alerts v2" stub becomes real.)
2. **Sun-path lines on the map** — sunrise/sunset azimuth lines from a spot pin for any date (suncalc, nearly free). PhotoPills' signature look.
3. **"Sun-behind-X" alignment finder** — generalize the existing henge scorer: "next 5 dates the sun sets within ±2° of this spot's facing."
4. **Photo specs on reference photos** — media schema already has `focalLengthMm`; extend to camera/ISO/aperture/shutter and surface on the hero carousel (Explorest's best idea).
5. **Milky Way / astro layer** — galactic-core visibility windows + per-spot dark-sky field for `night-astro` spots.
6. **Visited-progress gamification** — "14/30 Tampa · 2/33 Philadelphia" progress on Saved (Locationscout's achievement hook).
7. **Compass mode (web-AR-lite)** — device-orientation arrow to where the sun will be at the chosen window, from the spot.
8. **Client shoot shortlist** (2026-07-03, user request) — a working photographer picks 3–5 candidate spots and sends the *client* one link showing the options: hero photo, name/address, best-light window, one-line why. **v1 needs no backend**: encode spot ids in the URL (e.g. `#/list?spots=a,b,c&title=Smith+family`) and render a clean client-facing page (no app chrome/nav; cross-region ids already resolve). Share via the existing share-sheet plumbing; OG meta makes it unfurl nicely in texts. **v2**: client taps a favorite → recorded via Supabase (anonymous row keyed to the list) so the photographer sees the pick; optional per-spot photographer notes ("shot here at golden hour, gorgeous backlight"). Nobody in the competitive set serves the client-communication loop — this is a pro-workflow differentiator.

Deliberately skipped: DoF/exposure calculators (commodity; PhotoPills owns), 3D terrain shadows (server-heavy, breaks keyless), offline map tiles (storage-heavy), native widgets (impossible in PWA). Also noted: custom SMTP (Resend) for magic-link email before promoting broadly — built-in sender is a-few-emails/hour.

## Adding a spot
Full playbook: **`docs/ADDING_SPOTS.md`** (selection criteria, two-source fact verification, photo licensing + mandatory eyeball step, craft-guide standards, quality gates, live verification, new-city checklist). Mechanical enforcement lives in `tests/unit/spots-data.test.ts` + `spots-media.test.ts`.
