// ============================================================
// MercadoRD — Validación de suscripciones y mensajes push
// Ruta: src/lib/push/validateSubscription.ts
// ============================================================
// Se valida la forma ANTES de tocar la base. Los hosts permitidos son
// los mismos que la restricción push_subscriptions_endpoint_check de la
// base (Lote B): FCM, Mozilla, Apple y Windows.
// ============================================================

const PUSH_HOSTS = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com']
const PUSH_HOST_SUFFIX = '.notify.windows.com'

export function isValidPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== 'string' || endpoint.length === 0 || endpoint.length > 2048) return false
  let url: URL
  try { url = new URL(endpoint) } catch { return false }
  if (url.protocol !== 'https:') return false
  const host = url.hostname.toLowerCase()
  return PUSH_HOSTS.includes(host) || host.endsWith(PUSH_HOST_SUFFIX)
}

export interface ValidSubscription {
  endpoint: string
  p256dh: string
  auth: string
}

// Devuelve la suscripción válida o un mensaje de error para responder 400.
export function validateSubscription(body: unknown): { ok: true; value: ValidSubscription } | { ok: false; error: string } {
  const b = body as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null
  if (!b || typeof b !== 'object') return { ok: false, error: 'Suscripción inválida' }
  if (!isValidPushEndpoint(b.endpoint)) return { ok: false, error: 'Endpoint de notificaciones no válido' }
  const p256dh = b.keys?.p256dh
  const auth = b.keys?.auth
  if (typeof p256dh !== 'string' || p256dh.length < 1 || p256dh.length > 200) return { ok: false, error: 'Clave p256dh no válida' }
  if (typeof auth !== 'string' || auth.length < 1 || auth.length > 100) return { ok: false, error: 'Clave auth no válida' }
  return { ok: true, value: { endpoint: b.endpoint, p256dh, auth } }
}

// ─── Contenido de /api/push/send ─────────────────────────────
// title: 1–100 (recortado); body: ≤300 (recortado); url: ruta interna que
// empiece con "/" (no "//"), sin "\" ni caracteres de control, ≤300; si
// no cumple, "/".
export interface PushMessage {
  title: string
  body: string
  url: string
}

const CONTROL_CHARS = /[\u0000-\u001f\u007f]/

export function sanitizePushUrl(url: unknown): string {
  if (typeof url !== 'string') return '/'
  if (url.length === 0 || url.length > 300) return '/'
  if (!url.startsWith('/') || url.startsWith('//')) return '/'
  if (url.includes('\\') || CONTROL_CHARS.test(url)) return '/'
  return url
}

export function sanitizePushMessage(body: unknown): { ok: true; value: PushMessage } | { ok: false; error: string } {
  const b = body as { title?: unknown; body?: unknown; url?: unknown } | null
  if (!b || typeof b !== 'object') return { ok: false, error: 'Cuerpo inválido' }
  if (typeof b.title !== 'string') return { ok: false, error: 'El título es obligatorio' }
  const title = b.title.trim().slice(0, 100)
  if (title.length === 0) return { ok: false, error: 'El título es obligatorio' }
  if (b.body !== undefined && typeof b.body !== 'string') return { ok: false, error: 'El texto debe ser un string' }
  const text = typeof b.body === 'string' ? b.body.trim().slice(0, 300) : ''
  return { ok: true, value: { title, body: text, url: sanitizePushUrl(b.url) } }
}
