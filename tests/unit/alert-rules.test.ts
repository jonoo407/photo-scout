import { describe, it, expect } from 'vitest'
import { shouldAlert, alertMessage, ALERT_SCORE } from '../../src/push/alert-rules'
import type { BestDay } from '../../src/spots/best-days'

const day = (over: Partial<BestDay>): BestDay => ({
  date: new Date('2026-07-05T12:00:00Z'),
  windowKind: 'evening',
  windowStart: new Date('2026-07-05T23:30:00Z'),
  score: 80,
  reasons: ['Strong sunset sky (93)', 'Sun lines up behind the subject'],
  open: true,
  forecast: true,
  ...over,
})

describe('shouldAlert', () => {
  it('fires on a forecast-backed day at or above the threshold', () => {
    expect(shouldAlert(day({ score: ALERT_SCORE }))).toBe(true)
    expect(shouldAlert(day({ score: 92 }))).toBe(true)
  })
  it('never fires without a real forecast (astronomy alone is not an event)', () => {
    expect(shouldAlert(day({ forecast: false, score: 95 }))).toBe(false)
  })
  it('never fires below threshold or when closed', () => {
    expect(shouldAlert(day({ score: ALERT_SCORE - 1 }))).toBe(false)
    expect(shouldAlert(day({ open: false, score: 95 }))).toBe(false)
  })
})

describe('alertMessage', () => {
  it('names the spot, leads with the reasons, and deep-links it', () => {
    const m = alertMessage('Honeymoon Island State Park', 'honeymoon-island-sp', day({}))
    expect(m.title).toContain('Honeymoon Island')
    expect(m.body).toContain('Strong sunset sky (93)')
    expect(m.body).toContain('80')
    expect(m.url).toBe('/#/spot/honeymoon-island-sp')
  })
})
