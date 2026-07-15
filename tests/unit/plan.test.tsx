import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PlanScreen from '../../src/ui/Plan/PlanScreen'
import { useStore } from '../../src/state/store'

beforeEach(() => { useStore.setState({ savedPlans: [] }) })

describe('PlanScreen — one job: outings (IA redesign 1g)', () => {
  it('the itinerary CTA sells the smarts (feedback #4)', () => {
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /smart[- ]build/i })).toBeInTheDocument()
    expect(screen.getByText(/cuts? driving/i)).toBeInTheDocument()
  })

  it('sheds the reference jobs: no times table, no moon, no spots-by-light', () => {
    render(<MemoryRouter><PlanScreen /></MemoryRouter>)
    expect(screen.queryByText(/light & sun times/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/solar noon/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/^Moon /)).not.toBeInTheDocument()
    expect(screen.queryByText(/spots by light/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bayshore Boulevard' })).not.toBeInTheDocument()
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
