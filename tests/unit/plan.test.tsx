import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlanScreen from '../../src/ui/Plan/PlanScreen'

describe('PlanScreen — spots by light', () => {
  it('renders each spot name as a tappable link, not dead text', () => {
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    // Bayshore Boulevard is in the sunrise/morning bucket
    expect(screen.getByRole('button', { name: 'Bayshore Boulevard' })).toBeInTheDocument()
  })
})
