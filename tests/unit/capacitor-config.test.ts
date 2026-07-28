// @vitest-environment node
import { describe, it, expect } from 'vitest'
import capacitorConfig from '../../capacitor.config'

// The native iOS wrapper loads the Vite build from disk under the
// capacitor://localhost scheme, so webDir must track Vite's outDir or the
// wrapper silently ships a stale/empty bundle while the web build stays fine.
//
// The companion invariant — that built asset URLs stay relative, since absolute
// /assets/* 404s under that scheme — is asserted against real build output in
// .github/workflows/ios-simulator.yml, which is stronger than reading it off the
// config. (vite.config.ts can't be imported here: vitest ships its own nested
// vite copy, so pulling it into the typecheck graph collides with the top-level
// one.)
describe('Capacitor config', () => {
  it('identifies the app with a reverse-DNS bundle id', () => {
    expect(capacitorConfig.appId).toBe('com.shootvantage.app')
    expect(capacitorConfig.appName).toBe('Vantage')
  })

  it('points webDir at the directory Vite builds into', () => {
    expect(capacitorConfig.webDir).toBe('dist')
  })
})
