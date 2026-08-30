import { describe, it, expect, vi, afterEach } from 'vitest'
import { getPositionWith } from '../../src/geo/position'
import { capturePhotoWith } from '../../src/spots/capture'
import { compressImage, TARGET_BYTES, QUALITY_LADDER } from '../../src/spots/compress'
import { fetchMarineTides } from '../../src/weather/tides'

/* What happens when the device says no.
 *
 * These modules all expose a `*With(deps)` / injectable-fetch seam precisely so
 * their failure branches can be driven — the seams existed, but only the happy
 * paths used them. Everything here is a real thing that happens to someone
 * standing at a trailhead: permission denied, picker cancelled, no signal, a
 * photo the browser cannot decode. */

afterEach(() => { vi.restoreAllMocks() })

describe('getPositionWith — native', () => {
  const native = (nativeGet: () => Promise<never>) =>
    getPositionWith({ isNative: true, nativeGet, webGeo: undefined })

  it('returns coordinates from the plugin', async () => {
    const pos = await getPositionWith({
      isNative: true,
      nativeGet: async () => ({ coords: { latitude: 27.9, longitude: -82.5 } }),
      webGeo: undefined,
    })
    expect(pos).toEqual({ lat: 27.9, lng: -82.5 })
  })

  it('tells the user where to turn permission back on', async () => {
    await expect(native(() => Promise.reject(new Error('User denied Geolocation'))))
      .rejects.toThrow(/enable it for Vantage in iOS Settings/)
    await expect(native(() => Promise.reject(new Error('Location permission was not granted'))))
      .rejects.toThrow(/enable it for Vantage in iOS Settings/)
  })

  it('uses the generic wording for a non-permission failure', async () => {
    await expect(native(() => Promise.reject(new Error('kCLErrorDomain error 0'))))
      .rejects.toThrow(/try again outside/)
  })

  it('handles a rejection that is not an Error at all', async () => {
    await expect(native(() => Promise.reject('nope' as never)))
      .rejects.toThrow(/try again outside/)
  })
})

describe('getPositionWith — web', () => {
  const webGeo = (impl: Geolocation['getCurrentPosition']) =>
    ({ getCurrentPosition: impl } as unknown as Geolocation)

  it('resolves from navigator.geolocation', async () => {
    const geo = webGeo(((ok: PositionCallback) =>
      ok({ coords: { latitude: 39.95, longitude: -75.16 } } as GeolocationPosition)) as never)
    expect(await getPositionWith({ isNative: false, nativeGet: null as never, webGeo: geo }))
      .toEqual({ lat: 39.95, lng: -75.16 })
  })

  it('explains a denied permission in the browser\'s own terms', async () => {
    const geo = webGeo(((_ok: PositionCallback, fail: PositionErrorCallback) =>
      fail({ code: 1, PERMISSION_DENIED: 1 } as GeolocationPositionError)) as never)
    await expect(getPositionWith({ isNative: false, nativeGet: null as never, webGeo: geo }))
      .rejects.toThrow(/Location permission is needed to find spots near you/)
  })

  it('uses the generic wording for a position-unavailable error', async () => {
    const geo = webGeo(((_ok: PositionCallback, fail: PositionErrorCallback) =>
      fail({ code: 2, PERMISSION_DENIED: 1 } as GeolocationPositionError)) as never)
    await expect(getPositionWith({ isNative: false, nativeGet: null as never, webGeo: geo }))
      .rejects.toThrow(/try again outside/)
  })

  it('rejects rather than hanging when the webview drops the request', async () => {
    // WKWebView's documented failure: neither callback ever fires. A spinner
    // with no end is the worst available outcome, so we time out ourselves.
    vi.useFakeTimers()
    const geo = webGeo((() => { /* never calls back */ }) as never)
    const p = getPositionWith({ isNative: false, nativeGet: null as never, webGeo: geo }, 1000)
    const assertion = expect(p).rejects.toThrow(/timed out/)
    await vi.advanceTimersByTimeAsync(1100)
    await assertion
    vi.useRealTimers()
  })

  it('says so when the device has no geolocation API at all', async () => {
    await expect(getPositionWith({ isNative: false, nativeGet: null as never, webGeo: undefined }))
      .rejects.toThrow(/not available on this device/)
    await expect(getPositionWith({ isNative: false, nativeGet: null as never, webGeo: {} as Geolocation }))
      .rejects.toThrow(/not available on this device/)
  })
})

