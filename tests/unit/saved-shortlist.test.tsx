import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('SavedScreen — client shortlist builder', () => {
  it('offers no shortlist button when nothing is saved', () => {
    renderSaved()
    expect(screen.queryByRole('button', { name: /client shortlist/i })).not.toBeInTheDocument()
  })

  it('builds and copies a client link: pick spots → title → share', async () => {
    const user = userEvent.setup()
    const writeText = vi.fn(async () => {})
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    useStore.setState({ wishlist: ['bayshore-boulevard', 'independence-hall'] })
    renderSaved()

    await user.click(screen.getByRole('button', { name: /client shortlist/i }))
    // pick mode: tapping a card selects it instead of navigating
    await user.click(screen.getByRole('button', { name: /Bayshore Boulevard/ }))
    await user.click(screen.getByRole('button', { name: /Independence Hall/ }))
    expect(screen.getAllByText('Added')).toHaveLength(2)

    await user.type(screen.getByPlaceholderText(/list title/i), 'Smith family')
    await user.click(screen.getByRole('button', { name: /share link/i }))

    expect(writeText).toHaveBeenCalledWith(
      'https://shootvantage.com/#/list?spots=bayshore-boulevard,independence-hall&title=Smith+family',
    )
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument()
  })

  it('tapping a picked spot again removes it', async () => {
    const user = userEvent.setup()
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderSaved()
    await user.click(screen.getByRole('button', { name: /client shortlist/i }))
    await user.click(screen.getByRole('button', { name: /Bayshore Boulevard/ }))
    expect(screen.getByText('Added')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Bayshore Boulevard/ }))
    expect(screen.queryByText('Added')).not.toBeInTheDocument()
  })

  it('share is disabled until at least one spot is picked; cancel restores normal mode', async () => {
    const user = userEvent.setup()
    useStore.setState({ wishlist: ['bayshore-boulevard'] })
    renderSaved()
    await user.click(screen.getByRole('button', { name: /client shortlist/i }))
    expect(screen.getByRole('button', { name: /share link/i })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /share link/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /client shortlist/i })).toBeInTheDocument()
  })
})
