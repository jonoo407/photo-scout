import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import BestDays from '../../src/ui/SpotDetail/BestDays'
import SPOTS from '../../src/data/spots/tampa-bay'

afterEach(() => { vi.restoreAllMocks() })

describe('BestDays', () => {
  it('renders a ranked list of best days with score chips', () => {
    // No real network — days come from the deterministic scoring regardless.
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ hourly: { time: [] } }) })) as unknown as typeof fetch
    const spot = SPOTS.find((s) => s.id === 'curtis-hixon-waterfront-park')!
    const { container } = render(<BestDays spot={spot} />)
    expect(screen.getByText(/best days this month/i)).toBeInTheDocument()
    expect(screen.getByText(/scored on sun alignment/i)).toBeInTheDocument()
    expect(container.querySelectorAll('.pill').length).toBeGreaterThan(0)
  })
})
