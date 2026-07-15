/* Email body for "a client answered your shortlist" — sent by the Worker via
   Resend. Every field is client-typed data: escape everything. */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

export interface ResponseEmailInput {
  title: string | null
  clientName: string | null
  pickedNames: string[]
  comment: string | null
}

export function responseEmail({ title, clientName, pickedNames, comment }: ResponseEmailInput): {
  subject: string
  html: string
} {
  const who = clientName?.trim() || null
  const listName = title?.trim() || 'Location options'
  const subject = who
    ? `${who} picked their spots — ${listName}`
    : `Your client responded — ${listName}`

  const picksHtml = pickedNames.length
    ? `<p style="margin:0 0 6px"><strong>Their picks</strong></p>
<ul style="margin:0 0 16px;padding-left:20px">${pickedNames.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`
    : `<p style="margin:0 0 16px">No spot picked — see their note below.</p>`

  const commentHtml = comment?.trim()
    ? `<blockquote style="margin:0 0 16px;padding:10px 14px;border-left:3px solid #a8431d;background:#faf1e2;color:#2e2014">${esc(comment.trim())}</blockquote>`
    : ''

  const html = `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2e2014">
<p style="font-size:13px;letter-spacing:.08em;color:#a8431d;margin:0 0 4px">VANTAGE</p>
<h2 style="margin:0 0 14px">${who ? esc(who) : 'Your client'} answered “${esc(listName)}”</h2>
${picksHtml}
${commentHtml}
<p style="margin:0"><a href="https://shootvantage.com/#/you" style="color:#a8431d">Open your client lists →</a></p>
</div>`

  return { subject, html }
}
