import { describe, it, expect, vi } from 'vitest'
import { capturePhotoWith, base64ToFile, type CaptureDeps } from '../../src/spots/capture'

/* Native photo capture (J3 phase 4).

   On the web, "Add your photo" is a file input and that is the right control.
   Inside the iOS wrapper a file input drops the user into the document picker
   rather than the camera, which is both worse and — per App Review guideline
   4.2 — part of what makes an app look like a wrapped website. Native goes
   through @capacitor/camera; the web path is untouched.

   Cancelling is not an error. iOS reports a cancelled picker as a thrown
   error, and surfacing "User cancelled photos app" to someone who simply
   changed their mind would be absurd. */

const PIXEL_B64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=='

const deps = (over: Partial<CaptureDeps> = {}): CaptureDeps => ({
  isNative: true,
  nativeGetPhoto: vi.fn(async () => ({ base64String: PIXEL_B64, format: 'jpeg' })),
  ...over,
})

describe('base64ToFile', () => {
  it('produces a real File with the right mime type', () => {
    const f = base64ToFile(PIXEL_B64, 'jpeg', 'shot.jpg')
    expect(f).toBeInstanceOf(File)
    expect(f.type).toBe('image/jpeg')
    expect(f.size).toBeGreaterThan(0)
  })

  it('maps png and heic formats rather than assuming jpeg', () => {
    expect(base64ToFile(PIXEL_B64, 'png', 'a.png').type).toBe('image/png')
    expect(base64ToFile(PIXEL_B64, 'heic', 'a.heic').type).toBe('image/heic')
  })

  it('falls back to jpeg for an unfamiliar format', () => {
    expect(base64ToFile(PIXEL_B64, 'weird', 'a.bin').type).toBe('image/jpeg')
  })
})

describe('capturePhotoWith', () => {
  it('returns a File from the native camera', async () => {
    const file = await capturePhotoWith(deps())
    expect(file).toBeInstanceOf(File)
    expect(file!.type).toBe('image/jpeg')
  })

  it('returns null on the web so the caller keeps its file input', async () => {
    const nativeGetPhoto = vi.fn()
    expect(await capturePhotoWith(deps({ isNative: false, nativeGetPhoto }))).toBeNull()
    expect(nativeGetPhoto).not.toHaveBeenCalled()
  })

  it('treats a cancelled picker as null, not an error', async () => {
    const nativeGetPhoto = vi.fn(async () => { throw new Error('User cancelled photos app') })
    expect(await capturePhotoWith(deps({ nativeGetPhoto }))).toBeNull()
  })

  it('recognises the other cancellation wordings iOS uses', async () => {
    for (const msg of ['No image picked', 'User denied access to photos', 'canceled']) {
      const nativeGetPhoto = vi.fn(async () => { throw new Error(msg) })
      await expect(capturePhotoWith(deps({ nativeGetPhoto }))).resolves.toBeNull()
    }
  })

  it('raises a permission problem, which is NOT a cancellation', async () => {
    const nativeGetPhoto = vi.fn(async () => { throw new Error('Camera permission was denied') })
    await expect(capturePhotoWith(deps({ nativeGetPhoto })))
      .rejects.toThrow(/iOS Settings/i)
  })

  it('raises anything else as a real failure', async () => {
    const nativeGetPhoto = vi.fn(async () => { throw new Error('disk full') })
    await expect(capturePhotoWith(deps({ nativeGetPhoto }))).rejects.toThrow(/could not/i)
  })

  it('returns null rather than an empty File when no data comes back', async () => {
    const nativeGetPhoto = vi.fn(async () => ({ base64String: undefined, format: 'jpeg' }))
    expect(await capturePhotoWith(deps({ nativeGetPhoto }))).toBeNull()
  })
})
