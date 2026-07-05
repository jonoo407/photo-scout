import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../../src/ui/Layout'
import { useStore } from '../../src/state/store'

/* The Saved tab wears a dot when a client response arrived since the
   photographer last looked — the in-app "you've got a pick" notification. */
describe('tab bar — new-response dot', () => {
  it('shows the dot only while a new client response is unseen', () => {
    useStore.setState({ newClientResponse: true })
    const { unmount } = render(<MemoryRouter><Layout /></MemoryRouter>)
    expect(document.querySelector('.tabdot')).toBeTruthy()
    unmount()

    useStore.setState({ newClientResponse: false })
    render(<MemoryRouter><Layout /></MemoryRouter>)
    expect(document.querySelector('.tabdot')).toBeNull()
  })
})
