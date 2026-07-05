import { describe, it, expect } from 'vitest'
import { scoreBestDay, primeWindow, rankBestDays } from '../../src/spots/best-days'
import SPOTS from '../../src/data/spots/tampa-bay'

const spot = (id: string) => SPOTS.find((s) => s.id === id)!
const TAMPA = { lat: 27.95, lng: -82.46 }

describe('primeWindow', () => {
  it('routes spots to their primary shooting window', () => {
    expect(primeWindow(spot('curtis-hixon-waterfront-park'))).toBe('evening') // evening-golden first
    expect(primeWindow(spot('bayshore-boulevard'))).toBe('morning') // sunrise first
    expect(primeWindow(spot('sacred-heart-catholic-church'))).toBe('daytime') // interior
    expect(primeWindow(spot('sunken-gardens'))).toBe('daytime') // garden
  })
})

describe('scoreBestDay', () => {
  it('rewards the day the sunset lines up behind the subject (henge)', () => {
    const curtis = spot('curtis-hixon-waterfront-park') // faces 270 (due west)
    const equinox = scoreBestDay(curtis, new Date(2026, 8, 22), TAMPA.lat, TAMPA.lng) // sunset ~due west
    const solstice = scoreBestDay(curtis, new Date(2026, 5, 21), TAMPA.lat, TAMPA.lng) // sunset ~NW
    expect(equinox.reasons.some((r) => /lines up/i.test(r))).toBe(true)
    expect(equinox.score).toBeGreaterThan(solstice.score)
  })

  it('marks a closed-that-day spot as not a candidate', () => {
    // Sacred Heart (interior) is closed weekends; 2026-06-27 is a Saturday
    const d = scoreBestDay(spot('sacred-heart-catholic-church'), new Date(2026, 5, 27), TAMPA.lat, TAMPA.lng)
    expect(d.open).toBe(false)
    expect(d.score).toBeLessThan(20)
    expect(d.reasons[0]).toMatch(/closed/i)
  })

  it('uses the forecast sky score when present and flags it', () => {
    const curtis = spot('curtis-hixon-waterfront-park')
    const d = new Date(2026, 8, 22)
    const great = scoreBestDay(curtis, d, TAMPA.lat, TAMPA.lng, { skyScore: 90 })
    const meh = scoreBestDay(curtis, d, TAMPA.lat, TAMPA.lng, { skyScore: 20 })
    expect(great.forecast).toBe(true)
    expect(great.reasons.some((r) => /sunset sky/i.test(r))).toBe(true)
    expect(great.score).toBeGreaterThan(meh.score)
    // One score per row: the reason must not carry a second bare number that
    // competes with the day's badge (was "Strong sunset sky (90)" + "67").
    expect(great.reasons.every((r) => !/\(\d+\)/.test(r))).toBe(true)
  })

  it('rewards a low tide near the window for a beach spot', () => {
    const fort = spot('fort-de-soto-park')
    const d = new Date(2026, 8, 22)
    const lowTide = scoreBestDay(fort, d, TAMPA.lat, TAMPA.lng, { lowTideMin: 20 })
    const highTide = scoreBestDay(fort, d, TAMPA.lat, TAMPA.lng, { lowTideMin: 240 })
    expect(lowTide.reasons.some((r) => /low tide/i.test(r))).toBe(true)
    expect(lowTide.score).toBeGreaterThan(highTide.score)
  })

  it('ranks days best-first', () => {
    const curtis = spot('curtis-hixon-waterfront-park')
    const dates = [new Date(2026, 5, 21), new Date(2026, 8, 22), new Date(2026, 11, 21)]
    const ranked = rankBestDays(curtis, dates, TAMPA.lat, TAMPA.lng)
    for (let i = 1; i < ranked.length; i++) expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score)
  })
})