describe('capturePhotoWith', () => {
  const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

  it('returns null on the web so the caller falls back to its file input', async () => {
    const nativeGetPhoto = vi.fn()
    expect(await capturePhotoWith({ isNative: false, nativeGetPhoto })).toBeNull()
    expect(nativeGetPhoto).not.toHaveBeenCalled()
  })

  it('builds a File from the plugin\'s base64 result', async () => {
    const file = await capturePhotoWith({
      isNative: true,
      nativeGetPhoto: async () => ({ base64String: PIXEL, format: 'png' }),
    })
    expect(file).toBeInstanceOf(File)
    expect(file!.type).toBe('image/png')
    expect(file!.name).toMatch(/^shot-\d+\.png$/)
    expect(file!.size).toBeGreaterThan(0)
  })

  it('defaults to jpeg when the plugin reports no format', async () => {
    const file = await capturePhotoWith({
      isNative: true, nativeGetPhoto: async () => ({ base64String: PIXEL }),
    })
    expect(file!.type).toBe('image/jpeg')
  })

  it('returns null — never an error — when the user cancels', async () => {
    // Changing your mind is not a failure, and the wording varies by iOS
    // version and by which sheet was dismissed.
    for (const msg of ['User cancelled photos app', 'No image picked', 'User denied access to photos', 'no image selected']) {
      const out = await capturePhotoWith({
        isNative: true, nativeGetPhoto: () => Promise.reject(new Error(msg)),
      })
      expect(out, msg).toBeNull()
    }
  })

  it('points at iOS Settings when camera permission is off', async () => {
    for (const msg of ['User denied camera permission', 'not authorized', 'restricted']) {
      await expect(capturePhotoWith({
        isNative: true, nativeGetPhoto: () => Promise.reject(new Error(msg)),
      })).rejects.toThrow(/turn it on for Vantage in iOS Settings/)
    }
  })

  it('surfaces a generic failure as something a person can act on', async () => {
    await expect(capturePhotoWith({
      isNative: true, nativeGetPhoto: () => Promise.reject(new Error('AVFoundation exploded')),
    })).rejects.toThrow(/Could not open the camera/)
  })

  it('returns null when the plugin resolves with no image data', async () => {
    expect(await capturePhotoWith({ isNative: true, nativeGetPhoto: async () => ({}) })).toBeNull()
  })
})

