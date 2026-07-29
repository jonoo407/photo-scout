import { describe, it, expect } from 'vitest'
import { buildForward, type ReceivedEmail } from '../../src/push/forward-mail'

/* Mail sent to support@shootvantage.com is forwarded to Jon's inbox. The
   address is published in-app under App Review guideline 1.2, so the reply
   path has to actually work — hitting reply must reach the person who wrote
   in, not Vantage's own alerts address. */

const received: ReceivedEmail = {
  id: 'rec_1',
  from: 'Dana Fisher <dana@example.com>',
  to: ['support@shootvantage.com'],
  subject: 'A shot at Bayshore is not mine',
  text: 'That photo of the balustrade is my copyright.',
  html: '<p>That photo of the balustrade is my copyright.</p>',
  created_at: '2026-07-29T10:00:00Z',
}

const TO = 'jon@example.com'

describe('buildForward', () => {
  it('sends from the verified domain, not the stranger who wrote in', () => {
    const m = buildForward(received, TO)
    expect(m.from).toBe('Vantage support <alerts@shootvantage.com>')
    expect(m.to).toEqual([TO])
  })

  it('routes replies back to the original sender', () => {
    expect(buildForward(received, TO).reply_to).toEqual(['dana@example.com'])
  })

  it('keeps the original subject so threads stay recognisable', () => {
    expect(buildForward(received, TO).subject).toBe('A shot at Bayshore is not mine')
  })

  it('gives a subject to mail that arrived without one', () => {
    expect(buildForward({ ...received, subject: '' }, TO).subject).toBe('(no subject)')
  })

  it('keeps the original body and states who it came from', () => {
    const html = buildForward(received, TO).html
    expect(html).toContain('That photo of the balustrade is my copyright.')
    expect(html).toContain('dana@example.com')
    expect(html).toContain('support@shootvantage.com')
  })

  it('falls back to the text body when there is no html', () => {
    const m = buildForward({ ...received, html: null }, TO)
    expect(m.html).toContain('That photo of the balustrade is my copyright.')
  })

  it('says so plainly when the mail had no body at all', () => {
    const m = buildForward({ ...received, html: null, text: null }, TO)
    expect(m.html).toContain('no body')
  })

  it('escapes html in the sender so a crafted display name cannot inject markup', () => {
    const m = buildForward({ ...received, from: '<script>alert(1)</script>@evil.com' }, TO)
    expect(m.html).not.toContain('<script>')
    expect(m.html).toContain('&lt;script&gt;')
  })

  it('escapes the text body it promotes into html', () => {
    const m = buildForward({ ...received, html: null, text: '<img src=x onerror=alert(1)>' }, TO)
    expect(m.html).not.toContain('<img src=x')
    expect(m.html).toContain('&lt;img')
  })

  it('handles a bare address with no display name', () => {
    expect(buildForward({ ...received, from: 'dana@example.com' }, TO).reply_to)
      .toEqual(['dana@example.com'])
  })

  it('omits reply_to rather than guessing when the sender is unparseable', () => {
    expect(buildForward({ ...received, from: '' }, TO).reply_to).toBeUndefined()
  })
})
