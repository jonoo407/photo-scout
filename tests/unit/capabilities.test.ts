import { describe, it, expect, vi } from 'vitest'
import { probeCapabilities, formatCapabilities } from '../../src/pwa/capabilities'

/*
 * Rendering tests proved the wrapper painted, and I let that stand in for
 * "it works" — then shipped a build where geolocation hung forever. WKWebView
 * fails differently from a browser, and the difference is invisible to a
 * screenshot.
 *
 * So the app probes its own capabilities at boot and logs one line, which the
 * simulator workflow asserts on. `timeout` is the case that matters: iOS with a
 * missing usage string never calls EITHER callback, so an absent result is not
 * an error — it is silence.
 */
const geo = (impl: 'ok' | 'error' | 'silent') => ({
  getCurrentPosition: (ok: (p: unknown) => void, err: (e: unknown) => void) => {
    if (impl === 'ok') ok({ coords: { latitude: 27.9, longitude: -82.5 } })
    if (impl === 'error') err({ code: 1, message: 'denied' })
    // 'silent': never calls back — the missing-usage-string failure mode
  },
})

describe('probeCapabilities', () => {
  it('reports ok when a position comes back', async () => {
    const r = await probeCapabilities({ geolocation: geo('ok') } as never, {} as never, 50)
    expect(r.geolocation).toBe('ok')
  })

  it('reports error when the callback rejects', async () => {
    const r = await probeCapabilities({ geolocation: geo('error') } as never, {} as never, 50)
    expect(r.geolocation).toBe('error')
  })

  it('reports timeout when neither callback ever fires', async () => {
    const r = await probeCapabilities({ geolocation: geo('silent') } as never, {} as never, 20)
    expect(r.geolocation).toBe('timeout')
  })

  it('reports absent when the API is missing entirely', async () => {
    const r = await probeCapabilities({} as never, {} as never, 20)
    expect(r.geolocation).toBe('absent')
  })

  it('detects share, clipboard, notification and push support', async () => {
    const nav = { share: vi.fn(), clipboard: { writeText: vi.fn() } }
    const win = { Notification: class {}, PushManager: class {} }
    const r = await probeCapabilities(nav as never, win as never, 20)
    expect(r).toMatchObject({ share: true, clipboard: true, notification: true, push: true })
  })

  it('formats one greppable line for CI', () => {
    const line = formatCapabilities({
      geolocation: 'timeout', share: true, clipboard: false, notification: true, push: false,
    })
    expect(line).toBe('[caps] geolocation=timeout share=yes clipboard=no notification=yes push=no')
  })
})
