# Vantage — market research, differentiation, and growth-first launch plan

*Researched 2026-09-24. Prices and ratings are US storefront unless noted; they move, so recheck them before quoting them publicly.*

> See [HANDOFF.md](./HANDOFF.md) for the current status of the six launch PRs that close the guest-browsing blocker (§4 item 1) and other App Store risks this report references.

## TL;DR

1. **The market is split, and nobody combines the pieces.** Sun/moon *calculators* (PhotoPills, Sun Surveyor, Planit, TPE) are one-time purchases of about $10, powerful and hard to learn. *Spot databases* (Locationscout, PIXEO, PhotoHound, Explorest, and new AI apps like Atlas Photo and Lensover) have breadth but put the useful parts behind subscriptions of $10–$100 a year. *Condition alerts* (Cascable Photo Scout, Alpenglow Pro) charge $12–$40 a year just to notify you. Most photographers still build their own workflow from Google Maps/Earth, Instagram, Flickr and PhotoPills. Vantage already does all three jobs (curated spots, light-aware planning, free alerts) in a single, answer-first product. That is the wedge.
2. **The complaints users repeat most are gifts for Vantage:** (a) paywalls and bait-and-switch "free" apps, (b) steep learning curves, (c) outdated or inaccessible spots, (d) sunset forecasts that are right about half the time, (e) paying twice across devices and sync that doesn't work, (f) no local coverage.
3. **Growth-first stance: the core stays free forever with no ads.** Coordinates, navigation, nearby spots, alerts, planning and offline use for your city are never paywalled. Revenue comes later and only from things that don't slow growth: an optional supporter/lifetime tier, a pro client-workflow tier, and labelled tourism-board partner guides.
4. **Two blockers to fix before any launch push:**
   - **Sign-in is required on every tab.** That hurts conversion, and App Store guideline 5.1.1(v) says apps without significant account-based features must let people in without a login. Recommendation: browsing is open, and an account is requested only at save, alerts, upload or share. **Decided and shipped**: [PR #8](https://github.com/jonoo407/photo-scout/pull/8), pending merge — see [HANDOFF.md](./HANDOFF.md).
   - **No crawlable web pages.** The app uses hash routing and has no sitemap or robots.txt, so none of the 75 curated spots can rank in Google. AllTrails gets about 68% of its traffic from organic search. Server-rendered spot pages are the biggest long-term channel. **Still open** (roadmap slice G2).
5. **Only 2 cities and 75 spots versus competitors' 27k–274k.** Win on depth locally, and add an **"Anywhere mode"** (drop a pin anywhere for light windows, a sunset score, sun-alignment dates and alerts) so installs from outside Tampa and Philadelphia (from Product Hunt, App Store search or creators) don't churn on day 1. Expand city by city through the existing city-vote scoreboard.

---

## 1. Product snapshot (from the repo)

Vantage (shootvantage.com) is a place-and-craft-first scouting app answering *"where should I shoot, what should I make there, and when is the light and access right?"* It is a PWA plus a Capacitor iOS app (TestFlight builds are live, App Store submission is pending per `docs/BACKLOG.md` J3).

- **Content:** Tampa Bay (30 spots) and Philadelphia (45). Photos are self-hosted and license-clean. Facts are checked against two sources: open hours, pet rules and access notes come from each site's operating authority.
- **Already shipped:** Today "Next Up" hero; best-days score with an explainer; free server-side conditions alerts (web push and APNs); sun-path lines; sun-behind-subject alignment dates; Milky Way windows; compass to the light; Smart-build day itinerary plus shareable plans; client shortlist (`/l/<id>`, account-free for the client, with per-list social preview cards); community shots with ratings plus moderation; photo hunts with server-minted points; city-vote scoreboard; suggest-a-spot; feedback nudge.
- **Open growth items (backlog):** V5 referral mechanics (a +200-point constant already exists), V6 ambassadors, V7/V8 threads and critiques, V19 offline city download, V20 App Store screenshots.
- **Growth friction found:** an `AuthGate` wraps every tab (HANDOFF "Sign-in required (V4)"); spot pages are hash routes (`#/spot/:id`) with no server-side HTML, no `sitemap.xml` and no `robots.txt`; Google sign-in is web-only. If Google sign-in is ever added in the native app, guideline 4.8 also requires offering an equivalent privacy-preserving option such as Sign in with Apple.

## 2. Competitive landscape

### 2a. The real competitive set

| App | Job | Model / price | Ratings | Strength | Top complaints |
|---|---|---|---|---|---|
| **PhotoPills** | Sun/moon/Milky Way calculator, AR | $10.99 one-time, per platform | iOS 4.7 (1.5K), Play 4.8 (8K) | Depth, AR, huge YouTube academy | "Masterclass in how not to create intuitive UX"; needs YouTube to learn; unlabeled icons; pay twice iOS→Android; no desktop ([App Store reviews](https://apps.apple.com/pl/app/photopills/id596026805?platform=iphone&see-all=reviews), [appsrankings](https://appsrankings.com/app/596026805/photopills), [Space.com](https://www.space.com/photopills-app-review), [Play](https://play.google.com/store/apps/details?hl=en&id=com.photopills.android.photopills)) |
| **Sun Surveyor** | Sun/moon AR, map, Street View | $9.99 one-time | iOS 4.8 (281), Play 4.76 (4.7K) | Clean AR, "photo opportunities" list | Compass/AR accuracy drift ([Play](https://play.google.com/store/apps/details?id=com.ratana.sunsurveyor&hl=en_GB), [site](https://www.sunsurveyor.com/)) |
| **Planit Pro** | Pro planner, VR viewfinder, 3D | $9.99 + 3D sub $5.99/yr + Location Explorer $29.99/yr | iOS 4.8 (1.4K), Play 4.6 | Deepest simulation | Subscription recognition loops; add-ons feel like a bait-and-switch after buying "Pro"; no plan sync across devices; cluttered UI ([App Store](https://apps.apple.com/us/app/planit-pro-photo-planner/id898876435), [AppBrain](https://www.appbrain.com/app/planit-pro-photo-planner/com.yingwen.photographertoolspro), [Play](https://play.google.com/store/apps/details?id=com.yingwen.photographertoolspro&hl=en_US)) |
| **The Photographer's Ephemeris (TPE)** | Map-based light planner | $9.99 mobile one-time; web PRO subscription; Skyfire add-on | — | The original map-first planner; web version | Separate purchases per surface ([pricing](https://photoephemeris.com/en/help/general/mobile-app-purchase-and-pricing-models/), [web PRO](https://photoephemeris.com/en/help/photo-ephemeris-web/photo-ephemeris-web-pro-and-tpe-mobile-apps/)) |
| **Locationscout** | UGC spot database (~274K entries) | Free; Premium €9.99/mo or €59.99/yr (Around Me, navigation) | iOS 4.6 (171), Play ~3.5 (450) | Breadth; strong SEO; beloved solo developer | "Only shows 3 near me then wants premium… Google is free"; outdated spots whose access is gone or overgrown; trial cancellation confusion; login required for coordinates on the web ([Premium](https://www.locationscout.net/premium), [App Store reviews](https://apps.apple.com/us/app/locationscout-photo-spots/id1474484447?platform=iphone&see-all=reviews), [Play](https://play.google.com/store/apps/details?id=app.locationscout.net&hl=en_IE), [AppBrain](https://www.appbrain.com/app/locationscout-photo-spots/app.locationscout.net), [Fstoppers](https://fstoppers.com/reviews/locationscout-could-be-your-photography-best-friend-701268)) |
| **PIXEO** | Vetted spot database (27K–50K) | Free with ads; Pro CAD $9.99/yr | iOS 4.6 (41) | Cheap; "Hero Shot" contest per spot; credit links | Thin spot pages ("be the first to add tips") ([Pro](https://pixeoapp.com/pro), [FAQ](https://pixeoapp.com/faq), [Tampa example](https://pixeoapp.com/location/ballast-point-park/91afc401e175f4f2d2db1d8c2752d949454b99e4)) |
| **PhotoHound** | Curated guides + UGC | Free; Premium €29.99–59.99/yr | iOS 2.1, Play 1.7 | Responsible-photography framing | "Advertised as free… only the sign-up is free"; no trial ([Premium](https://www.photohound.co/premium), [AppRecs](https://apprecs.com/android/co.photohound/photohound)) |
| **Explorest** | Pro-curated "Location Insights" | Subscription $4.99/mo to $75/yr; Pro $150 | iOS 4.4 (1K), Play 2.8 | Closest philosophical rival (curated + photo specs) | Paywall; sparse local coverage ("showing places 300+ miles away… 5th largest US city"); gear-heavy ([App Store](https://apps.apple.com/us/app/explorest-photo-locations/id1227446332), [Play](https://play.google.com/store/apps/details?id=com.explorestmobile&hl=en_US), [AppRank](https://apprank.io/explorest-photo-locations-6332)) |
| **Photo Scout by Cascable** | Condition-watch alerts ("scenes") | 1-week trial, then $24.99–39.99/yr | — | Proactive alerts, sunset vibrancy, widgets | Must pay to keep scenes running ([subscriptions](https://photo-scout.app/help/about-subscriptions), [MacStories](https://www.macstories.net/reviews/photo-scout-an-excellent-photographers-companion-for-iphone-and-ipad/)) |
| **Alpenglow** | Sunrise/sunset quality forecast | Free; Pro $12.49/yr or $24.99 lifetime (web) | 4.5 (10K+), 1.6M downloads | Free tier, field reports, lifetime option | Accuracy varies by region ([site](https://alpenglowapp.com/), [Pro](https://alpenglowapp.com/pro), [own model 2026](https://alpenglowapp.com/blog/alpenglow-model)) |
| **Atlas Photo** (new, 2025) | AI-personalised spot picks + community | Subscription $14.99/mo up to $99.99/yr | — (est. ~$40K/mo revenue) | Aggressive monetisation; showroom and leaderboards | Hard paywall ([App Store](https://apps.apple.com/us/app/atlas-photo-photo-companion/id6751760948), [AppRank](https://apprank.io/atlas-photo-photo-companion-0948)) |
| **Lensover** (new) | TikTok-style spot feed, AR, AI tips | $59.99/yr, 3–7 day trial | — | Uses Wikimedia photos (same as Vantage); AR finder | Hard paywall ([App Store](https://apps.apple.com/tm/app/lensover-photo-spot-finder/id6762550486)) |
| **ShadeMap / Shadowmap** | Building, tree and terrain shadows | Free web; paid tiers | — | True shadow simulation (Vantage's V16 "True Golden Hour" idea) | Not photographer-specific ([ShadeMap](https://shademap.app/help/), [Shadowmap](https://apps.apple.com/us/app/shadowmap-sunlight-shade/id1566789060)) |
| **Google Maps/Earth, Instagram, Flickr** | The default DIY stack | Free | — | Satellite, Street View, Earth's Sunlight slider, historical imagery; Instagram location tags and the 2025 Instagram Map | Scattered; no light logic; no craft guidance ([Reddit 1](https://www.reddit.com/r/photography/comments/y14o60/fellow_landscape_photographers_how_do_you_scout/), [Reddit 2](https://www.reddit.com/r/photography/comments/k7xlqx/how_do_you_go_and_scout_locations_for_future/), [Adorama](https://www.adorama.com/alc/best-digital-tools-for-scouting-locations/), [Google Earth sunlight](https://support.google.com/earth/answer/148094), [Instagram Map](https://about.fb.com/news/2025/08/new-instagram-features-help-you-connect/)) |

**Adjacent context:** Komoot (route planning, used by some outdoor photographers) was bought by Bending Spoons in 2025; about 85% of staff were laid off and paywalls expanded. That sharpened users' distrust of acquired or subscription apps, which favours a free, indie, trustworthy positioning ([DC Rainmaker](https://www.dcrainmaker.com/2025/05/komoot-team-goodbye.html), [paywalls](https://www.dcrainmaker.com/2025/03/komoots-expanded-paywalls-trying-to-make-sense-of-it.html)).

### 2b. How photographers actually scout today

Reddit and industry guides describe the same patchwork: Google Maps satellite and Street View, Google Earth's sunlight and 3D views, Instagram location tags, Flickr's map, local Reddit and Facebook groups, then PhotoPills or TPE for light, Windy or Clear Outside for clouds, and scouting in person ([Reddit](https://www.reddit.com/r/photography/comments/5oivur/how_do_you_do_locationscouting_for_places_youve/), [TechRadar](https://www.techradar.com/computing/websites-apps/i-review-cameras-for-a-living-and-this-app-has-made-me-a-better-photographer)). Portrait photographers in Tampa ask r/tampa for shoot locations and swap tips on Facebook groups. Local blogs warn that places like Curtis Hixon Park have security that removes unpermitted professional shoots ([r/tampa](https://www.reddit.com/r/tampa/comments/18ihhfk/photo_shoot_location_ideas/), [Allie Serrano](https://allieserranoportraits.com/the-best-tampa-photoshoot-locations/)). **Permit and access rules are an unmet need no competitor answers.**

### 2c. Top complaints, and what Vantage should do about each

| Complaint (evidence above) | Vantage response |
|---|---|
| Paywalled essentials: nearby, navigation, coordinates, alerts; "free" bait-and-switch | **Free forever for all of it**, stated in the App Store subtitle and screenshots. The alerts that Cascable charges $25–40/yr for are free. |
| Steep learning curve (PhotoPills, Planit) | An answer-first Today screen ("go here, at 7:42, face 265°"); plain-language score explainer; no tutorial needed. Put it in the marketing copy. |
| Outdated or inaccessible spots (Locationscout) | "Last verified" dates, community "still accessible?" check-ins, facts sourced from the operating authority (already the house standard), and a one-tap "report a change". |
| Sunset forecasts right about 50% of the time ([Reddit PSA](https://www.reddit.com/r/photography/comments/7gg21j/psa_dont_depend_on_websitesservices_like_sunsetwx/), [Peltier](https://www.jmpeltier.com/review-skyfire-sunsetwx-predicting-sunrise-sunset/)) | Show forecast confidence honestly. Add a one-tap post-sunset "how was it?" field report (Alpenglow has proved the pattern) that calibrates the score locally and gives people a daily reason to open the app. |
| Pay twice across platforms; no sync (PhotoPills, Planit) | One free account across web, iOS and Android, synced (already built). |
| No local coverage (Explorest, PIXEO thin pages) | Deep local cities plus "Anywhere mode" light tools for the rest of the world. |
| Overtourism and geotag harm ([On Landscape / Nature First](https://www.onlandscape.co.uk/2024/12/geotagging-gatekeeping-location-sharing/), [LNT 2025](https://lnt.org/wp-content/uploads/2025/11/2025-LNT-Uploading-Trail-Data-Guidelines-1.pdf), [NatGeo](https://www.nationalgeographic.com/travel/article/geotagging-positive-benefits)) | A published responsible-sharing policy: fragile sites get a sensitivity tier (general area only, no index, stewardship notes). This is both a trust point and a press angle. |

## 3. Positioning

**"Find your light. Free."** Vantage is the only photo-scouting app that tells you *where* to go, *what* to shoot there and *when* the light and access will be right, and then pings you when it happens, with no subscription.

- Against PhotoPills: "all the answers, none of the homework."
- Against Locationscout and Explorest: "every spot fully open: coordinates, parking, rules, best light."
- Against Cascable and Alpenglow Pro: "light alerts, free."
- For working pros: "send your client a shortlist they can pick from, with no account needed" (nobody else has this).

Primary segments, in launch order: (1) local hobbyists in Tampa Bay and Philadelphia (landscape, cityscape, sunset); (2) local portrait, wedding and senior photographers (the client-shortlist and permit-rules wedge; every shortlist they send exposes the brand to clients); (3) travelling photographers (Anywhere mode now, more cities later); (4) casual "sunset chasers" and phone photographers (the Today screen and alerts). Explorest reviews note that beginners feel shut out by gear-heavy specs.

## 4. Differentiating features (prioritised)

**Before launch: needed to convert and retain**
1. **Soft sign-in gate.** Today, Explore, Map, spot pages and hunts are all browsable signed out. Ask for an account at the moment it's needed (save, alerts, upload, share list, vote). This reduces App Store guideline 5.1.1(v) risk and lifts install→activation. Local-first data and `pullAndMerge` already support signing in later. **Shipped, pending merge**: [PR #8](https://github.com/jonoo407/photo-scout/pull/8).
2. **Anywhere mode.** Drop a pin or use your location anywhere to get golden and blue hour, a sunset score, sun or moon alignment with a subject bearing, a Milky Way window and alerts. It reuses the keyless suncalc and Open-Meteo engines. Visitors from outside Tampa and Philadelphia get value on day 1 and feed the "bring Vantage to my city" vote.
3. **Crawlable, shareable spot pages.** The Worker server-renders `/spots/<city>/<slug>` (and city or theme hubs) with photos, best light, the next alignment dates, access, permit and pet facts, parking, and JSON-LD (`TouristAttraction`/`Place`, `ImageObject`, `FAQPage`); add `sitemap.xml`, `robots.txt`, canonical URLs and an Apple Smart App Banner. This is the SEO engine and gives rich link previews when a spot is shared.
4. **Freshness and trust layer.** Per-spot "verified <date>" labels, one-tap "still accessible?" and "report a change", and a published responsible-sharing policy with sensitivity tiers.
5. **Share cards.** Social preview images per spot showing tonight's score ("Skyway from Fort De Soto: 86 tonight, 7:42 PM"), plus "I shot here" cards on community uploads that credit the photographer and link back.

**Growth loops: build right after launch**
6. **Referrals (V5)**, rewarding both sides without cash: the inviter gets +200 points and a "Founding Scout" medallion; the invitee unlocks a starter hunt. Record attribution at account creation (already designed).
7. **Brand the client shortlist as a loop.** A tasteful "Planned with Vantage — free for photographers" footer on `/l/<id>`, plus "Are you a photographer? Get it free" for recipients. Optional pro branding (logo, colours) comes later.
8. **City-vote waitlist.** "Bring Vantage to <city>" sharing plus an email capture per city. A city launches when it passes a vote threshold and has a local ambassador; each city launch becomes its own mini-launch event.
9. **Post-sunset field reports** ("was it good?", three taps). They improve the score, build a daily habit and create "N scouts reported a fiery sky at Ballast Point" social proof.
10. **Photo-walk kit.** Hunts packaged as hostable group walks with a shareable page, check-in, a group gallery and a leaderboard. Pitch it to clubs and to Worldwide Photo Walk leaders.
11. **Shareable year-in-light recap.** Sunsets caught, spots visited, top-rated shot; built for Instagram Stories.

**Signature features and moats (later)**
12. **Permit and pro-shoot rules per spot** ("pro shoots need a permit, how to apply, typical fee, security enforces it"), sourced from the operating authority the same way pet rules were. No competitor has this, and it is the killer fact for portrait pros.
13. **iOS home-screen and lock-screen widgets plus a golden-hour Live Activity countdown.** These are native extensions and add work beyond Capacitor. Competitors keep widgets behind their paid tiers.
14. **Android via Play Store (TWA wrapper around the PWA).** Competitors are weak on Android (Explorest 2.8, Locationscout about 3.5).
15. **True Golden Hour shadow engine (V16)** and **"recreate this shot"**, a ghost overlay of the reference photo in the camera at the spot.
16. **Offline city download (V19)** for field use.

Deliberately skip: gear calculators (commodity), AI "composition tips" as a gimmick (Lensover, Atlas), and a TikTok-style feed. They dilute the "answer" positioning.

## 5. Monetisation stance (growth-first)

- **Free forever, no ads, no trials, no paywall on:** spot coordinates, navigation, parking and rules; nearby spots; alerts; day plans; hunts; community; client shortlists (basic); offline use for your home city; Anywhere mode. Say this plainly, because it is the sharpest contrast with every paid competitor. Locationscout's "1-star because it isn't 100% free" reviews show how much this matters to users.
- **Costs to plan for:** Supabase Pro (also needed for leaked-password protection, J5), storage growth from community shots, Worker cron and Durable Object usage, Resend. These are modest at early scale. Don't buy installs: average iOS cost per install is about $5.84 ([Panto/Adjust 2026](https://www.getpanto.ai/blog/mobile-app-retention-statistics)).
- **Later revenue that doesn't slow growth,** in order:
  1. **Supporter tier:** yearly or lifetime (the Alpenglow model: $12.49/yr or $24.99 lifetime, with Family Sharing), cosmetic perks only (badge, app icons, early access to new cities).
  2. **Pro workflow for working photographers:** branded client lists, unlimited lists and notes, client-response inbox, custom share domain, permit tracker. This is B2B-flavoured and never touches consumer value.
  3. **Partner city guides** with tourism boards (Visit St. Pete/Clearwater, Visit Philadelphia), clearly labelled, funding new-city curation.
  4. **Affiliate links** for workshops, gear rental and photo tours in the spot's area.
- Don't copy Atlas or Lensover-style hard paywalls; they are optimised for revenue per install, not reach.

## 6. Launch plan

Phases are gated by exit criteria, not dates. Real external dates are noted where they matter.

### Phase 0: Hardening through a real-user beta
- **TestFlight external beta:** up to 10,000 external testers per app, email invites or a public link with a tester cap and device criteria. The first build of each version needs Beta App Review, and each build expires after 90 days ([Apple](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers), [overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)). Android and desktop testers use the PWA.
- **Waves:**
  - W1, about 50 people: friends plus local clubs, i.e. the Photographic Art Society (Tampa Bay; runs field trips), Tampa Photography Group ([site](https://tampaphotographygroup.com/)) and Philadelphia equivalents.
  - W2, about 300: local subreddits and Facebook photographer groups.
  - W3, about 1,000: a capped public link.
- **Structured weekly "missions":** shoot one alert-flagged spot and file a field report; test a Smart-build day; send a client shortlist to a real client; try Anywhere mode away from home.
- **Instrumentation:** crash and error reporting (add Sentry or similar if it isn't already present), a product analytics event taxonomy (section 7), the in-app feedback form (built), TestFlight screenshot feedback, and a data-correction queue.
- **Exit criteria for public launch:** crash-free sessions ≥99.5%; D7 retention ≥15% among beta testers; ≥60% of new testers reach activation in their first session; spot-correction backlog empty; soft gate and Anywhere mode shipped; App Store screenshots (V20) and custom product pages ready.

### Phase 1: Local launch (Tampa Bay first, Philadelphia second)
- **Photo walks:** Scott Kelby's Worldwide Photo Walk is **Saturday, October 3, 2026**; walks are listed at [worldwidephotowalk.com](https://worldwidephotowalk.com/), and a Tampa Riverwalk walk is on Sept 26 ([CL Tampa](https://community.cltampa.com/event/2026-foto-fotowalk-tampa-bay-21723847)). KelbyOne is a Tampa Bay company. Offer Vantage hunts as walk routes, sponsor prizes or lead a walk. If the Oct 3 timing is too tight, use it for beta recruiting and plan a recurring monthly "Vantage Golden Hour Walk".
- **Local subreddits** (r/tampa, r/StPetersburgFL, r/philadelphia): post useful content, not ads. Example: "I mapped 30 Tampa Bay golden-hour spots with when the sun lines up behind each one". Read each subreddit's self-promotion rules first.
- **Local press and newsletters:** Creative Loafing Tampa, Tampa Bay Times things-to-do, Philadelphia Inquirer and Billy Penn, local TV weather segments ("tonight's sunset score"). The data-journalism hook is "best nights of the year to see the sun set behind X".
- **Portrait-pro outreach:** DM 50 local portrait and wedding photographers with a free client-shortlist offer and the permit-rules feature.

### Phase 2: App Store and national launch
- **ASO**, working within guideline 2.3.7 (no competitor names in metadata):
  - Name (26 characters): `Vantage: Photo Spot Finder`
  - Subtitle (28): `Golden hour & sunset planner`
  - Keywords (97 of 100 characters; don't repeat words already in the name or subtitle): `photography,scout,location,sunrise,blue hour,forecast,tampa,philadelphia,milky way,portrait,astro`
  - Apple indexes only the name, subtitle and keyword field (the description helps web search only, and promotional text doesn't affect ranking) ([AppDrift](https://appdrift.co/blog/app-store-character-limits-complete-reference)).
  - The first screenshot drives most of the install decision. Use it for "Tonight: go here at 7:42 PM" plus "Free. No subscription."
  - **Custom product pages** (up to 70; since July 2025 each can be assigned keywords from the existing keyword field) ([RespectASO](https://respectaso.com/blog/custom-product-pages-app-store-guide-2026/)). Make pages for sunset/landscape, portrait pros (client shortlist), astro/Milky Way, Tampa and Philadelphia, and use them for creator and Reddit links.
  - **In-app events** ([AppDrift](https://appdrift.co/blog/app-store-in-app-events-optimization-guide)): monthly photo hunts, supermoon or eclipse nights, sun-alignment weeks, photo walks.
  - Answer every review in the App Store; the Locationscout developer's personal replies are a visible trust asset. Prompt for ratings only after a success moment (an alert led to a shot, a hunt was completed, a field report was filed).
  - Optionally run a small Apple Search Ads test to find keywords and regions worth pursuing (the AllTrails/ShyftUp playbook: [case](https://www.shyftup.com/success-stories/how-shyftup-helped-alltrails-achieve-119-growth-in-user-acquisition-in-6-months/)).
- **Product Hunt:** launch only after the App Store listing is live and Anywhere mode is in, because Product Hunt visitors are global. Featuring is an editorial decision (useful, novel, high craft, creative; they avoid "monetisation-first" products, which a free app benefits from). Ranking points combine upvotes with genuine comments, click-throughs and shares; never ask for upvotes; launch at 12:01 AM Pacific ([guidelines](https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines), [how it works](https://www.producthunt.com/launch/how-product-hunt-works), [points](https://www.producthunt.com/p/producthunt/how-product-of-the-day-week-month-are-chosen)). Expect backlinks, press and early adopters rather than a large photographer audience.
- **Reddit (national):** r/photography allows promotion only in its weekly *Self-Promotion Sunday* thread and removes market-research posts ([mod reply](https://www.reddit.com/r/photography/comments/1qq42hd/need_an_advice_with_this_new_app/), [community threads](https://www.reddit.com/r/photography/comments/1c5j8om/community_threads_2_electric_boogaloo/)). r/LandscapePhotography bans external links as of its March 2026 rules ([rules](https://www.reddit.com/r/LandscapePhotography/comments/1rq875q/updated_rules_going_forward_update_march_2026/)). r/AskPhotography sends critique requests to r/photocritique. Best play: value posts with no links (a sunset-accuracy study, alignment-date explainers), answer scouting questions, and let your profile carry the link.
- **Creators:** photography micro-creators (10K–100K) charge roughly $325–1,950 per Instagram post, $500–2,550 per YouTube integration, and $150–500 a month for ad whitelisting ([Elev8or](https://www.elev8or.io/creators/creator-rate-report-2026), [BrandsForCreators](https://brandsforcreators.com/find/photography-influencers)).
  - Start with local Tampa and Philadelphia creators as **founding ambassadors (V6)**: credited spots, an ambassador badge, a profile link, early city access. Pay small fees only where engagement is proven.
  - Then 2–3 mid-size landscape or astro YouTubers (a pilot budget of about $1.5–3K).
  - Content format that works: "I let an app pick tonight's sunset spot" challenge videos, before/after alignment shots.
- **Forums and newsletters:** Fstoppers, PetaPixel and DPReview tips, and Nature First (the responsible-sharing angle).

### Phase 3: City expansion engine
- Prioritise cities by vote count and ambassador availability (Florida neighbours first: St. Augustine, Miami, Orlando). Each city launch repeats Phase 1 in miniature.
- The throughput limit is editorial (`docs/SCALING.md`), so scale it with suggest-a-spot, ambassadors and an AI-assisted verification checklist that still enforces the two-source rule.

### SEO for location pages (a continuous channel)
- **Why:** AllTrails gets about 68% of visits from organic search, 79% of it non-branded, powered by templated location pages plus hub, list and park pages; web visitors then install the app ([growth teardown](https://growthloopteardown.substack.com/p/how-alltrails-acquired-55-million), [SammySEO](https://www.sammyseo.com/a-deep-dive-into-the-alltrails-com-seo-strategy/), [RevenueCat](https://www.revenuecat.com/blog/growth/alltrails-product-channel)).
- **Current competition in Vantage's area:** local Tampa photo-spot searches are served by wedding-photographer blogs, Locationscout (coordinates hidden behind login) and thin PIXEO pages ([Locationscout example](https://www.locationscout.net/usa/12149-ben-t-davis-beach)). Fully open pages with live light data can win.
- **Page types:**
  - Spot pages: `/spots/tampa-bay/fort-de-soto-north-beach`.
  - Theme hubs: "best sunset spots in Tampa Bay", "pet-friendly photo spots Philadelphia", "Milky Way near Tampa", "senior portrait locations St. Pete".
  - Time-sensitive pages: "when the sun sets behind the Skyway in 2026", "October supermoon viewpoints".
  - Pages generated from user lists, later.
- **Rules:** server-rendered HTML (not the hash-routed single-page app); a dated "tonight" module; JSON-LD structured data; photo credits; `noindex` for sensitive-tier spots; a Smart App Banner that deep-links into the app.

## 7. Metrics

| Layer | Metric | Target / benchmark |
|---|---|---|
| North star | **Weekly active scouts:** users who, in a week, open a spot and do one of save / plan / navigate / field-report / upload | Grows week over week |
| Activation | First session includes saving a spot, enabling alerts or building a plan | ≥60% of new users |
| Retention | D1 / D7 / D30 | Photo & Video category median 22% / 9% / 4.2%; health & fitness 34 / 19 / 12 ([Digital Applied](https://www.digitalapplied.com/blog/mobile-app-marketing-statistics-2026-install-data), [UXCam](https://uxcam.com/blog/mobile-app-retention-benchmarks/)). Aim for ≥35 / 18 / 10, because alerts create a reason to come back |
| Habit | Alert → open rate; alert → field report; share of users with ≥1 watched spot | Alert open rate ≥25% |
| Virality | Invites and shares per weekly active scout; share-link opens (`/l/`, day plans, spot cards, city votes); open → install; K-factor | Track the loop driven by each surface |
| Acquisition | App Store impressions → page view → install conversion per custom product page; keyword ranks; organic web sessions, indexed pages, web → app install | Improve per custom product page |
| Quality | Crash-free sessions; rating average and count; median time to resolve a spot correction; forecast "was it good?" agreement rate | ≥99.5% crash-free; rating ≥4.7 |
| Supply | Spots per city, verified-within-12-months %, community shots per spot, city votes per candidate city | — |

## 8. Risks

- **Coverage gap:** 75 spots against Locationscout's 274K. Mitigate with Anywhere mode, the city-vote loop, and depth-over-breadth messaging.
- **Forced sign-in:** hurts conversion and invites App Store review friction (5.1.1(v)). Recommend the soft gate. It reverses the 2026-09-14 "sign-in required" decision, so Jon needs to decide. **Decided and shipped**, pending merge (see [HANDOFF.md](./HANDOFF.md)).
- **Geotag backlash** at fragile sites: mitigate with sensitivity tiers and a public policy.
- **Forecast credibility:** don't oversell the score; show confidence and field-report accuracy.
- **Well-funded paywalled copycats** (Atlas at about $40K/month revenue) can outspend on ads. The counter is free, organic SEO and community channels.
- **Hunt anti-spoofing (V12)** matters before any real-world prizes.

## Sources

All sources are linked inline above. Main ones: the App Store and Google Play listings for each competitor; [Locationscout Premium](https://www.locationscout.net/premium); [Cascable Photo Scout subscriptions](https://photo-scout.app/help/about-subscriptions); [Alpenglow Pro](https://alpenglowapp.com/pro); [PhotoHound Premium](https://www.photohound.co/premium); [PIXEO Pro](https://pixeoapp.com/pro); [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/); [TestFlight docs](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers); [Product Hunt featuring guidelines](https://help.producthunt.com/en/articles/9883485-product-hunt-featuring-guidelines); Reddit threads from r/photography and r/tampa; [On Landscape on geotagging](https://www.onlandscape.co.uk/2024/12/geotagging-gatekeeping-location-sharing/); the AllTrails SEO teardowns; 2026 retention benchmarks from Adjust, UXCam and Digital Applied; creator rate reports from Elev8or and BrandsForCreators.
