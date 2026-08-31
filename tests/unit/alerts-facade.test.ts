import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/* One switch, two delivery systems (J3 phase 4).

   Everything above this layer — the Settings toggle, the watch-list sync —
   should not care whether a push arrives via the browser or Apple. Before
   this, `pushSupported()` was false inside the wrapper, so Settings rendered
   "not supported here" and native users had no way to turn alerts on at all. */

const web = vi.hoisted(() => ({
  pushSupported: vi.fn(() => true),
  alertsEnabled: vi.fn(async () => false),
  enableConditionAlerts: vi.fn(async () => true),
  disableConditionAlerts: vi.fn(async () => {}),
  syncWatchedSpots: vi.fn(async () => {}),
}))
const native = vi.hoisted(() => ({
  nativePushAvailable: vi.fn(() => false),
  enableNativePush: vi.fn(async () => 'on' as const),
  disableNativePush: vi.fn(async () => {}),
  syncNativeWatch: vi.fn(async () => {}),
  storedApnsToken: vi.fn(() => null as string | null),
}))
vi.mock('../../src/push/client', () => web)
vi.mock('../../src/push/native-push', () => native)

import { alertsSupported, alertsAreOn, enableAlerts, disableAlerts, syncWatch } from '../../src/push/alerts'

beforeEach(() => {
  vi.clearAllMocks()
  web.pushSupported.mockReturnValue(true)
  native.nativePushAvailable.mockReturnValue(false)
  native.storedApnsToken.mockReturnValue(null)
})

describe('on the web', () => {
  it('reports supported and uses the browser path', async () => {
    expect(alertsSupported()).toBe(true)
    await enableAlerts(['a'], 'u1')
    expect(web.enableConditionAlerts).toHaveBeenCalledWith(['a'], 'u1')
    expect(native.enableNativePush).not.toHaveBeenCalled()
  })

  it('turns off and syncs through the browser path', async () => {
    await disableAlerts()
    await syncWatch(['a'], null)
    expect(web.disableConditionAlerts).toHaveBeenCalled()
    expect(web.syncWatchedSpots).toHaveBeenCalledWith(['a'], null)
  })
})

describe('inside the native wrapper', () => {
  beforeEach(() => {
    web.pushSupported.mockReturnValue(false) // no service worker, no PushManager
    native.nativePushAvailable.mockReturnValue(true)
  })

  it('reports supported even though the web APIs are absent', () => {
    expect(alertsSupported()).toBe(true)
  })

  it('routes enable, disable and sync to Apple', async () => {
    await enableAlerts(['a'], 'u1')
    await disableAlerts()
    await syncWatch(['b'], 'u1')
    expect(native.enableNativePush).toHaveBeenCalledWith(['a'], 'u1')
    expect(native.disableNativePush).toHaveBeenCalled()
    expect(native.syncNativeWatch).toHaveBeenCalledWith(['b'], 'u1')
    expect(web.enableConditionAlerts).not.toHaveBeenCalled()
  })

  it('is on exactly when a device token has been stored', async () => {
    expect(await alertsAreOn()).toBe(false)
    native.storedApnsToken.mockReturnValue('DEADBEEF')
    expect(await alertsAreOn()).toBe(true)
    expect(web.alertsEnabled).not.toHaveBeenCalled()
  })
})

describe('neither available', () => {
  it('reports unsupported', () => {
    web.pushSupported.mockReturnValue(false)
    native.nativePushAvailable.mockReturnValue(false)
    expect(alertsSupported()).toBe(false)
  })
})

describe('enableAlerts reports WHY it failed', () => {
  /* Build 16 showed "notifications are blocked" for a network failure while
     iOS Settings said allowed — the single boolean couldn't tell a permission
     denial from an unreachable server, so the UI guessed wrong. */
  afterEach(() => vi.unstubAllGlobals())

  it('native: on', async () => {
    native.nativePushAvailable.mockReturnValue(true)
    native.enableNativePush.mockResolvedValue('on')
    expect(await enableAlerts(['a'], null)).toEqual({ on: true, blocked: false })
  })

  it('native: a real permission denial is blocked', async () => {
    native.nativePushAvailable.mockReturnValue(true)
    native.enableNativePush.mockResolvedValue('denied' as never)
    expect(await enableAlerts(['a'], null)).toEqual({ on: false, blocked: true })
  })

  it('native: a failed token post is NOT blocked', async () => {
    native.nativePushAvailable.mockReturnValue(true)
    native.enableNativePush.mockResolvedValue('post-failed' as never)
    expect(await enableAlerts(['a'], null)).toEqual({ on: false, blocked: false })
  })

  it('web: blocked only when the browser says denied', async () => {
    web.enableConditionAlerts.mockResolvedValue(false)
    vi.stubGlobal('Notification', { permission: 'denied' })
    expect(await enableAlerts(['a'], null)).toEqual({ on: false, blocked: true })
  })

  it('web: failure with permission granted is a server problem', async () => {
    web.enableConditionAlerts.mockResolvedValue(false)
    vi.stubGlobal('Notification', { permission: 'granted' })
    expect(await enableAlerts(['a'], null)).toEqual({ on: false, blocked: false })
  })
})
