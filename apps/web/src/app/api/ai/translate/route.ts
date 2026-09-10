// ============================================================
// MercadoRD — Traducción de mensajes de chat con IA
// Ruta: src/app/api/ai/translate/route.ts
// ============================================================
// Server-side únicamente — la API key de Anthropic nunca toca el
// frontend. Mismo patrón que /api/ai/generate (auth + rate limiting
// con respaldo en memoria si Upstash falla), pero ruta separada: el
// rate limit es propio (50/hora, lib/ai/translateRateLimiter.ts) y no
// comparte cupo con la generación de títulos/descripciones (20/hora)
// — la traducción es un uso natural más frecuente dentro de una
// conversación activa.
//
// Nunca se persiste — ni la traducción ni el texto original se
// guardan en ningún lado, se recalcula cada vez que alguien pide
// traducir ese mensaje específico.
// ============================================================

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkAiTranslateRateLimit, AI_TRANSLATE_RATE_LIMIT_MESSAGE } from '@/lib/ai/translateRateLimiter'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Eres un traductor. Tu única tarea es traducir el texto que te dan al idioma solicitado, de la forma más fiel y natural posible. Nunca agregues comentarios, explicaciones, opiniones, ni contenido que no esté en el texto original. Responde ÚNICAMENTE con la traducción, sin comillas ni texto adicional.`

type TargetLanguage = 'es' | 'en' | 'fr'

const VALID_LANGUAGES: TargetLanguage[] = ['es', 'en', 'fr']

const LANGUAGE_NAMES: Record<TargetLanguage, string> = {
  es: 'español',
  en: 'inglés',
  fr: 'francés',
}

interface TranslateRequestBody {
  message: string
  target_language: TargetLanguage
}

function validateBody(body: unknown): { ok: true; value: TranslateRequestBody } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Cuerpo de la solicitud inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.message !== 'string' || !b.message.trim()) {
    return { ok: false, error: 'message requerido' }
  }
  if (b.message.length > 2000) {
    return { ok: false, error: 'message no puede superar 2000 caracteres' }
  }
  if (typeof b.target_language !== 'string' || !VALID_LANGUAGES.includes(b.target_language as TargetLanguage)) {
    return { ok: false, error: 'target_language inválido' }
  }

  return {
    ok: true,
    value: {
      message: b.message,
      target_language: b.target_language as TargetLanguage,
    },
  }
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,
})

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const rawBody = await request.json().catch(() => null)
  const validation = validateBody(rawBody)
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 })

  // El rate limit corre DESPUÉS de validar — una solicitud mal formada
  // nunca iba a llegar a Anthropic, así que no debe consumir cupo del
  // usuario. Solo cuentan los intentos reales de llamada a la API paga.
  const allowed = await checkAiTranslateRateLimit(user.id)
  if (!allowed) return NextResponse.json({ error: AI_TRANSLATE_RATE_LIMIT_MESSAGE }, { status: 429 })

  const { message, target_language } = validation.value

  try {
    const userMessage = `Traduce el siguiente texto al ${LANGUAGE_NAMES[target_language]}:\n\n${message}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find(block => block.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''

    if (!text) {
      return NextResponse.json({ error: 'La IA no devolvió texto. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('[api/ai/translate]', error)

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return NextResponse.json({ error: 'La IA tardó demasiado en responder. Intenta de nuevo.' }, { status: 504 })
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'No pudimos traducir el mensaje en este momento. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ error: 'Ocurrió un error inesperado. Intenta de nuevo.' }, { status: 500 })
  }
}
