// ============================================================
// MercadoRD — Rate limiting en memoria para checkout
// Archivo: lib/rateLimiter.ts
// ============================================================
// Protección básica contra card testing. Un Map por proceso —
// suficiente para una sola instancia del servidor; si se escala a
// varias instancias habrá que migrar a Redis.
// ============================================================

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS_PER_IP = 5
const MAX_FAILURES_PER_USER = 3
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

interface Counter {
  count: number
  resetAt: number
}

const ipAttempts = new Map<string, Counter>()
const userFailures = new Map<string, Counter>()

function getOrResetCounter(map: Map<string, Counter>, key: string): Counter {
  const existing = map.get(key)
  if (existing && existing.resetAt > Date.now()) return existing

  const fresh: Counter = { count: 0, resetAt: Date.now() + WINDOW_MS }
  map.set(key, fresh)
  return fresh
}

function sweep(map: Map<string, Counter>) {
  const now = Date.now()
  for (const [key, counter] of map) {
    if (counter.resetAt <= now) map.delete(key)
  }
}

// Limpia entradas vencidas cada 5 minutos para que los Map no crezcan
// indefinidamente — además del chequeo lazy de resetAt en cada acceso.
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    sweep(ipAttempts)
    sweep(userFailures)
  }, SWEEP_INTERVAL_MS)
}

export function checkIpLimit(ip: string): boolean {
  const counter = getOrResetCounter(ipAttempts, ip)
  counter.count += 1
  return counter.count <= MAX_ATTEMPTS_PER_IP
}

export function isUserBlocked(userId: string): boolean {
  const counter = userFailures.get(userId)
  if (!counter || counter.resetAt <= Date.now()) return false
  return counter.count >= MAX_FAILURES_PER_USER
}

export function recordUserFailure(userId: string): void {
  const counter = getOrResetCounter(userFailures, userId)
  counter.count += 1
}

export const IP_LIMIT_MESSAGE = 'Demasiados intentos. Espera 15 minutos antes de intentar de nuevo.'
export const USER_LIMIT_MESSAGE = 'Demasiados intentos fallidos con esta cuenta. Espera 15 minutos antes de intentar de nuevo.'

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

export async function handleRateCheckRequest(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null) as { user_id?: string; action?: string } | null
  const userId = body?.user_id
  const action = body?.action ?? 'check'

  if (!userId) {
    return Response.json({ error: 'user_id requerido' }, { status: 400 })
  }

  if (action === 'fail') {
    recordUserFailure(userId)
    return Response.json({ recorded: true })
  }

  if (!checkIpLimit(getClientIp(request))) {
    return Response.json({ error: IP_LIMIT_MESSAGE }, { status: 429 })
  }

  if (isUserBlocked(userId)) {
    return Response.json({ error: USER_LIMIT_MESSAGE }, { status: 429 })
  }

  return Response.json({ allowed: true })
}
