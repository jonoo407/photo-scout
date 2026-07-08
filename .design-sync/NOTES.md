# design-sync notes — photo-scout (Vantage)

- **App repo, not a DS package**: no library build/dist — converter runs in
  synth-entry mode from `src/` with `componentSrcMap` pinning the 7 reusable
  components. Screens (Today/Browse/Map/Plan/Saved/Settings/Day/ClientList)
  are deliberately NOT components — their look ships via `app.css` + the
  conventions header; Claude Design composes screens from the system.
- **`src/data/spots.ts` uses Vite's `import.meta.glob`** — esbuild can't run
  it. Anything importing the `useRegion`/`data/spots` chain breaks the bundle
  at load. That's why **IntroCard is excluded** (imports useRegionSpots).
  Fixtures instead static-import `src/data/spots/tampa-bay.ts` directly
  (safe: no import.meta) via `.design-sync/preview-support.tsx`.
- **Fonts are runtime Google Fonts** (`<link>` in index.html; no @font-face
  in repo). `preview-styles.css` re-declares the same families via
  `@import url(...)` → expect `[FONT_REMOTE]` (informational, correct).
- **Tokens**: `src/styles/theme.css` (imported by base.css). Component CSS:
  `src/styles/app.css`. cssEntry = `.design-sync/preview-styles.css`
  (fonts + base + app).
- **Router context**: SpotCard (useNavigate), Layout (NavLink/Outlet) need a
  router → `provider.component = "DSProvider"` (MemoryRouter wrapper in
  preview-support.tsx, merged via extraEntries).
- **Zustand store is global (no provider)**, persists to localStorage —
  works headless. `Layout`'s badge + `SpotNotes` read it with defaults.
- **BestDays fetches Open-Meteo in useEffect** but renders fully without a
  forecast (rows say "no forecast yet") — statically renderable by design.
- **MilkyWay renders ONLY for `darkSky: true` spots** → fixture must be
  `fort-de-soto-park`. SunAlignment needs `facing` non-null.
- Purpose of this sync: the user wants Claude Design to **redesign the whole
  app** (IA revamp per `docs/IA_BRIEF.md`, uploaded under guidelines/) — the
  brief inventories every screen; tokens + class vocabulary carry the look.
- **Layout preview**: `.tabbar` is position:fixed — the authored preview wraps
  it in a `transform: translateZ(0)` phone-frame div (containing block for
  fixed) + `cfg.overrides.Layout = {cardMode: single, viewport: 430x180}`.
  Changing `overrides` trips `[CONFIG_STALE]` on preview-rebuild — run the
  full `package-build.mjs` after any override edit.
- **Capture freezes the browser clock** — BestDays screenshots show May 2026
  dates regardless of real date; that's the harness, not a bug.

## Known render warns
- `[FONT_REMOTE] "Fraunces", "DM Sans"` — correct: the app loads them from
  Google Fonts at runtime; the bundle re-declares the same @import.

## Re-sync risks
- `conventions.md` enumerates app.css classes + theme.css tokens by name —
  re-validate against the fresh build every sync (names rot when CSS is
  refactored); the class table was 100% grep-verified on 2026-07-08.
- `.design-sync/ds-entry.ts` + `preview-support.tsx` import app source paths
  directly (`src/ui/*`, `src/data/spots/tampa-bay.ts`) — moves/renames break
  the build loudly at bundle time.
- `preview-support.tsx` throws if fixture spot ids disappear:
  `curtis-hixon-waterfront-park`, `fort-de-soto-park`, `bayshore-boulevard`.
- NEVER add a component whose import chain reaches `src/data/spots.ts`
  (`import.meta.glob` — esbuild-incompatible; that's why IntroCard is out).
- No `buildCmd`: the bundle builds straight from src via `cfg.entry`
  (`.design-sync/ds-entry.ts`); nothing to pre-build on re-sync.
- Preview verification ran on playwright's cached chromium (Windows,
  `%LOCALAPPDATA%\ms-playwright`); repo pins @playwright/test ^1.61.
