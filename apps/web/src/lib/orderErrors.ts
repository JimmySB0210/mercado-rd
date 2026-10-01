// ============================================================
// MercadoRD — Errores conocidos de Supabase → mensaje traducido
// Ruta: src/lib/orderErrors.ts
// ============================================================
// Ni checkout ni ReviewModal deben mostrar error.message crudo al
// usuario final — ese texto sale tal cual de una excepción de
// Postgres, nunca pasa por i18n, y no calza con ES/EN/FR. Esta
// utilidad mapea un error conocido (por ERRCODE cuando existe, o por
// el texto exacto del mensaje para triggers más viejos que no tienen
// código propio) a un identificador neutro — cada pantalla traduce
// ese identificador con su propio namespace de i18n. Cualquier error
// NO reconocido cae al mensaje genérico de siempre, nunca al texto
// crudo del servidor.
// ============================================================

export interface SupabaseErrorLike {
  code?: string | null
  message?: string | null
}

interface KnownError {
  matches: (err: SupabaseErrorLike) => boolean
  key: string
}

// create_order_from_cart (migración 020) — ERRCODE propio, no hace
// falta comparar texto.
const SELF_PURCHASE: KnownError = {
  matches: err => err.code === 'P0101',
  key: 'SELF_PURCHASE',
}

// validate_real_review (migración 013) — trigger más viejo, sin
// ERRCODE propio (usa el P0001 default de RAISE EXCEPTION en
// plpgsql, igual para cualquier excepción de esa función), así que acá
// sí hace falta matchear el texto exacto — son 2 mensajes fijos y
// conocidos, no una expresión abierta.
const REVIEW_NOT_DELIVERED: KnownError = {
  matches: err => !!err.message?.includes('que hayas comprado y recibido realmente'),
  key: 'REVIEW_NOT_DELIVERED',
}

const REVIEW_OWN_PRODUCT: KnownError = {
  matches: err => !!err.message?.includes('No puedes reseñar tu propio producto'),
  key: 'REVIEW_OWN_PRODUCT',
}

export const KNOWN_ORDER_ERRORS = [SELF_PURCHASE]
export const KNOWN_REVIEW_ERRORS = [REVIEW_NOT_DELIVERED, REVIEW_OWN_PRODUCT]

export function resolveKnownError(err: SupabaseErrorLike | null | undefined, known: KnownError[]): string | null {
  if (!err) return null
  for (const k of known) {
    if (k.matches(err)) return k.key
  }
  return null
}
