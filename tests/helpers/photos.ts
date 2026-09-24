import sharp from 'sharp'

/* Real encoded photos carrying the metadata a phone attaches: GPS, camera
   make/model, the owner's name (EXIF and XMP), an ICC profile, and an
   Orientation tag. Built with sharp so the files are genuine, decodable
   images rather than hand-rolled byte soup. */

export type PhotoFormat = 'jpeg' | 'png' | 'webp'

export const OWNER = 'Jane Doe'
export const MODEL = 'iPhone 15 Pro'
const XMP = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>${OWNER}</dc:creator></rdf:Description></rdf:RDF></x:xmpmeta>`

export const TAG_GPS_IFD = 0x8825
export const TAG_ORIENTATION = 0x0112

export async function taggedPhoto(format: PhotoFormat, orientation = 6): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await sharp({ create: { width: 48, height: 32, channels: 3, background: { r: 200, g: 90, b: 30 } } })
    .withExif({
      IFD0: { Make: 'Apple', Model: MODEL, Artist: OWNER },
      IFD3: {
        GPSLatitudeRef: 'N', GPSLatitude: '27/1 57/1 1234/100',
        GPSLongitudeRef: 'W', GPSLongitude: '82/1 27/1 3000/100',
      },
    })
    .withMetadata({ orientation })
    .withXmp(XMP)
    .keepIccProfile()
    .toFormat(format)
    .toBuffer()
  return new Uint8Array(buf)
}

/** Tag ids in IFD0 of an EXIF block (with or without the "Exif\0\0" prefix). */
export function ifd0Tags(exif: Uint8Array): number[] {
  const start = String.fromCharCode(...exif.subarray(0, 4)) === 'Exif' ? 6 : 0
  const view = new DataView(exif.buffer, exif.byteOffset + start, exif.byteLength - start)
  const little = view.getUint8(0) === 0x49
  const ifd = view.getUint32(4, little)
  const count = view.getUint16(ifd, little)
  return Array.from({ length: count }, (_, i) => view.getUint16(ifd + 2 + i * 12, little))
}

export const latin1 = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1')
