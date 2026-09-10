// ============================================================
// MercadoRD — Rate limiting de traducción de mensajes de chat con IA
// Ruta: lib/ai/translateRateLimiter.ts
// ============================================================
// Contador propio, separado del de /api/ai/generate (20/hora) — la
// traducción es un uso natural más frecuente dentro de una
// conversación activa, así que el límite es más alto (50/hora) y no
// comparte cupo con la generación de títulos/descripciones. Mismo
// patrón que lib/ai/rateLimiter.ts: Upstash Redis con sliding window,
// y si no está configurado (o falla en runtime), cae a un Map en
// memoria para esta instancia.
// ============================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const MAX_CALLS_PER_HOUR = 50
const WINDOW_MS = 60 * 60 * 1000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
const hasUpstash = !!upstashUrl && !!upstashToken

const redis = hasUpstash ? new Redis({ url: upstashUrl!, token: upstashToken! }) : null

const rateLimitByUser = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_CALLS_PER_HOUR, '1 h'),
      prefix: 'mercadord:ratelimit:ai-translate',
    })
  : null

// ─── Fallback en memoria (sin Upstash configurado) ─────────────────────────

interface Counter {
  count: number
  resetAt: number
}

const userCalls = new Map<string, Counter>()

function getOrResetCounter(userId: string): Counter {
  const existing = userCalls.get(userId)
  if (existing && existing.resetAt > Date.now()) return existing

  const fresh: Counter = { count: 0, resetAt: Date.now() + WINDOW_MS }
  userCalls.set(userId, fresh)
  return fresh
}

if (!redis && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, counter] of userCalls) {
      if (counter.resetAt <= now) userCalls.delete(key)
    }
  }, SWEEP_INTERVAL_MS)
}

export const AI_TRANSLATE_RATE_LIMIT_MESSAGE = `Alcanzaste el límite de ${MAX_CALLS_PER_HOUR} traducciones por hora. Intenta de nuevo más tarde.`

function checkAiTranslateRateLimitMemory(userId: string): boolean {
  const counter = getOrResetCounter(userId)
  counter.count += 1
  return counter.count <= MAX_CALLS_PER_HOUR
}

export async function checkAiTranslateRateLimit(userId: string): Promise<boolean> {
  if (rateLimitByUser) {
    try {
      const { success } = await rateLimitByUser.limit(userId)
      return success
    } catch (error) {
      console.error('[ai/translateRateLimiter] Upstash falló, usando fallback en memoria:', error)
      return checkAiTranslateRateLimitMemory(userId)
    }
  }

  return checkAiTranslateRateLimitMemory(userId)
}
