import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import YouScreen from '../../src/ui/You/YouScreen'
import { useStore } from '../../src/state/store'
import { useAuth } from '../../src/auth/useAuth'
import { DEFAULT_HOME } from '../../src/data/home.config'

/* Per-city shot progress moved from Saved to the You tab (IA redesign 1h). */

function renderYou() {
  return render(<MemoryRouter><YouScreen /></MemoryRouter>)
}

beforeEach(() => {
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay',
    wishlist: [], visited: [], checklist: {},
  })
  useAuth.setState({ user: null, status: 'idle', errorMsg: null })
})

describe('YouScreen — shot progress', () => {
  it('shows per-region progress once you have been somewhere', async () => {
    useStore.setState({ visited: ['bayshore-boulevard', 'independence-hall'] })
    renderYou()
    const strip = await screen.findByRole('region', { name: /shot progress/i })
    expect(within(strip).getByText('Tampa Bay')).toBeInTheDocument()
    expect(within(strip).getByText('Philadelphia')).toBeInTheDocument()
    expect(within(strip).getAllByText(/^1\/\d+$/)).toHaveLength(2)
  })

  it('shows a zero count for a city you have not shot yet', async () => {
    useStore.setState({ visited: ['bayshore-boulevard'] })
    renderYou()
    const strip = await screen.findByRole('region', { name: /shot progress/i })
    expect(within(strip).getByText(/^0\/\d+$/)).toBeInTheDocument()
  })

  it('hides the strip when nothing is visited', () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderYou()
    expect(screen.queryByRole('region', { name: /shot progress/i })).not.toBeInTheDocument()
  })
})
