import { existsSync } from 'node:fs'
import { defineConfig } from '@playwright/test'

// Deliberately NOT `vite preview` — it 301s `/` to vite's `base`, which
// hides the absolute-asset-path bug that breaks capacitor://localhost.
const staticServer = (port: number, dist: string) => ({
  command: 'node e2e/static-server.mjs',
  env: { PORT: String(port), DIST: dist },
  url: `http://localhost:${port}`,
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
})

// iPhone-form-factor visual QA + axe a11y against the built app.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:4173',
    viewport: { width: 390, height: 844 }, // iPhone 12/13 logical size
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
  projects: [
    // Screenshot suite. Chromium is fine here: it's about layout.
    { name: 'chromium', use: { browserName: 'chromium' }, testMatch: /visual\.spec\.ts/ },
    // Accessibility gate. Its own project so CI can run it WITHOUT the
    // screenshot loop — that loop needs no baseline and shouldn't gate a push,
    // but a serious axe violation should.
    { name: 'a11y', use: { browserName: 'chromium' }, testMatch: /a11y\.spec\.ts/ },
    // The iOS wrapper gate — WebKit is the closest engine to WKWebView we can
    // run without a Mac. Cheap enough to gate every push.
    { name: 'webkit', use: { browserName: 'webkit' }, testMatch: /webview\.spec\.ts/ },
    // The signed-out experience with auth ON, as production is built — the
    // other projects run an auth-off bundle and never see sign-in at all.
    // Service workers blocked so page.route sees every Supabase request.
    {
      name: 'guest',
      use: { browserName: 'webkit', baseURL: 'http://localhost:4174', serviceWorkers: 'block' },
      testMatch: /guest\.spec\.ts/,
    },
  ],
  webServer: [
    staticServer(4173, 'dist'),
    // Only once `npm run build:e2e-auth` has made it: an absent build would
    // 404 the readiness probe and stall every other project for two minutes.
    // guest.spec.ts fails loudly on its own when the build is missing.
    ...(existsSync('dist-e2e-auth/index.html') ? [staticServer(4174, 'dist-e2e-auth')] : []),
  ],
})
