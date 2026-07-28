import { describe, it, expect } from 'vitest'
import { formatVersion } from '../../src/app-version'

/*
 * TestFlight builds are indistinguishable from inside the app without this.
 * "It looks the same to me" after installing a new build is unanswerable when
 * nothing on screen names the build — and on iOS it is a live hazard, because
 * WKWebView storage survives app updates, so a stale bundle can genuinely
 * still be running. The build number is what makes that checkable.
 */
describe('formatVersion', () => {
  it('shows version and build number together', () => {
    expect(formatVersion('0.1.0', '7')).toBe('0.1.0 (7)')
  })

  it('marks local builds so they are never mistaken for a release', () => {
    expect(formatVersion('0.1.0', 'dev')).toBe('0.1.0 (dev)')
  })

  it('degrades to just the version when no build number was injected', () => {
    expect(formatVersion('0.1.0', '')).toBe('0.1.0')
    expect(formatVersion('0.1.0', undefined)).toBe('0.1.0')
  })
})
