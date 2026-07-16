import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { MyPhoto } from '../../src/spots/photos-api'
import type { PointEvent } from '../../src/craft/points'

/* Per-spot upload quotas (feedback 2026-07-16): 2 shots per spot at
   Apprentice, growing with craft points. The server enforces it; the UI
   shows the allowance and stops dead ends before they happen. */

let myPhotos: MyPhoto[] = []
vi.mock('../../src/spots/photos-api', () => ({
  listMyPhotos: async () => myPhotos,
  uploadSpotPhoto: vi.fn(),
  deleteSpotPhoto: vi.fn(),
}))

let serverEvents: PointEvent[] = []
vi.mock('../../src/craft/points-api', () => ({
  fetchMyPointEvents: async () => serverEvents,
}))

import SpotPhotos from '../../src/ui/SpotDetail/SpotPhotos'
import { useAuth } from '../../src/auth/useAuth'

const photo = (id: string): MyPhoto => ({ id, path: `u1/spot/${id}.jpg`, url: `https://cdn.example/${id}.jpg` })
const ev = (id: string, pts: number): PointEvent => ({ id, at: '2026-07-16T00:00:00Z', reason: 'huntStop', pts })

beforeEach(() => {
  myPhotos = []
  serverEvents = []
  useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null, linkError: null })
})

const renderPhotos = () => render(<MemoryRouter><SpotPhotos spotId="bayshore-boulevard" /></MemoryRouter>)

describe('SpotPhotos — quota display', () => {
  it('shows the allowance for an Apprentice', async () => {
    myPhotos = [photo('a')]
    renderPhotos()
    expect(await screen.findByText(/1 of 2 shots at this spot/i)).toBeInTheDocument()
  })

  it('at the limit: no Add control, and the way to raise it is spelled out', async () => {
    myPhotos = [photo('a'), photo('b')]
    renderPhotos()
    expect(await screen.findByText(/2 of 2 shots at this spot/i)).toBeInTheDocument()
    expect(screen.queryByText(/^Add/)).not.toBeInTheDocument()
    expect(screen.getByText(/earn points to raise your limit/i)).toBeInTheDocument()
  })

  it('a higher tier gets a bigger allowance (1,000 pts → 4)', async () => {
    serverEvents = [ev('a', 500), ev('b', 500)]
    myPhotos = [photo('a'), photo('b')]
    renderPhotos()
    expect(await screen.findByText(/2 of 4 shots at this spot/i)).toBeInTheDocument()
    expect(screen.getByText(/^Add/)).toBeInTheDocument()
  })
})
