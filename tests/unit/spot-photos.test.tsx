import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mocks = vi.hoisted(() => ({
  listMyPhotos: vi.fn(async () => [] as Array<{ id: string; path: string; url: string }>),
  uploadSpotPhoto: vi.fn(async () => {}),
  deleteSpotPhoto: vi.fn(async () => {}),
}))
vi.mock('../../src/spots/photos-api', () => mocks)
vi.mock('../../src/auth/supabase', () => ({ authAvailable: () => true }))

import SpotPhotos from '../../src/ui/SpotDetail/SpotPhotos'
import { useAuth } from '../../src/auth/useAuth'

beforeEach(() => {
  vi.clearAllMocks()
  mocks.listMyPhotos.mockResolvedValue([])
  act(() => useAuth.setState({ user: { id: 'u1', email: 'x@y.z' } }))
})

describe('SpotPhotos', () => {
  it('renders nothing when signed out', () => {
    act(() => useAuth.setState({ user: null }))
    const { container } = render(<SpotPhotos spotId="bayshore-boulevard" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('signed in: shows the add control and my existing shots', async () => {
    mocks.listMyPhotos.mockResolvedValue([{ id: 'p1', path: 'u1/x/1.jpg', url: 'https://cdn.test/1.jpg' }])
    render(<SpotPhotos spotId="bayshore-boulevard" />)
    expect(await screen.findByLabelText(/add your photo/i)).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /your shot/i })).toBeInTheDocument()
  })

  it('uploads a chosen file and refreshes the strip', async () => {
    const user = userEvent.setup()
    render(<SpotPhotos spotId="bayshore-boulevard" />)
    const input = (await screen.findByLabelText(/add your photo/i)) as HTMLInputElement
    const file = new File(['x'], 'mine.jpg', { type: 'image/jpeg' })
    await user.upload(input, file)
    expect(mocks.uploadSpotPhoto).toHaveBeenCalledWith('bayshore-boulevard', file)
    expect(mocks.listMyPhotos.mock.calls.length).toBeGreaterThanOrEqual(2) // initial + refresh
  })

  it('deletes with a two-tap confirm', async () => {
    const user = userEvent.setup()
    mocks.listMyPhotos.mockResolvedValue([{ id: 'p1', path: 'u1/x/1.jpg', url: 'https://cdn.test/1.jpg' }])
    render(<SpotPhotos spotId="bayshore-boulevard" />)
    await user.click(await screen.findByRole('button', { name: /remove photo/i }))
    expect(mocks.deleteSpotPhoto).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /confirm remove/i }))
    expect(mocks.deleteSpotPhoto).toHaveBeenCalledWith('p1', 'u1/x/1.jpg')
  })
})
