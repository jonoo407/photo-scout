# Vantage — Information Architecture Brief

*Input for the design revamp session (backlog A2). Written 2026-07-06.*
*Goal: restructure navigation so today's overlap is fixed and the growth /
community layer has a designed home — NOT a visual re-skin. The warm
golden-hour language (Fraunces + DM Sans, theme.css tokens) carries over.*

---

## 1. What Vantage is (one breath)

A place-and-craft-first location-scouting app for photographers: where to
shoot, what to make there, and when the light/access is right. iPhone-form
PWA, live at shootvantage.com, two cities (Tampa Bay 30 spots, Philadelphia
45), accounts optional today (Supabase magic link), fully usable offline-ish
in the field.

## 2. Current surface inventory (what exists, honestly)

**Tab bar (5): Today · Browse · Map · Plan · Saved** — plus off-tab screens.

| Surface | Route | What's on it | Its job(s) |
|---|---|---|---|
| Today | `/` | First-run 3-step intro; Next Up hero (best spot for the light right now); weather / sunset-score / moon tiles; conditions alert banner | The daily pulse — "should I go out now?" |
| Browse | `/browse` | Search, category/filter chips, spot cards (photo, why-line, open state, drive), Suggest-a-spot entry | Find a spot deliberately |
| Map | `/map` | Leaflet map, category pins, popups, tap-for-sun-lines (sunrise/sunset bearings) | Find a spot spatially |
| Plan | `/plan` | Today/Tomorrow toggle; **Smart-build CTA**; **Saved plans list**; **sun/moon times table**; **spots-by-light buckets** | FOUR jobs: act, store, reference, alt-browse |
| Day | `/day` | The built itinerary: stops w/ drive legs, weather chips, swap sheets (rich cards), Save/Share plan; pinned mode for shared links | Execute an outing |
| Saved | `/saved` | Want-to-go list; Been-there list + per-city progress bars; **client shortlist builder**; **Client lists + responses (NEW pills)** | My spots + my client workflow |
| Spot detail | `/spot/:id` | Hero carousel (+EXIF specs), facts, light windows, compass-to-the-light, Best Days, sun-alignment dates, Milky Way (dark-sky spots), craft guide, signature-shot checklist, **Your shots (uploads)**, **My notes (private)**, logistics, want/been | Everything about one place |
| Client list | `/list`, `/l/<id>` | Chrome-free page a CLIENT opens: options, notes, pick + respond — no account | Pro→client hand-off (must stay account-free) |
| Suggest | `/suggest` | Name/where/why/access form → curation inbox | Community intake v0 |
| Settings | `/settings` | City picker, home base, maps app, units, theme, Account (magic link), Conditions alerts toggle | Config |

## 3. The diagnosis (why a rethink now)

1. **Plan has no single job.** Reference table + action button + saved-plans
   storage + a browse-alternative coexist. Users feel it as "strange."
2. **"My stuff" is split by accident.** Saved spots + client lists live on
   Saved; saved plans live on Plan; your shots + notes live inside spot
   pages. Three storage surfaces, no identity.
3. **Zero room for what's coming.** No profile/You space (badges, points,
   titles, hunts, feedback). No community space (discussions, critiques,
   scoreboard, ambassadors). Five slots, all taken, none expandable.

## 4. Space requirements from the open backlog

| Feature (backlog) | Needs |
|---|---|
| Auth-gate + guest accounts (B3) | A login/landing screen; signed-in identity everywhere; client links stay account-FREE |
| Ambassadors (B10) | A per-city block (photo, blurb, social link); ambassador icon on their top-5 spot cards |
| Points & badges (B11) | A profile surface; badge medallions + tier names; points feed/reasons |
| Next-city scoreboard (B12) | A fun standalone surface + entry points (city picker, Browse empty-search) |
| Photo critique (B13) | Submission flow; critique card (3-4 category scores + text); thread view; aggregates |
| Photo hunts (B14) | Hunt list per city; hunt detail (5 stops, completion state); proof-upload moment; completion celebration |
| City titles (B15) | Standings per city ("Mayor" ladder); profile placement; distinct from ambassador |
| Feedback (#14) | Settings row + a monthly nudge card |
| Community discussions (B8) | Per-spot threads; a community home; moderation affordances |
| Pet-friendly (B16) | One fact chip + one filter chip (no IA impact) |

## 5. Strawman IA (react to this, don't obey it)

**Today · Explore · Plan · You · Community**

| New tab | Absorbs | Notes |
|---|---|---|
| **Today** | Today + the sun/moon **times table** from Plan | Reference data is daily-contextual; Today is its natural home (collapsible section) |
| **Explore** | Browse + **Map as a view toggle** (list ⇄ map) | Same task, two lenses; frees a tab slot. Spots-by-light buckets become an Explore filter/sort, killing Plan's alt-browse |
| **Plan** | Smart-build + Day view + **saved plans** + shared-plan landing | One job: outings. Nothing else |
| **You** | Saved spots + progress, **client lists**, your shots gallery, badges/points/titles, hunts, feedback entry, Settings entry | The identity space; where the growth layer lives. (Client lists could argue for Plan — decide in session) |
| **Community** | Discussions, critiques, city scoreboard, ambassador intro | Ships with B8+; until then the slot can be hidden or hold the scoreboard early |

Off-tab (unchanged): Spot detail, client `/l/` pages, Suggest, Day.

## 6. Decisions to make IN the design session

1. Map inside Explore as a toggle — or does map deserve its own tab still?
2. Where do **client lists** live — You (my stuff) or Plan (my work)? Pro-workflow prominence is a brand differentiator.
3. Does **Settings** fold into You (common pattern) or stay reachable from Today's corner?
4. Community tab naming + when it appears (hide until it has content, or seed it with the scoreboard from day one?)
5. The **login/landing screen** (B3): full gate vs. soft gate; where "continue as guest" sits; how the client-link exception is communicated.
6. Badge/medallion art direction + tier names (feeds B11/B14/B15) — the pure-art bucket.
7. Does Next Up stay the Today hero once hunts/community also want attention? (My vote: yes, always.)
8. Onboarding (3 steps today) — does it grow a "create account" step when B3 lands?

## 7. Constraints for whatever comes back

- **iPhone-form factor first** (430pt-ish), hash routing (`#/route`), PWA.
- Keep old routes redirecting (deep links + client links in the wild are sacred: `/l/<id>`, `#/list`, `#/day?date=…&stops=…`, `#/spot/:id`).
- Tokens live in `src/styles/theme.css`; components in `src/styles/app.css` — deliverables land best as: IA decisions + new-surface mockups + tokens deltas + art assets. Code stays the source of truth; I rebuild navigation and translate visuals into the existing system.
- 404 unit tests mostly follow components, not routes — moves are cheap, rewrites are not.
- Existing component inventory to reuse: SpotCard (photo/why-line/badge), chips (toggle/action), pills, fact chips, cards/rows, progress bars, sheets, hero carousel.

## 8. After the session

I take back: the chosen tab model, mockups for You/Community/login surfaces,
badge art, token tweaks. Then: navigation restructure behind tests →
taste-agent verification loop → growth layer (B3 → B10-B15) built into its
designed home.
