# Vantage — Backlog (single source of truth)

**This is the only live backlog.** Every open work item lives here; everything else
(HANDOFF.md, old A/B lists, design-handoff notes) is historical record.

## Conventions — read before editing

- **Adding an item**: give it the next free `V##` (or `J#` if only Jon can do it),
  put it in the section it belongs to, add one row to the index table. IDs are
  never reused or renumbered.
- **Shipping an item**: delete its row + detail block here, and record the ship in
  HANDOFF.md's status list (date + one paragraph). This file holds only open work.
- **Who** column: 🤖 = Claude can complete solo · 🧑 = needs Jon · 🤝 = both.
- **Old IDs**: items carried over from HANDOFF's retired A/B lists note their
  lineage as `(was B8)` etc., so old references still resolve.

## Tester feedback → this file

Testers send from **You → Tester feedback** (`/you/feedback`). Each report lands
in Supabase `feedback` (insert-only RLS) **and** is emailed to Jon by the
`feedback_notify` trigger → `/api/feedback-hook`. The row is the durable copy;
email is just so nobody has to remember to look.

Pull the unreviewed ones and fold them into items below:

```sql
select created_at, kind, app_version, message, contact_email
from feedback where status = 'new' order by created_at desc;
-- then, once each is either an item here or deliberately dropped:
update feedback set status = 'triaged' where id in (...);
```

Every report carries the **build number** it came from (`app_version`), so
"it looks the same to me" is answerable. Statuses: `new → triaged → shipped |
wontfix`. This replaces nothing — V2 is still the real in-app feedback feature;
this is the TestFlight-phase stand-in.

## Index — every open item at a glance

| ID  | Item                                    | Who | Depends on | Size |
|-----|-----------------------------------------|-----|------------|------|
| V2  | In-app feedback capture                 | 🤖  | —          | S    |
| V3  | Pet-friendly data pass                  | 🤖  | —          | S    |
| V4  | Auth-gate + guest accounts — DECISION   | 🤝  | J1 helps   | M    |
| V5  | Referral mechanics                      | 🤖  | V4         | M    |
| V6  | City ambassadors — product mechanics    | 🤖  | V5, J4     | M    |
| V7  | Spot discussion threads                 | 🤖  | —          | L    |
| V8  | Photo critiques                         | 🤖  | —          | L    |
| V9  | City statuses / titles                  | 🤖  | V8         | M    |
| V10 | Storage janitor (deleted-account files) | 🤖  | —          | S    |
| V11 | Playwright e2e flows + axe a11y         | 🤖  | —          | M    |
| V12 | Hunt geo anti-spoof hardening           | 🤖  | —          | M    |
| V13 | Scale-tier work (SCALING.md)            | 🤖  | city #3    | L    |
| V14 | Magic Layers: rockets + birds           | 🤖  | (eBird key)| M    |
| V15 | Golden-hour reminders                   | 🤖  | —          | S    |
| V16 | True Golden Hour engine (v1.1 signature)| 🤖  | —          | XL   |
| V17 | st-paul-ame photo (75/75 coverage)      | 🤖  | —          | XS   |
| V19 | Offline: download a city (tiles + data) | 🤖  | —          | L    |
| V20 | App Store screenshots (generated)       | 🤖  | —          | S    |
| J1  | Google SSO — Google Console half only    | 🤝  | —          | S    |
| J2  | Allow push on a real device             | 🧑  | —          | XS   |
| J3  | iOS App Store (phases 1–3 done; native+submit left) | 🤝 | — | L |
| J4  | Ambassador business deals               | 🧑  | —          | —    |
| J5  | Supabase billing / storage plan         | 🧑  | —          | —    |

### Priority order

**Ship-to-App-Store is the long pole**, so it leads. Everything else reaches
users as a web deploy the moment it's merged; only the store has a review queue.

1. **J3 phase 4 — native camera + APNs push.** The last *engineering* blocker.
   Guideline 4.2 rejects thin web wrappers, and native plugins for
   camera/location/push are what avoid that. V1 cleared the other review
   blocker (guideline 1.2), so this completes the review-readiness set.
2. **V20 — screenshots**, then the remaining store metadata.
3. **V2 → V3** — product depth; both small, both unblocked.
4. **Decide V4**, which unblocks the V5 → V6 growth chain.

V10 and V17 are good gap-fillers any time. V11 is worth pulling forward if the
report/block flows are going to keep changing.

