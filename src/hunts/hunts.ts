/* Photo hunts (B14 / handoff 2c-2d), pure core. Completion truth lives
   server-side (hunt_progress, written only by submit_hunt_stop) — these
   helpers just interpret it for the UI. Stops unlock strictly in order;
   the server enforces the same rule. */

export interface HuntStop {
  spotId: string
  name: string
  lat: number
  lng: number
  hint?: string
}

export interface Hunt {
  id: string
  region: string
  title: string
  blurb: string | null
  stops: HuntStop[]
  stopPts: number
  finishPts: number
  opensAt: string | null
  closesAt: string | null
}

export interface HuntProgressRow {
  huntId: string
  stopIndex: number
  photoPath: string
  createdAt: string
}

export interface HuntStatus {
  done: number
  total: number
  finished: boolean
  /** The stop to shoot next — null once finished. */
  nextIndex: number | null
}

export function huntStatus(hunt: Hunt, progressForHunt: HuntProgressRow[]): HuntStatus {
  const total = hunt.stops.length
  const done = new Set(progressForHunt.map((r) => r.stopIndex)).size
  const finished = done >= total
  return { done, total, finished, nextIndex: finished ? null : done }
}

export type StopState = 'done' | 'next' | 'locked'

export function stopState(index: number, doneCount: number): StopState {
  if (index < doneCount) return 'done'
  if (index === doneCount) return 'next'
  return 'locked'
}

export function isOpen(hunt: Hunt, now: Date): boolean {
  if (hunt.opensAt && now < new Date(hunt.opensAt)) return false
  if (hunt.closesAt && now > new Date(hunt.closesAt)) return false
  return true
}

export function maxPoints(hunt: Hunt): number {
  return hunt.stops.length * hunt.stopPts + hunt.finishPts
}
