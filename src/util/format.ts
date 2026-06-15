export function fmtTime(d: Date | null | undefined): string {
  if (!d) return '—'
  let h = d.getHours()
  const m = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function fmtRange(a: Date, b: Date): string {
  return `${fmtTime(a)} – ${fmtTime(b)}`
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
