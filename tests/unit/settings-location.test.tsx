import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* Settings location controls (tester report, build 15): "there are two of
   them and neither does anything."

   Both were true observations. detectCity and useCurrent performed the exact
   same two writes (nearest region + home to current coords), so one goes.
   And success changed nothing visible when you were already home — so the
   surviving button must SAY what it did, and its error must appear next to
   it, not in a different card. */

const mocks = vi.hoisted(() => ({
  getPosition: vi.fn(async () => ({ lat: 27.9506, lng: -82.4572 })), // Tampa
}))
vi.mock('../../src/geo/position', () => ({ getPosition: mocks.getPosition }))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => false,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))
vi.mock('../../src/spots/photo-reports-api', () => ({
  fetchBlockedPhotographers: async () => [],
  unblockPhotographer: async () => ({ ok: true }),
}))

import SettingsScreen from '../../src/ui/Settings/SettingsScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getPosition.mockResolvedValue({ lat: 27.9506, lng: -82.4572 })
  useStore.setState({ region: 'tampa-bay', home: DEFAULT_HOME, theme: 'auto' })
})

const renderSettings = () => render(<MemoryRouter><SettingsScreen /></MemoryRouter>)

describe('Settings — location', () => {
  it('has exactly ONE use-my-location control, not two duplicates', () => {
    renderSettings()
    expect(screen.getAllByRole('button', { name: /use my (current )?location/i })).toHaveLength(1)
  })

  it('says what it did on success, even when nothing else visibly changes', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: /use my (current )?location/i }))
    expect(await screen.findByText(/tampa bay/i, { selector: '.geo-confirm' })).toBeInTheDocument()
    expect(useStore.getState().home.label).toBe('Current location')
  })

  it('shows the failure next to the button, in plain words', async () => {
    const user = userEvent.setup()
    mocks.getPosition.mockRejectedValueOnce(new Error('Location permission is needed — enable it for Vantage in iOS Settings.'))
    renderSettings()
    await user.click(screen.getByRole('button', { name: /use my (current )?location/i }))
    expect(await screen.findByText(/iOS Settings/i)).toBeInTheDocument()
  })

  it('switching city by chip still works without any location call', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: 'Philadelphia' }))
    expect(useStore.getState().region).toBe('philadelphia')
    expect(mocks.getPosition).not.toHaveBeenCalled()
  })
})
