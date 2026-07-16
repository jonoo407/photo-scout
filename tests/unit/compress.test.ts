import { describe, it, expect } from 'vitest'
import {
  targetScale, shouldBypass, compressImage,
  MAX_DIMENSION, TARGET_BYTES, BYPASS_BYTES,
} from '../../src/spots/compress'

/* Upload compression (~1 MB, feedback 2026-07-16): phones hand us 3-8 MB
   HEIC/JPEG; we downscale to <=2048px and walk a JPEG quality ladder until
   the file fits. Pure math tested here; the canvas pipeline is verified in a
   real browser (jsdom has no canvas). */

describe('targetScale', () => {
  it('leaves small images alone and scales the longest side to the cap', () => {
    expect(targetScale(1200, 800)).toBe(1)
    expect(targetScale(MAX_DIMENSION, MAX_DIMENSION)).toBe(1)
    expect(targetScale(4096, 3072)).toBeCloseTo(MAX_DIMENSION / 4096)
    expect(targetScale(3000, 6000)).toBeCloseTo(MAX_DIMENSION / 6000)
  })
})

describe('shouldBypass', () => {
  it('skips work for files already near the target', () => {
    expect(shouldBypass(new File([new ArrayBuffer(500_000)], 'a.jpg'))).toBe(true)
    expect(shouldBypass(new File([new ArrayBuffer(BYPASS_BYTES + 1)], 'b.jpg'))).toBe(false)
    expect(TARGET_BYTES).toBeLessThanOrEqual(BYPASS_BYTES)
  })
})

describe('compressImage', () => {
  it('returns the original file when the image cannot be decoded (e.g. HEIC on Chrome)', async () => {
    // jsdom has no createImageBitmap — exactly the decode-failure path.
    const big = new File([new ArrayBuffer(3_000_000)], 'shot.heic', { type: 'image/heic' })
    expect(await compressImage(big)).toBe(big)
  })

  it('passes small files straight through', async () => {
    const small = new File(['x'], 'small.jpg', { type: 'image/jpeg' })
    expect(await compressImage(small)).toBe(small)
  })
})
