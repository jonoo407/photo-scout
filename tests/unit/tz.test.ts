import { describe, it, expect } from 'vitest'
import { zoneParts, zonedWallToInstant, fmtClock, startOfDayInZone } from '../../src/util/tz'

const INSTANT = new Date('2026-06-30T18:00:00Z') // 6pm UTC, a Tuesday

describe('tz helpers', () => {
  it('formats an instant in the correct city clock', () => {
    expect(fmtClock(INSTANT, 'America/New_York')).toBe('2:00 PM') // EDT -4
    expect(fmtClock(INSTANT, 'America/Chicago')).toBe('1:00 PM') // CDT -5
    expect(fmtClock(INSTANT, 'America/Los_Angeles')).toBe('11:00 AM') // PDT -7
    expect(fmtClock(INSTANT, 'Asia/Tokyo')).toBe('3:00 AM') // JST +9 (next day)
  })

  it('reads wall-clock parts (incl. weekday) in zone', () => {
    expect(zoneParts(INSTANT, 'America/Los_Angeles')).toMatchObject({ hour: 11, weekday: 2 }) // Tue
    expect(zoneParts(INSTANT, 'Asia/Tokyo')).toMatchObject({ day: 1, hour: 3, weekday: 3 }) // Wed Jul 1
  })

  it('converts a city wall-clock time back to the right instant', () => {
    // 2:00 PM EDT on 2026-06-30 is 18:00 UTC
    expect(zonedWallToInstant(2026, 5, 30, 14, 0, 'America/New_York').toISOString()).toBe('2026-06-30T18:00:00.000Z')
    // 2:00 PM PDT is 21:00 UTC
    expect(zonedWallToInstant(2026, 5, 30, 14, 0, 'America/Los_Angeles').toISOString()).toBe('2026-06-30T21:00:00.000Z')
  })

  it('finds local midnight in a zone', () => {
    // midnight Jun 30 in LA = 07:00 UTC Jun 30
    expect(startOfDayInZone(INSTANT, 'America/Los_Angeles').toISOString()).toBe('2026-06-30T07:00:00.000Z')
  })
})
