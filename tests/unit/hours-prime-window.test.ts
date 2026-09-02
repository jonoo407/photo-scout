import { describe, it, expect } from 'vitest'
import tampa from '../../src/data/spots/tampa-bay'
import philadelphia from '../../src/data/spots/philadelphia'
import { primeWindow, scoreBestDay } from '../../src/spots/best-days'

/* A spot whose hours never overlap its own prime light window is invisible:
   scoreBestDay() pins it to 6, BestDays filters it out, and the alert cron can
   never fire for it. Every case found so far (2026-09-01 audit) was the same
   data-entry slip — an exterior subject (a steeple, a facade) entered with the
   building's visiting hours, as if the steeple closed at five.

   So: over a 30-day span in each season of a fixed year, every spot must be
   open at its prime window on at least one day — unless it is listed here as
   genuinely gated, with the reason. The second test keeps that list honest. */

const GATED: Record<string, string> = {
  'lettuce-lake-park': 'Hillsborough County park; gates open 08:00, after sunrise most of the year.',
  'laurel-hill-cemetery': 'Gated grounds, 08:00–16:30 weekdays and 09:30 weekends — dawn is behind the gate.',
  'weedon-island-preserve': 'Pinellas County preserve; gate opens 07:00, after summer sunrise.',
  'race-street-pier': 'Delaware River Waterfront pier, posted 07:00–23:00; summer sunrise beats the gate.',
}

const SPOTS = [...tampa, ...philadelphia]
const SEASONS = [new Date(2026, 2, 1), new Date(2026, 5, 1), new Date(2026, 8, 1), new Date(2026, 11, 1)]
const span = (start: Date) =>
  Array.from({ length: 30 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))

const openSomeDay = (spot: (typeof SPOTS)[number], start: Date) =>
  span(start).some((d) => scoreBestDay(spot, d, spot.lat, spot.lng).open)

describe('every spot is open at its prime light window on some day, in every season', () => {
  it('is never pinned to "Closed at the prime window" for a whole month (unless genuinely gated)', () => {
    const failures: string[] = []
    for (const spot of SPOTS) {
      if (spot.id in GATED) continue
      for (const start of SEASONS) {
        if (!openSomeDay(spot, start)) {
          failures.push(`${spot.id} (${primeWindow(spot)} window) — closed every day from ${start.toDateString()}`)
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('lists only real spots in GATED, and only ones that still need it', () => {
    for (const id of Object.keys(GATED)) {
      const spot = SPOTS.find((s) => s.id === id)
      expect(spot, `${id} is in GATED but not in the dataset`).toBeDefined()
      const closedSomeSeason = SEASONS.some((start) => !openSomeDay(spot!, start))
      expect(closedSomeSeason, `${id} is open at its prime window in every season now — drop it from GATED`).toBe(true)
    }
  })
})
