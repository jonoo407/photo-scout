import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { act } from '@testing-library/react'

/* The sign-in page, /signin?next=… (design 2e). As easy as possible means:
   Google is one tap; otherwise an email and a password is the whole form. A
   device that has never signed in defaults to CREATING the account, so a new
   person types two things and taps once. A device that has signed in before
   defaults to signing in, so a returning person does the same. Since guest
   browsing returned (G1) it is never a wall: "Continue without an account"
   and a finished sign-in both go back to where the person came from. */

const mocks = vi.hoisted(() => ({ google: true, native: false, available: true }))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => mocks.available,
  googleEnabled: () => mocks.google,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))
vi.mock('../../src/pwa/native', () => ({ isNativeApp: () => mocks.native }))

import LoginScreen from '../../src/ui/Login/LoginScreen'
import { useAuth } from '../../src/auth/useAuth'
import { rememberSignedIn } from '../../src/auth/seen'

const signInWithGoogle = vi.fn(async () => {})
const signInWithPassword = vi.fn(async () => {})
const signUpWithPassword = vi.fn(async () => {})
const sendPasswordReset = vi.fn(async () => {})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.google = true
  mocks.native = false
  mocks.available = true
  localStorage.clear()
  useAuth.setState({
    user: null, status: 'ready', errorMsg: null, linkError: null, recovery: false,
    signInWithGoogle, signInWithPassword, signUpWithPassword, sendPasswordReset,
  })
})

const wrap = (at = '/signin?next=%2Fspot%2Fbayshore-boulevard') => render(
  <MemoryRouter initialEntries={[at]}>
    <Routes>
      <Route path="/signin" element={<LoginScreen />} />
      <Route path="*" element={<Where />} />
    </Routes>
  </MemoryRouter>,
)
function Where() {
  return <p>now at {useLocation().pathname}</p>
}
const type = async (u: ReturnType<typeof userEvent.setup>, label: RegExp, text: string) =>
  u.type(screen.getByLabelText(label), text)

describe('what the screen says', () => {
  it('leads with the promise, and no magic link', () => {
    wrap()
    expect(screen.getByRole('heading', { name: /know where the light is/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign-in link/i })).not.toBeInTheDocument()
  })

  it('says what the account keeps', () => {
    wrap()
    expect(screen.getByText(/saved spots, synced/i)).toBeInTheDocument()
  })
})

describe('Google', () => {
  it('is the first button on the web, and starts the redirect', async () => {
    const u = userEvent.setup()
    wrap()
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveTextContent(/continue with google/i)
    await u.click(buttons[0])
    expect(signInWithGoogle).toHaveBeenCalled()
  })

  it('is absent inside the native wrapper, where the redirect cannot come back', () => {
    mocks.native = true
    wrap()
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })

  it('is absent when the provider is not configured', () => {
    mocks.google = false
    wrap()
    expect(screen.queryByRole('button', { name: /google/i })).not.toBeInTheDocument()
  })
})

describe('email + password on a fresh device', () => {
  it('defaults to creating an account, and tells the password manager so', () => {
    wrap()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('autocomplete', 'new-password')
  })

  it('creates the account from the two fields', async () => {
    const u = userEvent.setup()
    wrap()
    await type(u, /email/i, 'new@example.com')
    await type(u, /^password/i, 'golden hour 42')
    await u.click(screen.getByRole('button', { name: /create account/i }))
    expect(signUpWithPassword).toHaveBeenCalledWith('new@example.com', 'golden hour 42')
    expect(signInWithPassword).not.toHaveBeenCalled()
  })

  it('submits on Enter too', async () => {
    const u = userEvent.setup()
    wrap()
    await type(u, /email/i, 'new@example.com')
    await type(u, /^password/i, 'golden hour 42{enter}')
    expect(signUpWithPassword).toHaveBeenCalledWith('new@example.com', 'golden hour 42')
  })

  it('will not submit until both fields have something in them', async () => {
    const u = userEvent.setup()
    wrap()
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled()
    await type(u, /email/i, 'new@example.com')
    expect(screen.getByRole('button', { name: /create account/i })).toBeDisabled()
  })

  it('can switch to signing in instead', async () => {
    const u = userEvent.setup()
    wrap()
    await u.click(screen.getByRole('button', { name: /already have an account/i }))
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('autocomplete', 'current-password')
  })
})

describe('email + password on a device that has signed in before', () => {
  beforeEach(() => { rememberSignedIn() })

  it('defaults to signing in', () => {
    wrap()
    expect(screen.getByRole('button', { name: /^sign in$/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/^password/i)).toHaveAttribute('autocomplete', 'current-password')
  })

  it('signs in with the two fields', async () => {
    const u = userEvent.setup()
    wrap()
    await type(u, /email/i, 'jon@example.com')
    await type(u, /^password/i, 'golden hour 42')
    await u.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(signInWithPassword).toHaveBeenCalledWith('jon@example.com', 'golden hour 42')
    expect(signUpWithPassword).not.toHaveBeenCalled()
  })

  it('offers a password reset for the typed email — and only once there is one', async () => {
    const u = userEvent.setup()
    wrap()
    const forgot = screen.getByRole('button', { name: /forgot password/i })
    expect(forgot).toBeDisabled()
    await type(u, /email/i, 'jon@example.com')
    await u.click(forgot)
    expect(sendPasswordReset).toHaveBeenCalledWith('jon@example.com')
  })

  it('can switch to creating an account instead', async () => {
    const u = userEvent.setup()
    wrap()
    await u.click(screen.getByRole('button', { name: /new here/i }))
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })
})

describe('messages', () => {
  it('surfaces the store error under the form', () => {
    useAuth.setState({ status: 'error', errorMsg: 'That email or password is wrong.' })
    wrap()
    expect(screen.getByText(/that email or password is wrong/i)).toBeInTheDocument()
  })

  it('after a reset email goes out, says so, with a way back to the form', async () => {
    const u = userEvent.setup()
    useAuth.setState({ status: 'sent' })
    wrap()
    expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /back/i }))
    expect(useAuth.getState().status).toBe('ready')
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument()
  })

  it('shows a failed email link here — signed out, Today is not on screen to show it', () => {
    useAuth.setState({ linkError: 'That link has expired or already been used — request a fresh one.' })
    wrap()
    expect(screen.getByText(/expired or already been used/i)).toBeInTheDocument()
  })

  it('shows Working… while a request is in flight', () => {
    useAuth.setState({ status: 'sending' })
    wrap()
    expect(screen.getByRole('button', { name: /working/i })).toBeDisabled()
  })
})

describe('never a wall (G1)', () => {
  it('"Continue without an account" goes back to where the person came from', async () => {
    const u = userEvent.setup()
    wrap()
    await u.click(screen.getByRole('button', { name: /continue without an account/i }))
    expect(screen.getByText('now at /spot/bayshore-boulevard')).toBeInTheDocument()
  })

  it('a finished sign-in goes back there too', () => {
    wrap()
    act(() => useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' } }))
    expect(screen.getByText('now at /spot/bayshore-boulevard')).toBeInTheDocument()
  })

  it('with no next=, or a foreign one, "back" means Today', async () => {
    const u = userEvent.setup()
    wrap('/signin?next=https%3A%2F%2Fevil.example')
    await u.click(screen.getByRole('button', { name: /continue without an account/i }))
    expect(screen.getByText('now at /')).toBeInTheDocument()
  })

  it('already signed in, or no accounts in this build: straight through', () => {
    mocks.available = false
    wrap()
    expect(screen.getByText('now at /spot/bayshore-boulevard')).toBeInTheDocument()
  })
})
