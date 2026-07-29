import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/* The rest of App Review guideline 1.2: a filter on what gets POSTED, a way to
   manage who you've blocked, and published contact information. Reporting and
   blocking themselves live in community-shots-report.test.tsx. */

const uploadSpotPhoto = vi.fn(async (_spotId: string, _file: File) => 'u1/spot/a.jpg')
vi.mock('../../src/spots/photos-api', () => ({
  uploadSpotPhoto: (s: string, f: File) => uploadSpotPhoto(s, f),
  listMyPhotos: async () => [],
  deleteSpotPhoto: async () => {},
}))
vi.mock('../../src/craft/points-api', () => ({ fetchMyPointEvents: async () => [] }))

const fetchBlockedCount = vi.fn(async () => 2)
const unblockEveryone = vi.fn(async () => true)
vi.mock('../../src/spots/photo-reports-api', async (orig) => ({
  ...(await orig<typeof import('../../src/spots/photo-reports-api')>()),
  fetchBlockedCount: () => fetchBlockedCount(),
  unblockEveryone: () => unblockEveryone(),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import SpotPhotos from '../../src/ui/SpotDetail/SpotPhotos'
import GuidelinesScreen from '../../src/ui/Settings/GuidelinesScreen'
import SafetySection from '../../src/ui/Settings/SafetySection'
import { SUPPORT_EMAIL } from '../../src/community/standards'
import { useAuth } from '../../src/auth/useAuth'
import { useStore } from '../../src/state/store'

beforeEach(() => {
  uploadSpotPhoto.mockClear()
  fetchBlockedCount.mockClear()
  unblockEveryone.mockClear()
  useAuth.setState({ user: { id: 'u1', email: 'jon@example.com' }, status: 'ready', errorMsg: null, linkError: null })
  useStore.setState({ communityRulesAcceptedAt: null })
})

const wrap = (el: React.ReactElement) => render(<MemoryRouter>{el}</MemoryRouter>)

describe('posting filter — standards agreed before the first upload', () => {
  it('asks for agreement instead of opening the file picker', async () => {
    const user = userEvent.setup()
    wrap(<SpotPhotos spotId="bayshore-boulevard" />)
    await user.click(await screen.findByRole('button', { name: /add your photo/i }))
    const dialog = screen.getByRole('dialog', { name: /community standards/i })
    expect(within(dialog).getByText(/nothing offensive/i)).toBeInTheDocument()
    expect(uploadSpotPhoto).not.toHaveBeenCalled()
  })

  it('records the agreement and then offers the real upload control', async () => {
    const user = userEvent.setup()
    wrap(<SpotPhotos spotId="bayshore-boulevard" />)
    await user.click(await screen.findByRole('button', { name: /add your photo/i }))
    await user.click(screen.getByRole('button', { name: /i agree/i }))
    expect(useStore.getState().communityRulesAcceptedAt).toBeTruthy()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByLabelText(/add your photo/i)).toHaveAttribute('type', 'file')
  })

  it('does not ask again once agreed', async () => {
    useStore.setState({ communityRulesAcceptedAt: '2026-07-28T00:00:00.000Z' })
    wrap(<SpotPhotos spotId="bayshore-boulevard" />)
    expect(await screen.findByLabelText(/add your photo/i)).toHaveAttribute('type', 'file')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('block management in Settings', () => {
  it('shows how many photographers you have blocked', async () => {
    wrap(<SafetySection />)
    expect(await screen.findByText(/2 blocked/i)).toBeInTheDocument()
  })

  it('unblocks everyone and drops the count to zero', async () => {
    const user = userEvent.setup()
    wrap(<SafetySection />)
    await user.click(await screen.findByRole('button', { name: /unblock all/i }))
    expect(unblockEveryone).toHaveBeenCalled()
    expect(await screen.findByText(/nobody blocked/i)).toBeInTheDocument()
  })

  it('hides the unblock control when nobody is blocked', async () => {
    fetchBlockedCount.mockResolvedValueOnce(0)
    wrap(<SafetySection />)
    expect(await screen.findByText(/nobody blocked/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unblock all/i })).not.toBeInTheDocument()
  })

  it('links to the community guidelines', async () => {
    wrap(<SafetySection />)
    expect(await screen.findByRole('link', { name: /community guidelines/i }))
      .toHaveAttribute('href', '/guidelines')
  })
})

describe('published contact information', () => {
  it('publishes a reachable contact route on the guidelines screen', () => {
    wrap(<GuidelinesScreen />)
    expect(screen.getByRole('link', { name: new RegExp(SUPPORT_EMAIL, 'i') }))
      .toHaveAttribute('href', `mailto:${SUPPORT_EMAIL}`)
  })

  it('states what is not allowed and how reports are handled', () => {
    wrap(<GuidelinesScreen />)
    expect(screen.getByText(/what isn't allowed/i)).toBeInTheDocument()
    expect(screen.getByText(/two independent reports/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /send feedback|contact/i })).toBeInTheDocument()
  })
})
