# Vantage — brand kit

The mark: a **location pin with a golden-hour sun setting on a horizon** — "place + light",
the product thesis. Palette is the golden-hour-warm set already locked in `src/styles/theme.css`.

## Palette (used by the mark)
| Role | Hex |
|---|---|
| Cream (tile / surface) | `#faf1e2` |
| Espresso (ink / window / land) | `#2e2014` |
| Terracotta (pin, accent) | `#c45a2c` (pin highlight `#d4682f`) |
| Amber | `#e0922f` |
| Gold (sun) | `#f2b43c` |

Type: **Fraunces** (serif display) + **DM Sans** (body). Wordmark uses Fraunces 600 with a
terracotta "a". Tagline: *Find your light.*

## Shipped assets (`/public`, the source of truth is `src/brand/icons.ts`)
| File | Size | Purpose |
|---|---|---|
| `icon.svg` | vector | favicon + PWA "any" (rounded cream tile) |
| `pwa-192.png` / `pwa-512.png` | 192 / 512 | PWA "any" (transparent corners) |
| `maskable-512.png` | 512 | PWA "maskable" (full-bleed, pin inside the safe zone) |
| `apple-touch-icon.png` | 180 | iOS home screen (full-bleed, no transparency) |

## Sources & regeneration (in this folder)
- `maskable.svg`, `appletouch.svg` — full-bleed SVG sources for the PNGs (pin scaled into the
  maskable safe zone / iOS-rounded area). `icon.svg` lives in `/public` and is the "any" source.
- `render-icons.mjs` — rasterizes the SVGs to the `/public` PNGs via headless Chrome (CDP).
  Run a headless Chrome with `--remote-debugging-port=9222`, then `node brand/render-icons.mjs 9222`.
- `wordmark.html` / `wordmark.png` — the horizontal wordmark lockup (Fraunces).

If you change the mark, edit the SVGs then re-run `render-icons.mjs`; the manifest/test pick up
the registry in `src/brand/icons.ts` automatically.

## Still in Canva
The assets were authored directly (exact palette + maskable safe-zone control). To mirror them in
your Canva account, upload `icon.svg` / `wordmark.png` once the app is deployed (Canva
`upload-asset-from-url` needs a public URL).
