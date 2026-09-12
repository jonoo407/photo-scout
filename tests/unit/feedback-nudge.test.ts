import { describe, it, expect } from 'vitest'
import {
  shouldPromptForFeedback, MIN_SESSIONS, COOLDOWN_DAYS, type NudgeState,
} from '../../src/feedback/nudge'

/* The ask-for-feedback nudge (backlog V2b). The constraints are the whole
   feature — a prompt that is easy to write is also easy to make obnoxious:
     · never during onboarding,
     · not until someone has actually used the app (3+ sessions),
     · at most once every 30 days per device,
     · and BOTH answering and dismissing reset the clock, so saying yes is
       never punished with another ask sooner than saying no.
   All dates here are fixed — a nudge test that drifts with the wall clock is
   a nudge test that fails on the 31st of the month. */

const BASE: NudgeState = { sessions: 5, feedbackPromptAt: null, introSeen: true }
const NOW = new Date('2026-09-12T12:00:00Z')
const daysBefore = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString()

describe('feedback nudge', () => {
  it('asks a settled-in user who has never been asked', () => {
    expect(shouldPromptForFeedback(BASE, NOW)).toBe(true)
  })

  it('never asks during onboarding', () => {
    expect(shouldPromptForFeedback({ ...BASE, introSeen: false }, NOW)).toBe(false)
  })

  it('waits until the app has actually been used', () => {
    expect(shouldPromptForFeedback({ ...BASE, sessions: MIN_SESSIONS - 1 }, NOW)).toBe(false)
    expect(shouldPromptForFeedback({ ...BASE, sessions: MIN_SESSIONS }, NOW)).toBe(true)
  })

  it('stays quiet for the whole cooldown, then asks again', () => {
    expect(shouldPromptForFeedback({ ...BASE, feedbackPromptAt: daysBefore(1) }, NOW)).toBe(false)
    expect(shouldPromptForFeedback(
      { ...BASE, feedbackPromptAt: daysBefore(COOLDOWN_DAYS - 1) }, NOW,
    )).toBe(false)
    expect(shouldPromptForFeedback(
      { ...BASE, feedbackPromptAt: daysBefore(COOLDOWN_DAYS) }, NOW,
    )).toBe(true)
  })

  it('is at least a month — a "cooldown" of days would be nagging', () => {
    expect(COOLDOWN_DAYS).toBeGreaterThanOrEqual(30)
  })

  it('survives a garbage timestamp rather than nagging every launch', () => {
    // A corrupt persisted value must not read as "never asked".
    expect(shouldPromptForFeedback({ ...BASE, feedbackPromptAt: 'not-a-date' }, NOW)).toBe(false)
  })

  it('does not ask a user whose clock is behind the stored stamp', () => {
    // Travel, DST, a device clock reset: a future stamp is not an invitation.
    expect(shouldPromptForFeedback(
      { ...BASE, feedbackPromptAt: new Date(NOW.getTime() + 86400000).toISOString() }, NOW,
    )).toBe(false)
  })
})
