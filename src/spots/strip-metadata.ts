/* Metadata scrubbing for community uploads. The `spot-photos` bucket is
   public, and a phone photo's EXIF carries GPS coordinates (often the
   photographer's home), camera serials, owner names and timestamps — so no
   upload may reach it with any of that attached.

   Byte-level and lossless: the pixels are untouched, only metadata blocks are
   dropped. The one EXIF field worth keeping is Orientation (otherwise a
   portrait shot shows up sideways), so when the original had a non-default
   value it comes back as a fresh, single-tag EXIF block.

   Returns null for anything it cannot parse with confidence (unknown format,
   truncated file); callers must then re-encode or refuse, never upload the
   original. */

export type ScrubbableFormat = 'jpeg' | 'png' | 'webp'

export const FORMAT_MIME: Record<ScrubbableFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

const ascii = (bytes: Uint8Array, start: number, text: string): boolean => {
  if (start + text.length > bytes.length) return false
  for (let i = 0; i < text.length; i++) if (bytes[start + i] !== text.charCodeAt(i)) return false
  return true
}

const concat = (parts: Uint8Array[]): Uint8Array<ArrayBuffer> => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let at = 0
  for (const p of parts) { out.set(p, at); at += p.length }
  return out
}

export function sniffFormat(bytes: Uint8Array): ScrubbableFormat | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (ascii(bytes, 0, '\x89PNG\r\n\x1a\n')) return 'png'
  if (ascii(bytes, 0, 'RIFF') && ascii(bytes, 8, 'WEBP')) return 'webp'
  return null
}

/* ── EXIF Orientation ─────────────────────────────────────────────────── */

const EXIF_HEADER = 'Exif\0\0'
const TAG_ORIENTATION = 0x0112

/** Orientation (1-8) from a TIFF block — the body of an EXIF segment. 1
    ("as stored") for anything missing or malformed. */
export function readOrientation(tiff: Uint8Array): number {
  if (ascii(tiff, 0, EXIF_HEADER)) tiff = tiff.subarray(EXIF_HEADER.length)
  if (tiff.length < 8) return 1
  const little = ascii(tiff, 0, 'II')
  if (!little && !ascii(tiff, 0, 'MM')) return 1
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength)
  if (view.getUint16(2, little) !== 42) return 1
  const ifd = view.getUint32(4, little)
  if (ifd + 2 > tiff.length) return 1
  const count = view.getUint16(ifd, little)
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12
    if (entry + 12 > tiff.length) return 1
    if (view.getUint16(entry, little) !== TAG_ORIENTATION) continue
    const value = view.getUint16(entry + 8, little)
    return value >= 1 && value <= 8 ? value : 1
  }
  return 1
}

/** A TIFF block holding nothing but IFD0 → Orientation. */
export function orientationTiff(orientation: number): Uint8Array {
  const tiff = new Uint8Array(26)
  const view = new DataView(tiff.buffer)
  tiff.set([0x4d, 0x4d]) // "MM", big-endian
  view.setUint16(2, 42)
  view.setUint32(4, 8) // IFD0 right after the header
  view.setUint16(8, 1) // one entry
  view.setUint16(10, TAG_ORIENTATION)
  view.setUint16(12, 3) // SHORT
  view.setUint32(14, 1) // count
  view.setUint16(18, orientation)
  view.setUint32(22, 0) // no next IFD — so no thumbnail either
  return tiff
}

/* ── JPEG ─────────────────────────────────────────────────────────────── */

const SOI = 0xd8, EOI = 0xd9, SOS = 0xda, APP0 = 0xe0, APP1 = 0xe1, APP2 = 0xe2, APP14 = 0xee

/** Which APPn/COM segments survive: JFIF (APP0), the ICC colour profile
    (APP2) and Adobe's colour-transform flag (APP14) all change how pixels
    decode. Everything else — EXIF and XMP (APP1), MPF/FlashPix (APP2),
    Photoshop/IPTC (APP13), comments — is dropped. */
function keepJpegSegment(marker: number, body: Uint8Array): boolean {
  if (marker === 0xfe) return false // COM
  if (marker < APP0 || marker > 0xef) return true // not metadata: tables, frame headers, …
  if (marker === APP0) return ascii(body, 0, 'JFIF\0')
  if (marker === APP2) return ascii(body, 0, 'ICC_PROFILE\0')
  if (marker === APP14) return ascii(body, 0, 'Adobe')
  return false
}

