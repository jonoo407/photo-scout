/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { manifestIcons } from './src/brand/icons'

// Read rather than imported: a JSON import would need resolveJsonModule wiring
// in the config's own tsconfig scope.
const pkgVersion = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version

export default defineConfig({
  base: './',
  define: {
    // Surfaced in Settings so a TestFlight build is identifiable from inside
    // the app. BUILD_NUMBER is the CI run number, matching CFBundleVersion.
    __APP_VERSION__: JSON.stringify(pkgVersion),
    __APP_BUILD__: JSON.stringify(process.env.BUILD_NUMBER ?? 'dev'),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      workbox: {
        // Conditions-alert push handlers ride inside the generated SW.
        importScripts: ['push-sw.js'],
        // Spot photos are self-hosted now (public/spot-photos, ~25 MB). Keep
        // them OUT of the precache or every first web visit would drag the whole
        // library down; they get cached on view by the runtime rule below.
        // Native doesn't need either — `cap sync` ships them inside the IPA.
        globIgnores: ['**/spot-photos/**'],
        // Cache viewed spot photos so heroes/thumbnails survive spotty signal
        // in the field. Same-origin now, so responses are never opaque —
        // status 0 is deliberately NOT cacheable here: accepting it is what let
        // a failed fetch get cached as valid and blank thumbnails on TestFlight
        // build 3, back when these were hotlinked from Wikimedia.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/spot-photos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'spot-photos',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 3600, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Vantage — Photo Scout',
        short_name: 'Vantage',
        description: 'Find great places to shoot, with the right light, access and craft for each one.',
        theme_color: '#faf1e2',
        background_color: '#faf1e2',
        display: 'standalone',
        start_url: './',
        icons: manifestIcons,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    // Day planning works in device-local time, and every region we ship
    // (Tampa Bay, Philadelphia) is US Eastern — so specs that freeze a clock
    // with `new Date(y, m, d, h, m)` are implicitly Eastern. Pin it, or they
    // pass on an Eastern laptop and fail on a UTC CI runner.
    env: { TZ: 'America/New_York' },
    setupFiles: './src/test/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
})
