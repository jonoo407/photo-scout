/* Opening-hours model + resolver.

   Handles: 24h, fixed clock ranges per weekday, sunrise/sunset-relative bounds
   (with offsets), multiple intervals per day, overnight spill (a past-midnight
   close is written as a 24h+ clock, e.g. "27:00" = 03:00 next day), closed days,
   tour-only and call-ahead. */

import { zoneParts, startOfDayInZone, zonedWallToInstant, deviceTimeZone } from '../util/tz'

export type Weekday = 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
const WEEK: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export type TimeRef =
  | { at: 'clock'; time: string } // "HH:MM"; hours may be >= 24 for past midnight
  | { at: 'sunrise'; offsetMin?: number }
  | { at: 'sunset'; offsetMin?: number }

export interface OpenInterval {
  from: TimeRef
  to: TimeRef
}

export type DaySchedule =
  | { open: '24h' }
  | { open: 'closed' }
  | { open: 'tour-only'; note?: string }
  | { open: 'call-ahead'; note?: string }
  | { open: 'hours'; intervals: OpenInterval[] }

export interface Hours {
  days: Record<Weekday, DaySchedule>
  note?: string
}

export interface DaySun {
  sunrise: Date
  sunset: Date
}

export interface OpenStatus {
  state: 'open' | 'closed' | 'tour-only' | 'call-ahead'
  opensAt?: Date | null
  closesAt?: Date | null
}

function resolveTimeRef(ref: TimeRef, dayStart: Date, sun: DaySun, tz: string): Date {
  if (ref.at === 'clock') {
    const [h, m] = ref.time.split(':').map(Number)
    const z = zoneParts(dayStart, tz)
    return zonedWallToInstant(z.year, z.month - 1, z.day, h, m, tz) // h may be >= 24 (past midnight)
  }
  const base = ref.at === 'sunrise' ? sun.sunrise : sun.sunset
  return new Date(base.getTime() + (ref.offsetMin ?? 0) * 60000)
}

interface Concrete {
  from: Date
  to: Date
}

function dayIntervals(sched: DaySchedule, dayStart: Date, sun: DaySun, tz: string): Concrete[] {
  if (sched.open === '24h') {
    const z = zoneParts(dayStart, tz)
    return [{ from: dayStart, to: zonedWallToInstant(z.year, z.month - 1, z.day + 1, 0, 0, tz) }]
  }
  if (sched.open === 'hours') {
    return sched.intervals.map((iv) => ({
      from: resolveTimeRef(iv.from, dayStart, sun, tz),
      to: resolveTimeRef(iv.to, dayStart, sun, tz),
    }))
  }
  return []
}

const weekdayOf = (instant: Date, tz: string): Weekday => WEEK[zoneParts(instant, tz).weekday]

export function resolveOpenStatus(
  hours: Hours,
  now: Date,
  sunTimesFor: (date: Date) => DaySun,
  timeZone: string = deviceTimeZone(),
): OpenStatus {
  const tz = timeZone
  const todaySched = hours.days[weekdayOf(now, tz)]

  if (todaySched.open === 'tour-only') return { state: 'tour-only' }
  if (todaySched.open === 'call-ahead') return { state: 'call-ahead' }

  const today = startOfDayInZone(now, tz)
  const todayIv = dayIntervals(todaySched, today, sunTimesFor(today), tz)

  // Previous local day's intervals can spill past midnight into today.
  const yest = startOfDayInZone(new Date(today.getTime() - 12 * 3600 * 1000), tz)
  const yestIv = dayIntervals(hours.days[weekdayOf(yest, tz)], yest, sunTimesFor(yest), tz).filter(
    (iv) => iv.to.getTime() > today.getTime(),
  )

  const todayAll = [...yestIv, ...todayIv].sort((a, b) => a.from.getTime() - b.from.getTime())

  const current = todayAll.find((iv) => now.getTime() >= iv.from.getTime() && now.getTime() < iv.to.getTime())
  if (current) return { state: 'open', closesAt: current.to }

  // Find the next opening within the next 7 local days.
  for (let offset = 0; offset <= 7; offset++) {
    const day = startOfDayInZone(new Date(today.getTime() + offset * 24 * 3600 * 1000), tz)
    const sched = hours.days[weekdayOf(day, tz)]
    if (sched.open === 'tour-only' || sched.open === 'call-ahead') continue
    const ivs = dayIntervals(sched, day, sunTimesFor(day), tz).sort((a, b) => a.from.getTime() - b.from.getTime())
    const next = ivs.find((iv) => iv.from.getTime() > now.getTime())
    if (next) return { state: 'closed', opensAt: next.from }
  }

  return { state: 'closed', opensAt: null }
}
