// ============================================================
// MercadoRD — Reenviar correos de autenticación: utilidades compartidas
// Ruta: src/lib/emailResend.ts
// ============================================================
// Cosas puras (sin React) para el botón «Reenviar correo» de la
// recuperación de contraseña y de la confirmación de registro.
//
// Supabase deja pedir un correo por usuario cada 60 s y, de cada tipo,
// solo el ÚLTIMO enlace pedido sigue siendo válido. Guardamos en
// sessionStorage cuándo se pidió el último para que el botón respete la
// espera aunque la persona salga de la pantalla y vuelva (sin pedir otro
// por accidente y gastar el enlace anterior). sessionStorage vive solo en
// esa pestaña y se borra al cerrarla; nada de esto sale del navegador.
// ============================================================

export const EMAIL_RESEND_COOLDOWN_SECONDS = 60
export const EMAIL_PENDING_MAX_AGE_MS = 10 * 60 * 1000

export type PendingEmailKind = 'recovery' | 'signup'

const PENDING_KEY_PREFIX = 'mercadord:email-sent:'

export interface PendingEmail {
  email: string
  sentAt: number
}

// Último correo pedido de ese tipo en esta pestaña (null si no hay o ya
// pasaron EMAIL_PENDING_MAX_AGE_MS). sessionStorage puede fallar (modo
// privado, bloqueado): todo va en try/catch y las pantallas funcionan sin él.
export function readPendingEmail(kind: PendingEmailKind, now: number = Date.now()): PendingEmail | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_KEY_PREFIX + kind)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    if (typeof data !== 'object' || data === null) return null
    const { email, sentAt } = data as { email?: unknown; sentAt?: unknown }
    if (typeof email !== 'string' || email === '' || typeof sentAt !== 'number') return null
    if (now - sentAt > EMAIL_PENDING_MAX_AGE_MS || sentAt > now) return null
    return { email, sentAt }
  } catch {
    return null
  }
}

export function savePendingEmail(kind: PendingEmailKind, email: string, sentAt: number = Date.now()): void {
  try {
    window.sessionStorage.setItem(PENDING_KEY_PREFIX + kind, JSON.stringify({ email, sentAt }))
  } catch {
    // sin sessionStorage la espera dura solo mientras la pantalla siga abierta
  }
}

export function clearPendingEmail(kind: PendingEmailKind): void {
  try {
    window.sessionStorage.removeItem(PENDING_KEY_PREFIX + kind)
  } catch {
    // nada que limpiar
  }
}

// Segundos que faltan para poder reenviar (0 = ya se puede).
export function resendCooldownLeft(sentAt: number, now: number = Date.now()): number {
  const elapsed = Math.floor((now - sentAt) / 1000)
  return Math.min(EMAIL_RESEND_COOLDOWN_SECONDS, Math.max(0, EMAIL_RESEND_COOLDOWN_SECONDS - elapsed))
}

// 42 → '0:42', 60 → '1:00'
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// 429 de Supabase al pedir muchos correos (espera de 60 s por usuario o
// tope de correos por hora del proyecto).
export function isEmailRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const { status, code } = error as { status?: unknown; code?: unknown }
  return status === 429 || code === 'over_email_send_rate_limit'
}
