'use client'
// ============================================================
// MercadoRD — Página de Registro
// Archivo: app/register/page.tsx
// ============================================================

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { useTranslation } from '@/lib/hooks/useTranslation'
import { BRAND } from '@/lib/colors'

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const { signUpWithEmail, signInWithGoogle } = useAuth()
  const { t } = useTranslation('auth')
  const [oauthLoading, setOauthLoading] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [captchaToken, setCaptchaToken] = useState('')

  // Callbacks globales que el widget de Turnstile invoca por nombre
  // (data-callback / data-expired-callback) cuando se renderiza vía script.
  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    ;(window as any).onTurnstileVerify = (token: string) => setCaptchaToken(token)
    ;(window as any).onTurnstileExpired = () => setCaptchaToken('')
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setOauthLoading(true)
    try {
      await signInWithGoogle()
    } catch {
      setError(t('googleSignInErrorRegister'))
      setOauthLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (form.password !== form.confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    if (form.password.length < 6) {
      setError(t('passwordTooShort'))
      return
    }

    if (!acceptedTerms) {
      setError(t('mustAcceptTerms'))
      return
    }

    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setError(t('completeCaptcha'))
      return
    }

    setLoading(true)

    if (TURNSTILE_SITE_KEY) {
      const captchaRes = await fetch('/api/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: captchaToken }),
      })
      const captchaData = await captchaRes.json().catch(() => ({ success: false }))

      if (!captchaData.success) {
        setError(t('captchaFailed'))
        setLoading(false)
        return
      }
    }

    const { error } = await signUpWithEmail(
      form.email,
      form.password,
      form.fullName,
      form.phone || undefined
    )

    if (error) {
      setError(
        error.message.includes('already registered')
          ? t('emailAlreadyRegistered')
          : error.message
      )
      setLoading(false)
      return
    }

    // El trigger en Supabase crea automáticamente public.users
    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main
        className="min-h-screen flex items-center justify-center bg-gray-50 px-4"
        style={{ '--brand-blue': BRAND.blue, '--brand-red': BRAND.red } as React.CSSProperties}
      >
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accountCreatedTitle')}</h2>
            <p className="text-gray-500 text-sm mb-6">
              {t('checkEmailPrefix')} <strong>{form.email}</strong> {t('checkEmailSuffix')}
            </p>
            <Link
              href={redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
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
          <p className="mt-2 text-gray-500 text-sm">{t('subtitleRegister')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Login social */}
          {/* Facebook deshabilitado temporalmente — pendiente verificación empresarial con Meta */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-2.5 bg-white border border-gray-300 text-gray-800 font-medium py-2.5 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {oauthLoading ? t('connecting') : t('continueWithGoogle')}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <hr className="flex-1 border-gray-200" />
            <span className="text-xs text-gray-400 whitespace-nowrap">{t('orContinueWith')}</span>
            <hr className="flex-1 border-gray-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('fullNameLabel')}
              </label>
              <input
                name="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={handleChange}
                placeholder={t('fullNamePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('emailLabel')}
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder={t('emailPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('phoneLabel')} <span className="text-gray-400">{t('phoneOptional')}</span>
              </label>
              <input
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder={t('phonePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('passwordLabel')}
              </label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder={t('registerPasswordPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('confirmPasswordLabel')}
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder={t('confirmPasswordPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                {t('acceptTermsPrefix')}{' '}
                <Link href="/terminos" target="_blank" className="text-[var(--brand-blue)] hover:underline">
                  {t('termsOfServiceLink')}
                </Link>
                {' '}{t('andConnector')}{' '}
                <Link href="/privacidad" target="_blank" className="text-[var(--brand-blue)] hover:underline">
                  {t('privacyPolicyLink')}
                </Link>
              </span>
            </label>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            {TURNSTILE_SITE_KEY && (
              <>
                <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
                <div
                  className="cf-turnstile"
                  data-sitekey={TURNSTILE_SITE_KEY}
                  data-callback="onTurnstileVerify"
                  data-expired-callback="onTurnstileExpired"
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading || (!!TURNSTILE_SITE_KEY && !captchaToken)}
              className="w-full bg-[var(--brand-red)] hover:brightness-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors mt-2"
            >
              {loading ? t('creatingAccount') : t('createAccountButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-[var(--brand-blue)] font-medium hover:underline">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
