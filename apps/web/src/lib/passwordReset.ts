// ============================================================
// MercadoRD — Recuperación de contraseña: utilidades de /restablecer-password
// Ruta: src/lib/passwordReset.ts
// ============================================================
// Cosas puras (sin React). Solo deciden qué pantalla mostrar; la
// autorización real la hace siempre el servidor de Supabase.
//
// El correo de recuperación trae el enlace
//   {SiteURL}/restablecer-password?token_hash=...&type=recovery
// (plantilla «Reset Password» de Supabase Auth). La página canjea ese token
// con verifyOtp(), lo que funciona en cualquier navegador o dispositivo
// (a diferencia del enlace por defecto, que usa PKCE y solo sirve en el
// navegador que pidió el correo). Los correos pedidos con la plantilla
// anterior siguen funcionando donde se pidieron.
// ============================================================

// Token del enlace, o null si la URL no es un enlace de recuperación.
// `search` es window.location.search.
export function parseRecoveryLink(search: string): { tokenHash: string } | null {
  const params = new URLSearchParams(search)
  const tokenHash = params.get('token_hash')
  if (!tokenHash || params.get('type') !== 'recovery') return null
  return { tokenHash }
}

// Métodos de acceso (claim amr del JWT) con los que Supabase NO pide la
// contraseña actual al cambiarla; es la misma regla del servidor
// (Session.IsRecovery): 'recovery' (enlace canjeado por PKCE), 'otp'
// (enlace canjeado con verifyOtp) y 'magiclink'. Una sesión normal
// (contraseña, Google…) no cuenta: no debe ver el formulario de restablecer.
const RECOVERY_AMR_METHODS = ['recovery', 'otp', 'magiclink']

// ¿El access token viene de un enlace de recuperación? No verifica la firma.
export function isRecoveryAccessToken(accessToken: string | null | undefined): boolean {
  try {
    const payload = accessToken?.split('.')[1]
    if (!payload) return false
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const amr = (JSON.parse(json) as { amr?: unknown }).amr
    return (
      Array.isArray(amr) &&
      amr.some(entry => RECOVERY_AMR_METHODS.includes((entry as { method?: string } | null)?.method ?? ''))
    )
  } catch {
    return false
  }
}

// updateUser() devuelve code 'same_password' si la nueva contraseña es
// igual a la actual
export function isSamePasswordError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'same_password'
}
