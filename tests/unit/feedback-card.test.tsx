import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import FeedbackCard from '../../src/ui/Today/FeedbackCard'
import { useStore } from '../../src/state/store'

/* The Today-screen ask (backlog V2b). A card, never a modal — it must be
   possible to ignore forever without ever tapping anything. */

const SETTLED = { sessions: 6, feedbackPromptAt: null, introSeen: true }

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date('2026-09-12T12:00:00Z') })
  useStore.setState(SETTLED)
})
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

const renderCard = () => render(<MemoryRouter><FeedbackCard /></MemoryRouter>)

describe('Today feedback card', () => {
  it('asks a settled-in user', () => {
    renderCard()
    expect(screen.getByText(/How is Vantage working out/i)).toBeInTheDocument()
  })

  it('renders nothing at all during onboarding', () => {
    useStore.setState({ ...SETTLED, introSeen: false })
    const { container } = renderCard()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing for someone who has barely opened the app', () => {
    useStore.setState({ ...SETTLED, sessions: 1 })
    const { container } = renderCard()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing inside the cooldown', () => {
    useStore.setState({ ...SETTLED, feedbackPromptAt: '2026-09-01T12:00:00Z' })
    const { container } = renderCard()
    expect(container).toBeEmptyDOMElement()
  })

  it('dismissing hides it AND starts the 30-day clock', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.queryByText(/How is Vantage working out/i)).not.toBeInTheDocument()
    const stamp = useStore.getState().feedbackPromptAt
    expect(stamp).toBeTruthy()
    expect(Date.parse(stamp as string)).toBeGreaterThan(0)
  })

  it('taking up the offer also starts the clock — saying yes is not punished', async () => {
    const user = userEvent.setup()
    renderCard()
    await user.click(screen.getByRole('link', { name: /tell us|send/i }))
    expect(useStore.getState().feedbackPromptAt).toBeTruthy()
  })

  it('offers a way out without tapping anything destructive', () => {
    renderCard()
    // Not a modal: no dialog role, nothing to trap focus.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
