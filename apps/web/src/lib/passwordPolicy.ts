// ============================================================
// MercadoRD — Requisitos de contraseña (fuente única)
// Ruta: src/lib/passwordPolicy.ts
// ============================================================
// Misma regla que el ajuste de Supabase Auth (Authentication → Sign In /
// Providers → Email): longitud mínima + al menos una minúscula, una
// mayúscula y un número. Supabase solo cuenta a-z, A-Z y 0-9 (ñ, á o Á no
// cuentan), por eso las clases son ASCII. El servidor es la autoridad:
// esto solo da feedback inmediato; si el servidor rechaza igual,
// isWeakPasswordError() lo detecta.
// Si cambias PASSWORD_MIN_LENGTH, cambia también el número en los textos
// passwordRequirementsHint, passwordRequirementsError y
// registerPasswordPlaceholder (es/en/fr) y el ajuste de Supabase.
// ============================================================

export const PASSWORD_MIN_LENGTH = 8

export type PasswordIssue = 'length' | 'lowercase' | 'uppercase' | 'digit'

export function getPasswordIssues(password: string): PasswordIssue[] {
  const issues: PasswordIssue[] = []
  if (password.length < PASSWORD_MIN_LENGTH) issues.push('length')
  if (!/[a-z]/.test(password)) issues.push('lowercase')
  if (!/[A-Z]/.test(password)) issues.push('uppercase')
  if (!/[0-9]/.test(password)) issues.push('digit')
  return issues
}

export function isPasswordValid(password: string): boolean {
  return getPasswordIssues(password).length === 0
}

// signUp y updateUser devuelven AuthWeakPasswordError (code 'weak_password')
export function isWeakPasswordError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'weak_password'
}
