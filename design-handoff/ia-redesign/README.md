# Handoff: Vantage Navigation & IA Redesign

## Overview
Full redesign of Vantage's navigation and screens per `guidelines/docs/IA_BRIEF.md`: a new 5-tab IA (Today · Explore · Plan · You · Community), a photography-craft leveling system (Apprentice → Master), photo hunts, referrals, spot discussions with moderation, and an account-forward soft-gate login. Approved direction: option **1a** (5-tab strawman) plus all turn 2–4 revisions.

## About the Design Files
The files in this bundle are **design references created in HTML** — hi-fi mockups showing intended look and behavior, not production code to copy directly. The task is to **recreate these designs in the Vantage (photo-scout) codebase** using its existing React components, tokens, and class vocabulary. Everything is already styled with the app's real CSS custom properties (`var(--*)`) and classes (`screen`, `card`, `pill`, `chip`, `cta`, `linkrow`, `sheet`, `facts`, `stats`, `progressbar`, …) from `tokens/app.css` / `theme.css` / `base.css` — so most styling maps 1:1 to what already ships. Real DS components used in the mocks: `SpotHero`, `BestDays`, `SpotNotes` (mounted from the published bundle), plus `DSProvider`.

## Fidelity
**High-fidelity.** Colors, type, spacing, and copy are final and use the codebase's own tokens. Recreate pixel-perfectly with existing components; only the mini-medallion rings and new screens are net-new UI.

## Navigation (the core change)
Old tabs: Today / Browse / Map / Plan / Saved. New bottom tab bar, 5 items:
1. **Today** — unchanged hero-first dashboard; gains the sun/moon times table from Plan as a collapsible card; feedback-nudge alerts.
2. **Explore** — merges Browse + Map behind a list ⇄ map toggle (segmented control at top). Old `#/map` routes redirect here. Category chip row gains `Pet-friendly`; a second chip row holds Plan's spots-by-light buckets. Suggest-a-spot entry stays here.
3. **Plan** — narrowed to one job: smart-build + Day view + saved plans + share.
4. **You** — absorbs Saved. Profile header (avatar, mayor-race pill), current-level medallion card (tap → ladder sheet), stats strip (Saved / Been there / Shots), client work section with response-NEW dot on the tab icon, referral card, photo-hunt rows, Your shots / Saved spots / Settings rows. Settings folds in here (screen itself unchanged).
5. **Community** — city scoreboard (seeded day one), spot discussion threads, critique feed. Every name shows its craft medallion.

## Screens / Views
All screens are 430px iPhone-form frames inside `Vantage IA Redesign.dc.html`, each labeled with a visible id badge. Key ids:

- **1a** — IA map / tab strawman (picked). 1d Today, 1e Explore list, 1f Explore map, 1g Plan, 1h You (full), 1j Community scoreboard + ambassadors, 1k threads/critiques, 1l→2e login, 1m onboarding step 4 (optional account).
- **2a** — You with single current-medallion card: 56px medallion (Roman numeral), name + pts, progress bar, "260 pts to Artisan", chevron → ladder.
- **2b** — Craft ladder bottom sheet. Five tiers with escalating medallion treatments:
  - I Apprentice: 1.5px dashed `--line-strong` ring, `--surface-2` fill
  - II Journeyman: solid ring + inset double ring, `--surface` fill
  - III Craftsman: `--amber` ring + offset halo (`box-shadow: 0 0 0 2.5px var(--bg), 0 0 0 3.5px var(--amber)`), `--maybe-bg` fill
  - IV Artisan: terracotta tick ring (`repeating-conic-gradient(var(--terracotta) 0 5deg, transparent 5deg 26deg)`) as a 3px padded wrapper
  - V Master: gold conic-gradient wrapper (`conic-gradient(from 40deg, var(--gold), var(--amber), var(--terracotta), var(--gold))`) + warm glow shadow
  Each row: threshold pts, how to reach, one perk (II: early access to new hunts; III: ×2 scoreboard vote; IV: ambassador eligibility + hunt creation rights & profile flair; V: reserved). Current tier row highlighted `--maybe-bg`. Footer: points-economy fact chips.
