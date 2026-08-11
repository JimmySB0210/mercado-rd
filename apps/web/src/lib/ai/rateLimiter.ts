// ============================================================
// MercadoRD — Rate limiting de generación de texto con IA
// Ruta: lib/ai/rateLimiter.ts
// ============================================================
// Cada llamada a /api/ai/generate cuesta dinero real (Anthropic API),
// así que no puede quedar sin límite. Reutiliza la misma infraestructura
// de Upstash Redis que lib/rateLimiter.ts usa para el checkout — 20
// llamadas por vendor (userId autenticado) cada hora, sliding window.
// Si Upstash no está configurado (ej. desarrollo local sin esas claves),
// cae a un Map en memoria, igual que el rate limiter de checkout.
// ============================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const MAX_CALLS_PER_HOUR = 20
const WINDOW_MS = 60 * 60 * 1000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const hasUpstash = !!upstashUrl && !!upstashToken

const redis = hasUpstash ? new Redis({ url: upstashUrl!, token: upstashToken! }) : null

const rateLimitByVendor = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_CALLS_PER_HOUR, '1 h'),
      prefix: 'mercadord:ratelimit:ai-generate',
    })
  : null

// ─── Fallback en memoria (sin Upstash configurado) ─────────────────────────

interface Counter {
  count: number
  resetAt: number
}

const vendorCalls = new Map<string, Counter>()

function getOrResetCounter(vendorId: string): Counter {
  const existing = vendorCalls.get(vendorId)
  if (existing && existing.resetAt > Date.now()) return existing

  const fresh: Counter = { count: 0, resetAt: Date.now() + WINDOW_MS }
  vendorCalls.set(vendorId, fresh)
  return fresh
}

if (!redis && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, counter] of vendorCalls) {
      if (counter.resetAt <= now) vendorCalls.delete(key)
    }
  }, SWEEP_INTERVAL_MS)
}

export const AI_RATE_LIMIT_MESSAGE = `Alcanzaste el límite de ${MAX_CALLS_PER_HOUR} generaciones con IA por hora. Intenta de nuevo más tarde.`

function checkAiRateLimitMemory(vendorId: string): boolean {
  const counter = getOrResetCounter(vendorId)
  counter.count += 1
  return counter.count <= MAX_CALLS_PER_HOUR
}

export async function checkAiRateLimit(vendorId: string): Promise<boolean> {
  if (rateLimitByVendor) {
    try {
      const { success } = await rateLimitByVendor.limit(vendorId)
      return success
    } catch (error) {
      // Upstash inalcanzable (red caída, DNS, etc.) — no debe tumbar la
      // ruta que lo llama. Cae al límite en memoria para esta instancia.
      console.error('[ai/rateLimiter] Upstash falló, usando fallback en memoria:', error)
      return checkAiRateLimitMemory(vendorId)
    }
  }

  return checkAiRateLimitMemory(vendorId)
}
