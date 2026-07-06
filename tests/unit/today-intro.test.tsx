import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TodayScreen from '../../src/ui/Today/TodayScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'
import { introPicks } from '../../src/spots/intro-picks'
import TAMPA from '../../src/data/spots/tampa-bay'

function renderToday() {
  return render(<MemoryRouter><TodayScreen /></MemoryRouter>)
}

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', introSeen: false, wishlist: [] })
})

describe('introPicks (onboarding seed spots)', () => {
  it('offers a small, photogenic, varied sampler', () => {
    const picks = introPicks(TAMPA, 5)
    expect(picks).toHaveLength(5)
    expect(picks.every((s) => s.media.length > 0)).toBe(true)
    expect(new Set(picks.map((s) => s.category)).size).toBeGreaterThanOrEqual(3)
  })

  it('is deterministic', () => {
    expect(introPicks(TAMPA, 5).map((s) => s.id)).toEqual(introPicks(TAMPA, 5).map((s) => s.id))
  })
})

describe('Today — first-run onboarding flow', () => {
  it('step 1 welcomes with the pitch, location CTA and inline city choices', () => {
    renderToday()
    expect(screen.getByText(/welcome to vantage/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tampa Bay' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Philadelphia' })).toBeInTheDocument()
  })

  it('choosing a city advances to seeding want-to-gos with real spot cards', async () => {
    const user = userEvent.setup()
    renderToday()
    await user.click(screen.getByRole('button', { name: 'Philadelphia' }))
    expect(useStore.getState().region).toBe('philadelphia')
    expect(await screen.findByText(/love to shoot/i)).toBeInTheDocument()
    const addBadges = await screen.findAllByText('Add')
    expect(addBadges.length).toBeGreaterThanOrEqual(3)
  })

  it('tapping a seed card saves it to the want-to-go list', async () => {
    const user = userEvent.setup()
    renderToday()
    await user.click(screen.getByRole('button', { name: 'Tampa Bay' }))
    const cards = await screen.findAllByText('Add')
    await user.click(cards[0])
    expect(useStore.getState().wishlist.length).toBe(1)
    expect(screen.getByText('Added')).toBeInTheDocument()
  })

  it('finishes on the promise step and dismisses for good', async () => {
    const user = userEvent.setup()
    renderToday()
    await user.click(screen.getByRole('button', { name: 'Tampa Bay' }))
    await user.click(await screen.findByRole('button', { name: /continue/i }))
    expect(screen.getAllByText(/next up/i).length).toBeGreaterThan(0) // also in Today's hero below
    expect(screen.getByText(/conditions alerts/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /start shooting/i }))
    expect(useStore.getState().introSeen).toBe(true)
    expect(screen.queryByText(/welcome to vantage/i)).not.toBeInTheDocument()
  })

  it('dismisses permanently from any step', async () => {
    const user = userEvent.setup()
    renderToday()
    await user.click(screen.getByRole('button', { name: 'Tampa Bay' }))
    await user.click(screen.getByRole('button', { name: /dismiss intro/i }))
    expect(useStore.getState().introSeen).toBe(true)
  })

  it('never shows again once seen', () => {
    useStore.setState({ introSeen: true })
    renderToday()
    expect(screen.queryByText(/welcome to vantage/i)).not.toBeInTheDocument()
  })
})
