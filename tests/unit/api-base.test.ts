import { describe, it, expect } from 'vitest'
import { apiUrl } from '../../src/push/api-base'

/* Worker API endpoints (/api/…) live on shootvantage.com. On the web the page
   IS shootvantage.com, so a relative path works. Inside the Capacitor wrapper
   the page's origin is capacitor://localhost — a relative fetch resolves to a
   URL nothing serves, which is how TestFlight build 16's alerts toggle failed
   after the user had already granted notification permission (2026-08-31).
   Same works-on-web/dead-in-wrapper class as the geolocation bug. */

describe('apiUrl', () => {
  it('returns the path untouched on the web', () => {
    expect(apiUrl('/api/push/subscribe', false)).toBe('/api/push/subscribe')
  })

  it('resolves against the production host inside the wrapper', () => {
    expect(apiUrl('/api/push/subscribe', true)).toBe('https://shootvantage.com/api/push/subscribe')
  })

  it('keeps query strings intact', () => {
    expect(apiUrl('/api/push/pending?k=abc', true)).toBe('https://shootvantage.com/api/push/pending?k=abc')
  })
})
