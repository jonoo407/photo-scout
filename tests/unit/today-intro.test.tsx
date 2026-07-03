import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import TodayScreen from '../../src/ui/Today/TodayScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

function renderToday() {
  return render(<MemoryRouter><TodayScreen /></MemoryRouter>)
}

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay', introSeen: false })
})

describe('Today — first-run intro', () => {
  it('welcomes a new user with the pitch and a city CTA', () => {
    renderToday()
    expect(screen.getByText(/welcome to vantage/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use my location/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pick a city/i })).toBeInTheDocument()
  })

  it('dismisses permanently', async () => {
    const user = userEvent.setup()
    renderToday()
    await user.click(screen.getByRole('button', { name: /dismiss intro/i }))
    expect(screen.queryByText(/welcome to vantage/i)).not.toBeInTheDocument()
    expect(useStore.getState().introSeen).toBe(true)
  })

  it('never shows again once seen', () => {
    useStore.setState({ introSeen: true })
    renderToday()
    expect(screen.queryByText(/welcome to vantage/i)).not.toBeInTheDocument()
  })
})