export function stripJpeg(bytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  if (bytes[0] !== 0xff || bytes[1] !== SOI) return null
  const out: Uint8Array[] = [bytes.subarray(0, 2)]
  let exifAt = 1 // EXIF goes straight after SOI, or after JFIF when present
  let orientation = 1
  let pos = 2

  while (pos < bytes.length) {
    if (bytes[pos] !== 0xff) return null
    while (bytes[pos] === 0xff) pos++ // fill bytes
    const marker = bytes[pos++]
    if (marker === undefined) return null
    if (marker === EOI) {
      // Stop at the primary image's end: iPhones append MPF secondaries (gain
      // and depth maps) after it, and those carry metadata of their own.
      out.push(new Uint8Array([0xff, EOI]))
      if (orientation !== 1) {
        const tiff = orientationTiff(orientation)
        const seg = new Uint8Array(4 + EXIF_HEADER.length + tiff.length)
        seg.set([0xff, APP1, (seg.length - 2) >> 8, (seg.length - 2) & 0xff])
        for (let i = 0; i < EXIF_HEADER.length; i++) seg[4 + i] = EXIF_HEADER.charCodeAt(i)
        seg.set(tiff, 4 + EXIF_HEADER.length)
        out.splice(exifAt, 0, seg)
      }
      return concat(out)
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      out.push(new Uint8Array([0xff, marker])) // standalone, no length
      continue
    }
    if (pos + 2 > bytes.length) return null
    const length = (bytes[pos] << 8) | bytes[pos + 1]
    const end = pos + length
    if (length < 2 || end > bytes.length) return null
    const body = bytes.subarray(pos + 2, end)
    const segment = bytes.subarray(pos - 2, end)

    if (marker === APP1 && ascii(body, 0, EXIF_HEADER) && orientation === 1) {
      orientation = readOrientation(body)
    }
    if (keepJpegSegment(marker, body)) {
      out.push(segment)
      if (marker === APP0 && out.length === 2) exifAt = 2
    }
    pos = end

    if (marker === SOS) {
      // Entropy-coded data runs until the next real marker; 0xFF00 is an
      // escaped data byte and RSTn markers belong to the scan.
      const scanStart = pos
      while (pos + 1 < bytes.length) {
        if (bytes[pos] === 0xff) {
          const next = bytes[pos + 1]
          if (next !== 0x00 && next !== 0xff && !(next >= 0xd0 && next <= 0xd7)) break
        }
        pos++
      }
      if (pos + 1 >= bytes.length) return null // truncated: no EOI
      out.push(bytes.subarray(scanStart, pos))
    }
  }
  return null
}

/* ── PNG ──────────────────────────────────────────────────────────────── */

/** Chunks that affect decoding (including colour and APNG animation). Text
    (tEXt/zTXt/iTXt — where XMP lives), eXIf, tIME and anything unknown go. */
const PNG_KEEP = new Set([
  'IHDR', 'PLTE', 'IDAT', 'IEND', 'tRNS', 'gAMA', 'cHRM', 'sRGB', 'iCCP', 'cICP',
  'mDCV', 'cLLI', 'sBIT', 'bKGD', 'pHYs', 'hIST', 'sPLT', 'acTL', 'fcTL', 'fdAT',
])

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(12 + data.length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) chunk[4 + i] = type.charCodeAt(i)
  chunk.set(data, 8)
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))
  return chunk
}

export function stripPng(bytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  if (sniffFormat(bytes) !== 'png') return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const out: Uint8Array[] = [bytes.subarray(0, 8)]
  let pos = 8
  while (pos + 12 <= bytes.length) {
    const length = view.getUint32(pos)
    const end = pos + 12 + length
    if (end > bytes.length) return null
    const type = String.fromCharCode(...bytes.subarray(pos + 4, pos + 8))
    if (type === 'eXIf') {
      const orientation = readOrientation(bytes.subarray(pos + 8, pos + 8 + length))
      if (orientation !== 1) out.push(pngChunk('eXIf', orientationTiff(orientation)))
    } else if (PNG_KEEP.has(type)) {
      out.push(bytes.subarray(pos, end))
    }
    pos = end
    if (type === 'IEND') return concat(out)
  }
  return null
}

/* ── WebP ─────────────────────────────────────────────────────────────── */

const WEBP_KEEP = new Set(['VP8 ', 'VP8L', 'VP8X', 'ALPH', 'ANIM', 'ANMF', 'ICCP'])
const VP8X_EXIF = 0x08, VP8X_XMP = 0x04

function riffChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(8 + data.length + (data.length & 1))
  for (let i = 0; i < 4; i++) chunk[i] = type.charCodeAt(i)
  new DataView(chunk.buffer).setUint32(4, data.length, true)
  chunk.set(data, 8)
  return chunk
}

export function stripWebp(bytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  if (sniffFormat(bytes) !== 'webp') return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const end = Math.min(bytes.length, 8 + view.getUint32(4, true))
  const chunks: Uint8Array[] = []
  let vp8x: Uint8Array | null = null
  let orientation = 1
  let pos = 12
  while (pos + 8 <= end) {
    const type = String.fromCharCode(...bytes.subarray(pos, pos + 4))
    const size = view.getUint32(pos + 4, true)
    const next = pos + 8 + size + (size & 1)
    if (pos + 8 + size > end) return null
    if (type === 'EXIF') {
      orientation = readOrientation(bytes.subarray(pos + 8, pos + 8 + size))
    } else if (WEBP_KEEP.has(type)) {
      // Copied, not sliced: the VP8X flags byte gets rewritten below.
      const chunk = bytes.slice(pos, Math.min(next, end))
      if (type === 'VP8X') vp8x = chunk
      chunks.push(chunk)
    }
    pos = next
  }
  if (chunks.length === 0) return null
  if (vp8x) {
    vp8x[8] &= ~(VP8X_EXIF | VP8X_XMP)
    if (orientation !== 1) {
      vp8x[8] |= VP8X_EXIF
      chunks.push(riffChunk('EXIF', orientationTiff(orientation)))
    }
  }
  const body = concat(chunks)
  const header = new Uint8Array(12)
  header.set(bytes.subarray(0, 12))
  new DataView(header.buffer).setUint32(4, 4 + body.length, true)
  return concat([header, body])
}

/** Metadata-free copy of a JPEG, PNG or WebP; null when the bytes are not one
    of those or cannot be parsed safely. */
export function stripMetadata(bytes: Uint8Array): Uint8Array<ArrayBuffer> | null {
  switch (sniffFormat(bytes)) {
    case 'jpeg': return stripJpeg(bytes)
    case 'png': return stripPng(bytes)
    case 'webp': return stripWebp(bytes)
    default: return null
  }
}
