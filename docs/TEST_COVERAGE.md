# Test coverage — where we stand and what to fix next

**Status:** the analysis below was written on 2026-08-30 against `main` @ b417d2a.
Everything in it except §3 (row-level security) has since been acted on in the
same branch. Current numbers, measured with `npm run test:cov`:

| | before | now |
|---|---|---|
| Lines / statements | 90.61 % | **97.18 %** |
| Branches | 87.56 % | **89.84 %** |
| Functions | 79.89 % | **85.14 %** |
| Unit tests | 717 | **903** |

`worker/index.ts` went 0 % → 91.5 % (100 % of its functions) and is now
typechecked; the sync engine, the weather parser, the device failure paths, the
map lens and the votes API are all covered; the axe suite runs in CI as a hard
gate; and coverage thresholds now fail the build on a regression. What is left
is §3 — see **What remains** at the foot of this document.

The original analysis follows, because the reasoning is the useful part — and
because the ranking is what a future round should be argued against.

---

## The original analysis (2026-08-30)

Measured on `main` @ b417d2a: **123 test files, 717 tests, all green**, plus 31
Playwright tests across 2 spec files. 90.61 % lines, 87.56 % branches, 79.89 %
functions over 8,972 statements.

That headline number was healthy, and the suite behind it better than most: pure
logic tested hard (all seven `src/astro` modules ≥ 97 %, `src/craft` at 100 %,
the spot data mechanically validated), a consistent `somethingWith(deps)` seam so
effects are drivable without mocking the world, and a WebKit gate that is a good
cheap proxy for the iOS wrapper.

The gaps were not spread evenly across that missing 9 %. They clustered in three
places, all of them expensive to regress silently: **the server, the sync engine,
and the authorization layer.**

## The ranked list

### 1. `worker/index.ts` — 482 lines, 0 % covered, and not typechecked either

The single largest hole in the repo: 330 uncovered statements, more than the next
five files combined. Nothing imports it from a test, and `tsconfig.json` has
`"include": ["src", "tests"]`, so `tsc -b --noEmit` in `npm run build` never looks
at it. The Worker is currently defended by neither tests nor types.

Its *helpers* are all at or near 100 % — `vapid`, `svix`, `apns`, `forward-mail`,
`response-email`, `alert-rules`, `list-og`, `best-days`. What is untested is the
**composition**: which helper gets called, in what order, with what guard in front
of it. That is exactly where the security-relevant decisions live:

- `/api/inbound-mail` refuses everything unless `verifySvixSignature` passes. If
  that gate ever inverts, we are an open relay wearing our own return address —
  and the comment in the file says as much.
- `get_owner_email` is called with `SUPABASE_HOOK_SECRET` so that holding a
  shortlist link never leaks the photographer's address.
- `UUID_RE` validation on `/l/:id` and on the response hook's `list_id`.
- `MAX_WATCHED = 20` cap and the `https:// | apns://` endpoint-scheme check in
  `/subscribe`.
- Hand-rolled `esc()` HTML escaping in the feedback and report emails — tester
  text and report notes go straight into an email body.
- `runDaily()`'s dedupe (`last:<key>:<spotId>` vs. `dayTag`), the pending-queue
  `slice(-5)`, and the prune-on-`gone` path that deletes dead subscriptions.

None of this needs Miniflare. `export default { fetch }` takes `(request, env)`,
and `AlertsDO` takes `(state, env)` where `state.storage` is four methods — a
`Map`-backed fake is ~20 lines. Stub `globalThis.fetch` for the Supabase RPC and
Resend legs and the whole surface is reachable from plain vitest.

**Proposed:** `tests/unit/worker-routes.test.ts` (route dispatch, the four hooks,
push proxy pass-through, asset fallthrough) and `tests/unit/worker-alerts-do.test.ts`
(subscribe/unsubscribe/pending/status/notify-owner, and `runDaily` over a fake
storage). Realistic target: 0 % → 80 %+. Separately, add `"worker"` to the
tsconfig `include` — that is a one-line change that pays for itself immediately.

### 2. The sign-in → merge → sync pipeline

`src/auth/sync.ts` is at **20 %**; `initAuth` and `signOut` in `useAuth.ts` are
uncovered (31 uncovered statements); `src/auth/supabase.ts` is at **39 %**. None of
the three is imported by any test.

`sync-merge.ts` — the pure part — is at 100 % with six well-chosen cases. But the
thing that *calls* it is untested end to end: pull the account row → merge →
`useStore.setState` → `applyTheme` → push, then debounce-push on every store
change, then `stopSync()` on sign-out. Nothing proves that:

- `pullAndMerge` early-returns on error and leaves local state alone (offline or
  missing table — the comment says "stay local, retry next launch");
- the merged result is actually pushed back, not just applied locally;
- `startSync` debounces rather than writing on every keystroke in a spot note;
- `stopSync` clears both the timer and the store subscription — a leaked
  subscription here means we keep pushing a signed-out user's state;
- `initAuth`'s `onAuthStateChange` wires sign-in to `pullAndMerge` + `startSync`
  and sign-out to `stopSync`.

