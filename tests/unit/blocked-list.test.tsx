import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import type { BlockedPhotographer } from '../../src/spots/photo-reports-api'

/* Settings → Community & safety. V1 could only say "2 blocked" with a single
   Unblock all, because the client had no handle for a person. With opaque refs
   the list is inspectable and each row is individually undoable — the point
   being that blocking someone by accident should not force you to unblock
   everyone. */

let blocked: BlockedPhotographer[] = []
const fetchBlockedPhotographers = vi.fn(async () => blocked)
const unblockPhotographer = vi.fn(async (_ref: string) => ({ ok: true as const }))
vi.mock('../../src/spots/photo-reports-api', async (orig) => ({
  ...(await orig<typeof import('../../src/spots/photo-reports-api')>()),
  fetchBlockedPhotographers: () => fetchBlockedPhotographers(),
  unblockPhotographer: (ref: string) => unblockPhotographer(ref),
}))

vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => true,
  googleEnabled: () => false,
  getSupabase: vi.fn(async () => ({ auth: { onAuthStateChange: vi.fn() } })),
}))

import SafetySection from '../../src/ui/Settings/SafetySection'

beforeEach(() => {
  blocked = []
  fetchBlockedPhotographers.mockClear()
  unblockPhotographer.mockClear()
})

const wrap = () => render(<MemoryRouter><SafetySection /></MemoryRouter>)

describe('blocked photographers list', () => {
  it('says nobody is blocked when the list is empty', async () => {
    expect((await (wrap(), screen.findByText(/nobody blocked/i)))).toBeInTheDocument()
  })

  it('names each blocked photographer by their initials', async () => {
    blocked = [
      { ref: 'r1', initials: 'SA', blockedAt: '2026-07-29T10:00:00Z' },
      { ref: 'r2', initials: 'LO', blockedAt: '2026-07-28T10:00:00Z' },
    ]
    wrap()
    expect(await screen.findByText('SA')).toBeInTheDocument()
    expect(screen.getByText('LO')).toBeInTheDocument()
  })

  it('gives every row its own unblock control', async () => {
    blocked = [
      { ref: 'r1', initials: 'SA', blockedAt: '2026-07-29T10:00:00Z' },
      { ref: 'r2', initials: 'LO', blockedAt: '2026-07-28T10:00:00Z' },
    ]
    wrap()
    expect(await screen.findAllByRole('button', { name: /unblock/i })).toHaveLength(2)
  })

  it('unblocks just the one you picked and drops only that row', async () => {
    const user = userEvent.setup()
    blocked = [
      { ref: 'r1', initials: 'SA', blockedAt: '2026-07-29T10:00:00Z' },
      { ref: 'r2', initials: 'LO', blockedAt: '2026-07-28T10:00:00Z' },
    ]
    wrap()
    const row = (await screen.findByText('SA')).closest('.row') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /unblock/i }))
    expect(unblockPhotographer).toHaveBeenCalledWith('r1')
    expect(unblockPhotographer).toHaveBeenCalledTimes(1)
    expect(await screen.findByText('LO')).toBeInTheDocument()
    expect(screen.queryByText('SA')).not.toBeInTheDocument()
  })

  it('keeps the row when the server refuses the unblock', async () => {
    const user = userEvent.setup()
    unblockPhotographer.mockResolvedValueOnce({ ok: false, message: 'nope' } as never)
    blocked = [{ ref: 'r1', initials: 'SA', blockedAt: '2026-07-29T10:00:00Z' }]
    wrap()
    const row = (await screen.findByText('SA')).closest('.row') as HTMLElement
    await user.click(within(row).getByRole('button', { name: /unblock/i }))
    expect(await screen.findByText('SA')).toBeInTheDocument()
  })

  it('still links to the community guidelines', async () => {
    wrap()
    expect(await screen.findByRole('link', { name: /community guidelines/i }))
      .toHaveAttribute('href', '/guidelines')
  })
})
