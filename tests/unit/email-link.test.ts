import { describe, it, expect, beforeEach, vi } from 'vitest'
import { parseEmailLink, consumeEmailLink } from '../../src/auth/email-link'

/* Magic-link sign-in v2 (incident 2026-07-16): the email now carries a
   token_hash to OUR page and the app calls verifyOtp — no PKCE verifier
   needed, so the link works in whatever browser opens it (Gmail app,
   Safari vs installed PWA, a different device). */

describe('parseEmailLink', () => {
  it('extracts the token hash from a landing URL', () => {
    expect(parseEmailLink('?token_hash=abc123&type=email')).toEqual({ tokenHash: 'abc123', type: 'email' })
  })
  it('ignores unrelated queries and wrong types', () => {
    expect(parseEmailLink('')).toBeNull()
    expect(parseEmailLink('?code=xyz')).toBeNull()
    expect(parseEmailLink('?token_hash=abc')).toBeNull()
    expect(parseEmailLink('?token_hash=abc&type=recovery')).toBeNull()
  })
})

describe('consumeEmailLink', () => {
  const verifyOtp = vi.fn()
  const client = { auth: { verifyOtp } } as never

  beforeEach(() => {
    verifyOtp.mockReset()
    window.history.replaceState(null, '', '/?token_hash=tok-1&type=email#/')
  })

  it('does nothing on ordinary loads', async () => {
    window.history.replaceState(null, '', '/#/')
    expect(await consumeEmailLink(async () => client)).toBe('none')
    expect(verifyOtp).not.toHaveBeenCalled()
  })

  it('verifies the token and reports signed-in', async () => {
    verifyOtp.mockResolvedValue({ data: { session: {} }, error: null })
    const result = await consumeEmailLink(async () => client)
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'tok-1', type: 'email' })
    expect(result).toBe('signed-in')
  })

  it('strips the token from the URL BEFORE verifying, so a mid-flight reload cannot double-consume it', async () => {
    let searchAtVerify = 'unset'
    verifyOtp.mockImplementation(async () => {
      searchAtVerify = window.location.search
      return { data: { session: {} }, error: null }
    })
    await consumeEmailLink(async () => client)
    expect(searchAtVerify).toBe('')
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/')
  })

  it('reports a friendly error when the link is used up or expired', async () => {
    verifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'Token has expired or is invalid' } })
    const result = await consumeEmailLink(async () => client)
    expect(result).toEqual({ error: expect.stringMatching(/expired or already been used/i) })
  })
})
