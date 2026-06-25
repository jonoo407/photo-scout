import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import SettingsScreen from '../../src/ui/Settings/SettingsScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => {
  useStore.setState({ home: DEFAULT_HOME, theme: 'auto' })
  document.documentElement.removeAttribute('data-theme')
})
afterEach(() => { vi.restoreAllMocks() })

function renderSettings() {
  return render(<MemoryRouter><SettingsScreen /></MemoryRouter>)
}

describe('Settings — set home by typing an address', () => {
  it('geocodes a typed address and updates the home base', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => [{ lat: '27.9201', lon: '-82.4584' }] })) as unknown as typeof fetch
    renderSettings()

    await user.type(screen.getByPlaceholderText(/address/i), '1234 Channelside Dr, Tampa')
    await user.click(screen.getByRole('button', { name: /^set$/i }))

    expect(await screen.findByText('1234 Channelside Dr, Tampa')).toBeInTheDocument()
    expect(useStore.getState().home).toMatchObject({
      address: '1234 Channelside Dr, Tampa', lat: 27.9201, lng: -82.4584,
    })
  })

  it('shows an error and keeps the old home when the address is not found', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => [] })) as unknown as typeof fetch
    renderSettings()

    await user.type(screen.getByPlaceholderText(/address/i), 'asdfqwer nowhere')
    await user.click(screen.getByRole('button', { name: /^set$/i }))

    expect(await screen.findByText(/couldn't find/i)).toBeInTheDocument()
    expect(useStore.getState().home).toEqual(DEFAULT_HOME)
  })

  it('gives feedback when "Use my current location" is unavailable (no geolocation)', async () => {
    const user = userEvent.setup()
    // jsdom has no navigator.geolocation → the unavailable branch
    renderSettings()
    await user.click(screen.getByRole('button', { name: /current location/i }))
    expect(await screen.findByText(/location unavailable/i)).toBeInTheDocument()
  })

  it('switches the theme to dark from Settings', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: /^dark$/i }))
    expect(useStore.getState().theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
