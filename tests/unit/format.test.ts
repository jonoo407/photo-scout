import { describe, it, expect } from 'vitest'
import { fmtDrive } from '../../src/util/format'

describe('fmtDrive', () => {
  it('never shows a bare "0 min" (spots at your doorstep read "under 1 min")', () => {
    expect(fmtDrive(0)).toBe('under 1 min')
    expect(fmtDrive(-2)).toBe('under 1 min')
  })
  it('shows the minutes otherwise', () => {
    expect(fmtDrive(1)).toBe('1 min')
    expect(fmtDrive(28)).toBe('28 min')
  })
})
