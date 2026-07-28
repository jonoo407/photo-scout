/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { manifestIcons } from './src/brand/icons'

export default defineConfig({
  base: './',
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
