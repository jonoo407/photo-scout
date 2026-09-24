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
   the same /api/push/subscribe endpoint as `apns://<token>`.

   The enable flow answers with an OUTCOME, not a boolean: build 16's Settings
   screen told the user notifications were blocked when the truth was a failed
   token post, because `false` couldn't say which step died. */

const deps = (over: Partial<NativePushDeps> = {}): NativePushDeps => ({
  isNative: true,
  requestPermissions: vi.fn(async () => ({ receive: 'granted' as const })),
  register: vi.fn(async () => {}),
  onToken: vi.fn((cb: (t: string) => void) => { cb('DEADBEEF'); return () => {} }),
  onError: vi.fn(() => () => {}),
  post: vi.fn(async () => true),
  remember: vi.fn(),
  ...over,
})

beforeEach(() => vi.clearAllMocks())

describe('enableNativePushWith', () => {
  it('registers and posts the device token as an apns endpoint', async () => {
    const d = deps()
    expect(await enableNativePushWith(d, ['bayshore-boulevard'])).toBe('on')
    expect(d.register).toHaveBeenCalled()
    expect(d.post).toHaveBeenCalledWith('/api/push/subscribe', {
      endpoint: 'apns://DEADBEEF', spotIds: ['bayshore-boulevard'],
    })
  })

  it('does nothing on the web — that path is the service worker\'s', async () => {
    const d = deps({ isNative: false })
    expect(await enableNativePushWith(d, [])).toBe('unsupported')
    expect(d.register).not.toHaveBeenCalled()
  })

  it('reports a decline of the iOS prompt as denied', async () => {
    const d = deps({ requestPermissions: vi.fn(async () => ({ receive: 'denied' as const })) })
    expect(await enableNativePushWith(d, [])).toBe('denied')
    expect(d.register).not.toHaveBeenCalled()
  })

  it('resolves no-token rather than hanging when no token ever arrives', async () => {
    const d = deps({ onToken: vi.fn(() => () => {}) })
    expect(await enableNativePushWith(d, [], 40)).toBe('no-token')
  })

  it('resolves immediately when Apple reports a registration error', async () => {
    // Timeout far beyond the test runner's patience: only the error listener
    // can settle this in time, so a missing listener fails the test.
    const d = deps({
      onToken: vi.fn(() => () => {}),
      onError: vi.fn((cb: (msg: string) => void) => { cb('aps-environment missing'); return () => {} }),
    })
    expect(await enableNativePushWith(d, [], 60_000)).toBe('register-failed')
  })

  it('reports register() itself throwing as register-failed', async () => {
    const d = deps({
      onToken: vi.fn(() => () => {}),
      register: vi.fn(async () => { throw new Error('bridge unavailable') }),
    })
    expect(await enableNativePushWith(d, [], 60_000)).toBe('register-failed')
  })

  it('reports a failed token post as post-failed, not as a permission problem', async () => {
    const d = deps({ post: vi.fn(async () => false) })
    expect(await enableNativePushWith(d, ['x'])).toBe('post-failed')
  })

  it('gives up on a token post that never answers', async () => {
    const d = deps({ post: vi.fn(() => new Promise<boolean>(() => {})) })
    expect(await enableNativePushWith(d, ['x'], 60_000, 40)).toBe('post-failed')
  })

  it('treats a token post that throws as post-failed', async () => {
    const d = deps({ post: vi.fn(async () => { throw new TypeError('Load failed') }) })
    expect(await enableNativePushWith(d, ['x'])).toBe('post-failed')
  })

  it('remembers the token only once the server has accepted it', async () => {
    // The stored token is what marks alerts as on, so storing it before the
    // post would show "Turn off" next launch for a device the server never saw.
    const ok = deps()
    await enableNativePushWith(ok, ['x'])
    expect(ok.remember).toHaveBeenCalledWith('DEADBEEF')

    const failed = deps({ post: vi.fn(async () => false) })
    await enableNativePushWith(failed, ['x'])
    expect(failed.remember).not.toHaveBeenCalled()
  })

  it('never claims an identity in the body — the Worker reads it from the token', async () => {
    const d = deps()
    await enableNativePushWith(d, ['x'])
    expect(d.post).toHaveBeenCalledWith('/api/push/subscribe', expect.not.objectContaining({ userId: expect.anything() }))
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
    await syncNativeWatchWith(d, 'DEADBEEF', ['a', 'b'])
    expect(d.post).toHaveBeenCalledWith('/api/push/subscribe', {
      endpoint: 'apns://DEADBEEF', spotIds: ['a', 'b'],
    })
  })

  it('does not register a device that never had a token', async () => {
    const d = deps()
    await syncNativeWatchWith(d, null, ['a'])
    expect(d.post).not.toHaveBeenCalled()
  })
})
