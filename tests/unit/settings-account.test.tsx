import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useStore } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* Settings → Account. Signed in: "who you are and how to leave". Signed out
   (guest browsing, G1): one row to the full sign-in page — the form itself
   lives there and in the sign-in sheet, never here. */

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => true,
  getSupabase: vi.fn(async () => ({ auth: { signOut: vi.fn(async () => ({})), onAuthStateChange: vi.fn() } })),
}))

import SettingsScreen from '../../src/ui/Settings/SettingsScreen'

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<SettingsScreen />} />
        <Route path="/signin" element={<SignInProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}
function SignInProbe() {
  const loc = useLocation()
  return <p>sign-in page {loc.search}</p>
}

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', theme: 'auto' })
  useAuth.setState({ user: null, status: 'ready', errorMsg: null })
})

describe('Settings — account (signed in)', () => {
  it('shows the signed-in email, the sync note, and Sign out', () => {
    useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready' })
    renderSettings()
    expect(screen.getByText('jon@example.com')).toBeInTheDocument()
    expect(screen.getByText(/synced across your devices/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

})

describe('Settings — account (guest)', () => {
  it('carries no sign-in form of its own', () => {
    renderSettings()
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
  })

  it('offers one way in, which comes back to Settings', async () => {
    const u = userEvent.setup()
    renderSettings()
    expect(screen.getByText('ACCOUNT')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /sign in or create a free account/i }))
    expect(screen.getByText('sign-in page ?next=%2Fsettings')).toBeInTheDocument()
  })

  it('says nothing while the stored session is still restoring', () => {
    useAuth.setState({ status: 'idle' })
    renderSettings()
    expect(screen.queryByText('ACCOUNT')).not.toBeInTheDocument()
  })
})
