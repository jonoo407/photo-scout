import { describe, it, expect } from 'vitest'
import { sunsetScore, sunsetLabel } from '../../src/weather/sunset-score'

describe('sunsetScore', () => {
  it('scores high with mid/high cloud, clear horizon, low humidity', () => {
    const s = sunsetScore({ cloudLow: 5, cloudMid: 40, cloudHigh: 30, humidity: 55 })
    expect(s).toBeGreaterThan(80)
  })
  it('scores low under flat overcast with heavy low cloud', () => {
    const s = sunsetScore({ cloudLow: 90, cloudMid: 80, cloudHigh: 10, humidity: 80 })
    expect(s).toBeLessThan(45)
  })
  it('scores low under a boring clear sky (no canvas to light up)', () => {
    const s = sunsetScore({ cloudLow: 0, cloudMid: 0, cloudHigh: 0, humidity: 50 })
    expect(s).toBeLessThan(30)
  })
  it('clamps to 0-100', () => {
    const s = sunsetScore({ cloudLow: 100, cloudMid: 100, cloudHigh: 100, humidity: 100 })
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(100)
  })
  it('still rewards rich mid+high cloud whose naive sum exceeds 100', () => {
    // mid 55 + high 60 = 115; an additive band collapsed this to 0 (a clearly
    // photogenic, textured sky scored "meh"). Combined coverage keeps it decent.
    const s = sunsetScore({ cloudLow: 10, cloudMid: 55, cloudHigh: 60, humidity: 50 })
    expect(s).toBeGreaterThan(40)
  })
})

describe('sunsetLabel', () => {
  it('labels by band', () => {
    expect(sunsetLabel(85)).toBe('great')
    expect(sunsetLabel(55)).toBe('decent')
    expect(sunsetLabel(20)).toBe('meh')
  })
})
