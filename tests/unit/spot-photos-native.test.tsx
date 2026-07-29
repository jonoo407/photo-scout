import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* "Add your photo" on native vs web (J3 phase 4).

   Web keeps the file input — the browser's picker is the right control there.
   Native swaps it for a button that opens the iOS camera sheet, because a file
   input inside the wrapper lands in the document picker instead. */

const mocks = vi.hoisted(() => ({
  listMyPhotos: vi.fn(async () => [] as Array<{ id: string; path: string; url: string }>),
  uploadSpotPhoto: vi.fn(async () => {}),
  deleteSpotPhoto: vi.fn(async () => {}),
  capturePhoto: vi.fn(async () => null as File | null),
  nativeCaptureAvailable: vi.fn(() => false),
}))
vi.mock('../../src/spots/photos-api', () => ({
  listMyPhotos: mocks.listMyPhotos,
  uploadSpotPhoto: mocks.uploadSpotPhoto,
  deleteSpotPhoto: mocks.deleteSpotPhoto,
}))
vi.mock('../../src/spots/capture', () => ({
  capturePhoto: mocks.capturePhoto,
  nativeCaptureAvailable: mocks.nativeCaptureAvailable,
}))
vi.mock('../../src/auth/supabase', () => ({ authAvailable: () => true }))
vi.mock('../../src/craft/points-api', () => ({ fetchMyPointEvents: async () => [] }))

import SpotPhotos from '../../src/ui/SpotDetail/SpotPhotos'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.listMyPhotos.mockResolvedValue([])
  mocks.nativeCaptureAvailable.mockReturnValue(false)
  act(() => useAuth.setState({ user: { id: 'u1', email: 'x@y.z' } }))
  act(() => useStore.setState({ communityRulesAcceptedAt: '2026-07-29T00:00:00.000Z' }))
})

describe('web', () => {
  it('keeps the file input', async () => {
    render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)
    expect(await screen.findByLabelText(/add your photo/i)).toHaveAttribute('type', 'file')
    expect(mocks.capturePhoto).not.toHaveBeenCalled()
  })
})

describe('native', () => {
  beforeEach(() => mocks.nativeCaptureAvailable.mockReturnValue(true))

  it('offers a button instead of a file input', async () => {
    render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)
    const control = await screen.findByRole('button', { name: /add your photo/i })
    expect(control).toBeInTheDocument()
    expect(screen.queryByLabelText(/add your photo/i)).not.toHaveAttribute('type', 'file')
  })

  it('uploads what the camera returns', async () => {
    const user = userEvent.setup()
    const file = new File(['x'], 'shot.jpg', { type: 'image/jpeg' })
    mocks.capturePhoto.mockResolvedValueOnce(file)
    render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: /add your photo/i }))
    expect(mocks.capturePhoto).toHaveBeenCalled()
    expect(mocks.uploadSpotPhoto).toHaveBeenCalledWith('bayshore-boulevard', file)
  })

  it('does nothing at all when the user cancels', async () => {
    const user = userEvent.setup()
    mocks.capturePhoto.mockResolvedValueOnce(null)
    render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: /add your photo/i }))
    expect(mocks.uploadSpotPhoto).not.toHaveBeenCalled()
    expect(screen.queryByText(/could not|failed/i)).not.toBeInTheDocument()
  })

  it('shows the capture error when the camera genuinely fails', async () => {
    const user = userEvent.setup()
    mocks.capturePhoto.mockRejectedValueOnce(new Error('Camera access is off — turn it on for Vantage in iOS Settings.'))
    render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: /add your photo/i }))
    expect(await screen.findByText(/iOS Settings/i)).toBeInTheDocument()
  })

  it('still gates the first upload behind the standards agreement', async () => {
    const user = userEvent.setup()
    act(() => useStore.setState({ communityRulesAcceptedAt: null }))
    render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)
    await user.click(await screen.findByRole('button', { name: /add your photo/i }))
    expect(screen.getByRole('dialog', { name: /community standards/i })).toBeInTheDocument()
    expect(mocks.capturePhoto).not.toHaveBeenCalled()
  })
})
