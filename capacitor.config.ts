import type { CapacitorConfig } from '@capacitor/cli'

// Native shell for the existing PWA: the iOS app loads the same Vite build from
// disk under capacitor://localhost rather than fetching shootvantage.com, so the
// app works offline out of the box and ships as a versioned binary.
//
// `webDir` is pinned to Vite's outDir and `base: './'` is pinned relative — see
// tests/unit/capacitor-config.test.ts for why both matter under that scheme.
const config: CapacitorConfig = {
  appId: 'com.shootvantage.app',
  appName: 'Vantage',
  webDir: 'dist',
  ios: {
    // Brand cream, so the gap behind the webview during load/rubber-band
    // scrolling matches the app rather than flashing white.
    backgroundColor: '#faf1e2',
  },
}

export default config
