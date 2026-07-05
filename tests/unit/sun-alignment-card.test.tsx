import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SunAlignment from '../../src/ui/SpotDetail/SunAlignment'
import type { Spot } from '../../src/spots/types'

const spot = (facing?: number) => ({
  id: 'x', name: 'X', lat: 27.94, lng: -82.55, region: 'tampa-bay', facing,
}) as unknown as Spot

const FROM = new Date('2026-07-01T16:00:00Z')

describe('SunAlignment card', () => {
  it('lists upcoming dates the sun sets behind a west-facing subject', () => {
    render(<SunAlignment spot={spot(270)} from={FROM} />)
    expect(screen.getByText(/sun-behind/i)).toBeInTheDocument()
    expect(screen.getAllByText(/sunset/i).length).toBeGreaterThan(0)
    // equinox-season hits — all in September 2026 from a July 1 start
    expect(screen.getAllByText(/sep/i).length).toBeGreaterThan(0)
  })

  it('renders nothing when the spot has no facing', () => {
    const { container } = render(<SunAlignment spot={spot(undefined)} from={FROM} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when the sun never aligns (north-facing)', () => {
    const { container } = render(<SunAlignment spot={spot(0)} from={FROM} />)
    expect(container).toBeEmptyDOMElement()
  })
})
