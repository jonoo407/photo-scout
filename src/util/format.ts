import { fmtClock } from './tz'

/** Time as "h:mm AM/PM". Pass the city's IANA `tz` to show it in that zone;
 *  without one you get the device zone.
 *
 *  This used to hand-roll the no-`tz` case off `d.getHours()`. Coverage showed
 *  that branch had never run — every call site passes a zone — and `fmtClock`
 *  already falls back to the device zone for exactly the same result, so the
 *  duplicate is gone rather than merely tested. */
export function fmtTime(d: Date | null | undefined, tz?: string): string {
  return fmtClock(d, tz)
}

export function fmtRange(a: Date, b: Date, tz?: string): string {
  return `${fmtTime(a, tz)} – ${fmtTime(b, tz)}`
}

/** Date as "Tue, Jun 30", in the city's zone if given. */
export function fmtDay(d: Date, tz?: string): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(tz ? { timeZone: tz } : {}) })
}

/** Drive-time label; avoids the wonky "0 min" for spots at your doorstep. */
export function fmtDrive(min: number): string {
  const m = Math.round(min)
  return m <= 0 ? 'under 1 min' : `${m} min`
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
