import { describe, it, expect } from 'vitest'
import { hasGoodToKnow } from '../../src/spots/good-to-know'
import type { Spot } from '../../src/spots/types'

/* "Good to know" on the spot page (tester report, build 15): the heading
   rendered unconditionally, so spots with no logistics data showed a title
   over an empty box. The section must earn its heading. */

const bare = {
  craft: {},
} as unknown as Spot

const withField = (patch: object, craft: object = {}) =>
  ({ ...bare, ...patch, craft } as unknown as Spot)

describe('hasGoodToKnow', () => {
  it('is false for a spot with nothing to say', () => {
    expect(hasGoodToKnow(bare)).toBe(false)
  })

  it('is true for each individual fact the section can render', () => {
    expect(hasGoodToKnow(withField({ logistics: { parking: { label: 'Lot on 3rd' } } }))).toBe(true)
    expect(hasGoodToKnow(withField({ logistics: { restrooms: true } }))).toBe(true)
    expect(hasGoodToKnow(withField({ logistics: { crowdTiming: 'Quiet before 8am' } }))).toBe(true)
    expect(hasGoodToKnow(withField({ logistics: { dressCode: 'Modest dress required' } }))).toBe(true)
    expect(hasGoodToKnow(withField({ feeNote: '$5 parking' }))).toBe(true)
    expect(hasGoodToKnow(withField({ phone: '+1 813 555 0100' }))).toBe(true)
    expect(hasGoodToKnow(withField({ caveats: 'Closes at dusk' }))).toBe(true)
    expect(hasGoodToKnow(withField({}, { accessTips: 'Enter from the pier side' }))).toBe(true)
  })

  it('is false when logistics exists but is empty', () => {
    expect(hasGoodToKnow(withField({ logistics: {} }))).toBe(false)
  })

  it('treats restrooms: false as nothing to say', () => {
    expect(hasGoodToKnow(withField({ logistics: { restrooms: false } }))).toBe(false)
  })
})
