import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

let photos: unknown[] = []
vi.mock('../../src/spots/photos-api', () => ({
  listAllMyPhotos: async () => photos,
}))

import YourShotsScreen from '../../src/ui/You/YourShotsScreen'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => {
  photos = []
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay' })
  useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
})

describe('Your shots gallery (/you/shots)', () => {
  it('groups shots under their spot names', async () => {
    photos = [
      { id: 'p1', path: 'u1/bayshore-boulevard/a.jpg', url: 'https://cdn.example/a.jpg', spotId: 'bayshore-boulevard', createdAt: '2026-07-10T00:00:00Z' },
      { id: 'p2', path: 'u1/bayshore-boulevard/b.jpg', url: 'https://cdn.example/b.jpg', spotId: 'bayshore-boulevard', createdAt: '2026-07-09T00:00:00Z' },
      { id: 'p3', path: 'u1/fort-de-soto-park/c.jpg', url: 'https://cdn.example/c.jpg', spotId: 'fort-de-soto-park', createdAt: '2026-07-08T00:00:00Z' },
    ]
    render(<MemoryRouter><YourShotsScreen /></MemoryRouter>)
    expect(await screen.findByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.getByText('Fort De Soto Park')).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(3)
    expect(screen.getByText(/3 shots across 2 spots/i)).toBeInTheDocument()
  })

  it('shows an empty state when nothing is uploaded yet', async () => {
    render(<MemoryRouter><YourShotsScreen /></MemoryRouter>)
    expect(await screen.findByText(/no shots yet/i)).toBeInTheDocument()
  })

  it('asks guests to sign in', () => {
    useAuth.setState({ user: null, status: 'ready', errorMsg: null })
    render(<MemoryRouter><YourShotsScreen /></MemoryRouter>)
    expect(screen.getByText('Sign in to keep shots')).toBeInTheDocument()
  })
})
