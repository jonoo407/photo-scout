/* Fixed-window counters, stored in the AlertsDO (2026-09-24).

   Cloudflare's rate-limit binding only offers 10 s and 60 s windows, and the
   budget that matters here is Resend's daily quota, so the counters live in
   the Durable Object that already holds the Worker's state. One key per
   bucket; a window that has ended simply starts over. */

export interface Window {
  start: number
  count: number
  windowMs: number
}

export function take(
  prev: Window | undefined, limit: number, windowMs: number, now: number,
): { allowed: boolean; next: Window } {
  const current = prev && now - prev.start < prev.windowMs ? prev : { start: now, count: 0, windowMs }
  if (current.count >= limit) return { allowed: false, next: current }
  return { allowed: true, next: { ...current, count: current.count + 1 } }
}

export const expired = (w: Window, now: number) => now - w.start >= w.windowMs
