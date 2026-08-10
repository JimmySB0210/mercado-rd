'use client'
// ============================================================
// MercadoRD — Restablecer contraseña (desde el link del correo)
// Archivo: app/restablecer-password/page.tsx
// ============================================================
// Supabase detecta el token de recuperación en la URL automáticamente
// (PKCE, vía createBrowserClient) y crea una sesión de recuperación —
// no hace falta leer el código manualmente. Si el link ya expiró o no
// hay sesión, updateUser() falla y se lo mostramos igual que cualquier
// otro error de este flujo, sin una pantalla especial aparte.
// ============================================================

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

export default function RestablecerPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useTranslation('auth')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(t('passwordTooShort'))
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
      setError(
        /session/i.test(error.message)
          ? t('invalidOrExpiredLinkMessage')
          : t('passwordResetFailed')
      )
      setSaving(false)
      return
    }

    await supabase.auth.signOut()
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
              <span className="text-white bg-[var(--brand-blue)] px-2 py-1 rounded">Mercado</span>
              <span className="text-[var(--brand-red)]">R</span>
              <span className="text-[var(--brand-blue)]">D</span>
            </span>
          </Link>
          <p className="mt-2 text-gray-500 text-sm">{t('resetPasswordSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('passwordLabel')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('registerPasswordPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[var(--brand-red)] hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors"
            >
              {saving ? t('resettingPassword') : t('resetPasswordButton')}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
