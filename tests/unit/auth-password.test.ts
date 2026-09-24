import { describe, it, expect, beforeEach, vi } from 'vitest'

/* Email + password sign-in, added 2026-07-29 alongside Google single sign-on;
   promoted to THE way in (with Google) when the sign-in gate landed on
   2026-09-14. Magic links are gone: "type in email and password and go" was
   the brief, and a link in an inbox is neither of those. */

const auth = {
  signUp: vi.fn(async (_a: unknown) => ({ data: { user: { id: 'u1' }, session: null }, error: null as null | { message: string } })),
  signInWithPassword: vi.fn(async (_a: unknown) => ({ data: {}, error: null as null | { message: string } })),
  resetPasswordForEmail: vi.fn(async (_e: string, _o: unknown) => ({ error: null as null | { message: string } })),
  updateUser: vi.fn(async (_a: unknown) => ({ error: null as null | { message: string } })),
  signInWithOtp: vi.fn(async () => ({ error: null })),
  signInWithOAuth: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => ({})),
  onAuthStateChange: vi.fn(),
}
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: async () => ({ auth }),
}))

import { useAuth } from '../../src/auth/useAuth'
import { MIN_PASSWORD_LENGTH, passwordProblem } from '../../src/auth/password-rules'

beforeEach(() => {
  vi.clearAllMocks()
  useAuth.setState({ user: null, status: 'ready', errorMsg: null, linkError: null, recovery: false })
})

describe('passwordProblem', () => {
  it('accepts a reasonable password', () => {
    expect(passwordProblem('golden hour 42')).toBeNull()
  })

  it('rejects one that is too short, naming the minimum', () => {
    const msg = passwordProblem('abc12')
    expect(msg).toContain(String(MIN_PASSWORD_LENGTH))
  })

  it('requires more than a single character class', () => {
    expect(passwordProblem('aaaaaaaaaaaa')).toBeTruthy()
    expect(passwordProblem('123456789012')).toBeTruthy()
  })

  it('rejects an empty password without crashing', () => {
    expect(passwordProblem('')).toBeTruthy()
  })

  it('is at least 8 characters — Supabase default of 6 is too weak to accept', () => {
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(8)
  })
})

describe('signUpWithPassword', () => {
  it('creates the account and asks the user to confirm by email', async () => {
    await useAuth.getState().signUpWithPassword('jon@example.com', 'golden hour 42')
    expect(auth.signUp).toHaveBeenCalledWith(expect.objectContaining({
      email: 'jon@example.com', password: 'golden hour 42',
    }))
    expect(useAuth.getState().status).toBe('sent')
  })

  it('refuses a weak password locally, without calling the server', async () => {
    await useAuth.getState().signUpWithPassword('jon@example.com', 'abc')
    expect(auth.signUp).not.toHaveBeenCalled()
    expect(useAuth.getState().status).toBe('error')
    expect(useAuth.getState().errorMsg).toBeTruthy()
  })

  it('goes straight in when the project returns a session (confirmation off)', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: { id: 'u1' }, session: { access_token: 'x' } }, error: null } as never)
    await useAuth.getState().signUpWithPassword('jon@example.com', 'golden hour 42')
    expect(useAuth.getState().status).toBe('ready')
  })

  it('surfaces the server error', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'Signups not allowed for this instance' } } as never)
    await useAuth.getState().signUpWithPassword('jon@example.com', 'golden hour 42')
    expect(useAuth.getState().errorMsg).toBe('Signups not allowed for this instance')
  })
})

describe('signInWithPassword', () => {
  it('signs in with the given credentials', async () => {
    await useAuth.getState().signInWithPassword('jon@example.com', 'golden hour 42')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'jon@example.com', password: 'golden hour 42',
    })
  })

  it('does NOT apply the strength rule when signing in — only when setting one', async () => {
    await useAuth.getState().signInWithPassword('jon@example.com', 'old weak one')
    expect(auth.signInWithPassword).toHaveBeenCalled()
  })

  it('gives a human message rather than the raw server string on bad credentials', async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid login credentials' } } as never)
    await useAuth.getState().signInWithPassword('jon@example.com', 'wrong')
    expect(useAuth.getState().status).toBe('error')
    expect(useAuth.getState().errorMsg).toMatch(/email or password/i)
  })
})

