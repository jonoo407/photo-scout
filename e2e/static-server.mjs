/*
 * Serves dist/ the way the iOS wrapper does: flat, from disk, with no base
 * rewriting and no dev-server smarts.
 *
 * `vite preview` is NOT equivalent — it knows vite.config's `base` and 301s `/`
 * to it, which silently masks absolute-asset-path bugs. Those are precisely
 * what breaks the app under capacitor://localhost, so the WebKit gate has to be
 * served by something as dumb as WKWebView's own loader.
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../dist/', import.meta.url))
const PORT = Number(process.env.PORT ?? 4173)

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain',
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://localhost:${PORT}`).pathname)
  // Block traversal; everything else resolves literally under dist/.
  const rel = normalize(pathname).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '')
  const file = join(ROOT, rel === '' ? 'index.html' : rel)

  try {
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    // Hash routing means real navigations are all "/", so a miss here is a
    // genuinely absent file. Return 404 rather than falling back to index.html,
    // otherwise a 404'd bundle would masquerade as a served page.
    res.writeHead(404, { 'content-type': 'text/plain' })
    res.end(`404 ${rel}`)
  }
}).listen(PORT, () => console.log(`static dist/ on http://localhost:${PORT}`))
