import { describe, it, expect } from 'vitest'
import { fmtTime, fmtRange, fmtDay, fmtDistance, untilString } from '../../src/util/format'

/* format.ts was covered incidentally by screen tests, which meant its
   zone-less paths were never exercised at all — the suite pinned the device
   zone to US Eastern, and every call site passes a zone. These drive both. */

const AT = (h: number, m = 0) => new Date(2026, 5, 30, h, m) // Eastern, per vitest env TZ

describe('fmtTime', () => {
  it('formats in a given zone', () => {
    expect(fmtTime(AT(20, 5), 'America/New_York')).toBe('8:05 PM')
    // Same instant, three hours earlier on the west coast.
    expect(fmtTime(AT(20, 5), 'America/Los_Angeles')).toBe('5:05 PM')
  })

  it('falls back to the device zone when none is given', () => {
    expect(fmtTime(AT(20, 5))).toBe('8:05 PM')
    expect(fmtTime(AT(9, 30))).toBe('9:30 AM')
  })

  it('renders noon and midnight as 12, not 0', () => {
    expect(fmtTime(AT(12, 0))).toBe('12:00 PM')
    expect(fmtTime(AT(0, 0))).toBe('12:00 AM')
    expect(fmtTime(AT(0, 0), 'America/New_York')).toBe('12:00 AM')
  })

  it('pads single-digit minutes', () => {
    expect(fmtTime(AT(7, 5))).toBe('7:05 AM')
  })

  it('shows an em dash for a missing time, zone or not', () => {
    expect(fmtTime(null)).toBe('—')
    expect(fmtTime(undefined)).toBe('—')
    expect(fmtTime(null, 'America/New_York')).toBe('—')
  })
})

describe('fmtRange', () => {
  it('joins two times with an en dash', () => {
    expect(fmtRange(AT(19, 30), AT(20, 15))).toBe('7:30 PM – 8:15 PM')
  })

  it('applies the zone to both ends', () => {
    expect(fmtRange(AT(19, 30), AT(20, 15), 'America/Los_Angeles')).toBe('4:30 PM – 5:15 PM')
  })
})

describe('fmtDay', () => {
  it('formats as weekday, month, day', () => {
    expect(fmtDay(AT(12))).toBe('Tue, Jun 30')
  })

  it('can roll to the previous day in a western zone', () => {
    expect(fmtDay(new Date(2026, 5, 30, 1, 0), 'America/Los_Angeles')).toBe('Mon, Jun 29')
  })
})

describe('fmtDistance', () => {
  it('shows miles for imperial and kilometres for metric', () => {
    expect(fmtDistance(12.34, 'imperial')).toBe('12.3 mi')
    expect(fmtDistance(12.34, 'metric')).toBe('19.9 km')
  })

  it('keeps one decimal at zero', () => {
    expect(fmtDistance(0, 'imperial')).toBe('0.0 mi')
  })
})

describe('untilString', () => {
  const now = AT(12, 0)
  it('counts minutes under an hour', () => {
    expect(untilString(AT(12, 45), now)).toBe('in 45m')
  })
  it('counts hours and minutes beyond one', () => {
    expect(untilString(AT(14, 30), now)).toBe('in 2h 30m')
  })
  it('drops the minutes on a whole hour', () => {
    expect(untilString(AT(15, 0), now)).toBe('in 3h')
  })
  it('says "now" once the moment has passed', () => {
    expect(untilString(AT(11, 0), now)).toBe('now')
    expect(untilString(AT(12, 0), now)).toBe('in 0m')
  })
})
