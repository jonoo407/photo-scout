import type { BestDay } from '../spots/best-days'

/* Shared by the app and the Cloudflare Worker cron — keep dependency-free
   beyond types so it bundles anywhere. */

/** Minimum best-day score that counts as an alert-worthy evening. */
export const ALERT_SCORE = 75

/**
 * Alert only on days the forecast actually contributed: sun/moon geometry
 * repeats every year, but photographers pay for knowing the SKY will play
 * along (this is the whole product Cascable charges yearly for).
 */
export function shouldAlert(day: BestDay): boolean {
  return day.open && day.forecast && day.score >= ALERT_SCORE
}

export interface AlertPayload {
  title: string
  body: string
  /** App-relative deep link, hash-router style. */
  url: string
}

export function alertMessage(spotName: string, spotId: string, day: BestDay): AlertPayload {
  return {
    title: `${spotName} lines up tonight`,
    body: `${day.reasons.join(' · ') || 'Conditions look strong'} — score ${day.score}`,
    url: `/#/spot/${spotId}`,
  }
}