A bug anywhere in that chain silently loses a user's saved spots and notes across
devices. It is the worst failure this app has, it is invisible to CI today, and
the fix is a fake Supabase client plus `vi.useFakeTimers()`.

**Proposed:** `tests/unit/auth-sync-engine.test.ts` and
`tests/unit/auth-init.test.ts`.

### 3. Row-level security and the definer functions

`supabase/schema.sql` is 24 KB carrying **14 RLS policies** and a set of
`security definer` functions (`get_shortlist`, `get_list_owner`, `get_owner_email`,
`city_vote_totals`, `report_photo`, `block_photo_owner`, `spot_community_photos`)
plus the moderation auto-hide trigger. There is **no automated test of any of it.**

The schema itself records how it was verified:

> Integration-tested 2026-07-28 w/ rollback, 17 assertions: owner refused,
> duplicate report does not tip the threshold, 2nd distinct reporter hides, …

Seventeen good assertions — written down as a SQL comment. That is a snapshot of
one afternoon, not a regression test. RLS is the app's entire authorization
boundary: the difference between "your saved spots" and "everyone's saved spots"
is one policy. And the auto-hide rule is what makes our "timely responses"
commitment true.

**Proposed:** encode those 17 assertions as an executable suite (pgTAP, or a plain
node script driving anon/authenticated/second-user clients against a Supabase
branch DB) and run it as its own CI job gated on changes to `supabase/**`. Heavier
than the other items here — but it is the only item on this list where the failure
mode is a data breach rather than a broken screen.

### 4. `MapView.tsx` — 116 lines, 0 %, mocked out of every test that would reach it

`tests/unit/explore-screen.test.tsx` line 10 does `vi.mock('.../MapView')`, which is
the right call for testing Explore — but it means Explore's map lens has no test at
all. Untested: pin rebuild when the filtered set or home changes, the PhotoPills
sun-line drawing, the floating `SpotCard` on selection, dismiss-on-bare-map-tap,
and the unmount cleanup that calls `map.remove()` (leak that and every visit to
`/#/explore?view=map` leaves a live Leaflet instance behind).

The e2e `map pin popup` test is not a backstop — see §8; it swallows its own click
error and asserts nothing.

**Proposed:** extract the marker-building and sun-line geometry out of the
`useEffect` bodies into pure functions and unit-test those (the drawing calls stay
untested, which is fine), plus one real assertion in the WebKit gate that pins
render and a tap opens the card.

### 5. Weather payload robustness — 21 uncovered branches, the most in the repo

`parseWeather` in `src/weather/open-meteo.ts` is written defensively throughout —
`fin(x, fallback)`, `?? []`, `hourMs()` accepting both unixtime and ISO, a
nearest-hour search that tolerates an empty `time` array. Only the happy shape is
tested. Every planning surface in the app reads from this function, and Open-Meteo
partial responses are a real thing (the WebKit gate itself stubs it with
`{hourly:{}, daily:{}}`).

**Proposed:** a table test over malformed payloads — no `current`, no `hourly`,
empty `hourly.time`, non-numeric values, absent `daily`, ISO strings instead of
unixtime. Pure, fast, and it converts the largest branch gap in the codebase.

### 6. The field-failure paths on device capabilities

These are all small, all cheap because the `*With(deps)` seam already exists, and
all describe what happens to a user standing at a trailhead:

| File | Uncovered | What is untested |
|---|---|---|
| `src/geo/position.ts` | 35, 51–54 | the web `getCurrentPosition` **error** callback (permission-denied vs. generic wording), and the non-permission native error |
| `src/spots/capture.ts` | 76–94 | camera cancel / permission-denied / generic-failure branches of `capturePhotoWith` |
| `src/spots/compress.ts` | 26–39, 41–42 (57 %) | the whole `compressImage` body — quality ladder, the "never make things worse" guard, the undecodable-HEIC passthrough |
| `src/weather/tides.ts` | 30–41 (63 %) | `fetchMarineTides` — which already takes an injectable `fetchImpl` and still has no test |

`fetchMarineTides` is the tell: the seam was built for testability and then not
used. Ten lines of test each.

### 7. Screens are render-tested but not interaction-tested

Function coverage (79.9 %) trails line coverage (90.6 %) by eleven points, and the
whole gap is event handlers that are defined, rendered, and never fired:

| Screen | Functions covered | Uncovered fns |
|---|---|---|
| `HuntDetailScreen.tsx` | 37.5 % | 10 |
| `ExploreScreen.tsx` | 52.6 % | 9 |
| `SpotDetailScreen.tsx` | 40.0 % | 6 |
| `SettingsScreen.tsx` | 53.8 % | 6 |
| `YouScreen.tsx` | 60.0 % | 6 |
| `HuntsHubScreen.tsx` | 37.5 % | 5 |
| `PlanScreen.tsx` | 33.3 % | 4 |

The existing screen tests assert on what renders; they mostly stop before the tap.
Worth one `user-event` test per primary action on each of these — the hunt
start/advance/complete path in particular, which is a multi-step state machine at
37.5 % function coverage.

