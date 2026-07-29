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
| V7  | Spot discussion threads                 | 🤖  | V1         | L    |
| V8  | Photo critiques                         | 🤖  | V1         | L    |
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
| J1  | Google SSO console setup                | 🧑  | —          | S    |
| J2  | Allow push on a real device             | 🧑  | —          | XS   |
| J3  | iOS App Store (phases 1–3 done; native+submit left) | 🤝 | — | L |
| J4  | Ambassador business deals               | 🧑  | —          | —    |
| J5  | Supabase billing / storage plan         | 🧑  | —          | —    |
| J6  | Make support@shootvantage.com deliver   | 🧑  | —          | XS   |

**Recommended order: V2 → V3, then decide V4** (it unblocks the
V5 → V6 growth chain). V10 is a good gap-filler any time.

⚠️ **J6 blocks App Store submission** — `support@shootvantage.com` is published
in-app but its MX record does not resolve. See the Jon-only queue.

---

## Community & trust

### V7 — Spot discussion threads (was B8, design 3b) 🤖
Per-spot comments visible to the community; moderation + report tooling
required (build on V1). Part of the Craft-Cards/Trusted-Circle v3 vision in
the plan file: recipes-not-pins, privacy tiers, follow photographers.
Community tab already has its "soon" pill placeholder.

### V8 — Photo critiques (was B13, design 1k) 🤖
Submit a shot for structured critique: scores on 3–4 axes (candidate set:
composition, light, timing, processing — finalize at build) + free-text
comments; aggregate per-axis averages. Star ratings (shipped) are the
lightweight precursor. **Monetization note (Jon's call, pair with pricing):
gate SUBMITTING behind a paid/founder tier; critiquing stays free.**
`critiqueGiven` +15 already exists in `src/craft/points.ts`.

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
(a) Permanent "Send feedback" row on Settings — short form: what's working /
what's missing, kind = feedback|feature, optional email for signed-out users;
(b) monthly non-annoying nudge — one dismissible Today card, max once per 30
days per device (`feedbackPromptAt` in the persisted store), never a modal,
never during onboarding, only after 3+ sessions; submit AND dismiss both
reset the clock; (c) insert-only `feedback` table (RLS like
`spot_suggestions`, no public reads); (d) periodic review sessions pull +
summarize via SQL into new backlog items here.

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
Rocket-launch calendar (Launch Library 2, keyless) + birding overlay (eBird —
free key, 2-min form is a tiny Jon assist). Tides already shipped.

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
axe checks at iPhone viewport.

### V12 — Hunt geo anti-spoof hardening 🤖
`submit_hunt_stop()` trusts browser coords (150 m haversine). Points still
require a real per-stop photo upload, but EXIF cross-check / attestation is a
future pass.

### V13 — Scale-tier work (was B9) 🤖 · conditional on city #3
Phased plan in `docs/SCALING.md`: spot-index for `useAllSpots`, Worker cron
switching to ASSETS-fetched JSON, editorial throughput. Trigger: the B12
scoreboard picking city #3.

## Jon-only queue

- **J1 — Google SSO** (was A3): Google Cloud Console OAuth client + enable the
  provider in Supabase. App side already flag-gated (`VITE_AUTH_GOOGLE`).
  Prerequisite for V4's quick-login path.
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
  - **Jon**: external TestFlight testers need Test Information filled in (then
    the `beta_review` dispatch input submits for beta review). App Store
    submission additionally needs screenshots, privacy nutrition labels
    (location, photos, user content) and the review submission itself.
- **J4 — Ambassador business side** (was A6): recruit one pro/influencer per
  city; agree rev-share terms (percentage, payout, contract). Mechanics = V6.
- **J5 — Supabase billing / storage** (was A5 + storage note): free plan has a
  1 GB storage ceiling community uploads will eventually hit; Pro also
  unlocks leaked-password protection. Billing decision, no code.
- **J6 — Make `support@shootvantage.com` actually deliver** ⚠️ **blocks App
  Store submission.** V1 publishes that address in-app (Settings → Community
  guidelines → Contact) because guideline 1.2 requires published contact
  information. Jon chose (2026-07-29) to make the address real rather than
  publish a personal one. **The app side is done and deployed**; two manual
  steps remain, both outside what the MCPs here can reach.
  - ✅ `/api/inbound-mail` is live — Svix-verified, fetches the body from the
    receiving API (the webhook carries metadata only), forwards from the
    verified domain with the sender in `reply_to`. It returns
    `503 not configured` until the vars below exist, so it is inert, not open.
  - ✅ Resend webhook created (`email.received` → that URL), id
    `99adf63b-a4d5-4292-b2f6-dfb61cc9e52a`. Its signing secret was given to Jon
    in chat on 2026-07-29 and is **not stored in this repo** — Resend will not
    show it again; delete and recreate the webhook if it is lost.
  - ⬜ **Jon — Cloudflare DNS**: add MX on the **root** (`@`) →
    `inbound-smtp.us-east-1.amazonaws.com`, priority `10`. Verified safe:
    shootvantage.com had **no MX at all** on 2026-07-29, and Resend requires
    its record to be the *lowest priority* on the domain, so nothing conflicts.
    Sending is unaffected (that rides the `send` subdomain's SPF).
  - ⬜ **Jon — Worker vars** on the `vantage` Worker: `RESEND_WEBHOOK_SECRET`
    (the `whsec_…` above, as a **secret**) and `SUPPORT_FORWARD_TO` (the inbox
    to forward to). Both are read in `worker/index.ts`.
  - Then verify by emailing support@shootvantage.com and watching it arrive.
    Until the MX resolves, mail to that address still bounces.
