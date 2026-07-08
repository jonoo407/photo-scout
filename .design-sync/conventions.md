# Building with Vantage

Vantage is a warm golden-hour photo-scouting app, **iPhone-form first**: the
app frame is a 430px-max column (`#root`), padded screens, fixed bottom tab
bar. Two type voices, automatic: **Fraunces** serif for every `h1/h2/h3`
(base.css sets this — don't override) and **DM Sans** for all body/UI text.
Light (cream) and warm-dark themes switch via `prefers-color-scheme` /
`[data-theme]` — so **never hardcode colors; always use the `var(--*)` tokens**.

## Setup
Components that navigate (`SpotCard`, `Layout`) read react-router context and
**throw without it** — wrap roots in `DSProvider` (a MemoryRouter re-exported
by this system). Use `sampleSpots` (`curtisHixon`, `fortDeSoto`, `bayshore` —
real Tampa Bay spots with real photos) for any `spot` prop; never invent spot
objects by hand.

## Styling idiom — token vars + a small class vocabulary (no utility framework)
Author layout glue with inline styles or plain CSS using tokens; build
recurring UI with these classes (all defined in the shipped stylesheets):

| Family | Classes | Use |
|---|---|---|
| Screen frame | `screen`, `back`, `tabbar` | padded page column; back button; bottom tab bar (use the `Layout` component) |
| Type utilities | `h3`, `eyebrow`, `muted`, `small`, `tertiary` | section heading (serif); overline label; secondary/small/tertiary text |
| Status pills | `pill` + `go` \| `maybe` \| `skip` \| `info` \| `open` \| `closed` | verdict chips: sage go, amber maybe, clay skip |
| Chips | `chip` + `on` (selected), `act` (action) | filter/toggle rows and inline actions |
| Fact chips | `facts` row of `fact` + `good` \| `warn` | hours/fee/drive metadata strips |
| Cards | `card` (+ `list` with `row`, `rowleft`, `row-spread` children), `hero-card` (+ `hero-title`, `hero-sub`), `spotcard` | list cards with divided rows; the Today hero; spot cards (prefer the `SpotCard` component) |
| Buttons | `cta` (primary full-width), `actbtn` + `on-want`/`on-been`, `linkrow` | one `cta` per screen; paired toggle actions; tappable row link |
| Bottom sheet | `sheet-backdrop` > `sheet` (+ `opt` rows) | choosers/swap dialogs |
| Progress | `progresscard`, `progressrow`, `progressbar` > `progressfill`, `progresslabel`, `progresscount` | per-city been-there progress |
| Stats | `stats` row of `stat` (+ `sv` value, `sl` label) | numeric summary strips |
| Misc | `alert`, `wxchip` + `rainy`/`cloudy`, `empty`, `center-note` | conditions banner; weather chips; empty states |

**Color tokens**: surfaces `--bg`, `--surface`, `--surface-2`; text `--ink`,
`--ink-2`, `--ink-3`; hairlines `--line`, `--line-strong` (0.5px borders);
brand accents `--terracotta` (+ `--terracotta-soft`), `--amber`, `--gold`;
status pairs `--go-bg`/`--go-ink`, `--maybe-bg`/`--maybe-ink`,
`--skip-bg`/`--skip-ink`, `--info-bg`/`--info-ink`. Shape: `--radius` (16px
cards), `--radius-sm`, `--radius-pill`. Fonts: `--font-serif`, `--font-sans`.

## Where the truth lives
Read before styling: `tokens/theme.css` (every token, both themes),
`tokens/app.css` (every class above **plus each app screen's real styling** —
search it before inventing anything), `tokens/base.css` (frame + type roots).
`guidelines/docs/IA_BRIEF.md` is the redesign brief: current screen
inventory, IA diagnosis, and the constraints any new design must respect.
Per-component API + usage: each component's `.d.ts` and `.prompt.md`.

## Idiomatic composition
```jsx
<DSProvider>
  <div className="screen">
    <p className="eyebrow">Tonight</p>
    <h3 className="h3">Golden hour picks</h3>
    <SpotCard
      spot={sampleSpots.bayshore}
      badge={{ label: 'Golden hour', kind: 'go' }}
      reason="Clear west sky — sunset in 40 min"
    />
    <div className="facts">
      <span className="fact good">Open 24h</span>
      <span className="fact">Free</span>
    </div>
    <button className="cta">Directions to spot</button>
  </div>
</DSProvider>
```
