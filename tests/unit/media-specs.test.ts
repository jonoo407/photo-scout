import { describe, it, expect } from 'vitest'
import { mediaSpecs, cleanCredit } from '../../src/spots/media-specs'
import type { SpotMedia } from '../../src/spots/types'

const base: SpotMedia = { src: 'x.jpg', caption: 'c', credit: 'a', license: 'CC' }

describe('mediaSpecs', () => {
  it('formats a full spec line in shooting order', () => {
    expect(mediaSpecs({
      ...base, camera: 'Canon EOS R5', focalLengthMm: 24, fNumber: 8, shutter: '1/125', iso: 100,
    })).toBe('Canon EOS R5 · 24mm · f/8 · 1/125s · ISO 100')
  })

  it('keeps fractional apertures and long exposures readable', () => {
    expect(mediaSpecs({ ...base, fNumber: 2.8, shutter: '30' })).toBe('f/2.8 · 30s')
  })

  it('formats focal length alone (the already-seeded field)', () => {
    expect(mediaSpecs({ ...base, focalLengthMm: 200 })).toBe('200mm')
  })

  it('returns null when no specs exist', () => {
    expect(mediaSpecs(base)).toBeNull()
  })

  it('never doubles the s on a shutter given with units', () => {
    expect(mediaSpecs({ ...base, shutter: '1/250s' })).toBe('1/250s')
  })
})

describe('cleanCredit', () => {
  it('trims Wikimedia boilerplate down to the username', () => {
    expect(cleanCredit('Original uploader was user:Tampa Gator at en.wikipedia'))
      .toBe('user:Tampa Gator (en.wikipedia)')
  })
  it('leaves ordinary credits alone', () => {
    expect(cleanCredit('Ebyabe')).toBe('Ebyabe')
  })
})
