import { defineConfig } from '@playwright/test'

// iPhone-form-factor visual QA + axe a11y against the built app (vite preview).
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
  ],
  webServer: {
    // Deliberately NOT `vite preview` — it 301s `/` to vite's `base`, which
    // hides the absolute-asset-path bug that breaks capacitor://localhost.
    command: 'node e2e/static-server.mjs',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
