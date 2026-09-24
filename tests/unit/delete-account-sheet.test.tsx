import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* Settings → Account → Delete account (App Store guideline 5.1.1(v)).
   Apple asks that deletion be easy to FIND and hard to do by accident: a
   clearly labelled row, a sheet that says what goes, and a typed word as the
   confirmation. */

const mocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(async (_uid: string) => ({ ok: true }) as { ok: true } | { ok: false; message: string }),
}))
vi.mock('../../src/auth/delete-account', () => ({ deleteAccount: mocks.deleteAccount }))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn(), signOut: vi.fn() } })),
}))

import AccountSection from '../../src/ui/Settings/AccountSection'
import LoginScreen from '../../src/ui/Login/LoginScreen'
import { useAuth } from '../../src/auth/useAuth'

const USER = { id: '11111111-2222-4333-8444-555555555555', email: 'jon@example.test' }

beforeEach(() => {
  mocks.deleteAccount.mockClear()
  mocks.deleteAccount.mockResolvedValue({ ok: true })
  useAuth.setState({ user: USER, status: 'ready', notice: null, linkError: null })
})

const wrap = () => render(<MemoryRouter><AccountSection /></MemoryRouter>)
const open = async (user: ReturnType<typeof userEvent.setup>) => {
  wrap()
  await user.click(screen.getByRole('button', { name: /delete account/i }))
  return screen.getByRole('dialog', { name: /delete your account/i })
}

describe('Settings → Delete account', () => {
  it('sits in the Account section, next to Sign out', () => {
    wrap()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument()
  })

  it('opens a sheet that names the account and says what is deleted', async () => {
    const dialog = await open(userEvent.setup())
    expect(dialog).toHaveTextContent('jon@example.test')
    expect(dialog).toHaveTextContent(/can't be undone/i)
    expect(dialog).toHaveTextContent(/saved spots/i)
    expect(dialog).toHaveTextContent(/client shortlists/i)
    expect(dialog).toHaveTextContent(/every photo you added/i)
  })

  it('keeps the delete button disabled until DELETE is typed', async () => {
    const user = userEvent.setup()
    await open(user)
    const confirm = screen.getByRole('button', { name: /delete my account/i })
    expect(confirm).toBeDisabled()

    await user.type(screen.getByLabelText(/type delete to confirm/i), 'delet')
    expect(confirm).toBeDisabled()
    await user.click(confirm)
    expect(mocks.deleteAccount).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText(/type delete to confirm/i), 'e')
    expect(confirm).toBeEnabled()
  })

  it('deletes this user\'s account and leaves a notice for the sign-in screen', async () => {
    const user = userEvent.setup()
    await open(user)
    await user.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE')
    await user.click(screen.getByRole('button', { name: /delete my account/i }))

    expect(mocks.deleteAccount).toHaveBeenCalledWith(USER.id)
    expect(useAuth.getState().notice).toMatch(/deleted/i)
  })

  it('shows the server\'s refusal and keeps the sheet open to retry', async () => {
    const user = userEvent.setup()
    mocks.deleteAccount.mockResolvedValueOnce({ ok: false, message: 'Could not delete your account — nothing was lost.' })
    await open(user)
    await user.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE')
    await user.click(screen.getByRole('button', { name: /delete my account/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/nothing was lost/i)
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeEnabled()
    expect(useAuth.getState().notice).toBeNull()
  })

  it('cancel closes the sheet without deleting anything', async () => {
    const user = userEvent.setup()
    await open(user)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })
})

describe('after deletion', () => {
  it('the sign-in screen confirms the account is gone, and the notice can be dismissed', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: null, notice: 'Your account and everything in it have been deleted.' })
    render(<MemoryRouter><LoginScreen /></MemoryRouter>)
    expect(screen.getByRole('status')).toHaveTextContent(/have been deleted/i)
    await user.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
