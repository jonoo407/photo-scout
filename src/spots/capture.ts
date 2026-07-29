/* Native photo capture (J3 phase 4, 2026-07-29).

   On the web, "Add your photo" is an `<input type="file">` and that is exactly
   the right control — the browser's own picker, with camera access where the
   device offers it.

   Inside the Capacitor wrapper the same input drops the user into the iOS
   document picker instead, which is worse (no camera, no recent photos) and is
   part of what makes an app read as a wrapped website. App Review guideline
   4.2 rejects those. Native therefore goes through @capacitor/camera, which
   presents the real iOS sheet: Take Photo / Choose from Library.

   Structured like src/geo/position.ts — a pure `*With(deps)` core that tests
   can drive, plus a thin binding to the real plugin at the bottom. */
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'

export interface CaptureDeps {
  isNative: boolean
  nativeGetPhoto: () => Promise<{ base64String?: string; format?: string }>
}

const MIME: Record<string, string> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
}

/** Base64 → File, so the result drops straight into the existing upload path
    (which compresses to ~1 MB before it touches the network). */
export function base64ToFile(base64: string, format: string, name: string): File {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const type = MIME[String(format).toLowerCase()] ?? 'image/jpeg'
  return new File([bytes], name, { type })
}

/* iOS reports a cancelled picker by THROWING, and the wording varies by
   version and by which sheet was dismissed. Someone who changed their mind has
   not hit an error, so none of these may surface as one. */
const CANCELLED = /cancel|no image (picked|selected)|denied access to photos/i
const PERMISSION = /permission|not authorized|unauthorized|restricted/i

/**
 * Capture a photo natively.
 * @returns the File, or null when there is nothing to upload — either the user
 *   cancelled, or we're on the web and the caller should use its file input.
 * @throws only for genuine failures worth showing someone.
 */
export async function capturePhotoWith(deps: CaptureDeps): Promise<File | null> {
  if (!deps.isNative) return null

  let photo: { base64String?: string; format?: string }
  try {
    photo = await deps.nativeGetPhoto()
  } catch (e) {
    const msg = String((e as Error)?.message ?? e)
    if (CANCELLED.test(msg)) return null
    if (PERMISSION.test(msg)) {
      throw new Error('Camera access is off — turn it on for Vantage in iOS Settings.')
    }
    throw new Error('Could not open the camera — try again.')
  }

  if (!photo?.base64String) return null
  const format = photo.format || 'jpeg'
  return base64ToFile(photo.base64String, format, `shot-${Date.now()}.${format}`)
}

/** Real wiring. Call sites use this; tests use capturePhotoWith. */
export function capturePhoto(): Promise<File | null> {
  return capturePhotoWith({
    isNative: Capacitor.isNativePlatform(),
    nativeGetPhoto: () => Camera.getPhoto({
      resultType: CameraResultType.Base64,
      // Prompt gives the native "Take Photo / Choose from Library" sheet —
      // the behaviour an iOS user expects, and it covers both needs with one
      // control rather than two buttons.
      source: CameraSource.Prompt,
      quality: 90,
      // The upload path compresses to ~1 MB anyway; capping here keeps the
      // base64 string (and therefore the webview bridge payload) sane.
      width: 2048,
      correctOrientation: true,
      promptLabelHeader: 'Add your shot',
      promptLabelPhoto: 'Choose from Library',
      promptLabelPicture: 'Take Photo',
    }),
  })
}

/** Whether the native capture path should be used at this call site. */
export function nativeCaptureAvailable(): boolean {
  return Capacitor.isNativePlatform()
}
