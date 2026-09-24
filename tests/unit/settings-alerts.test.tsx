import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AlertsSection from '../../src/ui/Settings/AlertsSection'
import { useStore } from '../../src/state/store'

const mocks = vi.hoisted(() => ({
  pushSupported: vi.fn(() => true),
  alertsEnabled: vi.fn(async () => false),
  enableConditionAlerts: vi.fn(async () => true),
  disableConditionAlerts: vi.fn(async () => {}),
}))
vi.mock('../../src/push/client', () => mocks)

const native = vi.hoisted(() => ({
  nativePushAvailable: vi.fn(() => false),
  enableNativePush: vi.fn(async () => 'on' as string),
  disableNativePush: vi.fn(async () => {}),
  syncNativeWatch: vi.fn(async () => {}),
  storedApnsToken: vi.fn(() => null as string | null),
}))
vi.mock('../../src/push/native-push', () => native)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.pushSupported.mockReturnValue(true)
  mocks.alertsEnabled.mockResolvedValue(false)
  native.nativePushAvailable.mockReturnValue(false)
  useStore.setState({ wishlist: ['honeymoon-island-sp'], visited: [] })
})

describe('Settings — conditions alerts', () => {
  it('turns alerts on for the want-to-go list', async () => {
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(mocks.enableConditionAlerts).toHaveBeenCalledWith(['honeymoon-island-sp'], null)
    expect(await screen.findByRole('button', { name: /turn off/i })).toBeInTheDocument()
  })

  it('turns alerts off', async () => {
    mocks.alertsEnabled.mockResolvedValue(true)
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn off/i }))
    expect(mocks.disableConditionAlerts).toHaveBeenCalled()
    expect(await screen.findByRole('button', { name: /turn on/i })).toBeInTheDocument()
  })

  it('says so when the browser cannot push', async () => {
    mocks.pushSupported.mockReturnValue(false)
    render(<AlertsSection />)
    expect(await screen.findByText(/not supported/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /turn on/i })).not.toBeInTheDocument()
  })

  it('explains what it watches', async () => {
    render(<AlertsSection />)
    expect(await screen.findByText(/want-to-go/i)).toBeInTheDocument()
  })
})

describe('Settings — when turning alerts on fails', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('says blocked only when notifications are actually blocked', async () => {
    mocks.enableConditionAlerts.mockResolvedValue(false)
    vi.stubGlobal('Notification', { permission: 'denied' })
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(await screen.findByText(/blocked/i)).toBeInTheDocument()
  })

  it('blames the connection, not permissions, when the server is unreachable', async () => {
    mocks.enableConditionAlerts.mockResolvedValue(false)
    vi.stubGlobal('Notification', { permission: 'granted' })
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(await screen.findByText(/couldn.t reach/i)).toBeInTheDocument()
    expect(screen.queryByText(/blocked/i)).not.toBeInTheDocument()
  })

  it('on iOS, blames Apple registration — not the server — when no token arrives', async () => {
    native.nativePushAvailable.mockReturnValue(true)
    native.enableNativePush.mockResolvedValue('no-token')
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(await screen.findByText(/didn.t register this device/i)).toBeInTheDocument()
    expect(screen.queryByText(/couldn.t reach/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/blocked/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /turn on/i })).toBeEnabled()
  })

  it('shows progress while waiting on Apple, instead of a dead button', async () => {
    native.nativePushAvailable.mockReturnValue(true)
    let finish!: (v: string) => void
    native.enableNativePush.mockReturnValue(new Promise<string>((r) => { finish = r }))
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(await screen.findByRole('button', { name: /turning on/i })).toBeDisabled()
    finish('on')
    expect(await screen.findByRole('button', { name: /turn off/i })).toBeEnabled()
  })

  it('recovers with a message if enabling throws outright', async () => {
    mocks.enableConditionAlerts.mockRejectedValue(new Error('boom'))
    const user = userEvent.setup()
    render(<AlertsSection />)
    await user.click(await screen.findByRole('button', { name: /turn on/i }))
    expect(await screen.findByText(/couldn.t reach/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /turn on/i })).toBeEnabled()
  })
})
