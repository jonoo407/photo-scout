import { describe, it, expect, vi, afterEach } from 'vitest'
import sharp from 'sharp'
import {
  targetScale, shouldBypass, compressImage, prepareUpload, PhotoPrivacyError,
  MAX_DIMENSION, TARGET_BYTES, BYPASS_BYTES,
} from '../../src/spots/compress'
import { taggedPhoto, ifd0Tags, latin1, OWNER, TAG_GPS_IFD, TAG_ORIENTATION } from '../helpers/photos'

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

/* Privacy (not size) is the point here: the bucket is public, and anything
   under BYPASS_BYTES used to skip the canvas and upload with its GPS intact. */
describe('prepareUpload', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

  const bytesOf = async (file: File) => new Uint8Array(await file.arrayBuffer())
  const stubDecoder = (blob: Blob | null) => {
    const decode = vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() }))
    vi.stubGlobal('createImageBitmap', decode)
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => tag === 'canvas'
      ? { width: 0, height: 0, getContext: () => ({ drawImage: vi.fn() }), toBlob: (cb: (b: Blob | null) => void) => cb(blob) }
      : document.createElementNS('http://www.w3.org/1999/xhtml', tag)) as never)
    return decode
  }

  it.each(['jpeg', 'png', 'webp'] as const)('strips GPS from a small %s without re-encoding it', async (format) => {
    const decode = vi.fn()
    vi.stubGlobal('createImageBitmap', decode)
    const photo = new File([await taggedPhoto(format)], `shot.${format}`, { type: `image/${format}` })
    expect(shouldBypass(photo)).toBe(true)

    const out = await prepareUpload(photo)
    const meta = await sharp(await bytesOf(out)).metadata()
    expect(ifd0Tags(meta.exif!)).not.toContain(TAG_GPS_IFD)
    expect(ifd0Tags(meta.exif!)).toEqual([TAG_ORIENTATION])
    expect(meta.orientation).toBe(6)
    expect(latin1(await bytesOf(out))).not.toContain(OWNER)
    expect(out.type).toBe(`image/${format}`)
    expect(out.name).toBe(photo.name)
    expect(decode).not.toHaveBeenCalled() // lossless path, no quality hit
  })

  it('strips a large photo that compression could not shrink', async () => {
    const photo = await taggedPhoto('jpeg')
    const big = new File([photo, new Uint8Array(BYPASS_BYTES)], 'big.jpg', { type: 'image/jpeg' })
    stubDecoder(new Blob([new Uint8Array(BYPASS_BYTES * 2)])) // re-encode comes out bigger
    const out = await prepareUpload(big)
    expect(latin1(await bytesOf(out))).not.toContain(OWNER)
    expect((await sharp(await bytesOf(out)).metadata()).orientation).toBe(6)
  })

  it('re-encodes a format it cannot scrub (HEIC on Safari) at any size', async () => {
    const decode = stubDecoder(new Blob([await sharp(await taggedPhoto('jpeg', 1)).jpeg().toBuffer()]))
    const heic = new File([new Uint8Array(4000)], 'IMG_0001.HEIC', { type: 'image/heic' })
    const out = await prepareUpload(heic)
    expect(decode).toHaveBeenCalledWith(heic, { imageOrientation: 'from-image' })
    expect(out.type).toBe('image/jpeg')
    expect(out.name).toBe('IMG_0001.jpg')
  })

  it('refuses — never uploads raw — what it can neither scrub nor decode', async () => {
    const heic = new File([new Uint8Array(4000)], 'IMG_0001.HEIC', { type: 'image/heic' })
    await expect(prepareUpload(heic)).rejects.toBeInstanceOf(PhotoPrivacyError)
    await expect(prepareUpload(heic)).rejects.toThrow(/location/)
  })
})
