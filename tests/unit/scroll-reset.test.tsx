import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import ScrollReset from '../../src/ui/ScrollReset'

const scrollTo = vi.fn()

beforeEach(() => {
  scrollTo.mockClear()
  Object.defineProperty(window, 'scrollTo', { value: scrollTo, configurable: true })
})

function Shell() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<Link to="/other">go</Link>} />
        <Route path="/other" element={<p>other screen</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ScrollReset', () => {
  it('scrolls back to the top when the route changes', async () => {
    const user = userEvent.setup()
    render(<Shell />)
    scrollTo.mockClear() // ignore any initial-mount call
    await user.click(screen.getByRole('link', { name: 'go' }))
    expect(await screen.findByText('other screen')).toBeInTheDocument()
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
  })
})