---

## Community & trust

### V7 — Spot discussion threads (was B8, design 3b) 🤖
Per-spot comments visible to the community. **Moderation is no longer a
prerequisite — V1 shipped it** (2026-07-28): reason-picker reporting,
auto-hide on 2 independent reports, a curator email leg, and blocking. Reuse
rather than rebuild:
- `block_photographer(ref)` already blocks by opaque ref, so it works on a
  comment with no photo attached — that was designed for this.
- `photo_reports` is photo-shaped. Threads need either a sibling table or a
  polymorphic target; decide at build.
- The posting filter (`src/community/standards.ts` + `StandardsGate`) should
  gate a first comment the same way it gates a first upload.

Part of the Craft-Cards/Trusted-Circle v3 vision in the plan file:
recipes-not-pins, privacy tiers, follow photographers. Community tab already
has its "soon" pill placeholder.

### V8 — Photo critiques (was B13, design 1k) 🤖
Submit a shot for structured critique: scores on 3–4 axes (candidate set:
composition, light, timing, processing — finalize at build) + free-text
comments; aggregate per-axis averages. Star ratings (shipped) are the
lightweight precursor. **Monetization note (Jon's call, pair with pricing):
gate SUBMITTING behind a paid/founder tier; critiquing stays free.**
`critiqueGiven` +15 already exists in `src/craft/points.ts`.

Moderation prerequisite is **met** — V1 shipped reporting, takedown and
blocking. A critique is user text about someone's photo, so it needs the report
path pointed at critique rows; see the V7 note on making the target
polymorphic, and do both at once if V7 lands first.

### V9 — City statuses / titles (was B15) 🤖
Ranked per-city standings ("Mayor" on down) earned by contribution quality:
highly-rated critique photos (V8 scores feed this) + accepted spot
submissions. Recomputed periodically; shown on profile / city page. Keep
visually distinct from the appointed ambassador (V6).

## Growth & gamification

### V4 — Auth-gate + guest accounts — DECISION FIRST (was B3, design 2e/4b) 🤝
Require sign-in up front: login screen w/ Google SSO (needs J1) or instant
Supabase anonymous guest account (upgradeable later, data intact). ⚠️ This
reverses the current local-first/no-account design and the onboarding flow —
**Jon confirms the tradeoff before build**. Client `/l/` + `#/list` links must
stay account-free. Design sheets 4b exist in `design-handoff/ia-redesign/`.

### V5 — Referral mechanics (was B11, design 4a) 🤖 · needs V4
Referral links, attribution recorded at account creation (`referrals` table),
server-minted award (+200 `referral` constant already in points.ts — biggest
single award). Also: invite-conversion awards for the B12 city-vote share
flow, and the deferred referral card in the hunt celebration sheet
(`HuntCompleteSheet.tsx` notes it). Points for accepted spot submissions
(award on status → 'added') ride along here.

### V6 — City ambassadors — product mechanics (was B10) 🤖 · needs V5 + J4
One ambassador per city: ambassador icon on their top-5 picks, city blurb
with photo + social link-out, per-ambassador signup code (attribution via V5)
so rev-share can be computed; admin mapping data-driven like REGIONS.

## Product & data

### V2 — In-app feedback capture (was #14/B1) 🤖
**Re-scoped 2026-07-29 — most of this already shipped** with the TestFlight
tester-feedback button (2026-07-28). Done: the insert-only `feedback` table
with `spot_suggestions`-style RLS and no public reads; the form itself
(`/you/feedback`, kind + message + optional email, build number captured
automatically); the email leg via `feedback_notify` → `/api/feedback-hook`;
and the SQL review loop, documented at the top of this file.

Actually remaining, and it is small:
- **(a) Placement.** The entry point sits on **You**, framed as a
  TestFlight-phase thing. Decide whether it becomes a permanent Settings row,
  stays on You, or both — then reword it for real users rather than testers.
- **(b) The nudge.** Not built. One dismissible Today card, max once per 30
  days per device (`feedbackPromptAt` in the persisted store), never a modal,
  never during onboarding, only after 3+ sessions; submit AND dismiss both
  reset the clock.

Size is now **XS–S**, not S.

### V3 — Pet-friendly data pass (was B16) 🤖
The feature is one dataset from shipping: `petFriendly` field, Explore filter
chip, and UI all exist and are tested, but zero spots have data (chip hides
behind `hasPetData`). Verify all ~75 spots per the two-source rule
(`docs/ADDING_SPOTS.md`): true/false + short note ("leashed only, not on the
beach"), shown as a fact chip on detail.

### V19 — Offline: download a city 🤖
"You should be able to download a location, like San Francisco" (Jon,
2026-07-28) — the field case is standing at a spot with one bar, or none.

Photos are already solved: all 116 are self-hosted in `public/spot-photos/` and
`cap sync` ships them inside the IPA, so they need no network at all. What's
left needs real work:
- **Map tiles** — the hard part. Leaflet pulls raster tiles from a tile server;
  pre-fetching a bounding box across usable zooms is where both the megabytes
  and the provider's terms live. Check the tile provider's caching policy
  before building anything.
- **Spot + conditions data** — spot JSON is small and could ship bundled;
  weather/tides are live and would need a last-known-good cache with an
  explicit staleness indicator (never silently show yesterday's forecast).
- **UI** — per-city download with size shown up front, progress, and a delete.

Growth trigger, from the self-hosting work: everything currently ships to every
user, so a Tampa user carries Philadelphia's photos. Around city 5 the app
passes ~60 MB and should split into bundled-thumbs + on-demand heroes — that
split is the natural foundation for this feature, so consider doing them
together.

### V14 — Magic Layers: rockets + birds (was B5) 🤖
Rocket-launch calendar (Launch Library 2, keyless) + birding overlay. Tides
already shipped. The eBird half needs a free API key from a 2-minute form —
**that is a key to hand over, not a task**: Jon requests it at
`ebird.org/api/keygen` and pastes it, and Claude does the rest.

### V15 — Golden-hour reminders (was B6) 🤖
Daily "golden hour in 40 min" ping. Decide overlap vs Conditions alerts
first — may be a mode of the existing cron, not a new system.

### V16 — True Golden Hour engine (was B7) 🤖
OSM building-height ray-march for when light actually clears the skyline —
the v1.1 signature feature. Big; deserves a dedicated session.

### V17 — st-paul-ame photo (was B2) 🤖
The one spot without a license-clean photo (Commons re-verified 2026-07-06:
PDFs/audio only). Exhaust real sources first (Commons variants, Openverse,
Flickr CC); only then consider a clearly-labeled AI placeholder. Fallback
today is the Your-shots strip. Keep `fix-media-hashes` + `verify-media-urls`
green after any photo-data touch.

## Platform & quality

### V10 — Storage janitor for deleted-account files 🤖
Account deletion keeps ≥3-ratings-avg≥4.0 photos (anonymized) but the
below-bar FILES linger in the bucket (DB rows cascade; storage.objects can't
be SQL-deleted — Storage API only, and the owner's token is gone). Ship a
service-role Edge Function janitor (deployable via Supabase MCP; the service
key never has to leave the platform).

### V11 — Playwright e2e flows + axe a11y (was B4) 🤖
`e2e/visual.spec.ts` (screens) exists; no flow suite yet. Add core-flow e2e +
axe checks at iPhone viewport. **Worth pulling forward**: V1's report / block /
standards-gate flows were verified with throwaway Playwright scripts that were
deleted after use (2026-07-28/29) — those are exactly the flows that should be
committed tests, and the stubbing pattern that made them work (route-intercept
Supabase RPCs, inject a session into localStorage) is written up in HANDOFF.

### V12 — Hunt geo anti-spoof hardening 🤖
`submit_hunt_stop()` trusts browser coords (150 m haversine). Points still
require a real per-stop photo upload, but EXIF cross-check / attestation is a
future pass.

### V20 — App Store screenshots 🤖
Previously filed under J3 as Jon's job; it isn't. Screenshots are generated,
not taken: drive the built app with Playwright at Apple's required device
sizes (6.9" and 6.5" iPhone at minimum), on seeded data, and save the set.
`e2e/` already runs the app at iPhone viewport, so the harness exists — this is
choosing the strongest 5–8 screens and scripting them, not new infrastructure.
Do it alongside V11 so the flows and the screenshots share one driver.

Uploading them to App Store Connect needs an ASC API key (see J3).

### V13 — Scale-tier work (was B9) 🤖 · conditional on city #3
Phased plan in `docs/SCALING.md`: spot-index for `useAllSpots`, Worker cron
switching to ASSETS-fetched JSON, editorial throughput. Trigger: the B12
scoreboard picking city #3.

## Jon-only queue

**Read this before adding anything here.** An item earns a place in this list
only if it is *genuinely impossible* for Claude: a physical act, a decision
that is Jon's to make (money, strategy, tradeoffs), a human relationship, or a
credential that exists somewhere unreadable (e.g. CI-only secrets). "There's no
MCP tool for it" does **not** qualify — Claude holds privileged API keys for
Cloudflare, GitHub, Resend and Supabase, and must probe those before
delegating. See global RULE 4 and the `check-credentials-before-delegating`
memory. When only part is blocked, the entry names **the key to hand over**,
not the chore to perform.

*(This list was audited on 2026-07-29 after Claude wrongly asked Jon to add a
Cloudflare DNS record and two Worker secrets it had the token to do itself.)*

- **J1 — Google SSO** (was A3): **only the Google Cloud Console half is Jon's.**
  Create the OAuth client there, then hand Claude the **client ID + client
  secret** — enabling the provider in Supabase is a Management API call Claude
  can make (`SUPABASE_ACCESS_TOKEN` is present). No `gcloud` and no Google
  credentials exist locally, which is the only reason the console step can't be
  automated. App side already flag-gated (`VITE_AUTH_GOOGLE`). Prerequisite for
  V4's quick-login path.
- **J2 — Device notification tap** (was A4): Settings → Conditions alerts →
  Turn on → Allow, on a real phone/desktop. Physical tap only.
- **J3 — iOS App Store** (was A1): **Phases 1–3 shipped 2026-07-28** — Capacitor 8
  shell, tiered free CI, and a signed-archive → TestFlight pipeline. Build
  0.1.0 (3) is live on TestFlight (app `6795605010`, bundle
  `com.shootvantage.app`). `git tag vX.Y.Z && git push --tags` now ships a
  build with no Mac and no manual step. Details + gotchas in HANDOFF.
  **Not** Codemagic as originally planned — GitHub's standard macOS runners are
  free and unmetered on public repos. Remaining work:
  - **Phase 4 — native surface.** Remaining: web-push VAPID → APNs
    (`@capacitor/push-notifications`, an APNs auth key, and a Worker branch to
    send APNs tokens vs web subscriptions) — measured absent in the wrapper,
    see below; native **camera** capture (geolocation and the app icon/splash
    are done). Capacitor's template still uses the pre-`UIScene` lifecycle — a
    runtime warning now, a hard assert on some future iOS.
  - **Measured in the wrapper (2026-07-28)**, by the capability probe the
    simulator workflow now gates on:
    `geolocation=ok share=yes clipboard=yes notification=no push=no`.
    So push is the only web API confirmed missing. Re-read that line from CI
    rather than assuming — it is printed on every native run.
  - **Service workers are NOT used on native** (resolved, previously unknown):
    `src/pwa/native.ts` skips registration and tears down any worker a prior
    build installed. Registering one there poisoned the photo cache and risked
    serving a previous build's assets across a binary update.
  - **Guideline 4.2 (minimum functionality)**: Apple rejects thin website
    wrappers. Using native plugins rather than web APIs for camera/location/push
    is what makes the difference at review. Account deletion (also required)
    already ships.
  - **Store metadata — mostly NOT Jon's, corrected 2026-07-29.** App Store
    Connect credentials live only in GitHub Actions secrets
    (`APP_STORE_CONNECT_ISSUER_ID` / `_KEY_ID` / `_PRIVATE_KEY`), which are
    write-only from outside CI — that is the *only* thing blocking Claude here.
    **The unblock is one action: put an ASC API key (.p8 + issuer/key id) where
    Claude can read it.** With that, Claude can fill Test Information, set
    privacy nutrition labels (location, photos, user content) and upload
    screenshots via the App Store Connect API. Screenshots themselves need no
    key at all — see **V20**, they are generated with Playwright.
    Genuinely Jon's regardless: pressing **submit** on the review, and any
    judgement call about what the listing should say.
- **J4 — Ambassador business side** (was A6): recruit one pro/influencer per
  city; agree rev-share terms (percentage, payout, contract). Mechanics = V6.
- **J5 — Supabase billing / storage** (was A5 + storage note): free plan has a
  1 GB storage ceiling community uploads will eventually hit; Pro also
  unlocks leaked-password protection. Billing decision, no code.
