'use client'
// ============================================================
// MercadoRD — Solicitar recuperación de contraseña
// Archivo: app/recuperar-password/page.tsx
// ============================================================
// Pide el email y llama a resetPasswordForEmail(). Supabase envía un
// correo con un link a /restablecer-password?code=... — esa página
// detecta la sesión de recuperación automáticamente (PKCE).
// ============================================================

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

export default function RecuperarPasswordPage() {
  const supabase = createClient()
  const { t } = useTranslation('auth')

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-password`,
    })

    setLoading(false)

    if (error) {
      setError(t('resetLinkError'))
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
        style={{ '--brand-blue': BRAND.blue, '--brand-red': BRAND.red } as React.CSSProperties}
      >
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('resetLinkSentTitle')}</h2>
            <p className="text-gray-500 text-sm mb-4">
              {t('resetLinkSentPrefix')} <strong>{email}</strong> {t('resetLinkSentSuffix')}
            </p>
            <p className="text-gray-400 text-xs mb-6">
              {t('googleUsersNote')}
            </p>
            <Link
              href="/login"
              className="block w-full bg-[var(--brand-red)] text-white font-medium py-3 rounded-lg text-center hover:brightness-90 transition-colors"
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
              <span className="text-white bg-[var(--brand-blue)] px-2 py-1 rounded">Mercado</span>
              <span className="text-[var(--brand-red)]">R</span>
              <span className="text-[var(--brand-blue)]">D</span>
            </span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">{t('forgotPasswordSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <p className="text-sm text-gray-500 mb-6">{t('forgotPasswordInstructions')}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--brand-red)] hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {loading ? t('sendingResetLink') : t('sendResetLinkButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            <Link href="/login" className="text-[var(--brand-blue)] font-medium hover:underline">
              {t('goToLoginLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
