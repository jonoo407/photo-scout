import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PlanScreen from '../../src/ui/Plan/PlanScreen'
import { useStore } from '../../src/state/store'

beforeEach(() => { useStore.setState({ savedPlans: [] }) })

describe('PlanScreen — spots by light', () => {
  it('renders each spot name as a tappable link, not dead text', () => {
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    // Bayshore Boulevard is in the sunrise/morning bucket
    expect(screen.getByRole('button', { name: 'Bayshore Boulevard' })).toBeInTheDocument()
  })
})

describe('PlanScreen — saved plans (feedback #5)', () => {
  const PLAN = {
    id: 'p1', name: 'Sat, Jul 12 · Tampa Bay', date: '2026-07-12',
    stops: [{ block: 'sunset' as const, spotId: 'honeymoon-island-sp' }],
    createdAt: '2026-07-06T00:00:00Z',
  }

  it('lists saved plans with their stop count', () => {
    useStore.setState({ savedPlans: [PLAN] })
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    expect(screen.getByText('Sat, Jul 12 · Tampa Bay')).toBeInTheDocument()
    expect(screen.getByText(/1 stop\b/)).toBeInTheDocument()
  })

  it('delete is two-tap and removes the plan', async () => {
    const user = userEvent.setup()
    useStore.setState({ savedPlans: [PLAN] })
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /^delete/i }))
    await user.click(screen.getByRole('button', { name: /confirm delete/i }))
    expect(useStore.getState().savedPlans).toHaveLength(0)
  })

  it('shows no section when nothing is saved', () => {
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    expect(screen.queryByText(/saved plans/i)).not.toBeInTheDocument()
  })
})
