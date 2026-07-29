/* Forward mail sent to support@shootvantage.com into Jon's inbox (2026-07-29).

   V1 publishes that address in-app because App Review guideline 1.2 requires
   published contact information. Resend receives it; this builds the forward.

   Two things matter and neither is obvious:
   · The forward must be sent FROM the verified domain. Re-sending as the
     original stranger would fail SPF/DKIM and land in spam — so the sender
     goes in `reply_to` instead, which is also what makes hitting reply reach
     the person who actually wrote in.
   · Everything interpolated is attacker-controlled. A display name is chosen
     by whoever sends the mail, so it gets escaped like any other input. */

export interface ReceivedEmail {
  id: string
  from: string
  to: string[]
  subject: string
  text: string | null
  html: string | null
  created_at: string
}

export interface ForwardMessage {
  from: string
  to: string[]
  reply_to?: string[]
  subject: string
  html: string
}

const esc = (s: string) =>
  s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]!))

/** Pull the received-email id out of an `email.received` webhook payload.
    It is `data.email_id` — NOT `data.id`, which is what this route assumed on
    its first deploy, earning a 400 on every delivery. `id` is kept only as a
    fallback in case the shape ever changes back. */
export function receivedEmailId(event: unknown): string | null {
  const data = (event as { data?: Record<string, unknown> } | null)?.data
  if (!data) return null
  const id = data.email_id ?? data.id
  return typeof id === 'string' && id ? id : null
}

/** Pull the address out of `Name <addr@host>` or a bare `addr@host`. */
export function extractAddress(from: string): string | null {
  const angled = /<([^<>]+@[^<>]+)>/.exec(from)
  const candidate = (angled ? angled[1] : from).trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate) ? candidate : null
}

export function buildForward(email: ReceivedEmail, to: string): ForwardMessage {
  const sender = extractAddress(email.from)
  const body = email.html
    ?? (email.text ? `<p style="white-space:pre-wrap">${esc(email.text)}</p>` : null)
    ?? '<p style="color:#777"><em>(no body)</em></p>'

  return {
    from: 'Vantage support <alerts@shootvantage.com>',
    to: [to],
    ...(sender ? { reply_to: [sender] } : {}),
    subject: email.subject?.trim() || '(no subject)',
    html:
      `<p style="color:#777;font-size:12px;margin:0 0 4px">`
      + `Sent to ${esc(email.to.join(', '))} by <strong>${esc(email.from)}</strong>`
      + `</p><hr style="border:0;border-top:1px solid #ddd">`
      + body,
  }
}
