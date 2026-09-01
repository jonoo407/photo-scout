import { describe, it, expect } from 'vitest'
import { SCORE_EXPLAINER, SCORE_FACTORS } from '../../src/spots/score-explainer'
import { ALERT_SCORE } from '../../src/push/alert-rules'

/* The best-day score is a confident 0–100 with no visible provenance. The ⓘ
   explainer (Jon, 2026-09-01) stays high level — "a combination of factors
   including…" — but it must name every input scoreBestDay() actually uses, so
   the copy can't quietly drift from the arithmetic in src/spots/best-days.ts. */

describe('score explainer copy', () => {
  it('names every factor the scorer uses, once each', () => {
    const text = SCORE_FACTORS.map((f) => `${f.title} ${f.detail}`)
    const covers = (re: RegExp) => text.filter((t) => re.test(t)).length
    expect(covers(/sun.*(align|behind|line)/i)).toBe(1)
    expect(covers(/cloud|sky forecast/i)).toBe(1)
    expect(covers(/moon/i)).toBe(1)
    expect(covers(/tide/i)).toBe(1)
    expect(covers(/open|closed|hours/i)).toBe(1)
    expect(SCORE_FACTORS).toHaveLength(5)
  })

  it('every factor has a short title and a one-line detail', () => {
    for (const f of SCORE_FACTORS) {
      expect(f.title.length).toBeGreaterThan(2)
      expect(f.title.length).toBeLessThan(24)
      expect(f.detail.length).toBeGreaterThan(20)
      expect(f.detail.length).toBeLessThan(140)
    }
  })

  it('states the alert bar from the real constant, not a hardcoded number', () => {
    expect(SCORE_EXPLAINER.threshold).toContain(String(ALERT_SCORE))
    expect(SCORE_EXPLAINER.title).toMatch(/how the score works/i)
    expect(SCORE_EXPLAINER.intro).toMatch(/combination|blend|mix/i)
  })
})
