import { FORMAT_MIME, sniffFormat, stripMetadata } from './strip-metadata'

/* Upload compression (~1 MB target, feedback 2026-07-16). Phones hand us
   3-8 MB photos; storing them raw would burn the storage budget ~10x faster
   and slow every gallery. Downscale the longest side to 2048 px and walk a
   JPEG quality ladder until the file fits. Anything that can't be decoded
   (e.g. HEIC on non-Safari) skips compression — the bucket's 8 MB cap still
   guards the ceiling.

   Compression is optional; metadata stripping is not. prepareUpload is the
   only way a file reaches the public bucket (see strip-metadata.ts). */

export const TARGET_BYTES = 1_048_576
export const BYPASS_BYTES = 1_200_000
export const MAX_DIMENSION = 2048
export const QUALITY_LADDER = [0.85, 0.75, 0.65, 0.55] as const

export class PhotoPrivacyError extends Error {
  constructor() {
    super("This photo's location data couldn't be removed, so it wasn't uploaded. Try a JPEG or PNG instead.")
    this.name = 'PhotoPrivacyError'
  }
}

export function targetScale(width: number, height: number, maxDim = MAX_DIMENSION): number {
  const longest = Math.max(width, height)
  return longest <= maxDim ? 1 : maxDim / longest
}

export function shouldBypass(file: File): boolean {
  return file.size <= BYPASS_BYTES
}

const jpegName = (file: File) => `${file.name.replace(/\.\w+$/, '')}.jpg`

/** Decode, downscale and re-encode as JPEG. The canvas carries pixels only,
    so the output has no EXIF/XMP; orientation is baked into the pixels at
    decode time. Null when the browser can't decode the file. */
async function reencode(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = targetScale(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    let out: Blob | null = null
    for (const q of QUALITY_LADDER) {
      out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', q))
      if (out && out.size <= TARGET_BYTES) break
    }
    return out
  } catch {
    return null
  }
}

export async function compressImage(file: File): Promise<File> {
  if (shouldBypass(file)) return file
  const out = await reencode(file)
  if (!out || out.size >= file.size) return file // never make things worse
  return new File([out], jpegName(file), { type: 'image/jpeg' })
}

/** A metadata-free copy, or null when the format can't be scrubbed. */
export async function stripFileMetadata(file: File): Promise<File | null> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const format = sniffFormat(bytes)
  const clean = stripMetadata(bytes)
  if (!format || !clean) return null
  return new File([clean], file.name, { type: FORMAT_MIME[format] })
}

/** Everything bound for the public bucket goes through here: compressed when
    worthwhile, and ALWAYS stripped of EXIF/GPS, XMP, IPTC and comments —
    whatever the size. A photo that can be neither scrubbed nor re-encoded
    (HEIC off Safari) is refused rather than uploaded with its location. */
export async function prepareUpload(file: File): Promise<File> {
  const clean = await stripFileMetadata(await compressImage(file))
  if (clean) return clean
  const reencoded = await reencode(file)
  if (reencoded) return new File([reencoded], jpegName(file), { type: 'image/jpeg' })
  throw new PhotoPrivacyError()
}
