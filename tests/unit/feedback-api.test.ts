import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitFeedback } from '../../src/feedback/api'

/*
 * Tester feedback during the TestFlight phase. Insert-only like
 * spot_suggestions — the row is the durable record, and a DB trigger emails it
 * so nothing waits on someone remembering to check a table.
 *
 * Build context is captured server-side-ish (from the client, but not typed by
 * the tester) because "it looks the same to me" is unanswerable without knowing
 * which build they were on — the exact problem the version display solved.
 */
type Row = Record<string, unknown>
const insert = vi.fn(async (_row: Row) => ({ error: null as { message: string } | null }))
vi.mock('../../src/auth/supabase', () => ({
  getSupabase: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: 'u1' } } }) },
    from: () => ({ insert }),
  }),
}))

beforeEach(() => insert.mockClear())

describe('submitFeedback', () => {
  it('stores the message with who sent it and which build they were on', async () => {
    await submitFeedback({ message: 'Photos are blank on the spot page', kind: 'bug' })
    const row = insert.mock.calls[0][0]
    expect(row.message).toBe('Photos are blank on the spot page')
    expect(row.kind).toBe('bug')
    expect(row.submitted_by).toBe('u1')
    expect(row.app_version, 'build identity makes a report actionable').toBeTruthy()
    expect(row.platform).toBeTruthy()
  })

  it('refuses an empty message rather than storing noise', async () => {
    await expect(submitFeedback({ message: '   ', kind: 'bug' })).rejects.toThrow(/say something/i)
    expect(insert).not.toHaveBeenCalled()
  })

  it('caps a runaway message instead of failing the submit', async () => {
    await submitFeedback({ message: 'x'.repeat(9000), kind: 'idea' })
    const row = insert.mock.calls[0][0] as Record<string, string>
    expect(row.message.length).toBeLessThanOrEqual(4000)
  })

  it('keeps an optional contact email so signed-out testers can be replied to', async () => {
    await submitFeedback({ message: 'hi', kind: 'idea', email: ' Me@Example.com ' })
    const row = insert.mock.calls[0][0] as Record<string, string>
    expect(row.contact_email).toBe('me@example.com')
  })

  it('surfaces a database error rather than pretending it sent', async () => {
    insert.mockResolvedValueOnce({ error: { message: 'nope' } } as never)
    await expect(submitFeedback({ message: 'hi', kind: 'bug' })).rejects.toBeTruthy()
  })
})
