import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BestDays from '../../src/ui/SpotDetail/BestDays'
import SPOTS from '../../src/data/spots/tampa-bay'
import { SCORE_FACTORS } from '../../src/spots/score-explainer'

afterEach(() => { vi.restoreAllMocks() })

// No real network — days come from the deterministic scoring regardless.
const stubForecast = () => {
  global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ hourly: { time: [] } }) })) as unknown as typeof fetch
}
const spot = () => SPOTS.find((s) => s.id === 'curtis-hixon-waterfront-park')!

describe('BestDays', () => {
  it('renders a ranked list of best days with score chips', () => {
    stubForecast()
    const { container } = render(<BestDays spot={spot()} />)
    expect(screen.getByText(/best days this month/i)).toBeInTheDocument()
    expect(screen.getByText(/scored on sun alignment/i)).toBeInTheDocument()
    expect(container.querySelectorAll('.pill').length).toBeGreaterThan(0)
  })

  it('offers an ⓘ that explains how the score is produced', async () => {
    stubForecast()
    const user = userEvent.setup()
    render(<BestDays spot={spot()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /how the score works/i }))

    const dialog = screen.getByRole('dialog', { name: /how the score works/i })
    expect(dialog).toBeInTheDocument()
    for (const f of SCORE_FACTORS) {
      expect(dialog).toHaveTextContent(f.title)
    }
  })

  it('closes the explainer from its Done button', async () => {
    stubForecast()
    const user = userEvent.setup()
    render(<BestDays spot={spot()} />)
    await user.click(screen.getByRole('button', { name: /how the score works/i }))
    await user.click(screen.getByRole('button', { name: /done/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
