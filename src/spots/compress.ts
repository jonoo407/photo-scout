/* Upload compression (~1 MB target, feedback 2026-07-16). Phones hand us
   3-8 MB photos; storing them raw would burn the storage budget ~10x faster
   and slow every gallery. Downscale the longest side to 2048 px and walk a
   JPEG quality ladder until the file fits. Anything that can't be decoded
   (e.g. HEIC on non-Safari) passes through untouched — the bucket's 8 MB
   cap still guards the ceiling. */

export const TARGET_BYTES = 1_048_576
export const BYPASS_BYTES = 1_200_000
export const MAX_DIMENSION = 2048
export const QUALITY_LADDER = [0.85, 0.75, 0.65, 0.55] as const

export function targetScale(width: number, height: number, maxDim = MAX_DIMENSION): number {
  const longest = Math.max(width, height)
  return longest <= maxDim ? 1 : maxDim / longest
}

export function shouldBypass(file: File): boolean {
  return file.size <= BYPASS_BYTES
}

export async function compressImage(file: File): Promise<File> {
  if (shouldBypass(file)) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = targetScale(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()

    let out: Blob | null = null
    for (const q of QUALITY_LADDER) {
      out = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', q))
      if (out && out.size <= TARGET_BYTES) break
    }
    if (!out || out.size >= file.size) return file // never make things worse
    const name = `${file.name.replace(/\.\w+$/, '')}.jpg`
    return new File([out], name, { type: 'image/jpeg' })
  } catch {
    return file
  }
}
