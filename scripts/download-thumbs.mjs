// Download candidate thumbnails locally (throttled, real UA) for reliable montage
// rendering, and verify each file resolves to an image. Writes scripts/.cand/<id>_<i>.jpg
// Run: node scripts/download-thumbs.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const UA = 'VantagePhotoScout/0.1 (https://github.com/jonoo407/photo-scout)'
const cands = JSON.parse(readFileSync('scripts/candidates.json', 'utf8'))
mkdirSync('scripts/.cand', { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let ok = 0, fail = 0
const log = {}
for (const [id, list] of Object.entries(cands)) {
  log[id] = []
  for (let i = 0; i < list.length; i++) {
    const url = list[i].thumb
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA } })
      const ct = r.headers.get('content-type') || ''
      if (r.ok && ct.startsWith('image/')) {
        const buf = Buffer.from(await r.arrayBuffer())
        writeFileSync(`scripts/.cand/${id}_${i}.jpg`, buf)
        log[id].push({ i, ok: true, ct, bytes: buf.length })
        ok++
      } else {
        log[id].push({ i, ok: false, status: r.status, ct })
        fail++
      }
    } catch (e) {
      log[id].push({ i, ok: false, err: String(e).slice(0, 60) })
      fail++
    }
    await sleep(90)
  }
}
writeFileSync('scripts/download-log.json', JSON.stringify(log, null, 2))
console.log(`downloaded ok=${ok} fail=${fail}`)
const fails = Object.entries(log).flatMap(([id, l]) => l.filter((x) => !x.ok).map((x) => `${id}#${x.i} (${x.status || x.err})`))
if (fails.length) console.log('failures:', fails.join(', '))
