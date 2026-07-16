import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Hunt, HuntProgressRow } from '../../src/hunts/hunts'

/* Hunt surfaces (handoff 2c hub, 2d detail, 4a completion sheet). All data
   comes from the mocked APIs — the real validation lives server-side. */

const TOUR: Hunt = {
  id: 'golden-hour-grand-tour', region: 'tampa-bay', title: 'Golden Hour Grand Tour',
  blurb: 'Five downtown stops that follow the evening light.',
  stops: [
    { spotId: 'bayshore-boulevard', name: 'Bayshore Boulevard', lat: 27.9165, lng: -82.4827, hint: 'From the balustrade.' },
    { spotId: 'plant-park-ut-minarets', name: 'Plant Park / UT Minarets', lat: 27.9459, lng: -82.4646, hint: 'Through the oaks.' },
    { spotId: 'tampa-riverwalk', name: 'Tampa Riverwalk', lat: 27.9468, lng: -82.4618, hint: 'The finale.' },
  ],
  stopPts: 25, finishPts: 100, opensAt: null, closesAt: null,
}
const WALK: Hunt = {
  id: 'old-city-evening-walk', region: 'tampa-bay', title: 'Old City Evening Walk', blurb: null,
  stops: [{ spotId: 'independence-hall', name: 'Independence Hall', lat: 39.9489, lng: -75.15 }],
  stopPts: 25, finishPts: 100, opensAt: null, closesAt: null,
}

let hunts: Hunt[] = []
let joins: string[] = []
let progress: HuntProgressRow[] = []
const joinHunt = vi.fn(async (_id: string) => true)
let submitResult: unknown = { ok: true, done: 1, total: 3, finished: false, awarded: 25, totalPts: 25 }
const submitHuntStop = vi.fn(async (_a: unknown) => submitResult)
vi.mock('../../src/hunts/hunts-api', () => ({
  fetchHunts: async () => hunts,
  fetchHuntById: async (id: string) => hunts.find((h) => h.id === id) ?? null,
  fetchMyHuntState: async () => ({ joins, progress }),
  joinHunt: (id: string) => joinHunt(id),
  submitHuntStop: (a: unknown) => submitHuntStop(a),
}))

const uploadSpotPhoto = vi.fn(async (_s: string, _f: File) => 'u-1/plant-park-ut-minarets/1-shot.jpg')
vi.mock('../../src/spots/photos-api', () => ({
  uploadSpotPhoto: (s: string, f: File) => uploadSpotPhoto(s, f),
  spotPhotoUrl: async (path: string) => `https://cdn.example/${path}`,
}))

