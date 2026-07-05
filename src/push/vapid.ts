/* VAPID (RFC 8292) for web push, on bare WebCrypto so it runs in the app,
   tests, and the Cloudflare Worker alike. Tickle pushes only (no payload), so
   no RFC 8291 message encryption is needed anywhere. */

export interface VapidKeys {
  /** base64url, uncompressed P-256 point — feed to pushManager.subscribe and `k=`. */
  publicKeyB64: string
  /** Full private JWK (includes x/y) — persist server-side only. */
  privateJwk: JsonWebKey
}

export const bytesToB64url = (bytes: Uint8Array): string => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const b64urlToBytes = (b64url: string): Uint8Array<ArrayBuffer> => {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(b64url.length / 4) * 4, '=')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export async function generateVapidKeys(): Promise<VapidKeys> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign'])
  const privateJwk = await crypto.subtle.exportKey('jwk', pair.privateKey)
  const x = b64urlToBytes(privateJwk.x!)
  const y = b64urlToBytes(privateJwk.y!)
  const point = new Uint8Array(65)
  point[0] = 4
  point.set(x, 1)
  point.set(y, 33)
  return { publicKeyB64: bytesToB64url(point), privateJwk }
}

const encodeJson = (o: unknown) => bytesToB64url(new TextEncoder().encode(JSON.stringify(o)))

/** `Authorization: vapid t=<jwt>, k=<pub>` for a push endpoint's origin. */
export async function vapidAuthHeader(endpoint: string, keys: VapidKeys, subject: string): Promise<string> {
  const aud = new URL(endpoint).origin
  const header = encodeJson({ typ: 'JWT', alg: 'ES256' })
  const claims = encodeJson({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject })
  const signingInput = `${header}.${claims}`
  const key = await crypto.subtle.importKey(
    'jwk', keys.privateJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, new TextEncoder().encode(signingInput),
  )
  return `vapid t=${signingInput}.${bytesToB64url(new Uint8Array(sig))}, k=${keys.publicKeyB64}`
}
