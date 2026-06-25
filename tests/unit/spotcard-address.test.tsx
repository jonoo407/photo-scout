import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SpotCard } from '../../src/ui/SpotCard'
import { SPOTS } from '../../src/data/spots'

describe('SpotCard — address on each card', () => {
  it('shows the spot street address', () => {
    const spot = SPOTS.find((s) => s.id === 'st-paul-ame')!
    render(<MemoryRouter><SpotCard spot={spot} /></MemoryRouter>)
    expect(screen.getByText('506 E Harrison St, Tampa, FL 33602')).toBeInTheDocument()
  })
})
