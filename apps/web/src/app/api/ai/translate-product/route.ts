// ============================================================
// MercadoRD — Traducción de producto (nombre + descripción) con caché
// Ruta: src/app/api/ai/translate-product/route.ts
// ============================================================
// Server-side únicamente — la API key de Anthropic nunca toca el
// frontend. Mismo patrón que /api/ai/translate (auth + rate limiting),
// pero con un nivel de caché intermedio en product_translations: la
// primera vez que alguien pide un producto+idioma se traduce con UNA
// sola llamada a Anthropic (nombre y descripción juntos) y se guarda
// con save_product_translation() (SECURITY DEFINER — este endpoint
// nunca inserta directo en la tabla). Desde ahí, cualquier otro
// comprador que pida el mismo producto+idioma recibe la fila cacheada
// sin gastar API. El rate limit solo corre cuando de verdad hace falta
// llamar a Anthropic — un cache hit es solo una lectura y no debe
// penalizar a nadie.
//
// La caché se invalida sola en la base (trigger_invalidate_product_
// translations) cuando el vendor edita nombre/descripción, así que
// esta ruta nunca necesita pensar en eso.
// ============================================================

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkAiTranslateProductRateLimit, AI_TRANSLATE_PRODUCT_RATE_LIMIT_MESSAGE } from '@/lib/ai/translateProductRateLimiter'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Eres un traductor. Tu única tarea es traducir el nombre y la descripción de un producto de un marketplace al idioma solicitado, de la forma más fiel y natural posible. Nunca agregues comentarios, explicaciones, opiniones, ni contenido que no esté en el texto original.

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional antes ni después, con exactamente esta forma:
{"name": "<nombre traducido>", "description": "<descripción traducida, o null si no se proporcionó descripción>"}`

type TargetLanguage = 'es' | 'en' | 'fr'
type CacheableLanguage = 'en' | 'fr'

const VALID_LANGUAGES: TargetLanguage[] = ['es', 'en', 'fr']

const LANGUAGE_NAMES: Record<CacheableLanguage, string> = {
  en: 'inglés',
  fr: 'francés',
}

interface TranslateProductRequestBody {
  product_id: string
  target_language: TargetLanguage
}

function validateBody(body: unknown): { ok: true; value: TranslateProductRequestBody } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Cuerpo de la solicitud inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.product_id !== 'string' || !b.product_id.trim()) {
    return { ok: false, error: 'product_id requerido' }
  }
  if (typeof b.target_language !== 'string' || !VALID_LANGUAGES.includes(b.target_language as TargetLanguage)) {
    return { ok: false, error: 'target_language inválido' }
  }

  return {
    ok: true,
    value: {
      product_id: b.product_id,
      target_language: b.target_language as TargetLanguage,
    },
  }
}

function parseTranslationResponse(text: string): { name: string; description: string | null } | null {
  try {
    // El modelo a veces envuelve el JSON en ```json ... ``` a pesar de la
    // instrucción — se quita el fence si está presente, antes de parsear.
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
    const parsed = JSON.parse(cleaned)
    if (typeof parsed.name !== 'string' || !parsed.name.trim()) return null
    const description = typeof parsed.description === 'string' && parsed.description.trim() ? parsed.description : null
    return { name: parsed.name, description }
  } catch {
    return null
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

  const { product_id, target_language } = validation.value

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, description')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  // Español es el idioma fuente — nunca se traduce ni se cachea.
  if (target_language === 'es') {
    return NextResponse.json({ name: product.name, description: product.description, cached: false })
  }

  const { data: cached } = await supabase
    .from('product_translations')
    .select('name, description')
    .eq('product_id', product_id)
    .eq('language', target_language)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({ name: cached.name, description: cached.description, cached: true })
  }

  // Solo a partir de acá se va a llamar a Anthropic de verdad — el rate
  // limit corre después del cache-check para no penalizar cache hits.
  const allowed = await checkAiTranslateProductRateLimit(user.id)
  if (!allowed) return NextResponse.json({ error: AI_TRANSLATE_PRODUCT_RATE_LIMIT_MESSAGE }, { status: 429 })

  try {
    const userMessage = product.description
      ? `Traduce al ${LANGUAGE_NAMES[target_language]} el siguiente nombre y descripción de producto:\n\nNombre: ${product.name}\nDescripción: ${product.description}`
      : `Traduce al ${LANGUAGE_NAMES[target_language]} el siguiente nombre de producto (no tiene descripción):\n\nNombre: ${product.name}`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = response.content.find(block => block.type === 'text')
    const rawText = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''
    const parsed = rawText ? parseTranslationResponse(rawText) : null

    if (!parsed) {
      console.error('[api/ai/translate-product] Respuesta no parseable:', rawText)
      return NextResponse.json({ error: 'La IA no devolvió una traducción válida. Intenta de nuevo.' }, { status: 502 })
    }

    const { error: saveError } = await supabase.rpc('save_product_translation', {
      p_product_id: product_id,
      p_language: target_language,
      p_name: parsed.name,
      p_description: parsed.description,
    })

    if (saveError) {
      // La traducción sí se generó — se devuelve igual aunque no se haya
      // podido cachear, para no desperdiciar la llamada ya pagada.
      console.error('[api/ai/translate-product] save_product_translation falló:', saveError)
    }

    return NextResponse.json({ name: parsed.name, description: parsed.description, cached: false })
  } catch (error) {
    console.error('[api/ai/translate-product]', error)

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return NextResponse.json({ error: 'La IA tardó demasiado en responder. Intenta de nuevo.' }, { status: 504 })
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'No pudimos traducir el producto en este momento. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ error: 'Ocurrió un error inesperado. Intenta de nuevo.' }, { status: 500 })
  }
}
