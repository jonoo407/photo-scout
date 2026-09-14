import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/* Where a password-reset link lands (2026-09-14). Before the sign-in gate,
   "Forgot password?" signed the person in on that browser and then... nothing:
   there was no screen to choose a new password on, so they were still locked
   out everywhere else. With passwords now the main road in, that is a wall. */

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import NewPasswordScreen from '../../src/ui/Login/NewPasswordScreen'
import { useAuth } from '../../src/auth/useAuth'

const updatePassword = vi.fn(async () => {})

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.setState({
    user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null,
    linkError: null, recovery: true, updatePassword,
  })
})

describe('NewPasswordScreen', () => {
  it('asks for one new password, marked for the password manager', () => {
    render(<NewPasswordScreen />)
    expect(screen.getByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/new password/i)).toHaveAttribute('autocomplete', 'new-password')
  })

  it('saves it', async () => {
    const u = userEvent.setup()
    render(<NewPasswordScreen />)
    await u.type(screen.getByLabelText(/new password/i), 'golden hour 42')
    await u.click(screen.getByRole('button', { name: /save password/i }))
    expect(updatePassword).toHaveBeenCalledWith('golden hour 42')
  })

  it('will not save an empty one', () => {
    render(<NewPasswordScreen />)
    expect(screen.getByRole('button', { name: /save password/i })).toBeDisabled()
  })

  it('surfaces the rule when the store rejects it', () => {
    useAuth.setState({ status: 'error', errorMsg: 'Use at least 10 characters — length matters more than symbols.' })
    render(<NewPasswordScreen />)
    expect(screen.getByText(/at least 10 characters/i)).toBeInTheDocument()
  })

  it('lets the person skip — they are signed in here either way', async () => {
    const u = userEvent.setup()
    render(<NewPasswordScreen />)
    await u.click(screen.getByRole('button', { name: /skip for now/i }))
    expect(useAuth.getState().recovery).toBe(false)
    expect(updatePassword).not.toHaveBeenCalled()
  })
})
