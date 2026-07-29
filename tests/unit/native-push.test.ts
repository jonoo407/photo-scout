import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  enableNativePushWith, disableNativePushWith, syncNativeWatchWith,
  type NativePushDeps,
} from '../../src/push/native-push'

/* Native push registration (J3 phase 4).

   `pushSupported()` is false inside the wrapper — there is no service worker
   and no PushManager, and the capability probe confirms `push=no`. So the
   whole web path is unreachable on native and this is a separate route:
   ask iOS for permission, register with Apple, and post the device token to
   the same /api/push/subscribe endpoint as `apns://<token>`. */

const deps = (over: Partial<NativePushDeps> = {}): NativePushDeps => ({
  isNative: true,
  requestPermissions: vi.fn(async () => ({ receive: 'granted' as const })),
  register: vi.fn(async () => {}),
  onToken: vi.fn((cb: (t: string) => void) => { cb('DEADBEEF'); return () => {} }),
  post: vi.fn(async () => true),
  ...over,
})

beforeEach(() => vi.clearAllMocks())

describe('enableNativePushWith', () => {
  it('registers and posts the device token as an apns endpoint', async () => {
    const d = deps()
    expect(await enableNativePushWith(d, ['bayshore-boulevard'], 'user-1')).toBe(true)
    expect(d.register).toHaveBeenCalled()
    expect(d.post).toHaveBeenCalledWith('/api/push/subscribe', {
      endpoint: 'apns://DEADBEEF', spotIds: ['bayshore-boulevard'], userId: 'user-1',
    })
  })

  it('does nothing on the web — that path is the service worker\'s', async () => {
    const d = deps({ isNative: false })
    expect(await enableNativePushWith(d, [], null)).toBe(false)
    expect(d.register).not.toHaveBeenCalled()
  })

  it('gives up quietly when the user declines the iOS prompt', async () => {
    const d = deps({ requestPermissions: vi.fn(async () => ({ receive: 'denied' as const })) })
    expect(await enableNativePushWith(d, [], null)).toBe(false)
    expect(d.register).not.toHaveBeenCalled()
  })

  it('resolves false rather than hanging when no token ever arrives', async () => {
    const d = deps({ onToken: vi.fn(() => () => {}) })
    expect(await enableNativePushWith(d, [], null, 40)).toBe(false)
  })

  it('sends a null userId when signed out', async () => {
    const d = deps()
    await enableNativePushWith(d, ['x'], null)
    expect(d.post).toHaveBeenCalledWith('/api/push/subscribe', expect.objectContaining({ userId: null }))
  })
})

describe('disableNativePushWith', () => {
  it('unsubscribes the stored token', async () => {
    const d = deps()
    await disableNativePushWith(d, 'DEADBEEF')
    expect(d.post).toHaveBeenCalledWith('/api/push/unsubscribe', { endpoint: 'apns://DEADBEEF' })
  })

  it('is a no-op with no token to remove', async () => {
    const d = deps()
    await disableNativePushWith(d, null)
    expect(d.post).not.toHaveBeenCalled()
  })
})

describe('syncNativeWatchWith', () => {
  it('updates the watch list for an already-registered device', async () => {
    const d = deps()
    await syncNativeWatchWith(d, 'DEADBEEF', ['a', 'b'], 'user-1')
    expect(d.post).toHaveBeenCalledWith('/api/push/subscribe', {
      endpoint: 'apns://DEADBEEF', spotIds: ['a', 'b'], userId: 'user-1',
    })
  })

  it('does not register a device that never had a token', async () => {
    const d = deps()
    await syncNativeWatchWith(d, null, ['a'], null)
    expect(d.post).not.toHaveBeenCalled()
  })
})
