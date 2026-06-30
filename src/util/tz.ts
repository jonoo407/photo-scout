/* Timezone helpers so the app shows times and resolves open-hours in each
   city's own zone, not the viewer's device zone. Built on Intl (no deps). */

export const deviceTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone

export interface ZoneParts {
  year: number; month: number; day: number; hour: number; minute: number; second: number; weekday: number // 0=Sun
}

const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

/** Wall-clock components of an instant in a given IANA zone. */
export function zoneParts(instant: Date, timeZone: string): ZoneParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', hour12: false,
  })
  const p: Record<string, string> = {}
  for (const part of dtf.formatToParts(instant)) p[part.type] = part.value
  return {
    year: +p.year, month: +p.month, day: +p.day,
    hour: p.hour === '24' ? 0 : +p.hour, minute: +p.minute, second: +p.second,
    weekday: WD[p.weekday] ?? 0,
  }
}

function offsetMs(instant: number, timeZone: string): number {
  const z = zoneParts(new Date(instant), timeZone)
  return Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second) - instant
}

/** The UTC instant for a wall-clock time in a zone. `hour` may exceed 24 (rolls into the next day). */
export function zonedWallToInstant(year: number, month0: number, day: number, hour: number, minute: number, timeZone: string): Date {
  const utcGuess = Date.UTC(year, month0, day, hour, minute)
  const off1 = offsetMs(utcGuess, timeZone)
  let instant = utcGuess - off1
  const off2 = offsetMs(instant, timeZone) // settle DST transitions
  if (off2 !== off1) instant = utcGuess - off2
  return new Date(instant)
}

/** Midnight (start of the local day) in `timeZone` for the calendar day `instant` falls on. */
export function startOfDayInZone(instant: Date, timeZone: string): Date {
  const z = zoneParts(instant, timeZone)
  return zonedWallToInstant(z.year, z.month - 1, z.day, 0, 0, timeZone)
}

/** Format an instant as "h:mm AM/PM" in the given zone (device zone if omitted). */
export function fmtClock(d: Date | null | undefined, timeZone?: string): string {
  if (!d) return '—'
  const z = zoneParts(d, timeZone ?? deviceTimeZone())
  let h = z.hour % 12
  if (h === 0) h = 12
  return `${h}:${String(z.minute).padStart(2, '0')} ${z.hour >= 12 ? 'PM' : 'AM'}`
}
