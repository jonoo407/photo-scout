import { describe, it, expect } from 'vitest'
import { resolveOpenStatus, type Hours } from '../../src/spots/hours'

// Deterministic stub: sunrise 06:30, sunset 20:00 (local) on any given day.
const sunTimesFor = (d: Date) => ({
  sunrise: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6, 30),
  sunset: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 20, 0),
})

// 2026-06-15 is a Monday.
const monday = (h: number, m = 0) => new Date(2026, 5, 15, h, m)
const tuesday = (h: number, m = 0) => new Date(2026, 5, 16, h, m)

const everyDay = (sched: Hours['days'][keyof Hours['days']]): Hours => ({
  days: { sun: sched, mon: sched, tue: sched, wed: sched, thu: sched, fri: sched, sat: sched },
})

describe('resolveOpenStatus', () => {
  it('resolves open hours in the given timezone, not the device', () => {
    const h = everyDay({ open: 'hours', intervals: [{ from: { at: 'clock', time: '09:00' }, to: { at: 'clock', time: '17:00' } }] })
    const sun = (d: Date) => ({ sunrise: d, sunset: d }) // unused for clock hours
    const instant = new Date('2026-06-30T14:00:00Z') // 10:00 EDT / 07:00 PDT
    expect(resolveOpenStatus(h, instant, sun, 'America/New_York').state).toBe('open') // 10am ET → open
    expect(resolveOpenStatus(h, instant, sun, 'America/Los_Angeles').state).toBe('closed') // 7am PT → not yet
  })

  it('24h is always open', () => {
    const h = everyDay({ open: '24h' })
    expect(resolveOpenStatus(h, monday(3), sunTimesFor).state).toBe('open')
    expect(resolveOpenStatus(h, monday(23, 30), sunTimesFor).state).toBe('open')
  })

  it('24h open is flagged allDay (so the UI can say "Open 24h", not "till 12:00 AM")', () => {
    const r = resolveOpenStatus(everyDay({ open: '24h' }), monday(3), sunTimesFor)
    expect(r.state).toBe('open')
    expect(r.allDay).toBe(true)
    // a normal fixed-range open must NOT be flagged allDay
    const fixed = everyDay({ open: 'hours', intervals: [{ from: { at: 'clock', time: '09:00' }, to: { at: 'clock', time: '17:00' } }] })
    expect(resolveOpenStatus(fixed, monday(10), sunTimesFor).allDay).toBeFalsy()
  })

  it('closed day is closed', () => {
    const h = everyDay({ open: 'closed' })
    expect(resolveOpenStatus(h, monday(12), sunTimesFor).state).toBe('closed')
  })

  it('fixed range: open inside, with the right closesAt', () => {
    const h = everyDay({ open: 'hours', intervals: [{ from: { at: 'clock', time: '09:00' }, to: { at: 'clock', time: '17:00' } }] })
    const r = resolveOpenStatus(h, monday(10), sunTimesFor)
    expect(r.state).toBe('open')
    expect(r.closesAt).toEqual(monday(17))
  })

  it('fixed range: before opening reports opensAt today', () => {
    const h = everyDay({ open: 'hours', intervals: [{ from: { at: 'clock', time: '09:00' }, to: { at: 'clock', time: '17:00' } }] })
    const r = resolveOpenStatus(h, monday(8), sunTimesFor)
    expect(r.state).toBe('closed')
    expect(r.opensAt).toEqual(monday(9))
  })

  it('fixed range: after closing reports opensAt next open day', () => {
    const h = everyDay({ open: 'hours', intervals: [{ from: { at: 'clock', time: '09:00' }, to: { at: 'clock', time: '17:00' } }] })
    const r = resolveOpenStatus(h, monday(18), sunTimesFor)
    expect(r.state).toBe('closed')
    expect(r.opensAt).toEqual(tuesday(9))
  })

  it('two intervals in a day (closed for lunch)', () => {
    const h = everyDay({ open: 'hours', intervals: [
      { from: { at: 'clock', time: '09:00' }, to: { at: 'clock', time: '12:00' } },
      { from: { at: 'clock', time: '13:00' }, to: { at: 'clock', time: '17:00' } },
    ] })
    expect(resolveOpenStatus(h, monday(12, 30), sunTimesFor).state).toBe('closed')
    expect(resolveOpenStatus(h, monday(13, 30), sunTimesFor).state).toBe('open')
  })

  it('sun-relative: open sunrise to sunset', () => {
    const h = everyDay({ open: 'hours', intervals: [{ from: { at: 'sunrise' }, to: { at: 'sunset' } }] })
    expect(resolveOpenStatus(h, monday(7), sunTimesFor).state).toBe('open')
    expect(resolveOpenStatus(h, monday(5), sunTimesFor).state).toBe('closed')
    expect(resolveOpenStatus(h, monday(21), sunTimesFor).state).toBe('closed')
  })

  it('sun-relative with offset: opens 30 min before sunrise', () => {
    const h = everyDay({ open: 'hours', intervals: [{ from: { at: 'sunrise', offsetMin: -30 }, to: { at: 'clock', time: '23:00' } }] })
    expect(resolveOpenStatus(h, monday(6, 15), sunTimesFor).state).toBe('open') // 06:00 open
    expect(resolveOpenStatus(h, monday(5, 45), sunTimesFor).state).toBe('closed')
  })

  it('overnight rooftop: open Mon 16:00 to 03:00 spills into Tuesday', () => {
    const sched = { open: 'hours' as const, intervals: [{ from: { at: 'clock' as const, time: '16:00' }, to: { at: 'clock' as const, time: '27:00' } }] }
    const h = everyDay(sched)
    expect(resolveOpenStatus(h, monday(23), sunTimesFor).state).toBe('open')
    // Tuesday 02:00 is covered by Monday's spill
    expect(resolveOpenStatus(h, tuesday(2), sunTimesFor).state).toBe('open')
    // Tuesday 04:00 is after the spill and before Tuesday's own 16:00 open
    const after = resolveOpenStatus(h, tuesday(4), sunTimesFor)
    expect(after.state).toBe('closed')
    expect(after.opensAt).toEqual(tuesday(16))
  })

  it('tour-only short-circuits to its own state', () => {
    const h = everyDay({ open: 'tour-only', note: 'monthly tour' })
    expect(resolveOpenStatus(h, monday(12), sunTimesFor).state).toBe('tour-only')
  })

  it('call-ahead short-circuits to its own state', () => {
    const h = everyDay({ open: 'call-ahead', note: 'call the office' })
    expect(resolveOpenStatus(h, monday(12), sunTimesFor).state).toBe('call-ahead')
  })
})