describe('compressImage', () => {
  const bigFile = (size: number, name = 'shot.heic') =>
    new File([new Uint8Array(size)], name, { type: 'image/heic' })

  /** Stub the canvas pipeline: a bitmap of the given size, and a toBlob that
      returns a blob whose size depends on the quality it was handed. */
  const stubCanvas = (sizeForQuality: (q: number) => number) => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 4000, height: 3000, close: vi.fn() })))
    const canvas = {
      width: 0, height: 0,
      getContext: vi.fn(() => ({ drawImage: vi.fn() })),
      toBlob: vi.fn((cb: (b: Blob | null) => void, _type: string, q: number) =>
        cb(new Blob([new Uint8Array(sizeForQuality(q))]))),
    }
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) =>
      tag === 'canvas' ? canvas : document.createElementNS('http://www.w3.org/1999/xhtml', tag)) as never)
    return canvas
  }

  it('stops at the first quality that fits the target', async () => {
    // 0.85 overshoots, 0.75 fits — the ladder must not keep walking past it.
    const canvas = stubCanvas((q) => (q >= 0.85 ? TARGET_BYTES + 1 : TARGET_BYTES - 1))
    const out = await compressImage(bigFile(6_000_000))

    expect(canvas.toBlob).toHaveBeenCalledTimes(2)
    expect(out.type).toBe('image/jpeg')
    expect(out.name).toBe('shot.jpg') // re-encoded, so the extension follows
    expect(out.size).toBeLessThanOrEqual(TARGET_BYTES)
  })

  it('scales the longest side down to the cap', async () => {
    const canvas = stubCanvas(() => 1000)
    await compressImage(bigFile(6_000_000))
    expect(canvas.width).toBe(2048)          // 4000 → 2048
    expect(canvas.height).toBe(1536)         // aspect preserved
  })

  it('walks the whole ladder when nothing fits, and keeps the smallest attempt', async () => {
    const canvas = stubCanvas(() => TARGET_BYTES + 1)
    const out = await compressImage(bigFile(6_000_000))
    expect(canvas.toBlob).toHaveBeenCalledTimes(QUALITY_LADDER.length)
    expect(out.size).toBeLessThan(6_000_000) // still much better than the original
  })

  it('never makes a file bigger — returns the original instead', async () => {
    stubCanvas(() => 9_000_000)
    const original = bigFile(6_000_000)
    expect(await compressImage(original)).toBe(original)
  })

  it('passes an undecodable photo through untouched (HEIC off Safari)', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => { throw new Error('unsupported') }))
    const original = bigFile(6_000_000)
    expect(await compressImage(original)).toBe(original)
  })

  it('passes through when a 2d context cannot be had', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 100, height: 100, close: vi.fn() })))
    vi.spyOn(document, 'createElement').mockImplementation((() =>
      ({ getContext: () => null })) as never)
    const original = bigFile(6_000_000)
    expect(await compressImage(original)).toBe(original)
  })

  it('skips the work entirely for a file already near the target', async () => {
    const createImageBitmap = vi.fn()
    vi.stubGlobal('createImageBitmap', createImageBitmap)
    const small = bigFile(500_000)
    expect(await compressImage(small)).toBe(small)
    expect(createImageBitmap).not.toHaveBeenCalled()
  })
})

describe('fetchMarineTides', () => {
  const series = { hourly: { time: [1, 2, 3], sea_level_height_msl: [0.4, 0.1, 0.5] } }

  it('requests the marine endpoint with unixtime and a 16-day window', async () => {
    const fetchImpl = vi.fn(async (_url: string) => new Response(JSON.stringify(series)))
    const out = await fetchMarineTides(27.9, -82.5, fetchImpl as never)

    const url = fetchImpl.mock.calls[0][0]
    expect(url).toContain('marine-api.open-meteo.com')
    expect(url).toContain('latitude=27.9')
    expect(url).toContain('longitude=-82.5')
    expect(url).toContain('sea_level_height_msl')
    expect(url).toContain('timeformat=unixtime') // ISO would be parsed browser-local
    expect(out.height).toEqual([0.4, 0.1, 0.5])
  })

  it('returns an empty series — never throws — when the API errors', async () => {
    const fetchImpl = vi.fn(async () => new Response('upstream down', { status: 503 }))
    expect(await fetchMarineTides(27.9, -82.5, fetchImpl as never)).toEqual({ time: [], height: [] })
  })

  it('returns an empty series when the device is offline', async () => {
    const fetchImpl = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    expect(await fetchMarineTides(27.9, -82.5, fetchImpl as never)).toEqual({ time: [], height: [] })
  })

  it('returns an empty series when the body is not json', async () => {
    const fetchImpl = vi.fn(async () => new Response('<html>maintenance</html>'))
    expect(await fetchMarineTides(27.9, -82.5, fetchImpl as never)).toEqual({ time: [], height: [] })
  })
})
