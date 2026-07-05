import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { enableConditionAlerts, disableConditionAlerts, syncWatchedSpots, pushSupported } from '../../src/push/client'

const ENDPOINT = 'https://push.example.com/sub/abc'

function mockPushStack(existing: boolean) {
  const subscription = {
    endpoint: ENDPOINT,
    unsubscribe: vi.fn(async () => true),
  }
  const pushManager = {
    getSubscription: vi.fn(async () => (existing ? subscription : null)),
    subscribe: vi.fn(async () => subscription),
  }
  const registration = { pushManager }
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve(registration) }, configurable: true,
  })
  Object.defineProperty(globalThis, 'Notification', {
    value: { requestPermission: vi.fn(async () => 'granted'), permission: 'default' }, configurable: true,
  })
  Object.defineProperty(globalThis, 'PushManager', { value: function PushManager() {}, configurable: true })
  return { subscription, pushManager }
}

const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
  const url = String(input)
  if (url.endsWith('/api/push/vapid')) {
    return new Response(JSON.stringify({ publicKey: 'BPubKeyBase64UrlAAAAAAAAAAAAAAAAAAAAAAAAAAA' }))
  }
  return new Response(JSON.stringify({ ok: true, watching: 2 }))
})

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
})
afterEach(() => vi.unstubAllGlobals())

describe('push client', () => {
  it('enable: asks permission, subscribes with the server VAPID key, registers the watch list', async () => {
    const { pushManager } = mockPushStack(false)
    const ok = await enableConditionAlerts(['honeymoon-island-sp', 'fort-de-soto-park'])
    expect(ok).toBe(true)
    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({ userVisibleOnly: true, applicationServerKey: expect.anything() }),
    )
    const calls = fetchMock.mock.calls.map((c) => String(c[0]))
    expect(calls.some((u) => u.endsWith('/api/push/vapid'))).toBe(true)
    const subCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/api/push/subscribe'))
    expect(subCall).toBeTruthy()
    const body = JSON.parse((subCall![1] as RequestInit).body as string)
    expect(body).toEqual({ endpoint: ENDPOINT, spotIds: ['honeymoon-island-sp', 'fort-de-soto-park'], userId: null })
  })

  it('enable forwards the signed-in user id so client responses can find this device', async () => {
    mockPushStack(false)
    await enableConditionAlerts(['a'], 'f5b0e9a2-1111-2222-3333-444455556666')
    const subCall = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/api/push/subscribe'))
    const body = JSON.parse((subCall![1] as RequestInit).body as string)
    expect(body.userId).toBe('f5b0e9a2-1111-2222-3333-444455556666')
  })

  it('disable: unsubscribes locally and tells the server', async () => {
    const { subscription } = mockPushStack(true)
    await disableConditionAlerts()
    expect(subscription.unsubscribe).toHaveBeenCalled()
    const un = fetchMock.mock.calls.find((c) => String(c[0]).endsWith('/api/push/unsubscribe'))
    expect(un).toBeTruthy()
  })

  it('sync: re-registers the current watch list only when already subscribed', async () => {
    mockPushStack(false)
    await syncWatchedSpots(['a'])
    expect(fetchMock.mock.calls.every((c) => !String(c[0]).endsWith('/api/push/subscribe'))).toBe(true)
  })

  it('pushSupported reflects the environment', () => {
    mockPushStack(false)
    expect(pushSupported()).toBe(true)
  })
})
