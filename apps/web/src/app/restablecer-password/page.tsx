'use client'
// ============================================================
// MercadoRD — Restablecer contraseña (desde el link del correo)
// Archivo: app/restablecer-password/page.tsx
// ============================================================
// El correo de recuperación trae
//   /restablecer-password?token_hash=...&type=recovery
// (plantilla «Reset Password» de Supabase Auth). Aquí se canjea ese token con
// verifyOtp(), lo que crea la sesión de recuperación y funciona en cualquier
// navegador o dispositivo, no solo donde se pidió el correo. Cada enlace
// sirve una sola vez y solo el último pedido es válido.
//
// Compatibilidad: los correos pedidos con la plantilla anterior traen un
// enlace PKCE (?code=...) que createBrowserClient canjea solo, y solo en el
// mismo navegador que pidió el correo. getSession() espera a que termine ese
// canje, así que sirve para ambos casos.
//
// Antes de mostrar el formulario se comprueba que haya una sesión de
// recuperación. Si no la hay —el enlace venció, ya se usó o lo reemplazó uno
// más nuevo— se muestra una pantalla que lo explica y deja pedir otro, en
// vez de dejar escribir la contraseña para fallar al final.
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'
import { isPasswordValid, isWeakPasswordError } from '@/lib/passwordPolicy'
import { clearPendingEmail } from '@/lib/emailResend'
import { isRecoveryAccessToken, isSamePasswordError, parseRecoveryLink } from '@/lib/passwordReset'

export default function RestablecerPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('auth')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [linkStatus, setLinkStatus] = useState<'checking' | 'ready' | 'invalid'>('checking')
  // El token del enlace es de un solo uso: la comprobación corre una sola vez
  // aunque React monte el efecto dos veces (modo estricto en desarrollo).
  const checkStarted = useRef(false)

  useEffect(() => {
    if (checkStarted.current) return
    checkStarted.current = true

    const hasRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      return isRecoveryAccessToken(session?.access_token)
    }

    const checkLink = async () => {
      const link = parseRecoveryLink(window.location.search)
      if (!link) {
        setLinkStatus((await hasRecoverySession()) ? 'ready' : 'invalid')
        return
      }

      const { data, error } = await supabase.auth.verifyOtp({ token_hash: link.tokenHash, type: 'recovery' })
      // El token ya se usó (o falló): fuera de la barra de direcciones
      window.history.replaceState(window.history.state, '', window.location.pathname)

      if (!error && data.session) {
        setLinkStatus('ready')
        return
      }
      // Enlace ya usado, pero quizá esta misma persona ya tiene la sesión de
      // recuperación (p. ej. abrió el enlace dos veces en este navegador)
      setLinkStatus((await hasRecoverySession()) ? 'ready' : 'invalid')
    }

    void checkLink()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid(password)) {
      setError(t('passwordRequirementsError'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      console.error('[RestablecerPasswordPage]', error)
      if (isWeakPasswordError(error)) {
        setError(t('passwordRequirementsError'))
      } else if (isSamePasswordError(error)) {
        setError(t('passwordSameAsOld'))
      } else if (/session/i.test(error.message)) {
        // La sesión de recuperación se perdió mientras escribía
        setLinkStatus('invalid')
      } else {
        setError(t('passwordResetFailed'))
      }
      setSaving(false)
      return
    }

    await supabase.auth.signOut()
    clearPendingEmail('recovery')
    setSaving(false)
    router.push('/login?reset=success')
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
      style={{ '--brand-blue': BRAND.blue, '--brand-red': BRAND.red } as React.CSSProperties}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-3xl font-bold">
              {/* var(--color-blue-dark) — azul dedicado del logo (paleta oficial), no
                  var(--brand-blue) (sigue usándose en esta página para
                  otros elementos) */}
              <span className="text-white bg-[var(--color-blue-dark)] px-2 py-1 rounded">Mercado</span>
              <span className="text-[var(--brand-red)]">R</span>
              <span className="text-[var(--color-blue-dark)]">D</span>
            </span>
          </Link>
          {linkStatus !== 'invalid' && (
            <p className="mt-2 text-gray-500 text-small">{t('resetPasswordSubtitle')}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {linkStatus === 'checking' && (
            <p role="status" className="text-center text-small text-gray-500">{t('resetLinkChecking')}</p>
          )}

          {linkStatus === 'invalid' && (
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-form-section font-bold text-gray-900 mb-2">{t('resetLinkInvalidTitle')}</h2>
              <p className="text-gray-500 text-small mb-2">{t('resetLinkInvalidBody')}</p>
              <p className="text-gray-500 text-small mb-6">{t('resetLinkInvalidHelp')}</p>
              <Link
                href="/recuperar-password"
                className="block w-full bg-[var(--brand-red)] text-white text-ui font-semibold py-3 rounded-lg text-center hover:brightness-90 transition-colors"
              >
                {t('requestNewLinkButton')}
              </Link>
              <Link href="/login" className="mt-4 inline-block text-small text-[var(--brand-blue)] font-semibold hover:underline">
                {t('goToLoginLink')}
              </Link>
            </div>
          )}

          {linkStatus === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-form-label font-semibold text-gray-700 mb-1">
                  {t('passwordLabel')}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('registerPasswordPlaceholder')}
                  aria-describedby="restablecer-contrasena-ayuda"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                />
                <p id="restablecer-contrasena-ayuda" className="mt-1 text-caption text-gray-500">{t('passwordRequirementsHint')}</p>
              </div>

              <div>
                <label className="block text-form-label font-semibold text-gray-700 mb-1">
                  {t('confirmPasswordLabel')}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmPasswordPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-small font-medium rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-[var(--brand-red)] hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-ui font-semibold py-3 rounded-lg transition-colors"
              >
                {saving ? t('resettingPassword') : t('resetPasswordButton')}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
