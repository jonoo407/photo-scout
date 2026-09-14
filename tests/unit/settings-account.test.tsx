import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useStore } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* Settings → Account after the sign-in gate (2026-09-14). Nobody reaches
   Settings signed out any more, so the section is purely "who you are and how
   to leave" — every sign-in control moved to the gate's own screen. */

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => true,
  getSupabase: vi.fn(async () => ({ auth: { signOut: vi.fn(async () => ({})), onAuthStateChange: vi.fn() } })),
}))

import SettingsScreen from '../../src/ui/Settings/SettingsScreen'

function renderSettings() {
  return render(<MemoryRouter><SettingsScreen /></MemoryRouter>)
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

  it('carries no sign-in form of its own — the gate owns that', () => {
    renderSettings()
    expect(screen.queryByText('ACCOUNT')).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
  })
})
