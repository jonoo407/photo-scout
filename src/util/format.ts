import { fmtClock } from './tz'

/** Time as "h:mm AM/PM". Pass the city's IANA `tz` to show it in that zone. */
export function fmtTime(d: Date | null | undefined, tz?: string): string {
  if (tz) return fmtClock(d, tz)
  if (!d) return '—'
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function fmtRange(a: Date, b: Date, tz?: string): string {
  return `${fmtTime(a, tz)} – ${fmtTime(b, tz)}`
}

/** Date as "Tue, Jun 30", in the city's zone if given. */
export function fmtDay(d: Date, tz?: string): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(tz ? { timeZone: tz } : {}) })
}

export function fmtDrive(min: number): string {
  return `${Math.round(min)} min`
}

export function fmtDistance(miles: number, units: 'imperial' | 'metric'): string {
  if (units === 'metric') return `${(miles * 1.60934).toFixed(1)} km`
  return `${miles.toFixed(1)} mi`
}

export function untilString(target: Date, now: Date): string {
  const mins = Math.round((target.getTime() - now.getTime()) / 60000)
  if (mins < 0) return 'now'
  if (mins < 60) return `in ${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `in ${h}h` : `in ${h}h ${m}m`
}
