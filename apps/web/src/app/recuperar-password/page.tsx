'use client'
// ============================================================
// MercadoRD — Solicitar recuperación de contraseña
// Archivo: app/recuperar-password/page.tsx
// ============================================================
// Pide el email y llama a resetPasswordForEmail(). Supabase envía un
// correo con un enlace a /restablecer-password; esa página canjea el token
// del enlace (ver app/restablecer-password/page.tsx y lib/passwordReset.ts).
//
// Tras enviar, ofrece «Reenviar correo» con 60 s de espera (la misma que
// aplica Supabase por usuario), vía lib/hooks/useResendEmail.ts. La hora
// del último envío se guarda en sessionStorage para que, si la persona sale
// y vuelve, siga viendo «ya enviamos…» y la espera en vez de pedir otro
// correo sin querer: solo el último enlace pedido es válido.
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { useResendEmail } from '@/lib/hooks/useResendEmail'
import { isEmailRateLimitError } from '@/lib/emailResend'
import ResendEmailButton from '@/components/auth/ResendEmailButton'
import { BRAND } from '@/lib/colors'

export default function RecuperarPasswordPage() {
  const supabase = createClient()
  const { t } = useTranslation('auth')

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const requestLink = (address: string) =>
    supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/restablecer-password`,
    })

  const resend = useResendEmail('recovery', requestLink)
  // Correo al que se envió el último enlace; si no es null, se muestra la
  // pantalla «revisa tu correo» (también al volver a la pestaña).
  const sentTo = resend.pending?.email ?? null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await requestLink(email)

    setLoading(false)

    if (error) {
      setError(isEmailRateLimitError(error) ? t('emailRateLimited') : t('resetLinkError'))
      return
    }

    resend.markSent(email)
  }

  // Volver al formulario con el correo escrito, por si fue un error al teclearlo
  const handleUseAnotherEmail = () => {
    if (sentTo) setEmail(sentTo)
    setError(null)
    resend.reset()
  }

  if (sentTo) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
        style={{ '--brand-blue': BRAND.blue, '--brand-red': BRAND.red } as React.CSSProperties}
      >
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-form-section font-bold text-gray-900 mb-2">{t('resetLinkSentTitle')}</h2>
            <p className="text-gray-500 text-small mb-4">
              {t('resetLinkSentPrefix')} <strong>{sentTo}</strong>{t('resetLinkSentSuffix')}
            </p>
            <p className="text-gray-500 text-small mb-2">{t('emailNotArrivingTip')}</p>
            <p className="text-gray-500 text-small mb-4">{t('resetLinkLatestNote')}</p>
            <p className="text-gray-400 text-xs mb-6">
              {t('googleUsersNote')}
            </p>
            <ResendEmailButton
              secondsLeft={resend.secondsLeft}
              sending={resend.sending}
              notice={resend.notice}
              onResend={() => resend.resend()}
            />
            <button
              type="button"
              onClick={handleUseAnotherEmail}
              className="mt-4 mb-6 text-small text-[var(--brand-blue)] font-semibold hover:underline"
            >
              {t('useAnotherEmailLink')}
            </button>
            <Link
              href="/login"
              className="block w-full bg-[var(--brand-red)] text-white text-ui font-semibold py-3 rounded-lg text-center hover:brightness-90 transition-colors"
            >
              {t('goToLoginLink')}
            </Link>
          </div>
        </div>
      </main>
    )
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
          <p className="mt-2 text-gray-500 text-small">{t('forgotPasswordSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-small text-gray-500 mb-6">{t('forgotPasswordInstructions')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-form-label font-semibold text-gray-700 mb-1">
                {t('emailLabel')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
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
              disabled={loading}
              className="w-full bg-[var(--brand-red)] hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-ui font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? t('sendingResetLink') : t('sendResetLinkButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-small text-gray-500">
            <Link href="/login" className="text-[var(--brand-blue)] font-semibold hover:underline">
              {t('goToLoginLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
