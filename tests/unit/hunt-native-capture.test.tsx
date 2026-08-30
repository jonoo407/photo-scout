import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { Hunt } from '../../src/hunts/hunts'

/* The native branch of hunt submission. Inside the wrapper the file input is
   replaced by the iOS camera sheet (guideline 4.2), so this is a second, fully
   separate path into the same submit flow — and it was the largest single block
   of untested handler code in the app. */

const TOUR: Hunt = {
  id: 'golden-hour-grand-tour', region: 'tampa-bay', title: 'Golden Hour Grand Tour',
  blurb: null,
  stops: [
    { spotId: 'bayshore-boulevard', name: 'Bayshore Boulevard', lat: 27.9165, lng: -82.4827, hint: 'From the balustrade.' },
    { spotId: 'tampa-riverwalk', name: 'Tampa Riverwalk', lat: 27.9468, lng: -82.4618, hint: 'The finale.' },
  ],
  stopPts: 25, finishPts: 100, opensAt: null, closesAt: null,
}

const capturePhoto = vi.fn<() => Promise<File | null>>()
vi.mock('../../src/spots/capture', () => ({
  capturePhoto: () => capturePhoto(),
  nativeCaptureAvailable: () => true, // pretend we are inside the wrapper
}))

const submitHuntStop = vi.fn(async (_a: unknown) => ({
  ok: true, done: 1, total: 2, finished: false, awarded: 25, totalPts: 25,
} as unknown))
const uploadSpotPhoto = vi.fn(async (_s: string, _f: File) => 'u-1/bayshore-boulevard/1.jpg')

vi.mock('../../src/hunts/hunts-api', () => ({
  fetchHunts: async () => [TOUR],
  fetchHuntById: async () => TOUR,
  fetchMyHuntState: async () => ({ joins: [TOUR.id], progress: [] }),
  joinHunt: async () => true,
  submitHuntStop: (a: unknown) => submitHuntStop(a),
}))
vi.mock('../../src/spots/photos-api', () => ({
  uploadSpotPhoto: (s: string, f: File) => uploadSpotPhoto(s, f),
  spotPhotoUrl: async (p: string) => `https://cdn.example/${p}`,
}))
vi.mock('../../src/hunts/geo', () => ({ getPosition: async () => ({ lat: 27.9165, lng: -82.4827 }) }))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import HuntDetailScreen from '../../src/ui/Hunts/HuntDetailScreen'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

const renderDetail = () => render(
  <MemoryRouter initialEntries={[`/hunts/${TOUR.id}`]}>
    <Routes>
      <Route path="/hunts/:id" element={<HuntDetailScreen />} />
      <Route path="/hunts" element={<div data-testid="hub">hub</div>} />
    </Routes>
  </MemoryRouter>,
)

const shot = () => new File([new Uint8Array([1, 2, 3])], 'shot.jpg', { type: 'image/jpeg' })

beforeEach(() => {
  vi.clearAllMocks()
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay' })
  useAuth.setState({ user: { id: 'u-1', email: 'jon@example.com' }, status: 'ready', errorMsg: null })
})

describe('Hunt detail — native capture', () => {
  it('shows the camera button instead of a file input inside the wrapper', async () => {
    renderDetail()
    expect(await screen.findByRole('button', { name: /submit a shot/i })).toBeInTheDocument()
  })

  it('capture → upload → locate → submit, then advances progress', async () => {
    const user = userEvent.setup()
    capturePhoto.mockResolvedValue(shot())
    renderDetail()

    await user.click(await screen.findByRole('button', { name: /submit a shot/i }))

    await waitFor(() => expect(submitHuntStop).toHaveBeenCalled())
    expect(uploadSpotPhoto).toHaveBeenCalledWith('bayshore-boulevard', expect.any(File))
    expect(submitHuntStop).toHaveBeenCalledWith({
      huntId: TOUR.id, stopIndex: 0, photoPath: 'u-1/bayshore-boulevard/1.jpg',
      lat: 27.9165, lng: -82.4827,
    })
    await waitFor(() => expect(screen.getByText(/1 of 2 stops shot/)).toBeInTheDocument())
  })

  it('stays silent when the picker is cancelled', async () => {
    const user = userEvent.setup()
    capturePhoto.mockResolvedValue(null) // cancelled — not an error
    renderDetail()

    await user.click(await screen.findByRole('button', { name: /submit a shot/i }))

    await waitFor(() => expect(capturePhoto).toHaveBeenCalled())
    expect(uploadSpotPhoto).not.toHaveBeenCalled()
    expect(submitHuntStop).not.toHaveBeenCalled()
    expect(screen.queryByText(/could not open the camera/i)).not.toBeInTheDocument()
  })

  it('surfaces a camera permission error where the user can read it', async () => {
    const user = userEvent.setup()
    capturePhoto.mockRejectedValue(new Error('Camera access is off — turn it on for Vantage in iOS Settings.'))
    renderDetail()

    await user.click(await screen.findByRole('button', { name: /submit a shot/i }))
    expect(await screen.findByText(/turn it on for Vantage in iOS Settings/i)).toBeInTheDocument()
    expect(uploadSpotPhoto).not.toHaveBeenCalled()
  })

  it('reports a rejected submission from the server guard', async () => {
    const user = userEvent.setup()
    capturePhoto.mockResolvedValue(shot())
    submitHuntStop.mockResolvedValue({ ok: false, message: 'You need to be within 150 m of the stop.' })
    renderDetail()

    await user.click(await screen.findByRole('button', { name: /submit a shot/i }))
    // The static hint mentions 150 m too — match the server's exact sentence.
    expect(await screen.findByText('You need to be within 150 m of the stop.')).toBeInTheDocument()
    // The stop is not marked done on a refusal.
    expect(screen.queryByText(/1 of 2 stops shot/)).not.toBeInTheDocument()
  })

  it('recovers from an upload failure without wedging the button', async () => {
    const user = userEvent.setup()
    capturePhoto.mockResolvedValue(shot())
    uploadSpotPhoto.mockRejectedValue(new Error('Upload failed — check your signal.'))
    renderDetail()

    const button = await screen.findByRole('button', { name: /submit a shot/i })
    await user.click(button)

    expect(await screen.findByText(/Upload failed — check your signal/i)).toBeInTheDocument()
    // Busy must clear, or a failed upload leaves the hunt permanently stuck.
    await waitFor(() => expect(screen.getByRole('button', { name: /submit a shot/i })).not.toBeDisabled())
  })

  it('goes back to the hub', async () => {
    const user = userEvent.setup()
    renderDetail()
    await user.click(await screen.findByRole('button', { name: /hunts/i }))
    expect(screen.getByTestId('hub')).toBeInTheDocument()
  })
})
