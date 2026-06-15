// Single source of truth for Vantage's PWA/app icons.
// Imported by vite.config.ts (manifest) and tests/unit/brand-icons.test.ts.
// The visual mark — a location pin with a golden-hour sun setting on the horizon —
// uses the exact golden-hour-warm palette from src/styles/theme.css:
//   cream #faf1e2 · espresso #2e2014 · terracotta #c45a2c / #d4682f · amber #e0922f · gold #f2b43c

export interface IconEntry {
  src: string
  sizes: string
  type: 'image/png' | 'image/svg+xml'
  purpose: 'any' | 'maskable'
}

// Manifest icons, in the order PWA installers prefer (PNGs first, SVG last).
export const manifestIcons: IconEntry[] = [
  { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
]

// Every icon file that must ship in public/ for the brand to be complete
// (includes apple-touch-icon.png, referenced from index.html rather than the manifest).
export const requiredPublicIcons = [
  'icon.svg',
  'apple-touch-icon.png',
  'pwa-192.png',
  'pwa-512.png',
  'maskable-512.png',
] as const
