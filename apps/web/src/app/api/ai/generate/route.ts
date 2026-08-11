// ============================================================
// MercadoRD — AI Context Engine: generación de títulos/descripciones
// Ruta: src/app/api/ai/generate/route.ts
// ============================================================
// Server-side únicamente — la API key de Anthropic nunca toca el
// frontend. Requiere sesión autenticada y aplica rate limiting (20
// llamadas/hora por vendor) porque cada llamada cuesta dinero real.
// ============================================================

import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { checkAiRateLimit, AI_RATE_LIMIT_MESSAGE } from '@/lib/ai/rateLimiter'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Eres un asistente de redacción para MercadoRD, un marketplace dominicano. Tu única tarea es ayudar a vendedores a escribir títulos y descripciones profesionales para sus productos, usando EXCLUSIVAMENTE la información que ellos mismos proporcionaron.

REGLAS ESTRICTAS, SIN EXCEPCIÓN:
- Usa ÚNICAMENTE los datos proporcionados en el contexto. Nunca inventes características, materiales, certificaciones, garantías, condición, origen, descuentos, reseñas, stock, ni ninguna especificación técnica que no esté explícitamente en los datos.
- Si un dato relevante no fue proporcionado, simplemente no lo menciones — no asumas, no completes con suposiciones típicas de la categoría.
- Escribe siempre en español.
- Sé profesional y conciso — evita emojis innecesarios, mayúsculas excesivas, y lenguaje de spam.
- Enfoca el texto en ayudar al comprador a decidir, no en exagerar.

Responde ÚNICAMENTE con el texto solicitado, sin explicaciones adicionales ni comillas envolventes.`

type AiAction = 'generate_title' | 'generate_description' | 'improve_description'

const VALID_ACTIONS: AiAction[] = ['generate_title', 'generate_description', 'improve_description']

interface AttributeInput {
  label: string
  value: string
}

interface GenerateRequestBody {
  action: AiAction
  category: string
  productName: string
  attributes: AttributeInput[]
  currentDescription?: string
}

const ACTION_INSTRUCTIONS: Record<AiAction, string> = {
  generate_title: 'Acción solicitada: genera un título de producto profesional y conciso para este producto, usando únicamente los datos anteriores.',
  generate_description: 'Acción solicitada: genera una descripción de producto profesional para este producto, usando únicamente los datos anteriores.',
  improve_description: 'Acción solicitada: mejora la siguiente descripción del producto (redacción, claridad y profesionalismo), usando únicamente los datos anteriores. No inventes información que no esté ya en la descripción actual o en los datos del producto.',
}

function buildUserMessage(body: GenerateRequestBody): string {
  const lines: string[] = [
    `Categoría: ${body.category}`,
    `Nombre actual del producto: ${body.productName}`,
  ]

  for (const attr of body.attributes) {
    lines.push(`${attr.label}: ${attr.value}`)
  }

  if (body.action === 'improve_description') {
    lines.push(`Descripción actual: ${body.currentDescription}`)
  }

  lines.push('')
  lines.push(ACTION_INSTRUCTIONS[body.action])

  return lines.join('\n')
}

function validateBody(body: unknown): { ok: true; value: GenerateRequestBody } | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Cuerpo de la solicitud inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.action !== 'string' || !VALID_ACTIONS.includes(b.action as AiAction)) {
    return { ok: false, error: 'action inválido' }
  }
  if (typeof b.category !== 'string' || !b.category.trim()) {
    return { ok: false, error: 'category requerido' }
  }
  if (typeof b.productName !== 'string' || !b.productName.trim()) {
    return { ok: false, error: 'productName requerido' }
  }
  if (!Array.isArray(b.attributes) || !b.attributes.every(a => a && typeof a === 'object' && typeof (a as AttributeInput).label === 'string' && typeof (a as AttributeInput).value === 'string')) {
    return { ok: false, error: 'attributes inválido' }
  }
  if (b.action === 'improve_description' && (typeof b.currentDescription !== 'string' || !b.currentDescription.trim())) {
    return { ok: false, error: 'currentDescription requerido para improve_description' }
  }

  return {
    ok: true,
    value: {
      action: b.action as AiAction,
      category: b.category,
      productName: b.productName,
      attributes: b.attributes as AttributeInput[],
      currentDescription: typeof b.currentDescription === 'string' ? b.currentDescription : undefined,
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
  // vendor. Solo cuentan los intentos reales de llamada a la API paga.
  const allowed = await checkAiRateLimit(user.id)
  if (!allowed) return NextResponse.json({ error: AI_RATE_LIMIT_MESSAGE }, { status: 429 })

  const body = validation.value
  const maxTokens = body.action === 'generate_title' ? 300 : 600

  try {
    const userMessage = buildUserMessage(body)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const textBlock = message.content.find(block => block.type === 'text')
    const text = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : ''

    if (!text) {
      return NextResponse.json({ error: 'La IA no devolvió texto. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    console.error('[api/ai/generate]', error)

    if (error instanceof Anthropic.APIConnectionTimeoutError) {
      return NextResponse.json({ error: 'La IA tardó demasiado en responder. Intenta de nuevo.' }, { status: 504 })
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: 'No pudimos generar el texto en este momento. Intenta de nuevo.' }, { status: 502 })
    }

    return NextResponse.json({ error: 'Ocurrió un error inesperado. Intenta de nuevo.' }, { status: 500 })
  }
}
