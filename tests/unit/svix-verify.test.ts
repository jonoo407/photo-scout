import { describe, it, expect } from 'vitest'
import { verifySvixSignature, signSvixForTest } from '../../src/push/svix'

/* Resend signs inbound-mail webhooks with Svix. Verifying keeps anyone who
   finds /api/inbound-mail from injecting mail into Jon's inbox in Vantage's
   name, and the timestamp window stops a captured payload being replayed. */

const SECRET = 'whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw'
const BODY = JSON.stringify({ type: 'email.received', data: { id: 'abc' } })
const NOW = 1_785_000_000 // fixed: a clock-dependent test is a flaky test

const headersFor = async (over: Partial<{ id: string; ts: number; sig: string; body: string }> = {}) => {
  const id = over.id ?? 'msg_2b1c'
  const ts = over.ts ?? NOW
  const body = over.body ?? BODY
  return {
    'svix-id': id,
    'svix-timestamp': String(ts),
    'svix-signature': over.sig ?? (await signSvixForTest(SECRET, id, ts, body)),
  }
}

describe('verifySvixSignature', () => {
  it('accepts a correctly signed payload', async () => {
    expect(await verifySvixSignature(SECRET, BODY, await headersFor(), NOW)).toBe(true)
  })

  it('rejects a tampered body', async () => {
    const headers = await headersFor()
    const tampered = JSON.stringify({ type: 'email.received', data: { id: 'evil' } })
    expect(await verifySvixSignature(SECRET, tampered, headers, NOW)).toBe(false)
  })

  it('rejects a signature made with a different secret', async () => {
    const sig = await signSvixForTest('whsec_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'msg_2b1c', NOW, BODY)
    expect(await verifySvixSignature(SECRET, BODY, await headersFor({ sig }), NOW)).toBe(false)
  })

  it('rejects a replay outside the tolerance window', async () => {
    const headers = await headersFor({ ts: NOW - 6 * 60 })
    expect(await verifySvixSignature(SECRET, BODY, headers, NOW)).toBe(false)
  })

  it('accepts a payload just inside the tolerance window', async () => {
    const headers = await headersFor({ ts: NOW - 4 * 60 })
    expect(await verifySvixSignature(SECRET, BODY, headers, NOW)).toBe(true)
  })

  it('rejects a timestamp from the future beyond tolerance', async () => {
    const headers = await headersFor({ ts: NOW + 6 * 60 })
    expect(await verifySvixSignature(SECRET, BODY, headers, NOW)).toBe(false)
  })

  it('accepts when one of several space-separated signatures matches', async () => {
    const good = await signSvixForTest(SECRET, 'msg_2b1c', NOW, BODY)
    const sig = `v1,ZmFrZQ== ${good}`
    expect(await verifySvixSignature(SECRET, BODY, await headersFor({ sig }), NOW)).toBe(true)
  })

  it('ignores signature entries for versions it does not understand', async () => {
    const good = await signSvixForTest(SECRET, 'msg_2b1c', NOW, BODY)
    const sig = `v2,${good.slice(3)} ${good}`
    expect(await verifySvixSignature(SECRET, BODY, await headersFor({ sig }), NOW)).toBe(true)
  })

  it('rejects when headers are missing entirely', async () => {
    expect(await verifySvixSignature(SECRET, BODY, {}, NOW)).toBe(false)
  })

  it('rejects a malformed timestamp instead of treating it as zero', async () => {
    const headers = await headersFor({ ts: NOW })
    expect(await verifySvixSignature(SECRET, BODY, { ...headers, 'svix-timestamp': 'soon' }, NOW)).toBe(false)
  })

  it('handles a secret given without the whsec_ prefix', async () => {
    const bare = SECRET.replace('whsec_', '')
    const sig = await signSvixForTest(bare, 'msg_2b1c', NOW, BODY)
    expect(await verifySvixSignature(bare, BODY, await headersFor({ sig }), NOW)).toBe(true)
  })
})
