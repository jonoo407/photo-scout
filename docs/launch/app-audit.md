# Vantage (photo-scout) — readiness audit

Audited `main` @ `d8689d8` (2026-09-14, "require sign-in") on 2026-09-24. No product code changed.
Sibling report: [market-and-launch.md](./market-and-launch.md) (competitors + launch plan).
See [HANDOFF.md](./HANDOFF.md) for what has shipped against this audit since 2026-09-24 (six stacked PRs closing A1–A4/A7's push half).

## TL;DR

- **Engineering quality is high and the core product works.** Build, typecheck, 1,007 unit tests, and 31 Playwright tests all pass. Coverage is 97% of lines. The UI is polished, and the light/sun/weather engine is deep and well tested.
- **It is not launch-ready, for five reasons:**
  1. **A hard sign-in wall in front of all content** (shipped 2026-09-14). This kills growth: shared spot and day-plan links, SEO, and the chance to try before signing up. It is also an App Store 5.1.1(v) rejection risk.
  2. **Security holes in the Cloudflare worker.** They allow push-notification spoofing, hijacking of client-response notifications, and email flooding (proved locally, details in §5).
  3. **App Store blockers.** There is no in-app account deletion, even though the docs say there is. There are no privacy/support pages. Native iOS push is broken because `AppDelegate` never forwards the device token. The listing is empty. The app is iPad-enabled with no iPad design. The last TestFlight build predates the sign-in gate.
  4. **No analytics or crash reporting,** so growth can't be measured.
  5. **Thin content:** 2 cities, 75 spots, 2 hunts.
- The good news is that most blockers are small, well-bounded PRs (§8).

## 1. What it is and who it's for

"Vantage", live at **shootvantage.com**. It is a curated, place-and-craft-first location scouting app for photographers. It answers three questions: where to shoot, what to make there, and when the light and access are right.

- **Cities:** Tampa Bay (30 spots) and Philadelphia (45 spots). There are 116 self-hosted CC-licensed photos. Only `st-paul-ame` has no photo.
- **Target users:**
  - Hobbyist and enthusiast photographers who want to go out tonight and get a good shot.
  - Working pros such as portrait and family shooters. The client-shortlist workflow (send a client location options, get their picks back) is a pro differentiator no competitor has.
- **Positioning** (from HANDOFF): PhotoPills/TPE own sun/moon calculation, Locationscout owns UGC breadth (274k spots), and Explorest is the closest curated competitor. Vantage's bet is curation + craft guidance + light-aware planning in one app.

## 2. Stack and deploy

| Layer | What | Notes |
|---|---|---|
| Web app | React 19, Vite 6, TS strict, Zustand (persisted to localStorage), React Router 7 **hash** router, Leaflet + OSM tiles, suncalc, Open-Meteo (keyless), vite-plugin-pwa | Per-city lazy data chunks; spot data is static TS, validated by tests |
| Hosting | Cloudflare **Worker** `vantage` (`wrangler.jsonc`): assets binding serves `dist/` with SPA fallback; custom domains apex + www | Auto-deploys from `main` via Workers Builds. The Supabase URL and key are Cloudflare *build* vars (not in the repo), so a local `npm run build` has auth **off** |
| Worker API | `worker/index.ts`: `/api/push/*` proxy to one global `AlertsDO` (SQLite Durable Object: subscriptions, VAPID keys, pending queue); daily cron at 16:30 UTC scores watched spots and sends web push + APNs; `/l/<uuid>` shortlist OG unfurl; `/api/shortlist/response-hook`, `/api/feedback-hook`, `/api/report-hook` (Supabase pg_net webhooks leading to Resend email); `/api/inbound-mail` (Svix-verified support@ forwarder) | Secrets: RESEND_API_KEY, SUPABASE_HOOK_SECRET, RESEND_WEBHOOK_SECRET, SUPPORT_FORWARD_TO, APNS_* |
| Backend | Supabase project `gxxjxfwxufqqxcyrdibh`, **free tier** (kept alive by a daily GitHub Action). Tables: vantage_state (sync), shortlists/responses, spot_suggestions, user_photos (+ storage bucket `spot-photos`), photo_ratings, photo_reports, blocked_users, photographers, city_votes, hunts/hunt_progress/point_events, feedback. Definer RPCs for everything sensitive. Edge Function `storage-janitor` | **`supabase/schema.sql` is a partial narrative, not the source of truth.** Most migrations were applied via MCP and "full bodies live in the migration". There is no `supabase/migrations/`, so the DB can't be rebuilt from the repo |
| Auth | Email + password (autoconfirm on, min 10 chars) and Google OAuth (web only). Magic links removed. Custom SMTP via Resend | No CAPTCHA; leaked-password protection needs Supabase Pro |
| iOS | Capacitor 8 (SwiftPM), bundle `com.shootvantage.app`, app id 6795605010. Plugins: camera, geolocation, push. Bundles `dist/` including all photos (~26 MB) | `ios-release.yml`: tag `v*` produces a signed build on TestFlight with no Mac. Latest build is **v0.1.6 / build 17, 2026-08-31** |
| CI | `webview.yml` (every push/PR): unit + coverage thresholds, build, relative-asset check, Playwright WebKit gate, axe gate. `ios-simulator.yml` (native changes only). `ios-release.yml` (tags). `appstore-preflight.yml`. `supabase-keepalive.yml` | All recent runs green. The last code push was 2026-09-14 |

## 3. Feature inventory

Status key: ✅ done · 🟡 partial · ❌ missing · 🔴 broken

| Area | Feature | Status | Notes |
|---|---|---|---|
| Discovery | Today: Next Up hero, weather/sunset-score/moon tiles, collapsible sun/moon table, 3-step onboarding, feedback nudge | ✅ | |
| | Explore list: search, category + light-bucket chips, open-now, free, pet-friendly (75/75 spots have data), dark-sky, drive-time, sort | ✅ | Search covers the active city only |
| | Explore map: OSM pins, sun-path lines, tap for a card | 🟡 | Tiles come straight from `tile.openstreetmap.org`, which the OSMF usage policy forbids for distributed apps at scale. No clustering, no offline tiles |
| | Spot detail: hero carousel with EXIF, facts, light windows, compass-to-the-light, best days + ⓘ explainer, sun-alignment dates, Milky Way, craft guide, shot checklist, community shots + ratings, your shots, private notes, logistics/directions, want/been | ✅ | Milky Way appears only on darkSky spots, and just 1 spot is tagged |
| | Share a spot | 🔴 for growth | Links go to `/#/spot/<id>`, which lands on the **sign-in wall** for anyone signed out. No per-spot OG unfurl |
| Planning | Smart-build day plan, swap sheet, save plans, share plan | 🟡 | Shared `/#/day?...` links also hit the sign-in wall |
| | Conditions alerts (web push via cron) | ✅ web / 🔴 iOS | Native: `ios/App/App/AppDelegate.swift` lacks the `didRegisterForRemoteNotificationsWithDeviceToken` / `didFailToRegister…` forwarding that `@capacitor/push-notifications` requires (see its README), so no token or error ever arrives and the 10 s timeout fires. J2 (real-device test) was never closed |
| | Golden-hour reminders (V15) | ❌ | |
| | Magic layers: tides ✅; rockets and birds (V14) | 🟡 | |
| | True Golden Hour skyline engine (V16) | ❌ | Planned signature feature |
| | Offline city download (V19) | ❌ | PWA shell + photos work offline; tiles and weather don't |
| Accounts | Email/password sign-up/in, reset, Google (web), local-to-account merge, cross-device sync | ✅ | Sync is whole-document last-write-wins, and unions resurrect un-saves (§5) |
| | Sign in with Apple | ❌ | Not required while Google is web-only |
| | **In-app account deletion** | ❌ **(docs say ✅)** | Only a DB trigger on `auth.users` delete exists. There is no UI and no endpoint. Settings → Account has only "Sign out". The BACKLOG J3 line "Account deletion (also required) already ships" is false |
| | Guest browsing | ❌ (removed 2026-09-14) | The design handoff (2e/4b) specified browsing ungated with a soft gate on save/join/post |
| Pro workflow | Client shortlist v1–v3: builder, `/l/<uuid>` unfurl, account-free client page, responses, push + email to owner | ✅ | Responses can be spoofed and notifications hijacked (§5) |
| Community | Next-city scoreboard (votes) | ✅ | |
| | Community shots + Bayesian ratings, quotas by craft level | ✅ | `user_photos` had 0 rows in prod as of July |
| | Moderation: standards gate, report (auto-hide at 2 reporters), block by opaque ref, per-row unblock, email to curator, `/guidelines` | ✅ | Triage is SQL-only; no admin UI |
| | Spot discussions (V7), critiques (V8), city titles (V9), ambassadors (V6) | ❌ | The Community tab shows "soon" pills, a completeness (2.1) risk |
| Gamification | Server-minted craft points, 5-tier medallion ladder, photo hunts with geo + photo proof | ✅ | Only 2 hunts. Geo is spoofable (V12) |
| | Referrals (V5) | ❌ | The ladder sheet still advertises "Friend joins via your invite +200", which is misleading copy with no mechanism behind it |
| Intake | Suggest-a-spot form, feedback form + monthly nudge (emailed) | ✅ | Both anon-insertable with no CAPTCHA (§5) |
| Content | 2 cities / 75 spots / 116 photos / 2 hunts | 🟡 | The biggest competitive gap. Curation throughput is the bottleneck (SCALING.md) |
| Platform | PWA (auto-update, stale-client recovery) | ✅ | |
| | iOS app on TestFlight | 🟡 | Stale build; listing empty (§7) |
| | Android | ❌ | Capacitor makes this cheap-ish |
| Launch infra | Privacy policy, terms/EULA, support page | ❌ | `/privacy` returns the SPA shell (checked live) |
| | robots.txt, sitemap, SEO-able pages | ❌ | `/robots.txt` returns HTML; hash routing means nothing is indexable |
| | Product analytics, crash/error reporting | ❌ | Nothing at all in the codebase |
| | Admin/moderation console | ❌ | SQL only |

## 4. Build and test results (run here, Node 22.14)

| Check | Result |
|---|---|
| `npm ci` | ✅ clean |
| `npm run build` (tsc over src/tests/worker/e2e + vite + PWA) | ✅ Main chunk **528 KB / 162 KB gzip** (Vite >500 KB warning; was 417 KB in July). Precache 16 entries / 870 KiB |
| `vitest run --coverage` | ✅ **148 files, 1,007 tests pass.** Lines 97.29%, branches 90.79%, functions 85.04% (thresholds 96/88/83). 35 React `act()` warnings (noise, not failures) |
| Playwright (all 3 projects, local-style build) | ✅ **31/31 pass**: 15 chromium visual, 8 axe, 8 WebKit |
| Same gates against a **production-configured build** (Supabase env set, as Cloudflare builds it) | ❌ WebKit gate **0/8**: every route renders the sign-in screen, so no tab bar. Axe 8/8 pass, but it only ever scanned the login screen. **CI never tests what real users see.** |
| Full axe scan (all impacts), 13 routes + login | No serious/critical findings. Every screen has **`meta-viewport` (zoom disabled via `user-scalable=no, maximum-scale=1`)**, **`landmark-one-main` (no `<main>`)**, and many `region` findings. Spot page also has `heading-order`; You has no h1 |
| `npm audit --omit=dev` | 2 advisories in `react-router(-dom)` ≤7.17 (1 high). Mostly SSR/RSC-only, but one is an open redirect in `<Link>`. Fixed by a minor bump |
| `npm outdated` | Capacitor 8.4→8.5, supabase-js 2.110→2.117. Dev toolchain one or more majors behind (vite 6→8, vitest 2→5, vite-plugin-pwa 0.21→1.3) |
| GitHub Actions | All recent runs green. iOS release last ran 2026-08-31 (v0.1.6) |

**Test-suite gaps:**
- No end-to-end user-flow tests (V11): sign-up, save, plan, share, report/block, and upload are all untested end to end.
- No RLS/definer-function tests (V22). The authorization layer is verified only by SQL comments.
- The visual suite has no baselines, so it can't catch visual regressions.
- The native paths get only a 30 s simulator smoke test plus manual TestFlight checks.

## 5. Risks

### Security (ordered by severity; the first three proved locally with the repo's own worker harness)

1. **The public proxy exposes internal Durable Object routes.** `/api/push/*` forwards *any* sub-path, including:
   - `POST /api/push/notify-owner`: send arbitrary push title/body/URL to every device of any user ID, including APNs. This is phishing-grade.
   - `POST /api/push/cron`: run the daily job on demand, which burns Open-Meteo calls.

   Fix: allowlist vapid/subscribe/unsubscribe/pending/status.
2. **`/subscribe` trusts a client-supplied `userId`.** An attacker can register their own endpoint under a victim's ID and receive the victim's client-response notifications (client names, list titles). The victim's ID is easy to get: the anon RPC `get_list_owner(list_id)` returns the owner's uuid to anyone holding a shortlist link, which includes every client. Fix: verify the Supabase JWT in the Worker and derive the user ID from it.
3. **The three DB webhooks are unauthenticated.** pg_net sends only `Content-Type`, and the Worker checks nothing. Anyone can:
   - POST `/api/feedback-hook` or `/api/report-hook` to email the owner at will;
   - POST `/api/shortlist/response-hook` with a known list ID to push and email a photographer fake "client picked" messages.

   Resend's free quota (3,000/month) is **shared with auth SMTP**, so flooding these hooks can also break password-reset emails.
4. **Anon insert with no rate limit or CAPTCHA** on `feedback`, `spot_suggestions`, and `shortlist_responses`. Each insert also triggers an email, which amplifies item 3. Autoconfirm sign-ups plus no CAPTCHA allow bulk fake accounts and registering someone else's email (an accepted tradeoff, but it scales badly).
5. `/subscribe` is unbounded. Unlimited DO storage rows would bloat the single-threaded cron loop.
6. The owner's personal email is hard-coded in the Worker (`flahertyjon@gmail.com`, in a public repo). The auth-gated RLS layer is untested (V22). Supabase free tier means no PITR backups and no leaked-password protection.
7. Minor: react-router advisory; Google Fonts loaded from Google (privacy-label and GDPR disclosure).

Good practices already in place: RLS on everything, definer RPCs with function-EXECUTE lockdown generated from a manifest, opaque photographer refs, Svix verification on inbound mail, secrets kept out of the repo, and release workflows that never run on `pull_request`.

### Reliability

- **Schema isn't reproducible** from the repo (no migrations dir). It can't spin up a staging or branch DB, and disaster recovery depends on Supabase alone.
- **Sync correctness.** Sync pushes the whole slice, last write wins, with union-merge at sign-in:
  - two active devices overwrite each other's recent changes;
  - un-saves and deletes come back after a merge (no tombstones).
- **The alerts cron is one global DO doing serial awaits** per subscriber, with no failure alerting and no observability. It is fine now and will not scale to tens of thousands of subscribers.
- **Supabase free tier** pauses projects (hence the keepalive) and has a 1 GB storage cap (J5).
- **Third-party terms:**
  - OSM tiles: distributed-app use is prohibited without permission, so the map could get blocked.
  - Open-Meteo free tier: non-commercial only.
  - Nominatim: 1 request/second, and needs an identifying referrer.
- **Stale auth dead ends.** "Sign in", "Open Settings", and "Sign in to vote" buttons (Hunts, CommunityShots, SpotPhotos, Community) navigate to `/settings`, which has no sign-in UI since V4. They are unreachable only while the hard gate exists, and they break as soon as guest mode returns.
- **Docs drift.** BACKLOG claims account deletion ships, and HANDOFF says "verified" for wrapper alerts, which only covered the server side. Treat docs as claims, not facts.

### Performance

- The main bundle grew to 162 KB gzip. Every screen is imported eagerly in `src/App.tsx`; only MapView is lazy. Route-level splitting would roughly halve first load.
- Render-blocking Google Fonts CSS from a third party. The native app fetches fonts over the network on every launch and falls back when offline.
- IPA carries ~26 MB of photos (fine until ~city 5, per SCALING.md).
- No Lighthouse or bundle budget in CI.

### Accessibility

- Pinch-zoom is disabled (WCAG 1.4.4).
- No `<main>` landmark; heading-order issues.
- The axe gate ignores moderate findings and runs only on the auth-off build.
- No VoiceOver, Dynamic Type, reduced-motion, focus-trap-in-sheets, or touch-target audit. The inputs use placeholders plus `aria-label` rather than visible labels.
- Contrast is test-enforced (`contrast.test.ts`), which is good.

## 6. Competitive and product gaps (brief; see the sibling report)

- **Content breadth.** 2 cities is the main constraint on user uptake. The city-vote scoreboard exists to pick city #3, but the editorial pipeline is manual.
- **Viral loops are broken or missing:** share links are gated, there are no referrals, no SEO pages, and no per-spot unfurls.
- **Android is missing.**
- **Signature features are still unbuilt:** True Golden Hour engine, offline city packs, discussions and critiques.

## 7. What blocks release

### App Store (iOS)

| # | Blocker | Guideline | Owner |
|---|---|---|---|
| A1 | No in-app account deletion | 5.1.1(v) | 🤖 |
| A2 | Sign-in required before any content | 5.1.1(v) ("don't require registration unless core") | 🤖 (product decision: Jon reversed guest mode on 2026-09-14) |
| A3 | Privacy Policy URL + Support URL don't exist (serve SPA shell); no terms/EULA for UGC | 5.1.1(i), 1.2 | 🤖 |
| A4 | Native push token never delivered (`AppDelegate` missing forwarding) → alerts toggle fails on device; weakens the 4.2 "not a web wrapper" case | 2.1 / 4.2 | 🤖 + 🧑 device tap (J2) |
| A5 | `TARGETED_DEVICE_FAMILY = "1,2"` → iPad required screenshots + iPad review of a 430 px phone layout; landscape enabled on iPhone | 2.1 / 4.0 | 🤖 (set iPhone-only + portrait) |
| A6 | Listing empty: description, keywords, category, age rating, privacy nutrition labels, screenshots (V20), review contact (Jon's name/phone), build not attached | ASC | 🤖 metadata/screens; 🧑 contact + Submit |
| A7 | TestFlight build 17 predates sign-in gate + later fixes; review account must be re-verified against current login | — | 🤖 tag a release |
| A8 | Community "soon" placeholders | 2.1 (placeholder content) | 🤖 (hide or ship V7) |
| A9 | Nice-to-have: app-level `PrivacyInfo.xcprivacy`, drop `armv7` capability, UIScene lifecycle migration before Apple enforces it | — | 🤖 |

### Public web launch (the site is already live, but a *promoted* launch needs these)

- Guest browsing (A2) and working share links.
- Worker security fixes (§5, items 1–3) and abuse controls (item 4).
- Privacy policy and terms (it collects email, location, and photos).
- Analytics and error monitoring.
- A decision on the Supabase Pro upgrade (J5) and a Resend plan split between auth and notification mail.
- Map tile provider that allows production use.
- Basic SEO: a `robots.txt` file, a sitemap, and indexable spot/city pages.

## 8. Prioritized work slices (each ≈ one agent, one PR)

Sizes: S ≈ small/contained · M ≈ multi-file with tests · L ≈ cross-layer.

### P0: security and store blockers (do first; mostly independent, parallelizable)

| ID | Slice | Size | Touches | Notes |
|---|---|---|---|---|
| W1 | **Worker hardening**: allowlist public DO routes; verify the Supabase JWT on `/subscribe` and derive userId from it; add a shared-secret header to all pg_net webhooks and check it in the Worker (migration + Worker secret); cap and rate-limit subscriptions; move the owner email into a secret; tests for each | M | `worker/`, `supabase/` trigger SQL, tests | Needs the Supabase migration applied + Worker secret set in the same rollout |
| W2 | **In-app account deletion**: Settings → Delete account (typed confirm) → service-role Edge Function deletes the auth user (existing prune trigger runs) + their storage files → local wipe + sign out | M | `supabase/functions/`, `src/ui/Settings`, tests | Required by Apple; also a GDPR/CCPA must |
| W3 | **Guest mode / soft gate** (design 2e + 4b): ungate Today/Explore/Spot/Plan/Day/shared links; gate only save/been/upload/rate/vote/hunt via a sign-in sheet; replace the `/settings` "Sign in" dead ends; keep local-first merge on sign-up | M–L | `AuthGate`, `Layout`, `App.tsx`, gated call sites, tests | **Needs Jon's sign-off** (reverses the 2026-09-14 decision). This is the single biggest growth lever |
| W4 | **iOS push fix**: add the two `AppDelegate` forwarding methods; a unit test that pins them (same pattern as `ios-permissions.test.ts`); tag a TestFlight build; Jon does the J2 device tap | S | `ios/App/App/AppDelegate.swift`, tests | |
| W5 | **Legal + support pages**: static `/privacy/`, `/terms/` (including the UGC EULA), `/support/` under `public/<x>/index.html`; link them from login, Settings and Guidelines; `robots.txt`; regression test that they aren't the SPA shell | S | `public/`, Settings, tests | Content needs Jon's review |
| W6 | **iOS project hygiene**: iPhone-only (`TARGETED_DEVICE_FAMILY=1`), portrait-only, app-level `PrivacyInfo.xcprivacy`, drop `armv7`; config tests | S | `ios/`, tests | |
| W7 | **App Store listing** (V20 + J3): Playwright screenshot generator at 6.9"/6.5" on seeded data, metadata + age rating + privacy labels pushed via the ASC API, attach build | M | `e2e/` or `scripts/`, ASC API | After W2–W6. 🧑 review contact + Submit |

### P1: launch readiness and growth

| ID | Slice | Size | Notes |
|---|---|---|---|
| W8 | **Analytics + error monitoring**: privacy-friendly product analytics (e.g. PostHog/Plausible) with a funnel (open → onboarding → first save → sign-up → alerts on → share → invite accepted) plus Sentry (web + worker); disclosed in the privacy policy | M | Prerequisite for any growth work |
| W9 | **Production-config e2e**: run the WebKit/axe gates against an auth-enabled build with Supabase stubbed by route intercept; commit core-flow tests (V11): sign-up, save, plan + share, shortlist respond, report/block, upload | M | Closes the "CI never sees the login screen" gap |
| W10 | **Shareable/SEO pages**: Worker-rendered `/s/<spot-id>` and `/c/<city>` with OG tags + per-spot OG image, redirecting into the app (same pattern as `/l/`); switch share URLs to paths; sitemap | M | Pairs with W3 |
| W11 | **Referrals (V5)**: invite links, attribution at sign-up (`referrals` table), server-minted +200, a referral card on You and in the hunt-complete sheet; until it ships, remove the ladder-sheet copy promising it | M | |
| W12 | **Abuse controls**: Cloudflare Turnstile / Supabase CAPTCHA on sign-up, feedback, suggest, and shortlist response; per-IP throttle; separate Resend budgets for auth and notifications | M | After W1 |
| W13 | **Map tiles**: move to a production-licensed provider (MapTiler/Stadia/self-hosted Protomaps) with a key and proper attribution | S | Foundation for V19 offline |
| W14 | **DB as code**: `supabase db pull` into `supabase/migrations/`; make `schema.sql` generated or retire it; document staging/branch setup | M | Enables W15 |
| W15 | **RLS + definer test suite (V22)** against a branch or local stack, as a CI job gated on `supabase/**` | M | After W14 |
| W16 | **Accessibility pass**: remove `user-scalable=no`/`maximum-scale`; add a `<main>` landmark; fix heading order; focus management in sheets; include moderate axe rules in the gate; manual VoiceOver + Dynamic Type pass | S–M | |
| W17 | **Performance**: route-level `lazy()`; self-host Fonts (also fixes offline native); bundle-size budget test; Lighthouse CI | S–M | |
| W18 | **Sync robustness**: re-pull on foreground/visibility; per-item timestamps/tombstones so deletes don't resurrect; two-device conflict tests | M | |
| W19 | **Dependency refresh**: react-router patch (audit), Capacitor 8.5, supabase-js; then a separate PR for the vite/vitest/pwa majors | S + M | |
| W20 | **Beta program** (process, light code): TestFlight external group + web beta cohort, a scripted test plan per release, feedback-triage cadence via the existing `feedback` table | S | Needs Jon: tester list, Apple beta review |

### P2: differentiation (after launch basics)

| ID | Slice | Size |
|---|---|---|
| W21 | Golden-hour reminders (V15), probably a mode of the existing cron | S |
| W22 | City #3 (scoreboard winner) curation: one PR per city of ~30–45 spots under ADDING_SPOTS.md; do the V13 scale-tier work alongside | L (editorial) |
| W23 | Spot discussion threads (V7), reusing the report/block infra; then remove the Community "soon" pills | L |
| W24 | Photo critiques (V8), after W23 | L |
| W25 | Offline city download (V19), after W13 | L |
| W26 | Android build via Capacitor (FCM push, Play listing) | M–L |
| W27 | Rockets layer (Launch Library 2, keyless); birds once there's an eBird key (V14) | M |
| W28 | True Golden Hour skyline engine (V16): spike first, then build | XL (split) |
| W29 | Moderation admin view (report triage without SQL) | M |
| W30 | Hunt geo anti-spoof (V12) + more hunts per city | M |

**Suggested first wave (parallel):** W1, W2, W4, W5, W6, and W8. Start W3 as soon as Jon confirms guest mode. W7 follows once those land.

## Decisions needed from Jon

1. **Guest browsing vs the hard sign-in wall.** This audit recommends a soft gate for growth and App Store 5.1.1(v). **Decided and shipped** (see [HANDOFF.md](./HANDOFF.md)): the six-PR stack replaces the wall with guest browsing (W3/G1).
2. **Supabase Pro (J5)** and a paid Resend tier before promotion.
3. **Map tile provider** and whether to take on a key or cost.
4. **Platform priority:** web-first launch now vs waiting for the App Store; Android yes or no.
5. **Legal text owner** for the privacy policy and terms, and the App Store review contact details. **Text drafted and details filled** in PR #4; the App Store Connect phone field is still the owner's to type in directly.
