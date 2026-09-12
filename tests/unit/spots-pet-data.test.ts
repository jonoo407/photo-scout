import { describe, it, expect } from 'vitest'
import tampa from '../../src/data/spots/tampa-bay'
import philadelphia from '../../src/data/spots/philadelphia'

const SPOTS = [...tampa, ...philadelphia]

/* The pet-friendly filter (B16 / backlog V3) has shipped code since 2026-07:
   the `petFriendly` field, the Explore chip, the filter predicate and their
   tests all existed — but NOT ONE spot carried the data, so `hasPetData` was
   false everywhere and the chip never rendered for a single user.

   These tests are the thing that was missing: they fail unless every spot has
   an answer. Per docs/ADDING_SPOTS.md the answer must come from the venue's
   own rules, never from memory, so each spot also carries the short note that
   says what the rule actually is — "leashed, not on the beach" is a different
   answer from a flat yes, and the note is what a photographer standing at the
   gate needs. */

describe('pet-friendly dataset', () => {
  it('has an answer for every spot — no unknowns', () => {
    const missing = SPOTS.filter((s) => typeof s.petFriendly !== 'boolean').map((s) => s.id)
    expect(missing).toEqual([])
  })

  it('explains the rule for every spot', () => {
    const missing = SPOTS.filter((s) => !s.petNote?.trim()).map((s) => s.id)
    expect(missing).toEqual([])
  })

  it('keeps each note short enough for a fact chip', () => {
    const tooLong = SPOTS.filter((s) => (s.petNote ?? '').length > 80)
      .map((s) => `${s.id} (${s.petNote?.length})`)
    expect(tooLong).toEqual([])
  })

  it('writes notes as rules, not sentences', () => {
    // Chip text, so: no trailing period, and starts lower-case unless it is a
    // proper noun. Keeps the row from reading like prose crammed into a pill.
    const malformed = SPOTS.filter((s) => (s.petNote ?? '').endsWith('.')).map((s) => s.id)
    expect(malformed).toEqual([])
  })

  it('lights the Explore chip in BOTH regions', () => {
    // ExploreScreen only renders the chip when the CURRENT region has data
    // (`hasPetData`), so one region's coverage cannot carry the other.
    expect(tampa.some((s) => s.petFriendly !== undefined)).toBe(true)
    expect(philadelphia.some((s) => s.petFriendly !== undefined)).toBe(true)
  })

  it('has a realistic mix rather than a blanket answer', () => {
    // A dataset that is all-true or all-false is the signature of a guess.
    // Interiors (museums, cathedrals, transit halls) are service-animal-only;
    // public parks and waterfronts generally allow leashed dogs.
    const yes = SPOTS.filter((s) => s.petFriendly === true).length
    const no = SPOTS.filter((s) => s.petFriendly === false).length
    expect(yes).toBeGreaterThan(5)
    expect(no).toBeGreaterThan(5)
    expect(yes + no).toBe(SPOTS.length)
  })

  it('says no at every indoor subject', () => {
    // These are the spots whose photograph is INSIDE a building. Every one of
    // them is service-animals-only; if a future edit flips one to true it is
    // almost certainly a mistake, so pin them.
    for (const id of [
      'tampa-theatre', 'dali-museum', 'sacred-heart-catholic-church',
      'cathedral-st-peter-episcopal', 'cathedral-st-jude-apostle', 'henry-b-plant-museum',
      '30th-street-station', 'reading-terminal-market', 'cathedral-basilica-ss-peter-paul',
      'penn-museum', 'franklin-institute', 'fisher-fine-arts-library', 'masonic-temple',
    ]) {
      const spot = SPOTS.find((s) => s.id === id)
      expect(spot, `${id} should exist`).toBeTruthy()
      expect(spot!.petFriendly, `${id} is an indoor subject`).toBe(false)
    }
  })
})
