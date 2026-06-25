import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SpotDetailScreen from '../../src/ui/SpotDetail/SpotDetailScreen'

function renderSpot(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/spot/${id}`]}>
      <Routes>
        <Route path="/spot/:id" element={<SpotDetailScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SpotDetailScreen — address on the detail page', () => {
  it('renders the verified street address', () => {
    renderSpot('st-paul-ame')
    expect(screen.getByText('506 E Harrison St, Tampa, FL 33602')).toBeInTheDocument()
  })

  it('routes the Directions CTA to the address, not the old wrong coords', () => {
    renderSpot('st-paul-ame')
    const cta = screen.getByRole('link', { name: /Directions to spot/i })
    const href = cta.getAttribute('href') ?? ''
    expect(href).toContain(encodeURIComponent('506 E Harrison St, Tampa, FL 33602'))
    // 27.9512,-82.4555 was the coord that reverse-geocoded to the Firefighters Museum
    expect(href).not.toContain('27.9512')
    // origin starts from the home address, not the old 5000-S-Crescent coord (27.8916)
    expect(href).toContain(encodeURIComponent('3812 W Leona St, Tampa, FL 33629'))
    expect(href).not.toContain('27.8916')
  })

  it('surfaces that the St. Pete Pier Bending Arc is currently down', () => {
    renderSpot('st-pete-pier')
    expect(screen.getByText(/Bending Arc.*down since Hurricane Milton/i)).toBeInTheDocument()
  })
})
