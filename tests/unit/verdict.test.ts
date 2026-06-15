import { describe, it, expect } from 'vitest'
import { weatherVerdict } from '../../src/weather/verdict'

describe('weatherVerdict', () => {
  it('clear skies favor skyline + beach', () => {
    const v = weatherVerdict({ cloudCover: 10, precipProbability: 0 })
    expect(v.mood).toBe('clear')
    expect(v.favors).toContain('skyline')
    expect(v.favors).toContain('beach')
  })
  it('partly cloudy stays flexible (golden hour)', () => {
    const v = weatherVerdict({ cloudCover: 50, precipProbability: 10 })
    expect(v.mood).toBe('partly')
  })
  it('overcast favors interiors/gardens and avoids skyline', () => {
    const v = weatherVerdict({ cloudCover: 90, precipProbability: 10 })
    expect(v.mood).toBe('cloudy')
    expect(v.favors).toContain('interiors')
    expect(v.avoid).toContain('skyline')
  })
  it('rain likely sends you indoors', () => {
    const v = weatherVerdict({ cloudCover: 80, precipProbability: 70 })
    expect(v.mood).toBe('rainy')
    expect(v.favors).toContain('interiors')
    expect(v.avoid).toContain('skyline')
    expect(v.headline.length).toBeGreaterThan(0)
  })
})
