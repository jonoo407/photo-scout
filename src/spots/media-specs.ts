import type { SpotMedia } from './types'

/**
 * One-line photo specs for a reference shot, in shooting order:
 * "Canon EOS R5 · 24mm · f/8 · 1/125s · ISO 100". Parts are optional and
 * skipped when absent; null when the photo has no specs at all.
 */
export function mediaSpecs(m: SpotMedia): string | null {
  const parts: string[] = []
  if (m.camera) parts.push(m.camera)
  if (m.focalLengthMm != null) parts.push(`${m.focalLengthMm}mm`)
  if (m.fNumber != null) parts.push(`f/${m.fNumber}`)
  if (m.shutter) parts.push(m.shutter.endsWith('s') ? m.shutter : `${m.shutter}s`)
  if (m.iso != null) parts.push(`ISO ${m.iso}`)
  return parts.length ? parts.join(' · ') : null
}
