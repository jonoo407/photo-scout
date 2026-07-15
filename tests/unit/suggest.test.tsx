import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const inserted: Array<{ table: string; row: Record<string, unknown> }> = []
let signedInUser: { id: string } | null = null

const from = vi.fn((table: string) => ({
  insert: vi.fn(async (row: Record<string, unknown>) => {
    inserted.push({ table, row })
    return { error: null }
  }),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  getSupabase: async () => ({
    from,
    auth: { getUser: async () => ({ data: { user: signedInUser }, error: null }) },
  }),
}))

import { submitSuggestion } from '../../src/spots/suggest-api'
import SuggestScreen from '../../src/ui/Suggest/SuggestScreen'
import ExploreScreen from '../../src/ui/Explore/ExploreScreen'
import { useStore } from '../../src/state/store'
import { DEFAULT_HOME } from '../../src/data/home.config'

beforeEach(() => {
  inserted.length = 0
  signedInUser = null
  useStore.setState({ home: DEFAULT_HOME, region: 'tampa-bay' })
})

describe('submitSuggestion', () => {
  it('inserts trimmed fields, anonymous by default', async () => {
    await submitSuggestion({
      name: '  Secret Overlook  ', whereHint: 'End of Pine St, Tampa',
      why: 'Skyline over the river at dusk', accessNotes: 'Street parking',
    })
    expect(inserted[0].table).toBe('spot_suggestions')
    expect(inserted[0].row).toMatchObject({
      name: 'Secret Overlook',
      where_hint: 'End of Pine St, Tampa',
      why: 'Skyline over the river at dusk',
      access_notes: 'Street parking',
      suggested_by: null,
    })
  })

  it('attaches the user id when signed in', async () => {
    signedInUser = { id: 'user-9' }
    await submitSuggestion({ name: 'Spot', whereHint: '', why: '', accessNotes: '' })
    expect(inserted[0].row.suggested_by).toBe('user-9')
  })

  it('rejects an empty name', async () => {
    await expect(submitSuggestion({ name: '  ', whereHint: '', why: '', accessNotes: '' })).rejects.toThrow()
    expect(inserted).toHaveLength(0)
  })
})

describe('SuggestScreen', () => {
  it('submits the form and lands on a thank-you state', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><SuggestScreen /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /send it in/i })).toBeDisabled() // name required
    await user.type(screen.getByLabelText(/spot name/i), 'Secret Overlook')
    await user.type(screen.getByLabelText(/where is it/i), 'End of Pine St')
    await user.type(screen.getByLabelText(/why is it good/i), 'Dusk skyline')
    await user.click(screen.getByRole('button', { name: /send it in/i }))
    expect(await screen.findByText(/thank/i)).toBeInTheDocument()
    expect(inserted[0].row.name).toBe('Secret Overlook')
  })
})

describe('Explore — suggest entry point', () => {
  it('invites suggestions at the end of the list', () => {
    render(<MemoryRouter><ExploreScreen /></MemoryRouter>)
    expect(screen.getByRole('button', { name: /suggest it/i })).toBeInTheDocument()
  })
})
