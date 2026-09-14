// ============================================================
// MercadoRD — Rate limiting de traducción de productos con IA
// Ruta: lib/ai/translateProductRateLimiter.ts
// ============================================================
// Contador propio — separado de lib/ai/translateRateLimiter.ts (chat,
// 50/hora) y lib/ai/rateLimiter.ts (generación de títulos/descripciones,
// 20/hora). Esto solo cuenta llamadas REALES a Anthropic: si ya existe
// una fila en product_translations para ese producto+idioma, la ruta
// responde desde caché y nunca llega a este chequeo — así que el límite
// no penaliza a un comprador navegando el catálogo en inglés/francés una
// vez que los productos populares ya están traducidos. Mismo patrón que
// los otros dos: Upstash Redis con sliding window, con respaldo en
// memoria si Upstash falla.
// ============================================================

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const MAX_CALLS_PER_HOUR = 30
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
      prefix: 'mercadord:ratelimit:ai-translate-product',
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

export const AI_TRANSLATE_PRODUCT_RATE_LIMIT_MESSAGE = `Alcanzaste el límite de ${MAX_CALLS_PER_HOUR} traducciones de producto por hora. Intenta de nuevo más tarde.`

function checkAiTranslateProductRateLimitMemory(userId: string): boolean {
  const counter = getOrResetCounter(userId)
  counter.count += 1
  return counter.count <= MAX_CALLS_PER_HOUR
}

export async function checkAiTranslateProductRateLimit(userId: string): Promise<boolean> {
  if (rateLimitByUser) {
    try {
      const { success } = await rateLimitByUser.limit(userId)
      return success
    } catch (error) {
      console.error('[ai/translateProductRateLimiter] Upstash falló, usando fallback en memoria:', error)
      return checkAiTranslateProductRateLimitMemory(userId)
    }
  }

  return checkAiTranslateProductRateLimitMemory(userId)
}
