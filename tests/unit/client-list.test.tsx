import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ClientListScreen from '../../src/ui/ClientList/ClientListScreen'
import { routes } from '../../src/App'

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
})
