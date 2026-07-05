import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock the stored-list API (v2) — the inline ?spots= path never touches it.
const fetchSharedShortlist = vi.fn<(id: string) => Promise<unknown>>(async () => null)
const submitShortlistResponse = vi.fn(async () => {})
vi.mock('../../src/spots/shortlist-api', () => ({
  fetchSharedShortlist: (id: string) => fetchSharedShortlist(id),
  submitShortlistResponse: (...a: unknown[]) => (submitShortlistResponse as (...a: unknown[]) => Promise<void>)(...a),
  refreshResponsesBadge: async () => {}, // App (imported for `routes`) references it
}))

import ClientListScreen from '../../src/ui/ClientList/ClientListScreen'
import { routes } from '../../src/App'

const UUID = '3f8a2c1e-4b5d-4e6f-8a9b-0c1d2e3f4a5b'

beforeEach(() => {
  fetchSharedShortlist.mockClear()
  submitShortlistResponse.mockClear()
})

function renderList(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/list" element={<ClientListScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('/list route registration', () => {
  it('is a top-level route OUTSIDE the app chrome (client page must have no tab bar)', () => {
    const top = routes.find((r) => r.path === '/list')
    expect(top, '/list must be registered at the router root').toBeTruthy()
    const chrome = routes.filter((r) => r.children)
    for (const layout of chrome) {
      expect(layout.children!.some((c) => c.path === '/list')).toBe(false)
    }
  })
})

describe('ClientListScreen', () => {
  it('renders the title and the spots in URL order — across regions', () => {
    renderList('/list?spots=independence-hall,bayshore-boulevard&title=Smith family')
    expect(screen.getByRole('heading', { name: 'Smith family' })).toBeInTheDocument()
    const text = document.body.textContent ?? ''
    const philly = text.indexOf('Independence Hall')
    const tampa = text.indexOf('Bayshore Boulevard')
    expect(philly).toBeGreaterThan(-1)
    expect(tampa).toBeGreaterThan(-1)
    expect(philly).toBeLessThan(tampa) // URL order, not dataset order
  })

  it('numbers the options so the client can text back "option 2"', () => {
    renderList('/list?spots=independence-hall,bayshore-boulevard')
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
  })

  it('shows photo, address link, best-light window, and a one-line why per spot', () => {
    renderList('/list?spots=bayshore-boulevard')
    // hero photo (Bayshore has seeded Commons media)
    expect(screen.getByRole('img', { name: 'Bayshore Boulevard' })).toBeInTheDocument()
    // address opens a maps search the client can use on any device
    const addr = screen.getByRole('link', { name: /Bayshore Blvd at Bay-to-Bay Blvd/ })
    expect(addr).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    // primary light = sunrise → labeled window with concrete times
    expect(document.body.textContent).toMatch(/Sunrise · \d{1,2}:\d{2} [AP]M – \d{1,2}:\d{2} [AP]M/)
    // one-line why, derived from bestFor
    expect(screen.getByText(/skyline across water/)).toBeInTheDocument()
  })

  it('falls back to a generic heading when no title is given', () => {
    renderList('/list?spots=bayshore-boulevard')
    expect(screen.getByRole('heading', { name: /location options/i })).toBeInTheDocument()
  })

  it('skips unknown ids without crashing', () => {
    renderList('/list?spots=not-a-spot,bayshore-boulevard')
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument()
  })

  it('shows a friendly note for an empty/broken link', () => {
    renderList('/list')
    expect(screen.getByText(/doesn't have any locations/i)).toBeInTheDocument()
  })

  it('credits Vantage with a link home (client page is also an acquisition surface)', () => {
    renderList('/list?spots=bayshore-boulevard')
    const home = screen.getByRole('link', { name: /vantage/i })
    expect(home).toHaveAttribute('href', 'https://shootvantage.com')
  })

  it('shows no pick/respond UI on inline v1 links (nothing to write back to)', () => {
    renderList('/list?spots=bayshore-boulevard')
    expect(screen.queryByRole('button', { name: /pick this one/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send to your photographer/i })).not.toBeInTheDocument()
  })
})

describe('ClientListScreen — stored list (v2)', () => {
  const LIST = {
    title: 'Smith family',
    spots: [
      { id: 'bayshore-boulevard', note: 'Shot here at golden hour — gorgeous backlight' },
      { id: 'independence-hall' },
    ],
  }

  it('fetches the list, rendering its title, spots, and photographer notes', async () => {
    fetchSharedShortlist.mockResolvedValueOnce(LIST)
    renderList(`/list?id=${UUID}`)
    expect(await screen.findByRole('heading', { name: 'Smith family' })).toBeInTheDocument()
    expect(fetchSharedShortlist).toHaveBeenCalledWith(UUID)
    expect(screen.getByText('Bayshore Boulevard')).toBeInTheDocument()
    expect(screen.getByText('Independence Hall')).toBeInTheDocument()
    expect(screen.getByText(/gorgeous backlight/)).toBeInTheDocument()
  })

  it('lets the client pick options and send a comment back', async () => {
    const user = userEvent.setup()
    fetchSharedShortlist.mockResolvedValueOnce(LIST)
    renderList(`/list?id=${UUID}`)
    await screen.findByRole('heading', { name: 'Smith family' })

    const send = screen.getByRole('button', { name: /send to your photographer/i })
    expect(send).toBeDisabled() // nothing picked, nothing said

    const picks = screen.getAllByRole('button', { name: /pick this one/i })
    expect(picks).toHaveLength(2)
    await user.click(picks[0])
    expect(screen.getByRole('button', { name: /your pick/i })).toBeInTheDocument()
    expect(send).toBeEnabled()

    await user.type(screen.getByPlaceholderText(/your name/i), 'Sarah')
    await user.type(screen.getByPlaceholderText(/anything to add/i), 'Love the water view')
    await user.click(send)

    expect(submitShortlistResponse).toHaveBeenCalledWith(UUID, {
      picked: ['bayshore-boulevard'], clientName: 'Sarah', comment: 'Love the water view',
    })
    expect(await screen.findByText(/sent to your photographer/i)).toBeInTheDocument()
  })

  it('unpicking works before sending', async () => {
    const user = userEvent.setup()
    fetchSharedShortlist.mockResolvedValueOnce(LIST)
    renderList(`/list?id=${UUID}`)
    await screen.findByRole('heading', { name: 'Smith family' })
    await user.click(screen.getAllByRole('button', { name: /pick this one/i })[0])
    await user.click(screen.getByRole('button', { name: /your pick/i }))
    expect(screen.queryByRole('button', { name: /your pick/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send to your photographer/i })).toBeDisabled()
  })

  it('shows the friendly empty note when the list id is unknown', async () => {
    fetchSharedShortlist.mockResolvedValueOnce(null)
    renderList(`/list?id=${UUID}`)
    expect(await screen.findByText(/doesn't have any locations/i)).toBeInTheDocument()
  })
})
