import { describe, it, expect, beforeEach, vi } from 'vitest'

/* Email + password sign-in, added 2026-07-29 alongside Google single sign-on.

   Magic links alone left the app impossible for an App Store reviewer to get
   into: we cannot hand out a demo account whose sign-in arrives as a link to
   an inbox we control. Passwords fix that, and they suit anyone whose email
   client mangles links. The magic link stays — it remains the default. */

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
  useAuth.setState({ user: null, status: 'ready', errorMsg: null, linkError: null })
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
    auth.signUp.mockResolvedValueOnce({ data: { user: null, session: null }, error: { message: 'already registered' } } as never)
    await useAuth.getState().signUpWithPassword('jon@example.com', 'golden hour 42')
    expect(useAuth.getState().errorMsg).toBe('already registered')
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