### 8. Small but telling: `fmtTime`'s fallback is dead code

`src/util/format.ts` is at 58.8 % branch coverage with lines 6–8 and 12–13
uncovered — the entire local-time body of `fmtTime` after the `if (tz) return
fmtClock(d, tz)` early return. All 18 call sites in `src/` pass
`tz`. So that branch is not under-tested, it is unreachable in production.

Either make `tz` a required parameter and delete the fallback, or keep it and test
it. Right now it is a code path nobody has run since it was written.

---

## Tooling and process gaps

These are cheaper than any of the above and several of them are why the gaps
persisted.

**`npm run test:cov` does not run from a clean clone.** The script exists but
`@vitest/coverage-v8` is not in `devDependencies` — producing the numbers at the
top of this document required installing it by hand. Add it.

**No coverage thresholds.** Nothing stops the number sliding. Once the provider is
declared, add thresholds at roughly today's level (lines 90, branches 87,
functions 80) so coverage can only ratchet up, and add a `coverage.exclude` for the
genuine adapter shims — `main.tsx`, `nativePushDeps()`, `capturePhoto()`, the
`getSupabase` wiring — so the percentage measures logic we could test rather than
three-line Capacitor passthroughs. Those shims are correctly left untested; they
should not be counted as debt.

**`worker/`, `e2e/` and `scripts/` are never typechecked.** `tsconfig.json`
includes only `src` and `tests`, so `npm run build` typechecks neither the Worker
(§1) nor the Playwright specs.

**The Chromium e2e project never runs in CI.** `webview.yml` runs `npm test` and
`npm run test:webview` — the WebKit project only. The Chromium project holds every
screenshot test *and all eight axe accessibility tests*, so a11y regressions
cannot currently fail a build. Promoting the axe half into CI is a few lines of
YAML and it is the highest-value e2e change available.

**`e2e/visual.spec.ts` has 23 tests and one assertion.** The 15 screenshot tests
write PNGs to `e2e/screens/` and assert nothing — there is no `toHaveScreenshot()`
and no committed baseline, so no visual regression can fail them. They are useful
artifacts mislabelled as tests. The one real assertion is `expect.soft` on axe
violations, which by design cannot fail the run either. Two fixes: adopt
`toHaveScreenshot()` with committed baselines (or move the screenshot loop to a
`generate-screens` script and stop calling it a suite), and make the axe assertion
hard once it runs in CI.

---

## Suggested order

1. Add `@vitest/coverage-v8` to devDependencies; add `worker` to the tsconfig
   `include`; run the axe tests in CI. *(An afternoon; unblocks everything else.)*
2. Worker route + Durable Object tests (§1). *Biggest single coverage win, and the
   security guards are the reason.*
3. Sync engine + `initAuth` (§2). *Highest user-visible risk per line of test.*
4. Weather payload table test (§5) and the field-failure paths (§6). *Cheap, and
   they close the two largest remaining branch gaps.*
5. Coverage thresholds + `exclude` list, once 2–4 have moved the number.
6. RLS suite (§3) as its own job. *Bigger lift; schedule it deliberately rather
   than squeezing it in.*
7. Interaction tests per screen (§7) and the MapView extraction (§4), ongoing.

---

## What remains

**§3, the RLS suite, is the one item not done.** It needs a live Postgres —
either a Supabase branch database or a local stack — and neither is reachable
from the environment this work was done in. Nothing about the analysis has
changed: 14 policies and seven `security definer` functions are still verified
only by the 17 assertions recorded as a comment in `supabase/schema.sql`, and it
is still the one gap here whose failure mode is a data breach rather than a
broken screen. It wants its own CI job, gated on `supabase/**`.

Two smaller things were deliberately left alone:

- **`src/main.tsx` and `src/ui/Explore/MapView.tsx` are excluded from the
  coverage number**, with the reasons in `vite.config.ts`. The first is the
  bootstrap; the second is a pure Leaflet binding whose decisions were extracted
  into `Explore/map-model.ts` (100 % covered) and whose remaining `L.*` calls are
  driven by the `map pin popup` test in `e2e/visual.spec.ts`. Neither is testable
  in jsdom in a way that would mean anything.
- **The real-wiring adapter shims** — `nativePushDeps()`, `capturePhoto()`, the
  `getSupabase` wiring — stay in the number and stay untested. They are
  three-line passthroughs to an SDK; a test would assert that a mock was called.
  Their `*With(deps)` twins, which hold every branch worth checking, are covered.

### What changed in the source, not just the tests

Three production changes came out of this, all small:

- `worker/index.ts` had an unused import that `noUnusedLocals` had never seen,
  because the directory was outside the tsconfig `include`. Adding it to the
  include caught this on the first run.
- `src/util/format.ts`: `fmtTime`'s hand-rolled no-timezone branch was
  unreachable — all 18 call sites pass a zone, and `fmtClock` already falls back
  to the device zone identically. The duplicate is deleted rather than tested.
- `src/ui/Explore/map-model.ts` is new: the map lens's geometry and styling
  decisions, extracted from `MapView.tsx` so they can be tested without a
  browser.
