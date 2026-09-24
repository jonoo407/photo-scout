# Vantage (photo-scout): roadmap to a growth-first launch

> **Launch-handoff note (2026-09-24):** the six PRs described in [HANDOFF.md](./HANDOFF.md) close slices **H1, H2, H3, H4** and **G1** below (plus two issues found while drafting H4, fixed in the same stack). They are stacked, CI-green and ready to merge; they are marked **Shipped — pending merge** in the tables below. Everything else in this roadmap is still open. See [HANDOFF.md](./HANDOFF.md) for what to do next.

**Goal:** make the app feature complete, test it with real users, beat competitors, and launch for the most users, not the most revenue. The core stays free forever: no ads, no trials, and no paywall on spots, navigation, alerts or plans.

**Where we are:** the core product works. Build, 1,007 unit tests and 31 end-to-end tests pass, and line coverage is 97%. The app has 2 cities and 75 spots. What blocks launch: a sign-in wall in front of all content, security holes in the Cloudflare worker, missing App Store requirements, no analytics, and thin content.

**Already in progress, now ready to merge:** worker security hardening (H1, [PR #6](https://github.com/jonoo407/photo-scout/pull/6)), in-app account deletion (H2, [PR #5](https://github.com/jonoo407/photo-scout/pull/5)), the iOS push fix (H3, [PR #3](https://github.com/jonoo407/photo-scout/pull/3)), privacy, terms and support pages (H4, [PR #4](https://github.com/jonoo407/photo-scout/pull/4)), and guest browsing (G1, [PR #8](https://github.com/jonoo407/photo-scout/pull/8)). [PR #7](https://github.com/jonoo407/photo-scout/pull/7) fixes two issues found while drafting H4: photo uploads leaked GPS/EXIF, and an installed PWA hijacked `/l/<uuid>` client-list links.

## Decisions needed

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| 1 | **Guest browsing or sign-in wall** | Let people browse without an account and ask them to sign in only when they save, turn on alerts, upload, rate or vote. This reverses the 2026-09-14 decision. | G1, working share links, SEO, App Store review (guideline 5.1.1(v)) |
| 2 | **Supabase Pro and a paid Resend plan** | Upgrade both before beta wave 2. Pro stops the project from pausing, lifts the 1 GB storage cap and adds leaked-password protection. Resend's free 3,000 emails a month are shared between login email and notifications. | H8, beta wave 2 |
| 3 | **Map tile provider** | Self-hosted Protomaps on Cloudflare fits the current stack, has no per-tile fees and makes offline maps possible. MapTiler or Stadia need no setup work. The current OpenStreetMap tiles are not licensed for app use at scale. | H12, E4, public launch |
| 4 | **Platform priority, including Android** | Launch on web (the installable PWA) and iOS. Android users use the PWA until the Play Store build (E3) ships in the expansion phase. Decide whether the Tampa launch waits for App Store approval. | Phase 4 timing, E3 |
| 5 | **Owner of the legal text, and App Store contact** | Jon approves the drafted privacy policy and terms, and supplies the review contact name, phone and support email. **Done for the drafted text** — filled in PR #4. The App Store Connect contact phone still needs to be entered by the owner directly (kept out of this repo). | Finishing H4, B2 (submission) |
| 6 | **Analytics and crash reporting tool** | PostHog for funnels and retention, plus Sentry for errors on web, the worker and iOS. Plausible is simpler but can't measure funnels or retention. | H7, and every metric below |

Also time-sensitive: the Worldwide Photo Walk on Sat Oct 3, 2026 is a good place to recruit beta testers in Tampa (Kelby is based there), even though it is too soon to launch there.

**Critical path:** H1–H4 → Decision 1 → G1 (guest mode) → G2 (spot pages) and D1 (Anywhere mode) → beta waves → App Store approval → Tampa launch.

---

## Phase 0: Hardening and App Store blockers

Each slice is one PR.

| ID | Slice | Depends on | Status |
|---|---|---|---|
| H1 | Worker security: allow only the public push routes; check the user's login token on subscribe; add a shared secret to the three database webhooks; cap subscriptions; move the owner's email into a secret | — | **Shipped — pending merge, [PR #6](https://github.com/jonoo407/photo-scout/pull/6)** (1st in the merge stack) |
| H2 | In-app account deletion: Settings → type to confirm → the server deletes the user and their photos → local data is wiped | — | **Shipped — pending merge, [PR #5](https://github.com/jonoo407/photo-scout/pull/5)** (2nd in the merge stack) |
| H3 | iOS push fix: forward the device token in `AppDelegate`, tag a TestFlight build, confirm on a real device | — | **Shipped — pending merge, [PR #3](https://github.com/jonoo407/photo-scout/pull/3)** (5th in the merge stack; the real-device confirm is still owed, see [HANDOFF.md](./HANDOFF.md)) |
| H4 | Privacy, terms (including the user-content rules) and support pages, plus `robots.txt`; linked from login and Settings | Decision 5 (final text) | **Shipped — pending merge, [PR #4](https://github.com/jonoo407/photo-scout/pull/4)** (4th in the merge stack; legal details filled). Also fixed by [PR #7](https://github.com/jonoo407/photo-scout/pull/7) (3rd in the stack), found while drafting: photo GPS/EXIF leakage and a PWA/`/l/` link hijack |
| H5 | iOS project settings: iPhone only, portrait only, privacy manifest file, drop `armv7` | — | |
| H6 | Remove placeholders: hide the Community "soon" pills, and remove the "+200 per invite" text until referrals exist | — | |
| H7 | Analytics and crash reporting on web, the worker and iOS; activation funnel events; disclosed in the privacy policy | Decision 6, H4 | |
| H8 | Abuse controls: CAPTCHA (Turnstile) on sign-up, feedback, suggest-a-spot and client responses; limits per IP address; separate email budgets for login and notifications | H1, Decision 2 | |
| H9 | Test what real users see: run CI against a build with login switched on; end-to-end tests for sign-up, save, plan and share, client response, report/block, upload | — (extend after G1) | Partially covered: [PR #8](https://github.com/jonoo407/photo-scout/pull/8) adds a CI build with auth on and a 23-test signed-out (guest) e2e suite. Sign-up, plan+share, report/block and upload flows while signed in are still untested end to end |
| H10 | Keep the database schema in the repo (`supabase/migrations/`) and document a staging setup | — | |
| H11 | Tests for database permissions (RLS and definer functions) in CI | H10 | |
| H12 | Map tiles from a licensed provider, with attribution | Decision 3 | |
| H13 | Dependency patches: react-router security advisory, Capacitor 8.5, supabase-js (toolchain majors in a later PR) | — | |

**Success metrics**
- The App Store blockers are closed: account deletion, privacy and support pages, push on a real device, iPhone-only layout, no placeholders.
- The three exploits proved in the audit (spoofed push, hijacked notifications, email flooding) fail in automated tests.
- CI passes against a build configured like production.
- Crash reports and funnel events arrive from web and iOS.
- No high-severity dependency advisories remain.

## Phase 1: Growth fixes

| ID | Slice | Depends on |
|---|---|---|
| G1 | **Guest browsing:** Today, Explore, Map, spot pages, plans and shared links open without an account; a sign-in sheet appears only at save, alerts, upload, rate, vote or hunt; fix the "Sign in" buttons that go to Settings, which no longer has sign-in; keep merging local data into the account at sign-up. **Shipped — pending merge, [PR #8](https://github.com/jonoo407/photo-scout/pull/8)** (6th/last in the merge stack) | Decision 1 |
| G2 | **SEO spot pages:** the worker renders `/spots/<city>/<slug>` and city pages as real HTML with structured data (JSON-LD), canonical URLs, `sitemap.xml` and an Apple Smart App Banner; sensitive spots are not indexed; share buttons switch to these URLs | G1, H4 |
| G3 | **Share cards:** a social preview image for each spot showing tonight's score ("Skyway from Fort De Soto: 86 tonight, 7:42 PM"); day-plan links get previews too | G2 |
| G4 | **Theme pages:** best sunset spots in Tampa Bay, pet-friendly spots, Milky Way near Tampa, portrait locations in St. Pete | G2 |
| G5 | **Client shortlist as a growth loop:** a "Planned with Vantage, free for photographers" footer and sign-up prompt on client pages | G1 |
| G6 | **Performance:** load screens on demand, self-host fonts (also fixes fonts offline on iOS), bundle-size budget and Lighthouse checks in CI | — |
| G7 | **Accessibility:** allow pinch zoom again, add a `<main>` landmark, fix heading order, manage focus in sheets, stricter automated accessibility checks, manual VoiceOver and Dynamic Type pass | — |
| G8 | **Sync fixes:** re-sync when the app comes to the foreground; record deletions so un-saved spots don't come back; tests with two devices | — |

**Success metrics**
- Every shared spot, plan or shortlist link shows content to a signed-out visitor, checked by an end-to-end test.
- Conversion from signed-out visitor to account is measured (the baseline is set in beta wave 1).
- 100% of spot and city pages that should be indexed are indexed in Google Search Console.
- First-load JavaScript is at most about 90 KB gzipped (it is 162 KB now).
- Lighthouse SEO scores at least 95 on spot pages.
- No serious or moderate accessibility findings.

## Phase 2: Differentiating features

**How we win:** competitors put nearby spots, coordinates and alerts behind a paywall (Locationscout, Explorest, Cascable), are hard to learn (PhotoPills, Planit), have outdated spots, or cover few local areas. Vantage is free, gives a direct answer, verifies its spots, and pairs deep local coverage with Anywhere mode. Its client shortlist has no equivalent at any competitor.

**Must ship before beta wave 2**

| ID | Slice | Depends on |
|---|---|---|
| D1 | **Anywhere mode:** drop a pin anywhere to get golden and blue hour, a sunset score, sun-alignment dates, the Milky Way window and alerts; connects to the city vote | G1 |
| D2 | **Freshness and trust:** a "verified <date>" label on each spot, one-tap "still accessible?" and "report a change", a published responsible-sharing policy with sensitivity levels for fragile sites | G2 |
| D3 | **Post-sunset field reports** ("how was it?" in three taps), and an honest confidence level shown with the forecast score | H7 |
| D4 | **Golden-hour reminders**, added as a mode of the existing alerts job | H3 |

**Can land during the beta**

| ID | Slice | Depends on |
|---|---|---|
| D5 | **Referrals:** invite links; record who invited whom at sign-up; the inviter gets +200 points and a "Founding Scout" medallion; the new user unlocks a starter hunt; restore the invite text | G1, H8 |
| D6 | **Permit and pro-shoot rules for each spot**, sourced from the site's operating authority, Tampa first (content work plus a new field) | — |
| D7 | **City-vote waitlist:** "Bring Vantage to <city>" sharing and email sign-up | D1 |
| D8 | **Moderation admin screen:** review reports without writing SQL | — |
| D9 | **Harder-to-fake hunt check-ins, and more hunts per city.** Required before any real-world prizes | — |
| D10 | **Photo-walk kit:** a page to host a hunt as a group walk, with check-in, a group gallery and a leaderboard | D9 |

**Success metrics** (* = proposed target, to confirm once beta wave 1 sets a baseline)
- At least 30%* of first sessions outside Tampa and Philadelphia use Anywhere mode.
- A field report is filed in at least 10%* of sessions opened from an alert, and forecast agreement is tracked.
- Invites sent per weekly active scout and the viral coefficient (K-factor) are measured.
- Rate of share-link opens that turn into installs is measured.

## Phase 3: TestFlight beta waves

| ID | Slice | Depends on |
|---|---|---|
| B1 | **Beta program:** external TestFlight group, plus a web group for Android and desktop users; a test script for each release; weekly "missions"; feedback triage using the existing feedback table | H3, H7 |
| B2 | **App Store listing and submission:** screenshot generator (6.9" and 6.5"), name, subtitle and keywords, age rating, privacy labels, custom product pages (sunset, portrait pros, astro, Tampa, Philadelphia) | H2, H4, H5, H6, G1, Decision 5 |

Missions: shoot a spot an alert flagged and file a field report; try a Smart-build day; send a shortlist to a real client; use Anywhere mode away from home.

| Wave | Who | Size | Entry | Exit criteria |
|---|---|---|---|---|
| 1 | Friends and Tampa clubs (Photographic Art Society, Tampa Photography Group) | ~50 | Phase 0 done, G1 merged | Crash-free sessions ≥99%; no open P0 or P1 bugs; push confirmed on ≥10 real devices; funnel events complete; each tester did ≥2 missions* |
| 2 | r/tampa, r/StPetersburgFL, Tampa Facebook photography groups, Philadelphia clubs; Oct 3 photo-walk recruits | ~300 | D1–D4 shipped; Supabase Pro and the Resend split live; H8 live | Crash-free ≥99.3%*; first-session activation ≥50%*; D7 retention ≥12%*; alert open rate ≥25% |
| 3 | Capped public TestFlight link | ~1,000 | G2 and G3 live; B2 drafted | **Launch gate:** crash-free ≥99.5%; D7 retention ≥15%; first-session activation ≥60%; spot-correction backlog empty; App Store approved (or web-first launch, per Decision 4); screenshots and custom product pages ready |

Apple limits: the first build of each version needs Beta App Review, builds expire after 90 days, and external testers are capped at 10,000.

## Phase 4: Tampa-first launch (Philadelphia second)

| ID | Slice | Depends on |
|---|---|---|
| L1 | Ask for a rating only after a success moment (an alert led to a shot, a hunt was completed, a field report was filed); reply to every review | B2 |
| L2 | Founding local ambassadors: credited spots, a badge and a profile link | G1 |
| L3 | App Store in-app events: monthly hunts, supermoon nights, sun-alignment weeks, photo walks | B2, D10 |
| L4 | Press kit and "best nights of the year" sun-alignment pages to pitch to local press and TV weather | G4 |

**Go-to-market (no code):**
- A monthly Vantage Golden Hour Walk.
- Useful posts on local subreddits, following each one's self-promotion rules.
- Pitches to Creative Loafing, Tampa Bay Times things-to-do, and TV weather ("tonight's sunset score").
- Direct messages to 50 portrait and wedding photographers offering the free client shortlist and permit rules.
- Repeat all of it in Philadelphia once Tampa meets the metrics below.

**Success metrics**
- North star: **weekly active scouts** (people who open a spot and then save, plan, navigate, file a field report or upload in the same week), growing week over week.
- First-session activation ≥60%.
- D1 / D7 / D30 retention ≥35% / 18% / 10%. The Photo & Video category median is 22% / 9% / 4.2%.
- Alert open rate ≥25%, crash-free sessions ≥99.5%, App Store rating ≥4.7.
- Organic web sessions, web-to-app installs, and client-shortlist recipients who sign up.

## Phase 5: Expansion

Order: Philadelphia launch → national App Store push and Product Hunt → city #3 onward → Android.

| ID | Slice | Depends on |
|---|---|---|
| E1 | City #3, chosen by the city vote (likely a Florida neighbour: St. Augustine, Miami or Orlando); one PR per city | D7 |
| E2 | Curation pipeline: suggest-a-spot plus an AI-assisted verification checklist that keeps the two-source rule; move photos out of the app bundle before about city 5 (the app is already about 26 MB) | H10 |
| E3 | Android on the Play Store (Capacitor build with Firebase push, or a TWA wrapper around the PWA) | Decision 4, H3 |
| E4 | Offline city download | H12 |
| E5 | Scale the alerts job: split the single Durable Object, add failure alerts. Needed before the national push | H7 |
| E6 | Spot discussions, then photo critiques in a follow-up PR | D8 |
| E7 | iOS widgets and a golden-hour Live Activity countdown | H3 |
| E8 | True Golden Hour shadow engine (spike first) and a "recreate this shot" camera overlay | — |
| E9 | Rocket launch layer; bird layer once there is an eBird key | — |
| E10 | Shareable "year in light" recap | H7 |
| E11 | Optional supporter tier with cosmetic perks only, once growth metrics hold | Phase 4 metrics |

**Go-to-market:**
- Launch on Product Hunt only after the App Store listing is live and Anywhere mode has shipped.
- National Reddit: r/photography allows promotion only in Self-Promotion Sunday threads, and r/LandscapePhotography bans links, so post useful content without links.
- Creators: local ambassadors first, then a $1.5–3K pilot with 2–3 mid-size YouTubers.
- Fstoppers, PetaPixel, and Nature First (the responsible-sharing angle).
- Optionally a small Apple Search Ads test. Don't buy installs at scale (about $5.84 per install on iOS).

**Success metrics**
- Each new city reaches Tampa's activation and retention within a month of its launch*.
- The share of new users arriving from organic search keeps rising.
- Product Hunt visitors who install are tracked, as are city votes per candidate city.
- At least 90%* of spots were verified within the last 12 months.
- Android rating ≥4.5*.

---

Sources: [app readiness audit](./app-audit.md) and [market research and launch plan](./market-and-launch.md). Details, evidence and competitor citations are in those reports.
