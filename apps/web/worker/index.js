// ============================================================
// MercadoRD — Custom worker (push notifications)
// Ruta: apps/web/worker/index.js
// ============================================================
// next-pwa busca este archivo en `worker/index.js` (opción
// customWorkerDir) y lo bundlea como worker-<buildId>.js, que
// luego importa vía `importScripts` dentro del sw.js generado
// por workbox. El sw.js de workbox por sí solo NO trae handlers
// de push — por eso el botón se quedaba en "Activando..." sin
// que llegara nunca la notificación: el evento 'push' no tenía
// ningún listener.
// ============================================================

// Handler para notificaciones push
self.addEventListener('push', function (event) {
  if (!event.data) return
  const data = event.data.json()
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url || '/' },
    vibrate: [100, 50, 100],
  }
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  )
})
