/* The point ledger feeding the craft ladder. Events are append-only and sync
   across devices (union by id — see auth/sync-merge). Totals are always
   derived from the ledger, never stored, so merges can't double-count. */

export const POINT_VALUES = {
  /** Been there with a verified shot. */
  shotVerified: 10,
  /** One photo-hunt stop completed. */
  huntStop: 25,
  /** A whole hunt finished (on top of its stops). */
  huntFinish: 100,
  /** A critique written for someone's shot. */
  critiqueGiven: 15,
  /** A friend joined through your invite. */
  referral: 200,
} as const

export type PointReason = keyof typeof POINT_VALUES

export interface PointEvent {
  id: string
  /** ISO timestamp the points landed. */
  at: string
  reason: PointReason
  pts: number
}

export function pointsTotal(events: readonly PointEvent[]): number {
  return events.reduce((sum, e) => sum + e.pts, 0)
}
