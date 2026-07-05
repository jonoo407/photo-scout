import { describe, it, expect, vi, beforeEach } from 'vitest'
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

beforeEach(() => {
  vi.clearAllMocks()
  mocks.pushSupported.mockReturnValue(true)
  mocks.alertsEnabled.mockResolvedValue(false)
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
