import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useStore } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

// Mock the supabase module: auth "configured", no network.
const mockAuth = {
  signInWithOtp: vi.fn(async () => ({ error: null })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => ({})),
  onAuthStateChange: vi.fn(),
}
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => true,
  getSupabase: vi.fn(async () => ({ auth: mockAuth })),
}))

import SettingsScreen from '../../src/ui/Settings/SettingsScreen'

function renderSettings() {
  return render(<MemoryRouter><SettingsScreen /></MemoryRouter>)
}

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', theme: 'auto' })
  useAuth.setState({ user: null, status: 'ready', errorMsg: null })
})

describe('Settings — account (signed out)', () => {
  it('offers a magic-link email sign-in and confirms the send', async () => {
    const user = userEvent.setup()
    renderSettings()
    expect(screen.getByText('ACCOUNT')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(/your email/i), 'jon@example.com')
    await user.click(screen.getByRole('button', { name: /send sign-in link/i }))
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument()
  })
})

describe('Settings — account (Google SSO)', () => {
  it('offers Continue with Google and starts the OAuth redirect', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: /continue with google/i }))
    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' }),
    )
  })
})

describe('Settings — account (signed in)', () => {
  it('shows the signed-in email, the sync note, and Sign out', async () => {
    useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready' })
    renderSettings()
    expect(screen.getByText('jon@example.com')).toBeInTheDocument()
    expect(screen.getByText(/synced across your devices/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
