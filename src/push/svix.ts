/* Svix webhook signature verification (Resend inbound mail, 2026-07-29).

   Resend signs webhooks with Svix. `/api/inbound-mail` forwards whatever it is
   handed into Jon's inbox, so an unverified endpoint is an open relay wearing
   Vantage's return address — verification is the whole reason the route can
   exist safely.

   WebCrypto only, no library: the Worker runtime has it, and the scheme is
   small enough that a dependency would be the bigger risk.

   Scheme: HMAC-SHA256 over `${id}.${timestamp}.${body}`, keyed with the
   base64-decoded secret (minus its `whsec_` prefix), base64-encoded. The
   `svix-signature` header may carry several space-separated `v1,<sig>`
   entries during a secret rotation, so any one match is a pass. */

const TOLERANCE_SECONDS = 5 * 60

const b64ToBytes = (b64: string): Uint8Array =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

const bytesToB64 = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))

async function hmac(secret: string, message: string): Promise<string> {
  const raw = b64ToBytes(secret.replace(/^whsec_/, ''))
  const key = await crypto.subtle.importKey(
    'raw', raw as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return bytesToB64(new Uint8Array(sig))
}

/** Constant-time compare — a length-independent early return here would leak
    the signature a byte at a time to anyone willing to time the endpoint. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifySvixSignature(
  secret: string,
  body: string,
  headers: Record<string, string | null | undefined>,
  nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<boolean> {
  const id = headers['svix-id']
  const timestamp = headers['svix-timestamp']
  const signature = headers['svix-signature']
  if (!id || !timestamp || !signature) return false

  // Number('') is 0 and Number('soon') is NaN — reject both rather than let a
  // malformed header land inside the tolerance window by accident.
  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || timestamp.trim() === '') return false
  if (Math.abs(nowSeconds - ts) > TOLERANCE_SECONDS) return false

  const expected = await hmac(secret, `${id}.${ts}.${body}`)
  return signature
    .split(' ')
    .filter((part) => part.startsWith('v1,'))
    .some((part) => timingSafeEqual(part.slice(3), expected))
}

/** Test helper — produces the header value Svix would send. Exported so the
    suite signs with the real algorithm rather than a hand-copied fixture. */
export async function signSvixForTest(
  secret: string, id: string, timestamp: number, body: string,
): Promise<string> {
  return `v1,${await hmac(secret, `${id}.${timestamp}.${body}`)}`
}