describe('sendPasswordReset', () => {
  it('emails a reset link back to the app', async () => {
    await useAuth.getState().sendPasswordReset('jon@example.com')
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('jon@example.com', expect.any(Object))
    expect(useAuth.getState().status).toBe('sent')
  })
})

describe('signUpWithPassword when the email already has an account', () => {
  /* The screen defaults to "create" on any device that has not signed in
     before — which is also every returning person's NEW phone. So an
     "already registered" reply is not an error to show; it is a sign-in. */
  it('quietly signs in with the same credentials instead', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'User already registered', code: 'user_already_exists' } } as never)
    await useAuth.getState().signUpWithPassword('jon@example.com', 'golden hour 42')
    expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: 'jon@example.com', password: 'golden hour 42' })
    expect(useAuth.getState().status).toBe('ready')
    expect(useAuth.getState().errorMsg).toBeNull()
  })

  it('and when that password is wrong, says exactly that, pointing at the reset', async () => {
    auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'User already registered', code: 'user_already_exists' } } as never)
    auth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid login credentials' } } as never)
    await useAuth.getState().signUpWithPassword('jon@example.com', 'golden hour 42')
    expect(useAuth.getState().status).toBe('error')
    expect(useAuth.getState().errorMsg).toMatch(/already has an account/i)
    expect(useAuth.getState().errorMsg).toMatch(/forgot password/i)
  })
})

describe('updatePassword (after a reset link)', () => {
  beforeEach(() => { useAuth.setState({ recovery: true }) })

  it('applies the same strength rule as sign-up, without a round trip', async () => {
    await useAuth.getState().updatePassword('abc')
    expect(auth.updateUser).not.toHaveBeenCalled()
    expect(useAuth.getState().status).toBe('error')
    expect(useAuth.getState().recovery).toBe(true)
  })

  it('saves the new password and leaves recovery mode', async () => {
    await useAuth.getState().updatePassword('golden hour 42')
    expect(auth.updateUser).toHaveBeenCalledWith({ password: 'golden hour 42' })
    expect(useAuth.getState().recovery).toBe(false)
    expect(useAuth.getState().status).toBe('ready')
  })

  it('stays in recovery mode and shows the server error when saving fails', async () => {
    auth.updateUser.mockResolvedValueOnce({ error: { message: 'New password should be different from the old password.' } } as never)
    await useAuth.getState().updatePassword('golden hour 42')
    expect(useAuth.getState().recovery).toBe(true)
    expect(useAuth.getState().errorMsg).toMatch(/different from the old/i)
  })
})

describe('clearStatus', () => {
  it('returns a sent/error state to ready so the form can be used again', () => {
    useAuth.setState({ status: 'sent', errorMsg: 'x' })
    useAuth.getState().clearStatus()
    expect(useAuth.getState().status).toBe('ready')
    expect(useAuth.getState().errorMsg).toBeNull()
  })
})

describe('there is no magic-link sign-in any more', () => {
  it('the store no longer exposes one', () => {
    expect((useAuth.getState() as unknown as Record<string, unknown>).signInWithEmail).toBeUndefined()
  })
})

describe('signInWithGoogle', () => {
  it('remembers the screen it left, for the full-page redirect to come back to', async () => {
    sessionStorage.clear()
    window.history.replaceState(null, '', '/#/spot/bayshore-boulevard')
    await useAuth.getState().signInWithGoogle()
    expect(auth.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }))
    expect(JSON.parse(sessionStorage.getItem('vantage.return-to')!).hash).toBe('#/spot/bayshore-boulevard')
    window.history.replaceState(null, '', '/')
  })
})
