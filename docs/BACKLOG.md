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

## Index — every open item at a glance

| ID  | Item                                    | Who | Depends on | Size |
|-----|-----------------------------------------|-----|------------|------|
| V1  | Photo reporting + takedown (moderation) | 🤖  | —          | M    |
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
| V18 | Day plan empty after midnight (solar roll)| 🤖  | —          | S    |
| J1  | Google SSO console setup                | 🧑  | —          | S    |
| J2  | Allow push on a real device             | 🧑  | —          | XS   |
| J3  | iOS App Store deployment                | 🤝  | —          | XL   |
| J4  | Ambassador business deals               | 🧑  | —          | —    |
| J5  | Supabase billing / storage plan         | 🧑  | —          | —    |

**Recommended order: V1 → V2 → V3, then decide V4** (it unblocks the
V5 → V6 growth chain). V10 is a good gap-filler any time. V18 is a live
user-facing bug and small — worth slotting in ahead of the feature work.

---

## Community & trust

### V1 — Photo reporting + takedown 🤖
Community shots are now public content with no report mechanism or takedown
path — the most exposed gap in the app. Ship: a report action on community
shots (reason picker), insert-only `photo_reports` table (RLS like
`spot_suggestions`), a hide-on-N-reports or curator-review rule, and a
removal path. This is also the moderation foundation V7/V8 require.

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

### V18 — Day plan comes up empty after midnight 🤖
Open the Day screen between local midnight and ~1:30 AM and it renders "No open
spots for today's windows" instead of a plan. `dayBlocks()`
(`src/spots/day-plan.ts:53`) passes the raw `now` instant to `computeSunTimes`,
and SunCalc snaps to the nearest solar day **by longitude** — before solar
midnight (~05:34 UTC for Tampa) that resolves to *yesterday*, whose three blocks
are all in the past, so the `b.time > now` filter empties the plan.

Measured for Tampa on 2026-06-25: at 01:00 EDT blocks come back as 06-24
10:45/17:33 + 06-25 00:22 with 0 ahead; at 04:00 EDT they correctly return
06-25 with 3 ahead.

The codebase already knows this hazard — `sunTimesFor` at `day-plan.ts:137` and
`:165` shifts by `+12h` with the comment "local-noon to avoid the midnight
roll". `dayBlocks` just never got the same guard. Fix is to anchor on local noon
of the intended calendar day (`startOfDayInZone` + 12h from `src/util/tz.ts`,
using the region's `timeZone`) rather than on `now`.

Not hypothetical for this audience: 1 AM is when an astro or blue-hour shooter
actually opens the app. This is **not** a device-vs-region timezone gap — that
part is handled correctly (`REGIONS[].timeZone`, `src/util/tz.ts`,
`resolveOpenStatus`); it's specifically the solar-day roll.

Found 2026-07-28 while adding iOS CI: the same root cause made
`day-screen.test.tsx` fail on a UTC runner. The suite now pins
`TZ=America/New_York` (`vite.config.ts`), which fixed the test but leaves this
product bug open. Write the failing test at 01:00 local first.

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
- **J3 — iOS App Store** (was A1): Capacitor wrap + cloud CI (Codemagic /
  Capawesome; NOT Appflow — sunsetting). Claude does code + CI config; Jon:
  Apple Developer enrollment ($99/yr), App Store Connect agreements,
  signing-key approval. Includes web-push → APNs swap in the wrapper.
  Interim: the PWA installs from Safari today with push working.
- **J4 — Ambassador business side** (was A6): recruit one pro/influencer per
  city; agree rev-share terms (percentage, payout, contract). Mechanics = V6.
- **J5 — Supabase billing / storage** (was A5 + storage note): free plan has a
  1 GB storage ceiling community uploads will eventually hit; Pro also
  unlocks leaked-password protection. Billing decision, no code.