vi.mock('../../src/hunts/geo', () => ({
  getPosition: async () => ({ lat: 27.946, lng: -82.4647 }),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import HuntsHubScreen from '../../src/ui/Hunts/HuntsHubScreen'
import HuntDetailScreen from '../../src/ui/Hunts/HuntDetailScreen'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

const renderHub = () => render(<MemoryRouter><HuntsHubScreen /></MemoryRouter>)
const renderDetail = (id = TOUR.id) =>
  render(
    <MemoryRouter initialEntries={[`/hunts/${id}`]}>
      <Routes>
        <Route path="/hunts/:id" element={<HuntDetailScreen />} />
        <Route path="/spot/:id" element={<div data-testid="spot-page">spot</div>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  hunts = [TOUR, WALK]
  joins = []
  progress = []
  joinHunt.mockClear()
  submitHuntStop.mockClear()
  uploadSpotPhoto.mockClear()
  submitResult = { ok: true, done: 1, total: 3, finished: false, awarded: 25, totalPts: 25 }
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay' })
  useAuth.setState({ user: { id: 'u-1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
})

describe('Hunts hub (2c)', () => {
  it('splits hunts into active, open, and completed', async () => {
    joins = [TOUR.id, WALK.id]
    progress = [
      { huntId: TOUR.id, stopIndex: 0, photoPath: 'a', createdAt: '2026-07-14T00:00:00Z' },
      { huntId: WALK.id, stopIndex: 0, photoPath: 'b', createdAt: '2026-07-13T00:00:00Z' },
    ]
    renderHub()
    expect(await screen.findByText('ACTIVE')).toBeInTheDocument()
    const active = screen.getByText('Golden Hour Grand Tour').closest('.card') as HTMLElement
    expect(within(active).getByText(/1 of 3 stops/)).toBeInTheDocument()
    expect(within(active).getByRole('button', { name: /continue/i })).toBeInTheDocument()
    // WALK has its single stop done → completed.
    expect(screen.getByText('COMPLETED')).toBeInTheDocument()
    expect(screen.getByText('Old City Evening Walk')).toBeInTheDocument()
  })

  it('offers Join on open hunts and jumps into the hunt', async () => {
    const user = userEvent.setup()
    renderHub()
    expect(await screen.findByText('OPEN HUNTS')).toBeInTheDocument()
    expect(screen.getByText(/3 stops · up to 175 pts/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /^join$/i })[0])
    expect(joinHunt).toHaveBeenCalledWith(TOUR.id)
  })

  it('nudges guests to sign in instead of joining', async () => {
    const user = userEvent.setup()
    useAuth.setState({ user: null, status: 'ready', errorMsg: null })
    renderHub()
    await user.click((await screen.findAllByRole('button', { name: /^join$/i }))[0])
    expect(joinHunt).not.toHaveBeenCalled()
    expect(screen.getByText(/Accounts are free — sign in to join/i)).toBeInTheDocument()
  })
})

describe('Hunt detail (2d)', () => {
  it('renders the point pills and done/next/locked stop states', async () => {
    joins = [TOUR.id]
    progress = [{ huntId: TOUR.id, stopIndex: 0, photoPath: 'u-1/bayshore-boulevard/0.jpg', createdAt: '2026-07-14T00:00:00Z' }]
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Golden Hour Grand Tour' })).toBeInTheDocument()
    expect(screen.getByText('+25 per stop')).toBeInTheDocument()
    expect(screen.getByText('+100 finish bonus')).toBeInTheDocument()
    expect(screen.getByText(/1 of 3 stops shot/)).toBeInTheDocument()
    // done stop shows its proof + points; next has the CTA; later stops locked
    expect(await screen.findByAltText(/your shot at Bayshore Boulevard/i)).toBeInTheDocument()
    expect(screen.getByText('+25')).toBeInTheDocument()
    expect(screen.getByText('Through the oaks.')).toBeInTheDocument() // the next stop's hint
    expect(screen.getByRole('button', { name: /submit a shot/i })).toBeInTheDocument()
    expect(screen.getByText(/within 150 m/)).toBeInTheDocument()
    expect(screen.getByText(/unlocks after stop 2/i)).toBeInTheDocument()
  })

  it('submits: upload → locate → RPC, then advances the progress', async () => {
    joins = [TOUR.id]
    progress = [{ huntId: TOUR.id, stopIndex: 0, photoPath: 'a', createdAt: '2026-07-14T00:00:00Z' }]
    submitResult = { ok: true, done: 2, total: 3, finished: false, awarded: 25, totalPts: 50 }
    renderDetail()
    await screen.findByRole('button', { name: /submit a shot/i })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'shot.jpg', { type: 'image/jpeg' })] } })
    expect(await screen.findByText(/2 of 3 stops shot/)).toBeInTheDocument()
    expect(uploadSpotPhoto).toHaveBeenCalledWith('plant-park-ut-minarets', expect.any(File))
    expect(submitHuntStop).toHaveBeenCalledWith({
      huntId: TOUR.id, stopIndex: 1, photoPath: 'u-1/plant-park-ut-minarets/1-shot.jpg',
      lat: 27.946, lng: -82.4647,
    })
  })

  it('celebrates the finish with the tally sheet (4a)', async () => {
    joins = [TOUR.id]
    progress = [
      { huntId: TOUR.id, stopIndex: 0, photoPath: 'a', createdAt: '2026-07-14T00:00:00Z' },
      { huntId: TOUR.id, stopIndex: 1, photoPath: 'b', createdAt: '2026-07-14T01:00:00Z' },
    ]
    submitResult = { ok: true, done: 3, total: 3, finished: true, awarded: 125, totalPts: 175 }
    renderDetail()
    await screen.findByRole('button', { name: /submit a shot/i })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'shot.jpg', { type: 'image/jpeg' })] } })
    const sheet = await screen.findByRole('dialog', { name: /hunt complete/i })
    expect(within(sheet).getByText(/Golden Hour Grand Tour/)).toBeInTheDocument()
    expect(within(sheet).getByText('3 stops')).toBeInTheDocument()
    expect(within(sheet).getByText('+75')).toBeInTheDocument()
    expect(within(sheet).getByText(/finish bonus/i)).toBeInTheDocument()
    expect(within(sheet).getByText('+100')).toBeInTheDocument()
    expect(within(sheet).getByText(/175 pts/)).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: /back to hunts/i })).toBeInTheDocument()
  })

  it('shows the server guard message when a submission is rejected', async () => {
    joins = [TOUR.id]
    submitResult = { ok: false, message: 'too far from the stop (~800 m away)' }
    renderDetail()
    await screen.findByRole('button', { name: /submit a shot/i })
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['x'], 'shot.jpg', { type: 'image/jpeg' })] } })
    expect(await screen.findByText(/too far from the stop/)).toBeInTheDocument()
  })

  it('previews every location BEFORE joining, each tappable to its spot guide (feedback 2026-07-16)', async () => {
    const user = userEvent.setup()
    // Signed in but NOT joined: the full route is browsable, nothing reads locked.
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Golden Hour Grand Tour' })).toBeInTheDocument()
    for (const stop of TOUR.stops) expect(screen.getByText(new RegExp(stop.name))).toBeInTheDocument()
    expect(screen.getByText('From the balustrade.')).toBeInTheDocument() // hints sell the route
    expect(screen.queryByText(/unlocks after/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join this hunt/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Bayshore Boulevard/ }))
    expect(await screen.findByTestId('spot-page')).toBeInTheDocument()
  })

  it('asks guests to sign in before hunting', async () => {
    useAuth.setState({ user: null, status: 'ready', errorMsg: null })
    renderDetail()
    expect(await screen.findByText('Sign in to hunt')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit a shot/i })).not.toBeInTheDocument()
  })
})
