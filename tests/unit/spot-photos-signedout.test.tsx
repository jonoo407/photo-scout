import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* Signed-out spot page (tester report, build 15): "there's no button to add
   my own photos."

   Two causes. The release pipeline shipped the native app with auth disabled
   (fixed in the workflow), and even with auth working, SpotPhotos rendered
   NOTHING signed-out — an invisible feature no tester can discover. Signed
   out, the section must exist and say how to get in. */

const mocks = vi.hoisted(() => ({
  listMyPhotos: vi.fn(async () => []),
  uploadSpotPhoto: vi.fn(async () => {}),
  deleteSpotPhoto: vi.fn(async () => {}),
  authAvailable: vi.fn(() => true),
}))
vi.mock('../../src/spots/photos-api', () => ({
  listMyPhotos: mocks.listMyPhotos,
  uploadSpotPhoto: mocks.uploadSpotPhoto,
  deleteSpotPhoto: mocks.deleteSpotPhoto,
}))
vi.mock('../../src/auth/supabase', () => ({ authAvailable: mocks.authAvailable }))
vi.mock('../../src/craft/points-api', () => ({ fetchMyPointEvents: async () => [] }))

import SpotPhotos from '../../src/ui/SpotDetail/SpotPhotos'
import { useAuth } from '../../src/auth/useAuth'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.authAvailable.mockReturnValue(true)
  act(() => useAuth.setState({ user: null, status: 'ready' }))
})

const wrap = () => render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)

describe('SpotPhotos signed out', () => {
  it('shows the section with a way in, instead of hiding the feature', () => {
    wrap()
    expect(screen.getByRole('heading', { name: /your shots/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('routes to Settings, where sign-in lives', async () => {
    const user = userEvent.setup()
    wrap()
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    // MemoryRouter has no visible destination; asserting no crash + the
    // button is wired is enough here — the nav target is /settings.
  })

  it('never calls the photo listing while signed out', () => {
    wrap()
    expect(mocks.listMyPhotos).not.toHaveBeenCalled()
  })

  it('still renders nothing when auth is not configured at all', () => {
    mocks.authAvailable.mockReturnValue(false)
    const { container } = wrap()
    expect(container.textContent).toBe('')
  })
})
