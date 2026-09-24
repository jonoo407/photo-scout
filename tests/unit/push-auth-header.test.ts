import { describe, it, expect, vi, beforeEach } from 'vitest'

const sb = vi.hoisted(() => ({
  available: true,
  getSession: vi.fn(async () => ({ data: { session: { access_token: 'tok-1' } as { access_token: string } | null } })),
}))
vi.mock('../../src/auth/supabase', () => ({
  authAvailable: () => sb.available,
  getSupabase: async () => ({ auth: { getSession: sb.getSession } }),
}))

import { pushAuthHeaders } from '../../src/push/auth-header'

beforeEach(() => { sb.available = true; sb.getSession.mockClear() })

describe('pushAuthHeaders', () => {
  it('carries the current session as a bearer token', async () => {
    expect(await pushAuthHeaders()).toEqual({ authorization: 'Bearer tok-1' })
  })

  it('is empty when signed out', async () => {
    sb.getSession.mockResolvedValueOnce({ data: { session: null } })
    expect(await pushAuthHeaders()).toEqual({})
  })

  it('is empty, without touching Supabase, when auth is not configured', async () => {
    sb.available = false
    expect(await pushAuthHeaders()).toEqual({})
    expect(sb.getSession).not.toHaveBeenCalled()
  })

  it('never throws — a broken session store must not break the alerts toggle', async () => {
    sb.getSession.mockRejectedValueOnce(new Error('storage denied'))
    expect(await pushAuthHeaders()).toEqual({})
  })
})
