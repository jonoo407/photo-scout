import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FeedbackScreen from '../../src/ui/You/FeedbackScreen'
import YouScreen from '../../src/ui/You/YouScreen'

const submitFeedback = vi.fn(async (_input: unknown) => {})
vi.mock('../../src/feedback/api', () => ({ submitFeedback: (i: unknown) => submitFeedback(i) }))

beforeEach(() => submitFeedback.mockClear())

const renderAt = (entry: string) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/you" element={<YouScreen />} />
      <Route path="/you/feedback" element={<FeedbackScreen />} />
    </Routes>
  </MemoryRouter>,
)

describe('Tester feedback', () => {
  it('is reachable from a prominent button on You', async () => {
    const user = userEvent.setup()
    renderAt('/you')
    const btn = screen.getByRole('button', { name: /tester feedback/i })
    await user.click(btn)
    expect(await screen.findByRole('heading', { name: /tester feedback/i })).toBeInTheDocument()
  })

  it('sends what was typed, with the chosen kind', async () => {
    const user = userEvent.setup()
    renderAt('/you/feedback')
    await user.click(screen.getByRole('button', { name: /idea/i }))
    await user.type(screen.getByRole('textbox', { name: /what happened|feedback/i }), 'Add a dark map style')
    await user.click(screen.getByRole('button', { name: /send/i }))
    expect(submitFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Add a dark map style', kind: 'idea' }),
    )
  })

  it('confirms it was sent, so nobody submits twice', async () => {
    const user = userEvent.setup()
    renderAt('/you/feedback')
    await user.type(screen.getByRole('textbox', { name: /what happened|feedback/i }), 'Photos blank')
    await user.click(screen.getByRole('button', { name: /send/i }))
    expect(await screen.findByText(/thanks|sent/i)).toBeInTheDocument()
  })

  it('surfaces a failure instead of silently losing the report', async () => {
    submitFeedback.mockRejectedValueOnce(new Error('offline'))
    const user = userEvent.setup()
    renderAt('/you/feedback')
    await user.type(screen.getByRole('textbox', { name: /what happened|feedback/i }), 'Broken')
    await user.click(screen.getByRole('button', { name: /send/i }))
    expect(await screen.findByText(/couldn't send|offline/i)).toBeInTheDocument()
  })
})
