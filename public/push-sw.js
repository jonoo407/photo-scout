/* Web-push handlers, imported into the generated service worker via
   workbox importScripts. Pushes arrive as payload-less tickles; the real
   alert text waits at /api/push/pending keyed by a hash of our endpoint. */

const b64url = (bytes) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let alerts = []
    try {
      const sub = await self.registration.pushManager.getSubscription()
      if (sub) {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sub.endpoint))
        const res = await fetch('/api/push/pending?k=' + b64url(new Uint8Array(digest)))
        if (res.ok) alerts = await res.json()
      }
    } catch {
      /* fall through to the generic notification */
    }
    if (!Array.isArray(alerts) || alerts.length === 0) {
      alerts = [{ title: 'Vantage', body: 'Conditions are lining up at one of your watched spots.', url: '/' }]
    }
    for (const a of alerts) {
      await self.registration.showNotification(a.title, {
        body: a.body,
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        data: { url: a.url || '/' },
      })
    }
  })())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : '/'
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const w of wins) {
      if ('focus' in w) {
        await w.focus()
        if ('navigate' in w) await w.navigate(url)
        return
      }
    }
    await self.clients.openWindow(url)
  })())
})