- **2c** — Photo Hunts hub: active hunt card (amber border, progress, Continue CTA), open hunts with Join chips, completed list, discovery note (surfaces: You rows, Community cards, spot-page banners).
- **2d** — Hunt detail: per-stop rows (done = thumbnail + date + pts + check), next stop card with "Submit a shot" CTA + 150 m geo rule, final stop locked until previous done. +25/stop, +100 finish.
- **2e** — Login: hero photo, "Know where the light is.", "Accounts are free — two taps with Google." Continue with Google (functional), Sign in with Apple (disabled, dashed, "coming soon" pill), email magic link, "AN ACCOUNT KEEPS" benefits list, small underlined "Continue without an account". Browsing stays ungated; gates: save, been-there, join hunt, post/critique, referral.
- **2f** — Spot detail (full scroll, Bayshore): SpotHero carousel → title + golden-hour pill + facts (incl. "6 discussions" chip) → Saved/Been-there → compass-to-the-light + Directions chips → hunt-stop banner → THE LIGHT (strategy + light-window chips) → SIGNATURE SHOTS (checklist w/ shot-date or "Not shot yet") → WHAT TO SHOOT → COMPOSITION & GEAR → if-cloudy alert → SUN & SKY EVENTS (alignment dates; MilkyWay card only on dark-sky spots) → BEST DAYS (`BestDays`) → YOUR SHOTS (grid + add) → FIELD NOTES (`SpotNotes`, marked private) → GOOD TO KNOW → PAIRS WELL WITH → DISCUSSION (threads + ask input + all-threads link).
- **3a** — coverage-audit table (old feature → new home) — reference doc, not a screen.
- **3b** — Thread view: question card, replies with medallions, ambassador terracotta dot, "Marked helpful by <author>" state (`--go-bg` row), hidden-flagged reply row ("flagged by 3 members, under review" + Show), long-press sheet: Mark helpful / Flag reply / Mute this member.
- **4a** — Hunt-complete sheet: check medallion, points tally card (+125 stops / +100 bonus / new total), progress bar to next tier, referral card "One friend gets you there" (+200 = the remaining gap), Share invite CTA, "Back to hunts".
- **4b** — Guest-join sheet: blurred hub behind scrim, "Save your progress first", Google + email, "Not now". Reuse this sheet pattern for all five guest gates.

## Interactions & Behavior
- Tab bar: active = `--terracotta` icon+label; NEW-response dot on You.
- Medallion card tap → 2b sheet; sheet uses `sheet-backdrop`/`sheet`.
- Hunt Join (guest) → inline 4b sheet, never full-screen login bounce.
- Hunt finish → 4a celebration sheet with referral ask.
- Reply long-press → moderation sheet (3b). Thread author can Mark helpful (one per thread). 3+ flags auto-hides pending review.
- Explore list ⇄ map segmented toggle persists per session; map pin tap → spot popup → spot detail.
- Referral: +200 pts to referrer on friend signup; card in You (2a) and post-hunt (4a).

## State Management
- `user`: points, tier (derived from thresholds 0/250/1000/2500/6000), shots, saved, been-there, clients, activeHunts.
- `hunt`: stops[] with done/shot/date, geo-verify on submit (≤150 m).
- `thread`: replies[], helpfulReplyId, flags count (≥3 → hidden).
- Guest mode: full browse; gated actions open the 4b sheet.

## Design Tokens
All from `tokens/theme.css` — no new tokens. Used throughout: `--bg --surface --surface-2 --ink --ink-2 --ink-3 --line --line-strong --terracotta --terracotta-soft --amber --gold --go-bg/--go-ink --maybe-bg/--maybe-ink --info-bg/--info-ink --radius --radius-sm --radius-pill --font-serif --font-sans`. Type: Fraunces for headings/medallion numerals, DM Sans body. Mini-medallions next to names: 14–16px circles, same tier treatments as 2b at reduced scale.

## Assets
Photos are Wikimedia Commons placeholders (Tampa landmarks) — replace with the app's real spot photography (`sampleSpots` media). Google "G" and Apple logos are inline SVG. All icons are inline stroke SVGs matching the app's 1.6px stroke style.

## Files
- `Vantage IA Redesign.dc.html` — all mock screens (open in a browser; ids 1a–4b navigable via `#id`)
- `support.js` — runtime required for the HTML file to render (design-tool scaffolding; not for production)
