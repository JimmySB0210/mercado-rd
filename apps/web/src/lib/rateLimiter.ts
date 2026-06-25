// ============================================================
// MercadoRD — Rate limiting de checkout
// Archivo: lib/rateLimiter.ts
// ============================================================
// Protección básica contra card testing. Usa Upstash Redis
// (compartido entre instancias) cuando UPSTASH_REDIS_REST_URL /
// UPSTASH_REDIS_REST_TOKEN están definidas. Si no están definidas
// (ej. desarrollo local sin esas claves), cae al Map en memoria de
// antes — solo válido para una sola instancia del servidor.
// ============================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS_PER_IP = 5
const MAX_FAILURES_PER_USER = 3
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

if (process.env.NODE_ENV === 'production' && (!upstashUrl || !upstashToken)) {
  throw new Error('Upstash Redis must be configured for production rate limiting')
}

const hasUpstash = !!upstashUrl && !!upstashToken

const redis = hasUpstash ? new Redis({ url: upstashUrl!, token: upstashToken! }) : null

// 5 requests por 15 minutos por IP (sliding window)
const rateLimitByIp = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS_PER_IP, '15 m'),
      prefix: 'mercadord:ratelimit:ip',
    })
  : null

// 3 fallos por 15 minutos por userId (sliding window)
const rateLimitByUser = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_FAILURES_PER_USER, '15 m'),
      prefix: 'mercadord:ratelimit:user-fail',
    })
  : null

// ─── Fallback en memoria (sin Upstash configurado) ─────────────────────────

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
// Solo aplica al fallback; Redis expira las claves por su cuenta.
if (!redis && typeof setInterval !== 'undefined') {
  setInterval(() => {
    sweep(ipAttempts)
    sweep(userFailures)
  }, SWEEP_INTERVAL_MS)
}

function checkIpLimitMemory(ip: string): boolean {
  const counter = getOrResetCounter(ipAttempts, ip)
  counter.count += 1
  return counter.count <= MAX_ATTEMPTS_PER_IP
}

function isUserBlockedMemory(userId: string): boolean {
  const counter = userFailures.get(userId)
  if (!counter || counter.resetAt <= Date.now()) return false
  return counter.count >= MAX_FAILURES_PER_USER
}

function recordUserFailureMemory(userId: string): void {
  const counter = getOrResetCounter(userFailures, userId)
  counter.count += 1
}

// ─── Interfaz pública ───────────────────────────────────────────────────────

export const IP_LIMIT_MESSAGE = 'Demasiados intentos. Espera 15 minutos antes de intentar de nuevo.'
export const USER_LIMIT_MESSAGE = 'Demasiados intentos fallidos con esta cuenta. Espera 15 minutos antes de intentar de nuevo.'

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

// Chequea (y consume un intento de) el límite por IP, y chequea —sin
// consumir— si el userId ya está bloqueado por fallos previos.
export async function checkRateLimit(
  ip: string,
  userId: string
): Promise<{ allowed: boolean; message?: string }> {
  if (rateLimitByIp && rateLimitByUser) {
    const { success } = await rateLimitByIp.limit(ip)
    if (!success) return { allowed: false, message: IP_LIMIT_MESSAGE }

    const { remaining } = await rateLimitByUser.getRemaining(userId)
    if (remaining <= 0) return { allowed: false, message: USER_LIMIT_MESSAGE }

    return { allowed: true }
  }

  if (!checkIpLimitMemory(ip)) return { allowed: false, message: IP_LIMIT_MESSAGE }
  if (isUserBlockedMemory(userId)) return { allowed: false, message: USER_LIMIT_MESSAGE }
  return { allowed: true }
}

// Registra un fallo (tarjeta rechazada) para el userId.
export async function recordFailure(userId: string): Promise<void> {
  if (rateLimitByUser) {
    await rateLimitByUser.limit(userId)
    return
  }
  recordUserFailureMemory(userId)
}

export async function handleRateCheckRequest(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null) as { user_id?: string; action?: string } | null
  const userId = body?.user_id
  const action = body?.action ?? 'check'

  if (!userId) {
    return Response.json({ error: 'user_id requerido' }, { status: 400 })
  }

  if (action === 'fail') {
    await recordFailure(userId)
    return Response.json({ recorded: true })
  }

  const { allowed, message } = await checkRateLimit(getClientIp(request), userId)
  if (!allowed) {
    return Response.json({ error: message }, { status: 429 })
  }

  return Response.json({ allowed: true })
}
