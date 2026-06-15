import { readFileSync, writeFileSync } from 'node:fs'

const PORT = process.argv[2] || '9222'

const targets = [
  { svg: 'public/icon.svg', size: 192, out: 'public/pwa-192.png', transparent: true },
  { svg: 'public/icon.svg', size: 512, out: 'public/pwa-512.png', transparent: true },
  { svg: 'brand/maskable.svg', size: 512, out: 'public/maskable-512.png', transparent: false },
  { svg: 'brand/appletouch.svg', size: 180, out: 'public/apple-touch-icon.png', transparent: false },
]

const ver = await (await fetch(`http://localhost:${PORT}/json/version`)).json()
const ws = new WebSocket(ver.webSocketDebuggerUrl)
await new Promise((r) => (ws.onopen = r))

let nextId = 1
const pending = new Map()
const waiters = []
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data)
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
  } else if (msg.method) {
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].method === msg.method && waiters[i].sid === msg.sessionId) {
        waiters[i].resolve(msg.params)
        waiters.splice(i, 1)
      }
    }
  }
}
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
const waitEvent = (method, sid) => new Promise((resolve) => waiters.push({ method, sid, resolve }))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

for (const t of targets) {
  const svg = readFileSync(t.svg, 'utf8')
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}svg{display:block;width:100vw;height:100vh}</style></head><body>${svg}</body></html>`
  const dataUrl = 'data:text/html;base64,' + Buffer.from(html, 'utf8').toString('base64')

  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, sessionId)
  await send('Emulation.setDeviceMetricsOverride', {
    width: t.size, height: t.size, deviceScaleFactor: 1, mobile: false,
  }, sessionId)
  if (t.transparent) {
    await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }, sessionId)
  }
  const loaded = waitEvent('Page.loadEventFired', sessionId)
  await send('Page.navigate', { url: dataUrl }, sessionId)
  await loaded
  await sleep(250)
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: t.size, height: t.size, scale: 1 },
    captureBeyondViewport: false,
  }, sessionId)
  writeFileSync(t.out, Buffer.from(shot.data, 'base64'))
  console.log(`WROTE ${t.out} (${t.size}x${t.size}, ${(shot.data.length / 1.37 / 1024).toFixed(1)}KB)`)
  await send('Target.closeTarget', { targetId })
}
ws.close()
process.exit(0)
