/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { manifestIcons } from './src/brand/icons'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: './',
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    devOptions: { enabled: false },
    includeAssets: ['icon.svg', 'apple-touch-icon.png'],
    workbox: {
      // Cache viewed spot photos so heroes/thumbnails survive spotty signal
      // in the field (they're hotlinked from Wikimedia/Flickr, not bundled).
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/(upload\.wikimedia\.org|live\.staticflickr\.com)\/.*/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'spot-photos',
            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 24 * 3600, purgeOnQuotaError: true },
            cacheableResponse: { statuses: [0, 200] }, // opaque cross-origin OK
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
  }), cloudflare()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
})