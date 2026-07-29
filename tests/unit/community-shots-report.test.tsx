import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { CommunityPhoto } from '../../src/spots/community-photos-api'

/* Reporting + blocking on community shots (V1, App Review guideline 1.2).
   A shot you report should stop being your problem immediately, and blocking
   someone should clear their work out of the list without a reload. */

let photos: CommunityPhoto[] = []
const fetchSpotCommunityPhotos = vi.fn(async () => photos)
vi.mock('../../src/spots/community-photos-api', () => ({
  fetchSpotCommunityPhotos: () => fetchSpotCommunityPhotos(),
  ratePhoto: async () => ({ ok: true as const, count: 1, avg: 5 }),
}))

type Reported = { ok: true; hidden: boolean } | { ok: false; message: string }
type Blocked = { ok: true } | { ok: false; message: string }
const reportPhoto = vi.fn(async (_id: string, _reason: string, _note?: string): Promise<Reported> =>
  ({ ok: true, hidden: false }))
const blockPhotographer = vi.fn(async (_ref: string): Promise<Blocked> => ({ ok: true }))
vi.mock('../../src/spots/photo-reports-api', async (orig) => ({
  ...(await orig<typeof import('../../src/spots/photo-reports-api')>()),
  reportPhoto: (id: string, reason: string, note?: string) => reportPhoto(id, reason, note),
  blockPhotographer: (ref: string) => blockPhotographer(ref),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import CommunityShots from '../../src/ui/SpotDetail/CommunityShots'
import { useAuth } from '../../src/auth/useAuth'

const shot = (over: Partial<CommunityPhoto>): CommunityPhoto => ({
  id: 'p1', url: 'https://cdn.example/a.jpg', ownerInitials: 'SR', ownerRef: 'ref-sr',
  isMine: false, ratingsCount: 3, avgRating: 4.33, score: 3.8, myRating: null, ...over,
})

beforeEach(() => {
  photos = []
  reportPhoto.mockClear()
  blockPhotographer.mockClear()
  fetchSpotCommunityPhotos.mockClear()
  useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null, linkError: null })
})

const renderShots = () => render(<MemoryRouter><CommunityShots spotId="bayshore-boulevard" /></MemoryRouter>)

const openSheetFor = async (user: ReturnType<typeof userEvent.setup>, id: string) => {
  const card = (await screen.findByTestId(`commshot-${id}`))
  await user.click(within(card).getByRole('button', { name: /report this shot/i }))
  return screen.getByRole('dialog', { name: /report this shot/i })
}

describe('reporting a community shot', () => {
  it('offers a report action on shots that are not yours', async () => {
    photos = [shot({ id: 'p1' })]
    renderShots()
    expect(await screen.findByRole('button', { name: /report this shot/i })).toBeInTheDocument()
  })

  it('offers no report action on your own shot — you can delete it instead', async () => {
    photos = [shot({ id: 'p1', isMine: true })]
    renderShots()
    await screen.findByText(/your shot/i)
    expect(screen.queryByRole('button', { name: /report this shot/i })).not.toBeInTheDocument()
  })

  it('lists every reason in the picker', async () => {
    const user = userEvent.setup()
    photos = [shot({ id: 'p1' })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    for (const label of [/offensive or explicit/i, /harassment or bullying/i, /not their photo/i, /spam or off-topic/i, /something else/i]) {
      expect(within(dialog).getByRole('radio', { name: label })).toBeInTheDocument()
    }
  })

  it('sends the chosen reason and note, then thanks the reporter', async () => {
    const user = userEvent.setup()
    photos = [shot({ id: 'p1' })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    await user.click(within(dialog).getByRole('radio', { name: /harassment or bullying/i }))
    await user.type(within(dialog).getByLabelText(/anything to add/i), 'targets a named person')
    await user.click(within(dialog).getByRole('button', { name: /^report$/i }))
    expect(reportPhoto).toHaveBeenCalledWith('p1', 'harassment', 'targets a named person')
    expect(await screen.findByText(/thanks — we'll review/i)).toBeInTheDocument()
  })

  it('cannot submit before a reason is chosen', async () => {
    const user = userEvent.setup()
    photos = [shot({ id: 'p1' })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    expect(within(dialog).getByRole('button', { name: /^report$/i })).toBeDisabled()
  })

  it('drops the shot from the list and says so when the report hides it', async () => {
    const user = userEvent.setup()
    reportPhoto.mockResolvedValueOnce({ ok: true, hidden: true })
    photos = [shot({ id: 'p1' }), shot({ id: 'p2' })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    await user.click(within(dialog).getByRole('radio', { name: /offensive or explicit/i }))
    await user.click(within(dialog).getByRole('button', { name: /^report$/i }))
    expect(await screen.findByText(/hidden while we review/i)).toBeInTheDocument()
    expect(screen.queryByTestId('commshot-p1')).not.toBeInTheDocument()
    expect(screen.getByTestId('commshot-p2')).toBeInTheDocument()
  })

  it('surfaces the server guard message when the report is refused', async () => {
    const user = userEvent.setup()
    reportPhoto.mockResolvedValueOnce({ ok: false, message: 'sign in to report a shot' })
    photos = [shot({ id: 'p1' })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    await user.click(within(dialog).getByRole('radio', { name: /spam or off-topic/i }))
    await user.click(within(dialog).getByRole('button', { name: /^report$/i }))
    expect(await screen.findByText(/sign in to report a shot/i)).toBeInTheDocument()
  })

  it('nudges guests to sign in rather than opening the picker', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: null, status: 'ready', errorMsg: null, linkError: null })
    photos = [shot({ id: 'p1' })]
    renderShots()
    await user.click(await screen.findByRole('button', { name: /report this shot/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText(/sign in to report/i)).toBeInTheDocument()
  })
})

describe('blocking a photographer', () => {
  it('blocks by the photographer ref, not the photo — one block covers all their shots', async () => {
    const user = userEvent.setup()
    photos = [
      shot({ id: 'p1', ownerInitials: 'SR', ownerRef: 'ref-sr' }),
      shot({ id: 'p2', ownerInitials: 'LO', ownerRef: 'ref-lo' }),
    ]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    await user.click(within(dialog).getByRole('button', { name: /block this photographer/i }))
    expect(blockPhotographer).toHaveBeenCalledWith('ref-sr')
    // the block hides everything of theirs, so the list is re-read from the server
    expect(await screen.findByText(/you won't see their shots/i)).toBeInTheDocument()
    expect(fetchSpotCommunityPhotos).toHaveBeenCalledTimes(2)
  })

  it('surfaces the guard message when the block is refused', async () => {
    const user = userEvent.setup()
    blockPhotographer.mockResolvedValueOnce({ ok: false, message: 'you cannot block yourself' })
    photos = [shot({ id: 'p1' })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    await user.click(within(dialog).getByRole('button', { name: /block this photographer/i }))
    expect(await screen.findByText(/you cannot block yourself/i)).toBeInTheDocument()
  })

  it('offers no block on a shot from before refs existed, rather than a dead button', async () => {
    const user = userEvent.setup()
    photos = [shot({ id: 'p1', ownerRef: null })]
    renderShots()
    const dialog = await openSheetFor(user, 'p1')
    expect(within(dialog).queryByRole('button', { name: /block this photographer/i }))
      .not.toBeInTheDocument()
    // reporting still works — the content path does not depend on knowing who
    expect(within(dialog).getByRole('button', { name: /^report$/i })).toBeInTheDocument()
  })
})
