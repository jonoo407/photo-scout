# Photo-Scout — handoff & status

**Working name:** Vantage. **What it is:** a place-and-craft-first photographer location-scouting
app for Tampa Bay. iPhone-form-factor web app now → native iOS later (Capacitor). It answers
"where should I shoot, what should I make there, and when is the light/access right?"

> Full design spec, data model, and roadmap live in the plan file:
> `C:\Users\flahe\.claude\plans\e-downloads-compass-artifact-wf-d9dd59e-goofy-spark.md`

---

## Status: MVP built, tested, and verified live (2026-06-14) · competitive backlog (8 items) shipped + taste-reviewed (2026-07-05)

- **342 unit tests green**, every logic module written test-first (red→green).
- **Brand kit done** (2026-06-15): location-pin + golden-hour-sun icon (`public/icon.svg` + maskable/apple-touch PNGs, registry in `src/brand/icons.ts`), Fraunces wordmark. See `brand/README.md`.
- **Real photos seeded** (2026-06-15): 24 spots, 65 license-clean Wikimedia Commons photos in `src/data/spot-media.ts` (sourced via `scripts/*.mjs`), with the carousel wired into the Spot hero (`src/ui/SpotDetail/SpotHero.tsx`).
- **Typecheck clean**, **production build passes**, **PWA** service worker + manifest generated.
- Every screen verified working in the live iPhone-sized preview (not just tests).
- Commits land on `main` (one per feature) and auto-deploy to shootvantage.com via Cloudflare Workers Builds.

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
2. ~~**Seed real photos**~~ — DONE. 74/75 spots have at least one license-clean photo (Tampa via `src/data/spot-media/tampa-bay.ts`, Philly inline `pic()` entries; EXIF specs enriched). Only `st-paul-ame` has zero Commons coverage (verified again 2026-07-06 — PDFs/audio only) — its fallback is the shipped "Your shots" feature.
3. ~~**Deploy**~~ — DONE. **Live at https://shootvantage.com** via Cloudflare Pages (project connected to the GitHub repo; build `npm run build`, output `dist`, Node pinned via `.node-version`=22; auto-deploys on push to `main`). Auth env vars are set as **Build** variables in the Pages project (Vite bakes them in at build time). The old GitHub Pages deploy (`.github/workflows/deploy.yml` → jonoo407.github.io/photo-scout) still runs in parallel — retire it once Cloudflare is confirmed stable. Note: spot photos hotlink `upload.wikimedia.org` (online-only; SW doesn't cache them).
3b. **Accounts + sync** — DONE (2026-07-02): Supabase project created by the user; schema applied; env vars set in Cloudflare. Passwordless magic-link sign-in (Supabase, PKCE `?code=` flow — compatible with the hash router) + cross-device sync of wishlist/visited/checklist/home/region/prefs into `vantage_state` (RLS own-row; `supabase/schema.sql`). Fully env-gated: until `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set (Cloudflare Pages → Settings → Environment variables; `.env.local` for dev) the Account section is hidden and supabase-js isn't even in the bundle (dead-code eliminated; configured builds emit it as a lazy ~55KB-gzip chunk). Merge on sign-in: lists union, account scalars win (`src/auth/sync-merge.ts`). Setup: create project at database.new → Connect panel for URL + publishable key → run schema.sql in SQL Editor → set Site URL (Authentication → URL Configuration) to the app origin.
4. **v2 features**: Best Days This Month (per-spot 30-day calendar), Conditions Alert (rare push, needs notifications), Tampa Magic Layers (eBird free key + Launch Library 2 + NOAA tides), golden-hour reminders, multi-city selector.
5. **True Golden Hour** shadow/sightline engine (OSM building heights ray-march) — signature, deferred to v1.1.
6. **v3**: Craft Cards + Trusted-Circle community (needs accounts/sync/moderation backend).
7. **Tests**: add Playwright e2e + axe a11y at iPhone viewport (only unit tests exist now).
8. **Persistence**: upgrade store from localStorage → IndexedDB (idb) when the photo shot-log lands.

## Backlog — competitive research (2026-07-03) — **ALL 8 SHIPPED 2026-07-05**
Landscape: PhotoPills/TPE/PlanIt own sun-moon *calculation*; Locationscout owns community breadth (274k UGC spots); Explorest is the closest philosophical competitor (100% curated + photo specs); Cascable's "Photo Scout" charges $25–40/**yr** solely for condition-watch notifications. Nobody combines curation + craft + light-aware planning like Vantage. Ranked adds:

1. ~~**Conditions alerts (push)**~~ 🔥 — DONE. Worker cron (16:30 UTC) scores tonight at every watched want-to-go spot (best-days engine + Open-Meteo) and web-pushes VAPID tickles; SW fetches `/api/push/pending` and shows the alert. ALL state (subscriptions, pending queue, VAPID keypair) lives in the `AlertsDO` SQLite Durable Object — deploys from git, zero dashboard secrets (`worker/index.ts`, `src/push/*`, `public/push-sw.js`). Settings toggle is live; watch list tracks wishlist changes. Remaining human step: notification permission is a real-device tap.
2. ~~**Sun-path lines on the map**~~ — DONE. Tap a pin → dashed gold/terracotta sunrise/sunset bearing lines (`src/astro/sun-path.ts`), cleared on popup close.
3. ~~**"Sun-behind-X" alignment finder**~~ — DONE. "Sun-behind-the-subject dates" card on Spot detail: next 5 rise/set dates within ±2° of `facing` (`src/spots/sun-align.ts`).
4. ~~**Photo specs on reference photos**~~ — DONE. `camera/fNumber/shutter/iso` on SpotMedia; spec line under the hero caption; `scripts/enrich-exif.mjs` pulled real EXIF from Commons for 59/70 photos (Make+Model cleaned — no raw EXIF shouting).
5. ~~**Milky Way / astro layer**~~ — DONE. Galactic-core alt/az + tonight's window w/ moon interference (`src/astro/milky-way.ts`); card gates on the new `Spot.darkSky` field — NOT on `night-astro` bestLight (lit downtown night spots must not get astro advice). Only Fort De Soto is darkSky-tagged so far (with a gates-close-at-dusk camping caveat); tag more as they're verified.
6. ~~**Visited-progress gamification**~~ — DONE. Per-city progress bars under Been-there on Saved (`src/spots/progress.ts`).
7. ~~**Compass mode (web-AR-lite)**~~ — DONE. "Compass to the light" on Spot detail: device-compass arrow to the sun at the NEXT prime window (rolls to tomorrow when today's passed); graceful desktop fallback (`src/spots/compass.ts`).
8. **Client shoot shortlist** — v1+v2+v3 SHIPPED. **v3 (2026-07-05)**: share URLs are real paths (`https://shootvantage.com/l/<uuid>`) so messengers unfurl them — the Worker serves per-list OG tags (title + spot count via the `get_shortlist` RPC; publishable key in `wrangler.jsonc` vars) and meta-refreshes to the app view. Out-of-app notify WITHOUT email: a pg_net trigger on `shortlist_responses` (migration `shortlist_response_notify`, mirrored in `supabase/schema.sql`) pokes `/api/shortlist/response-hook`; the Worker resolves the owner via `get_list_owner` and web-pushes their subscribed devices (subscriptions carry the signed-in user id). Resend email remains optional future work (needs the user's API key). Original v1/v2 notes: **v1 SHIPPED (2026-07-04)**: builder on Saved ("Client shortlist" → tap spots → title → Share link, capped at 10) produces `#/list?spots=a,b,c&title=…`; the `/list` route renders OUTSIDE Layout (no tab bar) with option numbers, hero photo, name, `bestFor` one-liner, primary-light window in the spot's own TZ (`src/spots/shortlist.ts` `bestLightWindow`), and a Google-Maps address link. Share plumbing extracted to `src/util/share.ts` (native sheet / clipboard fallback; SpotDetail reuses it). **v2 SHIPPED (2026-07-04)**: signed-in builder stores the list in Supabase (`shortlists` table) with per-spot client-facing notes and shares the short `#/list?id=<uuid>`; the client (no account) sees the notes, picks favorites, and sends a name+comment back (`shortlist_responses`, insert-only for anon; reads go through the `get_shortlist` SECURITY DEFINER RPC so list ids can't be enumerated). Responses surface on Saved under "Client lists" (NEW pills vs `listsSeenAt`) and an app-open check (`refreshResponsesBadge`) lights a dot on the Saved tab. All env-gated: signed out / unconfigured falls back to v1 URL-only links. Modules: `src/spots/shortlist-api.ts`, schema block in `supabase/schema.sql` (**must be run once in the Supabase SQL editor**). Tests: `shortlist.test.ts`, `shortlist-api.test.ts`, `client-list.test.tsx`, `saved-shortlist.test.tsx` (v1/signed-out), `saved-client-lists.test.tsx` (v2/signed-in), `layout-badge.test.tsx`. **Still open (v3 of this feature)**: true out-of-app notification — email needs custom SMTP (Resend) + a Supabase DB webhook/Edge Function; push rides on backlog #1's PWA-push infra. Per-list OG unfurls need a small Worker route. Nobody in the competitive set serves the client-communication loop — this is a pro-workflow differentiator.

Deliberately skipped: DoF/exposure calculators (commodity; PhotoPills owns), 3D terrain shadows (server-heavy, breaks keyless), offline map tiles (storage-heavy), native widgets (impossible in PWA). Also noted: custom SMTP (Resend) for magic-link email before promoting broadly — built-in sender is a-few-emails/hour.

## Backlog — user feedback (2026-07-05)

Raw asks from the user after living with the app; not yet prioritized against each other.

1. ~~**More photos per spot**~~ — DONE 2026-07-06 (bounded pass): 74/75 spots covered; only st-paul-ame lacks Commons photos (re-verified) — falls back to Your-shots. Original ask: grow beyond the current seeded set (Commons coverage is thin for some spots; pairs with #8 and #9 below as sources).
2. ~~**Architecture review for large volumes**~~ — DONE 2026-07-05: **`docs/SCALING.md`** (measured baseline, breakpoints in hit-order, phased plan). Verdict: front-end shape is right; first breaks are `useAllSpots` (loads every city for Saved — fix with a spot-index before city #3), Worker cron bundling all city data (switch to ASSETS-fetched JSON ~100 cities), and editorial throughput (the real constraint — UGC #9 feeds curation). Keep curated spot data static/versioned; Supabase only for the dynamic layer. Pre-city-#3 work items are listed in the doc's phased plan.
3. ~~**Descriptions on list cards (Today, Browse)**~~ — DONE 2026-07-05: cards show a `bestFor` why-line (max 3, 2-line clamp) instead of the address; address stays on the detail page.
4. ~~**Smarter-sounding itinerary builder**~~ — DONE 2026-07-06 (Smart-build CTA + how-it-picks explainers; swap sheet uses rich SpotCards with the Pick/Current pattern). Original ask: the Day/Plan flow should read as "Smart build"/"Auto build" and explain *how it selects* (light windows, drive order, open hours). The swap flow should show more about each candidate (photo, why-it's-good) and use the same pick pattern as the rest of the app (like the shortlist builder), not a bare list.
5. ~~**Day plans persist**~~ — DONE 2026-07-06 (savedPlans in the synced store; Save-plan chip on the built day; Saved plans section on Plan). Original ask: planning a day should save it (survive reload, sync when signed in).
6. ~~**Share a plan**~~ — DONE 2026-07-06 (canonical /#/day?date=&stops= links; recipient pins the exact stops via pinPlan; no per-plan OG unfurl — URL-payload plans have no server row). Original ask: send a day plan to others (second use of the client-shortlist share machinery: capability link + OG unfurl).
7. ~~**Better onboarding**~~ — DONE 2026-07-06 (three-step first run: city -> seed want-to-gos from introPicks cards -> the Today promise). Original ask: first-run flow beyond the welcome card: pick your city, seed a few want-to-gos, explain the Today screen's promise in one swipe-through.
8. ~~**Add your own photos**~~ — DONE 2026-07-06 (Your-shots strip on Spot detail; spot-photos bucket + user_photos table, owner-scoped). Original ask: the existing Settings "soon" stub: attach personal shots to a spot (needs storage — Supabase Storage bucket — plus the shot-log/IndexedDB item from Next steps #8).
9. ~~**User-submitted locations**~~ — DONE 2026-07-06 (/suggest form -> spot_suggestions insert-only inbox; Browse entry point; curation via SQL sessions). Original ask: a "suggest a spot" form: users fill in what they know (name, pin, why it's good, access notes); store submissions (Supabase table) for periodic curation sessions where the user + Claude fill gaps to full spot quality (two-source verification per docs/ADDING_SPOTS.md) and ship them.
10. ~~**Trip plans / boards**~~ — DONE 2026-07-06 as a model decision: dated outings = saved plans (#5); undated collections = stored shortlists (already saved + shareable). One model, no third concept. Original ask: save collections bigger than a day: a weekend trip, a location-scouting board (relates to #5/#6; decide one model for "saved groups of spots" covering plans, boards, and shortlists).
11. ~~**Personal notes on spots**~~ — DONE 2026-07-06 (spotNotes in the synced store; private My-notes card on Spot detail). Original ask: private per-spot notes (synced via `vantage_state`), distinct from client-facing shortlist notes.
12. ~~**Clickability/affordance pass**~~ — DONE 2026-07-05 (with #3): `.chip.act` treatment (terracotta ink, firmer border) on feature entry-point chips — Compass to the light, Client shortlist, Copy link, Delete, Send an update; all chips get faint elevation vs flat pills.
13. ~~**Email**~~ — **FULLY DONE 2026-07-06.** Response-notify email (Worker → Resend) AND Supabase Auth custom SMTP: configured programmatically via the user's Management-API PAT (`PATCH /v1/projects/{ref}/config/auth` — host smtp.resend.com:465, user `resend`, sender "Vantage <hello@shootvantage.com>", auth email rate limit 2/hr → 30/hr). Verified end-to-end: live magic-link request delivered via Resend (`last_event: delivered`). The PAT lives in `.env.local` (`SUPABASE_ACCESS_TOKEN`) — full project-config access for future sessions. Historical notes: response-notify email ships (Worker → Resend, `alerts@shootvantage.com`, secret-gated owner lookup). Remaining: Supabase Auth custom SMTP for magic links — an access-audit agent verified every channel (MCP has no auth-config tool; auth settings are not SQL-reachable; the on-disk MCP Management-API token lacks `auth_config_read/write`; Resend has no cross-service path). Verdict: automatable via the user's logged-in dashboard EXCEPT typing the API key (credential entry — the user must paste it): Supabase dashboard → Authentication → SMTP → host `smtp.resend.com`, port `465`, user `resend`, password = key from `.env.local`, sender `hello@shootvantage.com`. Also audited: leaked-password protection is **Pro-plan-gated** (billing decision, not access); notification-permission taps are physically human. Phase 2 prereqs (2026-07-06): Resend account created, shootvantage.com connected via Domain Connect, sending path fully verified (DKIM/SPF green; API key in local `.env.local`, NEVER in the repo). Remaining user dashboard steps: paste the key into Supabase Auth SMTP (host smtp.resend.com, user `resend`) and add it as a Cloudflare Worker secret (`RESEND_API_KEY`) for Worker-sent mail. Original plan (verified vs current docs 2026-07-05): **Phase 1 — notify-me email, free, no new accounts:** Cloudflare Workers `send_email` binding sends FROM the domain TO verified destination addresses only — perfect for "client responded"/"spot submitted" mail to the user's own inbox, riding the existing response-hook Worker. Prereq (user, dashboard): enable Email Routing on shootvantage.com + verify flahertyjon@gmail.com as a destination; then add the binding to `wrangler.jsonc` and send alongside the push. **Phase 2 — arbitrary recipients (auth + client-facing):** Resend free tier (3,000/mo permanent) + its one-click Supabase integration for custom SMTP — lifts magic links from 2/hr (built-in) to 30/hr+, restores template customization; domain verification = SPF/DKIM records pasted into Cloudflare DNS. Prereq (user): create Resend account + run the Supabase integration. Cloudflare deliberately has no general outbound relay (MailChannels freebie is dead) — don't chase one.

## Adding a spot
Full playbook: **`docs/ADDING_SPOTS.md`** (selection criteria, two-source fact verification, photo licensing + mandatory eyeball step, craft-guide standards, quality gates, live verification, new-city checklist). Mechanical enforcement lives in `tests/unit/spots-data.test.ts` + `spots-media.test.ts`.
