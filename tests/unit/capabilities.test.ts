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
// The probe resolves position through the SAME function the app uses, so a
// green gate means the real code path works rather than that some API exists.
const resolver = (impl: 'ok' | 'error' | 'silent') => () =>
  impl === 'ok' ? Promise.resolve({ lat: 27.9, lng: -82.5 })
    : impl === 'error' ? Promise.reject(new Error('denied'))
      : new Promise<never>(() => {}) // never settles — the WKWebView failure mode

describe('probeCapabilities', () => {
  it('reports ok when a position comes back', async () => {
    const r = await probeCapabilities({} as never, {} as never, 50, resolver('ok'))
    expect(r.geolocation).toBe('ok')
  })

  it('reports error when the resolver rejects', async () => {
    const r = await probeCapabilities({} as never, {} as never, 50, resolver('error'))
    expect(r.geolocation).toBe('error')
  })

  it('reports timeout when it never settles', async () => {
    const r = await probeCapabilities({} as never, {} as never, 20, resolver('silent'))
    expect(r.geolocation).toBe('timeout')
  })

  it('reports absent when no resolver is wired', async () => {
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
