import { describe, it, expect } from 'vitest'
import { receivedEmailId } from '../../src/push/forward-mail'

/* The `email.received` payload shape, taken from a REAL Resend delivery
   (2026-07-29), not from a guess.

   The first cut of this route read `data.id` and every webhook came back
   400 "no id" — the field is `data.email_id`. Nothing in the unit tests could
   have caught that, because the tests and the code shared my assumption about
   the shape. Hence this fixture: a verbatim payload is the only thing that
   actually pins the contract down. */

const REAL_PAYLOAD = {
  created_at: '2026-07-29T15:47:27.000Z',
  type: 'email.received',
  data: {
    attachments: [],
    bcc: [],
    cc: [],
    created_at: '2026-07-29T15:47:28.411Z',
    email_id: '92ee4aca-8d16-45b3-957e-9d075f43f25f',
    from: 'alerts@shootvantage.com',
    to: ['support@shootvantage.com'],
    subject: 'J6 test 2 — post-verification',
  },
}

describe('receivedEmailId', () => {
  it('reads email_id from a real Resend email.received payload', () => {
    expect(receivedEmailId(REAL_PAYLOAD)).toBe('92ee4aca-8d16-45b3-957e-9d075f43f25f')
  })

  it('falls back to data.id if Resend ever sends that instead', () => {
    expect(receivedEmailId({ type: 'email.received', data: { id: 'abc' } })).toBe('abc')
  })

  it('prefers email_id when both are present', () => {
    expect(receivedEmailId({ type: 'email.received', data: { email_id: 'right', id: 'wrong' } }))
      .toBe('right')
  })

  it('returns null when there is no id at all', () => {
    expect(receivedEmailId({ type: 'email.received', data: {} })).toBeNull()
  })

  it('returns null for a payload with no data', () => {
    expect(receivedEmailId({ type: 'email.received' })).toBeNull()
  })

  it('returns null for junk rather than throwing', () => {
    expect(receivedEmailId(null)).toBeNull()
    expect(receivedEmailId('nope')).toBeNull()
  })

  it('ignores a non-string id', () => {
    expect(receivedEmailId({ data: { email_id: 42 } })).toBeNull()
  })
})
