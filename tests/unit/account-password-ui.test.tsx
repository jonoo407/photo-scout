import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* Settings → Account with a password option (2026-07-29).

   The magic link stays the default — it is genuinely easier and there is no
   password to lose. The password path exists so an account can be HANDED to
   someone (an App Store reviewer needs one, and cannot receive our email), and
   for people whose mail client eats links. */

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import AccountSection from '../../src/ui/Settings/AccountSection'
import { useAuth } from '../../src/auth/useAuth'

const signInWithEmail = vi.fn(async () => {})
const signInWithPassword = vi.fn(async () => {})
const signUpWithPassword = vi.fn(async () => {})
const sendPasswordReset = vi.fn(async () => {})

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.setState({
    user: null, status: 'ready', errorMsg: null, linkError: null,
    signInWithEmail, signInWithPassword, signUpWithPassword, sendPasswordReset,
  })
})

const wrap = () => render(<MemoryRouter><AccountSection /></MemoryRouter>)
const type = async (u: ReturnType<typeof userEvent.setup>, label: RegExp, text: string) =>
  u.type(screen.getByLabelText(label), text)

describe('the magic link stays the default', () => {
  it('shows the link flow first, with no password field in sight', () => {
    wrap()
    expect(screen.getByRole('button', { name: /send sign-in link/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument()
  })

  it('still sends a link', async () => {
    const u = userEvent.setup()
    wrap()
    await type(u, /email/i, 'jon@example.com')
    await u.click(screen.getByRole('button', { name: /send sign-in link/i }))
    expect(signInWithEmail).toHaveBeenCalledWith('jon@example.com')
  })
})

describe('password mode', () => {
  const openPasswordMode = async (u: ReturnType<typeof userEvent.setup>) => {
    wrap()
    await u.click(screen.getByRole('button', { name: /use a password/i }))
  }

  it('reveals a password field', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    const pw = screen.getByLabelText(/^password/i)
    expect(pw).toHaveAttribute('type', 'password')
  })

  it('marks the fields up so password managers can fill them', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('autocomplete', 'current-password')
  })

  it('signs in with the typed credentials', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    await type(u, /email/i, 'jon@example.com')
    await type(u, /^password/i, 'golden hour 42')
    await u.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(signInWithPassword).toHaveBeenCalledWith('jon@example.com', 'golden hour 42')
  })

  it('will not submit with an empty password', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    await type(u, /email/i, 'jon@example.com')
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeDisabled()
  })

  it('switches to creating an account, and asks for a new-password autocomplete', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    await u.click(screen.getByRole('button', { name: /create one/i }))
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('autocomplete', 'new-password')
    await type(u, /email/i, 'new@example.com')
    await type(u, /^password/i, 'golden hour 42')
    await u.click(screen.getByRole('button', { name: /create account/i }))
    expect(signUpWithPassword).toHaveBeenCalledWith('new@example.com', 'golden hour 42')
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('offers a password reset', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    await type(u, /email/i, 'jon@example.com')
    await u.click(screen.getByRole('button', { name: /forgot/i }))
    expect(sendPasswordReset).toHaveBeenCalledWith('jon@example.com')
  })

  it('can go back to the link flow', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    await u.click(screen.getByRole('button', { name: /email me a link instead/i }))
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send sign-in link/i })).toBeInTheDocument()
  })

  it('surfaces the store error message', async () => {
    const u = userEvent.setup()
    await openPasswordMode(u)
    useAuth.setState({ status: 'error', errorMsg: 'That email or password is wrong.' })
    expect(await screen.findByText(/that email or password is wrong/i)).toBeInTheDocument()
  })
})
