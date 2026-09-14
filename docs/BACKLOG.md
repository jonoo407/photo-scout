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

Reports come from **You → Send feedback** and **Settings → Send feedback**
(`/you/feedback`), plus the once-a-month Today card (V2, shipped 2026-09-12). Each report lands
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
wontfix`.

## Index — every open item at a glance

| ID  | Item                                    | Who | Depends on | Size |
|-----|-----------------------------------------|-----|------------|------|
| V5  | Referral mechanics                      | 🤖  | —          | M    |
| V6  | City ambassadors — product mechanics    | 🤖  | V5, J4     | M    |
| V7  | Spot discussion threads                 | 🤖  | —          | L    |
| V8  | Photo critiques                         | 🤖  | —          | L    |
| V9  | City statuses / titles                  | 🤖  | V8         | M    |
| V11 | Playwright e2e flows + axe a11y         | 🤖  | —          | M    |
| V12 | Hunt geo anti-spoof hardening           | 🤖  | —          | M    |
| V13 | Scale-tier work (SCALING.md)            | 🤖  | city #3    | L    |
| V14 | Magic Layers: rockets + birds           | 🤖  | (eBird key)| M    |
| V15 | Golden-hour reminders                   | 🤖  | —          | S    |
| V16 | True Golden Hour engine (v1.1 signature)| 🤖  | —          | XL   |
| V17 | st-paul-ame photo (75/75 coverage)      | 🤖  | —          | XS   |
| V19 | Offline: download a city (tiles + data) | 🤖  | —          | L    |
| V20 | App Store screenshots (generated)       | 🤖  | —          | S    |
| V22 | RLS policy test suite                   | 🤖  | branch DB  | M    |
| J2  | Allow push on a real device             | 🧑  | —          | XS   |
| J3  | iOS App Store (engineering done; metadata + submit left) | 🤝 | — | L |
| J4  | Ambassador business deals               | 🧑  | —          | —    |
| J5  | Supabase billing / storage plan         | 🧑  | —          | —    |

### Priority order

**App Store submission is paused** (Jon, 2026-09-12) — not abandoned, just not
now. J3 and V20 stay filed with everything they need; see J3 for the exact
state of the listing. Everything else reaches users as a web deploy the moment
it merges.

1. **V5 — referral mechanics**, unblocked now that sign-in is required
   (V4 shipped 2026-09-14): attribution at account creation finally has an
   account to attach to, and it opens the V6 ambassador chain.
2. **V15 — golden-hour reminders**, the last small unblocked feature.
3. **V7 / V8** when there is appetite for a big one; V8 also needs the
   pricing call.

V17 and V22 are good gap-fillers any time. V11 is worth pulling forward if the
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

### V5 — Referral mechanics (was B11, design 4a) 🤖
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

### V17 — st-paul-ame photo (was B2) 🤖 · BLOCKED on a decision, not on effort
The one spot of 75 without a license-clean photo. Sources re-exhausted
2026-09-12, and the answer is that no freely-licensed photograph of THIS
church appears to exist:
- **Wikimedia Commons** — 4 keyword searches + 3 category sweeps
  (Churches in Tampa / Tampa, Florida / AME churches in Florida). Commons has
  ~30 Florida AME churches and not this one; the St. Paul AMEs it does have
  are Apalachicola, Chaires and Midway. Tampa hits are PDFs and one Clinton
  speech recording, as found in 2026-07.
- **Flickr, CC-filtered** — zero results. The one Flickr photo of the church
  that exists (`/photos/25229906@N00/14808805537`) is **All Rights Reserved**.
- **Openverse** — API returned 504 on five attempts across the session.
- **UNF George Lansing Taylor collection** — has a good photo; rights
  statement is `rightsstatements.org/vocab/InC` (In Copyright).

Note the media tests pin `sourceUrl` to wikimedia.org or flickr.com, so any
other institutional source (Florida Memory, Burgert Brothers via THPL, Tampa
Bay History Center) needs that allowlist widened as part of the same change.

The app degrades correctly today — verified 2026-09-12 at 390px: the hero
shows the "Add your own photo from this spot" invitation, no broken image, no
console errors. So this costs nothing until someone decides between:
  **(a)** ask Robby Virus (Flickr) or UNF for a licence — an email Jon sends
  or approves; **(b)** photograph it — Jon is in Tampa and it is an exterior
  on a public sidewalk, 0.4 mi from home; **(c)** widen the source allowlist
  to a public-domain institutional archive and use a historic image, clearly
  dated; **(d)** leave the Your-shots invitation, which is honest and already
  works. An AI-generated image of a real, named, historic Black church is
  **not** on this list without an explicit decision — it would be a fabricated
  depiction of a landmark, and "clearly labelled" does not fix that.
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

### V22 — RLS policy test suite 🤖 · needs a branch DB
The deferred §3 of `docs/TEST_COVERAGE.md`: 14 policies + 7 definer functions
are verified only by comments in `supabase/schema.sql`. Needs a Supabase
branch DB or local stack and its own CI job gated on `supabase/**`.

Split out of V21 when the advisor half shipped (2026-09-12). This is the
remaining coverage gap whose failure mode is a data breach rather than a
broken screen. The `as_level` parameter on the Supabase MCP read/write tools
can exercise a policy as `anon` or `authenticated` without a branch, which is
worth trying before standing up a whole stack.

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

- **J2 — Device notification tap** (was A4): Settings → Conditions alerts →
  Turn on → Allow, on a real phone/desktop. Physical tap only. First attempt
  (2026-08-31, build 16) found and fixed the wrapper's dead token POST — see
  HANDOFF; re-verify on build 17: the chip must land on "Turn off".
- **J3 — iOS App Store** (was A1): **Phases 1–3 shipped 2026-07-28** — Capacitor 8
  shell, tiered free CI, and a signed-archive → TestFlight pipeline. Builds up
  to **11** are live and VALID on TestFlight (verified via the App Store Connect
  API 2026-07-29; app `6795605010`, bundle `com.shootvantage.app`). `git tag vX.Y.Z && git push --tags` now ships a
  build with no Mac and no manual step. Details + gotchas in HANDOFF.
  **Not** Codemagic as originally planned — GitHub's standard macOS runners are
  free and unmetered on public repos. **Engineering is done** (phase 4 — native
  camera + APNs push — shipped 2026-07-29; wrapper alerts registration fixed
  and verified against production 2026-08-31, build 17). Remaining, in order:
  - **Privacy-policy + support pages.** App Store Connect requires a Privacy
    Policy URL and a Support URL. `shootvantage.com/privacy` and `/support`
    return 200 today only because the SPA catch-all serves the app shell —
    there is no policy. Claude writes both (static, in `public/`) — 🤖.
  - **V20 screenshots** — 🤖.
  - **Store metadata** (name, subtitle, description, keywords, category, age
    rating, privacy nutrition labels) pushed via a `workflow_dispatch` job
    using the App Store Connect key already in Actions secrets — 🤖.
  - **Submit for review** — one button in App Store Connect; Jon presses it
    because the account is his — 🧑.
  - **Service workers are NOT used on native** (resolved, previously unknown):
    `src/pwa/native.ts` skips registration and tears down any worker a prior
    build installed. Registering one there poisoned the photo cache and risked
    serving a previous build's assets across a binary update.
  - **Guideline 4.2 (minimum functionality)**: Apple rejects thin website
    wrappers. Using native plugins rather than web APIs for camera/location/push
    is what makes the difference at review. Account deletion (also required)
    already ships.
  - **Store metadata is NOT blocked — that claim was wrong, corrected
    2026-09-11.** This entry used to say the App Store Connect key existed
    only in GitHub Actions secrets and that the unblock was Jon handing one
    over. It is readable locally at `~/.appstoreconnect/` (config.json with
    issuer/key/team/app ids, the .p8 beside it, plus a pre-made App Store
    review demo account), and it was used against the live API on 2026-09-11.
    No key handoff is needed and no CI `workflow_dispatch` job is needed.
    **Verified state of the 1.0 listing** (PREPARE_FOR_SUBMISSION): description,
    keywords, promotional text, subtitle, support URL, marketing URL and
    privacy-policy URL are all null; primary category null; every age-rating
    field null; zero screenshot sets; no App Store review detail; and build 17
    is VALID on TestFlight but **not attached to the version**. Also: the
    Privacy Policy and Support URLs Apple requires do not exist —
    shootvantage.com/privacy and /support return the SPA shell (byte-identical
    to /), so a reviewer clicking them lands on the app. Note `wrangler.jsonc`
    uses `not_found_handling: single-page-application`, so a file at
    `public/privacy.html` serves at `/privacy.html`; clean URLs need
    `public/privacy/index.html` or an explicit Worker route.
    Genuinely Jon's: pressing **submit**, and the judgement calls about what
    the listing should say.
- **J4 — Ambassador business side** (was A6): recruit one pro/influencer per
  city; agree rev-share terms (percentage, payout, contract). Mechanics = V6.
- **J5 — Supabase billing / storage** (was A5 + storage note): free plan has a
  1 GB storage ceiling community uploads will eventually hit; Pro also
  unlocks leaked-password protection. Billing decision, no code.
