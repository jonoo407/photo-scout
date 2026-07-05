import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SavedScreen from '../../src/ui/Saved/SavedScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

function renderSaved() {
  return render(<MemoryRouter><SavedScreen /></MemoryRouter>)
}

beforeEach(() => {
  useStore.setState({
    home: DEFAULT_HOME, region: 'tampa-bay',
    wishlist: [], visited: [], checklist: {},
  })
})

describe('SavedScreen — shot progress', () => {
  it('shows per-region progress once you have been somewhere', async () => {
    useStore.setState({ visited: ['bayshore-boulevard', 'independence-hall'] })
    renderSaved()
    const strip = await screen.findByRole('region', { name: /shot progress/i })
    expect(within(strip).getByText('Tampa Bay')).toBeInTheDocument()
    expect(within(strip).getByText('Philadelphia')).toBeInTheDocument()
    expect(within(strip).getAllByText(/^1\/\d+$/)).toHaveLength(2)
  })

  it('shows a zero count for a city you have not shot yet', async () => {
    useStore.setState({ visited: ['bayshore-boulevard'] })
    renderSaved()
    const strip = await screen.findByRole('region', { name: /shot progress/i })
    expect(within(strip).getByText(/^0\/\d+$/)).toBeInTheDocument()
  })

  it('hides the strip when nothing is visited', async () => {
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderSaved()
    await screen.findByText('Bayshore Boulevard')
    expect(screen.queryByRole('region', { name: /shot progress/i })).not.toBeInTheDocument()
  })
})
