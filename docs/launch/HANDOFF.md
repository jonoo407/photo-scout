# Vantage (photo-scout) launch handoff

**For:** whichever agent picks this up next (this handoff was written to be self-contained for an agent working from this repository only, with no access to any external notes store).
**As of:** 2026-09-24 (evening update). **Repo:** `jonoo407/photo-scout`. **Live at:** shootvantage.com.

## Standing rule: agents do all merges

**The owner always wants the agent to do the merges.** Don't hand the owner a list of PRs to click through, and don't stop at "ready for review" waiting for them. When a PR is green and its deploy prerequisites are done, merge it yourself (merge commit unless the repo's history says otherwise), wait for the Cloudflare deploy, verify production, then move on. The same rule is in [`/CLAUDE.md`](../../CLAUDE.md) so every Claude Code session picks it up.

The owner is still needed only for things an agent physically can't do: providing credentials, testing on a real iPhone, and typing into App Store Connect.

## One-paragraph status

**All six launch PRs are merged and live on shootvantage.com**, and every production check in [`owner-actions.md`](./owner-actions.md) step 7 passed except the browser-level GPS check, which is covered by unit tests instead (details below). The backend prep (region check, webhook secret, migration, cascade check, `delete-account` function) was done first. What's left: start the TestFlight build (a PR bumping `package.json` to 0.1.7 is the route, see "TestFlight" below), then the owner's real-iPhone check and App Store Connect fields.

## What shipped (merged 2026-09-24, in this order, merge commits)

| Pos | PR | What it does | Merge commit |
|---|---|---|---|
| 1 | [#6 Worker security](https://github.com/jonoo407/photo-scout/pull/6) | `/api/push/*` allowlist, JWT-verified `/subscribe`, `SUPABASE_HOOK_SECRET` on DB webhooks, rate limits | `9bd501d` |
| 2 | [#5 Account deletion](https://github.com/jonoo407/photo-scout/pull/5) | Settings → Account → Delete account, server-side purge via the `delete-account` Edge Function | `f584d43` |
| 3 | [#7 EXIF/GPS stripping + `/l/` fix](https://github.com/jonoo407/photo-scout/pull/7) | Scrubs metadata from every upload; service worker no longer hijacks `/l/<uuid>` | `7b4e75e` |
| 4 | [#4 Privacy, terms, support](https://github.com/jonoo407/photo-scout/pull/4) | Standalone `/privacy`, `/terms`, `/support`, `robots.txt`, `sitemap.xml` | `76970ad` |
| 5 | [#3 iOS push fix](https://github.com/jonoo407/photo-scout/pull/3) | APNs callbacks forwarded to the push plugin; clearer failures; foreground alerts show | `a9e4173` |
| 6 | [#8 Guest browsing](https://github.com/jonoo407/photo-scout/pull/8) | Sign-in wall removed; sign-in asked for only at save/alert/upload/rate/vote/hunt-join/shortlist-create | `07b3247` |

Each PR's own description has the full technical detail.

## Backend prep that was done (before merging #6)

- **Supabase region confirmed `us-east-1`** from the Management API (`GET /v1/projects/gxxjxfwxufqqxcyrdibh`), so the privacy page's "AWS US East (Northern Virginia)" is correct.
- **`internal.config.worker_hook_secret`** exists (48 characters). Its value was written into the Worker secret `SUPABASE_HOOK_SECRET` without being printed.
- **Migration `20260924000000_webhook_shared_secret.sql` applied** through the Management API's migrations endpoint (recorded as `webhook_shared_secret`). All three triggers (`notify_shortlist_response`, `feedback_notify`, `photo_report_notify`) send the header.
- **Cascade check passed:** all 24 foreign keys into `auth.users` are `c` or `n`.
- **`delete-account` Edge Function deployed**, `verify_jwt: true`, status `ACTIVE`. An unauthenticated call returns 401.

## Production verification (after all six merged)

- `POST /api/push/notify-owner` and `/api/push/cron` → **404**. `GET /api/push/vapid` → 200 (the public route still works).
- `POST /api/feedback-hook` with no secret → **401**; with the database secret and an empty body → **400 "no message"**. That proves the Worker and database secrets match.
- `/privacy`, `/terms`, `/support` → 200 real pages, no TODOs. `/robots.txt`, `/sitemap.xml` → 200.
- **Account deletion, end to end on a throwaway account:** signed up, uploaded a photo to `spot-photos`, inserted its `user_photos` row, called `POST /api/account/delete` with the user's token → `{"ok":true,"files":1,...}`. Afterwards the auth user, the storage object and the row were all gone, and the public URL stopped serving. Both throwaway accounts (`vantage-e2e-…@shootvantage.com`) were deleted through that same path; none remain.
- **Guest browsing:** a signed-out browser opens a spot page directly, with "Sign in to add your shots" in place of the upload button.
- **GPS stripping:** not checked in a live browser. The Claude Code cloud sandbox's proxy makes headless Chromium fail intermittently (`ERR_TOO_MANY_RETRIES`) against the live site. Instead, the full suite (1,243 tests, including `tests/unit/strip-metadata.test.ts` and `tests/unit/compress.test.ts`) passed on the production commit `07b3247`. If you have a working browser, upload a GPS-tagged JPEG and check the stored file has no EXIF GPS IFD.

## Things that went wrong, and what to do if they recur

- **Workers Builds failed once, on the #5 merge commit (`f584d43`), with no log visible to the API token.** The same commit built cleanly locally (`npm run build` + `wrangler deploy --dry-run`), so it was deployed by hand with `npx wrangler deploy`. The next four merges built normally. If a build fails again: reproduce locally first; if it's clean, `wrangler deploy` from that exact commit.
- **The Claude Code cloud git proxy refuses tag pushes** (`git push origin v0.1.7` → "remote end hung up"). Only the session's own branch can be pushed.

## TestFlight

`ios-release.yml` runs on `v*` tags **or** manual dispatch. On a tag, the version comes from the tag; on manual dispatch it comes from `package.json`. `package.json` said `0.1.0` while TestFlight was already on 0.1.6, so a manual run would have gone backwards. The PR carrying this handoff bumps it to **0.1.7**. Once that's merged, run the workflow (`workflow_dispatch`, publish on) on `main`, or push a `v0.1.7` tag from somewhere that allows it. Keep `package.json`'s version in step with the tags from now on, because Settings shows it inside the app.

## What the owner still has to do

1. **Real-iPhone TestFlight check** once the 0.1.7 build lands ([`owner-actions.md`](./owner-actions.md) step 8, about 10 minutes).
2. **App Store Connect fields** (step 9): Privacy Policy URL `https://shootvantage.com/privacy`, Support URL `https://shootvantage.com/support`, the App Review phone number (never write it in this repo), a demo account (an agent can create one), and the note that browsing needs no sign-in.
3. **Rotate the Supabase and Cloudflare tokens** used for this rollout, and revoke the R2 access key that was shared alongside them (nothing here uses it).

## What the next agent should do next

1. Merge this handoff PR once it's green, then start the iOS release (see "TestFlight").
2. When the owner reports the iPhone check, fix anything that failed.
3. Beyond launch: [`roadmap.md`](./roadmap.md) has the rest of the plan. H5–H13, G2–G8 and Phase 2 onward are still open, and [`app-audit.md`](./app-audit.md) §8 sizes each remaining slice as roughly one PR.

## Key decisions already made (don't re-litigate these)

- **Guest browsing replaces the 2026-09-14 sign-in wall** (shipped in #8). The sign-in wall was an App Store 5.1.1(v) risk and killed sharing, SEO and first-session activation (`app-audit.md` §5, `market-and-launch.md` §4.1).
- **Link sharing stays open, permanently.** `#/spot/…`, `#/day/…` and `/l/<uuid>` links are never gated. Creating a *new* client shortlist needs an account; viewing one never does.
- **In-app account deletion removes every photo the user uploaded, including well-rated community ones.** Deletes done another way (dashboard, raw SQL) still run the old anonymizing trigger, so **use the `delete-account` path for emailed deletion requests, never the dashboard.**
- **HEIC from Chrome/Firefox/Edge is refused**, not uploaded raw, because those browsers can't decode it to strip GPS. Safari and the iOS app are unaffected.

## Owner preferences (how to work with this owner)

- **Agents do all merges** (see the standing rule at the top).
- **The owner wants to do as little as possible.** Handle everything that doesn't strictly need their hands, credentials or judgment.
- **Anything the owner must do personally needs detailed, current, verified, step-by-step instructions**: exact button names, expected output, what to do if it doesn't match.
- **One consolidated message, not per-PR chatter.**
- **Default to the documented recommendation** instead of blocking on a decision the owner can veto later. Say what you did and why.
- **Don't put the owner's phone number in the repo.**

## Other docs in this folder

- [`roadmap.md`](./roadmap.md): the full launch roadmap (Phase 0 through Phase 5).
- [`owner-actions.md`](./owner-actions.md): the step-by-step checklist; steps 1–7 are now done, 8–9 are the owner's.
- [`app-audit.md`](./app-audit.md): the original readiness audit.
- [`market-and-launch.md`](./market-and-launch.md): competitive research and the go-to-market plan.
