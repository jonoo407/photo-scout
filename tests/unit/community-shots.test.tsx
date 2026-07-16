import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { CommunityPhoto } from '../../src/spots/community-photos-api'

/* Community shots on a spot page (feedback 2026-07-16): everyone's shots,
   best-rated first, star-ratable — the app's social layer. */

let photos: CommunityPhoto[] = []
const ratePhoto = vi.fn(async (_id: string, _r: number) => ({ ok: true as const, count: 4, avg: 4.5 }))
vi.mock('../../src/spots/community-photos-api', () => ({
  fetchSpotCommunityPhotos: async () => photos,
  ratePhoto: (id: string, r: number) => ratePhoto(id, r),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import CommunityShots from '../../src/ui/SpotDetail/CommunityShots'
import { useAuth } from '../../src/auth/useAuth'

const shot = (over: Partial<CommunityPhoto>): CommunityPhoto => ({
  id: 'p1', url: 'https://cdn.example/a.jpg', ownerInitials: 'SR', isMine: false,
  ratingsCount: 3, avgRating: 4.33, score: 3.8, myRating: null, ...over,
})

beforeEach(() => {
  photos = []
  ratePhoto.mockClear()
  useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null, linkError: null })
})

const renderShots = () => render(<MemoryRouter><CommunityShots spotId="bayshore-boulevard" /></MemoryRouter>)

describe('CommunityShots', () => {
  it('renders nothing while the spot has no community shots', async () => {
    const { container } = renderShots()
    await new Promise((r) => setTimeout(r, 30))
    expect(container.textContent).toBe('')
  })

  it('shows shots with rating stats and owner initials', async () => {
    photos = [
      shot({ id: 'p1', avgRating: 4.33, ratingsCount: 3, ownerInitials: 'SR' }),
      shot({ id: 'p2', avgRating: 0, ratingsCount: 0, ownerInitials: 'LO' }),
    ]
    renderShots()
    expect(await screen.findByText(/community shots/i)).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(2)
    expect(screen.getByText(/4\.3/)).toBeInTheDocument()
    expect(screen.getByText(/3 ratings/)).toBeInTheDocument()
    expect(screen.getByText(/no ratings yet/i)).toBeInTheDocument()
    expect(screen.getByText('SR')).toBeInTheDocument()
  })

  it('rates with a star tap and shows the fresh stats', async () => {
    const user = userEvent.setup()
    photos = [shot({ id: 'p1' })]
    renderShots()
    const card = (await screen.findByText(/3 ratings/)).closest('.commshot') as HTMLElement
    await user.click(within(card).getByRole('button', { name: /rate 5 stars/i }))
    expect(ratePhoto).toHaveBeenCalledWith('p1', 5)
    expect(await screen.findByText(/4 ratings/)).toBeInTheDocument()
  })

  it('marks your own shot and refuses to let you rate it', async () => {
    const user = userEvent.setup()
    photos = [shot({ id: 'p1', isMine: true, ownerInitials: 'FL' })]
    renderShots()
    expect(await screen.findByText(/your shot/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /rate 5 stars/i }))
    expect(ratePhoto).not.toHaveBeenCalled()
  })

  it('nudges guests to sign in instead of rating', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: null, status: 'ready', errorMsg: null, linkError: null })
    photos = [shot({ id: 'p1' })]
    renderShots()
    await user.click(await screen.findByRole('button', { name: /rate 4 stars/i }))
    expect(ratePhoto).not.toHaveBeenCalled()
    expect(screen.getByText(/sign in to rate/i)).toBeInTheDocument()
  })
})
