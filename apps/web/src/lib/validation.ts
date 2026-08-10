// ============================================================
// MercadoRD — Validación de inputs (defensa en el cliente)
// Archivo: lib/validation.ts
// ============================================================
// Esto valida ANTES de llamar a un RPC o insertar en la BD para dar
// feedback inmediato al usuario. No reemplaza la validación del lado
// del servidor (RLS, constraints, funciones SECURITY DEFINER) — es
// una capa adicional, no la única.
// ============================================================

export const DANGEROUS_PATTERN = /<|>|script|--|;/i

export function validateText(value: string, field: string, min: number, max: number): string | null {
  if (typeof value !== 'string') return `${field} debe ser texto`

  const trimmed = value.trim()
  if (trimmed.length < min || trimmed.length > max) {
    return min === 0
      ? `${field} no puede superar ${max} caracteres`
      : `${field} debe tener entre ${min} y ${max} caracteres`
  }
  if (DANGEROUS_PATTERN.test(trimmed)) {
    return `${field} contiene caracteres no permitidos`
  }
  return null
}

// Acepta 10 dígitos (809/829/849 + 7 dígitos) o 11 con el código de
// país "1" delante (formato que usa el link de WhatsApp wa.me).
export function validatePhone(phone: string): string | null {
  if (typeof phone !== 'string') return 'El teléfono debe ser texto'

  const digits = phone.replace(/\D/g, '')
  const validPattern = /^1?(809|829|849)\d{7}$/

  if (!validPattern.test(digits)) {
    return 'El teléfono debe ser un número dominicano válido (809, 829 u 849)'
  }
  return null
}

// price en centavos — máximo RD$999,999.99 (99999999 centavos)
export function validatePrice(price: number): string | null {
  if (typeof price !== 'number' || !Number.isInteger(price)) {
    return 'El precio debe ser un número entero'
  }
  if (price <= 0) return 'El precio debe ser mayor a 0'
  if (price > 99999999) return 'El precio no puede superar RD$999,999.99'
  return null
}

export function validateProvince(id: number): string | null {
  if (typeof id !== 'number' || !Number.isInteger(id)) return 'Provincia inválida'
  if (id < 1 || id > 32) return 'Provincia inválida'
  return null
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  if (typeof email !== 'string') return 'Email inválido'
  if (!EMAIL_PATTERN.test(email.trim())) return 'Email inválido'
  return null
}
