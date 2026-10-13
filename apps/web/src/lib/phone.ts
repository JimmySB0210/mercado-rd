// ============================================================
// MercadoRD — Teléfonos dominicanos (fuente única)
// Ruta: src/lib/phone.ts
// ============================================================
// Misma regla que la base de datos (trigger + CHECK en users.phone,
// vendors.whatsapp y orders.recipient_phone): se guarda siempre el
// formato canónico 1809XXXXXXX (11 dígitos, solo RD: 809/829/849 y la
// central empieza en 2-9) o NULL.
// ============================================================

const CANONICAL_PHONE = /^1(809|829|849)[2-9]\d{6}$/

// Cualquier formato de entrada → canónico, o null si no es un número
// dominicano válido.
export function normalizePhone(input: string | null | undefined): string | null {
  const digits = (input ?? '').replace(/\D/g, '')
  const withCountry = digits.length === 10 ? `1${digits}` : digits
  return CANONICAL_PHONE.test(withCountry) ? withCountry : null
}

// Canónico → 809-555-1234. Si no es válido devuelve el texto tal cual;
// si viene vacío, ''.
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const canonical = normalizePhone(phone)
  if (!canonical) return phone
  return `${canonical.slice(1, 4)}-${canonical.slice(4, 7)}-${canonical.slice(7)}`
}

// Link de WhatsApp, o null si el número no es válido (nunca un link roto).
export function whatsappLink(phone: string | null | undefined, text?: string): string | null {
  const canonical = normalizePhone(phone)
  if (!canonical) return null
  return `https://wa.me/${canonical}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}

// Atributos comunes de todos los campos de teléfono / WhatsApp.
export const PHONE_INPUT_PROPS = {
  type: 'tel',
  inputMode: 'tel',
  autoComplete: 'tel-national',
  maxLength: 20,
} as const

export const PHONE_PLACEHOLDER = '809-555-1234'
