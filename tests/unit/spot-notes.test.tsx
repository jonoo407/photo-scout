import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SpotNotes from '../../src/ui/SpotDetail/SpotNotes'
import { useStore } from '../../src/state/store'

beforeEach(() => {
  useStore.setState({ spotNotes: {} })
})

describe('store — personal spot notes', () => {
  it('saves, trims, and clears notes', () => {
    act(() => useStore.getState().setSpotNote('bayshore-boulevard', '  south rail at dawn  '))
    expect(useStore.getState().spotNotes['bayshore-boulevard']).toBe('south rail at dawn')
    act(() => useStore.getState().setSpotNote('bayshore-boulevard', '   '))
    expect('bayshore-boulevard' in useStore.getState().spotNotes).toBe(false)
  })
})

describe('SpotNotes card', () => {
  it('shows the saved note and edits persist to the store', async () => {
    const user = userEvent.setup()
    act(() => useStore.getState().setSpotNote('x-spot', 'bring the 70-200'))
    render(<SpotNotes spotId="x-spot" />)
    const box = screen.getByRole('textbox', { name: /my notes/i })
    expect(box).toHaveValue('bring the 70-200')
    await user.clear(box)
    await user.type(box, 'gate code 4411')
    expect(useStore.getState().spotNotes['x-spot']).toBe('gate code 4411')
  })

  it('renders an inviting empty state placeholder', () => {
    render(<SpotNotes spotId="x-spot" />)
    expect(screen.getByPlaceholderText(/only you (can )?see/i)).toBeInTheDocument()
  })
})
