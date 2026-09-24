import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import {
  stripMetadata, stripJpeg, sniffFormat, readOrientation, orientationTiff,
} from '../../src/spots/strip-metadata'
import {
  taggedPhoto, ifd0Tags, latin1, OWNER, MODEL, TAG_GPS_IFD, TAG_ORIENTATION, type PhotoFormat,
} from '../helpers/photos'

/* The spot-photos bucket is public, so an upload's EXIF GPS is anyone's to
   read. These run the scrubber over real sharp-encoded photos and check with
   an independent decoder (libvips) that the location and identity are gone
   while the pixels, colour profile and orientation survive. */

const rawPixels = async (bytes: Uint8Array) => sharp(bytes).raw().toBuffer()

describe.each<PhotoFormat>(['jpeg', 'png', 'webp'])('stripMetadata on a %s', (format) => {
  it('starts from a fixture that really leaks location and identity', async () => {
    const photo = await taggedPhoto(format)
    const meta = await sharp(photo).metadata()
    expect(ifd0Tags(meta.exif!)).toContain(TAG_GPS_IFD)
    expect(meta.xmp).toBeDefined()
    expect(latin1(photo)).toContain(OWNER)
    expect(latin1(photo)).toContain(MODEL)
  })

  it('removes GPS, camera, owner and XMP metadata', async () => {
    const clean = stripMetadata(await taggedPhoto(format))!
    expect(clean).not.toBeNull()
    const meta = await sharp(clean).metadata()
    expect(meta.xmp).toBeUndefined()
    expect(ifd0Tags(meta.exif!)).toEqual([TAG_ORIENTATION])
    for (const leak of [OWNER, MODEL, 'Apple', 'xmpmeta']) expect(latin1(clean)).not.toContain(leak)
  })

  it('keeps orientation, the ICC profile, and every pixel', async () => {
    const photo = await taggedPhoto(format)
    const clean = stripMetadata(photo)!
    const [before, after] = await Promise.all([sharp(photo).metadata(), sharp(clean).metadata()])
    expect(after.orientation).toBe(6)
    expect(after.icc).toBeDefined()
    expect([after.width, after.height]).toEqual([before.width, before.height])
    expect((await rawPixels(clean)).equals(await rawPixels(photo))).toBe(true)
    expect(clean.length).toBeLessThan(photo.length)
  })

  it('drops EXIF entirely when orientation is the default', async () => {
    const clean = stripMetadata(await taggedPhoto(format, 1))!
    const meta = await sharp(clean).metadata()
    expect(meta.exif).toBeUndefined()
    expect(meta.orientation ?? 1).toBe(1)
  })

  it('is idempotent', async () => {
    const once = stripMetadata(await taggedPhoto(format))!
    expect(stripMetadata(once)).toEqual(once)
  })
})

describe('stripJpeg', () => {
  const segment = (marker: number, text: string) => {
    const body = new TextEncoder().encode(text)
    return new Uint8Array([0xff, marker, (body.length + 2) >> 8, (body.length + 2) & 0xff, ...body])
  }
  const splice = (jpeg: Uint8Array, ...parts: Uint8Array[]) =>
    new Uint8Array([...jpeg.subarray(0, 2), ...parts.flatMap((p) => [...p]), ...jpeg.subarray(2)])

  it('drops comments, IPTC and MPF segments', async () => {
    const jpeg = splice(
      await taggedPhoto('jpeg'),
      segment(0xfe, `shot by ${OWNER}`),
      segment(0xed, `Photoshop 3.0\0IPTC ${OWNER}`),
      segment(0xe2, 'MPF\0secondary images'),
    )
    const clean = stripJpeg(jpeg)!
    expect(latin1(clean)).not.toContain(OWNER)
    expect(latin1(clean)).not.toContain('MPF')
    expect((await rawPixels(clean)).equals(await rawPixels(jpeg))).toBe(true)
  })

  it('cuts whatever trails the primary image (iPhone gain/depth maps)', async () => {
    const photo = await taggedPhoto('jpeg')
    const trailing = await taggedPhoto('jpeg') // a second JPEG, own EXIF and all
    const clean = stripJpeg(new Uint8Array([...photo, ...trailing]))!
    expect(latin1(clean)).not.toContain(OWNER)
    expect(clean.subarray(-2)).toEqual(new Uint8Array([0xff, 0xd9]))
  })

  it('places the orientation EXIF after JFIF so the file stays conformant', async () => {
    const jfif = splice(await taggedPhoto('jpeg', 8), segment(0xe0, 'JFIF\0\x01\x01\0\0\x01\0\x01\0\0'))
    const clean = stripJpeg(jfif)!
    expect([clean[2], clean[3]]).toEqual([0xff, 0xe0]) // APP0 straight after SOI, as JFIF requires
    const exifAt = 4 + ((clean[4] << 8) | clean[5])
    expect([clean[exifAt], clean[exifAt + 1]]).toEqual([0xff, 0xe1])
    expect((await sharp(clean).metadata()).orientation).toBe(8)
  })
})

describe('refuses what it cannot vouch for', () => {
  it('returns null for formats it does not parse (HEIC, GIF, junk)', () => {
    const heic = new Uint8Array([0, 0, 0, 0x18, ...new TextEncoder().encode('ftypheic'), 0, 0, 0, 0])
    expect(sniffFormat(heic)).toBeNull()
    expect(stripMetadata(heic)).toBeNull()
    expect(stripMetadata(new TextEncoder().encode('GIF89a...'))).toBeNull()
    expect(stripMetadata(new Uint8Array())).toBeNull()
  })

  it.each<PhotoFormat>(['jpeg', 'png', 'webp'])('returns null for a truncated %s', async (format) => {
    const photo = await taggedPhoto(format)
    expect(stripMetadata(photo.subarray(0, Math.floor(photo.length * 0.6)))).toBeNull()
  })
})

describe('readOrientation', () => {
  it('reads both byte orders and defaults to 1 on anything odd', () => {
    expect(readOrientation(orientationTiff(6))).toBe(6)
    const little = new Uint8Array([0x49, 0x49, 42, 0, 8, 0, 0, 0, 1, 0, 0x12, 0x01, 3, 0, 1, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0])
    expect(readOrientation(little)).toBe(3)
    expect(readOrientation(new Uint8Array([...new TextEncoder().encode('Exif\0\0'), ...little]))).toBe(3)
    expect(readOrientation(orientationTiff(42))).toBe(1)
    expect(readOrientation(new Uint8Array([1, 2, 3]))).toBe(1)
  })
})
