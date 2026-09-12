/* When — if ever — to ask for feedback on Today.
 *
 * Kept as a pure predicate rather than conditions scattered through the card,
 * because the restraint IS the feature. An in-app prompt is trivial to write
 * and trivial to make hateful; these four rules are what keep it on the right
 * side of that line, and they are worth being able to test in isolation.
 */

export interface NudgeState {
  /** App opens on this device. */
  sessions: number
  /** When we last ASKED — set by both dismissing and sending, so saying yes
      is never punished with a sooner re-ask than saying no. ISO, or null. */
  feedbackPromptAt: string | null
  /** Onboarding finished. Never interrupt a first run. */
  introSeen: boolean
}

/** Enough use to have an opinion worth typing. */
export const MIN_SESSIONS = 3

/** Once a month at the very most. */
export const COOLDOWN_DAYS = 30

const DAY_MS = 24 * 60 * 60 * 1000

export function shouldPromptForFeedback(s: NudgeState, now: Date): boolean {
  if (!s.introSeen) return false
  if (s.sessions < MIN_SESSIONS) return false
  if (s.feedbackPromptAt == null) return true

  const last = Date.parse(s.feedbackPromptAt)
  // A corrupt or future stamp means stay quiet. The failure mode of guessing
  // "never asked" is prompting on every single launch, which is the one
  // outcome worse than never prompting at all.
  if (Number.isNaN(last)) return false
  const elapsed = now.getTime() - last
  if (elapsed < 0) return false

  return elapsed >= COOLDOWN_DAYS * DAY_MS
}
