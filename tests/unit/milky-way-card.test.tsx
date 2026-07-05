import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MilkyWay from '../../src/ui/SpotDetail/MilkyWay'
import type { Spot } from '../../src/spots/types'

const spot = (bestLight: string[]) => ({
  id: 'x', name: 'X', lat: 27.94, lng: -82.55, region: 'tampa-bay', bestLight,
}) as unknown as Spot

describe('MilkyWay card', () => {
  it('shows tonight\'s core window for a night-astro spot in season', () => {
    render(<MilkyWay spot={spot(['night-astro'])} from={new Date('2026-06-15T16:00:00Z')} />)
    expect(screen.getByText(/milky way/i)).toBeInTheDocument()
    expect(screen.getByText(/tonight/i)).toBeInTheDocument()
    expect(screen.getByText(/peaks \d+°/i)).toBeInTheDocument()
    expect(screen.getByText(/moon/i)).toBeInTheDocument()
  })

  it('points at the season opener when the core is wintering', () => {
    render(<MilkyWay spot={spot(['night-astro'])} from={new Date('2026-12-21T17:00:00Z')} />)
    expect(screen.getByText(/milky way/i)).toBeInTheDocument()
    expect(screen.getByText(/next core window/i)).toBeInTheDocument()
  })

  it('renders nothing for spots that are not night-astro', () => {
    const { container } = render(<MilkyWay spot={spot(['sunset'])} from={new Date('2026-06-15T16:00:00Z')} />)
    expect(container).toBeEmptyDOMElement()
  })
})
