import { ALERT_SCORE } from '../push/alert-rules'

/* Plain-language provenance for the best-day score (Jon, 2026-09-01: "a
   little ⓘ … high level … a combination of factors including…").

   Deliberately NOT the arithmetic — that lives in src/spots/best-days.ts and
   would date this copy the first time a weight moved. But every input the
   scorer uses is named here, and tests/unit/score-explainer.test.ts holds the
   two in step. */

export interface ScoreFactor {
  title: string
  detail: string
}

export const SCORE_FACTORS: ScoreFactor[] = [
  {
    title: 'Sun alignment',
    detail: 'Whether the sun sits behind the subject at golden hour — the biggest single factor.',
  },
  {
    title: 'Sky forecast',
    detail: 'Mid and high cloud catch colour; low cloud and haze block it. Forecasts cover the next ~16 days.',
  },
  {
    title: 'Moon',
    detail: 'A full moon rising at blue hour is a bonus; for night spots, dark skies are.',
  },
  {
    title: 'Tide',
    detail: 'Coastal spots score higher when low tide falls near golden hour.',
  },
  {
    title: 'Open hours',
    detail: 'A spot that’s closed at its prime window scores near zero, whatever the sky is doing.',
  },
]

export const SCORE_EXPLAINER = {
  title: 'How the score works',
  intro: 'A 0–100 blend of a few factors at this spot’s prime light window:',
  threshold: `${ALERT_SCORE} and up is the bar for a Conditions alert; 55–74 is worth a look.`,
}
