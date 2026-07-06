import { describe, it, expect } from 'vitest'
import { responseEmail } from '../../src/push/response-email'

describe('responseEmail', () => {
  it('leads with who and what, lists the picks, quotes the comment', () => {
    const m = responseEmail({
      title: 'Engagement shoot — Philly options',
      clientName: 'Sam',
      pickedNames: ['Boathouse Row', 'Belmont Plateau'],
      comment: 'We love the boathouses!',
    })
    expect(m.subject).toBe('Sam picked their spots — Engagement shoot — Philly options')
    expect(m.html).toContain('Boathouse Row')
    expect(m.html).toContain('Belmont Plateau')
    expect(m.html).toContain('We love the boathouses!')
    expect(m.html).toContain('https://shootvantage.com/#/saved')
  })

  it('copes with an anonymous no-pick comment-only response', () => {
    const m = responseEmail({ title: null, clientName: null, pickedNames: [], comment: 'Call me' })
    expect(m.subject).toBe('Your client responded — Location options')
    expect(m.html).toContain('Call me')
    expect(m.html).not.toContain('undefined')
  })

  it('escapes hostile client input everywhere', () => {
    const m = responseEmail({
      title: '<img src=x onerror=alert(1)>',
      clientName: '<b>Evil</b>',
      pickedNames: ['<script>alert(2)</script>'],
      comment: '"><script>alert(3)</script>',
    })
    expect(m.html).not.toContain('<script>')
    expect(m.html).not.toContain('<img')
    expect(m.html).not.toContain('<b>Evil')
    expect(m.html).toContain('&lt;script&gt;')
  })
})
